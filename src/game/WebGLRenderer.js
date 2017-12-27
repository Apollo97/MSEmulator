
import { Vec2 } from './math.js';
import { IGraph, IRenderer } from './IRenderer.js';


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
		
		//this.rttFramebuffer = null;
		//this.rttTexture = null;

		//this._cubeVerticesBuffer = null;
		//this._cubeVerticesColorBuffer = null;
		this._cubeVerticesTextureCoordBuffer = null;
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

	/** @type {Vec2} */
	get screen_size() {
		const canvas = this._canvas;
		return new Vec2(canvas.width, canvas.height);
	}

	/**
	 * @param {string} id
	 */
	init(id) {
		var canvas = document.getElementById(id);

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
		this._graph_rect._url = "/1x1.png";
	}
	_initWebGL(canvas) {
		// 嘗試獲得標準背景資料。如果失敗，退而獲取試驗版本
		this.gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		const gl = this.gl;
		var that = this;

		// 如果再次失敗則放棄
		if (!gl) {
			alert('Unable to initialize WebGL. Your browser may not support it.');
			throw new Error('Unable to initialize WebGL. Your browser may not support it.');
		}

		this.shaderProgram = this._createShader(_getDefaultVertexShaderSource(), _getDefaultFragmentShaderSource());
		this.fxaaProgram = this._createFXAAShader();

		_resize_canvas(canvas, window.innerWidth, window.innerHeight);
		
		window.onresize = function () {
			_resize_canvas(canvas, window.innerWidth, window.innerHeight);

			//console.log([canvas.width, canvas.height]);
			document.getElementById("screen_width").innerHTML = canvas.width;
			document.getElementById("screen_height").innerHTML = canvas.height;

			gl.viewport(0, 0, canvas.width, canvas.height);

			mat4.ortho(that._projectionMatrix, 0, canvas.width, canvas.height, 0, -1000, 1000);
		}
		window.onresize();

		return gl;
		
		function _resize_canvas(canvas, width, height) {
			canvas.width  = width;
			canvas.height = height;
		}
	}

	/**
	 * @param {HTMLImageElement} image
	 * @param {IGraph} graph
	 * @param {Object} texture
	 */
	_handleImageLoaded(image, graph) {
		const gl = this.gl;

		graph._vbo = this._createVertexBuffer(graph.width, graph.height);

		var texture = gl.createTexture();

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

		return texture;
	}

	///**
	// * @param {number} local
	// */
	//_bindDepthTexture(local) {
	//	if (!this.uniform_only_depth._m_flag) {
	//		const gl = this.gl;
	//
	//		gl.activeTexture(gl.TEXTURE0 + local);
	//		gl.bindTexture(gl.TEXTURE_2D, this.rttTexture);
	//		gl.uniform1i(this.uniform_backrame, local);
	//	}
	//}

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

		var renderbuffer = gl.createRenderbuffer();
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
		this._cubeVerticesTextureCoordBuffer = this._createTextureCoordBuffers();
		this._cubeVerticesIndexBuffer = this._createIndicesBuffers();
	}
	_createVertexBuffer(width, height) {
		const gl = this.gl;

		// Create a buffer for the cube's vertices.

		var cubeVerticesBuffer = gl.createBuffer();

		// Select the cubeVerticesBuffer as the one to apply vertex
		// operations to from here out.

		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);

		// Now create an array of vertices for the cube.

		//var vertices = [
		//	0, 0, 0,
		//	0, 1, 0,
		//	1, 0, 0,
		//	1, 1, 0,
		//];
		var vertices = [
			0, 0, 0,
			0, height, 0,
			width, 0, 0,
			width, height, 0,
		];

		// Now pass the list of vertices into WebGL to build the shape. We
		// do this by creating a Float32Array from the JavaScript array,
		// then use it to fill the current vertex buffer.

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

		return cubeVerticesBuffer;
	}
	_createTextureCoordBuffers() {
		const gl = this.gl;

		// Map the texture onto the cube's faces.

		var cubeVerticesTextureCoordBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesTextureCoordBuffer);

		var textureCoordinates = [
			0, 0,
			0, 1,
			1, 0,
			1, 1,
		];

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

		return cubeVerticesTextureCoordBuffer;
	}
	_createIndicesBuffers() {
		const gl = this.gl;

		// Build the element array buffer; this specifies the indices
		// into the vertex array for each face's vertices.

		var cubeVerticesIndexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVerticesIndexBuffer);

		// This array defines each face as two triangles, using the
		// indices into the vertex array to specify each triangle's
		// position.

		//var cubeVertexIndices = [
		//	0, 1, 2, 3
		//]
		var cubeVertexIndices = [
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
			var rt_w = this.gl.canvas.width;
			var rt_h = this.gl.canvas.height;

			gl.uniform1i(this.fxaaProgram.uniform_enable, this.fxaaProgram.enable);

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
		var fxaa = this._createShader(_getFXAAVertexShaderSource(), _getFXAAFragmentShaderSource());
		gl.useProgram(fxaa);
		fxaa.uniform_rt_w = gl.getUniformLocation(fxaa, "rt_w");
		fxaa.uniform_rt_h = gl.getUniformLocation(fxaa, "rt_h");
		fxaa.uniform_enable = gl.getUniformLocation(fxaa, "uFXAA");
		fxaa.enable = false;
		return fxaa;
	}
	_createShader(vs_src, fs_src) {
		const gl = this.gl;

		var vertexShader = this._createVertexShader(vs_src, "default-vs");//this._getShader("shader-vs");
		var fragmentShader = this._createFragmentShader(fs_src, "default-fs");//this._getShader("shader-fs");

		// Create the shader program

		const shaderProgram = gl.createProgram();
		gl.attachShader(shaderProgram, vertexShader);
		gl.attachShader(shaderProgram, fragmentShader);
		gl.linkProgram(shaderProgram);

		// If creating the shader program failed, alert

		if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
			var err = "Unable to initialize the shader program: \n" + gl.getProgramInfoLog(shaderProgram);
			console.error(err);
			alert(err);
		}

		gl.useProgram(shaderProgram);

		shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
		gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

		shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
		gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
		
		shaderProgram.matrix_projection_location = gl.getUniformLocation(shaderProgram, "uPMatrix");
		shaderProgram.matrix_modelView_location = gl.getUniformLocation(shaderProgram, "uMVMatrix");

		shaderProgram.color_location = gl.getUniformLocation(shaderProgram, "uColor");

		shaderProgram.uniform_sampler = gl.getUniformLocation(shaderProgram, "uSampler");
		//this.uniform_backrame = gl.getUniformLocation(shaderProgram, "uBackframe");

		//this.uniform_only_depth = gl.getUniformLocation(shaderProgram, "uOnlyDepth");
		//this.uniform_only_depth._m_flag = false;

		return shaderProgram;
	}

	_createVertexShader(theSource, id) {
		const gl = this.gl;

		var shader = gl.createShader(gl.VERTEX_SHADER);

		if (!this._compileShader(shader, theSource, id)) {
			return null;
		}

		return shader;
	}
	_createFragmentShader(theSource, id) {
		const gl = this.gl;

		var shader = gl.createShader(gl.FRAGMENT_SHADER);

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

		var shaderScript = document.getElementById(id);

		// Didn't find an element with the specified ID; abort.

		if (!shaderScript) {
			return null;
		}

		// Walk through the source element's children, building the
		// shader source string.

		var theSource = "";
		var currentChild = shaderScript.firstChild;

		while (currentChild) {
			if (currentChild.nodeType == 3) {
				theSource += currentChild.textContent;
			}

			currentChild = currentChild.nextSibling;
		}

		// Now figure out what type of shader script we have,
		// based on its MIME type.

		var shader;

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
			var err = "An error occurred compiling the shaders (" + id + "): \n" + gl.getShaderInfoLog(shader);
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

		gl.uniform4fv(this._shader.color_location, this._color);

		gl.uniformMatrix4fv(this._shader.matrix_projection_location, false, this._projectionMatrix);
		gl.uniformMatrix4fv(this._shader.matrix_modelView_location, false, this._modelViewMatrix);

		gl.bindBuffer(gl.ARRAY_BUFFER, vbo/*this._cubeVerticesBuffer*/);
		gl.vertexAttribPointer(this._shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

		gl.bindBuffer(gl.ARRAY_BUFFER, this._cubeVerticesTextureCoordBuffer);
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

		/** @type {number[]} */
		this.color = [1, 1, 1, 1];//default

		/** @type {mat4[]} */
		this._viewMatrix_stack = [];
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
	
	/**
	 * @type {number} global alpha
	 */
	get globalAlpha() {
		return this._color[3];
	}
	set globalAlpha(value) {
		this._color[3] = value;
	}

	/**
	 * @param {vec4} f4v - vec4: array
	 */
	Color4fv(f4v) {
		this._color = f4v;
	}

	/** @type {number[]} */
	get color() {
		return this._color;
	}

	/** @type {number[]} */
	set color(f4v) {
		this._color = f4v;
	}
	
	beginScene(/*drawSceneFunc*/) {
		const gl = this.gl;
	
		{
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		}
		{
			//gl.enable(gl.BLEND);
			//gl.blendEquation(gl.FUNC_ADD);
			//gl.blendFuncSeparate(gl.DST_ALPHA, gl.ONE, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA); 
		}
		//gl.enable(gl.DEPTH_TEST);
		//gl.depthFunc(gl.LEQUAL);

		//gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);

		//this._drawToBuffer(drawSceneFunc);

		this.Color4fv([1, 1, 1, 1]);

		if (this.fxaaProgram.enable) {
			this._beginDrawToBuffer();
		}
	}

	endScene() {
		if (this.fxaaProgram.enable) {
			this._endDrawToBuffer();

			this.clearDrawScreen();

			this._drawBackframe();
		}

		this.gl.flush();
		this.gl.finish();
	}

	//set backgroundColor() {
	//	this._backgroundColor;
	//}
	//get backgroundColor() {
	//	return this._backgroundColor || [0.0, 0.0, 0.0, 1.0];
	//}
	
	pushGlobalAlpha() {
		this._globalAlphaStack.push([...this._color]);
	}

	popGlobalAlpha(value) {
		
		this._color = this._globalAlphaStack.pop();
	}

	clearDrawScreen() {
		const gl = this.gl;

		//gl.clearColor(0.5, 0.5, 0.7, 1.0);
		//gl.clearColor(1.0, 1.0, 1.0, 1.0);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	}

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
}

function _getDefaultVertexShaderSource() {
	return `
#ifdef GL_ES
	precision mediump float;//highp
#endif
attribute vec3 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;

uniform vec4 uColor;

varying vec2 vTextureCoord;
varying vec4 vColor;
//varying float vDepth;

void main(void) {
	vec4 pos = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
	gl_Position = pos;
	vTextureCoord = aTextureCoord;
	vColor = uColor;
	//vDepth = -gl_Position.z;// * 1000.0;
}
`;
}
function _getDefaultFragmentShaderSource() {
	return `
#ifdef GL_ES
	precision mediump float;
#endif

varying vec2 vTextureCoord;
varying vec4 vColor;
//varying float vDepth;

uniform sampler2D uSampler;
//uniform sampler2D uBackframe;

//uniform bool uOnlyDepth;

void main(void) {
	gl_FragColor = texture2D(uSampler, vTextureCoord) * vColor;
	
	////if (uOnlyDepth) {
	////	float c = vDepth;
	////	gl_FragColor = vec4(c, c, c, 1);
	////}
	////else {
	//	vec4 tex0 = texture2D(uSampler, vTextureCoord);

	//	//float depth = texture2D(uBackframe, vTextureCoord).x;
	//	//if (vDepth > depth) {
	//	//	gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
	//	//	//discard;
	//	//}

	//	if (tex0.a <= 0.0) {
	//		//gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0);
	//		discard;
	//	}
	//	else {
	//		vec4 c = tex0 * vColor;
	//		//c.r = tex0.r * vColor.r;
	//		//c.g = tex0.g * vColor.g;
	//		//c.b = tex0.b * vColor.b;
	//		//c.a = tex0.a * vColor.a;
	//		gl_FragColor = c;
	//	}
	////}
}
`;
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

uniform bool uFXAA;

uniform sampler2D uSampler; // 0
uniform float rt_w; // GeeXLab built-in
uniform float rt_h; // GeeXLab built-in
float FXAA_SPAN_MAX = 8.0;
float FXAA_REDUCE_MUL = 1.0/8.0;
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
	//#define FXAA_REDUCE_MUL   (1.0/8.0)
	//#define FXAA_SPAN_MAX	 8.0
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

//vec2 vec2Scale(vec2 v, float sx, float sy) {
//	vec2 hs = vec2(1.0/rt_w, 1.0/rt_h) * 0.5;
//	mat4 scale1 = mat4(
//		vec4( sx,	0.0,	0.0,	0.0),
//		vec4(0.0,	 sy,	0.0,	0.0),
//		vec4(0.0,	0.0,	1.0,	0.0),
//		vec4(hs.x,	hs.y,	0.0,	1.0)
//		);
//	return (scale1 * vec4(v.x, v.y, 0.0, 1.0)).xy;
//}

void main() 
{
	vec2 uv = vec2(posPos.x, 1.0 - posPos.y);

	if (uFXAA) {
		vec4 pp = vec4(uv.x, uv.y, posPos.z, posPos.w);

		vec2 rcpFrame = vec2(1.0/rt_w, 1.0/rt_h);

		vec4 col_1 = vec4(FxaaPixelShader(pp, uSampler, rcpFrame), 1.0);
		gl_FragColor = col_1;

		//vec4 col_2 = texture2D(uSampler, vec2Scale(uv, 0.9, 0.9));

		//vec4 finCol = mix(col_1, col_2, 0.5);

		//gl_FragColor = finCol;
	}
	else {
		gl_FragColor = texture2D(uSampler, uv);
	}
}
`;
}

