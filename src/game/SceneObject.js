
import { IRenderer } from './IRenderer.js';
import { PPlayer } from './Physics/PPlayer';

/**
 * Game object
 */
export class SceneObject {
	constructor() {
		/** @type {string|number} */
		this.$objectid = null;	// playerName or objectID; ?? null if not in scene

		/** @type {number} - layer id */
		this.$layer = null;	//maybe override

		/** @type {PPlayer} */
		this.$physics = null;

		this.renderer = null;
	}
	
	/** create physics, load resource, ... */
	create() {
	}
	/** destroy physics, ... */
	destroy() {
	}
	
	set enablePhysics(value) {
		if (this.$physics) {
			this.$physics.enable = value;
			this.$physics.state.freeze = !value;
		}
	}
	get enablePhysics() {
		if (this.$physics) {
			return this.$physics.enable;
		}
		return false;
	}

	_applyState() {
		throw new Error("Not implement");
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.renderer.update(stamp);
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		this.renderer.render(renderer);
	}

	/**
	 * @virtual
	 * @param {SceneObject|null} chara - 被 chara 攻擊
	 * @param {number} damage - 傷害
	 */
	damage(chara, damage) {
		console.log(this.$objectid + " 被 " + chara.$objectid + " 攻擊，減少 " + damage + " HP");
	}

	/**
	 * @virtual
	 * if (chara == null) ??
	 * @param {SceneObject|null} chara - 被 chara 攻擊
	 * @param {number} moveX - unit is pixel
	 * @param {number} moveY - unit is pixel
	 */
	knockback(chara, moveX, moveY) {
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {string} name
	 */
	__drawName(renderer, name) {
		const ctx = renderer.ctx;
		const crr = this.renderer;

		ctx.font = "12px 微軟正黑體";//新細明體
		ctx.textBaseline = "middle";
		ctx.textAlign = "start";

		const r = 2, h = 12;
		const w = ctx.measureText(name).width + 3;
		const x = Math.trunc(crr.x/* + crr.tx*/) - w * 0.5;//TODO: crr.tx and crr.ty ??
		const y = Math.trunc(crr.y/* + crr.ty*/);

		const left = x + r;
		const _left = x;
		const top = y;
		const _top = y + r;
		const _right = x + w;
		const right = _right + r;
		const bottom = y + r + h + r;
		const _bottom = y + r + h;

		ctx.fillStyle = "rgba(0,0,0,0.7)";
		ctx.strokeStyle = "rgba(0,0,0,0.7)";
		ctx.beginPath();
		{
			ctx.moveTo(left, top);

			ctx.lineTo(_right, top);
			ctx.arcTo(right, top, right, _top, r);

			ctx.lineTo(right, _bottom);
			ctx.arcTo(right, bottom, _right, bottom, r);

			ctx.lineTo(left, bottom);
			ctx.arcTo(_left, bottom, _left, _bottom, r);

			ctx.lineTo(_left, _top);
			ctx.arcTo(_left, top, left, top, r);
		}
		ctx.fill();

		if (0) {//inner
			ctx.fillStyle = "yellow";
			ctx.strokeStyle = "yellow";
			ctx.beginPath();
			{
				ctx.moveTo(left, _top);

				ctx.lineTo(_right, _top);

				ctx.lineTo(_right, _bottom);

				ctx.lineTo(left, _bottom);

				ctx.closePath();
			}
			ctx.stroke();
		}
		ctx.fillStyle = "white";
		ctx.strokeStyle = "white";
		ctx.fillText(name, left, (top + bottom) * 0.5);
	}
}


