
import { Vec2, Rectangle } from "./math.js";
import { IGrpah, IRenderer } from "./IRenderer.js";

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
		super(url, {
			width: raw.__w,
			height: raw.__h,
		});

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
				console.group("no texture");
				console.warn(raw);
				console.groupEnd();
				throw new Error("no texture");
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
		if (propertyName in this._raw) {
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


