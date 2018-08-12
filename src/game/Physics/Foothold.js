
import {
	b2Vec2, b2Transform, b2Rot,
	b2Body, b2Fixture,
	b2Contact,
} from "./Physics.js";

import { IRenderer } from "../IRenderer.js";
import { Rectangle } from "../math.js";


export class FootholdChain {
	/**
	 * @param {number} id
	 */
	constructor(id) {
		this.id = id;

		/** @type {FootholdSingle[]} */
		this.footholds = [];

		this.bound = new Rectangle();

		this.loop = false;
	}
	
	/**
	 * @param {FootholdSingle} head - foothold chain head
	 * @param {FootholdSingle[]} map_footholds - map footholds
	 * @param {function} type - foothold constructor
	 */
	init(head, map_footholds, type) {
		let left, top, right, bottom;

		left = head.x1;
		top = head.y1;
		right = head.x2;
		bottom = head.y2;

		for (let fh = head, childIndex = 0; fh != null; fh = map_footholds[fh.next], ++childIndex) {
			left = Math.min(left, fh.x1, fh.x2);
			top = Math.min(top, fh.y1, fh.y2);
			right = Math.max(right, fh.x1, fh.x2);
			bottom = Math.max(bottom, fh.y1, fh.y2);

			this.footholds.push(fh);

			if (fh.next == head.id) {
				this.loop = true;
				break;
			}
		}

		this.bound.parse(left, top, right, bottom);

		this.FootholdType = type;

		if (type == FootholdSingle) {
			this.footholds.forEach((fh, childIndex) => {
				fh.init(this, childIndex);
			});
		}
		else if (type == FootholdChainChild) {
			let center = this.bound.center;
			let xf = new b2Transform();

			xf.SetPositionXY(center.x, center.y);

			this.footholds.forEach((fh, childIndex) => {
				fh.init(this, childIndex, xf);
			});
		}
	}
	
	/**
	 * @param {number} childIndex
	 * @returns {FootholdChainChild}
	 */
	getFootholdFromContact(childIndex) {
		return this.footholds[childIndex];
	}
}

export class FootholdSingle {
	/**
	 * @param {object} _raw
	 * @param {number} index
	 * @param {number} layerIndex
	 * @param {number} groupIndex
	 */
	constructor(_raw, index, layerIndex, groupIndex) {
		this._raw = _raw;

		// ground.footholds

		/** @type {number} */
		this.layer = layerIndex | 0;

		/** @type {number} */
		this.group = groupIndex | 0;

		/** @type {number} - in ground.footholds */
		this.id = index;
		
		/** @type {number} - prev id */
		this.prev = _raw.prev ? (_raw.prev - 1) : null;

		/** @type {number} - next id */
		this.next = _raw.next ? (_raw.next - 1) : null;

		// chain.footholds

		/** @type {FootholdChain} */
		this.chain = null;

		/** @type {number} - in chain.footholds */
		this.childIndex = null;

		// body
		
		/** @type {b2Body} */
		this.body = null;

		/** @type {number} */
		this.m_angle = 0;

		/** @type {number} */
		this.m_length = 0;

		// debug

		/** @type {number} - this和next_fh的夾角 */
		this.next_a = undefined;

		this.next_a_deg = undefined;
		
		this.$showDebugInfo = false;
	}
	
	getFootholdFromContact() {
		return this;
	}

	/**
	 * @param {FootholdChain} chain
	 * @param {number} childIndex
	 * @param {b2Transform} body_xf
	 */
	init(chain, childIndex, body_xf) {
		let x1, y1, x2, y2;
		
		this.chain = chain;
		this.childIndex = childIndex;

		x1 = this.x1 / $gv.CANVAS_SCALE;
		y1 = this.y1 / $gv.CANVAS_SCALE;
		x2 = this.x2 / $gv.CANVAS_SCALE;
		y2 = this.y2 / $gv.CANVAS_SCALE;

		const dx = x2 - x1;
		const dy = y2 - y1;

		if (dy == 0) {
			this.m_angle = dx < 0 ? Math.PI : 0;
			this.m_length = dx;
		}
		else if (dx == 0) {
			this.m_angle = dy < 0 ? (-Math.PI * 0.5) : (Math.PI * 0.5);
			this.m_length = dy;
		}
		else {
			this.m_angle = Math.atan2(dy, dx);
			this.m_length = Math.sqrt(dy ** 2 + dx ** 2);
		}
	}

	GetVertex1() {
		return new b2Vec2(this.x1 / $gv.CANVAS_SCALE, this.y1 / $gv.CANVAS_SCALE);
	}

	GetVertex2() {
		return new b2Vec2(this.x2 / $gv.CANVAS_SCALE, this.y2 / $gv.CANVAS_SCALE);
	}

	/**
	 * @virtual
	 */
	GetWorldCenter() {
		return this.body.GetWorldCenter();
	}

	/**
	 * @virtual
	 * @param {b2Vec2} worldPoint
	 * @param {b2Vec2} out
	 */
	GetLocalPoint(worldPoint, out) {
		return this.body.GetLocalPoint(worldPoint, out);
	}

	/**
	 * @virtual
	 * @param {b2Vec2} worldPoint
	 * @param {b2Vec2} out
	 */
	GetLinearVelocityFromWorldPoint(worldPoint, out) {
		return this.body.GetLinearVelocityFromWorldPoint(worldPoint, out);
	}

	/**
	 * @virtual
	 * @param {b2Vec2} worldVector
	 * @param {b2Vec2} out
	 */
	GetLocalVector(worldVector, out) {
		return this.body.GetLocalVector(worldVector, out);
	}

	/** @type {FootholdSingle} */
	get next_fh() {
		const footholds = this.body.m_world.ground.footholds;
		return footholds[this.next];
	}
	/** @type {FootholdSingle} */
	get prev_fh() {
		const footholds = this.body.m_world.ground.footholds;
		return footholds[this.prev];
	}

	/** @type {number} */
	get x1() { return this._raw.x1; }
	/** @type {number} */
	get y1() { return this._raw.y1; }
	/** @type {number} */
	get x2() { return this._raw.x2; }
	/** @type {number} */
	get y2() { return this._raw.y2; }

	get is_empty() {
		return this.is_first && this.is_last;
	}
	get is_first() {
		return this._raw.prev == 0;
	}
	get is_last() {
		return this._raw.next == 0;
	}
	get is_wall() {
		return this.x1 == this.x2;
	}
	get _is_horizontal_floor() {
		return this.y1 == this.y2;
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	_drawLine(ctx) {
		ctx.beginPath()
		ctx.moveTo(this.x1, this.y1);
		ctx.lineTo(this.x2, this.y2);
		ctx.stroke();
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	_drawLineV01(ctx) {
		if (this.m_hasVertex0) {
			ctx.beginPath()
			ctx.moveTo(this.x0, this.y0);
			ctx.lineTo(this.x1, this.y1);
			ctx.stroke();
		}
	}

	/**
	 * @param {CanvasRenderingContext2D} ctx
	 */
	_drawLineV23(ctx) {
		if (this.m_hasVertex3) {
			ctx.beginPath()
			ctx.moveTo(this.x2, this.y2);
			ctx.lineTo(this.x3, this.y3);
			ctx.stroke();
		}
	}

	$_text_pos(x1, y1, x2, y2) {
		return {
			x: (x2 + x1) / 2,
			y: Math.max(y2, y1),
		};
	}
	/**
	 * @param {IRenderer} renderer
	 */
	$drawDebugInfo(renderer) {
		const ctx = renderer.ctx;
		const fh = this;
		const text = `[${fh.id}](${fh.x1}, ${fh.y1})[${fh.group}]{${fh._raw.piece}}∠${fh.next_a_deg}`;

		const ta = ctx.textAlign, tb = ctx.textBaseline;
		const tp = this.$_text_pos(fh.x1, fh.y1, fh.x2, fh.y2);
		ctx.textAlign = "center";
		ctx.textBaseline = "top";

		ctx.lineWidth = 5;
		ctx.strokeStyle = "#000";
		fh._drawLine(ctx);

		ctx.lineWidth = 2.5;
		ctx.strokeStyle = "#FF00FF";
		fh._drawLine(ctx);

		ctx.lineWidth = 2.5;
		ctx.strokeStyle = "#000";
		ctx.strokeText(text, tp.x, tp.y);

		ctx.fillStyle = "#FFF";
		ctx.fillText(text, tp.x, tp.y);

		//ctx.fillText(`[${fh.piece}][1](${fh.x2}, ${fh.y2})`, fh.x2, fh.y2);

		ctx.textAlign = ta;
		ctx.textBaseline = tb;
	}
	/**
	 * @param {IRenderer} renderer
	 * @param {string} color
	 */
	$drawDebugInfo2(renderer, color) {
		const ctx = renderer.ctx;
		const fh = this;
		const text = `${fh.prev}<${fh.id}>${fh.next} C{${fh.chain.id}} (${fh.x1}, ${fh.y1})(${fh.x2}, ${fh.y2}) L[${fh.layer}] G[${fh.group}] P{${fh._raw.piece}}∠${fh.next_a_deg}`;

		let ta = ctx.textAlign, tb = ctx.textBaseline;
		const tp = this.$_text_pos(fh.x1, fh.y1, fh.x2, fh.y2);
		ctx.textAlign = "center";
		ctx.textBaseline = "top";

		ctx.lineWidth = 5;
		ctx.strokeStyle = "#000";
		fh._drawLine(ctx);

		ctx.lineWidth = 2.5;
		ctx.strokeStyle = color || "#FF00FF";
		fh._drawLine(ctx);
		
		//ctx.strokeStyle = "#FF0";
		//fh._drawLineV01(ctx);
		//fh._drawLineV23(ctx);

		ctx.lineWidth = 2.5;
		ctx.strokeStyle = "#000";
		ctx.strokeText(text, tp.x, tp.y);

		ctx.fillStyle = "#FFF";
		ctx.fillText(text, tp.x, tp.y);

		//ctx.fillText(`[${fh.piece}][1](${fh.x2}, ${fh.y2})`, fh.x2, fh.y2);

		ctx.textAlign = ta;
		ctx.textBaseline = tb;
	}
}

export class FootholdChainChild extends FootholdSingle {
	constructor(_raw, index, layerIndex, groupIndex) {
		super(_raw, index, layerIndex, groupIndex);

		/** @type {b2Transform} - local */
		this.m_xf = new b2Transform();
	}

	/**
	 * @param {FootholdChain} chain
	 * @param {number} childIndex
	 * @param {b2Transform} body_xf
	 */
	init(chain, childIndex, body_xf) {
		super.init(chain, childIndex, body_xf);
		
		b2Vec2.AddVV(this.GetVertex1(), this.GetVertex2(), this.m_xf.p);
		b2Vec2.MulVS(this.m_xf.p, 0.5, this.m_xf.p);
		this.m_xf.SetRotationAngle(this.m_angle);

		b2Transform.MulTXX(this.m_xf, body_xf, this.m_xf);
	}
	
	/**
	 * @override
	 */
	GetWorldCenter() {
		const xf = new b2Transform();
		b2Transform.MulXX(this.m_xf, this.body.m_xf, xf);
		return xf.p;
	}

	/**
	 * @override
	 * @param {b2Vec2} worldPoint
	 * @param {b2Vec2} out
	 */
	GetLocalPoint(worldPoint, out) {
		const xf = new b2Transform();
		b2Transform.MulXX(this.m_xf, this.body.m_xf, xf);
		return b2Transform.MulTXV(xf, worldPoint, out);
	}

	/**
	 * @override
	 * @param {b2Vec2} worldPoint
	 * @param {b2Vec2} out
	 */
	GetLinearVelocityFromWorldPoint(worldPoint, out) {
		const body = this.body;
		return b2Vec2.AddVCrossSV(body.m_linearVelocity, body.m_angularVelocity, b2Vec2.SubVV(worldPoint, this.GetWorldCenter(), b2Vec2.s_t0), out);
	}

	/**
	 * @override
	 * @param {b2Vec2} worldVector
	 * @param {b2Vec2} out
	 */
	GetLocalVector(worldVector, out) {
		const xf = new b2Transform();
		b2Transform.MulXX(this.m_xf, this.body.m_xf, xf);
		return b2Rot.MulTRV(xf.q, worldVector, out);
	}
}
