
import { CharacterRenderConfig, ResourceManager } from "../../../public/javascripts/resource.js";
import { ItemCategoryInfo } from "../../Common/ItemCategoryInfo.js";
import { AddInitTask } from "../../init.js";
import { Animation } from "../Animation";
import { engine } from "../Engine.js";
import { IRenderer, ImageFilter } from "../IRenderer.js";
import { Sprite, SpriteBase } from "../Sprite.js";
import { Rectangle, Vec2 } from "../math.js";
import { ActionAnimation } from "./CharacterActionAnimation.js";


let zMap = {};
let sMap = {};


/**
 * 00026623.blink[1].brow has bug
 * 'Weapon/01702694' is Longcoat(islot)
 * how to use cash-weapon (ex: 01702504|0152)
 */

/**
 * multi-image-sprite
 */
class FragmentTexture extends SpriteBase {
	/**
	 * @param {wzproperty} raw
	 * @param {string} full_path
	 */
	constructor(raw, full_path) {
		super(raw, full_path);

		if (this._raw.origin) {
			this._raw.origin.__proto__ = Vec2.prototype;
		}

		for (let i in this._raw.map) {
			this._raw.map[i].__proto__ = Vec2.prototype;
		}

		/**
		 * if this.relative == null then remove this
		 * @type {Vec2}
		 */
		this.relative = new Vec2(0, 0);
		
		this.calcRelative = this._calcRelative;//this._getRelativeFunction();//this.__old_calcRelative;//

		this.filter = new ImageFilter();
		this.opacity = 1;

		/** @type {boolean} */
		this.visible = true;


		/** @type {string} - extra property. */
		this._slot = null;

		/** @type {string} - extra property. 在哪個部位 */
		this._place = null;

		/** @type {string} - extra property: _slot itemId, _place, _raw.z z */
		this.classList = null;
	}

	/**
	 * @override
	 * @returns {number}
	 */
	get z() {
		return zMap[this._raw.z] || 1;
	}
	set z(not_value) {
		console.error("Not implement");
	}

	/**
	 * @override
	 * @returns {number}
	 */
	get order() {
		debugger;
		return this.z;
	}
	set order(not_value) {
		debugger;
		console.error(new TypeError("Not implement"));
	}

	/** @returns {Vec2} */
	get origin() { return this._raw.origin || Vec2.empty; }

	isHasAnchor() { return !!this._raw.map; }

	/** @returns {Vec2} */
	get brow() { return this._raw.map.brow; }
	isAnchorBrow() { return !!this._raw.map.brow; }

	/** @returns {Vec2} */
	get neck() { return this._raw.map.neck; }
	isAnchorNeck() { return !!this._raw.map.neck; }

	/** @returns {Vec2} */
	get navel() { return this._raw.map.navel; }
	isAnchorNavel() { return !!this._raw.map.navel; }

	/** @returns {Vec2} */
	get hand() { return this._raw.map.hand; }
	isAnchorHand() { return !!this._raw.map.hand; }

	/** @returns {Vec2} */
	get handMove() { return this._raw.map.handMove; }
	isAnchorHandMove() { return !!this._raw.map.handMove; }


	/** @returns {Vec2} */
	get _earBelowHead() { return this._raw.map.earBelowHead; }
	isAnchor_EarBelowHead() { return !!this._raw.map.earBelowHead; }

	/** @returns {Vec2} */
	get _earOverHead() { return this._raw.map.earOverHead; }
	isAnchor_EarOverHead() { return !!this._raw.map.earOverHead; }

	/**
	 * @param {FragmentTexture} that - this
	 * @param {FragmentTexture} base - parent
	 * @param {string} anchor - anchor name
	 * @returns {Vec2}
	 */
	_anchor(that, base, anchor) {
		return base[anchor].minus(that[anchor]).plus(base.origin.minus(that.origin));
	}

	/**
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelative(chara, body, head) {
		this.calcRelative = this._getRelativeFunction(chara);
		return this.calcRelative(chara, body, head);
	}
	/**
	 * @param {CharacterAnimationBase} chara
	 * @returns {Vec2}
	 */
	_getRelativeFunction(chara) {
		if (!this.isHasAnchor()) {
			return this._calcRelativeEmpty;
		}
		if (this.isAnchorNeck()) {
			return this._calcRelative_neck;
		}
		if (this.isAnchorBrow()) {
			return this._calcRelative_brow;
		}
		if (this.isAnchorNavel()) {
			if (this == chara.slots.body) {
				return this._getOrigin;
			}
			return this._calcRelative_navel;
		}
		if (this.isAnchorHand()) {
			return this._calcRelative_hand;
		}
		if (this.isAnchorHandMove()) {
			if (this._url.lastIndexOf("lHand") > 0) {
				return this._calcRelative_handMove_lHand;
			}
			return this._calcRelative_handMove;
		}
	}
	/**
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelativeEmpty(chara, body, head) {
		return Vec2.empty;
	}
	/**
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_getOrigin(chara, body, head) {
		return this.origin;
	}
	/**
	 * neck on the navel
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelative_neck(chara, body, head) {
		return this._anchor(this, body, "neck").minus(body.origin);
	}
	/**
	 * brow on the head & head on the neck & neck on the navel
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelative_brow(chara, body, head) {
		return this._anchor(this, head, "brow").plus(this._anchor(head, body, "neck")).minus(body.origin);//anchor_brow+(-7,-33)
	}
	/**
	 * this is origin point, no anchor
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelative_navel(chara, body, head) {
		return body.navel.minus(this.navel).minus(this.origin);
	}
	/**
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelative_hand(chara, body, head) {
		const hand = chara.slots.body.fragments.arm.getTexture(chara);
		if (hand == null) {
			return Vec2.empty.minus(this.hand).minus(this.origin).minus(body.origin);
			return null;
		}
		return this._anchor(this, hand, "hand").minus(this._anchor(body, hand, "navel")).minus(body.origin);
	}
	/**
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelative_handMove(chara, body, head) {
		return Vec2.empty.minus(this.origin).minus(this.handMove);
	}
	/**
	 * @param {CharacterAnimationBase} chara
	 * @param {FragmentTexture} body
	 * @param {FragmentTexture} [head]
	 * @returns {Vec2}
	 */
	_calcRelative_handMove_lHand(chara, body, head) {
		return Vec2.empty.minus(this.origin);
	}
	

	/**
	 * @param {CharacterAnimationBase} chara
	 */
	update(chara) {
		if (chara.slots.body && chara.slots.head) {
			const body = chara.slots.body.fragments.body.getTexture(chara);
			const head = chara.slots.head.fragments.head.getTexture(chara);
			if (body && head) {
				this.relative = this.calcRelative(chara, body, head);

				const tamingMob = chara.slots.tamingMob;
				if (tamingMob) {
					this.relative = tamingMob.adj_pos(this.relative, body, chara);
				}
			}
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {CharacterAnimationBase} chara
	 */
	render(renderer, chara) {
		if (!(this.relative && this.visible)) {
			return;
		}
		const x = this.relative.x;
		const y = this.relative.y;

		renderer.globalAlpha = this.opacity;
		if (this.filter.isEmpty) {
			renderer.drawGraph2(this, x, y);
		}
		else {
			renderer.ctx.filter = this.filter.toString();
			renderer.drawGraph2(this, x, y);
			renderer.ctx.filter = "none";
		}
	}
}

class BodyFragmentTexture extends FragmentTexture {
	/**
	 * @param {CharacterAnimationBase} chara
	 */
	update(chara) {
		super.update(chara);
		this.visible = !chara.hideBody;
	}
}

class HairFragmentTexture extends FragmentTexture {
	constructor(...args) {
		super(...args);

		/** @type {HairFragmentTexture} */
		this.graph2 = null;

		/** @type {HairFragmentTexture} */
		this.graph3 = null;
	}

	/**
	 * @param {CharacterAnimationBase} chara
	 */
	update(chara) {
		if (chara.slots.body && chara.slots.head) {
			const body = chara.slots.body.fragments.body.getTexture(chara);
			const head = chara.slots.head.fragments.head.getTexture(chara);
			if (body && head) {
				this.relative = this.calcRelative(chara, body, head);

				const tamingMob = chara.slots.tamingMob;
				if (tamingMob) {
					this.relative = tamingMob.adj_pos(this.relative, body, chara);
				}

				if (this.graph2) {
					this.graph2.relative = this.relative;
				}
				if (this.graph3) {
					this.graph3.relative = this.relative;
				}
			}
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {CharacterAnimationBase} chara
	 */
	render(renderer, chara) {
		if (!this.relative) {
			return;
		}

		renderer.globalAlpha = this.opacity || 1;
		if (this.filter.isEmpty) {
			this._render(renderer);
		}
		else {
			renderer.ctx.filter = this.filter.toString();
			this._render(renderer);
			renderer.ctx.filter = "none";
		}
	}
	_render(renderer) {
		const x = this.relative.x;
		const y = this.relative.y;

		renderer.drawGraph2(this, x, y);

		if (this.graph2 && this.graph2.opacity) {//color2
			renderer.globalAlpha = this.graph2.opacity;

			renderer.drawGraph2(this.graph2, x, y);
		}
		if (this.graph3 && this.graph3.opacity) {//color3
			renderer.globalAlpha = this.graph3.opacity;

			renderer.drawGraph2(this.graph3, x, y);
		}
	}
}


class ItemEffectAnimation extends Animation {
	constructor(raw, url) {
		super(raw, url);
		
		Object.defineProperty(this, "_raw", {
			value: raw,
		});

		//this._url = this._url;

		this.__getAttr("z", -1);
		this.__getAttr("pos", 1);

		super.load();
	}
	__getAttr(attr, defVal) {
		if (attr in this._raw) {
			this[attr] = this._raw[attr];
		}
		else {
			this[attr] = defVal;
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {boolean} actionExceptRotation
	 * @param {number} angle
	 * @param {boolean} flip
	 */
	render(renderer, actionExceptRotation, angle, flip) {
		if (actionExceptRotation) {
			this.draw(renderer, 0, 0, -angle, flip);
		}
		else {
			const oy = -this.texture.height * 0.25;
			this.draw(renderer, 0, oy, 0, flip);
		}
	}
}

//	/data/Effect/ItemEff/1102918
class ItemEffect {
	constructor() {
		this._url = null;
		this._raw = null;

		/** @type {{[animationName:string]:ItemEffectAnimation}} */
		this.animation = {};

		this.action = null;
		this.time = 0;
		this.frame = 0;

		this.fixed = 0;
		this.z = -2;
		this.action = 1;
		this.actionExceptRotation = 0;
		
		this.enable = true;
	}

	static async Init() {
		try {
			/** @type {Set<string>} */
			let itemEffectList = ItemEffect._list;

			/** @type {string[]} */
			let raw = await $get.list("/Effect/ItemEff");

			itemEffectList.clear();

			raw.forEach(id => {
				itemEffectList.add(parseInt(id, 10));
			});
		}
		catch (ex) {
			return false;
		}
	}

	/**
	 * if (!exist) return null
	 * @param {string} equipID
	 * @returns {Promise<ItemEffect>}
	 */
	static async load(equipID) {
		const id = Number(equipID);

		if (ItemEffect._list.has(id)) {
			let eff = new ItemEffect();
			await eff.load(equipID);
			return eff;
		}

		return null;
	}

	/**
	 * if (!exist) return null
	 * @param {string} equipID
	 * @returns {Promise<void>}
	 */
	async load(equipID) {
		const id = Number(equipID);
		const url = `/Effect/ItemEff/${id}/effect`;
		let raw;

		try {
			raw = await $get.data(url);
		}
		catch (ex) {
			throw ex;
		}

		if (raw) {
			return this._load(equipID, url, raw);
		}

		return null;
	}

	/**
	 * @param {number} stamp
	 * @param {string} action
	 */
	update(stamp, action) {
		if (action in this.animation) {
			this.action = action;
		}
		else {
			this.action = "default";
		}

		if (this.animation[this.action]) {
			this.animation[this.action].update(stamp);
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {CharacterRenderer} chara
	 */
	render(renderer, chara) {
		if (this.animation && this.animation[this.action]) {
			this.animation[this.action].render(renderer, this.actionExceptRotation, chara.angle, chara.front > 0);
		}
	}

	/**
	 * @param {string} equipID
	 * @param {object} raw_data
	 */
	_load(equipID, url, raw) {
		this.id = equipID;

		if (!raw) {
			debugger;
		}
		//this._url = url;
		Object.defineProperty(this, "_raw", {
			value: raw,
		});

		this.__construct();
	}
	__construct() {
		this.__getAttr("fixed", 0);
		this.__getAttr("z", -1);
		this.__getAttr("action", 1);
		this.__getAttr("actionExceptRotation", 0);

		for (let i in this._raw) {
			if (this._raw[i] && typeof this._raw[i] == "object" && '0' in this._raw[i]) {//animation has frames
				this.animation[i] = new ItemEffectAnimation(this._raw[i], [this._url, i].join("/"));
			}
		}
	}
	__getAttr(attr, defVal) {
		if (attr in this._raw) {
			this[attr] = this._raw[attr];
		}
		else {
			this[attr] = defVal;
		}
	}
}
/** @type {Set<string>} */
ItemEffect._list = new Set();

class CharacterFragmentBase {
	/**
	 * @param {{[action:string]: FragmentTexture[]}} textures
	 */
	constructor(textures) {
		/** @type {{[action:string]: FragmentTexture[]}} - textures[action:string][frame:number] */
		this.textures = textures;
	}

	/**
	 * @virtual
	 * @param {CharacterAnimationBase} chara
	 * @returns {FragmentTexture}
	 */
	getTexture(chara) {
		throw new Error("Not implement");
	}

	/**
	 * @virtual
	 * @param {CharacterAnimationBase} chara
	 * @param {number} frame
	 * @returns {FragmentTexture}
	 */
	getFrameTexture(chara, frame) {
		throw new Error("Not implement");
	}

	/**
	 * @virtual
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		throw new Error("Not implement");
	}
}

/**
 * @final 
 */
class CharacterBodyFragment extends CharacterFragmentBase {
	constructor(textures) {
		super(textures);
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {FragmentTexture}
	 */
	getTexture(chara) {
		return this.getFrameTexture(chara, chara.action_frame);
	}
	
	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @param {number} frame
	 * @returns {FragmentTexture}
	 */
	getFrameTexture(chara, frame) {
		if (!(chara.action in this.textures)) {
			return null;
		}
		let ft = this.textures[chara.action][frame];//if frame not exist then return undefined
		return ft;
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		if (this.textures[chara.action]) {
			return this.textures[chara.action].length;
		}
		return 0;
	}
}

/**
 * @final 
 */
class CharacterFaceFragment extends CharacterFragmentBase {
	constructor(textures) {
		super(textures);
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {FragmentTexture}
	 */
	getTexture(chara) {
		return this.getFrameTexture(chara, chara.emotion_frame);
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @param {number} frame
	 * @returns {FragmentTexture}
	 */
	getFrameTexture(chara, frame) {
		if (!(chara.emotion in this.textures)) {
			return null;
		}
		let ft = this.textures[chara.emotion][frame];
		return ft;
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		if (this.textures[chara.emotion]) {
			return this.textures[chara.emotion].length;
		}
		return 0;
	}
}

/**
 * @final 
 */
class CharacterTamingMobFragment extends CharacterFragmentBase {
	constructor(textures) {
		super(textures);
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {FragmentTexture}
	 */
	getTexture(chara) {
		return this.getFrameTexture(chara, chara.actani.actionFrame);
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @param {number} frame - not sync chara._frame
	 * @returns {FragmentTexture}
	 */
	getFrameTexture(chara, frame) {
		if (!(chara._ride_action in this.textures)) {
			return null;
		}
		let ft = this.textures[chara._ride_action][frame];//if frame not exist then return undefined
		return ft;
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		if (this.textures[chara._ride_action]) {
			return this.textures[chara._ride_action].length;
		}
		return 0;
	}
}

class EquipImageFilter {
	/**
	 * @param {CharacterAppearanceBase} equip
	 */
	constructor(equip) {
		this.equip = equip;
	}

	get hue() {
		const equip = this.equip;
		if (equip) {
			return 0;
		}
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						return ft.filter.hue;
					}
				}
			}
		}
		return 0;
	}
	set hue(value) {
		const equip = this.equip;
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						ft.filter.hue = value;
					}
				}
			}
		}
	}

	get sat() {
		const equip = this.equip;
		if (equip) {
			return 100;
		}
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						return ft.filter.sat;
					}
				}
			}
		}
		return 100;
	}
	set sat(value) {
		const equip = this.equip;
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						ft.filter.sat = value;
					}
				}
			}
		}
	}
	get bri() {
		const equip = this.equip;
		if (equip) {
			return 100;
		}
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						return ft.filter.bri;
					}
				}
			}
		}
		return 100;
	}
	set bri(value) {
		const equip = this.equip;
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						ft.filter.bri = value;
					}
				}
			}
		}
	}

	get contrast() {
		const equip = this.equip;
		if (equip) {
			return 100;
		}
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						return ft.filter.contrast;
					}
				}
			}
		}
		return 100;
	}
	set contrast(value) {
		const equip = this.equip;
		for (let i in equip.fragments) {
			for (let j in equip.fragments[i].textures) {
				for (let k = 0; k < equip.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = equip.fragments[i].textures[j][k];
					if (ft) {
						ft.filter.contrast = value;
					}
				}
			}
		}
	}

	toJSON() {
		return {
			hue: this.hue,
			saturation: fixedNum(this.sat),
			brightness: fixedNum(this.bri),
			contrast: fixedNum(this.contrast),
		};
		function fixedNum(val) {
			return Number((val / 100).toFixed(1));
		}
	}

	/**
	 * @param {{hue: number, saturation: number, brightness: number, contrast: number}} data
	 */
	parse(data) {
		this.hue = Number(data.hue);
		this.sat = Number(data.saturation);
		this.bri = Number(data.brightness);
		this.contrast = Number(data.contrast);
	}
}

/**
 * @interface
 */
class ICharacterAppearanceBase {
	constructor() {
	}

	/**
	 * @virtual
	 */
	isLoaded() {
		return false;
	}

	/**
	 * @virtual
	 */
	_unload() {
	}

	/**
	 * @virtual
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		throw new Error("Not implement");
	}

	/**
	 * @virtual
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getDelay(chara) {
		throw new Error("Not implement");
	}

	/**
	 * @virtual
	 */
	toJSON() {
		throw new Error("Not implement");
		return {
			id: -1,//invalid ID
		};
	}
}

/**
 * ??
 */
class _CharacterAppearanceBaseSlotLink extends ICharacterAppearanceBase {
	constructor(slot_link) {
		super();
		this.slot_link = slot_link;//??
	}

	toJSON() {
		return {
			id: slot_link,//??
		};
	}
}

/**
 * character loader
 */
class CharacterAppearanceBase extends ICharacterAppearanceBase {
	constructor() {
		super();
			
		this._raw = null;

		/** @type {string} */
		//this._url = null;
			
		/** @type {ItemEffect} */
		this.effect = null;

		/**
		 * @type {{[place:string]:CharacterFragmentBase}}
		 */
		this.fragments = null;

		this._onload = null;

		/** @type {string} */
		this.id = null;

		/** @type {ItemCategoryInfo} */
		this.categoryInfo = null;

		/** @type {number} */
		this.slot_order = 0;

		/** @type {object<string, number>} */
		this.islot = {};

		/** @type {object<string, number>} */
		this.vslot = {};

		this.filter = new EquipImageFilter(this);
	}

	/**
	 * @param {string} [animationName] - action animation
	 */
	toJSON(animationName) {
		let region, version;
		if (this._raw.info.__v) {
			const m = this._raw.info.__v.toUpperCase().match(/([A-Z]*)([0-9]*)/);
			region = m[1] == "TWMS" ? "TMS" : m[1];
			version = "latest";//m[2];
		}
		else {
			region = "TMS";
			version = "latest";
		}
		const filter = this.filter;

		let obj = {
			itemId: Number(this.id),
			region: region,
			version: version,
			hue: filter.hue,
			saturation: fixedNum(filter.sat),
			brightness: fixedNum(filter.bri),
			contrast: fixedNum(filter.contrast),
			alpha: Number((this.opacity).toFixed(1)),
		};
		if (animationName) {
			obj.animationName = animationName;
		}
		return obj;

		function fixedNum(val) {
			return Number((val / 100).toFixed(1));
		}
	}

	parse(data) {
		throw new Error();
	}

	isLoaded() {
		return this.fragments != null;
	}

	/** @type {function(CharacterAppearanceBase):void} */
	get _onload() {
		return this.__onload;
	}
	set _onload(func) {
		this.__onload = func;
		if (this.isLoaded()) {
			this.__onload.call(this, this);
		}
	}

	/**
	 * @param {string} url
	 * @param {string} id
	 * @param {ItemCategoryInfo} cateInfo
	 * @param {void} use_category - no use
	 * @returns {Promise<boolean>} - true if item exist
	 */
	async load(url, id, cateInfo, use_category) {
		let raw;

		this.id = id;
		this.categoryInfo = cateInfo;
		
		try {
			if (ResourceManager.isEquipExist(id, cateInfo)) {
				raw = await ResourceManager.getItem(id);
			}
		}
		catch (ex) {
			throw ex;
		}
		
		try {
			if (!raw && load_extern_item_data) {
				raw = await load_extern_item_data(id);
			}
		}
		catch (ex) {
			throw ex;
		}

		//this._url = url;
		Object.defineProperty(this, "_raw", {
			value: raw,
		});

		this.__load_slot();

		this.__load_fragments();

		if (this._onload) {
			this._onload.call(this, this);
		}

		//// if not body, head, face, hair then try load effect
		//if (id >= "00050000") {
			// load if exist
			ItemEffect.load(this.id).then(a => this.effect = a);//01102918	//01102915
		//}

		return true;
	}
	__load_fragments() {
		const FragmentConstructor = this.FragmentConstructor;

		//Object.keys(this._raw_textures).map(k => { return '0' in this._raw_textures[k]; })

		let action_list = Object.keys(this._raw_textures);

		let textures = {};
		for (let action of action_list) {
			if (typeof this._raw_textures[action] == "object" && "0" in this._raw_textures[action]) {
				let _url = this._base_path + action;

				textures[action] = this.__load_frame_textures(this._raw_textures[action], _url);
			}
		}

		let fragment_textures = {};
		for (let action in textures) {
			for (let frame in textures[action]) {
				for (let place in textures[action][frame]) {
					if (!(place in fragment_textures)) {
						fragment_textures[place] = {};
						//fragment_textures[place].visible = true;
					}
					if (!(action in fragment_textures[place])) {
						fragment_textures[place][action] = [];
					}
					fragment_textures[place][action][frame] = textures[action][frame][place];
				}
			}
		}

		let fragments = {};
		for (let frag in fragment_textures) {
			fragments[frag] = new FragmentConstructor(fragment_textures[frag]);
		}
		this.fragments = fragments;
	}
	/**
	 * @param {string} _url
	 * @returns {{[place:string]:FragmentTexture}[]} - array - textures[frame][place]
	 */
	__load_frame_textures(_raw, _url) {
		let textures = [];
		for (let frame = 0; frame in _raw; ++frame) {
			let url = `${_url}/${frame}`;
			textures[frame] = this.__load_place_textures(_raw[frame], url);
		}
		return textures;
	}
	/**
	 * @param {string} _url
	 * @returns {{[place:string]:FragmentTexture}} - object - textures[place]
	 */
	__load_place_textures(_raw, _url) {
		let textures = {};
		for (let place in _raw) {
			let path = `${_url}/${place}`;
			let raw = _raw[place];

			if (raw) {
				/** @type {FragmentTexture} */
				const FragmentTextureConstructor = this.FragmentTextureConstructor;
				let ft;
				if (raw[""] == "") {
					ft._url = path;
					//ft._url = path;
					textures[place] = ft
				}
				else if (typeof raw[""] == 'string') {
					ft = new FragmentTextureConstructor(raw);
					//ft._url = raw[""];
					textures[place] = ft;
				}
				else if (place == "hairShade") {
					ft = new FragmentTextureConstructor(raw[0]);
					//ft._url = path + "/0";
					textures[place] = ft;
				}
				if (ft) {
					ft._slot = this.categoryInfo.slot;
					ft._place = place;

					ft.classList = [
						ft._slot,
						"item" + this.id,
						ft._place,
						ft._raw.z,
						'z' + ft.z
					].join(' ');
				}
			}
		}
		return textures;
	}
	__load_slot() {
		if (!this._raw.info.islot) {
			debugger;
			return;
		}
		let islots = this._raw.info.islot.match(/([A-Z][a-z0-9])/g);
		for (let i in islots) {
			const slot = islots[i];
			const slot_order = zMap[slot];
			this.islot[slot] = slot_order;
				
			if (slot_order > this.slot_order) {//this.slot_order = Math.max(this.slot_order, slot_order);
				this.slot_order = slot_order;
			}
		}

		let vslots = this._raw.info.vslot.match(/([A-Z][a-z0-9])/g);
		for (let i in vslots) {
			const slot = vslots[i];
			this.vslot[slot] = slot;
		}
	}

	_unload() {
		this.fragments = null;
		this.effect == null;
	}


	/**
	 * @param {Partial<{opacity:number,hue:number,sat:number,bri:number,contrast:number}>} option
	 */
	set(option) {
		const { opacity = 1, hue = 0, sat = 100, bri = 100, contrast = 100 } = option;
		this.opacity = opacity;
		this.filter.hue = hue;
		this.filter.sat = sat;
		this.filter.bri = bri;
		this.filter.contrast = contrast;
	}

	
	/**
	 * @returns {number}
	 */
	get opacity() {
		for (let i in this.fragments) {
			for (let j in this.fragments[i].textures) {
				for (let k = 0; k < this.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = this.fragments[i].textures[j][k];
					if (ft) {
						return ft.opacity;
					}
				}
			}
		}
		return 1;
	}
	/**
	 * @param {number} opacity
	 */
	set opacity(opacity) {
		for (let i in this.fragments) {
			for (let j in this.fragments[i].textures) {
				for (let k = 0; k < this.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = this.fragments[i].textures[j][k];
					if (ft) {
						ft.opacity = opacity;
					}
				}
			}
		}
	}

	/**
	 * @param {number} hue 0 ~ 360
	 * @param {number} sat 0 ~ 100
	 * @param {number} bri 0 ~ 100
	 */
	setFilter(hue, sat, bri) {
		for (let i in this.fragments) {
			for (let j in this.fragments[i].textures) {
				for (let k = 0; k < this.fragments[i].textures[j].length; ++k) {
					/** @type {FragmentTexture} */
					let ft = this.fragments[i].textures[j][k];
					if (ft) {
						ft.filter.hue = hue;
						ft.filter.sat = sat;
						ft.filter.bri = bri;
					}
				}
			}
		}
	}

	/**
	 * get icon url
	 * @see {@link ItemCategoryInfo.getIconUrl}
	 * @returns {string}
	 */
	getIconUrl() {
		const icon = this._raw.info.icon;
		if (icon) {
			return icon[""];
		}
		else {
			debugger;
			return ItemCategoryInfo.getIconUrl(this.id);
		}
	}

	/**
	 * get iconRaw url
	 * @see {@link ItemCategoryInfo.getIconRawUrl}
	 * @returns {string}
	 */
	getIconRawUrl() {
		const iconRaw = this._raw.info.iconRaw;
		if (iconRaw) {
			return iconRaw[""];
		}
		else {
			debugger;
			return ItemCategoryInfo.getIconRawUrl(this.id);
		}
	}

	/**
	 * @virtual
	 * @type {string}
	 */
	get _animation_type() {
		throw new Error("Not Implement");
	}

	/**
	 * @virtual
	 * @returns {typeof CharacterFragmentBase}
	 */
	get FragmentConstructor() {
		throw new Error("Not implement");
	}

	/**
	 * @virtual
	 * @returns {typeof FragmentTexture}
	 */
	get FragmentTextureConstructor() {
		throw new Error("Not implement");
	}

	/**
	 * @returns {{[actions:string]:{["0"]:Sprite,[frames:string]:Sprite}}} raw_textures[...actions][...frames][...fragments]
	 */
	get _raw_textures() {
		return this._raw;
	}

	get _base_path() {
		return this._url;
	}
}

/**
 * @abstract
 */
class CharacterAppearance extends CharacterAppearanceBase {
	constructor() {
		super();
	}
	//__is_texture(k) {
	//	return (!(k == "face" || k == "delay" || k == "default"));
	//}

	/**
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		return chara.slots.body.fragments.body.textures[chara.action].length;
	}

	/**
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getDelay(chara) {
		const d = this._raw[chara.action][chara.action_frame].delay;
		if (Number.isSafeInteger(d)) {
			return d;
		}
		return 120;
	}
}

class CharacterBody extends CharacterAppearance {
	constructor() {
		super();
	}

	get _animation_type() {
		return "action";
	}

	/**
	 * @override
	 * @returns {typeof CharacterBodyFragment}
	 */
	get FragmentConstructor() {
		return CharacterBodyFragment;
	}

	/**
	 * @override
	 * @returns {typeof BodyFragmentTexture}
	 */
	get FragmentTextureConstructor() {
		return BodyFragmentTexture;
	}
}

class CharacterEquip extends CharacterAppearance {
	constructor() {
		super();
	}

	get _animation_type() {
		return "action";
	}

	/**
	 * @override
	 * @returns {typeof CharacterBodyFragment}
	 */
	get FragmentConstructor() {
		return CharacterBodyFragment;
	}

	/**
	 * @override
	 * @returns {typeof BodyFragmentTexture}
	 */
	get FragmentTextureConstructor() {
		return BodyFragmentTexture;
	}
}

class CharacterEquipCashWeapon extends CharacterEquip {
	constructor() {
		super();
		this.use_category = null;
	}

	/**
	 * @param {string} url
	 * @param {string} id
	 * @param {ItemCategoryInfo} cateInfo
	 * @param {string} use_category - cash-weapon as [category]
	 * @returns {Promise<boolean>} - true if item exist
	 */
	async load(url, id, cateInfo, use_category) {
		if (!use_category && use_category != "") {
			throw new TypeError("use_category");
		}

		this.use_category = use_category.slice(2, 4);

		return super.load(url, id, cateInfo);
	}

	get _animation_type() {
		return "action";
	}

	/**
	 * @override
	 * @returns {typeof CharacterBodyFragment}
	 */
	get FragmentConstructor() {
		return CharacterBodyFragment;
	}

	/**
	 * @returns {object} raw_textures[...actions][...frames][...fragments]
	 */
	get _raw_textures() {
		return this._raw[this.use_category];
	}

	get _base_path() {
		return this._url + this.use_category;
	}
}


class CharacterHeadBase extends CharacterAppearance {
	constructor() {
		super();
	}

	get _animation_type() {
		return "action";
	}

	/**
	 * @override
	 * @returns {typeof CharacterBodyFragment}
	 */
	get FragmentConstructor() {
		return CharacterBodyFragment;
	}

	/**
	 * @override
	 * @returns {typeof FragmentTexture}
	 */
	get FragmentTextureConstructor() {
		return FragmentTexture;
	}
}

class CharacterHead extends CharacterHeadBase {
	constructor() {
		super();
		this.elfEarFragment = null;
		this.lefEarFragment = null;
		this.highlefEarFragment = null;
	}
	__load_fragments() {
		super.__load_fragments()
		
		if (this.fragments) {
			if (this.fragments.ear) {
				this.elfEarFragment = this.fragments.ear;
				delete this.fragments.ear;
			}
			if (this.fragments.lefEar) {
				this.lefEarFragment = this.fragments.lefEar;
				delete this.fragments.lefEar;
			}
			if (this.fragments.highlefEar) {
				this.highlefEarFragment = this.fragments.highlefEar;
				delete this.fragments.highlefEar;
			}
		}
	}
	get elfEar() {
		return this.fragments.ear != null;
	}
	set elfEar(value) {
		if (!this.elfEarFragment) {
			return;
		}
		if (value) {
			this.fragments.ear = this.elfEarFragment;
		}
		else {
			delete this.fragments.ear;
		}
	}

	get lefEar() {
		return this.fragments.lefEar != null;
	}
	set lefEar(value) {
		if (!this.lefEarFragment) {
			return;
		}
		if (value) {
			this.fragments.lefEar = this.lefEarFragment;
		}
		else {
			delete this.fragments.lefEar;
		}
	}

	get highlefEar() {
		return this.fragments.highlefEar != null;
	}
	set highlefEar(value) {
		if (!this.highlefEarFragment) {
			return;
		}
		if (value) {
			this.fragments.highlefEar = this.highlefEarFragment;
		}
		else {
			delete this.fragments.highlefEar;
		}
	}

	get _animation_type() {
		return "action";
	}

	/**
	 * @override
	 * @returns {typeof CharacterBodyFragment}
	 */
	get FragmentConstructor() {
		return CharacterBodyFragment;
	}
}

class CharacterHair extends CharacterHeadBase {
	constructor() {
		super();
	}

	get _animation_type() {
		return "action";
	}

	/**
	 * @override
	 * @returns {typeof CharacterBodyFragment}
	 */
	get FragmentConstructor() {
		return CharacterBodyFragment;
	}

	/**
	 * hair color mix
	 * @override
	 * @returns {typeof HairFragmentTexture}
	 */
	get FragmentTextureConstructor() {
		return HairFragmentTexture;
	}
}

class CharacterFaceBase extends CharacterHeadBase {
	constructor() {
		super();
	}
	//__is_texture(k) {
	//	return (!(k == "delay" || k == "default"));
	//}

	/**
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		return chara.slots.face.fragments.face.textures[chara.emotion].length;
	}

	/**
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getDelay(chara) {
		const d = this._raw[chara.emotion][chara.emotion_frame].delay;
		if (d != null) {//!isNaN(d) && isFinite(d)
			return d;
		}
		return 60;
	}
}
class CharacterFace extends CharacterFaceBase {
	constructor() {
		super();
	}

	get _animation_type() {
		return "emotion";
	}

	/**
	 * @override
	 * @returns {typeof CharacterFaceFragment}
	 */
	get FragmentConstructor() {
		return CharacterFaceFragment;
	}
}
class CharacterFaceAcc extends CharacterFaceBase {
	constructor() {
		super();
	}

	get _animation_type() {
		return "emotion";
	}

	/**
	 * @override
	 * @returns {typeof CharacterFaceFragment}
	 */
	get FragmentConstructor() {
		return CharacterFaceFragment;
	}
}

class CharacterTamingMob extends CharacterAppearance {
	constructor() {
		super();
	}

	/**
	 * @returns {number}
	 */
	get type() {
		return this._raw.info.tamingMob;
	}

	get actionMap() {
		return this._raw.characterAction;
	}

	get emotionMap() {
		return this._raw.characterEmotion;
	}

	/**
	 * @param {Vec2} relative
	 * @param {FragmentTexture} body
	 * @param {CharacterAnimationBase} chara
	 * @returns {Vec2}
	 */
	adj_pos(relative, body, chara) {
		const frag = this.fragments[0];//default
		if (frag) {
			const tm = frag.getTexture(chara);
			if (tm) {
				return relative.plus(tm.navel.minus(body.navel));
			}
		}
		return relative;
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getFrameCount(chara) {
		return chara.slots.body.fragments.body.textures[chara._ride_action].length;
	}

	/**
	 * @override
	 * @param {CharacterAnimationBase} chara
	 * @returns {number}
	 */
	getDelay(chara) {
		const d = Math.trunc(this._raw[chara._ride_action][chara.action_frame].delay);//?? _ride_action_frame => action_frame
		if (Number.isSafeInteger(d)) {
			return d;
		}
		return 120;
	}

	get _animation_type() {
		return "_ride_action";
	}

	/**
	 * @override
	 * @returns {typeof CharacterTamingMobFragment}
	 */
	get FragmentConstructor() {
		return CharacterTamingMobFragment;
	}

	/**
	 * @override
	 * @returns {typeof FragmentTexture}
	 */
	get FragmentTextureConstructor() {
		return FragmentTexture;
	}
}


ItemCategoryInfo._info['0000'].FragmentType = CharacterBody;		//	body			-> CharacterBody
ItemCategoryInfo._info['0001'].FragmentType = CharacterHead;		//	elfEar			-> CharacterHeadBase -> CharacterHead
ItemCategoryInfo._info['0002'].FragmentType = CharacterFace;		//	Face			-> CharacterHeadBase -> CharacterFaceBase -> CharacterFace
ItemCategoryInfo._info['0003'].FragmentType = CharacterHair;		//	Hair			-> CharacterHeadBase -> CharacterHair
ItemCategoryInfo._info['0004'].FragmentType = CharacterHair;		//	Hair			-> CharacterHeadBase -> CharacterHair

ItemCategoryInfo._info['0100'].FragmentType = CharacterEquip;		//	Cap				-> CharacterBody
ItemCategoryInfo._info['0101'].FragmentType = CharacterFaceAcc;		//	accessoryFace	-> CharacterHeadBase -> CharacterFaceBase -> CharacterFaceAcc
ItemCategoryInfo._info['0102'].FragmentType = CharacterEquip;		//	accessoryEyes	-> CharacterEquip
ItemCategoryInfo._info['0103'].FragmentType = CharacterEquip;		//	accessoryEars	-> CharacterEquip
ItemCategoryInfo._info['0104'].FragmentType = CharacterEquip;		//	Coat			-> CharacterBody
ItemCategoryInfo._info['0105'].FragmentType = CharacterEquip;		//	Longcoat		-> CharacterBody
ItemCategoryInfo._info['0106'].FragmentType = CharacterEquip;		//	Pants			-> CharacterBody
ItemCategoryInfo._info['0107'].FragmentType = CharacterEquip;		//	Shoes			-> CharacterBody
ItemCategoryInfo._info['0108'].FragmentType = CharacterEquip;		//	Glove			-> CharacterBody
ItemCategoryInfo._info['0109'].FragmentType = CharacterEquip;		//	Shield			-> CharacterBody
ItemCategoryInfo._info['0110'].FragmentType = CharacterEquip;		//	Cape			-> CharacterBody

ItemCategoryInfo._info['0170'].FragmentType = CharacterEquipCashWeapon;	//	cash-weapon	-> CharacterEquip

ItemCategoryInfo._info['019'].FragmentType = CharacterTamingMob;	//	TamingMob		-> CharacterTamingMob


class CharacterSlots {
	constructor() {
			
		/** @type {CharacterAppearanceBase[]} */
		this._ordered_slot = [];


		/** @type {CharacterBody} */
		this.body = null;

		/** @type {CharacterHead} */
		this.head = null;

		/** @type {CharacterFace} */
		this.face = null;


		/** @type {CharacterHair} */
		this.hair = null;
		
		/** @type {CharacterHair} */
		this._hair2 = null;
		/** @type {number} 0~1.0 */
		this._hairMix2 = null;
		/** @type {CharacterHair} */
		this._hair3 = null;
		/** @type {number} 0~1.0 */
		this._hairMix3 = null;


		/** @type {CharacterEquip} - 1 */
		this.cap = null;

		/** @type {CharacterFaceAcc} - 2 */
		this.accessoryFace = null;

		/** @type {CharacterEquip} - 3*/
		this.accessoryEyes = null;

		/** @type {CharacterEquip} - 4 */
		this.accessoryEars = null;

		/** @type {CharacterEquip} - 5 */
		this.coat = null;

		/** @type {CharacterEquip} - 5 */
		this.longcoat = null;

		/** @type {CharacterEquip} - 6 */
		this.pants = null;

		/** @type {CharacterEquip} - 7 */
		this.shoes = null;

		/** @type {CharacterEquip} - 8 */
		this.glove = null;

		/** @type {CharacterEquip} - 9 */
		this.cape = null;

		/** @type {CharacterEquip} - 10 */
		this.shield = null;

		/** @type {CharacterEquip} - 11 */
		this.weapon = null;
		
		/** @type {CharacterTamingMob} */
		this.tamingMob = null;
		
		{
			Object.defineProperty(this, "_ordered_slot", {
				configurable: true,
				writable: true,
				enumerable: false,
				value: []
			});
			
			Object.defineProperty(this, "_hair", {
				writable: true,
				enumerable: false,
				value: null,
			});
			Object.defineProperty(this, "hair", {
				enumerable: true,
				get: function () {
					return this._hair;
				},
				set: function (value) {
					this._hair = value;
					if (value) {
						if (this._hair2 && this._hairMix2) {
							this.hairColor2 = this.hairColor2;//force reload
							this.hairMix2 = this.hairMix2;
						}
						if (this._hair3 && this._hairMix3) {
							this.hairColor3 = this.hairColor3;//force reload
							this.hairMix3 = this.hairMix3;
						}
					}
				},
			});
			
			Object.defineProperty(this, "_hair", {
				writable: true,
				enumerable: false,
				value: null,
			});
			Object.defineProperty(this, "_hair2", {
				writable: true,
				enumerable: false,
				value: null,
			});
			Object.defineProperty(this, "_hairMix2", {	// 0~1.0
				writable: true,
				enumerable: false,
				value: null,
			});
			Object.defineProperty(this, "_hair3", {
				writable: true,
				enumerable: false,
				value: null,
			});
			Object.defineProperty(this, "_hairMix3", {	// 0~1.0
				writable: true,
				enumerable: false,
				value: null,
			});
		}
	}

	async __loadColoredHair(color) {
		const id = CharacterRenderConfig.getColorHairID(this.hair.id, color);
		const cateInfo = ItemCategoryInfo.get(id);

		if (cateInfo) {
			const url = `/Character/${cateInfo.path + (cateInfo.path ? "/" : "") + id}`;
			const use_category = undefined;

			let hair = new CharacterHair();

			await hair.load(url, id, cateInfo, use_category);

			return hair;
		}
	}

	/** @returns {number} */
	get hairColor2() {
		if (this._hair2) {
			return Number(CharacterRenderConfig.getHairColor(this._hair2.id));
		}
	}
	set hairColor2(color) {
		if (!color) {
			console.error(new TypeError());
			return;
		}
		let hc2Id = CharacterRenderConfig.getColorHairID(this.hair.id, color);

		if (!this._hair2 || hc2Id != this._hair2.id) {
			if (hc2Id == this._hair.id) {
				this._hair2 = null;
				this.hairMix2 = 0;
			}
			else {
				this.hair.$promise_hair2 = this.__loadColoredHair(color);

				this.hair.$promise_hair2.then(hair2 => {
					delete this.hair.$promise_hair2;

					this._hair2 = hair2;
					if (this._hair2 && this.hairMix2 != null) {
						this.hairMix2 = this.hairMix2;//force update
					}
					//else {
					//	this.hairMix2 = 0;//disable
					//}
				});
			}
		}
	}
	/** @returns {number} 0~1.0 */
	get hairMix2() {
		return this._hairMix2;
	}
	set hairMix2(value) {
		value = Number(value);

		Promise.resolve(this.hair.$promise_hair2).then(() => {
			/** @type {CharacterAppearanceBase} */
			let item = this._hair2;
			/** @type {CharacterAppearanceBase} */
			let base = this.hair;

			if (!item || !base) {
				return;
			}

			for (let j in item.fragments) {
				for (let k in item.fragments[j].textures) {
					for (let i = 0; i < item.fragments[j].textures[k].length; ++i) {
						/** @type {FragmentTexture} */
						let ft = item.fragments[j].textures[k][i];
						/** @type {FragmentTexture} */
						let ori = base.fragments[j].textures[k][i];
						if (ori) {
							ori.graph2 = ft;
							ori.graph2.opacity = value;
						}
					}
				}
			}
			this._hairMix2 = value;
		});
	}

	/** @returns {number} 0~1.0 */
	get hairColor3() {
		if (this._hair3) {
			return Number(CharacterRenderConfig.getHairColor(this._hair3.id));
		}
	}
	set hairColor3(color) {
		if (!color) {
			console.error(new TypeError());
			return;
		}
		let hc3Id = CharacterRenderConfig.getColorHairID(this.hair.id, color);

		if (!this._hair3 || this._hair3.id != hc3Id) {
			if (this._hair.id == hc3Id || this._hair2.id == hc3Id) {
				this._hair3 = null;
				this.hairMix3 = 0;
			}
			else {
				this.hair.$promise_hair3 = this.__loadColoredHair(color);

				this.hair.$promise_hair3.then(hair3 => {
					delete this.hair.$promise_hair3;

					this._hair3 = hair3;
					if (this._hair3 && this.hairMix3 != null) {
						this.hairMix3 = this.hairMix3;//force update
					}
					//else {
					//	this.hairMix3 = 0;//disable
					//}
				});
			}
		}
	}
	/** @returns {number} */
	get hairMix3() {
		return this._hairMix3;
	}
	set hairMix3(value) {
		value = Number(value);

		Promise.resolve(this.hair.$promise_hair3).then(() => {
			/** @type {CharacterAppearanceBase} */
			let item = this._hair3;
			/** @type {CharacterAppearanceBase} */
			let base = this.hair;

			if (!item || !base) {
				return;
			}

			for (let j in item.fragments) {
				for (let k in item.fragments[j].textures) {
					for (let i = 0; i < item.fragments[j].textures[k].length; ++i) {
						/** @type {FragmentTexture} */
						let ft = item.fragments[j].textures[k][i];
						/** @type {FragmentTexture} */
						let ori = base.fragments[j].textures[k][i];
						if (ori) {
							ori.graph3 = ft;
							ori.graph3.opacity = value;
						}
					}
				}
			}
			this._hairMix3 = value;
		});
	}

	//__order_slot() {
	//	let slot_map = new Map();
	//
	//	for (let i in this) {
	//		let equip = this[i];
	//
	//		equip.cs
	//	}
	//}

	/**
	 * @param {string} id
	 * @param {CharacterAppearanceBase} loadedEquip
	 * @param {string} use_category - category which used of cash-weapon
	 */
	async _use(id, loadedEquip, use_category) {
		if (!id) {
			debugger
			return;
		}
		const cateInfo = ItemCategoryInfo.get(id);

		if (cateInfo) {
			let url = `/Character/${cateInfo.path + (cateInfo.path ? "/":"") + id}`;
			/** @type {CharacterAppearanceBase} */
			let item;

			if (loadedEquip instanceof CharacterAppearanceBase) {
				alert("CharacterSlots # _use: param loadedEquip ??");
				debugger;
				item = loadedEquip;
			}
			else {
				if (loadedEquip) {
					alert("CharacterSlots # _use: param loadedEquip ??");
					debugger;
				}
				const fragmentType = cateInfo.FragmentType || CharacterEquip;

				item = new fragmentType();
			}
			/** _use_loaded_equip */
			if (0) {
				if (this[cateInfo.slot]) {
					this[cateInfo.slot]._unload();
				}
				this[cateInfo.slot] = item;

				this._ordered_slot[item.slot_order] = item;
			}

			let is_exist = loadedEquip || await item.load(url, id, cateInfo, use_category);
			if (is_exist) {
				/** _use_loaded_equip */
				if (1) {
					if (this[cateInfo.slot]) {
						this[cateInfo.slot]._unload();
					}
					this[cateInfo.slot] = item;

					this._ordered_slot[item.slot_order] = item;
				}
			}
			else {
				console.warn("item(" + id + ") is not exist");
			}

			return item;
		}
	}
	/**
	 * @param {string} id
	 * @returns {boolean}
	 */
	_unuse(id) {
		if (!id) {
			debugger
			return;
		}
		let cateInfo, equip;

		if (id instanceof CharacterAppearanceBase) {
			equip = id;
			id = equip.id;
			cateInfo = equip.categoryInfo;
		}
		else {
			cateInfo = ItemCategoryInfo.get(id);
		}
		
		const slotName = cateInfo.slot;

		if (slotName != "head" && slotName != "body") {
			if (this[slotName] && this[slotName].id == id) {
				equip = this[slotName];
				for (let slot in equip.islot) {
					let order = equip.islot[slot];
					if (this._ordered_slot[order]) {
						this._ordered_slot[order]._unload();
					}
					delete this._ordered_slot[order];
				}
				this[slotName] = null;
				return true;
			}
		}
		return false;
	}
	_clear() {
		//this.body = null;
		//this.head = null;
		this.face = null;
		this.hair = null;
		this.cap = null;
		this.accessoryFace = null;
		this.accessoryEyes = null;
		this.accessoryEars = null;
		this.coat = null;
		this.longcoat = null;
		this.pants = null;
		this.shoes = null;
		this.glove = null;
		this.cape = null;
		this.shield = null;

		//temp
		let head = this.head;
		let body = this.body;

		//clear
		this._ordered_slot = [];

		//restore
		if (head) {
			this._ordered_slot[head.slot_order] = head;
		}
		if (body) {
			this._ordered_slot[body.slot_order] = body;
		}
	}

	_stringify() {
		let slots = ["c"];
			
		if (this.body) slots.push(this.body.id);
		if (this.head) slots.push(this.head.id);
		if (this.face) slots.push(this.face.id + "|" + this.face.id);
		if (this.hair) {
			let ha = [];
			ha.push(this.hair.id);
			if (this.hairColor2 && this.hairMix2 > 0) ha.push(this.hairColor2 + "%" + Math.trunc(this.hairMix2 * 100));
			if (this.hairColor3 && this.hairMix3 > 0) ha.push(this.hairColor3 + "%" + Math.trunc(this.hairMix3 * 100));
			slots.push(ha.join("|"));
		}
		if (this.cap) slots.push(this.cap.id);
		if (this.accessoryFace) slots.push(this.accessoryFace.id);
		if (this.accessoryEyes) slots.push(this.accessoryEyes.id);
		if (this.accessoryEars) slots.push(this.accessoryEars.id);
		if (this.coat) slots.push(this.coat.id);
		if (this.longcoat) slots.push(this.longcoat.id);
		if (this.pants) slots.push(this.pants.id);
		if (this.shoes) slots.push(this.shoes.id);
		if (this.glove) slots.push(this.glove.id);
		if (this.shield) slots.push(this.shield.id);
		if (this.cape) slots.push(this.cape.id);
		if (this.weapon) slots.push(this.weapon.id);

		return slots.join(",");
	}

	toJSON() {
		let slots = [];

		if (this.body) slots.push(this.body);
		if (this.head) slots.push(this.head);
		if (this.face) slots.push(this.face);
		if (this.hair) slots.push(this.hair);
		//if (this._hair2) slots.push(this._hair2);
		//if (this._hair3) slots.push(this._hair3);
		if (this.cap) slots.push(this.cap);
		if (this.accessoryFace) slots.push(this.accessoryFace);
		if (this.accessoryEyes) slots.push(this.accessoryEyes);
		if (this.accessoryEars) slots.push(this.accessoryEars);
		if (this.coat) slots.push(this.coat);
		if (this.longcoat) slots.push(this.longcoat);
		if (this.pants) slots.push(this.pants);
		if (this.shoes) slots.push(this.shoes);
		if (this.glove) slots.push(this.glove);
		if (this.shield) slots.push(this.shield);
		if (this.cape) slots.push(this.cape);
		if (this.weapon) slots.push(this.weapon);

		return slots;
	}

	/**
	 * returns: [face, hair, cap, ..., weapon]
	 */
	*enumerate() {
		if (this.face) yield this.face;
		if (this.hair) yield this.hair;

		yield* this.enumerate_equip();
	}
	*enumerate_equip() {
		if (this.cap) yield this.cap;
		if (this.accessoryFace) yield this.accessoryFace;
		if (this.accessoryEyes) yield this.accessoryEyes;
		if (this.accessoryEars) yield this.accessoryEars;
		if (this.coat) yield this.coat;
		if (this.longcoat) yield this.longcoat;
		if (this.pants) yield this.pants;
		if (this.shoes) yield this.shoes;
		if (this.glove) yield this.glove;
		if (this.shield) yield this.shield;
		if (this.cape) yield this.cape;
		if (this.weapon) yield this.weapon;
	}
	*enumerate_face() {
		if (this.face) yield this.face;
		if (this.accessoryFace) yield this.accessoryFace;
	}
}

class CharacterChangeLog {
	constructor() {
		/** @type {"human"|"elf"|"lef"|"highlef"} */
		this.ear = undefined;

		/** @type {string[]} */
		this.useEquip = [];

		/** @type {string[]} */
		this.unuseEquip = [];
		
		/** @type {string} - hair2 id */
		this.hair2 = undefined;

		/** @type {string} */
		this.hairMix2 = undefined;

		///** @type {string} */
		//this.hair3 = undefined;

		///** @type {string} */
		//this.hairMix3 = undefined;

		/** @type {string} weapon => equip id */
		this.weapon = undefined;

		/** @type {string} */
		this.weaponType = undefined;
	}

	clear() {
		this.ear = undefined;
		this.useEquip = [];
		this.unuseEquip = [];
		this.hair2 = undefined;
		this.hairMix2 = undefined;
		//this.hair3 = undefined;
		//this.hairMix3 = undefined;
		this.weaponType = undefined;
	}
}

export class CharacterAnimationBase {
	constructor() {
		this._$dirty = 0;//force update vue

		/** @type {string} - 未完成 */
		this.job = null;
		/** @type {string} - 未完成 */
		this.subJob = null;


		/** @type {ActionAnimation} */
		this.actani = new ActionAnimation();

		/** @type {number} - animation speed rate */
		this.speed = 1;

		/** @type {boolean} */
		this.fixed_speed = false;

		/** @type {boolean} - pause animation */
		this.pause = false;


		this.hideBody = false;

		/** @type {string} */
		this._ride_action = "stand1";

		//	action

		/** @type {string} */
		this._action = "stand1";

		/** @type {number} */
		this._action_frame = 0;

		//	emotion

		/** @type {string} */
		this._emotion = "blink";

		/** @type {number} */
		this._emotion_frame = 0;

		/** @type {number} */
		this._emotion_time = 0;

		//

		this._generator_emotion_frame = this.emotion_frame_sequence_generator(3, 0);//[0,1,2].length
		
		this.blinkRate = 0.015;

		/** @type {CharacterSlots} */
		this.slots = new CharacterSlots();

		/**
		 * is require update render data
		 * @type {boolean}
		 */
		this.__require_update = true;

		/** @type {FragmentTexture[]} */
		this.__frag_list = [];

		/** @type {CharacterChangeLog} **/
		this.$$changeLog = new CharacterChangeLog();
	}

	_clone() {
		alert(this.constructor.name + "::_clone");

		/** @type {CharacterAnimationBase} */
		let nc = new this.constructor();//not must CharacterRender
		if (!nc) {
			debugger;
			return;
		}

		nc.speed = 0;

		nc.x = this.x;
		nc.y = this.y;
		nc.angle = this.angle;

		nc.action = this.action;
		nc.action_frame = this.action_frame;

		nc.emotion = this._emotion;
		nc.emotion_frame = this.emotion_frame;

		for (let i in this.slots) {
			let item = this.slots[i];
			if (item) {
				nc.slots[i] = this.slots[i];//not need colne ?
			}
		}
		return nc;
	}
		
	_waitFrameTexturesLoaded() {
		let tasks = [];
		for (let i in this.slots) {
			/** @type {CharacterAppearanceBase} */
			let item = this.slots[i];
			if (item) {
				for (let j in item.fragments) {
					let frag = item.fragments[j];
					let count = frag.getFrameCount(this);
					for (let k = 0; k < count; ++k) {
						let ft = frag.getFrameTexture(this, k);
						if (ft && !ft._isLoaded_or_doload()) {
							tasks.push(ft.$promise);
						}
					}
				}
			}
		}
		return Promise.all(tasks);
	}

	/**
	 * init animation status
	 */
	initAnimation() {
		/** @type {string} */
		this.action = "stand1";

		/** @type {number} */
		this._action_frame = 0;

		/** @type {string} */
		this.emotion = "blink";
			
		/** @type {number} */
		this._emotion_time = 0;

		/** @type {number} */
		this._emotion_frame = 0;
	}

	/** @type {number} - 0~1 */
	getSpeed() {
		if (this.pause) {
			return 0;
		}
		return this.fixed_speed ? 1 : this.speed;
	}

	/**
	 * @type {boolean}
	 */
	get elfEar() {
		if (this.slots.head) {
			return this.slots.head.elfEar;
		}
	}
	set elfEar(value) {
		if (this.slots.head) {
			this.slots.head.elfEar = value;
		}
	}

	/**
	 * @type {boolean}
	 */
	get lefEar() {
		if (this.slots.head) {
			return this.slots.head.lefEar;
		}
	}
	set lefEar(value) {
		if (this.slots.head) {
			this.slots.head.lefEar = value;
		}
	}

	/**
	 * @type {boolean}
	 */
	get highlefEar() {
		if (this.slots.head) {
			return this.slots.head.highlefEar;
		}
	}
	set highlefEar(value) {
		if (this.slots.head) {
			this.slots.head.highlefEar = value;
		}
	}

	/** @returns {"human"|"elf"|"lef"|"highlef"} */
	get ear() {
		if (this.slots.head) {
			return this.slots.head.lefEar ? "lef" : (this.slots.head.elfEar ? "elf" : (this.slots.head.highlefEar ? "highlef" : "human"));
		}
	}
	set ear(value) {
		if (this.slots.head) {
			if (value == "elf") {
				this.slots.head.elfEar = true;
				this.slots.head.lefEar = false;
				this.slots.head.highlefEar = false;
				this.$$changeLog.ear = value;
			}
			else if (value == "lef") {
				this.slots.head.lefEar = true;
				this.slots.head.elfEar = false;
				this.slots.head.highlefEar = false;
				this.$$changeLog.ear = value;
			}
			else if (value == "highlef") {
				this.slots.head.elfEar = false;
				this.slots.head.lefEar = false;
				this.slots.head.highlefEar = true;
				this.$$changeLog.ear = value;
			}
			else {
				this.slots.head.elfEar = false;
				this.slots.head.lefEar = false;
				this.slots.head.highlefEar = false;
				this.$$changeLog.ear = "human";
			}
		}
		else {
			this.$$changeLog.ear = undefined;
		}
	}

	/** @type {string} */
	get action() {
		//if (this.slots.tamingMob) {
		//	const actmap = this.slots.tamingMob.actionMap;
		//	if (actmap) {
		//		return actmap[this._action];
		//	}
		//	return "sit";//default
		//}
		return this._action;
	}
	set action(act) {
		if (this.slots.tamingMob) {
			let _act;

			this._ride_action = act;

			if (this.slots.tamingMob.actionMap) {
				_act = this.slots.tamingMob.actionMap[act];

				if (_act == "hideBody") {
					this.hideBody = true;

					//TODO: hideBody act=?

					this._action = act;
					if (this.actani._action != act) {
						this.actani.reload(act);
					}
					this.__require_update |= true;
				}
				else {
					this.hideBody = false;

					this._action = _act;
					if (this.actani._action != _act) {
						this.actani.reload(_act);
					}
					this.__require_update |= true;
				}
			}
			else {
				if (act == "rope") {
					this._action = "rope";//default
				}
				else if (act == "ladder") {
					this._action = "ladder";//default
				}
				else {
					this._action = "sit";//default
					this._action_frame = 0;//default
				}
				if (this.actani._action != act) {
					this.actani.reload(act);
				}
				this.__require_update |= true;
			}
		}
		else {
			this.hideBody = false;
			this._ride_action = null;

			if (this.actani._action != act && this.slots.body) {
				this._action = act;
				this.actani.reload(act);

				this.__require_update |= true;
			}
		}
	}

	/** @type {number} */
	get action_frame() {
		return this._action_frame;
	}
	set action_frame(value) {
		if (value === "") {//from $("input")
			return;
		}
		if (process.env.NODE_ENV !== 'production') {
			if (!(typeof value == 'number')) {
				debugger;
				this._action_frame = Number(value) | 0;
				this.__require_update |= true;
				return;
			}
		}

		this._action_frame = value;
		this.__require_update |= true;
	}

	/** @type {number} */
	get action_frame_count() {
		try {
			if (this.slots.body) {
				return this.slots.body.getFrameCount(this);
			}
		}
		catch (ex) {
			debugger;
		}
		return 0;
	}

	/** @type {string} */
	get emotion() {
		return this._emotion;
	}
	set emotion(emo) {
		if (this._emotion != emo && this.slots.face && this.slots.face.fragments.face.textures[emo]) {
			this._emotion = emo;
			this._emotion_frame = 0;
			this._emotion_time = 0;

			if (emo == "blink") {
				this.blinkRate = 0.015;
			}
			else {
				this.blinkRate = 1;
			}
			
			this._generator_emotion_frame = this.emotion_frame_sequence_generator(this.emotion_frame_count, 0);

			this.__require_update |= true;
		}
	}

	/**
	 * @param {number} count of frame
	 * @param {number} start frame
	 */
	*emotion_frame_sequence_generator(length, start) {
		while (true) {
			if (Math.random() < this.blinkRate) {
				yield* linearSequence(length, start);
			}
			else {
				yield 0;
			}
		}
	}
	
	/** @type {number} */
	get emotion_frame() {
		return this._emotion_frame;
	}
	set emotion_frame(value) {
		if (value === "") {//from $("input")
			return;
		}
		if (process.env.NODE_ENV !== 'production') {
			if (!(typeof value == 'number')) {
				debugger;
				this._emotion_frame = Number(value) | 0;
				this._emotion_time = 0;
				this.__require_update |= true;
			}
		}

		this._emotion_frame = value;
		this._emotion_time = 0;
		this.__require_update |= true;
	}

	/**
	 * @param {number} next
	 */
	_get_emotion_next_frame(next) {
		let r = this._generator_emotion_frame.next().value;
		
		this._generator_emotion_frame = this.emotion_frame_sequence_generator(this.emotion_frame_count, this._emotion_frame);
		
		return r;
	}

	/** @type {number} */
	get emotion_time() {
		return this._emotion_time;
	}
	set emotion_time(time) {
		if (this.emotion_frame_count) {
			if (time < this.emotion_delay) {
				this._emotion_time = time;
			}
			else {
				this._emotion_time = 0;

				this._emotion_frame = this._generator_emotion_frame.next().value;

				this.__require_update |= true;
			}
		}
	}

	/**
	 * @returns {number}
	 */
	get emotion_delay() {
		if (this.slots.face) {
			return this.slots.face.getDelay(this);
		}
		return 60;
	}

	/** @type {number} */
	get emotion_frame_count() {
		try {
			if (this.slots.face) {
				return this.slots.face.getFrameCount(this);
			}
		}
		catch (ex) {
			debugger;
		}
		return 0;
	}

	/**
	 * @param {number} stamp - 0 <= stamp < Infinity
	 */
	_update(_stamp) {
		if (this.pause) {
			return;
		}

		let stamp = _stamp * this.getSpeed();
		
		if (this.actani) {
			if (this.actani.isEnd() && this.actani.loop) {
				this.actani.reset();
			}

			this.actani.update(stamp, this);
		}

		this.emotion_time += _stamp;

		for (let i in this.slots) {
			let equip = this.slots[i];
			if (equip && equip.effect && equip.effect.enable) {
				equip.effect.update(stamp);
			}
		}
	}
	/**
	 * @param {any} number  0 < stamp * speed < Infinity
	 */
	update(stamp) {
		this._update(stamp);
	}

	/**
	 * use await this.__synchronize(stamp) update and force wait all resource load
	 * @param {number}
	 */
	__forceUpdate(stamp) {
		this._$dirty = Math.random();
		this._update(stamp | 0);
		this.__update_frag_list();
	}
	/**
	 * @param {IRenderer} renderer
	 * @param {number} x
	 * @param {number} y, 
	 * @param {number} angle
	 * @param {boolean} flip
	 */
	_draw(renderer, x, y, angle, flip) {
		renderer.pushGlobalAlpha();

		//list.filter(a=>a&&a._raw.map).forEach(a=>{ for (let i in a._raw.map) { if (q[i]) { q[i].push(a); } else { q[i] = [a]; } } })
		this.__draw_list(renderer, this.__frag_list, x, y, angle, flip);

		renderer.popGlobalAlpha();
	}
	/**
	 * @param {IRenderer} renderer
	 * @param {FragmentTexture[]} list
	 */
	__draw_list(renderer, list, x, y, angle, flip) {
		renderer.pushMatrix();

		renderer.translate(x, y);
		
		if (0) {
			let ctx = renderer.ctx;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(100, 0);
			ctx.strokeStyle = "#F00";
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, 100);
			ctx.strokeStyle = "#0F0";
			ctx.stroke();
		}

		renderer.rotate(window.m_a || angle);

		if (flip) {
			renderer.scale(-1, 1);
		}
		//{
		//	let ctx = renderer.ctx;
		//	ctx.beginPath();
		//	ctx.moveTo(0, 0);
		//	ctx.lineTo(100, 0);
		//	ctx.strokeStyle = "#F00";
		//	ctx.stroke();
		//	ctx.beginPath();
		//	ctx.moveTo(0, 0);
		//	ctx.lineTo(0, 100);
		//	ctx.strokeStyle = "#0F0";
		//	ctx.stroke();
		//}

		{
			for (let i in this.slots) {
				let equip = this.slots[i];
				if (equip && equip.effect) {
					equip.effect.render(renderer, this);
				}
			}
			for (let i in list) {
				let ft = list[i];
				ft.render(renderer, this);
			}
		}
		renderer.popMatrix();
	}
	__update_frag_list() {
		this.__frag_list = [];
		
		/** @type {Array<CharacterAppearanceBase>[]} */
		let slots = {};
		
		for (let i = 2; i <= 3; ++i) {
			/** @type {CharacterAppearanceBase} */
			let item = this.slots["_hair" + i];
			
			this.__add_equip_to_frag_list(slots, item);
		}
		for (let i in this.slots._ordered_slot) {
			/** @type {CharacterAppearanceBase} */
			let item = this.slots._ordered_slot[i];
			
			this.__add_equip_to_frag_list(slots, item);
		}
		
		{//back
			let is_back = false;
			
			for (let i in slots) {
				/** @type {FragmentTexture[]} */
				let fts = slots[i];
				for (let j in fts) {
					/** @type {FragmentTexture} */
					let ft = fts[j];
					if (is_back) {
						if (ft._place.startsWith("face")) {
							continue;
						}
					}
					else if (ft._place.startsWith("backHair")) {
						is_back = true;
					}
					this.__add_frag_to_list(ft);
				}
			}
		}
		
		{
			let ae = this.__frag_list[114];//HACK: Ae
			if (ae) {
				this.__frag_list.push(ae);
			}
		}

		this._calcBoundBox();
	}
	/**
	 * @param {Array<CharacterAppearanceBase>[]} slots
	 * @param {CharacterAppearanceBase} item
	 */
	__add_equip_to_frag_list(slots, item) {
		// if equip not use then value is mumber(slot_order) where this.slots._ordered_slot
		if (item == null) {
			return;//debugger;
		}
		else if (item > 0) {// typeof item == 'number'; item != null && (item instanceof CharacterAppearanceBase || item >= 0)
			return;//continue;
		}

		// init slots
		for (let j in item.vslot) {
			let slot = item.vslot[j];
			slots[slot] = [];
		}

		for (let j in item.fragments) {//foreach equip place
			let slot = sMap[j];
			if (slot != null) {
				/** @type {FragmentTexture} */
				let ft = item.fragments[j].getTexture(this);
				if (ft) {
					if (!slots[slot]) {
						slots[slot] = [ft];//cover ??
					}
					else {
						slots[slot].push(ft);//cover ??
					}
				}
			}
			else if (j == "default") {
				/** @type {FragmentTexture} */
				let ft = item.fragments[j].getTexture(this);
				slot = item._raw.info.islot;
				if (ft) {
					if (!slots[slot]) {
						slots[slot] = [ft];//cover ??
					}
					else {
						slots[slot].push(ft);//cover ??
					}
				}
			}
			else {
				/** @type {FragmentTexture} */
				let ft = item.fragments[j].getTexture(this);
				if (ft) {
					this.__add_frag_to_list(ft);
				}
			}
			//item.fragments[j].visible = true;
		}
	}
	/** @param {FragmentTexture} ft */
	__add_frag_to_list(ft) {
		ft.update(this);
		this.__frag_list[ft.z] = ft;
	}


	/**
	 * calc current frame bound box and restore result
	 * @returns {Rectangle}
	 */
	_calcBoundBox() {
		let left = 0, top = 0, right = 0, bottom = 0;

		for (let i in this.__frag_list) {
			let ft = this.__frag_list[i];
			if (ft.texture && ft.relative) {
				let x0 = ft.relative.x;
				let y0 = ft.relative.y;
				let x1 = x0 + ft.width;
				let y1 = y0 + ft.height;

				left = Math.min(left, x0);
				top = Math.min(top, y0);
				right = Math.max(right, x1);
				bottom = Math.max(bottom, y1);
			}
		}
		this._boundBox = new Rectangle(
			Math.trunc(left),
			Math.trunc(top),
			Math.trunc(right - left),
			Math.trunc(bottom - top)
		);
		return this._boundBox;
	}
	
	toJSON() {
		let obj = {
			slots: this.slots.toJSON(),
		};
		if (this.slots._hair2) {
			obj.hair2 = this.slots._hair2.id;
			obj.hairMix2 = this.slots.hairMix2;
		}

		if (this.slots.head.elfEar) {
			obj.ear = "elf";
		}
		else if (this.slots.head.lefEar) {
			obj.ear = "lef";
		}
		else if (this.slots.head.highlefEar) {
			obj.ear = "highlef";
		}

		return obj;
	}
}

export class CharacterRenderer extends CharacterAnimationBase {
	constructor() {
		super();

		/** @type {number} - position x */
		this.x = 0;
		/** @type {number} - position y */
		this.y = 0;

		/** @type {number} - where layer */
		this.z = 5;

		/** @type {number} - translate x once frame */
		this.tx = 0;
		/** @type {number} - translate y once frame */
		this.ty = 0;
		
		this.angle = 0;
		this.front = -1;

		/** @type {Promise<void>[]} */
		this.__load_task = [];

		/** @type {function(IRenderer)} */
		this.render = function (renderer) {
			//not ready to render
			//if load then set load render = _render
		}

		/** @type {Rectangle} */
		this._boundBox = null;

		/** @type {string} */
		this._$old_action = null;
		/** @type {string} */
		this._$old_emotion = null;
	}

	static async Init() {
		let result = await Promise.all([
			$get.data("/zmap"),
			$get.data("/smap"),
			ItemEffect.Init(),
			ActionAnimation.Init(),//action definition
		]);
		
		zMap = {};
		Object.keys(result[0]).reverse().forEach((k, i) => zMap[k] = i + 1);

		sMap = result[1];
	}

	load() {
		//load body and head for calc relative position
		this.use("00002012");
		this.use("00012012");

		let $promise = Promise.all([...this.__load_task]);
		(function (that, $promise) {
			$promise.then(function (result) {
				that.initAnimation();
				that.render = that._render;
			});
		})(this, $promise);

		return $promise;
	}
	
	/**
	 * @param {any} number  0 < stamp * speed < Infinity
	 */
	update(stamp) {
		this._$old_action = this._action;
		this._$old_emotion = this.emotion;

		this.waitLoaded();
		super.update(stamp);

		if (this.__require_update) {
			this.__update_frag_list();
			this.__require_update = false;
		}
	}

	/**
	 * @param {IRenderer} renderer
	 */
	_render(renderer) {
		const x = Math.trunc(this.x + this.tx);
		const y = Math.trunc(this.y + this.ty);
		
		this._draw(renderer, x, y, this.angle, this.front > 0);
		
		//this.tx = 0;//auto clear
		//this.ty = 0;//auto clear
	}
	
	_setup_test() {
		if (0) {
			this.use("00026509");

			this.use("00044041");

			//this.use("01022274");

			this.use("01053169");

			this.use("01071077");

			//this.use("01102960");
		}
		else {
			this.use("00026509");

			this.use("00041526");

			this.use("01051429");

			this.use("01071110");

			this.elfEar = true;
		}
	}

	
	/**
	 * update and force wait all resource load
	 * @param {number}
	 */
	async __synchronize(stamp) {
		this.__forceUpdate(stamp);
	
		await this.waitLoaded();
		await this._waitFrameTexturesLoaded();
	}
	async waitLoaded() {
		let tasks = this.__load_task;
		if (tasks && tasks.length) {
			await Promise.all(tasks).then(() => {
				this.__load_task = [];
			});
		}
	}
	//isLoading() {
	//}

	/**
	 * @param {string} id
	 * @param {string} category - category of cash-weapon
	 */
	async use(id, category) {
		if (!category) {
			category = ItemCategoryInfo.getJobWeaponCategory(this.job);
		}
		const item_type = id[0];
		switch (item_type) {
			case "0"://equip
				{
					if (ItemCategoryInfo.isCashWeapon(id)) {
						//this.$$changeLog.weaponType = ss[1];/??
						this.$$changeLog.weapon = id;
					}
					else {
						this.$$changeLog.useEquip.push(id);
					}
					//
					let task = this.slots._use(id, null, category);
					this.__load_task.push(task);
					let item = await task;
					
					if (id.startsWith("019")) {
						this.action = this.action;//force update action
					}
					
					this.__update_frag_list();
					this._calcBoundBox();

					return item;
				}
		}
	}

	/**
	 * @param {string} id
	 */
	unuse(id) {
		debugger;
		if (id[0] == "0") {//equip
			let result = this.slots._unuse(id);
			if (result) {
				this.$$changeLog.unuseEquip.push(id);
				this._calcBoundBox();
			}
			return result;
		}
	}

	/**
	 * @param {{ear:boolean,items:[]}} option
	 */
	set(option) {
		this.ear = option.ear;

		option.items.forEach(itemData => {
			if (itemData) {
				this.use(itemData.itemId).then(item => {
					item.set(itemData);
				});
			}
		});
	}

	_parse(code) {
		if (!code) {
			return;
		}
		let es = code.split(",");
		this.slots._clear();
		es.forEach((v, i, a) => {
			if (v.indexOf("|") >= 0) {
				const ss = v.split("|");
				const cate = ItemCategoryInfo.get(ss[0]);
				let id;
				if (cate.slot == "face") {
					id = ss[1];
					this.$$changeLog.useEquip.push(id);
					//
					this.use(id);

				}
				else if (cate.slot == "hair") {
					const slots = this.slots;
					let h2 = ss[1];
					let h3 = ss[2];
					//
					id = ss[0];
					this.$$changeLog.useEquip.push(id);
					//
					this.use(id).then(() => {
						if (h2 && h2.indexOf("%") >= 0) {
							let hc = h2.split("%");
							const c2 = hc[0];
							const m2 = hc[1] / 100;
							//
							this.$$changeLog.hair2 = c2;
							this.$$changeLog.hairMix2 = m2;
							//
							slots.hairColor2 = c2;
							slots.hairMix2 = m2;
						}
						if (h3 && h3.indexOf("%") >= 0) {
							let hc = h3.split("%");
							const c3 = hc[0];
							const m3 = hc[1] / 100;
							//
							this.$$changeLog.hair3 = c3;
							this.$$changeLog.hairMix3 = m3;
							//
							slots.hairColor3 = hc[0];
							slots.hairMix4 = hc[1] / 100;
						}
					});
				}
				else if (cate.slot == "weapon") {
					this.$$changeLog.weaponType = ss[1];
					this.$$changeLog.weapon = id;
					this.use.apply(this, ss, ss[1]);//this.use(ss[0], ss[1]);
				}
			}
			else if (Number.isFinite(parseInt(v, 10))) {
				this.use(v);
			}
		});
	}

	/**
	 * @type {string} col
	 */
	get hairColor() {
		if (this.slots.hair) {
			return CharacterRenderConfig.getHairColor(this.slots.hair.id);
		}
		return "0";
	}
	set hairColor(col) {
		if (this.slots.hair && col != this.hairColor) {
			let id = CharacterRenderConfig.getColorHairID(this.slots.hair.id, col);
			this.use(id);
		}
	}

	/**
	 * @param {string} col
	 */
	get faceColor() {
		if (this.slots.face) {
			return CharacterRenderConfig.getFaceColor(this.slots.face.id);
		}
		return "0";
	}
	set faceColor(col) {
		if (this.slots.face && col != this.faceColor) {
			let id = CharacterRenderConfig.getColorFaceID(this.slots.face.id, col);
			this.use(id);
		}
	}

	/**
	 * @param {CharacterChangeLog} changeLog
	 */
	commitChange(changeLog) {
		if (changeLog.ear) {
			this.ear = changeLog.ear;
		}

		if (this.useEquip) {
			for (let id of this.useEquip) {
				this.use(id);
			}
		}

		if (this.unuseEquip) {
			for (let id of this.unuseEquip) {
				this.unuse(id);
			}
		}

		if (changeLog.hair2 && changeLog.hairMix2) {
			this.slots.hairColor2 = changeLog.hair2;
			this.slots.hairMix2 = changeLog.hairMix2;
		}

		if (changeLog.hair3 && changeLog.hairMix3) {
			//this.slots.hairColor3 = changeLog.hair3;
			//this.slots.hairMix3 = changeLog.hairMix3;
		}
		
		if (changeLog.weapon && changeLog.weaponType) {
			this.use(changeLog.weapon, changeLog.weaponType);
		}
	}

	_stringify(genCode) {
		let result = this.slots._stringify();
		if (genCode) {
			return `chara._parse('${result}')`;
		}
		return result;
	}

	_outlink_old() {
		if (this.slots.body && this.slots.body.id && this.slots.face && this.slots.face.id && this.action && this.emotion) {
			let link = "https://labs.maplestory.io/api/GMS/latest/character/center/" + this.slots.body.id + "/";
			let slots = [...this.slots.enumerate()].map(a => parseInt(a.id, 10));

			slots[0] = this.slots.face.id + ":" + this.emotion;

			link += slots.join(",");

			link += "/" + this.action + "?showears=" + (this.elfEar ? "true" : "false");

			link += "&showLefEars=" + (this.lefEar ? "true" : "false");

			return link;
		}
		console.log("character need body, face, action, emotion");
	}
	
	_outlink(name) {
		const animationName = this.action;
		const frame = this.action_frame;
		const slots = this.slots;
		const itemList = JSON.stringify(makeItemList.call());
		return encodeURI(
				"https://maplestory.io/api/character/" +
				itemList.slice(1, itemList.length - 1) +    // not array
				"/" + animationName + "/" + frame + "?" +
				"showears=" + this.elfEar +
				"&showLefEars=" + this.lefEar +
				"&resize=1" +
				(name ? ("&name=" + name) : "") +
				"&flipX=" + Boolean(this.front > 0) +
				"&bgColor=0,0,0,0"
				);
		function makeItemList() {
			return Object.values(slots).filter(a => a).map(item => {
				return item.toJSON(animationName);
			});
		}
	}
	
	_download() {
		window.open(this._outlink());
	}

	_save_as_svg() {
		this.__texture_to_base64().then(frag_list => {
			let file_name = this.id + ".svg";
			//let frag_list = this.__frag_list;
	
			let svg = '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" >';

			svg += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink">\n';// width="64" height="96"

			svg += '<g transform="translate(32, 96)">';
			frag_list.forEach(function (ft) {
				if (ft && ft.relative) {
					let clz = ft.classList;
					svg += `\t<image class="${clz}" opacity="${ft.visible ? ft.opacity : 0}" x="${ft.relative.x}" y="${ft.relative.y}" width="${ft.width}" height="${ft.height}" xlink:href="${ft._url}"></image>\n`;
				}
			});
			svg += '</g>';

			svg += '<text x="0" y="122" fill="transparent">' + this._stringify(false) + '</text>';
			svg += '<text x="0" y="144" fill="transparent">' + JSON.stringify(this) + '</text>';

			svg += '</svg>';

			//let url = "data:text/plain;utf8," + svg;

			debugger;

			//window.open(url);
			DownloadData(svg, "image/svg+xml;utf8", file_name);
		});
	}

	/**
	 * "data:image/png;base64,[...]"
	 * @param {IRenderer} renderer
	 * @param {string} filename
	 * @returns {string}
	 */
	_save_as_png(renderer, filename) {
		let bound = this._calcBoundBox();
		let size = bound.size;
		let x = -bound.left;
		let y = bound.height;
		let angle = 0;
		let front = false;

		// use Canvas2, must not fail
		try {
			renderer.$swapCanvas();
		}
		catch (ex) {
			console.error(ex);
			return;
		}

		//save Canvas2 size, current ctx is _ctx2
		const c2w = renderer._ctx2.canvas.width;
		const c2h = renderer._ctx2.canvas.height;
		//
		renderer.ctx.canvas.width = size.x;
		renderer.ctx.canvas.height = size.y;

		try {
			this._draw(renderer, x, y, angle, front);
		}
		catch (ex) {
			console.error(ex);
			// nothing
		}

		let base64 = renderer.ctx.canvas.toDataURL("image/png");
		{
			let elem = document.createElement("a");

			let name = `${filename ? (filename+"."):""}${this.action}[${this.action_frame}].${this.emotion}[${this.emotion_frame}].png`;

			elem.id = name;
			elem.download = name;
			elem.href = base64;

			document.body.appendChild(elem);
			elem.click();
			document.body.removeChild(elem);
		}

		//restore Canvas2 size, current ctx is _ctx2
		renderer.ctx.canvas.width = c2w;
		renderer.ctx.canvas.height = c2h;

		// restore Canvas, must not fail
		try {
			renderer.$swapCanvas();
		}
		catch (ex) {
			console.error(ex);
			// nothing
		}

		return base64;
	}

	/**
	 * @returns {Promise<FragmentTexture[]>}
	 */
	async __texture_to_base64() {
		let frag_list = this.__frag_list;
		let tasks = [];

		frag_list.forEach(function (ft) {
			if (!ft) {
				return;
			}
			if (!ft._url.startsWith("data:")) {
				tasks.push((async function () {
					//ft.texture.$src = ft._url;
					ft._url = await toDataURL(ft.texture.src);
					return ft;
				})());
			}
			else {
				tasks.push(ft);
			}
			if (ft.graph2) {
				let src = ft.graph2.texture.src;
				if (!src.startsWith("data:")) {
					tasks.push((async function () {
						//ft.texture.$src = ft._url;
						ft.graph2._url = await toDataURL(src);
						return ft.graph2;
					})());
				}
				else {
					tasks.push(ft.graph2);
				}
			}
			if (ft.graph3) {
				let src = ft.graph3.texture.src;
				if (!src.startsWith("data:")) {
					tasks.push((async function () {
						//ft.texture.$src = ft._url;
						ft.graph3._url = await toDataURL(src);
						return ft.graph3;
					})());
				}
				else {
					tasks.push(ft.graph3);
				}
			}
		});

		return Promise.all(tasks);
	}
}
AddInitTask(CharacterRenderer.Init);

function* circularSequence(length, start=0) {
	let i = start;
	for (; i < length; ++i) {//a: 0, 1, 2, 3, ...b
		yield i;
	}
	for (i -= 2; i > 0; --i) {//b: 2, 1, ...a
		yield i;
	}
}

function* linearSequence(length, start=0) {
	for (let i = start; i < length; ++i) {
		yield i;
	}
}

function extract_number(input) {
	return String(input).match(/(-?\d+\.?\d*)|(\.\d*)/g);
}

/**
 * image href to data url
 */
function toDataURL(url) {
	return new Promise(function (resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.onload = function () {
			let reader = new FileReader();
			reader.onloadend = function () {
				resolve(reader.result);
			}
			reader.onerror = function (ev) {
				debugger;
				reject(ev);
			}
			reader.readAsDataURL(xhr.response);
		};
		xhr.open('GET', url);
		xhr.responseType = 'blob';
		xhr.send();
	});
}
