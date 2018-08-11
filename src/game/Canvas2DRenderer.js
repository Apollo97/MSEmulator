﻿
import { mat2d, vec2, mat4, quat } from 'gl-matrix';
import { Vec2 } from './math.js';
import { IGraph, IRenderer, ColorRGB } from './IRenderer.js';

//import WebGL2D from "./WebGL2D/WebGL2D.js";
//window.$WebGL2D = WebGL2D;

window._experimental_particle = true;

class MyMatrix2D {
	constructor() {
		this.$temp_vec2 = vec2.create();

		/** @type {mat2d} */
		this.$transform = mat2d.create();
	}
	loadIdentity() {
		mat2d.identity(this.$transform);
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
		this.$transform[0] = m11;
		this.$transform[1] = m12;
		this.$transform[2] = m21;
		this.$transform[3] = m22;
		this.$transform[4] = dx;
		this.$transform[5] = dy;
	}
	/**
	 * @param {Canvas2DContextAttributes} ctx
	 */
	applyTransform(ctx) {
		const m11 = this.$transform[0], m12 = this.$transform[1],
			m21 = this.$transform[2], m22 = this.$transform[3],
			dx = this.$transform[4], dy = this.$transform[5];
		ctx.setTransform(m11, m12, m21, m22, dx, dy);
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	translate(x, y) {
		this.$temp_vec2[0] = x;
		this.$temp_vec2[1] = y;
		mat2d.translate(this.$transform, this.$transform, this.$temp_vec2);
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	scale(x, y) {
		this.$temp_vec2[0] = x;
		this.$temp_vec2[1] = y;
		mat2d.scale(this.$transform, this.$transform, this.$temp_vec2);
	}
	/**
	 * @param {number} r - rad
	 */
	rotate(r) {
		mat2d.rotate(this.$transform, this.$transform, a);
	}

	toMat4() {
		mat4.fromScaling
	}
}

window.$mat2d = mat2d;
window.$mat4 = mat4;
window.$quat = quat;

/**
 * @implements {IRenderer}
 */
export class Engine extends IRenderer {
	constructor() {
		super();

		/** @type {CanvasRenderingContext2D} */
		this.ctx = null;

		/** @type {CanvasRenderingContext2D} */
		this._ctx2 = null;
		/** @type {HTMLCanvasElement} */
		this._canvas2 = null;

		(function (that) {
			that._GraphType = class Graph extends IGraph {
				get _engine() {
					return that;
				}
			}
		})(this);
	}

	/**
	 * @param {string} id
	 */
	init(id) {
		let canvas = document.getElementById(id);
		let canvas2 = this._canvas2 = document.getElementById(id + "2");

		this.ctx = canvas.getContext("2d", { alpha: true });//new WebGL2D(canvas);//
		this._ctx2 = canvas2.getContext("2d", { alpha: true });

		this.ctx.imageSmoothingEnabled = false;
		this._ctx2.imageSmoothingEnabled = true;

		_resize_canvas(canvas, window.innerWidth, window.innerHeight);
		_resize_canvas(canvas2, window.innerWidth, window.innerHeight);

		window.onresize = e => {
			const width = window.innerWidth;
			const height = window.innerHeight;

			_resize_canvas(canvas, width, height);
			_resize_canvas(canvas2, width, height);

			document.getElementById("screen_width").innerHTML = width;
			document.getElementById("screen_height").innerHTML = height;

			this.screen_size.x = width;
			this.screen_size.y = height;
		}
		window.onresize();

		function _resize_canvas(canvas, width, height) {
			canvas.width = width;
			canvas.height = height;
		}

		this._graph_rect = new this.Graph();
		this._graph_rect._url = $get.imageUrl("/1x1");
	}

	/** @type {IGraph} */
	get Graph() {
		return this._GraphType;
	}

	/** @type {HTMLCanvasElement} */
	get _canvas() {
		return this.ctx.canvas;
	}

	/**
	 * @param {HTMLImageElement} image
	 * @param {IGraph} graph
	 * @param {HTMLImageElement} texture
	 */
	_handleImageLoaded(image, graph) {
		return image;
	}

	/**
	 * swap Canvas and Canvas2
	 * if (imageSmoothingEnabled) this._ctx2.imageSmoothingEnabled = true;
	 * @param {boolean} imageSmoothingEnabled
	 */
	$swapCanvas(imageSmoothingEnabled) {
		if (imageSmoothingEnabled) {
			this.ctx.imageSmoothingEnabled = false;
			this._ctx2.imageSmoothingEnabled = true;
		}
		else {
			this.ctx.imageSmoothingEnabled = false;
			this._ctx2.imageSmoothingEnabled = false;
		}

		//swap
		const ctx2 = this._ctx2;
		this._ctx2 = this.ctx;
		this.ctx = ctx2;
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
		this.ctx.setTransform(m11, m12, m21, m22, dx, dy);
	}

	loadIdentity() {
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
	}
	pushMatrix() {
		this.ctx.save();
	}
	popMatrix() {
		this.ctx.restore();
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	translate(x, y) {
		this.ctx.translate(x, y);
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	scale(x, y) {
		this.ctx.scale(x, y);
	}
	/**
	 * @param {number} r - rad
	 */
	rotate(r) {
		this.ctx.rotate(r);
	}

	///** @type {number[]} */
	//get color() {
	//	return this._color;
	//}

	/** @type {number[]} - 4fv */
	set color(f4v) {
		//f4v = [...f4v];

		const red = Math.trunc(f4v[0] * 255);
		const green = Math.trunc(f4v[1] * 255);
		const blue = Math.trunc(f4v[2] * 255);
		const alpha = f4v[3].toFixed(3);

		this.ctx.fillStyle = `rgba(${red},${green},${blue},${alpha})`;
		this.ctx.strokeStyle = this.ctx.fillStyle;

		//f4v.r = red;
		//f4v.g = green;
		//f4v.b = blue;
		//f4v.a = alpha;
		//this._color = f4v;
	}

	get globalAlpha() {
		return this._globalAlpha;//this.ctx.globalAlpha;
	}
	set globalAlpha(value) {
		if (process.env.NODE_ENV !== 'production') {
			if (value < 0 || value > 1) {
				debugger;
			}
		}
		if (this._globalAlpha != value) {
			this._globalAlpha = value;
			this.ctx.globalAlpha = value;
		}
	}
	pushGlobalAlpha() {
		this._globalAlphaStack.push(this.ctx.globalAlpha);
	}
	popGlobalAlpha(value) {
		this.ctx.globalAlpha = this._globalAlphaStack.pop();
	}

	beginScene() {
		// nothing
	}

	endScene() {
		// nothing
	}

	clearDrawScreen() {
		const c = this.ctx.canvas;
		this.ctx.clearRect(0, 0, c.width, c.height);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {number} w
	 * @param {number} h
	 */
	drawRect(x, y, w, h) {
		/** @type {CanvasRenderingContext2D} */
		let ctx = this.ctx;

		if (arguments.length == 4) {
			ctx.beginPath();
			ctx.fillRect(x, y, w, h);
		}
		else {
			debugger;
		}
	}

	/**
	 * @param {IGraph} graph
	 */
	drawGraph(graph) {
		if (graph.isLoaded()) {
			this.ctx.drawImage(graph.texture, 0, 0);
		}
	}
	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} z
	 */
	drawGraph2(graph, x, y, z) {
		if (graph.isLoaded()) {
			this.ctx.drawImage(graph.texture, x, y);
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
	 * https://stackoverflow.com/a/42856420
	 */
	__drawMirrorImage(ctx, image, x = 0, y = 0, horizontal = false, vertical = false){
		ctx.save();  // save the current canvas state
		ctx.setTransform(
			horizontal ? -1 : 1, 0, // set the direction of x axis
			0, vertical ? -1 : 1,   // set the direction of y axis
			x + horizontal ? image.width : 0, // set the x origin
			y + vertical ? image.height : 0   // set the y origin
			);
		ctx.drawImage(image,0,0);
		ctx.restore(); // restore the state as it was when this function was called
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
		// this.ctx.lineWidth = 1;
			
		// this.ctx.beginPath();
		// this.ctx.moveTo(0, 0);
		// this.ctx.lineTo(32, 0);
		// this.ctx.strokeStyle = "darkred";
		// this.ctx.stroke();
		
		// this.ctx.beginPath();
		// this.ctx.moveTo(0, 0);
		// this.ctx.lineTo(0, 32);
		// this.ctx.strokeStyle = "darkgreen";
		// this.ctx.stroke();
		
		// this.ctx.beginPath();
		// this.ctx.rect(0, 0, 32, 32);
		// this.ctx.fillStyle = "rgba(66,66,66,0.5)";
		// this.ctx.fill();
		
		//if (flip || angle > 0.001 || angle < -0.001) {
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
			// {
				// this.ctx.beginPath();
				// this.ctx.moveTo(cx, cy);
				// this.ctx.lineTo(cx + 32, cy);
				// this.ctx.strokeStyle = "red";
				// this.ctx.stroke();
				
				// this.ctx.beginPath();
				// this.ctx.moveTo(cx, cy);
				// this.ctx.lineTo(cx, cy + 32);
				// this.ctx.strokeStyle = "#0f0";
				// this.ctx.stroke();
			// }
		//}
		//else {
		//	this.drawGraph2(graph, x - graph.x, y - graph.y);
		//}
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
	drawColoredGraph(graph, x, y, color) {//destination
		if (graph.isLoaded()) {
			if (_experimental_particle) {
				this.ctx.filter = color.toFilter();
				this.ctx.drawImage(graph.texture, x - graph.x, y - graph.y);
				this.ctx.filter = "none";
			}
			else {
				const _ctx = this._ctx2;

				_ctx.globalCompositeOperation = "copy";
				_ctx.drawImage(graph.texture, 0, 0);

				_ctx.globalCompositeOperation = "darken";
				_ctx.fillStyle = color.toString();
				_ctx.beginPath();
				//_ctx.arc(graph.width / 2, graph.width / 2, graph.width / 2, 0, Math.PI * 2);
				_ctx.rect(0, 0, graph.width, graph.width);
				_ctx.fill();

				_ctx.globalCompositeOperation = "destination-atop";
				_ctx.drawImage(graph.texture, 0, 0);

				this.ctx.drawImage(this._canvas2, x - graph.x, y - graph.y);
			}
		}
	}
	
	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number} scaleX
	 * @param {number} scaleY
	 * @param {ColorRGB} color
	 */
	drawColoredGraph2(graph, x, y, scaleX, scaleY, color) {//destination
		if (graph.isLoaded()) {
			const width = graph.width;
			const height = graph.height;
			const swidth = width * scaleX;
			const sheight = height * scaleY;

			if (_experimental_particle) {
				this.ctx.filter = color.toFilter();
				this.ctx.drawImage(graph.texture, 0, 0, width, height, x - graph.x, y - graph.y, swidth, sheight);
				this.ctx.filter = "none";
			}
			else {
				const _ctx = this._ctx2;

				_ctx.globalCompositeOperation = "copy";
				_ctx.drawImage(graph.texture, 0, 0, swidth, swidth);

				_ctx.globalCompositeOperation = "darken";
				_ctx.fillStyle = color.toString();
				_ctx.beginPath();
				//_ctx.arc(graph.width / 2, graph.height / 2, graph.width / 2, 0, Math.PI * 2);
				_ctx.rect(0, 0, swidth, swidth);
				_ctx.fill();

				_ctx.globalCompositeOperation = "destination-atop";
				_ctx.drawImage(graph.texture, 0, 0, swidth, swidth);

				this.ctx.drawImage(this._canvas2, 0, 0, swidth, sheight, x - graph.x, y - graph.y, swidth, sheight);
			}
		}
	}
}

