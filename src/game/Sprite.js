
import { Vec2, Rectangle } from "./math.js";
import { IGrpah, IRenderer, IGraph } from "./IRenderer.js";

import { engine, Graph } from "./Engine.js";


/**
 * @extends {IGraph}
 */
export class SpriteBase extends Graph {
	/**
	 * @param {!any} raw
	 * @param {string=} url
	 */
	constructor(raw, url) {
		if (raw) {
			super(url, {
				width: raw.__w,
				height: raw.__h,
			});
		}
		else {
			super();
			return;
		}

		this._raw = raw;
		
		//this.src is broken;

		if (url) {
			debugger
			this._url = url;
			//this._loadTexture(url);//_loadTexture: undefined
		}
		else if (SpriteBase.isTexture(raw) !== false) {
			this._url = raw[""];
		}
	}

	static isTexture(raw) {
		if (raw) {
			if (raw.hasOwnProperty("")) {
				if (raw[""] == "") {
					return true;
				}
				else if (raw[""].startsWith("data:image/")) {
					return 0;
				}
			}
			else {
				if (!raw.__isEmpty) {
					console.group("no texture");
					console.warn(raw);
					console.groupEnd();
					throw new Error("no texture");
				}
			}
		}
		return false;
	}
	static isTextureHasData(raw) {
		return raw && typeof raw[""] == 'string' && raw[""].startsWith("data:image/");
	}

	set z(value) {
		this._order = value;
	}
	get z() {
		return this._order;
	}
	
	/**
	 * try construct value from raw data
	 * @param {T} defaultValue
	 * @param {string} propertyName
	 * @param {function(any):T} constructor
	 * @returns {T}
	 * @template T
	 */
	_get(defaultValue, propertyName, converter) {
		if (!this._raw) {
			debugger;
		}
		else if (propertyName in this._raw) {
			return converter(this._raw[propertyName]);
		}
		return defaultValue;
	}

	draw() {
		this._engine.drawGraph(this);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	draw2(x, y) {
		this._engine.drawGraph2(this, x, y);
	}
}


export class Sprite extends SpriteBase {
	/**
	 * @param {!any} raw
	 * @param {string=} url
	 */
	constructor(raw, url) {
		super(raw, url);

		var origin = this._get(new Vec2(0, 0), "origin", Vec2.get);
		this.x = origin.x;
		this.y = origin.y;

		this.z = this._get(0, "z", Number);

		this.delay = this._get(100, "delay", Number);
	}
}

export class _PatternSprite_Loaded extends Sprite {
	/**
	 * @param {!any} raw
	 * @param {string=} url
	 */
	constructor(raw, url) {
		super(raw, url);

		/** @type {string} */
		this._direction = null;

		/** @type {CanvasPattern} */
		this._pattern = null;
	}

	///** @type {string} */
	//get direction() {
	//	return this._direction;
	//}
	//set direction(value) {
	//	if (value && this._direction != value) {
	//		this._direction = value;
	//
	//		//reload;
	//		this._pattern = null;
	//		this.__proto__ = PatternSprite.prototype;
	//	}
	//}

	//drawPattern(w, h) {
	//	if (this.direction && this._pattern) {
	//		/** @type {IRenderer} */
	//		const _engine = this._engine;
	//		const ctx = _engine.ctx;
	//
	//		ctx.rect(-this.x, -this.y, w, h);
	//		ctx.fillStyle = this._pattern;
	//		ctx.fill();
	//		ctx.fillStyle = "no-repeat";
	//	}
	//}

	//drawPattern2(x, y, w, h) {
	//	if (this.direction && this._pattern) {
	//		/** @type {IRenderer} */
	//		const _engine = this._engine;
	//		const ctx = _engine.ctx;
	//
	//		ctx.rect(x - this.x, y - this.y, w, h);
	//		ctx.fillStyle = this._pattern;
	//		ctx.fill();
	//		ctx.fillStyle = "no-repeat";
	//	}
	//}

	///** @returns {"repeat"} */
	//get e_repeat() {
	//	return "repeat";
	//}
	///** @returns {"repeat-x"} */
	//get e_repeat_x() {
	//	return "repeat-x";
	//}
	///** @returns {"repeat-y"} */
	//get e_repeat_y() {
	//	return "repeat-y";
	//}
	///** @returns {"no-repeat"} */
	//get e_noRepeat() {
	//	return "no-repeat";
	//}
}

export class PatternSprite extends _PatternSprite_Loaded {
	drawPattern(w, h) {
		this.drawPattern2(0, 0, w, h);
	}
	drawPattern2(x, y, w, h) {
		if (this.isLoaded()) {
			/** @type {IRenderer} */
			const _engine = this._engine;
			const ctx = _engine.ctx;

			ctx.save();
			{
				ctx.rect(x, y, w, h);
				ctx.clip();
				
				let left = x;
				let top = y;
				let right = x + w;
				let bottom = y + h;

				for (let i = left; i < right; i += this.width) {
					for (let j = top; j < bottom; j += this.height) {
						this.draw2(i, j);
					}
				}
			}
			ctx.restore();
		}
	}

	//drawPattern(w, h) {
	//	if (this.direction) {
	//		/** @type {IRenderer} */
	//		const _engine = this._engine;
	//		const ctx = _engine.ctx;
	//
	//		if (!this._pattern) {
	//			if (this.isLoaded()) {
	//				this._pattern = ctx.createPattern(this.texture, this.direction);
	//				this.__proto__ = _PatternSprite_Loaded.prototype;
	//				this.drawPattern(w, h);
	//			}
	//		}
	//	}
	//}

	//drawPattern2(x, y, w, h) {
	//	if (this.direction) {
	//		/** @type {IRenderer} */
	//		const _engine = this._engine;
	//		const ctx = _engine.ctx;
	//
	//		if (!this._pattern) {
	//			if (this.isLoaded()) {
	//				this._pattern = ctx.createPattern(this.texture, this.direction);
	//				this.__proto__ = _PatternSprite_Loaded.prototype;
	//				this.drawPattern2(x, y, w, h);
	//			}
	//		}
	//	}
	//}
}
