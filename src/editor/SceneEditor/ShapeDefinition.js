
import { Vec2 } from "../../game/math.js";

import {
	b2_maxPolygonVertices,
	b2ShapeType, b2Shape, b2CircleShape, b2EdgeShape, b2ChainShape, b2PolygonShape,
} from "../../game/Physics/Physics.js";


export const shapeTypeMap = {
	circle: b2ShapeType.e_circleShape,
	edge: b2ShapeType.e_edgeShape,
	chain: b2ShapeType.e_chainShape,
	polygon: b2ShapeType.e_polygonShape,
};

export const b2ShapeTypeToName = {
	[b2ShapeType.e_circleShape]: "circle",
	[b2ShapeType.e_edgeShape]: "edge",
	[b2ShapeType.e_chainShape]: "chain",
	[b2ShapeType.e_polygonShape]: "polygon",
};

export const shapeTypeNameToClass = {
	[b2ShapeType.e_circleShape]: b2CircleShape,
	[b2ShapeType.e_edgeShape]: b2EdgeShape,
	[b2ShapeType.e_chainShape]: b2ChainShape,
	[b2ShapeType.e_polygonShape]: b2PolygonShape,
};


export class ShapeDef {
	constructor() {
		/** @type {string} */
		this.name = null;

		/** @type {"circle"|"edge"|"chain"|"polygon"} */
		this.type = null;

		/** @type {number} */
		this.radius = null;

		/** @type {number} */
		this.vertexCount = 3;

		/** @type {Vec2[]} */
		this.vertices = [];

		for (let i = 0; i < b2_maxPolygonVertices; ++i) {//??
			this.vertices[i] = new Vec2(0, 0);
		}
	}

	/**
	 * @param {ShapeDef} other
	 */
	copy(other) {
		this.name = other.name;

		this.type = other.type;

		this.radius = other.radius;

		this.vertexCount = other.vertexCount;

		this.vertices = [];
		for (let i = 0; i < other.vertices.length; ++i) {
			this.vertices[i] = other.vertices[i];
		}
	}

	clone() {
		let def = new ShapeDef();

		def.copy(this);

		return def;
	}

	///**
	// * @param {string} name
	// * @param {string} type
	// */
	//static create(name, type) {
	//	let def = new ShapeDef();
	//	def.name = name;
	//	def.type = type;
	//	return def;
	//}
}

