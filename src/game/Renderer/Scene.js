
import { Vec2 } from './math.js';
import { IGraph, IRenderer } from './IRenderer.js';
import { engine, Graph } from './Engine.js';

import { IDrawable, SceneObject } from './SceneObject.js';

export class _IGraphLayer {
	constructor() {
	}
	/** @param {...any} a */
	_drawGraph2(...a) {
		throw new Error("Not implement");
	}
	/** @param {Engine} engine */
	_render() {
		throw new Error("Not implement");
	}
	/** clear all item */
	_clear() {
		throw new Error("Not implement");
	}
}

/**
 * @implements {IRenderer}
 */
export class IGraphLayerRenderer {
	constructor() {
	}

	/** @param {Engine} engine */
	render(engine) {
		throw new Error("Not implement");
	}

	/**
	 * @param {number} order
	 * @param {IDrawable} item
	 */
	addSprite(order, item) {
		throw new Error("Not implement");
	}

	/** clear all item */
	_clear() {
		throw new Error("Not implement");
	}
}

///////////////////////////////////////////////////////////////////////////////

export class _GraphLayer_Item extends IDrawable {
	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(graph, x, y) {
		super();

		this.graph = graph;
		this.x = x;
		this.y = y;
	}

	get order() {
		return this.graph.z;
	}

	/**
	 * implement: IDrawable#render
	 * @param {Engine} engine
	 */
	paint(engine) {
		engine.drawGraph2(this.graph, this.x, this.y, 0);
	}
}

export class _GraphLayer extends _IGraphLayer {
	constructor() {
		super();

		/** @type {IDrawable[]} */
		this.list = [];
	}

	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 */
	_drawGraph2(graph, x, y) {
		this.list.push(new _GraphLayer_Item(graph, x, y));
	}

	/**
	 * @param {IDrawable} item
	 */
	_add(item) {
		this.list.push(item);
	}

	/**
	 * @param {Engine} engine
	 */
	_render(engine) {
		for (var i = 0; i < this.list.length; ++i) {
			var item = this.list[i];
			item.paint(engine);
		}
	}

	/**
	 * clear all item
	 */
	_clear() {
		this.list = [];
	}
}

export class GraphLayerRenderer extends IGraphLayerRenderer {
	constructor() {
		super();

		/** @type {_GraphLayer[]} */
		this.layers = [];
	}

	/**
	 * @param {IGraph} graph
	 * @param {number} x
	 * @param {number} y
	 * @param {number=} z
	 */
	drawGraph2(graph, x, y, z) {
		var order = Math.trunc(graph.z);
		if (z) {
			order += z;
		}

		if (!(order in this.layers)) {
			this.layers[order] = new _GraphLayer();
		}
		this.layers[order]._drawGraph2(graph, x, y);
	}

	/**
	 * @param {number} order
	 * @param {IDrawable} item
	 */
	addSprite(order, item) {
		if (!(order in this.layers)) {
			this.layers[order] = new _GraphLayer();
		}
		this.layers[order]._add(item);
	}

	/**
	 * @param {Engine} engine
	 */
	render(engine) {
		for (var i = 0; i < this.layers.length; ++i) {
			if (this.layers[i]) {
				this.layers[i]._render(engine);
			}
		}
	}

	/**
	 * clear all item
	 */
	clear() {
		for (var i = 0; i < this.layers.length; ++i) {
			if (this.layers[i]) {
				this.layers[i]._clear();
			}
		}
	}
}

///////////////////////////////////////////////////////////////////////////////

export class _ObjectLayer_Item extends IDrawable {
	constructor() {
		super();
	}
}

export class _ObjectLayer extends _IGraphLayer {
	constructor() {
		super();

		/** @type {GraphLayerRenderer[]} */
		this.list = [];
	}
}

export class ObjectLayerRenderer extends IGraphLayerRenderer {
	constructor() {
		super();
	}
}

///////////////////////////////////////////////////////////////////////////////


export class Scene {
	constructor() {
		/** @type {SceneObject[]} */
		this.objects = [];

		this.objectLayerRenderer = new GraphLayerRenderer();

		this.time = new Date().getTime();
		this.stamp = null;
	}

	/**
	 * @param {!SceneObject} obj - is IDrawable, has a entity
	 */
	addObject(obj) {
		this.objects.push(obj);
	}

	/**
	 * @param {!number} stamp
	 */
	update() {
		const now_time = new Date().getTime();
		this.stamp = now_time - this.time;
		this.time = now_time;

		for (var i = 0; i < this.objects.length; ++i) {
			var obj = this.objects[i];
			obj.update(this.stamp);
		}
	}

	/**
	 * @param {Engine} engine
	 */
	render(engine) {
		for (var i = 0; i < this.objects.length; ++i) {
			var obj = this.objects[i];
			obj.paint(this.objectLayerRenderer);
		}
		this.objectLayerRenderer.render(engine);
		this.objectLayerRenderer.clear();
	}
}
