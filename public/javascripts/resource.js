
const $failed_urls = [];

const $archive = {};


window.character_emotion_list = ["blink", "hit", "smile", "troubled", "cry", "angry", "bewildered", "stunned",
	"vomit", "oops", "cheers", "chu", "wink", "pain", "glitter", "despair", "love", "shine", "blaze", "hum",
	"bowing", "hot", "dam", "qBlue"];

window.character_action_list = ["walk1", "walk2", "stand1", "stand2", "alert", "swingO1", "swingO2", "swingO3", "swingOF", "swingT1",
	"swingT2", "swingT3", "swingTF", "swingP1", "swingP2", "swingPF", "stabO1", "stabO2", "stabOF", "stabT1",
	"stabT2", "stabTF", "shoot1", "shoot2", "shootF", "proneStab", "prone", "heal", "fly", "jump", "sit", "ladder",
	"rope"/*, "dead", "ghostwalk", "ghoststand", "ghostjump", "ghostproneStab", "ghostladder", "ghostrope", "ghostfly",
		"ghostsit"*/];

export class ItemCategoryInfo {
	/**
	 * @param {string} id_prefix
	 * @param {string} path
	 * @param {boolean} isOnFace
	 * @param {string} slot - property name
	 * @param {string} categoryName
	 * @param {string} type
	 * @param {string} [stringPath]
	 */
	constructor(id_prefix, imgDir, listPath, slot, categoryName, type, stringPath) {
		this.id_prefix = id_prefix;

		/** data path */
		this.path = imgDir;

		/** equip window */
		this.slot = slot;

		/** item list file name */
		this.listPath = listPath;

		/** display category name */
		this.categoryName = categoryName;

		/** renderer */
		this.FragmentType = null;

		/** @type {string} */
		this.dataDir = null;
		/** @type {string} */
		this.stringDir = null;
		/** @type {string} */
		this.iconPath = null;
		/** @type {string} */
		this.iconRawPath = null;
		{
			let dataDir, stringDir, iconPath, iconRawPath;

			switch (slot) {
				case "head":
					iconPath = "stand1/0/head";
					iconRawPath = "stand1/0/head";
					break;
				case "body":
					iconPath = "stand1/0/body";
					iconRawPath = "stand1/0/body";
					break;
				case "hair":
					iconPath = "stand1/0/hair";
					iconRawPath = "stand1/0/hair";
					break;
				case "face":
					iconPath = "blink/0/face";
					iconRawPath = "blink/0/face";
					break;
				default: // typeId: 0|1|2|3|4
					iconPath = "info/icon";
					iconRawPath = "info/iconRaw";
			}
			
			if (id_prefix == "5") {
				dataDir = `/Item/${imgDir}/${id_prefix}/`;
				stringDir = "/String/Pet/";
				alert("Pet");
			}
			else {
				switch (id_prefix[1]) {
					case "0":
						if (Math.trunc(id_prefix) <= 1) {
							dataDir = "/Character/";
							stringDir = null;
							break;
						}
					case "1":
						let s = imgDir + (imgDir ? "/" : "");
						dataDir = "/Character/" + s;
						stringDir = "/String/Eqp/Eqp/" + (stringPath || s);
						break;
					case "2":
						dataDir = `/Item/${imgDir}/${id_prefix}/`;
						stringDir = "/String/Consume/";
						break;
					case "3":
						dataDir = `/Item/${imgDir}/${id_prefix}/`;
						stringDir = "/String/Ins/";
						break;
					case "4":
						dataDir = `/Item/${imgDir}/${id_prefix}/`;
						stringDir = "/String/Etc/";
						break;
					case "5":
						dataDir = `/Item/${imgDir}/${id_prefix}/`;
						stringDir = "/String/Cash/";
						break;
					default:
						throw new Error("unknow item type, param: %o", [id_prefix, imgDir, listPath, slot, categoryName, type]);
				}
			}

			Object.defineProperties(this, {
				"type": {
					value: type,
				},
				"dataDir": {
					value: dataDir,
				},
				"stringDir": {
					value: stringDir,
				},
				"iconPath": {
					value: iconPath,
				},
				"iconRawPath": {
					value: iconRawPath,
				},
			});
		}
	}
	
	/**
	 * load equip or item, name and desc
	 * @param {string} itemId
	 * @returns {{info:{icon:{[""]:string},iconRaw:{[""]:string}},name:string,desc:string,[prop:string]:any}}
	 */
	static async getItem(itemId) {
		/** @type {ItemCategoryInfo} */
		let info = ItemCategoryInfo.get(itemId);
		if (!info) {
			return null;
		}

		let id = itemId.padStart(8, "0");
		if (id[0] != "0") {
			throw new Error("itemId: " + itemId);
		}

		let results;
		try {
			results = await Promise.all([
				$get.data(info.dataDir + itemId),
				info.stringDir ? $get.data(info.stringDir + Number(itemId)).then(
					a => a, // have name or desc
					() => { return { name: "<" + itemId + ">" }; } // no name and desc
				) : { name: "<" + itemId + ">" } // no name and desc
			]);
		}
		catch (ex) {
			throw new ex;
		}

		let data = Object.assign(results[0], results[1]);
		
		data.id = itemId;

		if (data.info) {
			{//editor mode data
				data.info.id = itemId;
				data.info.name = data.name;
				if (data.desc) {
					data.info.desc = data.desc;
				}
				data.info.__v = window.DATA_TAG + window.DATA_VERSION;
			}

			if (!data.info.icon) {
				data.info.icon = {};
			}
			if (!data.info.iconRaw) {
				data.info.iconRaw = {};
			}
			if (!data.info.icon[""]) {
				data.info.icon[""] = ItemCategoryInfo.getIconUrl(itemId);
			}
			if (data.info.iconRaw[""]) {
				data.info.iconRaw[""] = ItemCategoryInfo.getIconRawUrl(itemId);
			}
		}

		return data;
	}

	/**
	 * @param {string} id
	 * @returns {string|null}
	 */
	static getIconRawUrl(id) {
		/** @type {ItemCategoryInfo} */
		let info = ItemCategoryInfo.get(id);
		if (!info) {
			return null;
		}
		if (id[0] == "0") {
			return $get.imageUrl(info.dataDir + id + "/" + info.iconRawPath);
		}
	}

	/**
	 * @param {string} id
	 * @returns {string|null}
	 */
	static getIconUrl(id) {
		/** @type {ItemCategoryInfo} */
		let info = ItemCategoryInfo.get(id);
		if (!info) {
			return null;
		}
		if (id[0] == "0") {
			return $get.imageUrl(info.dataDir + id + "/" + info.iconPath);
		}
	}

	/**
	 * @param {string} id - 4+ digit string
	 * @returns {ItemCategoryInfo}
	 */
	static get(id) {
		let info;

		if (id == null || id == "") {
			debugger;
			throw new TypeError();
		}

		if (id[0] == "0") {
			if (id.length == 4) {
				info = ItemCategoryInfo._info[id];
				if (info) {
					return info;
				}
			}
			else if (id.length == 6) {
				return ItemCategoryInfo._info[id];
			}
			else if (id.length == 3) {
				return ItemCategoryInfo._info[id];
			}
			else {
				info = ItemCategoryInfo._info[id.slice(0, 4)];
				if (info) {
					return info;
				}
				else {
					info = ItemCategoryInfo._info[id.slice(0, 6)];
					if (info) {
						return info;
					}
					else {
						info = ItemCategoryInfo._info[id.slice(0, 3)];//019
						if (info) {
							return info;
						}
					}
				}
			}
		}
		console.warn("unknow item type, itemId: " + id);
		return null;
	}

	static getTypeId() {
		return Math.trunc(_id / 1000000);
	}

	static getCategory() {
		return Math.trunc(_id / 10000);// % 100;// 0105 // 01 + 05 // type + category
	}

	/**
	 * @param {string} id - char[4]: type; char[4+]: itemId
	 * @returns {boolean}
	 */
	static isItem(id) {
		let type = Math.trunc(id / 1000000);//id.startsWith("00");
		return type != 0;
	}

	/**
	 * @param {string} id - char[4]: type; char[4+]: itemId
	 * @returns {boolean}
	 */
	static isEquip(id) {
		if (!id) {
			throw TypeError();
		}
		let _id = Number(id);

		if (!Number.isSafeInteger(_id)) {
			throw TypeError();
		}

		//let cate = Number(id.length == 4 ? id : id.slice(0, 4));
		//return (cate >= "0100" && cate < "0180");

		//let cate = Math.trunc(_id / 10000);
		//if (cate >= 180 && cate < 2000) {
		//	console.warn("?? equip: " + id);
		//	debugger;
		//}

		let type = Math.trunc(_id / 1000000);

		return type == 1;
	}

	static isChair(id) {
		if (!id) {
			throw TypeError();
		}
		let _id = Number(id);

		if (!Number.isSafeInteger(_id)) {
			throw TypeError();
		}

		let cate = Math.trunc(_id / 10000);

		return cate == 301;//0301xxxx
	}

	/**
	 * 1~4 digit number
	 * @param {string} itemId
	 */
	static getSubCategory(itemId) {
		return Math.trunc(itemId / 10000);
	}

	/**
	 * @param {string} itemId
	 */
	static isCashWeapon(itemId) {
		return Math.trunc(itemId / 10000) == 170;
	}

	/**
	 * @param {string} job
	 * @returns {string}
	 */
	static getJobWeaponCategory(job) {
		//TODO: getJobWeaponCategory
		console.warn("getJobWeaponCategory: 未完成");
	}
}
window.$ItemCategoryInfo = ItemCategoryInfo;
ItemCategoryInfo.type = {
	Equip: "Equip",
	Consume: "Consume",
	Etc: "Etc",
	Install: "Install",
	Cash: "Cash"
};
ItemCategoryInfo.typeName = {
	0: "Equip",
	1: "Consume",
	2: "Etc",
	3: "Install",
	4: "Cash"
};
ItemCategoryInfo.typeId = {
	Equip: 0,
	Consume: 1,
	Etc: 2,
	Install: 3,
	Cash: 4,
};
ItemCategoryInfo._info = {
	"0000": new ItemCategoryInfo("0000", "",			"body",				"body",			"<body>", "Equip"),
	"0001": new ItemCategoryInfo("0001", "",			"head",				"head",			"<head>", "Equip"),

	"0002": new ItemCategoryInfo("0002", "Face",		"Face",				"face",			"臉型", "Equip"),
	"0003": new ItemCategoryInfo("0003", "Hair",		"Hair",				"hair",			"髮型", "Equip"),
	"0004": new ItemCategoryInfo("0004", "Hair",		"Hair",				"hair",			"髮型", "Equip"),

	"0100": new ItemCategoryInfo("0100", "Cap",			"Cap",				"cap",			"帽子", "Equip"),
	"0101": new ItemCategoryInfo("0101", "Accessory",	"accessoryFace",	"accessoryFace", "臉飾", "Equip"),
	"0102": new ItemCategoryInfo("0102", "Accessory",	"accessoryEyes",	"accessoryEyes", "眼飾", "Equip"),
	"0103": new ItemCategoryInfo("0103", "Accessory",	"accessoryEars",	"accessoryEars", "耳環", "Equip"),
	"0104": new ItemCategoryInfo("0104", "Coat",		"Coat",				"coat",			"上衣", "Equip"),
	"0105": new ItemCategoryInfo("0105", "Longcoat",	"Longcoat",			"longcoat",		"套服", "Equip"),
	"0106": new ItemCategoryInfo("0106", "Pants",		"Pants",			"pants",		"褲子", "Equip"),
	"0107": new ItemCategoryInfo("0107", "Shoes",		"Shoes",			"shoes",		"鞋子", "Equip"),
	"0108": new ItemCategoryInfo("0108", "Glove",		"Glove",			"glove",		"手套", "Equip"),
	"0109": new ItemCategoryInfo("0109", "Shield",		"Shield",			"shield",		"盾牌", "Equip"),
	"0110": new ItemCategoryInfo("0110", "Cape",		"Cape",				"cape",			"披風", "Equip"),

	"0121": new ItemCategoryInfo("0121", "Weapon", "閃亮克魯", "weapon", "閃亮克魯", "Equip"),
	"0122": new ItemCategoryInfo("0122", "Weapon", "靈魂射手", "weapon", "靈魂射手", "Equip"),
	"0123": new ItemCategoryInfo("0123", "Weapon", "魔劍", "weapon", "魔劍", "Equip"),
	"0124": new ItemCategoryInfo("0124", "Weapon", "能量劍", "weapon", "能量劍", "Equip"),
	"0125": new ItemCategoryInfo("0125", "Weapon", "幻獸棒", "weapon", "幻獸棒", "Equip"),
	"0126": new ItemCategoryInfo("0126", "Weapon", "ESP限制器", "weapon", "ESP限制器", "Equip"),
	"0127": new ItemCategoryInfo("0127", "Weapon", "鎖鏈", "weapon", "鎖鏈", "Equip"),
	"0128": new ItemCategoryInfo("0128", "Weapon", "魔力護腕", "weapon", "魔力護腕", "Equip"),

	"0130": new ItemCategoryInfo("0130", "Weapon", "單手劍", "weapon", "單手劍", "Equip"),
	"0131": new ItemCategoryInfo("0131", "Weapon", "單手斧", "weapon", "單手斧", "Equip"),
	"0132": new ItemCategoryInfo("0132", "Weapon", "單手錘", "weapon", "單手錘", "Equip"),
	"0133": new ItemCategoryInfo("0133", "Weapon", "短劍", "weapon", "短劍", "Equip"),
	"0134": new ItemCategoryInfo("0134", "Weapon", "雙刀", "weapon", "雙刀", "Equip"),
	"013526": new ItemCategoryInfo("013526", "Weapon", "靈魂之環", "weapon", "靈魂之環", "Equip"),
	"013530": new ItemCategoryInfo("013530", "Weapon", "控制器", "weapon", "控制器", "Equip"),
	"0136": new ItemCategoryInfo("0136", "Weapon", "手杖", "weapon", "手杖", "Equip"),
	"0137": new ItemCategoryInfo("0137", "Weapon", "短杖", "weapon", "短杖", "Equip"),
	"0138": new ItemCategoryInfo("0138", "Weapon", "長杖", "weapon", "長杖", "Equip"),
	
	"0140": new ItemCategoryInfo("0140", "Weapon", "雙手劍", "weapon", "雙手劍", "Equip"),
	"0141": new ItemCategoryInfo("0141", "Weapon", "雙手斧", "weapon", "雙手斧", "Equip"),
	"0142": new ItemCategoryInfo("0142", "Weapon", "雙手棍", "weapon", "雙手棍", "Equip"),
	"0143": new ItemCategoryInfo("0143", "Weapon", "槍", "weapon", "槍", "Equip"),
	"0144": new ItemCategoryInfo("0144", "Weapon", "矛", "weapon", "矛", "Equip"),
	"0145": new ItemCategoryInfo("0145", "Weapon", "弓", "weapon", "弓", "Equip"),
	"0146": new ItemCategoryInfo("0146", "Weapon", "弩", "weapon", "弩", "Equip"),
	"0147": new ItemCategoryInfo("0147", "Weapon", "拳套", "weapon", "拳套", "Equip"),
	"0148": new ItemCategoryInfo("0148", "Weapon", "指虎", "weapon", "指虎", "Equip"),
	"0149": new ItemCategoryInfo("0149", "Weapon", "火槍", "weapon", "火槍", "Equip"),
	"0150": new ItemCategoryInfo("0150", "Weapon", "鏟", "weapon", "鏟", "Equip"),
	"0151": new ItemCategoryInfo("0151", "Weapon", "鎬", "weapon", "鎬", "Equip"),
	"0152": new ItemCategoryInfo("0152", "Weapon", "雙弩槍", "weapon", "雙弩槍", "Equip"),
	"0153": new ItemCategoryInfo("0153", "Weapon", "加農砲", "weapon", "加農砲", "Equip"),
	"0154": new ItemCategoryInfo("0154", "Weapon", "太刀", "weapon", "太刀", "Equip"),
	"0155": new ItemCategoryInfo("0155", "Weapon", "扇子", "weapon", "扇子", "Equip"),
	"0156": new ItemCategoryInfo("0156", "Weapon", "琉", "weapon", "琉", "Equip"),
	"0157": new ItemCategoryInfo("0157", "Weapon", "璃", "weapon", "璃", "Equip"),
	"0158": new ItemCategoryInfo("0158", "Weapon", "重拳槍", "weapon", "重拳槍", "Equip"),
	"0170": new ItemCategoryInfo("0170", "Weapon", "0170", "weapon", "點裝武器", "Equip"),
	"019": new ItemCategoryInfo("019", "TamingMob", "TamingMob", "tamingMob", "騎寵", "Equip", "Taming/"),

	"0301": new ItemCategoryInfo("0301", "Install", "Chair", "install", "椅子", "Item"),
};

ItemCategoryInfo._categoryList = (function (info_map) {
	let list = [];
	let set = new Set();
	for (let i in info_map) {
		let cat = info_map[i];
		let key = cat.categoryName || cat.listPath;

		if (!set.has(key)) {
			set.add(key);

			list.push({
				key: key,
				value: i,
			});
		}
	}
	return list;
})(ItemCategoryInfo._info);

export class ResourceManager {
	static isEquipExist(id, cateInfo) {
		const dp = cateInfo.listPath;
		const es = ResourceManager.equip_map[dp];
		return !es || es.has(id);
	}
	
	/**
	 * @param {string} url
	 */
	static async loadArchive(url) {
		$setValue($archive, "/", JSON.parse(await ResourceManager.get(url)));
	}
	
	/**
	 * @param {string} url
	 */
	static get(url) {
		return new Promise(function (resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);

			xhr.timeout = 10 * 60 * 1000;//20000;

			xhr.onload = function () {
				if (this.status == 404 || this.status == 500) {
					$failed_urls.push(url);
					debugger;
					//resolve(null);
					reject(this.status + ": " + url);
				}
				else if (this.status == 200) {
					resolve(this.responseText);
				}
				else if (this.status == 304) {
					debugger
				}
			};

			xhr.ontimeout = function (e) {
				debugger;
				// XMLHttpRequest 超时。在此做某事。
				//resolve(null);
				reject("timeout: " + url);
			};

			xhr.onabort = function (e) {
				reject("abort: " + url);
			};

			xhr.send();
		});
	}

	static get root_path() {
		return window.$ROOT_PATH;
	}

	static get archive() {
		return $archive;
	}

	static get failed_urls() {
		return $failed_urls;
	}
}
window.$ResourceManager = ResourceManager;

/**
 * @param {{}} obj
 * @param {string} path
 * @param {any} value
 */
function $setValue(obj, path, value) {
	if (path.endsWith("/")) {
		path = path.slice(0, path.length - 1);
	}
	let ps = path.split("/");
	let i, target = obj, lastIndex = ps.length - 1;
	for (i = 0; i < lastIndex; ++i) {
		let key = ps[i];
		if (target[key] == null) {
			target[key] = {};
		}
		target = target[key];
	}
	let origin_value = target[ps[lastIndex]];
	if (origin_value instanceof Promise) {
		delete target[ps[lastIndex]];
		target[ps[lastIndex]] = value;
	}
	else if (origin_value && typeof origin_value == "object") {
		//if (value instanceof Promise) {
		//	debugger;
		//}
		//else {
			for (let key in value) {
				origin_value[key] = value[key] || origin_value[key];
			}
		//}
	}
	else if (typeof value != "undefined") {
		target[ps[lastIndex]] = value;
	}
}
function $getValue(obj, path) {
	if (path.endsWith("/")) {
		path = path.slice(0, path.length - 1);
	}
	let ps = path.split("/");
	let i, target = obj, lastIndex = ps.length - 1;
	for (i = 0; i < lastIndex; ++i) {
		let key = ps[i];
		if (target[key]) {
				target = target[key];
		}
		else {
			return undefined;
		}
	}
	return target[ps[lastIndex]];
}

const symbol_isPack = Symbol("$pack");

const url_startsWith_protocol = RegExp.prototype.test.bind(/^(([a-zA-Z^\:]+)(\:.*)$|\/\/)/);
function _setValueByPath(path, value, is_pack) {
	if (url_startsWith_protocol(path)) {
		return;
	}
	else if (window.$ROOT_PATH != "" && path.startsWith(window.$ROOT_PATH)) {
		if (is_pack) {
			value[symbol_isPack] = true;
		}
		path = path.slice(window.$ROOT_PATH.length);
		return $setValue($archive, path, value);
	}
	else {
		return $setValue($archive, path, value);
	}
}
function _getValueFromArchiveByPath(path, value) {
	let _path = _getDataPathByUrl(path);
	if (_path) {
		return $getValue($archive, _path);
	}
	return undefined;
}
function _getDataPathByUrl(path) {
	if (!url_startsWith_protocol(path)) {
		if (window.$ROOT_PATH != "" && path.startsWith(window.$ROOT_PATH)) {
			return path.slice(window.$ROOT_PATH.length);
		}
	}
	return undefined;
}

/**
 * @returns {Promise<any>|any}
 */
function $getValueAsync(obj, path) {
	if (path.endsWith("/")) {
		path = path.slice(0, path.length - 1);
	}
	
	// try get value sync
	let value = $getValue(obj, path);
	
	// if value exist
	if (value) {
		if (value instanceof Promise) {
			// ??
			return new Promise(async function (resolve, reject) {
				await value;
				resolve(await $getValueAsync(obj, path));
			});
		}
		else {
			return value;
		}
	}
	else {// if value not exist, try await parent node
		let ps = path.split("/");
		let i, target = obj, lastIndex = ps.length - 1;
		for (i = 0; i < lastIndex; ++i) {
			let key = ps[i];
			if (target[key] instanceof Promise) {
				return new Promise(async function (resolve, reject) {
					await target[key];
					resolve(await $getValueAsync(obj, path));
				});
			}
			if (target[key]) {
					target = target[key];
			}
			else {
				return undefined;
			}
		}
		let result = target[ps[lastIndex]];
		if (result instanceof Promise) {
			return new Promise(async function (resolve, reject) {
				await result;
				resolve(await $getValueAsync(obj, path));
			});
		}
		else {
			return result;
		}
	}
}

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
export let $get = function $get(url) {
	return ResourceManager.get(url);
}
/**
 * @param {string} path
 * @returns {Promise<any>}
 */
$get.pack = async function $get_pack(path) {
	let _path = _getDataPathByUrl(path);
	let obj;

	if (_path) {
		obj = $getValueAsync($archive, _path);
	}

	if (obj instanceof Promise) {
		return await obj;
	}
	else if (obj && obj[symbol_isPack]) {
		return obj;
	}
	else {
		if (process.env.NODE_ENV !== "production") {
			if (obj && !obj[symbol_isPack]) {
				throw new TypeError("data: " + path);
			}
		}
		const url = $get.packUrl(path);

		let task = (async function () {
			let jsonText = await ResourceManager.get(url);

			obj = JSON.parse(jsonText);

			_setValueByPath(path, obj, true);

			return obj;
		})();
		_setValueByPath(path, task, true);

		return await task;
	}
}
/**
 * @param {string} path
 * @returns {Promise<any>}
 */
$get.packSync = function get_packSync(path) {
	let obj = _getValueFromArchiveByPath(path);
	if (obj) {
		return obj;
	}
	return undefined;
}
/**
 * @param {string} path
 * @returns {Promise<any>}
 */
$get.data = async function $get_data(path) {
	let _path = _getDataPathByUrl(path);
	let obj;

	if (_path) {
		obj = $getValueAsync($archive, _path);
	}

	if (obj instanceof Promise) {
		return await obj;
	}
	else if (obj) {
		return obj;
	}
	else {
		const url = $get.dataUrl(path);

		let task = (async function () {
			let jsonText = await ResourceManager.get(url);

			obj = JSON.parse(jsonText);

			_setValueByPath(path, obj, false);

			return obj;
		})();
		_setValueByPath(path, task, false);

		return await task;
	}
}
/**
 * @param {string} path
 * @returns {any}
 */
$get.dataSync = function get_dataSync(path) {
	let obj = _getValueFromArchiveByPath(path);
	if (obj) {
		return obj;
	}
	return undefined;
}
/**
 * @param {string} path
 * @returns {Promise<any>}
 */
$get.list = async function $get_list(path) {
	let _path = _getDataPathByUrl(path);
	let obj;

	if (_path) {
		obj = $getValueAsync($archive, _path);
	}

	if (obj instanceof Promise) {
		return await obj;
	}
	else if (obj) {
		return obj;
	}
	else {
		const url = $get.listUrl(path);

		let task = (async function () {
			let jsonText = await ResourceManager.get(url);

			obj = JSON.parse(jsonText);

			_setValueByPath(path, obj, false);

			return obj;
		})();
		_setValueByPath(path, task, false);

		return await task;
	}
}
/**
 * @param {string} path
 * @returns {Promise<any>}
 */
$get.listSync = function $get_listSync(path) {
	let obj = _getValueFromArchiveByPath(path);
	if (obj) {
		return Object.keys(obj);
	}
	return undefined;
}

/**
 * @param {string} path
 * @returns {string}
 */
$get.dataUrl = function $get_dataUrl(path) {
	if (url_startsWith_protocol(path)) {
		return path;
	}
	else if (!path.startsWith("data")) {
		return `${window.$ROOT_PATH}data${path}.json`;
	}
	throw new Error("Not game data: " + path);
}
/**
 * @param {string} path
 * @returns {string}
 */
$get.packUrl = function $get_packUrl(path) {
	if (url_startsWith_protocol(path)) {
		return path;
	}
	else if (!path.startsWith("pack")) {
		return `${window.$ROOT_PATH}pack${path}.json`;
	}
	throw new Error("Not game pack: " + path);
}
$get.listUrl = function $get_listUrl(path) {
	if (url_startsWith_protocol(path)) {
		return path;
	}
	else if (!path.startsWith("ls")) {
		return `${window.$ROOT_PATH}ls${path}.json`;
	}
	throw new Error(path);
}
/**
 * @param {string} path
 * @returns {string}
 */
$get.imageUrl = function $get_imagesUrl(path) {
	if (url_startsWith_protocol(path)) {
		return path;
	}
	else if (!path.startsWith("images")) {
		return `${window.$ROOT_PATH}images${path}.png`;
	}
	throw new Error("Not game images: " + path);
}
/**
 * @param {string} path
 * @returns {string}
 */
$get.soundMp3Url = function $get_soundMp3Url(path) {
	if (url_startsWith_protocol(path)) {
		return path;
	}
	else if (!path.startsWith("sound")) {
		return `${window.$ROOT_PATH}sound${path}.mp3`;
	}
	throw new Error("Not game sound: " + path);
}
/**
 * @param {string} path
 * @returns {string}
 */
$get.soundWavUrl = function $get_soundWavUrl(path) {
	if (url_startsWith_protocol(path)) {
		return path;
	}
	else if (!path.startsWith("sound")) {
		return `${window.$ROOT_PATH}sound${path}.wav`;
	}
	throw new Error("Not game sound: " + path);
}

/**
 * @param {string} path
 * @returns {string}
 */
$get.assetUrl = function $get_assetUrl(path) {
	return `${window.$ROOT_PATH}${path}`;
}
$get.asset = function $get_asset(path) {
	return $get($get.assetUrl(path));
}

window.$get = $get;


export class ItemAttrNormalize {
	static head(item) {
		item.gender = 2;
	}
	static body(item) {
		item.gender = 2;
	}
	static Face(item) {
		const g = Math.trunc((item.id % 10000) / 1000);
		item.gender = g == 1 || g == 4 ? 1 : 0;
	}
	static Hair(item) {
		const g = Math.trunc((item.id % 10000) / 1000);
		item.gender = g == 1 || g == 2 || g == 4 || g == 7 ? 1 : 0;
	}
	static Cap(item) {
		ItemAttrNormalize._equip(item);
	}
	static accessoryFace(item) {
		ItemAttrNormalize._equip(item);
	}
	static accessoryEyes(item) {
		ItemAttrNormalize._equip(item);
	}
	static accessoryEars(item) {
		ItemAttrNormalize._equip(item);
	}
	static Coat(item) {
		ItemAttrNormalize._equip(item);
	}
	static Longcoat(item) {
		ItemAttrNormalize._equip(item);
	}
	static Pants(item) {
		ItemAttrNormalize._equip(item);
	}
	static Shoes(item) {
		ItemAttrNormalize._equip(item);
	}
	static Glove(item) {
		ItemAttrNormalize._equip(item);
	}
	static Shield(item) {
		ItemAttrNormalize._equip(item);
	}
	static Cape(item) {
		ItemAttrNormalize._equip(item);
	}
	static _equip(item) {
		const g = Math.trunc((item.id % 10000) / 1000);
		item.gender = g == 0 ? 0 : (g == 1 ? 1 : 2);
	}
}

const regexp_getHairStyleID = /(\d{4,7})\d$/;
const regexp_getFaceStyleID = /(\d{2,5})\d(\d{2})$/;

const regexp_getHairColor = /\d{4,7}(\d)$/;
const regexp_getFaceColor = /\d{2,5}(\d)\d{2}$/;

export class CharacterRenderConfig {
	/**
	 * @param {string} style id
	 * @returns {string[]}
	 */
	static * enumHairColor(style) {
		let m = style.match(regexp_getHairStyleID);
		for (let i = 0; i < 10; ++i) {
			let id = m[1] + i;
			yield id;
		}
	}

	/**
	 * @param {string} style id
	 * @returns {string[]}
	 */
	static * enumFaceColor(style) {
		let m = style.match(regexp_getFaceStyleID);
		for (let i = 0; i < 10; ++i) {
			let id = m[1] + i + m[2];
			yield id;
		}
	}

	/**
	 * @param {string} style
	 * @param {number} color
	 * @returns {string}
	 */
	static getColorHairID(style, color) {
		let m = style.match(regexp_getHairStyleID);
		let id = m[1] + (color % 10);
		return id;
	}
	/**
	 * @param {string} style
	 * @param {number} color
	 * @returns {string}
	 */
	static getColorFaceID(style, color) {
		let m = style.match(regexp_getFaceStyleID);
		let id = m[1] + (color % 10) + m[2];
		return id;
	}

	/**
	 * @param {string} id_1
	 * @param {string} id_2
	 * @returns {boolean}
	 */
	static isHairStyleEqual(id_1, id_2) {
		return CharacterRenderConfig.getColorHairID(id_1, 0) == CharacterRenderConfig.getColorHairID(id_2, 0);
	}
	/**
	 * @param {string} id_1
	 * @param {string} id_2
	 * @returns {boolean}
	 */
	static isFaceStyleEqual(id_1, id_2) {
		return CharacterRenderConfig.getColorFaceID(id_1, 0) == CharacterRenderConfig.getColorFaceID(id_2, 0);
	}

	/**
	 * @param {string} id
	 * @returns {string}
	 */
	static getHairColor(id) {
		if (id) {
			id = String(id);
			let m = id.match(regexp_getHairColor);
			if (m) {
				return m[1];
			}
		}
	}

	/**
	 * @param {string} id
	 * @returns {string}
	 */
	static getFaceColor(id) {
		if (id) {
			id = String(id);
			let m = id.match(regexp_getFaceColor);
			if (m) {
				return m[1];
			}
		}
	}
}

var _external_data = {
	"requiredJobs": [
		"Beginner"
	],
	"requiredLevel": 0,
	"isCash": true,
	"name": "Blue Beanie",
	"desc": null,
	"id": 1000000,
	"requiredGender": 0,
	"typeInfo": {
		"overallCategory": "Equip",
		"category": "Armor",
		"subCategory": "Hat"
	}
};

var ItemTypeInfo = {
	"Equip": {
		"Hat": "Cap",
		"Cape": "Cape",
		"Top": "Coat",
		"Overall": "Longcoat",
		"Glove": "Glove",
		"Bottom": "Pants",

		"Shield": "Shield",
		"Shoes": "Shoes",
		"Eye Decoration": "accessoryEyes",
		"Earrings": "accessoryEars",
		//"Ring": "",

		//"Pendant": "",
		"Face Accessory": "accessoryFace",
		//"Belt": "",
		//"Medal": "",
		//"Shoulder Accessory": "",
		//"Badge": "",

		//"Dragon Equipment": "",
		//"Mechanic Equipment": "",
		//"Pet Equipment": "",
		//"Android": "",
		//"Mechanical Heart": "",
		//"Bits": "",

		"Face": "Face",
		"Hair": "Hair",
	},
};

ResourceManager.external = {
	equip: {
	},
};

ResourceManager.equip_map = {
};

for (let i in ItemTypeInfo.Equip) {
	let cate = ItemTypeInfo.Equip[i];

	ResourceManager.external.equip[cate] = [];
	ResourceManager.equip_map[cate] = null;
}
for (let i = 0; i < 9; ++i) {
	let cate = "Face" + i;
	ResourceManager.external.equip[cate] = [];
	ResourceManager.equip_map[cate] = null;
}
for (let i = 0; i < 8; ++i) {
	let cate = "Hair" + i;
	ResourceManager.external.equip[cate] = [];
	ResourceManager.equip_map[cate] = null;
}

async function load_external_resource(url) {
	url = url || "/items.json";
	let raw;

	try {
		raw = ResourceManager._external_raw = JSON.parse(await $get.asset("equip.json"));
		if (!raw) {
			debugger;
			throw Error("'/equip' is empty");
		}
	}
	catch (ex) {
		raw = ResourceManager._external_raw = JSON.parse(await $get("//labs.maplestory.io/api/gms/latest/item/category/equip"));
		if (!raw) {
			debugger;
			return;
		}
	}
	
	for (let i = 0; i < raw.length; ++i) {
		const item = raw[i];
		const id = String(item.id).padStart(8, "0");
		
		try {
			if (!(item.typeInfo && ItemTypeInfo[item.typeInfo.overallCategory])) {
				continue;
			}

			let clz = item.typeInfo.overallCategory.toLowerCase();
			let cate = ItemTypeInfo[item.typeInfo.overallCategory][item.typeInfo.subCategory];
			if (!cate) {
				continue;
			}
			else if (cate == "Face") {
				cate += CharacterRenderConfig.getFaceColor(id);
			}
			else if (cate == "Hair") {
				cate += CharacterRenderConfig.getHairColor(id);
			}

			let it = {
				id: id,
				name: item.name,
				desc: item.desc,
				cash: item.isCash ? 1 : 0,
				icon: {
					"": `//labs.maplestory.io/api/gms/latest/item/${item.id}/icon`,
				},
			};

			ResourceManager.external[clz][cate].push(it);
		}
		catch (ex) {
			console.error("external resource: id(" + id + ")");
			console.error(ex);
			debugger;
		}
	}
}

function update_external_equip_list() {
	const url = "https://labs.maplestory.io/api/gms/latest/item/category/equip";
	load_external_resource(url).then(() => {
		_concat_external_resource(category, origin_data);
		concat_external_resource = _concat_external_resource;
		console.log("done: update_external_equip_list");
	});
}

let external_resource_promise = load_external_resource();

window.concat_external_resource = _concat_external_resource_p;

window.trigger_update_external_equip_list = function () {
	external_resource_promise = load_external_resource();
	window.concat_external_resource = _concat_external_resource_p;
}

async function _concat_external_resource_p(category, origin_data) {
	await external_resource_promise;
	_concat_external_resource(category, origin_data);
	concat_external_resource = _concat_external_resource;
}

function _concat_external_resource(category, origin_data) {
	try {
		const list = ResourceManager.external.equip[category];
		if (!list) {
			return;
		}
		let id_map = ResourceManager.equip_map[category];

		if (!id_map) {
			id_map = new Map();
			
			origin_data.forEach(item => {
				id_map.set(item.id, item);
			});

			ResourceManager.equip_map[category] = id_map;
		}

		list.forEach((item) => {
			let id = item.id;
			if (!id_map.has(id)) {
				item.$foreign = true;
				origin_data.push(item);
			}
			else {
				let ori_item = id_map.get(id);
				ori_item._name = item.name || "";
				ori_item._desc = item.desc || "";
			}
		});
	}
	catch (ex) {
		console.error(ex);
		debugger;
	}
}

window.load_extern_item_data = async function (id) {
	let _raw = JSON.parse(await $get(`//labs.maplestory.io/api/gms/latest/item/${id}`));
	let raw = {};

	let default_ = _raw.frameBooks.default ? _raw.frameBooks.default.frames[0]:null;

	for (let i in _raw.frameBooks) {
		let _act = _raw.frameBooks[i];
		let act = [];

		for (let j = 0; j < _act.frames.length; ++j) {
			let frame = _act.frames[j] || default_;
			if (!frame || !frame.effects) {
				continue;
			}
			let _frags = frame.effects;
			let frags = {};
			for (let k in _frags) {
				let _frag = _frags[k];
				if (_frag.image) {
					frags[k] = {
						"": "data:image/png;base64," + _frag.image,
						"origin": _frag.originOrZero || _frag.origin || _frag.center,
						"map": _frag.mapOffset,
						"z": _frag.position
					};
				}
			}

			act[j] = frags;
		}

		raw[i] = act;
	}

	raw.info = {
		islot: _raw.metaInfo.equip.islot,
		vslot: _raw.metaInfo.equip.vslot,
		icon: _raw.metaInfo.icon ? ("data:image/png;base64," + _raw.metaInfo.icon.iconRaw) : "",
		cash: (_raw.metaInfo.cash && _raw.metaInfo.cash.cash) ? 1 : 0,
	};

	return raw;
}
