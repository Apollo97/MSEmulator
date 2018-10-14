
class ItemCategoryInfo {
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
			//TODO: return path, not url
			return info.dataDir + id + "/" + info.iconRawPath;
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
			//TODO: return path, not url
			return info.dataDir + id + "/" + info.iconPath;
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

	/**
	 * @param {string|number} id
	 * @returns {boolean}
	 */
	static isSkin(id) {
		return Math.trunc(id / 10000) == 0;
		//return id.startsWith("0000");
	}

	/**
	 * @param {string|number} id
	 * @returns {boolean}
	 */
	static isBody(id) {
		return Math.trunc(id / 10000) == 0;
		//return id.startsWith("0000");
	}

	/**
	 * @param {string|number} id
	 * @returns {boolean}
	 */
	static isHead(id) {
		return Math.trunc(id / 10000) == 1;
		//return id.startsWith("0000");
	}

	/**
	 * @param {string|number} id
	 * @returns {boolean}
	 */
	static isFace(id) {
		return Math.trunc(id / 10000) == 2;
		//return id.startsWith("0002");
	}

	/**
	 * @param {string|number} id
	 * @returns {boolean}
	 */
	static isHair(id) {
		const i = Math.trunc(id / 10000);
		return i == 3 || i == 4;
		//return id.startsWith("0003") || id.startsWith("0004");
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
	"0000": new ItemCategoryInfo("0000", "", "body", "body", "<body>", "Equip"),
	"0001": new ItemCategoryInfo("0001", "", "head", "head", "<head>", "Equip"),

	"0002": new ItemCategoryInfo("0002", "Face", "Face", "face", "臉型", "Equip"),
	"0003": new ItemCategoryInfo("0003", "Hair", "Hair", "hair", "髮型", "Equip"),
	"0004": new ItemCategoryInfo("0004", "Hair", "Hair", "hair", "髮型", "Equip"),

	"0100": new ItemCategoryInfo("0100", "Cap", "Cap", "cap", "帽子", "Equip"),
	"0101": new ItemCategoryInfo("0101", "Accessory", "accessoryFace", "accessoryFace", "臉飾", "Equip"),
	"0102": new ItemCategoryInfo("0102", "Accessory", "accessoryEyes", "accessoryEyes", "眼飾", "Equip"),
	"0103": new ItemCategoryInfo("0103", "Accessory", "accessoryEars", "accessoryEars", "耳環", "Equip"),
	"0104": new ItemCategoryInfo("0104", "Coat", "Coat", "coat", "上衣", "Equip"),
	"0105": new ItemCategoryInfo("0105", "Longcoat", "Longcoat", "longcoat", "套服", "Equip"),
	"0106": new ItemCategoryInfo("0106", "Pants", "Pants", "pants", "褲子", "Equip"),
	"0107": new ItemCategoryInfo("0107", "Shoes", "Shoes", "shoes", "鞋子", "Equip"),
	"0108": new ItemCategoryInfo("0108", "Glove", "Glove", "glove", "手套", "Equip"),
	"0109": new ItemCategoryInfo("0109", "Shield", "Shield", "shield", "盾牌", "Equip"),
	"0110": new ItemCategoryInfo("0110", "Cape", "Cape", "cape", "披風", "Equip"),

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


/** @type {Map<string,ItemCategoryInfo} */
ItemCategoryInfo.map_slot_to_info = (function () {
	/** @type {Map<string,ItemCategoryInfo} */
	const map = new Map();
	Object.values(ItemCategoryInfo._info).forEach(info => {
		map.set(info.slot, info);
	});
	return map;
})();


class EquipSlotsMap {
	/**
	 * @param {string} equipType
	 * @param {number} slotId
	 * @returns {string} slotName
	 */
	static toName(equipType, slotId) {
		return EquipSlotsMap.slots_to_name_map[equipType][slotId];
	}
	/**
	 * @param {string} equipType
	 * @param {ItemCategoryInfo} info
	 * @returns {number} slotId
	 */
	static infoToSlot(equipType, info) {
		return EquipSlotsMap.map_slots_to_typeInfo[equipType].get(info);
	}
	/**
	 * @param {string} equipType
	 * @param {string} itemId
	 * @returns {number} slotId
	 */
	static itemIdToSlot(equipType, itemId) {
		let info = ItemCategoryInfo.get(itemId);
		return EquipSlotsMap.map_slots_to_typeInfo[equipType].get(info);
	}
	/**
	 * @param {string} equipType
	 * @param {string} slotName
	 * @returns {number} slotId
	 */
	static toSlot(equipType, slotName) {
		return EquipSlotsMap.name_to_slots_map[equipType][slotName];
	}
}

EquipSlotsMap.slots_to_name_map = {
	Equip: {
		1: "cap",
		2: "accessoryFace",
		3: "accessoryEyes",
		4: "accessoryEars",
		5: "coat",
		5: "longcoat",
		6: "pants",
		7: "shoes",
		8: "glove",
		9: "cape",
		10: "shield",
		11: "weapon",
	},
	Cash: {
	},
}
Object.keys(EquipSlotsMap.slots_to_name_map.Equip).forEach(slot => {
	EquipSlotsMap.slots_to_name_map.Cash[Number(slot) + 100] = EquipSlotsMap.slots_to_name_map.Equip[slot];
});

EquipSlotsMap.map_slots_to_typeInfo = {
};
Object.entries(EquipSlotsMap.slots_to_name_map).forEach(([slotTypeName, slots]) => {
	const sti = ItemCategoryInfo.map_slot_to_info;
	const typedSlots = EquipSlotsMap.map_slots_to_typeInfo[slotTypeName] = new Map();

	Object.entries(slots).forEach(function ([slotId, slotName]) {
		const info = sti.get(slotName);
		typedSlots.set(info, slotId);
	})
});

EquipSlotsMap.name_to_slots_map = {
};
Object.entries(EquipSlotsMap.slots_to_name_map).forEach(([slotTypeName, slots]) => {
	const sti = ItemCategoryInfo.map_slot_to_info;
	const typedSlots = EquipSlotsMap.name_to_slots_map[slotTypeName] = {};

	Object.entries(slots).forEach(function ([slotId, slotName]) {
		const info = sti.get(slotName);
		typedSlots[info.slot] = slotId;
	})
});


module.exports = {
	ItemCategoryInfo,
	EquipSlotsMap,
};
