
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
		this._engine.drawGraph2(this, x - this.x, y - this.y);
	}
	/**
	 * @param {number} x - type: int
	 * @param {number} y - type: int
	 */
	draw2i(x, y) {
		this._engine.drawGraph2(this, Math.trunc(x - this.x + 0.5), Math.trunc(y - this.y + 0.5));
	}
}


export class Sprite extends SpriteBase {
	/**
	 * sprite = new Sprite(rawData);//不會載入image
	 * sprite._url = img_url;//不會載入image
	 *
	 * 會觸發載入image的method
	 * draw(), isLoaded(), get width(), get height()
	 * 
	 * 手動載入image: __loadTexture()
	 * 
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
	
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	drawPattern(x, y, w, h) {
		if (!this.isLoaded()) {
			return;//sprite require property: width, height
		}
		/** @type {CanvasRenderingContext2D} */
		const ctx = this._engine.ctx;

		ctx.save();
		try {
			ctx.rect(x, y, w, h);
			ctx.clip();

			let left = x;
			let top = y;
			let right = x + w;
			let bottom = y + h;

			for (let i = top; i < bottom; i += this.height) {
				for (let j = left; j < right; j += this.width) {
					this.draw2(j, i);
				}
			}
		}
		catch (ex) {
			console.error(ex);
			debugger;
		}
		ctx.restore();
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 */
	drawHorizontalPattern(x, y, w) {
		if (!this.isLoaded()) {
			return;//sprite require property: width, height
		}
		/** @type {CanvasRenderingContext2D} */
		const ctx = this._engine.ctx;

		ctx.save();
		try {
			const left = x;
			const right = x + w;

			for (let j = left; j < right; j += this.width) {
				this.draw2(j, y);
			}
		}
		catch (ex) {
			console.error(ex);
			debugger;
		}
		ctx.restore();
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} h
	 */
	drawVerticalPattern(x, y, h) {
		if (!this.isLoaded()) {
			return;//sprite require property: width, height
		}
		/** @type {CanvasRenderingContext2D} */
		const ctx = this._engine.ctx;

		ctx.save();
		try {
			const top = y;
			const bottom = y + h;

			for (let i = top; i < bottom; i += this.height) {
				this.draw2(x, i);
			}
		}
		catch (ex) {
			console.error(ex);
			debugger;
		}
		ctx.restore();
	}

	/**
	 * without clip
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	_drawPattern(x, y, w, h) {
		if (!this.isLoaded()) {
			return;//sprite require property: width, height
		}
		/** @type {CanvasRenderingContext2D} */
		const ctx = this._engine.ctx;

		const left = x;
		const top = y;
		const right = x + w;
		const bottom = y + h;

		for (let i = top; i < bottom; i += this.height) {
			for (let j = left; j < right; j += this.width) {
				this.draw2(j, i);
			}
		}
	}

	/**
	 * without clip
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 */
	_drawHorizontalPattern(x, y, w) {
		if (!this.isLoaded()) {
			return;//sprite require property: width, height
		}
		/** @type {CanvasRenderingContext2D} */
		const ctx = this._engine.ctx;

		const left = x;
		const right = x + w;

		for (let j = left; j < right; j += this.width) {
			this.draw2(j, y);
		}
	}

	/**
	 * without clip
	 * @param {number} x
	 * @param {number} y
	 * @param {number} h
	 */
	_drawVerticalPattern(x, y, h) {
		if (!this.isLoaded()) {
			return;//sprite require property: width, height
		}
		/** @type {CanvasRenderingContext2D} */
		const ctx = this._engine.ctx;

		const top = y;
		const bottom = y + h;

		for (let i = top; i < bottom; i += this.height) {
			this.draw2(x, i);
		}
	}


	/**
	 * @param {number} x - type: int
	 * @param {number} y - type: int
	 * @param {number} w - type: int
	 * @param {number} h - type: int
	 */
	drawPattern4i(x, y, w, h) {
		this.drawPattern(Math.trunc(x + 0.5), Math.trunc(y + 0.5), Math.trunc(w + 0.5), Math.trunc(h + 0.5));
	}
	/**
	 * @param {number} x - type: int
	 * @param {number} y - type: int
	 * @param {number} w - type: int
	 */
	drawHorizontalPattern3i(x, y, w) {
		this.drawHorizontalPattern(Math.trunc(x + 0.5), Math.trunc(y + 0.5), Math.trunc(w + 0.5));
	}
	/**
	 * @param {number} x - type: int
	 * @param {number} y - type: int
	 * @param {number} h - type: int
	 */
	drawVerticalPattern3i(x, y, h) {
		this.drawVerticalPattern(Math.trunc(x + 0.5), Math.trunc(y + 0.5), Math.trunc(h + 0.5));
	}
	/**
	 * without clip
	 * @param {number} x - type: int
	 * @param {number} y - type: int
	 * @param {number} w - type: int
	 * @param {number} h - type: int
	 */
	_drawPattern4i(x, y, w, h) {
		this._drawPattern(Math.trunc(x + 0.5), Math.trunc(y + 0.5), Math.trunc(w + 0.5), Math.trunc(h + 0.5));
	}
	/**
	 * without clip
	 * @param {number} x - type: int
	 * @param {number} y - type: int
	 * @param {number} w - type: int
	 */
	_drawHorizontalPattern3i(x, y, w) {
		this._drawHorizontalPattern(Math.trunc(x + 0.5), Math.trunc(y + 0.5), Math.trunc(w + 0.5));
	}
	/**
	 * without clip
	 * @param {number} x - type: int
	 * @param {number} y - type: int
	 * @param {number} h - type: int
	 */
	_drawVerticalPattern3i(x, y, h) {
		this._drawVerticalPattern(Math.trunc(x + 0.5), Math.trunc(y + 0.5), Math.trunc(h + 0.5));
	}
}

export class _$PatternSprite_Loaded extends Sprite {
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

	/** @type {string} */
	get direction() {
		return this._direction;
	}
	set direction(value) {
		if (value && this._direction != value) {
			this._direction = value;
	
			//reload;
			this._pattern = null;
			this.__proto__ = $PatternSprite.prototype;
		}
	}

	/**
	 * @param {number} w
	 * @param {number} h
	 */
	drawPattern(w, h) {
		if (this.direction && this._pattern) {
			/** @type {CanvasRenderingContext2D} */
			const ctx = this._engine.ctx;
	
			ctx.rect(-this.x, -this.y, w, h);
			ctx.fillStyle = this._pattern;
			ctx.fill();
			ctx.fillStyle = "no-repeat";
		}
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	drawPattern2(x, y, w, h) {
		if (this.direction && this._pattern) {
			/** @type {CanvasRenderingContext2D} */
			const ctx = this._engine.ctx;
	
			ctx.rect(x - this.x, y - this.y, w, h);
			ctx.fillStyle = this._pattern;
			ctx.fill();
			ctx.fillStyle = "no-repeat";
		}
	}

	/** @returns {"repeat"} */
	get e_repeat() {
		return "repeat";
	}
	/** @returns {"repeat-x"} */
	get e_repeat_x() {
		return "repeat-x";
	}
	/** @returns {"repeat-y"} */
	get e_repeat_y() {
		return "repeat-y";
	}
	/** @returns {"no-repeat"} */
	get e_noRepeat() {
		return "no-repeat";
	}
}

export class $PatternSprite extends _$PatternSprite_Loaded {
	drawPattern(w, h) {
		this.drawPattern2(0, 0, w, h);
	}
	drawPattern2(x, y, w, h) {
		if (this.isLoaded()) {
			/** @type {CanvasRenderingContext2D} */
			const ctx = this._engine.ctx;

			ctx.save();
			{
				ctx.rect(x, y, w, h);
				ctx.clip();
				
				let left = x;
				let top = y;
				let right = x + w;
				let bottom = y + h;

				for (let i = top; i < bottom; i += this.height) {
					for (let j = left; j < right; j += this.width) {
						this.draw2(j, i);
					}
				}
			}
			ctx.restore();
		}
	}
	/**
	 * @param {number} w
	 * @param {number} h
	 */
	drawPattern(w, h) {
		if (this.direction) {
			/** @type {CanvasRenderingContext2D} */
			const ctx = this._engine.ctx;
	
			if (!this._pattern) {
				if (this.isLoaded()) {
					this._pattern = ctx.createPattern(this.texture, this.direction);
					this.__proto__ = _$PatternSprite_Loaded.prototype;
					this.drawPattern(w, h);
				}
			}
		}
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	drawPattern2(x, y, w, h) {
		if (this.direction) {
			/** @type {CanvasRenderingContext2D} */
			const ctx = this._engine.ctx;
	
			if (!this._pattern) {
				if (this.isLoaded()) {
					this._pattern = ctx.createPattern(this.texture, this.direction);
					this.__proto__ = _$PatternSprite_Loaded.prototype;
					this.drawPattern2(x, y, w, h);
				}
			}
		}
	}
}
