
import { Vec2, clamp } from './math.js';

function colorInt24Parse2(col) {
	return "#" + [((col >> 16) & 0xFF), ((col >> 8) & 0xFF), (col & 0xFF)].map(a=>a.toString(16).padStart(2, "0")).join("");
}
function colorInt24Parse(col) {
	return "#" + [((col >> 16) & 0xFF), ((col >> 8) & 0xFF), (col & 0xFF)].map(a=>a.toString(16).padStart(2, "0")).join("");
}

export class ColorRGB {
	constructor(r = 0, g = 0, b = 0) {
		this.r = r;
		this.g = g;
		this.b = b;
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
	 * @return {{h:number,s:number,v:number}}
	 */
	toHsv() {
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

		return { h, s, v };
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
		var r, g, b;

		var i = Math.floor(h * 6);
		var f = h * 6 - i;
		var p = v * (1 - s);
		var q = v * (1 - f * s);
		var t = v * (1 - (1 - f) * s);

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
		var r, g, b;

		var i = Math.floor(h * 6);
		var f = h * 6 - i;
		var p = v * (1 - s);
		var q = v * (1 - f * s);
		var t = v * (1 - (1 - f) * s);

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
		let { h, s, v } = this.toHsv();
		//return `hue-rotate(${h*Math.PI*2}rad) saturate(${s}) brightness(${v})`;
		return `hue-rotate(${h * 360}deg) saturate(${clamp(Math.trunc(s * 100), 0, 100)}%) brightness(${clamp(Math.trunc(v * 100), 0, 100)}%)`;
	}
}

export class _ImageFilter {
	/**
	 * @param {number} hue 0 ~ 360
	 * @param {number} sat 0 ~ 100
	 * @param {number} bri 0 ~ 100
	 */
	constructor(hue = 0, sat = 100, bri = 100) {
		this._hue = hue;
		this._sat = sat;
		this._bri = bri;
	}
	/** @return {number} */
	get hue() {
		return this._hue;
	}
	set hue(value) {
		this._hue = clamp(value, 0, 360);
		if ((this._hue == 0 || this._hue == 360) && this._sat >= 100 && this._bri >= 100) {
			this.reset();
		}
	}
	/** @return {number} */
	get sat() {
		return this._sat;
	}
	set sat(value) {
		this._sat = clamp(value, 0, 100);
		if ((this._hue == 0 || this._hue == 360) && this._sat >= 100 && this._bri >= 100) {
			this.reset();
		}
	}
	/** @return {number} */
	get bri() {
		return this._bri;
	}
	set bri(value) {
		this._bri = clamp(value, 0, 100);
		if ((this._hue == 0 || this._hue == 360) && this._sat >= 100 && this._bri >= 100) {
			this.reset();
		}
	}

	toRgb() {
		return ColorRGB.fromHsv(this._hue / 360, this._sat / 100, this._bri / 100);
	}

	toString() {
		return `hue-rotate(${this._hue}deg) saturate(${this._sat}%) brightness(${this._bri}%)`;// + ImageFilter.globalFilter
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
	 */
	constructor(hue = 0, sat = 100, bri = 100) {
		super(hue, sat, bri);
		if (arguments.length) {
			this.__proto__ = _ImageFilter.prototype;
		}
	}
	/** @return {number} */
	get hue() {
		return 100;
	}
	set hue(value) {
		this._hue = clamp(value, 0, 360);
		this.__proto__ = _ImageFilter.prototype;
	}
	/** @return {number} */
	get sat() {
		return 100;
	}
	set sat(value) {
		this._sat = clamp(value, 0, 100);
		this.__proto__ = _ImageFilter.prototype;
	}
	/** @return {number} */
	get bri() {
		return 100;
	}
	set bri(value) {
		this._bri = clamp(value, 0, 100);
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
	this.__proto__ = ImageFilter.prototype;
}

/**
 * @param {number} hue 0 ~ 360
 * @param {number} sat 0 ~ 100
 * @param {number} bri 0 ~ 100
 */
_ImageFilter.prototype.set = function (hue, sat, bri) {
	if ((hue == 0 || hue == 360) && sat >= 100 && bri >= 100) {
		this.reset();
	}
	else {
		this.hue = hue;
		this.sat = sat;
		this.bri = bri;
	}
}

/**
 * @abstract
 */
export class IGraph {
	constructor(url, info) {
		let width, height;
		
		/** @type {Promise} if loaded will delete */
		this.$promise = null;
		
		/** @type {WebGLBuffer} */
		this._vbo = null;

		this.x = 0;
		this.y = 0;
		//this.width = 0;
		//this.height = 0;

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

		if (url) {
			this.src = url;
		}
		else {
			this._url = "";
		}
	}
	_dispose() {
		//only check is loaded
		if (this._isLoaded()) {
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
		return new Engine();
	}
	/**
	 * @returns {WebGLRenderingContext}
	 */
	get _gl() {
		throw new Error("Not Implement");
		return new WebGLRenderingContext();
	}
	/**
	 * @returns {CanvasRenderingContext2D}
	 */
	get _ctx() {
		throw new Error("Not Implement");
		return new CanvasRenderingContext2D();
	}

	//get width() { return this.matrix[0]; }
	//set width(val) { this.matrix[0] = val; }

	//get height() { return this.matrix[5]; }
	//set height(val) { this.matrix[5] = val; }

	//get x() { return this.matrix[12]; }
	//set x(val) { this.matrix[12] = val; }

	//get y() { return this.matrix[13]; }
	//set y(val) { this.matrix[13] = val; }

	get z() { return 0; }
	//get z() { return this.matrix[14]; }
	//set z(val) { this.matrix[14] = val; }

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
		if (this._url == "") {
			debugger;
			return false;
		}

		var image = new Image();

		this.$promise = (function (that) {
			return new Promise(function (resolve, reject) {
				image.addEventListener("load", function (e) {
					const engine = that._engine;
					
					if (!e.target.naturalWidth || !e.target.naturalHeight) {
						debugger;
					}

					that.isLoaded = that._isLoaded;

					delete that.width;
					that.width = e.target.naturalWidth;

					delete that.height;
					that.height = e.target.naturalHeight;

					delete that.texture;
					that.texture = engine._handleImageLoaded(e.target, that);
					
					delete that.$promise;

					resolve(that);
				}, false);
			});
		})(this);

		IGraph.$all_promise.push(this.$promise);

		image.src = this._url;
	}

	static async waitAllLoaded(cbfunc) {
		var tasks = IGraph.$all_promise;
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

	/** @type {HTMLCanvasElement} */
	get _canvas() {
		throw new Error("Not implement");
	}

	/** @type {Vec2} */
	get screen_size() {
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
		throw new Error("Not implement");
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
		throw new Error("Not implement");
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
		throw new Error("Not implement");
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
