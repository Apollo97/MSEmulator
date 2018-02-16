
const cluster = require('cluster');
const http = require('http');

const path = require('path');
const url = require('url');
const fs = require('fs');
const util = require('util');
const { Transform } = require('stream');

const { StringDecoder } = require('string_decoder');
const AsciiStringDecoder = new StringDecoder("ascii");

const IniParser = require('ini-parser');

const port = process.argv[2] || 80;


main();


function main() {
	const child_process = require('child_process');

	let EquipList = child_process.spawn(path.join(__dirname, "Tools", "EquipList", "EquipList"), ["./public/data", "./setting.ini"]);
	console.log("產生道具清單...");

	EquipList.stdout.on("data", data => process.stdout.write(data));

	let promise = new Promise(function (resolve, reject) {
		EquipList.on('exit', function () {
			console.log("產生道具清單...完成");
			resolve();
		});
	});

	let app = WebServer();

	DataServer(app);

	promise.then(function () {
		startServer(app, port);
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
		if (req.path.endsWith(".json") || req.path.startsWith("/data/")) {
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

	app.use('/', express.static(path.join(__dirname, 'public')));
	
	app.get(/.*\.zip\/.*/, get_unzip_handler("", __dirname, "public"));

	function get_unzip_handler(url, filepath) {
		return function unzip_handler(req, res, next) {
			let names = req.path.match(url + "(.*\.zip)\/(.*)");
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
	const edge = require('edge');
	let express = require('express');
	if (!app) {
		app = express();
	}

	class DataProvider {
		constructor() {
			let _get = edge.func({
				source: path.join(__dirname, "wz.cs"),
				references: [path.join(__dirname, "bin", 'libwz.net.dll'), "mscorlib.dll", "System.Drawing.dll", "System.Windows.Forms.dll", "System.Configuration.dll", "System.Data.dll", "System.Web.Extensions.dll"]
			});
			this._get = function () {
				try {
					return _get.apply(this, arguments);
				}
				catch (ex) {
					console.log("err get: " + JSON.stringify(arguments) + "\n" + (new Buffer(ex.stack)).toString());
				}
			};

			let mtime = this._getDataLastModified();

			this.mtime_utcs = mtime.toUTCString();
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
		version() {
			let v = this._get({
				func: "version"
			}, true);
			return v;
		}
		make_zorders() {
			let zorders = this._get({
				func: "make_zorders"
			}, true);
			return zorders;
		}
		getPng(url, req, res, next) {
			let data_path = url.slice(8);
			let task = this.getAsync("images", data_path);

			sendFile(task, req, res, next);
		}

		/** @returns {Date} */
		_getDataLastModified() {
			let _setting = IniParser.parse(fs.readFileSync(path.join(__dirname, "./setting.ini"), "utf-8"));
			return fs.statSync(_setting.resource.path).mtime;
		}
		
		isNeedResponse(req, res, next) {
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
	}

	let dataProvider = new DataProvider();

	/** @param {string} mime */
	function makeHead(mime) {
		return {
			"Content-Type": mime,
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=86400",
			"Cache-Control": "no-cache",
			"Last-Modified": dataProvider.mtime_utcs
		}
	}
	/** @param {string} mime */
	function makeHeadNoCache(mime) {
		return {
			"Content-Type": mime,
			"Access-Control-Allow-Origin": "*",
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

	app.get(/\/echo\/.*/, function (req, res, next) {
		let url = decodeURI(req.path.slice(6));
		res.end(url);
	});

	app.get(/\/echo-\/.*/, function (req, res, next) {
		let url = decodeURI(req.path.slice(7));
		res.end(`<script>${url}</script>`);
	});

	app.get('/version', function (req, res, next) {
		let js = [
			`window.DATA_VERSION=${dataProvider.version()};`,
		].join("\n");

		res.writeHead(200, makeHead("application/x-javascript; charset=utf-8"));

		res.end(js);
	});

	app.get('/make_zorders', function (req, res, next) {
		if (dataProvider.isNeedResponse(req, res, next)) {
			let data = dataProvider.make_zorders(path, true);
			res.writeHead(200, makeHead("application/json; charset=utf-8"));
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
				res.writeHead(200, makeHead(results.mime));
				res.end(results.data);
			}
			else {
				//return next();//goto 404
				//res.end("null");
				write_res(res, 404);
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
				res.writeHead(200, makeHead(results.mime));
				res.end(JSON.stringify(results.data, null, "\t"));
			}
			else {
				//return next();//goto 404
				//res.end("null");
				write_res(res, 404);
			}
		}, function (reason) {
			write_reason(res, reason);
		});
	}

	app.get(/\/images\/.*/, function (req, res, next) {//png
		if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			dataProvider.getPng(url, req, res, next);
		}
	});
	app.get(/\/_images\/.*/, function (req, res, next) {//gif
		if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(9);
			let task = dataProvider.getAsync("_images", data_path);

			sendFile(task, req, res, next);
		}
	});
	app.get(/\/sound\/.*/, function (req, res, next) {//wav/mp3
		if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(7);
			let task = dataProvider.getAsync("sound", data_path);

			sendFile(task, req, res, next);
		}
	});
	app.get(/\/binary\/.*/, function (req, res, next) {//wav/mp3
		if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(8);
			let task = dataProvider.getAsync("binary", data_path);

			sendFile(task, req, res, next);
		}
	});

	app.get(/\/pack\/.*/, function (req, res, next) {//json: text + base64
		if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(6);
			let task = dataProvider.getAsync("pack", data_path, true);

			sendJSON(task, req, res, next);
		}
	});
	app.get(/\/data\/.*/, function (req, res, next) {//json: text
		if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(6);
			let task = dataProvider.getAsync("data", data_path, false);

			sendJSON(task, req, res, next);
		}
	});
	app.get(/\/ls\/.*/, function (req, res, next) {
		//if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(4);
			let task = dataProvider.getAsync("ls", data_path);

			sendJSON(task, req, res, next);
		//}
	});
	app.get(/\/xml\/.*/, function (req, res, next) {
		//if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(5);
			let task = dataProvider.getAsync("xml", data_path);

			task.then(function (data) {
				if (data) {
					res.writeHead(200, makeHeadNoCache("text/xml; charset=utf-8"));
					res.end(data);
				}
				else {
					write_res(res, 404);
				}
			}, function (reason) {
				write_reason(res, reason);
			});
		//}
	});
	app.get(/\/xml2\/.*/, function (req, res, next) {
		//if (dataProvider.isNeedResponse(req, res, next)) {
			let url = decodeURI(req.path);
			let data_path = url.slice(6);
			let task = dataProvider.getAsync("xml2", data_path);

			task.then(function (data) {
				if (data) {
					res.writeHead(200, makeHeadNoCache("text/xml; charset=utf-8"));
					res.end(data);
				}
				else {
					write_res(res, 404);
				}
			}, function (reason) {
				write_reason(res, reason);
			});
		//}
	});
	app.get("/favicon.ico", function (req, res, next) {
		dataProvider.getPng("/images/Character/Weapon/01572003.img/info/iconRaw", req, res, next);
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

