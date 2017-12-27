
import { Vec2 } from './math.js';

function colorInt24Parse2(col) {
	return "#" + [((col >> 16) & 0xFF), ((col >> 8) & 0xFF), (col & 0xFF)].map(a=>a.toString(16).padStart(2, "0")).join("");
}
function colorInt24Parse(col) {
	return "#" + [((col >> 16) & 0xFF), ((col >> 8) & 0xFF), (col & 0xFF)].map(a=>a.toString(16).padStart(2, "0")).join("");
}

export class ColorRGB {
	constructor(r=0, g=0, b=0) {
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
