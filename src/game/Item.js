
import { ItemCategoryInfo } from "../../public/javascripts/resource.js";

import { Sprite } from "./Sprite";

import { KeySlotData } from "../ui/Basic/KeySlotData.js";


/** @type {$ItemRawData} */
let _loadedItem = {};

window.$loadedItem = _loadedItem;


class $ItemRawData {
	constructor() {
	}
}


//class ItemInfo {
//	/**
//	 * @param {{}} _rawInfo
//	 */
//	constructor(_raw) {
//		this.icon = new Sprite(_raw.icon);
//		this.iconRaw = new Sprite(_raw.iconRaw);
//	}
//
//	/**
//	 * @param {string} itemId
//	 * @returns {Promise<Sprite[]>}
//	 */
//	load(itemId, loadSprite = false) {
//		let url = ItemCategoryInfo.getIconUrl(itemId);
//		let rawUrl = ItemCategoryInfo.getIconRawUrl(itemId);
//
//		this.icon._url = url;
//		this.iconRaw._url = rawUrl;
//
//		// 目前用不到 Sprite
//		// UI 只會用到 _raw, Image
//
//		if (loadSprite) {
//			//manual load
//			this.icon.__loadTexture();
//			this.iconRaw.__loadTexture();
//
//			return Promise.all([this.icon.$promise, this.iconRaw.$promise]);
//		}
//	}
//}

const SLOT_EQUIP = 0;
const SLOT_COS = 1;
const SLOT_ETC = 2;
const SLOT_INS = 3;
const SLOT_CASH = 4;

const TYPE_TO_SLOT_MAP = [
	SLOT_EQUIP, SLOT_EQUIP, SLOT_COS, SLOT_INS, SLOT_ETC, SLOT_CASH
];

export class ItemBase {
	/**
	 * @param {string} itemId
	 * @param {{}} _raw
	 */
	constructor(itemId, _raw) {
		//this.assign(this, _raw);

		/**
		 * @readonly
		 * @type {Object}
		 */
		this._raw = null;

		/**
		 * @readonly
		 * @type {string}
		 */
		this.id = null;

		Object.defineProperties(this, {
			"_raw": {
				value: _raw
			},
			"id": {
				value: itemId
			}
		});
	}

	getSlot() {
		return TYPE_TO_SLOT_MAP[this.id[1]];
	}
}

export class ItemEquip extends ItemBase {
}

export class ItemConsume extends ItemBase {
}

export class ItemEtc extends ItemBase {
}

export class ItemInstall extends ItemBase {
}

export class ItemCash extends ItemBase {
	getSlot() {
		if (this.id == 7) {
			return TYPE_TO_SLOT_MAP[this.id[0]];
		}
		else {
			return TYPE_TO_SLOT_MAP[this.id[1]];
		}
	}
}

/**
 * 自訂道具
 * @template T
 * @param {string} itemId
 * @param {...Partial<T>} props
 * @returns {Promise<T>}
 */
function _createItemSync(itemId, ...props) {
	let itemPrototype = _loadedItem[itemId];
	if (!itemPrototype) {
		throw new TypeError();
	}

	/** @type {string} - 1 digit */
	let typeId = itemId[1];

	/** @type {ItemEquip | ItemConsume | ItemEtc | ItemInstall | ItemCash} */
	let _itemType;

	switch (typeId) {
		case '0':
			_itemType = ItemEquip;
			break;
		default:
			throw new Error("未完成");
			return null;
	}

	let item = new _itemType(itemId, itemPrototype);

	if (props && props.length) {
		Object.assign(item, ...props);
	}

	return item;
}

/**
 * 載入道具
 * @template T
 * @param {string} itemId
 * @param {...Partial<T>} props
 * @returns {Promise<T>}
 */
export async function $createItem(itemId, ...props) {
	if (itemId.length == 7 && itemId[0] == 5) {
		throw new Error("未完成 pet");
	}
	/** @type {string} - 1 digit */
	let typeId = itemId[1];

	/** @type {ItemEquip | ItemConsume | ItemEtc | ItemInstall | ItemCash} */
	let _itemType;

	switch (typeId) {
		case "0":
			if (!$gv.m_editor_mode) {
				throw new Error("$gv.m_editor_mode: %o" + $gv.m_editor_mode);
			}
		case "1":
			_itemType = ItemEquip;
			break;
		case "2":
			console.error("未完成 ItemConsume");
			_itemType = ItemConsume;
			break;
		case "3":
			//TODO: ItemInstall
			_itemType = ItemInstall;
			break;
		case "4":
			console.error("未完成 ItemEtc");
			_itemType = ItemEtc;
			break;
		case "5":
			console.error("未完成 ItemCash");
			_itemType = ItemCash;
			break;
		default:
			throw new Error("?? typeId: " + typeId);
			return null;
	}

	let itemPrototype;
	try {
		itemPrototype = await ItemCategoryInfo.getItem(itemId);// raw
	}
	catch (ex) {
		throw ex;
	}
	if (!itemPrototype) {
		console.warn("item not exist: " + itemId);
		return null;
	}
	_loadedItem[itemId] = itemPrototype;

	let item = new _itemType(itemId, itemPrototype);

	if (props && props.length) {
		//TODO: deep copy
		Object.assign(item, ...props);
	}

	return item;
}


export class ItemSlot extends KeySlotData {
	/**
	 * @template T
	 * @param {number} itemSlot
	 * @param {number} itemSN
	 * @param {T extends ItemBase ? T : never} itemData
	 * @param {number} amount
	 */
	constructor(itemSlot, itemSN, itemData, amount) {
		super();

		this.SN = itemSN;
		this.slot = itemSlot;
		this.amount = amount;
		
		/**
		 * @private
		 * @type {ItemEquip | ItemConsume | ItemEtc | ItemInstall | ItemCash} - item props
		 */
		this.data = itemData;
	}
	
	/**
	 * @template T
	 * @param {number} itemSlot
	 * @param {number} itemSN
	 * @param {T extends ItemBase ? T : never} itemData
	 * @param {number} amount
	 */
	assign(itemSlot, itemSN, itemData, amount) {
		this.SN = itemSN;
		this.slot = itemSlot;
		this.amount = amount;

		this.data = itemData;
	}

	_clear() {
		this.data = null;
		this.amount = 0;
	}

	isEmpty() {
		if (process.env.NODE_ENV !== 'production') {
			if ((!this.data && this.amount) || (this.data && !this.amount)) {
				debugger;
			}
		}
		return !this.data && !this.amount;
	}

	getData() {
		return this.data;
	}

	/**
	 * @param {ItemEquip | ItemConsume | ItemEtc | ItemInstall | ItemCash} data
	 */
	setData(data) {
		this.data = data;
	}

	/**
	 * @param {string} text
	 */
	static parse(text) {
		if (text.__proto__ == String.prototype) {
			let iSlot = new ItemSlot();
			let o = JSON.parse(text);
			//iSlot.SN = o.SN;
			//iSlot.slot = o.slot;
			//iSlot.amount = o.amount;
			//iSlot.itemId = o.itemId;
			Object.assign(iSlot, o);
			return iSlot;
		}
		throw new TypeError();
	}
}
