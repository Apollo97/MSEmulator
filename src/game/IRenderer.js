﻿
import { Vec2, clamp } from './math.js';

function colorInt24Parse2(col) {
	return "#" + [((col >> 16) & 0xFF), ((col >> 8) & 0xFF), (col & 0xFF)].map(a=>a.toString(16).padStart(2, "0")).join("");
}
function colorInt24Parse(col) {
	return "#" + [((col >> 16) & 0xFF), ((col >> 8) & 0xFF), (col & 0xFF)].map(a=>a.toString(16).padStart(2, "0")).join("");
}


/**
 * @interface
 */
class IColor {
	toFilter() {
	}
	toFilterLimit() {
	}
}

/**
 * @implements {IColor}
 */
export class ColorRGB {
	constructor(r = 0, g = 0, b = 0) {
		/** @type {number} - int value: 0 ~ 255 */
		this.r = r;

		/** @type {number} - int value: 0 ~ 255 */
		this.g = g;

		/** @type {number} - int value: 0 ~ 255 */
		this.b = b;
	}
	clone() {
		return new this.constructor(this.r, this.g, this.b);
	}
	selfAdd(rgb) {
		this.r += rgb.r;
		this.g += rgb.g;
		this.b += rgb.b;
		return this;
	}
	selfSub(rgb) {
		this.r += rgb.r;
		this.g += rgb.g;
		this.b += rgb.b;
		return this;
	}
	selfScale(s) {
		this.r *= s;
		this.g *= s;
		this.b *= s;
		return this;
	}
	static add(rgb, rgb2) {
		return new ColorRGB(rgb.r + rgb2.r, rgb.g + rgb2.g, rgb.b + rgb2.b);
	}
	static sub(rgb, rgb2) {
		return new ColorRGB(rgb.r - rgb2.r, rgb.g - rgb2.g, rgb.b - rgb2.b);
	}
	static scale(rgb, s) {
		return new ColorRGB(rgb.r * s, rgb.g * s, rgb.b * s);
	}
	toString() {
		const r = Math.trunc(this.r);
		const g = Math.trunc(this.g);
		const b = Math.trunc(this.b);
		return "rgb(" + r + "," + g + "," + b + ")";
	}
	static fromInt24(col) {
		return new ColorRGB((col >> 16) & 0xFF, (col >> 8) & 0xFF, col & 0xFF);
	}
	/**
	 * source: https://gist.github.com/mjackson/5311256#file-color-conversion-algorithms-js-L84
	 * Converts an RGB color value to HSV. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
	 * Assumes r, g, and b are contained in the set [0, 255] and
	 * returns h, s, and v in the set [0, 1].
	 *
	 * @returns {ColorHSV}
	 */
	toHSV() {
		let r = this.r /= 255, g = this.g /= 255, b = this.b /= 255;

		let max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h, s, v = max;

		let d = max - min;
		s = max == 0 ? 0 : d / max;

		if (max == min) {
			h = 0; // achromatic
		} else {
			switch (max) {
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}

			h /= 6;
		}

		return new ColorHSV(h, s, v);
	}
	/**
	 * source: https://gist.github.com/mjackson/5311256#file-color-conversion-algorithms-js-L119
	 * Converts an HSV color value to RGB. Conversion formula
	 * adapted from http://en.wikipedia.org/wiki/HSV_color_space.
	 * Assumes h, s, and v are contained in the set [0, 1] and
	 * returns r, g, and b in the set [0, 255].
	 *
	 * @param {number} h The hue
	 * @param {number} s The saturation
	 * @param {number} v The value
	 */
	fromHsv(h, s, v) {
		let r, g, b;

		let i = Math.floor(h * 6);
		let f = h * 6 - i;
		let p = v * (1 - s);
		let q = v * (1 - f * s);
		let t = v * (1 - (1 - f) * s);

		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}

		this.r = r * 255;
		this.g = g * 255;
		this.b = b * 255;
	}
	static fromHsv(h, s, v) {
		let r, g, b;

		let i = Math.floor(h * 6);
		let f = h * 6 - i;
		let p = v * (1 - s);
		let q = v * (1 - f * s);
		let t = v * (1 - (1 - f) * s);

		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}

		return new ColorRGB(r * 255, g * 255, b * 255);
	}
	toFilter() {
		let { h, s, v } = this.toHSV();
		return `hue-rotate(${h*Math.PI*2}rad) saturate(${s}) brightness(${v})`;
	}
	toFilterLimit() {
		return `hue-rotate(${h * 360}deg) saturate(${clamp(Math.trunc(s * 100), 0, 100)}%) brightness(${clamp(Math.trunc(v * 100), 0, 100)}%)`;
	}
	toFilter_HueRotate() {
		const { h, s, v } = this;
		//return `hue-rotate(${h*Math.PI*2}rad)`;
		return `hue-rotate(${h * 360}deg)`;
	}
}

/**
 * @implements {IColor}
 */
export class ColorHSV {
	constructor(h = 0, s = 0, v = 0) {
		/** @type {number} - float value: 0 ~ 1 */
		this.h = h;

		/** @type {number} - float value: 0 ~ 1 */
		this.s = s;

		/** @type {number} - float value: 0 ~ 1 */
		this.v = v;
	}
	clone() {
		return new this.constructor(this.h, this.s, this.v);
	}
	selfAdd(hsv) {
		this.h += hsv.h;
		this.s += hsv.s;
		this.v += hsv.v;
		return this;
	}
	selfSub(hsv) {
		this.h += hsv.h;
		this.s += hsv.s;
		this.v += hsv.v;
		return this;
	}
	selfScale(s) {
		this.h *= s;
		this.s *= s;
		this.v *= s;
		return this;
	}
	static add(hsv, hsv2) {
		return new ColorHSV(hsv.s + hsv2.s, hsv.s + hsv2.s, hsv.v + hsv2.v);
	}
	static sub(hsv, hsv2) {
		return new ColorHSV(hsv.s - hsv2.s, hsv.s - hsv2.s, hsv.v - hsv2.v);
	}
	static scale(hsv, s) {
		return new ColorHSV(hsv.h * s, hsv.s * s, hsv.v * s);
	}
	toString() {
		const { h, s, v } = this;
		return "hsv(" + h + "," + s + "," + v + ")";
	}

	//toRgb() {
	//}
	//fromRgb(r, g, b) {
	//}

	//static fromRgb(r, g, b) {
	//}

	toFilter() {
		const { h, s, v } = this;
		return `hue-rotate(${h*Math.PI*2}rad) saturate(${s}) brightness(${v})`;
	}
	toFilterLimit() {
		return `hue-rotate(${h * 360}deg) saturate(${clamp(Math.trunc(s * 100), 0, 100)}%) brightness(${clamp(Math.trunc(v * 100), 0, 100)}%)`;
	}
	toFilter_HueRotate() {
		const { h, s, v } = this;
		//return `hue-rotate(${h*Math.PI*2}rad)`;
		return `hue-rotate(${h * 360}deg)`;
	}
}

export class _ImageFilter {
	/**
	 * @param {number} hue 0 ~ 360
	 * @param {number} sat 0 ~ 100
	 * @param {number} bri 0 ~ 100
	 * @param {number} contrast 0 ~ 100
	 */
	constructor(hue = 0, sat = 100, bri = 100, contrast = 100) {
		this._hue = hue;
		this._sat = sat;
		this._bri = bri;
		this._contrast = contrast;
	}
	/** @returns {number} */
	get hue() {
		return this._hue;
	}
	set hue(value) {
		this._hue = value % 360;
		if ((this._hue % 360 == 0) && this._sat == 100 && this._bri == 100 && this._contrast == 100) {
			this.reset();
		}
	}
	/** @returns {number} */
	get sat() {
		return this._sat;
	}
	set sat(value) {
		this._sat = Math.max(0, value);
		if ((this._hue % 360 == 0) && this._sat == 100 && this._bri == 100 && this._contrast == 100) {
			this.reset();
		}
	}
	/** @returns {number} */
	get bri() {
		return this._bri;
	}
	set bri(value) {
		this._bri = Math.max(0, value);
		if ((this._hue % 360 == 0) && this._sat == 100 && this._bri == 100 && this._contrast == 100) {
			this.reset();
		}
	}

	/** @returns {number} */
	get contrast() {
		return this._contrast;
	}
	set contrast(value) {
		this._contrast = Math.max(0, value);
		if ((this._hue % 360 == 0) && this._sat == 100 && this._bri == 100 && this._contrast == 100) {
			this.reset();
		}
	}

	toRgb() {
		return ColorRGB.fromHsv(this._hue / 360, this._sat / 100, this._bri / 100);
	}

	toString() {
		return `hue-rotate(${this._hue}deg) saturate(${this._sat}%) brightness(${this._bri}%) contrast(${this._contrast}%)`;// + ImageFilter.globalFilter
	}
}

/**
 * default no filter
 */
export class ImageFilter extends _ImageFilter {
	/**
	 * @param {number} hue 0 ~ 360
	 * @param {number} sat 0 ~ 100
	 * @param {number} bri 0 ~ 100
	 * @param {number} contrast 0 ~ 100
	 */
	constructor(hue = 0, sat = 100, bri = 100, contrast = 100) {
		super(hue, sat, bri, contrast);
		if (arguments.length) {
			this.__proto__ = _ImageFilter.prototype;
		}
	}
	/** @returns {number} */
	get hue() {
		return 0;
	}
	set hue(value) {
		this._hue = value % 360;
		this.__proto__ = _ImageFilter.prototype;
	}
	/** @returns {number} */
	get sat() {
		return 100;
	}
	set sat(value) {
		this._sat = Math.max(0, value);
		this.__proto__ = _ImageFilter.prototype;
	}
	/** @returns {number} */
	get bri() {
		return 100;
	}
	set bri(value) {
		this._bri = Math.max(0, value);
		this.__proto__ = _ImageFilter.prototype;
	}

	/** @returns {number} */
	get contrast() {
		return 100;
	}
	set contrast(value) {
		this._contrast = Math.max(0, value);
		this.__proto__ = _ImageFilter.prototype;
	}

	toRgb() {
		return new ColorRGB(255, 255, 255);
	}

	toString() {
		return "none";//ImageFilter.globalFilter ? ImageFilter.globalFilter : "none";
	}

	get isEmpty() {
		return true;
	}
}

_ImageFilter.prototype.reset = function () {
	this._hue = 0;
	this._sat = 100;
	this._bri = 100;
	this._contrast = 100;
	this.__proto__ = ImageFilter.prototype;
}

/**
 * @param {number} hue 0 ~ 360
 * @param {number} sat 0 ~ 100
 * @param {number} bri 0 ~ 100
 * @param {number} contrast 0 ~ 100
 */
_ImageFilter.prototype.set = function (hue, sat, bri, contrast) {
	if ((hue % 360 == 0) && sat == 100 && bri == 100 && contrast == 100) {
		this.reset();
	}
	else {
		this.hue = hue;
		this.sat = sat;
		this.bri = bri;
		this._contrast = contrast;
	}
}

/**
 * @abstract
 */
export class IGraph {
	constructor(url, info) {
		/** @type {number} */
		let width;
		/** @type {number} */
		let height;

		/** @type {{ src: string, naturalWidth: number, naturalHeight: number }} */
		this.texture = null;
		
		/** @type {Promise} if loaded will delete */
		this.$promise = undefined;
		
		/** @type {WebGLBuffer} */
		this._vbo = undefined;

		/** @type {number} - origin.x */
		this.x = 0;
		/** @type {number} - origin.y */
		this.y = 0;

		if (info) {
			if (info.width > 0) {
				width = Number(info.width);
			}
			if (info.height > 0) {
				height = Number(info.height);
			}
		}
		else {
			width = 0;
			height = 0;
		}
		/** @type {number} */
		this.width = width;
		/** @type {number} */
		this.height = height;
		//
		Object.defineProperty(this, "width", {
			configurable: true,
			enumerable: true,
			get: function () {
				this._isLoaded_or_doload();
				return width;
			},
			set: function (value) {
				debugger;//not override
			}
		});
		Object.defineProperty(this, "height", {
			configurable: true,
			enumerable: true,
			get: function () {
				this._isLoaded_or_doload();
				return height;
			},
			set: function (value) {
				debugger;//not override
			}
		});

		/** @type {WebGLTexture} */
		/** this.texture = null; */
		Object.defineProperty(this, "texture", {
			configurable: true,
			enumerable: true,
			get: function () {
				this.__isLoading_or_doload();
				return null;
			},
			set: function (value) {
				debugger;//not override
			}
		});

		this.isLoaded = this._isLoaded_or_doload;

		/** @type {function():void} */
		//this._onload = null;

		/** @type {string} */
		this._url = "";
		if (url) {
			this.src = url;
		}
	}
	_dispose() {
		//only check is loaded
		if (this._isLoaded()) {
			//this._engine.deleteGraph(this);

			if (this._gl) {
				alert("gl.deleteTexture(this.texture)");
				this._gl.deleteTexture(this.texture);
			}
			this.texture = null;
		}
	}

	draw() {
		throw new Error("Not Implement");
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	draw2(x, y) {
		throw new Error("Not Implement");
	}

	/**
	 * @returns {IRenderer}
	 */
	get _engine() {
		throw new Error("Not Implement");
	}
	/**
	 * @returns {WebGLRenderingContext}
	 */
	get _gl() {
		throw new Error("Not Implement");
	}
	/**
	 * @returns {CanvasRenderingContext2D}
	 */
	get _ctx() {
		throw new Error("Not Implement");
	}

	//get width() { return this.matrix[0]; }
	//set width(val) { this.matrix[0] = val; }

	//get height() { return this.matrix[5]; }
	//set height(val) { this.matrix[5] = val; }

	//get x() { return this.matrix[12]; }
	//set x(val) { this.matrix[12] = val; }

	//get y() { return this.matrix[13]; }
	//set y(val) { this.matrix[13] = val; }

	/** ?? */
	get z() { return 0; }
	//get z() { return this.matrix[14]; }
	//set z(val) { this.matrix[14] = val; }

	/** ?? */
	set src(url) {
		debugger;//this.src is broken;
		
		this._dispose();
		this._url = url;
	}

	_isLoaded() {
		return this.texture != null;
	}
	_isLoaded_or_doload() {
		if (!this.texture) {
			this.__loadTexture();
			return false;
		}
		return true;
	}
	__isLoading_or_doload() {
		if (this.$promise === null) {
			this.__loadTexture();
			return false;
		}
		return true;
	}

	__loadTexture() {
		if (this.$promise) {
			return;
		}
		if (this._url == "") {
			debugger;
			return false;
		}

		let image = new Image();

		this.$promise = new Promise((resolve, reject) => {
			const engine = this._engine;

			image.addEventListener("load", e => {
				if (!e.target.naturalWidth || !e.target.naturalHeight) {
					debugger;
				}

				this.isLoaded = this._isLoaded;//end

				delete this.width;
				this.width = e.target.naturalWidth;

				delete this.height;
				this.height = e.target.naturalHeight;

				delete this.texture;
				this.texture = engine._handleImageLoaded(e.target, this);
					
				delete this.$promise;

				resolve(this);
			}, false);

			image.addEventListener("error", e => {
				this.isLoaded = this._isLoaded;//no try again

				if (this._graph_rect) {
					delete this.texture;
					this.texture = this._graph_rect;
				}
				console.error("404: " + image.src);

				resolve(this);
			}, false);
		});

		IGraph.$all_promise.push(this.$promise);

		image.src = $get.imageUrl(this._url);
	}

	static async waitAllLoaded(cbfunc) {
		let tasks = IGraph.$all_promise;
		console.log("image loaded: " + IGraph.$all_promise.length);
		IGraph.$all_promise = [];
		await Promise.all(tasks);
		if (cbfunc) {
			cbfunc();
		}
	}
}
IGraph.$all_promise = [];

export class IRenderer {
	constructor() {
		/** @type {IGraph} */
		this._GraphType = null;

		/**
		 * @type {CanvasRenderingContext2D}
		 */
		this.ctx = null;
		
		this._globalAlpha = 1;
		this._globalAlphaStack = [];
		
		/** @type {Vec2} */
		this.screen_size = new Vec2(0, 0);
	}

	/**
	 * @param {string} id
	 */
	init(id) {
		throw new Error("Not implement");
	}

	/** @type {IGraph} */
	get Graph() {
		throw new Error("Not implement");
		return new IGraph();
	}

	/**
	 * swap Canvas and Canvas2
	 * if (imageSmoothingEnabled) this._ctx2.imageSmoothingEnabled = true;
	 * @param {boolean} imageSmoothingEnabled
	 */
	$swapCanvas(imageSmoothingEnabled) {
		throw new Error("Not implement");
	}

	/** @type {HTMLCanvasElement} */
	get _canvas() {
		throw new Error("Not implement");
	}

	/**
	 * @param {HTMLImageElement} image
	 * @param {IGraph} graph
	 * @param {Object} texture
	 */
	_handleImageLoaded(image, graph) {
		throw new Error("Not implement");
		return null;
	}

	/**
	 * @param {number} r
	 * @param {number} dx
	 * @param {number} dy
	 * @param {number} sx
	 * @param {number} sy
	 */
	setRotationTranslationScale(r, dx, dy, sx, sy) {
		throw new Error("Not implement");
	}
	
	/**
	 * @param {number} m11
	 * @param {number} m12
	 * @param {number} m21
	 * @param {number} m22
	 * @param {number} dx
	 * @param {number} dy
	 */
	setTransform(m11, m12, m21, m22, dx, dy) {
		throw new Error("Not implement");
	}

	loadIdentity() {
		throw new Error("Not implement");
	}
	pushMatrix() {
		throw new Error("Not implement");
	}
	popMatrix() {
		throw new Error("Not implement");
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	translate(x, y) {
		throw new Error("Not implement");
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	translate3d(x, y, z) {
		alert("'translate3d' is deprecated");
		throw new Error("'translate3d' is deprecated");
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	scale(x, y) {
		throw new Error("Not implement");
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	scale3d(x, y, z) {
		alert("'scale3d' is deprecated");
		throw new Error("'scale3d' is deprecated");
	}
	/**
	 * @param {number} r - rad
	 */
	rotate(r) {
		throw new Error("Not implement");
	}

	/** @type {number[]} */
	get color() {
		throw new Error("Not implement");
	}

	/** @type {number[]} - 4fv */
	set color(f4v) {
		throw new Error("Not implement");
	}

	/**
	 * @param {vec4} f4v - vec4: array
	 */
	Color4fv(f4v) {
		alert("'Color4fv' is deprecated");
		throw new Error("'Color4fv' is deprecated");
	}

	/**
	 * @type {number} global alpha
	 */
	get globalAlpha() {
		throw new Error("Not implement");
	}
	set globalAlpha(value) {
		throw new Error("Not implement");
	}

	pushGlobalAlpha() {
		throw new Error("Not implement");
	}

	popGlobalAlpha(value) {
		throw new Error("Not implement");
	}

	clearDrawScreen() {
		throw new Error("Not implement");
	}

	/**
	 * @param {IGraph} graph
	 */
	drawGraph(graph) {
		throw new Error("Not implement");
	}
	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	drawGraph2(graph, x, y, z) {
		throw new Error("Not implement");
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	drawRect(x, y, w, h) {
		if (arguments.length != 4) {
			console.error("drawRect(x, y, w, h) need 4 param");
		}
		throw new Error("Not implement");
	}
	
	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {ColorRGB} color
	 */
	drawColoredGraph(graph, x, y, color) {
		throw new Error("Not implement");
	}
}

export class ImageDataHelper {
	constructor() {
		this.canvas = document.createElement('canvas');
		this.ctx = this.canvas.getContext('2d');
	}

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	resize(width, height) {
		canvas.width = width;
		canvas.height = height;
	}

	clear() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.height);
	}
	
	/**
	 * @param {HTMLImageElement} image
	 * @returns {ImageData}
	 */
	imageToImagedata(image) {
		const canvas = this.canvas;
		const ctx = this.ctx;

		canvas.width = image.width;
		canvas.height = image.height;
		ctx.drawImage(image, 0, 0);

		return ctx.getImageData(0, 0, image.width, image.height);
	}

	/**
	 * @param {ImageData} imagedata
	 * @returns {string}
	 */
	imagedataToDataURL(imagedata) {
		const canvas = this.canvas;
		const ctx = this.ctx;

		canvas.width = imagedata.width;
		canvas.height = imagedata.height;
		ctx.putImageData(imagedata, 0, 0);
		
		return canvas.toDataURL();
	}

	/**
	 * @param {ImageData} imagedata
	 * @returns {HTMLImageElement}
	 */
	imagedataToImage(imagedata) {
		const canvas = this.canvas;
		const ctx = this.ctx;

		canvas.width = imagedata.width;
		canvas.height = imagedata.height;
		ctx.putImageData(imagedata, 0, 0);

		let image = new Image();
		image.src = canvas.toDataURL();
		return image;
	}
}
