


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
	 * @param {string} path
	 * @param {boolean} isOnFace
	 * @param {string} slot - property name
	 * @param {string} categoryName
	 */
	constructor(imgDir, listPath, slot, categoryName, type = "Equip") {
		/** data path */
		this.path = imgDir;

		/** equip window */
		this.slot = slot;

		/** item list file name */
		this.listPath = listPath;

		/** display category name */
		this.categoryName = categoryName;

		/** renderer */
		this.fragmentType = null;

		/** @type {string} */
		this.dataDir = null;
		/** @type {string} */
		this.iconPath = null;
		/** @type {string} */
		this.iconRawPath = null;
		{
			let dataDir, iconPath, iconRawPath;

			switch (slot) {
				case "head":
					iconPath = "stand1/0/head";
					iconRawPath = "stand1/0/head";
				case "body":
					iconPath = "stand1/0/body";
					iconRawPath = "stand1/0/body";
				case "hair":
					iconPath = "stand1/0/hair";
					iconRawPath = "stand1/0/hair";
				case "face":
					iconPath = "blink/0/face";
					iconRawPath = "blink/0/face";
				default://typeId: 0|1|2|3|4
					iconPath = "info/icon";
					iconRawPath = "info/iconRaw";
			}

			if (type == "Equip") {
				dataDir = `/Character/${imgDir + (imgDir ? "/" : "")}`;
			}
			else {
				//TODO: get item data dir
				console.error("未完成");
			}

			Object.defineProperties(this, {
				'dataDir': {
					value: dataDir,
				},
				'iconPath': {
					value: iconPath,
				},
				'iconRawPath': {
					value: iconRawPath,
				},
			});
		}
	}

	/**
	 * @param {string} id
	 * @returns {string|null}
	 */
	static getDataPath(id) {
		/** @type {ItemCategoryInfo} */
		const info = ItemCategoryInfo.get(id);
		if (!info) {
			return null;
		}

		if (id[0] == '0') {
			return info.dataDir + id + ".img/";
		}
		else {
			//TODO: get item data path
			throw new Error("未完成");
		}
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
		if (id[0] == '0') {
			return "/images" + info.dataDir + id + ".img/" + info.iconRawPath;
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
		if (id[0] == '0') {
			return "/images" + info.dataDir + id + ".img/" + info.iconPath;
		}
	}

	/**
	 * load name and desc
	 * @param {string} id
	 * @returns {{name:string,desc:string}}
	 */
	static async loadString(id) {
		/** @type {ItemCategoryInfo} */
		let info = ItemCategoryInfo.get(id);
		if (!info) {
			return null;
		}
		let url = `/String/Eqp.img/Eqp/${info.path + (info.path ? "/" : "")}${Number(id)}`;
		let data = JSON.parse(await $get.data(url));
		return data;
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

		if (id.length == 4) {
			info = ItemCategoryInfo._info[id];
			if (info) {
				return info;
			}
		}
		else {
			info = ItemCategoryInfo._info[id.slice(0, 4)];
			if (info) {
				return info;
			}
			else {
				if (id.length == 6) {
					info = ItemCategoryInfo._info[id];
				}
				else {
					info = ItemCategoryInfo._info[id.slice(0, 6)];
				}
				if (info) {
					return info;
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
	static isEquip(id) {
		if (id == null || id == "") {
			return null;
		}
		let _id = Number(id);

		//let cate = Number(id.length == 4 ? id : id.slice(0, 4));
		//return (cate >= "0100" && cate < "0180");

		let cate = Math.trunc(_id / 10000);
		if (cate > 180 && cate < 2000) {
			console.warn("?? equip: " + id);
			debugger;
		}

		let type = Math.trunc(_id / 1000000);

		return type == 1;
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
	'0000': new ItemCategoryInfo("",			"body",				"body",			""),
	'0001': new ItemCategoryInfo("",			"head",				"head",			""),

	'0002': new ItemCategoryInfo("Face",		"Face",				"face",			"臉型"),
	'0003': new ItemCategoryInfo("Hair",		"Hair",				"hair",			"髮型"),
	'0004': new ItemCategoryInfo("Hair",		"Hair",				"hair",			"髮型"),

	'0100': new ItemCategoryInfo("Cap",			"Cap",				"cap",			"帽子"),
	'0101': new ItemCategoryInfo("Accessory",	"accessoryFace",	"accessoryFace", "臉飾"),
	'0102': new ItemCategoryInfo("Accessory",	"accessoryEyes",	"accessoryEyes", "眼飾"),
	'0103': new ItemCategoryInfo("Accessory",	"accessoryEars",	"accessoryEars", "耳環"),
	'0104': new ItemCategoryInfo("Coat",		"Coat",				"coat",			"上衣"),
	'0105': new ItemCategoryInfo("Longcoat",	"Longcoat",			"longcoat",		"套服"),
	'0106': new ItemCategoryInfo("Pants",		"Pants",			"pants",		"褲子"),
	'0107': new ItemCategoryInfo("Shoes",		"Shoes",			"shoes",		"鞋子"),
	'0108': new ItemCategoryInfo("Glove",		"Glove",			"glove",		"手套"),
	'0109': new ItemCategoryInfo("Shield",		"Shield",			"shield",		"盾牌"),
	'0110': new ItemCategoryInfo("Cape",		"Cape",				"cape",			"披風"),

	"0121": new ItemCategoryInfo("Weapon", "閃亮克魯", "weapon", "閃亮克魯"),
	"0122": new ItemCategoryInfo("Weapon", "靈魂射手", "weapon", "靈魂射手"),
	"0123": new ItemCategoryInfo("Weapon", "魔劍", "weapon", "魔劍"),
	"0124": new ItemCategoryInfo("Weapon", "能量劍", "weapon", "能量劍"),
	"0125": new ItemCategoryInfo("Weapon", "幻獸棒", "weapon", "幻獸棒"),
	"0126": new ItemCategoryInfo("Weapon", "ESP限制器", "weapon", "ESP限制器"),
	"0127": new ItemCategoryInfo("Weapon", "鎖鏈", "weapon", "鎖鏈"),
	"0128": new ItemCategoryInfo("Weapon", "魔力護腕", "weapon", "魔力護腕"),

	"0130": new ItemCategoryInfo("Weapon", "單手劍", "weapon", "單手劍"),
	"0131": new ItemCategoryInfo("Weapon", "單手斧", "weapon", "單手斧"),
	"0132": new ItemCategoryInfo("Weapon", "單手錘", "weapon", "單手錘"),
	"0133": new ItemCategoryInfo("Weapon", "短劍", "weapon", "短劍"),
	"0134": new ItemCategoryInfo("Weapon", "雙刀", "weapon", "雙刀"),
	"013526": new ItemCategoryInfo("Weapon", "靈魂之環", "weapon", "靈魂之環"),
	"013530": new ItemCategoryInfo("Weapon", "控制器", "weapon", "控制器"),
	"0136": new ItemCategoryInfo("Weapon", "手杖", "weapon", "手杖"),
	"0137": new ItemCategoryInfo("Weapon", "短杖", "weapon", "短杖"),
	"0138": new ItemCategoryInfo("Weapon", "長杖", "weapon", "長杖"),
	
	"0140": new ItemCategoryInfo("Weapon", "雙手劍", "weapon", "雙手劍"),
	"0141": new ItemCategoryInfo("Weapon", "雙手斧", "weapon", "雙手斧"),
	"0142": new ItemCategoryInfo("Weapon", "雙手棍", "weapon", "雙手棍"),
	"0143": new ItemCategoryInfo("Weapon", "槍", "weapon", "槍"),
	"0144": new ItemCategoryInfo("Weapon", "矛", "weapon", "矛"),
	"0145": new ItemCategoryInfo("Weapon", "弓", "weapon", "弓"),
	"0146": new ItemCategoryInfo("Weapon", "弩", "weapon", "弩"),
	"0147": new ItemCategoryInfo("Weapon", "拳套", "weapon", "拳套"),
	"0148": new ItemCategoryInfo("Weapon", "指虎", "weapon", "指虎"),
	"0149": new ItemCategoryInfo("Weapon", "火槍", "weapon", "火槍"),
	"0150": new ItemCategoryInfo("Weapon", "鏟", "weapon", "鏟"),
	"0151": new ItemCategoryInfo("Weapon", "鎬", "weapon", "鎬"),
	"0152": new ItemCategoryInfo("Weapon", "雙弩槍", "weapon", "雙弩槍"),
	"0153": new ItemCategoryInfo("Weapon", "加農砲", "weapon", "加農砲"),
	"0154": new ItemCategoryInfo("Weapon", "太刀", "weapon", "太刀"),
	"0155": new ItemCategoryInfo("Weapon", "扇子", "weapon", "扇子"),
	"0156": new ItemCategoryInfo("Weapon", "琉", "weapon", "琉"),
	"0157": new ItemCategoryInfo("Weapon", "璃", "weapon", "璃"),
	"0158": new ItemCategoryInfo("Weapon", "重拳槍", "weapon", "重拳槍"),
	"0170": new ItemCategoryInfo("Weapon", "0170", "weapon", "點裝武器"),
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
	static get(url) {
		return new Promise(function (resolve, reject) {
			let xhr = new XMLHttpRequest();
			xhr.open("GET", url, true);

			xhr.timeout = 10 * 60 * 1000;//20000;

			xhr.onload = function () {
				if (this.status == 404 || this.status == 500) {
					ResourceManager.failed_urls.push(url);
					resolve(null);
					//reject("404/500: " + url);
				}
				else if (this.status == 200) {
					resolve(this.responseText);
				}
				else if (this.status == 304) {
					debugger
				}
			};

			xhr.ontimeout = function (e) {
				// XMLHttpRequest 超时。在此做某事。
				resolve(null);
			};

			xhr.send();
		});
	}
}
ResourceManager.failed_urls = [];

/**
 * @param {string} url
 * @returns {Promise<any>}
 */
let $get = function (url) {
	return ResourceManager.get(url);
}
/**
 * @param {string} url
 * @returns {Promise<any>}
 */
$get.pack = function (url) {
	return ResourceManager.get(`/pack${url}`);
}
/**
 * @param {string} url
 * @returns {Promise<any>}
 */
$get.data = function (url) {
	return ResourceManager.get(`/data${url}`);
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
	"RequiredJobs": [
		"Beginner"
	],
	"RequiredLevel": 0,
	"IsCash": true,
	"Name": "Blue Beanie",
	"Desc": null,
	"Id": 1000000,
	"RequiredGender": 0,
	"TypeInfo": {
		"OverallCategory": "Equip",
		"Category": "Armor",
		"SubCategory": "Hat"
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
		raw = ResourceManager._external_raw = JSON.parse(await $get("/equip"));
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
		try {
			let item = raw[i];
			let id = String(item.Id).padStart(8, "0");

			if (!(item.TypeInfo && ItemTypeInfo[item.TypeInfo.OverallCategory])) {
				continue;
			}

			let clz = item.TypeInfo.OverallCategory.toLowerCase();
			let cate = ItemTypeInfo[item.TypeInfo.OverallCategory][item.TypeInfo.SubCategory];
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
				name: item.Name,
				desc: item.Desc,
				cash: item.IsCash ? 1 : 0,
				icon: {
					"": `//labs.maplestory.io/api/gms/latest/item/${item.Id}/icon`,
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
