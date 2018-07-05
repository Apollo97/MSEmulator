
import { IRenderer } from "../IRenderer";
import { Sprite } from "../Sprite";
import { Drawable, Layer } from "./Layer";
import { DamagePair, AttackInfo } from "../../Common/AttackInfo";

// 123
// NoRed[1][1], NoRed[0][2], NoRed[0][3], ...

// NoCri

// NoViolet


/** @type {{[style:string]:DamageNumberRenderer}} */
const loaded_damage = {};


function font_adv(texture) {
	return texture.width * 3 / 4;
}

function draw_axis(ctx, x, y) {
	ctx.strokeStyle = "#F00";
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x, y + 10);
	ctx.stroke();

	ctx.strokeStyle = "#0F0";
	ctx.beginPath();
	ctx.moveTo(x, y);
	ctx.lineTo(x + 10, y);
	ctx.stroke();
}

class DamageNumberRenderer {
	constructor() {
		/** @type {string} */
		this._url = null;

		/** @type {string} */
		this.style = null;

		/** @type {Sprite[][]} - this.textures[is_first_num ? 1:0][num] */
		this.textures = [];

		/** @type {number[]} */
		this.rand_y = [0];
		for (let i = 1, sign = Math.random() > 0.5 ? -1:1; i < DamageNumberRenderer.max_display_digit; ++i) {
			this.rand_y[i] = Math.random() * DamageNumberRenderer.max_rand_y * sign;
			sign *= -1;
		}

		///** @type {Promise<void>} */
		//this._$promise = null;
	}

	/**
	 * @param {DamageNumberRenderer} other
	 */
	_copy(other) {
		this._url = other._url;
		this.style = other.style;
		this.textures = other.textures;
	}

	/**
	 * @param {string} style
	 * @returns {Promise<DamageNumberRenderer>}
	 */
	async _load(style) {
		const url = this._base_path + style;
		let tasks = [];

		loaded_damage[style] = this;

		this._url = url;
		this.style = style;

		for (let i = 0; i <= 1; ++i) {
			const sPath = url + i;

			let task = $get.data(sPath).then(rawText => {
				const _raw = JSON.parse(rawText);

				this.textures[i] = [];

				for (let j = 0; j <= 9; ++j) {
					let texture = new Sprite(_raw[j]);

					texture._url = ["/images", sPath, j].join("/");

					this.textures[i][j] = texture;
				}
			});
			tasks[i] = task;
		}

		await Promise.all(tasks);

		return this;
	}
		
	/**
	 * @param {string} style
	 * @returns {Promise<DamageNumberRenderer>}
	 */
	async load(style = "NoRed") {
		let loaded = loaded_damage[style];

		if (loaded) {
			this._copy(loaded);
		}
		else {
			this._$promise = this._load(style);

			await this._$promise;
		}

		return this;
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {number} damage
	 * @param {boolean} critical
	 * @param {number} cx
	 * @param {number} cy
	 */
	draw(renderer, damage, critical, cx, cy) {
		if (process.env.NODE_ENV !== 'production') {
			if (!this.textures || !this.textures[0] || !this.textures[1]) {
				return;
			}
		}
		let str_damage = damage.toFixed(0);

		/** @type {Sprite} */
		let texture;
		let text_width = 0;

		{
			texture = this.textures[1][str_damage[0]];
			text_width += -texture.x;
			text_width += font_adv(texture);

			for (let i = 1; i < str_damage.length - 1; ++i) {
				texture = this.textures[0][str_damage[i]];

				text_width += font_adv(texture);
			}
		}

		{
			let x = cx - text_width / 2;

			texture = this.textures[1][str_damage[0]];
			texture.draw2(x, cy);
			x += font_adv(texture);

			for (let i = 1; i < str_damage.length; ++i) {
				texture = this.textures[0][str_damage[i]];

				texture.draw2(x, cy + this.rand_y[i]);

				x += font_adv(texture);
			}
		}

		if (this._display_axis) {
			const ctx = renderer.ctx;
			let x = cx - text_width / 2;

			texture = this.textures[1][str_damage[0]];
			draw_axis(ctx, x, cy);
			x += font_adv(texture);

			for (let i = 1; i < str_damage.length; ++i) {
				texture = this.textures[0][str_damage[i]];

				draw_axis(ctx, x, cy + this.rand_y[i]);

				x += font_adv(texture);
			}
		}
	}

	get _base_path() {
		return "/Effect/BasicEff.img/";
	}
}
DamageNumberRenderer.loaded_damage = loaded_damage;
DamageNumberRenderer.max_display_digit = Math.trunc(Math.log10(Number.MAX_SAFE_INTEGER) + 1);
DamageNumberRenderer.max_rand_y = 5;


export class DamageNumber extends Drawable {
	/**
	 * @param {string} style
	 * @param {DamagePair} damagePair
	 * @param {number} x - center_x
	 * @param {number} y - bottom_y
	 */
	constructor(style, damagePair, x, y) {
		super();

		this.x = x;
		this.y = y;

		this.time = 0;
		this.state = 0;

		this.damagePair = damagePair;
		this.renderer = new DamageNumberRenderer();

		let loaded = loaded_damage[style];

		if (loaded) {
			this.renderer._copy(loaded);

			this._$promise = this.renderer._$promise;
		}
		else {
			this._$promise = this.renderer.load(style)
		}
		if (this._$promise) {
			this.render = this.$noRender;

			this._$promise.then(() => {
				delete this.render;
				delete this._$promise;
			});
		}
	}

	$noRender() {
		// nothing
	}

	destroy() {
		this.state = 2;
	}

	isEnd() {
		return this.state >= 1 && this.time > 1000;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.time += stamp;

		this.y += (DamageNumber.move_y / DamageNumber.time_tt) * stamp;

		if (this.state == 0) {
			if (this.time > DamageNumber.time_d1) {
				this.time = 0;
				this.state = 1;
			}
		}
		else if (this.state == 1) {
			if (this.time < DamageNumber.time_d2) {
				this.opacity = 1 - (this.time / DamageNumber.time_d2);
				//this.opacity = Math.clamp(this.opacity, 0, 1);
			}
			else {
				this.opacity = 0;
			}
		}
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		this.renderer.draw(renderer, this.damagePair.realDamage, this.damagePair.critical, this.x, this.y);
	}
}
DamageNumber.time_d1 = 1000;
DamageNumber.time_d2 = 1000;
DamageNumber.time_tt = DamageNumber.time_d1 + DamageNumber.time_d2;
DamageNumber.move_y = -250;

export class DamageNumberTest extends DamageNumber {
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
	}
	isEnd() {
		return this.is_end;
	}
}

export class DamageNumberLayer extends Layer {
	//constructor() {
	//	super();
	//}

	/**
	 * @param {number} realDamage
	 * @param {number} critical
	 * @param {number} x - center_x
	 * @param {number} y - bottom_y
	 * @param {string} style
	 */
	_addTest(realDamage = 9876543210, critical = false, x = 0, y = 0, style = "NoRed") {
		this.objects.push(new DamageNumber(style, new DamagePair(realDamage, critical), x, y));
	}

	/**
	 * @param {number} realDamage
	 * @param {number} critical
	 * @param {number} x - center_x
	 * @param {number} y - bottom_y
	 * @param {string} style
	 */
	_addTest2(realDamage = 9876543210, critical = false, x = 0, y = 0, style = "NoRed") {
		this.objects.push(new DamageNumberTest(style, new DamagePair(realDamage, critical), x, y));
	}

	/**
	 * @param {string} style
	 * @param {AttackInfo} attackInfo
	 */
	_addAttack(style, attackInfo) {
		attackInfo.allAttack.forEach(attack => {
			let target = attack.getTargetObject();
			if (target) {
				const pos = target.$physics.getPosition();
				let x, y;

				x = pos.x * $gv.CANVAS_SCALE;
				y = pos.y * $gv.CANVAS_SCALE - 70;

				attack.allDamage.forEach(damage => {
					this.addDamagePair(style, damage, x, y);
				});
			}
		});
	}

	/**
	 * @param {string} style
	 * @param {DamagePair} damagePair
	 * @param {number} x - center_x
	 * @param {number} y - bottom_y
	 */
	addDamagePair(style, damagePair, x, y) {
		this.objects.push(new DamageNumber(style, damagePair, x, y));
	}
}


export const damageNumberLayer = new DamageNumberLayer();

window.$damageNumberLayer = damageNumberLayer;
window.$DamageNumber = DamageNumber
window.$DamageNumberTest = DamageNumberTest;
window.$DamageNumberRenderer = DamageNumberRenderer;
//DamageNumberRenderer.prototype._display_axis = true;

