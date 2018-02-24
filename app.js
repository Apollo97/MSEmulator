
const cluster = require('cluster');
const http = require('http');

const path = require('path');
const url = require('url');
const fs = require('fs');
const util = require('util');
const { Transform } = require('stream');

const { StringDecoder } = require('string_decoder');
const AsciiStringDecoder = new StringDecoder("ascii");

const edge = require('edge');
const IniParser = require('ini-parser');

const CS_PROGRAM_REFERENCES = [path.join(__dirname, "bin", "libwz.net.dll"), "mscorlib.dll", "System.Drawing.dll", "System.Windows.Forms.dll", "System.Configuration.dll", "System.Data.dll", "System.Web.Extensions.dll"];

const process_argv = argv_parse(process.argv);
const port = process_argv["--port"] || process_argv["-p"] || 80;

let dataSource = null, dataTag = null;


main(process_argv["--init"]);

function main(firstInit) {
	let app;

	if (firstInit) {
		console.log("產生道具清單...");

		let equipListTasks = [];
		let settingList = getSettingList("./");

		for (let i = 0; i < settingList.length; ++i) {
			equipListTasks[i] = function () {
				return EquipList(settingList[i]);
			}
		}

		sequenceTasks(equipListTasks).then(function () {
			console.log("產生道具清單...完成");
		});
	}
	app = WebServer(app);

	app = DataServer(app);

	startServer(app, port);

	{
		const repl = require('repl');

		let repl_context = repl.start({ prompt: '> ' }).context;

		Object.defineProperties(repl_context, {
			dataSource: {
				get: function () {
					return dataSource;
				},
				set: function (value) {
					dataSource = value;
				}
			},
			dataTag: {
				get: function () {
					return dataTag;
				},
				set: function (value) {
					dataTag = value;
				}
			}
		});
	}
}

/**
 * @param {string[]} argv
 * @return {{[x:string]:string}}
 */
function argv_parse(argv) {
	let a = argv.slice(2);
	let paramMap = {};

	a.forEach((name, idx, arr) => {
		if (name.startsWith("-")) {
			let val = arr[idx + 1];
			paramMap[name] = val.startsWith("-") ? true : val;
		}
	});

	return paramMap;
}

/**
 * source: https://github.com/azu/promises-book/blob/master/Ch4_AdvancedPromises/lib/promise-sequence.js
 * @param {any} tasks
 */
function sequenceTasks(tasks) {
	function recordValue(results, value) {
		results.push(value);
		return results;
	}
	var pushValue = recordValue.bind(null, []);
	return tasks.reduce(function (promise, task) {
		return promise.then(task).then(pushValue);
	}, Promise.resolve());
}

/**
 * @param {string} folderPath
 * @param {function(Error,string[]):void} cbfunc
 * @returns {string[]}
 */
function getSettingList(folderPath, cbfunc) {
	if (cbfunc) {
		fs.readdir(folderPath, function (err, files) {
			if (err) {
				cbfunc(err);
			}

			cbfunc(null, findSetting(files));
		});
	}
	else {
		files = fs.readdirSync(folderPath);
		return findSetting(files);
	}

	function findSetting(files) {
		let settingList = files.map(function (fileName) {
			let m = fileName.match(/(setting\d*\.ini)$/);
			return m ? m[1] : null;
		}).filter(function (fileName) {
			return fileName != null;
		});
		return settingList;
	}
}

function EquipList(iniFilePath) {
	var sourceFile = [
		"#define EDGE_EQUIPLIST",
		fs.readFileSync(path.join(__dirname, "wz.cs")),
		fs.readFileSync(path.join(__dirname, "Tools", "EquipList", "Program.cs")),
	].join("\n");
	
	var method = edge.func({
		source: sourceFile,
		references: CS_PROGRAM_REFERENCES,
	});

	return new Promise(function (resolve, reject) {
		method({
			setting: path.join(__dirname, iniFilePath),
			extractTo: path.join(__dirname, "public", "equips"),
		}, function (error) {
			if (error) reject(error);
			resolve();
		});
	});
}

function startServer(app) {
	app.listen(port, function () {
		console.log('Express app listening on port ' + port + '!');
	});
}

function WebServer(app) {
	let StreamZip = require('node-stream-zip');
	let MIME = require('mime');
	let express = require('express');
	if (!app) {
		app = express();
	}
	
	const webpack = require('webpack');
	const webpackDevMiddleware = require('webpack-dev-middleware');
	const webpackHotMiddleware = require('webpack-hot-middleware');
	const webpackConfig = require('./webpack.config');
		
	const compiler = webpack(webpackConfig);
	app.use(webpackDevMiddleware(compiler, { noInfo: true, publicPath: webpackConfig.output.publicPath }));
	app.use(webpackHotMiddleware(compiler));
	
	app.use(function (req, res, next) {
		if (req.path.endsWith(".json") || req.path.startsWith("/data/") || req.path.startsWith("/pack/")) {
			res.header("Content-Type", "application/json; charset=utf-8");
		}
		next();
	});
	app.use(function (req, res, next) {
		if (req.path.startsWith("/images/") && path.extname(req.path) == "") {
			res.header("Content-Type", "image/png");
		}
		next();
	});

	app.use("/", express.static(path.join(__dirname, 'public')));
	
	app.get(/.*\.zip\/.*/, get_unzip_handler("", path.join(__dirname, "public")));

	app.get(/\/images\/.*\.img\/.*/, function (req, res, next) {
		let url = decodeURI(req.path);
		let names = url.match(/\/(images\/.*)\.img\/.*/);
		if (names.length == 2) {
			let imgZipPath = path.join(__dirname, "public", names[1] + ".zip");
			if (fs.existsSync(imgZipPath)) {
				let zip = null;

				zip = new StreamZip({
					file: imgZipPath,
					//storeEntries: true
				});
				zip.on('error', function (err) {
					console.log("zip.error: " + err);
					zip.close();
					zip = null;
					next();
				});
				zip.on("ready", function () {
					let data_path = url.slice(8);
					res.end(zip.entryDataSync(data_path));
					zip.close();
					zip = null;
				});
			}
			else {
				next();
			}
		}
		else {
			next();
		}
	});

	function get_unzip_handler(url, filepath) {
		return function unzip_handler(req, res, next) {
			let names = decodeURI(req.path).match(url + "(.*\.zip)\/(.*)");
			if (names.length == 3) {
				let zip = null;

				zip = new StreamZip({
					file: path.join(filepath, names[1]),
					//storeEntries: true
				});
				zip.on('error', function (err) {
					console.log("zip.error: " + err);
					zip.close();
					zip = null;
					next();
				});
				zip.on("ready", function () {
					res.end(zip.entryDataSync(names[2]));
					zip.close();
					zip = null;
				});
			}
			else {
				next();
			}
		}
	}

	return app;
}

function DataServer(app) {
	let express = require('express');
	if (!app) {
		app = express();
	}

	class DataProvider {
		/**
		 * @param {string} iniFilePath
		 */
		constructor(iniFilePath) {
			let _get = edge.func({
				source: path.join(__dirname, "wz.cs"),
				references: CS_PROGRAM_REFERENCES,
			});
			this._get = function () {
				try {
					return _get.apply(this, arguments);
				}
				catch (ex) {
					console.log("err get: " + JSON.stringify(arguments) + "\n" + (new Buffer(ex.stack)).toString());
				}
			};

			let initResult = this._get({
				func: "load",
				args: {
					path: iniFilePath,
				}
			});

			this.version = this._get({
				func: "version"
			}, true);

			this.iniFilePath = iniFilePath;
			this.setting = IniParser.parse(fs.readFileSync(path.join(__dirname, this.iniFilePath), "utf-8")).resource;

			this.updateLastModifiedTime();
		}
		/**
		 * @param {string} method
		 * @param {string} path
		 * @param {boolean} output_canvas
		 * @param {boolean} reload
		 * @param {string=} func
		 */
		getAsync(method, path, output_canvas) {
			const that = this;
			return new Promise(function (resolve, reject) {
				that._get({
					func: method,
					args: {
						path: path,
						output_canvas: !!output_canvas
					}
				}, function (error, result) {
					if (error) {
						console.error("error: " + error);
						reject(error);
					}
					else {
						resolve(result);
					}
				});
			});
		}
		make_zorders() {
			let zorders = this._get({
				func: "make_zorders"
			}, true);
			return zorders;
		}

		updateLastModifiedTime() {
			let mtime = fs.statSync(this.setting.path).mtime;
			this.mtime_utcs = mtime.toUTCString();
		}
		
		isNeedResponse(req, res, next) {
			if (!this.checkDataSource(req, res, next)) {//if false
				return false;
			}
			let reqModDate = req.headers["if-modified-since"];
			if (reqModDate != null) {
				if (this.mtime_utcs == reqModDate) {
					res.writeHead(304, {
						"Last-Modified": this.mtime_utcs
					});
					res.end();
					return false;
				}
			}
			return true;
		}

		checkDataSource(req, res, next) {
			if (req.query.tags) {
				let tags = req.query.tags.split(",");
				if (tags.indexOf(this.setting.tag) >= 0) {
					return true;
				}
				else {
					return this._noRes(req, res, next);
				}
			}
			else if (dataSource) {
				if ((dataSource == this.iniFilePath) || (dataSource instanceof Array && dataSource.indexOfs(this.iniFilePath) >= 0)) {
					return true;
				}
				else {
					return this._noRes(req, res, next);
				}
			}
			else if (dataTag) {
				if ((dataTag == this.setting.tag) || (dataTag instanceof Array && dataTag.indexOf(this.setting.tag) >= 0)) {
					return true;
				}
				else {
					return this._noRes(req, res, next);
				}
			}
			else {
				return true;
			}
		}

		_noRes(req, res, next) {
			next();
			return false;
		}
	}

	/**
	 * @param {DataProvider} _data_provider
	 */
	function Server(a_pp, _data_provider) {
		/** @param {string} mime */
		function makeHead(mime, _dp) {
			return {
				"Content-Type": mime,
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=86400",
				"Cache-Control": "no-cache",
				"Last-Modified": _data_provider.mtime_utcs,
				"data-tag": _dp.setting.tag,
				"data-version": _dp.version,
			}
		}
		/** @param {string} mime */
		function makeHeadNoCache(mime, _dp) {
			return {
				"Content-Type": mime,
				"Access-Control-Allow-Origin": "*",
				"data-tag": _dp.setting.tag,
				"data-version": _dp.version,
			}
		}

		/** @param {string} text */
		function write_res(res, status, text) {
			res.writeHead(status);
			res.end(text);
		}

		/** @param {string} reason */
		function write_reason(res, reason) {
			res.writeHead(500, {
				"Content-Type": "application/json; charset=utf-8",
				"Access-Control-Allow-Origin": "*",
				"Cache-Control": "public, max-age=0",
			});
			res.end("Internal Server Error:\n" + inspect_locale(reason));
		}

		a_pp.get(/\/echo\/.*/, function (req, res, next) {
			let url = decodeURI(req.path.slice(6));
			res.end(url);
		});

		a_pp.get(/\/echo-\/.*/, function (req, res, next) {
			let url = decodeURI(req.path.slice(7));
			res.end(`<script>${url}</script>`);
		});

		a_pp.get('/version', function (req, res, next) {
			let js = [
				`window.DATA_VERSION=${_data_provider.version};`,
			].join("\n");

			res.writeHead(200, makeHead("application/x-javascript; charset=utf-8", _data_provider));

			res.end(js);
		});

		a_pp.get('/make_zorders', function (req, res, next) {
			if (_data_provider.isNeedResponse(req, res, next)) {
				let data = _data_provider.make_zorders(path, true);
				res.writeHead(200, makeHead("application/json; charset=utf-8", _data_provider));
				res.end(JSON.stringify(data, null, "\t"));
			}
		});

		/**
		 * @param {Promise<{mime:string,data:Buffer}>} loadFileTask
		 * @param {any} req
		 * @param {any} res
		 * @param {any} next
		 */
		function sendFile(loadFileTask, req, res, next) {
			loadFileTask.then(function (results) {
				if (results) {
					res.writeHead(200, makeHead(results.mime, _data_provider));
					res.end(results.data);
				}
				else {
					return next();
					//res.end("null");
					//write_res(res, 404);
				}
			}, function (reason) {
				write_reason(res, reason);
			});
		}

		/**
		 * @param {Promise<{mime:string,data:Buffer}>} loadFileTask
		 * @param {any} req
		 * @param {any} res
		 * @param {any} next
		 */
		function sendJSON(loadFileTask, req, res, next) {
			loadFileTask.then(function (results) {
				if (results) {
					res.writeHead(200, makeHead(results.mime, _data_provider));
					res.end(JSON.stringify(results.data, null, "\t"));
				}
				else {
					return next();
					//res.end("null");
					//write_res(res, 404);
				}
			}, function (reason) {
				write_reason(res, reason);
			});
		}

		a_pp.get(/\/images\/.*/, function (req, res, next) {//png
			if (_data_provider.isNeedResponse(req, res, next)) {
				let url = decodeURI(req.path);

				let data_path = url.slice(8);
				let task = _data_provider.getAsync("images", data_path);

				sendFile(task, req, res, next);
			}
		});
		a_pp.get(/\/_images\/.*/, function (req, res, next) {//gif
			if (_data_provider.isNeedResponse(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(9);
				let task = _data_provider.getAsync("_images", data_path);

				sendFile(task, req, res, next);
			}
		});
		a_pp.get(/\/sound\/.*/, function (req, res, next) {//wav/mp3
			if (_data_provider.isNeedResponse(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(7);
				let task = _data_provider.getAsync("sound", data_path);

				sendFile(task, req, res, next);
			}
		});
		a_pp.get(/\/binary\/.*/, function (req, res, next) {//wav/mp3
			if (_data_provider.isNeedResponse(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(8);
				let task = _data_provider.getAsync("binary", data_path);

				sendFile(task, req, res, next);
			}
		});

		const $sendFile_options = {
			root: path.join(__dirname, "public"),
		};
		app.get(/\/(pack|data)\/.*\.img\/$/, function (req, res, next) {
			if (_data_provider.checkDataSource(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(0, url.length - 1);

				res.sendFile(data_path, $sendFile_options, function (err) {
					if (err) {
						next();
					}
				});
			}
		});

		a_pp.get(/\/pack\/.*/, function (req, res, next) {//json: text + base64
			if (_data_provider.isNeedResponse(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(6);
				let task = _data_provider.getAsync("pack", data_path, true);

				sendJSON(task, req, res, next);
			}
		});
		a_pp.get(/\/data\/.*/, function (req, res, next) {//json: text
			if (_data_provider.isNeedResponse(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(6);
				let task = _data_provider.getAsync("data", data_path, false);

				sendJSON(task, req, res, next);
			}
		});
		a_pp.get(/\/ls\/.*/, function (req, res, next) {
			if (_data_provider.checkDataSource(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(4);
				let task = _data_provider.getAsync("ls", data_path);

				sendJSON(task, req, res, next);
			}
		});
		a_pp.get(/\/xml\/.*/, function (req, res, next) {
			if (_data_provider.checkDataSource(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(5);
				let task = _data_provider.getAsync("xml", data_path);

				task.then(function (data) {
					if (data) {
						res.writeHead(200, makeHeadNoCache("text/xml; charset=utf-8", _data_provider));
						res.end(data);
					}
					else {
						write_res(res, 404);
					}
				}, function (reason) {
					write_reason(res, reason);
				});
			}
		});
		a_pp.get(/\/xml2\/.*/, function (req, res, next) {
			if (_data_provider.checkDataSource(req, res, next)) {
				let url = decodeURI(req.path);
				let data_path = url.slice(6);
				let task = _data_provider.getAsync("xml2", data_path);
				
				task.then(function (data) {
					if (data) {
						res.writeHead(200, makeHeadNoCache("text/xml; charset=utf-8", _data_provider));
						res.end(data);
					}
					else {
						write_res(res, 404);
					}
				}, function (reason) {
					write_reason(res, reason);
				});
			}
		});
		
		a_pp.get("/fs/update", function (req, res, next) {
			try {
				let old_dp = _data_provider;
				_data_provider = new DataProvider(old_dp.iniFilePath);

				_data_provider.updateLastModifiedTime();

				res.write(`<p><table border="1"><tbody>`);
				res.write(`<tr><th>data-tag</td><td>${_data_provider.setting.tag}</td></tr>`);
				res.write(`<tr><th>data-version</td><td>${_data_provider.version}</td></tr>`);
				res.write(`<tr><th>Last-Modified</td><td>${_data_provider.mtime_utcs}</td></tr>`);
				res.write(`</tbody></table></p>`);
			}
			catch (ex) {
				res.write(`<p><h1>Error</h1><table border="1"><tbody>`);
				res.write(`<tr><th>message</td><td>${ex.message}</td></tr>`);
				res.write(`<tr><th>stack</td><td>${ex.stack}</td></tr>`);
				res.write(`</tbody></table></p>`);
			}
			next();
		});
		
		a_pp.get("/favicon.ico", function (req, res, next) {
			const data_path = "Character/Weapon/01572003.img/info/iconRaw";
			
			let task = _data_provider.getAsync("images", data_path);
			
			sendFile(task, req, res, next);
		});
	}
	
	let settingList = getSettingList("./");
	
	for (let i = 0; i < settingList.length; ++i) {
		let dataProvider = new DataProvider(settingList[i]);
		console.log(settingList[i]);
		Server(app, dataProvider);
	}
	
	app.get("/fs/update", function (req, res, next) {
		res.end();
	});
	
	app.get("/param/dataSource", function (req, res, next) {
		res.json(dataSource);
	});
	app.get("/param/dataTag", function (req, res, next) {
		res.json(dataTag);
	});
	
	return app;
}

function inspect_locale(obj) {
	try {
		let out = {};
		let keys = Object.keys(obj);
		for (let i = 0; i < keys.length; ++i) {
			let key = keys[i];
			let value = obj[key];

			const k2 = AsciiStringDecoder.end(key);
			const v2 = AsciiStringDecoder.end(value);

			out[k2] = v2;
		}
		return JSON.stringify(out, null, "\t");
	}
	catch (ex) {
		console.log(ex);
	}
}
