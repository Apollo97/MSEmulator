
import { mat2d, vec2, mat4, quat } from 'gl-matrix';
import { Vec2 } from './math.js';
import { IGraph, IRenderer } from './IRenderer.js';


class Drawing2D {
	constructor(engine) {
		this.engine = engine;
	}

	/**
	 * @type {number} global alpha
	 */
	get globalAlpha() {
		return this.engine._color[3];
	}
	set globalAlpha(value) {
		this.engine._color[3] = value;
	}
}

Drawing2D.prototype.fillText = function (text, x, y) {
};
Drawing2D.prototype.strokeText = function (text, x, y) {
};
Drawing2D.prototype.measureText = function (text) {
	return {
		width: text.length * 12,
	};
};

Drawing2D.prototype.save = function () {
	throw new Error("Not implement");
};
Drawing2D.prototype.restore = function () {
	throw new Error("Not implement");
};
Drawing2D.prototype.translate = function (x, y) {
	throw new Error("Not implement");
};
Drawing2D.prototype.rotate = function (a) {
	throw new Error("Not implement");
};
Drawing2D.prototype.scale = function (x, y) {
	throw new Error("Not implement");
};
Drawing2D.prototype.setTransform = function (m11, m12, m21, m22, dx, dy) {
	this.engine.setRotationTranslationScale(0, dx, dy, m11, m22);
};

Drawing2D.prototype.createImageData = function (width, height) {
};
Drawing2D.prototype.getImageData = function (x, y, width, height) {
};
Drawing2D.prototype.putImageData = function (imageData, x, y) {
};
Drawing2D.prototype.fillRect = function (x, y, width, height) {
};
Drawing2D.prototype.strokeRect = function (x, y, width, height) {
};
Drawing2D.prototype.clearRect = function (x, y, width, height) {
};
Drawing2D.prototype.beginPath = function () {
};
Drawing2D.prototype.closePath = function () {
};
Drawing2D.prototype.moveTo = function (x, y) {
};
Drawing2D.prototype.lineTo = function (x, y) {
};
Drawing2D.prototype.quadraticCurveTo = function (cp1x, cp1y, x, y) {
};
Drawing2D.prototype.bezierCurveTo = function (cp1x, cp1y, cp2x, cp2y, x, y) {
};
Drawing2D.prototype.arcTo = function () {
};
Drawing2D.prototype.rect = function (x, y, w, h) {
};
Drawing2D.prototype.arc = function (x, y, radius, startAngle, endAngle, anticlockwise) {
};
Drawing2D.prototype.fill = function () {
};
Drawing2D.prototype.stroke = function () {
};
Drawing2D.prototype.clip = function () {
};
Drawing2D.prototype.isPointInPath = function () {
};
Drawing2D.prototype.drawFocusRing = function () {
};
Drawing2D.prototype.drawImage = function (image, a, b, c, d, e, f, g, h) {
	// throw new Error();
}


class ITexture extends IGraph {
	constructor() {
		super();
	}

	isLoaded() { return true; }
	_isLoaded() { return true; }
	/** @delete */
	_isLoaded_or_doload() { throw new TypeError(); }
	/** @delete */
	__isLoading_or_doload() { throw new TypeError(); }
	/** @delete */
	__loadTexture() { throw new TypeError(); }
}

/**
 * like IGraph
 * @extends ITexture
 */
class Surface {
	constructor() {
		/** @type {WebGLFramebuffer} */
		this.fbo = null;

		/** @type {WebGLTexture} */
		this.texture = null;
	}

	isLoaded() { return true; }
	_isLoaded() { return true; }
	/** @delete */
	_isLoaded_or_doload() { throw new TypeError(); }
	/** @delete */
	__isLoading_or_doload() { throw new TypeError(); }
	/** @delete */
	__loadTexture() { throw new TypeError(); }

	/**
	 * @param {WebGLRenderingContext} gl
	 * @param {number} [width=gl.canvas.width]
	 * @param {number} [height==gl.canvas.height]
	 */
	create(gl, width, height) {
		if (!gl) {
			throw new TypeError("gl");
		}

		if (width == null) {
			width = gl.canvas.width;
		}
		if (height == null) {
			height = gl.canvas.height;
		}

		Object.defineProperties(this, {
			width: {
				enumerable: true,
				value: width,
			},
			height: {
				enumerable: true,
				value: height,
			}
		});

		this.fbo = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.texture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);//NEAREST
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);//LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		//gl.generateMipmap(gl.TEXTURE_2D);

		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		let renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.width, this.height);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		const vertices = _createRectVertices(width, height);
		this._vbo = createVBO(gl, vertices);
	}

	//_beginDrawToBuffer() {
	//	const gl = this.gl;
	//	gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
	//}
	//_endDrawToBuffer() {
	//	const gl = this.gl;
	//	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	//}
}
/** @type {number} */Surface.prototype.x = 0;
/** @type {number} */Surface.prototype.y = 0;
/** @type {Float32Array} - ?? sprite */
Surface.prototype._matrix = null;


class Shader {
	constructor() {
		/** @type {WebGLShader} */
		this.vs = null;

		/** @type {WebGLShader} */
		this.fs = null;

		/** @type {WebGLProgram} */
		this.program = null;

		/** @type {number} */
		this.vertexPositionAttribute = null;
		/** @type {number} */
		this.textureCoordAttribute = null;

		/** @type {WebGLUniformLocation} */
		this.matrix_projection_location = null;
		/** @type {WebGLUniformLocation} */
		this.matrix_modelView_location = null;
		/** @type {WebGLUniformLocation} */
		this.color_location = null;
		/** @type {WebGLUniformLocation} */
		this.uniform_sampler = null;
		///** @type {WebGLUniformLocation} */
		//this.uniform_resolution = null;
	}

	/**
	 * @param {WebGLRenderingContext} gl
	 * @param {string} vsElemId
	 * @param {string} fsElemId
	 */
	create(gl, vsElemId, fsElemId) {
		this.vs = _createShader(gl, gl.VERTEX_SHADER, vsElemId);
		this.fs = _createShader(gl, gl.FRAGMENT_SHADER, fsElemId);
		
		this.program = createShaderProgram(gl, this.vs, this.fs);

		this.applyDefaultParamLocation(gl);
	}

	/**
	 * @param {WebGLRenderingContext} gl
	 */
	applyDefaultParamLocation(gl) {
		const program = this.program;

		gl.useProgram(program);

		this.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");
		gl.enableVertexAttribArray(this.vertexPositionAttribute);

		this.textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");
		gl.enableVertexAttribArray(this.textureCoordAttribute);

		this.matrix_projection_location = gl.getUniformLocation(program, "uPMatrix");
		this.matrix_modelView_location = gl.getUniformLocation(program, "uMVMatrix");

		this.color_location = gl.getUniformLocation(program, "uColor");
		this.uniform_sampler = gl.getUniformLocation(program, "uSampler");
		//this.uniform_resolution = gl.getUniformLocation(program, "uResolution");
		

		/** @type {nubmer} */
		program.vertexPositionAttribute = this.vertexPositionAttribute;
		/** @type {nubmer} */
		program.textureCoordAttribute = this.textureCoordAttribute;

		/** @type {WebGLUniformLocation} */
		program.matrix_projection_location = this.matrix_projection_location;
		/** @type {WebGLUniformLocation} */
		program.matrix_modelView_location = this.matrix_modelView_location;
		/** @type {WebGLUniformLocation} */
		program.color_location = this.color_location;
		/** @type {WebGLUniformLocation} */
		program.uniform_sampler = this.uniform_sampler;
		///** @type {WebGLUniformLocation} */
		//program.uniform_resolution = this.uniform_resolution;
	}
}


class GaussianBlurRenderer {
	constructor() {
		this.surface = [new Surface(), new Surface()];

		this.shader = new Shader();
	}

	/**
	 * @param {WebGLRenderer} renderer
	 */
	create(renderer) {
		const gl = renderer.gl;
		for (let surface of this.surface) {
			surface.create(gl);
		}
		this.shader.create(gl, "gaussian_blur_vs", "gaussian_blur_fs");
	}

	/**
	 * @param {WebGLRenderer} renderer
	 * @param {IGraph} src
	 * @param {number} amount
	 */
	applyBlur(renderer, src, amount) {
		const gl = renderer.gl;
		const grInfo = this.surface[0];

		let horizontal = 1, first_iteration = true;

		amount = Math.trunc(amount / 2) * 2;

		renderer.useShader(this.shader.program);
		let uHorizontal = gl.getUniformLocation(this.shader.program, "uHorizontal");
		let uTextureSize = gl.getUniformLocation(this.shader.program, "uTextureSize");
		gl.uniform2f(uTextureSize, grInfo.width, grInfo.height);
		if (0) {
		}
		else {
			//gl.uniform2fv(renderer._shader.uniform_resolution, renderer._resolution);
			gl.uniform4fv(renderer._shader.color_location, renderer._color);

			gl.uniformMatrix4fv(renderer._shader.matrix_projection_location, false, renderer._projectionMatrix);
			gl.uniformMatrix4fv(renderer._shader.matrix_modelView_location, false, renderer._modelViewMatrix);

			gl.bindBuffer(gl.ARRAY_BUFFER, grInfo._vbo/*renderer._cubeVerticesBuffer*/);
			gl.vertexAttribPointer(renderer._shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, renderer._cubeTextureCoordBuffer);
			gl.vertexAttribPointer(renderer._shader.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

			//renderer._bindDepthTexture(1);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer._cubeVerticesIndexBuffer);
		}
	
		{
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.surface[0].fbo);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.surface[1].fbo);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		}

		for (let i = 0; i < amount; ++i) {
			/** @type {IGraph} */
			const graph = first_iteration ? src : this.surface[horizontal ? 0 : 1];
			const _dst = this.surface[horizontal];

			gl.bindFramebuffer(gl.FRAMEBUFFER, _dst.fbo);
			
			gl.uniform1i(uHorizontal, horizontal);

			renderer._bindTexture(graph.texture, 0);
			if (0) {
				renderer.__drawRect(grInfo._vbo);
			}
			else {
				gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);//TRIANGLE_STRIP
			}

			horizontal = horizontal ? 0:1;
			if (first_iteration) {
				first_iteration = false;
			}
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		//output this.surface[1]
	}

	/**
	 * @param {WebGLRenderer} renderer
	 */
	draw(renderer) {
		renderer.drawGraph(this.surface[1]);
	}
}

class BloomRenderer {
	constructor() {
		this.brr = new GaussianBlurRenderer();
		this.brightColorShader = new Shader();
		this.bloomShader = new Shader();

		this.surfacebrightColor = new Surface();
	}

	/**
	 * @param {WebGLRenderer} renderer
	 * @param {IGraph} src
	 * @param {Surface} dst
	 * @param {number} amount
	 * @param {number} exposure
	 * @param {number} gamma
	 */
	applyBloom(renderer, src, dst, amount, exposure = 1.0, gamma = 2.2) {
		const gl = renderer.gl;
		const grInfo = this.brr.surface[0];

		{//get bright color
			renderer.useShader(this.brightColorShader.program);

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.surfacebrightColor.fbo);
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.uniformMatrix4fv(renderer._shader.matrix_projection_location, false, renderer._projectionMatrix);

			gl.bindBuffer(gl.ARRAY_BUFFER, grInfo._vbo);
			gl.vertexAttribPointer(renderer._shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, renderer._cubeTextureCoordBuffer);
			gl.vertexAttribPointer(renderer._shader.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer._cubeVerticesIndexBuffer);

			renderer._bindTexture(src.texture, 0);

			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		}

		//blur bright color
		this.brr.applyBlur(renderer, this.surfacebrightColor, amount);

		{//apply bloom
			renderer.useShader(this.bloomShader.program);

			if (dst) {
				gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
			}
			else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			}
			gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

			gl.uniformMatrix4fv(renderer._shader.matrix_projection_location, false, renderer._projectionMatrix);
			gl.uniform1f(this.uExposure, exposure);
			gl.uniform1f(this.uGamma, gamma);

			gl.bindBuffer(gl.ARRAY_BUFFER, grInfo._vbo);
			gl.vertexAttribPointer(renderer._shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, renderer._cubeTextureCoordBuffer);
			gl.vertexAttribPointer(renderer._shader.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, renderer._cubeVerticesIndexBuffer);

			renderer._bindTexture(src.texture, 0);
			{
				gl.activeTexture(gl.TEXTURE1);
				gl.bindTexture(gl.TEXTURE_2D, this.brr.surface[1].texture);
				gl.uniform1i(this.uBloomBlur, 1);
			}

			gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
		}
	}

	/**
	 * @param {WebGLRenderer} renderer
	 */
	create(renderer) {
		this.brr.create(renderer);

		this.surfacebrightColor.create(renderer.gl);

		this.brightColorShader.create(renderer.gl, "bloom_vs", "brightColor_fs");
		this.bloomShader.create(renderer.gl, "bloom_vs", "bloom_fs");
		
		this.uBloomBlur = renderer.gl.getUniformLocation(this.bloomShader.program, "uBloomBlur");
		this.uExposure = renderer.gl.getUniformLocation(this.bloomShader.program, "uExposure");
		this.uGamma = renderer.gl.getUniformLocation(this.bloomShader.program, "uGamma");
	}
}


/**
 * @implements {IRenderer}
 */
export class WebGLRenderer extends IRenderer {
	constructor() {
		super();

		/** @type {IGraph} */
		this._graph_rect = null;

		this._projectionMatrix = mat4.create();
		this._modelViewMatrix = mat4.create();
		this.viewMatrix = mat4.create();

		/** @type {WebGLRenderingContext} */
		this.gl = null;

		/** @type {vec2} */
		//this._resolution = new vec2.create(0, 0);
		
		//this.rttFramebuffer = null;
		//this.rttTexture = null;

		//this._cubeVerticesBuffer = null;
		//this._cubeVerticesColorBuffer = null;
		this._cubeTextureCoordBuffer = null;
		this._cubeVerticesIndexBuffer = null;

		/** @type {WebGLProgram} */
		this.shaderProgram = null;

		/** @type {WebGLProgram} */
		this.fxaaProgram = null;

		/** @type {WebGLProgram} */
		this._shader = null;

		//this.vertexPositionAttribute = null;
		////this.vertexColorAttribute = null;
		//this.textureCoordAttribute = null;

		//this.matrix_projection_location = null;
		//this.matrix_modelView_location = null;
		//this.matrix_model_location = null;

		//this.color_location = null;
		//this.uniform_sampler = null;

		(function (that) {
			that._GraphType = class Graph extends IGraph {
				constructor(src_url) {
					super(src_url);
				}
				get _engine() {
					return that;
				}
				get _gl() {
					return that.gl;
				}
			}
		})(this);
	}
	/** @type {IGraph} */
	get Graph() {
		return this._GraphType;
	}

	/** @type {HTMLCanvasElement} */
	get _canvas() {
		return this.gl.canvas;
	}

	/**
	 * @param {string} id
	 */
	init(id) {
		let canvas = document.getElementById(id);

		// 初始化 GL 背景資料
		this._initWebGL(canvas);

		// 只在 WebGL 可取得且運行時繼續
		if (!this.gl) {
			return;
		}

		this._initTextureFramebuffer();

		this._initBuffers();

		this._graph_rect = new this.Graph();

		this._graph_rect._matrix = this._graph_rect.matrix;
		this._graph_rect._onload = function () {
			this._matrix = this.matrix;
		}
		this._graph_rect._url = $get.imageUrl("/1x1");

		this.bloomRenderer = new BloomRenderer();

		this.bloomRenderer.create(this);
	}
	/**
	 * @param {"shader"|"fxaa"} target
	 * @param {string} code
	 */
	_$reloadFragmentShader(target, code) {
		const gl = this.gl;
		let programName = target + "Program";
		let vertexShader, fragmentShader;

		try {
			fragmentShader = this._createFragmentShader(code, "_$reloadFragmentShader");
		}
		catch (ex) {
			return;
		}

		vertexShader = this.shaderProgram.vertexShader;

		if (this[programName].fragmentShader) {
			gl.deleteShader(this[programName].fragmentShader);
			this[programName].fragmentShader = null;
		}

		if (this[programName]) {
			gl.deleteProgram(this[programName]);
			this[programName] = null;
		}

		let sp = gl.createProgram();
		{
			gl.attachShader(sp, vertexShader);
			sp.vertexShader = vertexShader;

			gl.attachShader(sp, fragmentShader);
			sp.fragmentShader = fragmentShader;
		}
		gl.linkProgram(sp);

		this.__resetProgramParamLocation(sp);
		
		this[programName] = sp;
	}
	reloadShader() {
		const gl = this.gl;

		if (this.shaderProgram) {
			this._deleteProgramShader(this.shaderProgram);
			this.shaderProgram = null;
		}
		this.shaderProgram = this._createShader(_getDefaultVertexShaderSource(), _getDefaultFragmentShaderSource());
		
		if (this.fxaaProgram) {
			this._deleteProgramShader(this.fxaaProgram);
			this.fxaaProgram = null;
		}
		this.fxaaProgram = this._createFXAAShader();
		this.fxaaProgram.enable = true;
	}
	_deleteProgramShader(program) {
		const gl = this.gl;

		if (program.vertexShader) {
			gl.deleteShader(program.vertexShader);
			program.vertexShader = null;
		}

		if (program.fragmentShader) {
			gl.deleteShader(program.fragmentShader);
			program.fragmentShader = null;
		}

		if (program) {
			gl.deleteProgram(program);
		}
	}
	_initWebGL(canvas) {
		// 嘗試獲得標準背景資料。如果失敗，退而獲取試驗版本
		this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		const gl = this.gl;

		this.$ctx = new Drawing2D(this);

		// 如果再次失敗則放棄
		if (!gl) {
			alert('Unable to initialize WebGL. Your browser may not support it.');
			throw new Error('Unable to initialize WebGL. Your browser may not support it.');
		}

		this.reloadShader();

		_resize_canvas(canvas, window.innerWidth, window.innerHeight);
		
		window.onresize = e => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			_resize_canvas(canvas, width, height);

			//console.log([width, height]);
			document.getElementById("screen_width").innerHTML = width;
			document.getElementById("screen_height").innerHTML = height;

			this.screen_size.x = width;
			this.screen_size.y = height;
			//this._resolution[0] = width;
			//this._resolution[1] = height;

			gl.viewport(0, 0, width, height);

			mat4.ortho(this._projectionMatrix, 0, width, height, 0, -1000, 1000);
		}
		window.onresize();

		return gl;
		
		function _resize_canvas(canvas, width, height) {
			canvas.width  = width;
			canvas.height = height;
		}
	}
	set ctx(value) {
	}
	get ctx() {
		return this.$ctx;
	}

	/**
	 * @param {HTMLImageElement} image
	 * @param {IGraph} graph
	 * @param {Object} texture
	 */
	_handleImageLoaded(image, graph) {
		const gl = this.gl;

		graph._vbo = this._createVertexBuffer(graph.width, graph.height);

		let texture = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);//NEAREST
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);//LINEAR

		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

		//webgl not have gl.CLAMP_TO_BORDER
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		//gl.generateMipmap(gl.TEXTURE_2D);

		gl.bindTexture(gl.TEXTURE_2D, null);

		{//TODO: make WebGLTexture like Image
			texture.src = image.src;
			texture.naturalWidth = image.naturalWidth;
			texture.naturalHeight = image.naturalHeight;
			texture.$image = image;
		}

		return texture;
	}

	_initTextureFramebuffer() {
		const gl = this.gl;

		this.rttFramebuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);

		this.rttTexture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);//NEAREST
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);//LINEAR
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		//gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
		//gl.generateMipmap(gl.TEXTURE_2D);
		
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

		let renderbuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, gl.canvas.width, gl.canvas.height);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.rttTexture, 0);
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	_beginDrawToBuffer() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.rttFramebuffer);
	}
	_endDrawToBuffer() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	_initBuffers() {
		//this._cubeVerticesBuffer = this._createVertexBuffer();
		this._cubeTextureCoordBuffer = this._createTextureCoordBuffers();
		this._cubeVerticesIndexBuffer = this._createIndicesBuffers();
	}

	/**
	 * @param {number} width
	 * @param {number} height
	 */
	_createVertexBuffer(width, height) {
		const gl = this.gl;

		let rectVertices = _createRectVertices(width, height);

		return createVBO(gl, rectVertices);
	}
	_createTextureCoordBuffers() {
		const gl = this.gl;

		let qectTextCoord = _createRectTextCoord(1, 1);

		return createVBO(gl, qectTextCoord);
	}
	_createIndicesBuffers() {
		const gl = this.gl;

		// Build the element array buffer; this specifies the indices
		// into the vertex array for each face's vertices.

		let cubeVerticesIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

		// This array defines each face as two triangles, using the
		// indices into the vertex array to specify each triangle's
		// position.

		//let cubeVertexIndices = [
		//	0, 1, 2, 3
		//]
		let cubeVertexIndices = [
			0, 1, 2,
			3, 2, 1
		]

		// Now send the element array to GL

		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);

		return cubeVerticesIndexBuffer;
	}

	/**
	 * @param {WebGLProgram} program
	 */
	useShader(program) {
		this.gl.useProgram(program);
		this._shader = program;
	}

	_drawBackframe() {
		if (!this._graph_rect.isLoaded()) {
			return;
		}
		const gl = this.gl;

		this.useShader(this.fxaaProgram);
		{
			const rt_w = this.screen_size.x;
			const rt_h = this.screen_size.y;

			//gl.uniform1i(this.fxaaProgram.uniform_enable, this.fxaaProgram.enable);

			gl.uniform1f(this.fxaaProgram.uniform_rt_w, rt_w);
			gl.uniform1f(this.fxaaProgram.uniform_rt_h, rt_h);

			mat4.identity(this._modelViewMatrix);
			mat4.scale(this._modelViewMatrix, this._modelViewMatrix, [rt_w, rt_h, 1]);
			{
				this._bindTexture(this.rttTexture, 0);

				this.__drawRect(this._graph_rect._vbo);
			}
		}
	}
	_createFXAAShader() {
		const gl = this.gl;
		let fxaa = this._createShader(_getFXAAVertexShaderSource(), _getFXAAFragmentShaderSource());
		gl.useProgram(fxaa);
		//fxaa.uniform_enable = gl.getUniformLocation(fxaa, "uFXAA");
		fxaa.uniform_rt_w = gl.getUniformLocation(fxaa, "rt_w");
		fxaa.uniform_rt_h = gl.getUniformLocation(fxaa, "rt_h");
		return fxaa;
	}
	_createShader(vs_src, fs_src) {
		const gl = this.gl;

		let vertexShader = this._createVertexShader(vs_src, "default-vs");//this._getShader("shader-vs");
		let fragmentShader = this._createFragmentShader(fs_src, "default-fs");//this._getShader("shader-fs");

		// Create the shader program
		let shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		// If creating the shader program failed, alert
		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			let err = "Unable to initialize the shader program: \n" + gl.getProgramInfoLog(shaderProgram);
			console.error(err);
			alert(err);
		}

		{
			shaderProgram.vertexShader = vertexShader;
			shaderProgram.fragmentShader = fragmentShader;
		}

		this.__resetProgramParamLocation(shaderProgram);

		return shaderProgram;
	}
	__resetProgramParamLocation(shaderProgram) {
		const gl = this.gl;

		gl.useProgram(shaderProgram);

		shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
		gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

		shaderProgram.matrix_projection_location = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.matrix_modelView_location = gl.getUniformLocation(shaderProgram, "uMVMatrix");

		shaderProgram.color_location = gl.getUniformLocation(shaderProgram, "uColor");
		shaderProgram.uniform_sampler = gl.getUniformLocation(shaderProgram, "uSampler");
		//shaderProgram.uniform_resolution = gl.getUniformLocation(shaderProgram, "uResolution");
	}

	_createVertexShader(theSource, id) {
		const gl = this.gl;

		let shader = gl.createShader(gl.VERTEX_SHADER);

		if (!this._compileShader(shader, theSource, id)) {
			return null;
		}

		return shader;
	}
	_createFragmentShader(theSource, id) {
		const gl = this.gl;

		let shader = gl.createShader(gl.FRAGMENT_SHADER);

		if (!this._compileShader(shader, theSource, id)) {
			return null;
		}

		return shader;
	}

	//
	// getShader
	//
	// Loads a shader program by scouring the current document,
	// looking for a script with the specified ID.
	//
	_getShader(id) {
		const gl = this.gl;

		let shaderScript = document.getElementById(id);

		// Didn't find an element with the specified ID; abort.

		if (!shaderScript) {
			return null;
		}

		// Walk through the source element's children, building the
		// shader source string.

		let theSource = "";
		let currentChild = shaderScript.firstChild;

		while (currentChild) {
			if (currentChild.nodeType == 3) {
				theSource += currentChild.textContent;
			}

			currentChild = currentChild.nextSibling;
		}

		// Now figure out what type of shader script we have,
		// based on its MIME type.

		let shader;

		if (shaderScript.type == "x-shader/x-fragment") {
			shader = gl.createShader(gl.FRAGMENT_SHADER);
		} else if (shaderScript.type == "x-shader/x-vertex") {
			shader = gl.createShader(gl.VERTEX_SHADER);
		} else {
			return null;  // Unknown shader type
		}

		if (!_compileShader(shader, theSource, id)) {
			return null;
		}

		return shader;
	}

	_compileShader(shader, theSource, id) {
		const gl = this.gl;

		// Send the source to the shader object
		gl.shaderSource(shader, theSource);

		// Compile the shader program
		gl.compileShader(shader);

		// See if it compiled successfully
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			let err = "An error occurred compiling the shaders (" + id + "): \n" + gl.getShaderInfoLog(shader);
			console.error(err);
			alert(err);
			return false;
		}
		return true;
	}

	/**
	 * @param {WebGLTexture} texture
	 * @param {number} local
	 */
	_bindTexture(texture, local) {
		const gl = this.gl;

		gl.activeTexture(gl.TEXTURE0 + local);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(this._shader.uniform_sampler, local);
	}
	
	/**
	 * Draw rectangle without texture
	 * @param {WebGLBuffer} vbo
	 */
	__drawRect(vbo) {
		const gl = this.gl;

		//gl.uniform2fv(this._shader.uniform_resolution, this._resolution);
		gl.uniform4fv(this._shader.color_location, this._color);

		gl.uniformMatrix4fv(this._shader.matrix_projection_location, false, this._projectionMatrix);
		gl.uniformMatrix4fv(this._shader.matrix_modelView_location, false, this._modelViewMatrix);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo/*this._cubeVerticesBuffer*/);
		gl.vertexAttribPointer(this._shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this._cubeTextureCoordBuffer);
		gl.vertexAttribPointer(this._shader.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);

		//this._bindDepthTexture(1);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._cubeVerticesIndexBuffer);
		gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);//TRIANGLE_STRIP
	}
}

///////////////////////////////////////////////////////////////////////////////

/**
 * implements: IRenderer
 * @implements {IRenderer}
 */
export class Engine extends WebGLRenderer {
	constructor() {
		super();

		/** @type {number} */
		this._globalAlpha = 1;

		/** @type {number[]} */
		this._color = [1, 1, 1, 1];//default

		/** @type {mat4[]} */
		this._viewMatrix_stack = [];
	}

	/**
	 * @param {number} r
	 * @param {number} dx
	 * @param {number} dy
	 * @param {number} sx
	 * @param {number} sy
	 */
	setRotationTranslationScale(r, dx, dy, sx, sy) {
		mat4.fromRotationTranslationScale(this.viewMatrix, quat.fromEuler([], 0, 0, r), [dx, dy, 0], [sx, sy, 0])
		//mat4.fromRotationTranslationScale(a, quat.fromEuler([], 180, 180, 0), [0, 0, 0], [1, 1, 1])
	}

	loadIdentity() {
		mat4.identity(this.viewMatrix);
	}
	pushMatrix() {
		this._viewMatrix_stack.push(this.viewMatrix);
		this.viewMatrix = mat4.clone(this.viewMatrix);
	}
	popMatrix() {
		this.viewMatrix = this._viewMatrix_stack.pop();
	}
	translate(x, y) {
		mat4.translate(this.viewMatrix, this.viewMatrix, [x, y, 0]);
	}
	translate3d(x, y, z) {
		mat4.translate(this.viewMatrix, this.viewMatrix, [x, y, z]);
	}
	scale(x, y) {
		mat4.scale(this.viewMatrix, this.viewMatrix, [x, y, 1]);
	}
	scale3d(x, y, z) {
		mat4.scale(this.viewMatrix, this.viewMatrix, [x, y, z]);
	}
	rotate(r) {
		mat4.rotateZ(this.viewMatrix, this.viewMatrix, r);
	}
	//rotate3d(x, y, z) {
	//	mat4.rotate(this.viewMatrix, this.viewMatrix, x, [1, 0, 0]);
	//	mat4.rotate(this.viewMatrix, this.viewMatrix, y, [0, 1, 0]);
	//	mat4.rotate(this.viewMatrix, this.viewMatrix, z, [0, 0, 1]);
	//}

	/** @type {number[]} */
	get color() {
		return this._color;
	}

	/** @type {number[]} */
	set color(f4v) {
		const gl = this.gl;

		this._color = f4v;
		gl.blendColor(f4v[0], f4v[1], f4v[2], f4v[3] * this._globalAlpha);
	}

	/**
	 * @type {number} global alpha
	 */
	get globalAlpha() {
		return this._globalAlpha;
	}
	set globalAlpha(value) {
		const gl = this.gl;

		this._globalAlpha = value;
		gl.blendColor(this.color[0], this.color[1], this.color[2], this.color[3] * value);
	}
	pushGlobalAlpha() {
		this._globalAlphaStack.push(this._globalAlpha);
	}
	popGlobalAlpha() {
		this.globalAlpha = this._globalAlphaStack.pop();
	}

	_useAlphaBlend() {
		const gl = this.gl;

		gl.enable(gl.BLEND);

		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.CONSTANT_ALPHA, gl.CONSTANT_ALPHA);
		gl.blendEquation(gl.FUNC_ADD);

		//blendColor = vec4(rgba(fillStyle).rgb, rgba(fillStyle).a * globalAlpha);
		gl.blendColor(this.color[0], this.color[1], this.color[2], this.color[3] * this._globalAlpha);
	}
	
	beginScene(/*drawSceneFunc*/) {
		const gl = this.gl;
	
		this._useAlphaBlend();

		//gl.enable(gl.DEPTH_TEST);
		//gl.depthFunc(gl.LEQUAL);

		//gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);

		//this._drawToBuffer(drawSceneFunc);

		this.color = [1, 1, 1, 1];

		if (this.fxaaProgram.enable) {
			this._beginDrawToBuffer();
		}
	}

	endScene() {
		if (this.fxaaProgram.enable) {
			this.gl.flush();

			this._endDrawToBuffer();

			this.clearDrawScreen();

			//if (this.blurRenderer && $gv.$blurAmount) {
			//	this.blurRenderer.applyBlur(this, { texture: this.rttTexture }, $gv.$blurAmount);
			//
			//	if (this._graph_rect.isLoaded()) {
			//		this.blurRenderer.draw(this);
			//	}
			//}
			if ($gv.$blurAmount) {
				this.bloomRenderer.applyBloom(this, { texture: this.rttTexture }, null, $gv.$blurAmount || 10, $gv.$exposure, $gv.$gamma);
			}
			else {
				this._drawBackframe();
			}
		}

		this.gl.flush();
		this.gl.finish();
	}

	clearDrawScreen() {
		const gl = this.gl;

		//gl.clearColor(0.2, 0.4, 0.6, 0.0);
		//gl.clearColor(0.5, 0.5, 0.7, 1.0);
		//gl.clearColor(1.0, 1.0, 1.0, 1.0);
		//gl.clearColor(0.0, 0.0, 0.0, 1.0);
		gl.clearColor(0, 0, 0, 0);//make transparent window

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

	//set backgroundColor() {
	//	this._backgroundColor;
	//}
	//get backgroundColor() {
	//	return this._backgroundColor || [0.0, 0.0, 0.0, 1.0];
	//}

	/**
	 * @param {IGraph} graph
	 */
	drawGraph(graph) {
		if (!graph.isLoaded()) {
			return;
		}
		const gl = this.gl;
		
		//mat4.scale(this._modelViewMatrix, this.viewMatrix, [graph.width, graph.height, 1]);

		//mat4.scale(this._modelViewMatrix, this.viewMatrix, [graph.width, graph.height, 1]);
		//mat4.translate(this._modelViewMatrix, this._modelViewMatrix, [x + graph.x, y + graph.y, 0]);

		mat4.copy(this._modelViewMatrix, this.viewMatrix);

		this.useShader(this.shaderProgram);

		this._bindTexture(graph.texture, 0);

		this.__drawRect(graph._vbo);
	}

	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	drawGraph2(graph, x, y, z) {
		if (z == undefined) {
			z = 0;
			//debugger
		}
		if (!graph.isLoaded()) {
			return;
		}
		const gl = this.gl;

		//engine.rotate(Math.PI / 180 * (window.m_r || 0));
		mat4.translate(this._modelViewMatrix, this.viewMatrix, [x, y, z]);
		//mat4.scale(this._modelViewMatrix, this._modelViewMatrix, [graph.width, graph.height, 1]);
		//mat4.rotate(this._modelViewMatrix, this._modelViewMatrix, Math.PI / 180 * (++window.m_r || 0), [0, 0, 1]);

		//mat4.scale(this._modelViewMatrix, this.viewMatrix, [graph.width, graph.height, 1]);
		//mat4.translate(this._modelViewMatrix, this._modelViewMatrix, [x + graph.x, y + graph.y, 0]);

		this.useShader(this.shaderProgram);

		this._bindTexture(graph.texture, 0);

		this.__drawRect(graph._vbo);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	drawRect(x, y, w, h) {
		if (arguments.length != 4) {
			throw new Error("drawRect(x, y, w, h) need 4 param");
		}

		if (!this._graph_rect.isLoaded()) {
			return;
		}
		const gl = this.gl;
		
		mat4.translate(this._modelViewMatrix, this.viewMatrix, [x, y, 0]);
		mat4.scale(this._modelViewMatrix, this._modelViewMatrix, [w, h, 1]);
		{
			this.useShader(this.shaderProgram);

			this._bindTexture(this._graph_rect.texture, 0);

			this.__drawRect(this._graph_rect._vbo);
		}
	}


	/**
	 * @param {IGraph} graph
	 * @param {number} sx - The x coordinate where to start clipping
	 * @param {number} sy - The y coordinate where to start clipping
	 * @param {number} swidth - The width of the clipped image
	 * @param {number} sheight - The height of the clipped image
	 * @param {number} x - The x coordinate where to place the image on the canvas
	 * @param {number} y - The y coordinate where to place the image on the canvas
	 * @param {number} width - The width of the image to use (stretch or reduce the image)
	 * @param {number} height - The height of the image to use (stretch or reduce the image)
	 */
	_drawImage(graph, sx, sy, swidth, sheight, x, y, width, height) {
		if (graph.isLoaded()) {
			this.ctx.drawImage(graph.texture, sx, sy, swidth, sheight, x, y, width, height);
		}
	}

	/**
	 * whitout save/restore canvas
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} angle
	 * @param {boolean} flip
	 */
	_drawRotaGraph(graph, x, y, angle, flip) {
		if (1) {
			this.translate(x, y);//zorder ? graph.z

			this.rotate(angle);

			this.scale(flip ? -1 : 1, 1);

			this.translate(-graph.x, -graph.y);//reset rotation center

			this.drawGraph(graph);
		}
		else {
			const px = (x - (flip ? -graph.x + graph.width : graph.x));
			const py = (y - graph.y);

			const cx = graph.width * 0.5;
			const cy = graph.height * 0.5;

			this.translate(px, py);//zorder ? graph.z

			this.translate(cx, cy);//回転行列の中心 (rotationCenter)
			this.rotate(angle);

			this.scale(flip ? -1 : 1, 1);

			this.translate(-cx, -cy);//reset rotation center

			this.drawGraph(graph);
		}
	}
	/**
	 * whit save/restore canvas
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} angle
	 * @param {boolean} flip
	 */
	drawRotaGraph(graph, x, y, angle, flip) {
		//if (flip || angle > 0.001 || angle < -0.001) {
		this.pushMatrix();
		this._drawRotaGraph(graph, x, y, angle, flip);
		this.popMatrix();
		//}
		//else {
		//	this.drawGraph2(graph, x - graph.x, y - graph.y);
		//}
	}
	/**
	 * whitout save/restore canvas
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} angle
	 * @param {Vec2} center
	 * @param {Rectangle} clip
	 * @param {boolean} flip
	 */
	_drawRotaClipGraph(graph, x, y, angle, center, clip, flip) {
		const orix = center.x;
		const oriy = center.y;

		const px = (x - (flip ? -orix + clip.width : orix));
		const py = (y - oriy);

		const cx = clip.width * 0.5;
		const cy = clip.height * 0.5;

		this.translate(px, py);//zorder ? graph.z

		this.translate(cx, cy);//回転行列の中心 (rotationCenter)
		this.rotate(angle);

		this.scale(flip ? -1 : 1, 1);

		this.translate(-cx, -cy);//reset rotation center

		this._drawImage(graph, clip.x, clip.y, clip.width, clip.height, 0, 0, clip.width, clip.height);
	}
	/**
	 * whit save/restore canvas
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} angle
	 * @param {Vec2} center
	 * @param {Rectangle} clip
	 * @param {boolean} flip
	 */
	drawRotaClipGraph(graph, x, y, angle, center, clip, flip) {
		this.pushMatrix();
		this._drawRotaClipGraph(graph, x, y, angle, center, clip, flip);
		this.popMatrix();
	}

	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {ColorRGB} color
	 */
	drawColoredGraph(graph, x, y, color) {
	}

	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} scaleX
	 * @param {number} scaleY
	 * @param {ColorRGB} color
	 */
	drawColoredGraph2(graph, x, y, scaleX, scaleY, color) {
	}
}


/**
 * @param {WebGLRenderingContext} gl
 * @param {WebGLShader} vs
 * @param {WebGLShader} fs
 */
function createShaderProgram(gl, vs, fs) {
	// Create the shader program
	let program = gl.createProgram();

	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);

	// If creating the shader program failed, alert
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		let err = "Unable to initialize the shader program: \n" + gl.getProgramInfoLog(program);
		alert(err);
		throw new Error(err);
	}

	return program;
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {number} target
 * @param {string} elemId
 */
function _createShader(gl, target, elemId) {
	try {
		let source = document.getElementById(elemId).innerText;

		return _createShaderFromText(gl, target, source, elemId);
	}
	catch (ex) {
		console.log(elemId);
	}
}
/**
 * @param {WebGLRenderingContext} gl
 * @param {number} target
 * @param {string} source
 * @param {string} id
 */
function _createShaderFromText(gl, target, source, id) {
	let shader;

	shader = gl.createShader(target);

	// Send the source to the shader object
	gl.shaderSource(shader, source);

	// Compile the shader program
	gl.compileShader(shader);

	// See if it compiled successfully
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		let err = "An error occurred compiling the shaders (" + id + "): \n" + gl.getShaderInfoLog(shader);
		alert(err);
		gl.deleteShader(shader);
		throw new Error(err);
	}

	return shader;
}

/**
 * @param {number} width
 * @param {number} height
 */
function _createRectVertices(width, height) {
	return new Float32Array([
		0, 0, 0,
		0, height, 0,
		width, 0, 0,
		width, height, 0,
	]);
}

/**
 * @param {number} width
 * @param {number} height
 */
function _createRectTextCoord(width, height) {
	return new Float32Array([
		0, 0,
		0, height,
		width, 0,
		width, height,
	]);
}

/**
 * @param {WebGLRenderingContext} gl
 * @param {Float32Array} vertices
 */
function createVBO(gl, vertices) {
	let vbo = gl.createBuffer();

	gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	return vbo;
}

function _getDefaultVertexShaderSource() {
	return document.getElementById("default_vs").innerText;
}
function _getDefaultFragmentShaderSource() {
	return document.getElementById("default_fs").innerText;
}

function _getFXAAVertexShaderSource() {
	return `
#ifdef GL_ES
	precision mediump float;
#endif

attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

varying vec4 posPos;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

float FXAA_SUBPIX_SHIFT = 1.0/4.0;
uniform float rt_w; // GeeXLab built-in
uniform float rt_h; // GeeXLab built-in

void main(void)
{
	gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	vec2 rcpFrame = vec2(1.0 / rt_w, 1.0 / rt_h);
	posPos.xy = aTextureCoord;
	posPos.zw = aTextureCoord - (rcpFrame * (0.5 + FXAA_SUBPIX_SHIFT));
}
`;
}

//uniform float rt_w
//uniform float rt_h
function _getFXAAFragmentShaderSource() {
	return `
#ifdef GL_ES
	precision mediump float;
#endif

//uniform bool uFXAA;

uniform sampler2D uSampler; // 0
uniform float rt_w; // GeeXLab built-in
uniform float rt_h; // GeeXLab built-in
varying vec4 posPos;

#define FxaaInt2 ivec2
#define FxaaFloat2 vec2
//#define FxaaTexLod0(t, p) texture2DLod(t, p, 0.0)
//#define FxaaTexOff(t, p, o, r) texture2DLodOffset(t, p, 0.0, o)

#define FxaaVec2 FxaaFloat2
#define FxaaTexLod0(t, p) texture2D(t, p)
#define FxaaTexOff(t, p, o, r) texture2D(t, p + o * r)

vec3 FxaaPixelShader( 
	vec4 posPos, // Output of FxaaVertexShader interpolated across screen.
	sampler2D tex, // Input texture.
	vec2 rcpFrame) // Constant {1.0/frameWidth, 1.0/frameHeight}.
{   
/*---------------------------------------------------------*/
	#define FXAA_REDUCE_MIN   (1.0/128.0)
	#define FXAA_SPAN_MAX	  (8.0)
	#define FXAA_REDUCE_MUL   (1.0/FXAA_SPAN_MAX)
/*---------------------------------------------------------*/
	vec3 rgbNW = FxaaTexLod0(tex, posPos.zw).xyz;
	vec3 rgbNE = FxaaTexOff(tex, posPos.zw, FxaaVec2(1,0), rcpFrame.xy).xyz;
	vec3 rgbSW = FxaaTexOff(tex, posPos.zw, FxaaVec2(0,1), rcpFrame.xy).xyz;
	vec3 rgbSE = FxaaTexOff(tex, posPos.zw, FxaaVec2(1,1), rcpFrame.xy).xyz;
	vec3 rgbM  = FxaaTexLod0(tex, posPos.xy).xyz;
/*---------------------------------------------------------*/
	vec3 luma = vec3(0.299, 0.587, 0.114);
	float lumaNW = dot(rgbNW, luma);
	float lumaNE = dot(rgbNE, luma);
	float lumaSW = dot(rgbSW, luma);
	float lumaSE = dot(rgbSE, luma);
	float lumaM  = dot(rgbM,  luma);
/*---------------------------------------------------------*/
	float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
	float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));
/*---------------------------------------------------------*/
	vec2 dir; 
	dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
	dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));
/*---------------------------------------------------------*/
	float dirReduce = max(
		(lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),
		FXAA_REDUCE_MIN);
	float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);
	dir = min(FxaaFloat2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX), 
		  max(FxaaFloat2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX), 
		  dir * rcpDirMin)) * rcpFrame.xy;
/*--------------------------------------------------------*/
	vec3 rgbA = (1.0/2.0) * (
		FxaaTexLod0(tex, posPos.xy + dir * (1.0/3.0 - 0.5)).xyz +
		FxaaTexLod0(tex, posPos.xy + dir * (2.0/3.0 - 0.5)).xyz);
	vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * (
		FxaaTexLod0(tex, posPos.xy + dir * (0.0/3.0 - 0.5)).xyz +
		FxaaTexLod0(tex, posPos.xy + dir * (3.0/3.0 - 0.5)).xyz);
	float lumaB = dot(rgbB, luma);
	if((lumaB < lumaMin) || (lumaB > lumaMax)) return rgbA;
	return rgbB;
}

vec4 PostFX(sampler2D tex, vec2 uv, float time)
{
	vec4 c = vec4(0.0);
	vec2 rcpFrame = vec2(1.0/rt_w, 1.0/rt_h);
	c.rgb = FxaaPixelShader(posPos, tex, rcpFrame);
	//c.rgb = 1.0 - texture2D(tex, posPos.xy).rgb;
	c.a = 1.0;
	return c;
}

vec2 vec2Scale(vec2 v, float sx, float sy) {
	vec2 hs = vec2(1.0/rt_w, 1.0/rt_h) * 0.5;
	mat4 scale1 = mat4(
		vec4( sx,	0.0,	0.0,	0.0),
		vec4(0.0,	 sy,	0.0,	0.0),
		vec4(0.0,	0.0,	1.0,	0.0),
		vec4(hs.x,	hs.y,	0.0,	1.0)
		);
	return (scale1 * vec4(v.x, v.y, 0.0, 1.0)).xy;
}

vec4 Gaussian55(vec2 uv) {
	vec4 col = vec4(0.0, 0.0, 0.0, 0.0);

	float rw = 1.0 / rt_w;
	float rh = 1.0 / rt_h;

	col += texture2D(uSampler, uv + vec2(-rw * 2.0, -rh * 2.0)) * 0.003765;
	col += texture2D(uSampler, uv + vec2(-rw      , -rh * 2.0)) * 0.015019;
	col += texture2D(uSampler, uv + vec2(0.0      , -rh * 2.0)) * 0.023792;
	col += texture2D(uSampler, uv + vec2( rw      , -rh * 2.0)) * 0.015019;
	col += texture2D(uSampler, uv + vec2( rw * 2.0, -rh * 2.0)) * 0.003765;

	col += texture2D(uSampler, uv + vec2(-rw * 2.0, -rh      )) * 0.015019;
	col += texture2D(uSampler, uv + vec2(-rw      , -rh      )) * 0.059912;
	col += texture2D(uSampler, uv + vec2(0.0      , -rh      )) * 0.094907;
	col += texture2D(uSampler, uv + vec2( rw      , -rh      )) * 0.059912;
	col += texture2D(uSampler, uv + vec2( rw * 2.0, -rh      )) * 0.015019;


	col += texture2D(uSampler, uv + vec2(-rw * 2.0, 0.0      )) * 0.023792;
	col += texture2D(uSampler, uv + vec2(-rw      , 0.0      )) * 0.094907;
	col += texture2D(uSampler, uv + vec2(0.0      , 0.0      )) * 0.150342;
	col += texture2D(uSampler, uv + vec2( rw      , 0.0      )) * 0.094907;
	col += texture2D(uSampler, uv + vec2( rw * 2.0, 0.0      )) * 0.023792;


	col += texture2D(uSampler, uv + vec2(-rw * 2.0,  rh      )) * 0.015019;
	col += texture2D(uSampler, uv + vec2(-rw      ,  rh      )) * 0.059912;
	col += texture2D(uSampler, uv + vec2(0.0      ,  rh      )) * 0.094907;
	col += texture2D(uSampler, uv + vec2( rw      ,  rh      )) * 0.059912;
	col += texture2D(uSampler, uv + vec2( rw * 2.0,  rh      )) * 0.015019;

	col += texture2D(uSampler, uv + vec2(-rw * 2.0,  rh * 2.0)) * 0.003765;
	col += texture2D(uSampler, uv + vec2(-rw      ,  rh * 2.0)) * 0.015019;
	col += texture2D(uSampler, uv + vec2(0.0      ,  rh * 2.0)) * 0.023792;
	col += texture2D(uSampler, uv + vec2( rw      ,  rh * 2.0)) * 0.015019;
	col += texture2D(uSampler, uv + vec2( rw * 2.0,  rh * 2.0)) * 0.003765;

	return col;
}

vec4 Gaussian33(vec2 uv) {
	vec4 col = vec4(0.0, 0.0, 0.0, 0.0);

	float rw = 1.0 / rt_w;
	float rh = 1.0 / rt_h;

	col += texture2D(uSampler, uv + vec2(-rw, -rh)) * 0.077847;
	col += texture2D(uSampler, uv + vec2(0.0, -rh)) * 0.123317;
	col += texture2D(uSampler, uv + vec2( rw, -rh)) * 0.077847;


	col += texture2D(uSampler, uv + vec2(-rw, 0.0)) * 0.123317;
	col += texture2D(uSampler, uv + vec2(0.0, 0.0)) * 0.195346;
	col += texture2D(uSampler, uv + vec2( rw, 0.0)) * 0.123317;


	col += texture2D(uSampler, uv + vec2(-rw,  rh)) * 0.077847;
	col += texture2D(uSampler, uv + vec2(0.0,  rh)) * 0.123317;
	col += texture2D(uSampler, uv + vec2( rw,  rh)) * 0.077847;

	return col;
}

void main() 
{
	vec2 uv = vec2(posPos.x, 1.0 - posPos.y);
	vec4 col = texture2D(uSampler, uv);
	//vec4 col = Gaussian55(uv);

	if (col.a > 0.001) {
		gl_FragColor = col;

		//if (length(col.rgb) < 0.9) {
		//	vec3 g3 = Gaussian33(uv).rgb;
		//	vec3 g5 = Gaussian55(uv).rgb;
		//	gl_FragColor = vec4(col.rgb + (g3 * g5), col.a);//vec4(0.0, 0.0, 0.0, 1.0);//
		//}
		//else {
		//	//vec3 g3 = Gaussian33(uv).rgb;
		//	//gl_FragColor = vec4(col * 0.7 + g3 * 0.3, col.a);
		//	gl_FragColor = vec4(col.rgb, col.a);
		//}

		////if (uFXAA) {
		//	vec4 pp = vec4(uv.x, uv.y, posPos.z, posPos.w);
		////
		//	vec2 rcpFrame = vec2(1.0/rt_w, 1.0/rt_h);
		////
		//	vec4 col_1 = vec4(FxaaPixelShader(pp, uSampler, rcpFrame), col.a);
		//	gl_FragColor = col_1;
		////
		//	//vec4 col_2 = texture2D(uSampler, vec2Scale(uv, 0.9, 0.9));
		//	//
		//	//vec4 finCol = mix(col_1, col_2, 0.5);
		//	//
		//	//gl_FragColor = finCol;
		////}
		////else {
		////	gl_FragColor = texture2D(uSampler, uv);
		////}
	}
	else {
		discard;
	}
}
`;
}

