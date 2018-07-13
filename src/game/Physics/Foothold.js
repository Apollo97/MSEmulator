
import {
	b2Fixture,
} from "./Physics.js";
import { IRenderer } from "../IRenderer.js";

export class Foothold {
	/**
	 * @param {object} _raw
	 * @param {number} index
	 * @param {number} layerIndex
	 * @param {number} groupIndex
	 */
	constructor(_raw, index, layerIndex, groupIndex) {
		this._raw = _raw;

		/** @type {number} */
		this.layer = Number(layerIndex);

		/** @type {number} */
		this.group = Number(groupIndex);

		/** @type {number} */
		this.prev = _raw.prev ? (_raw.prev - 1) : null;

		/** @type {number} */
		this.next = _raw.next ? (_raw.next - 1) : null;

		/** @type {number} */
		this.id = index;
		
		this.chain = null;

		/** @type {b2Fixture} */
		this.fixture = null;

		this.$showDebugInfo = false;

		/** @type {number} - this和next_fh的夾角 */
		this.next_a = undefined;

		this.next_a_deg = undefined;
	}

	/** @type {Foothold} */
	get next_fh() {
		const footholds = this.body.m_world.ground.footholds;
		return footholds[this.next];
	}
	/** @type {Foothold} */
	get prev_fh() {
		const footholds = this.body.m_world.ground.footholds;
		return footholds[this.prev];
	}

	get x1() { return this._raw.x1; }
	get y1() { return this._raw.y1; }
	get x2() { return this._raw.x2; }
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
		const text = `${fh.prev}<${fh.id}>${fh.next} C{${fh.chain}} (${fh.x1}, ${fh.y1})(${fh.x2}, ${fh.y2}) L[${fh.layer}] G[${fh.group}] P{${fh._raw.piece}}∠${fh.next_a_deg}`;

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
