
import { IRenderer } from "../IRenderer";
import { Sprite } from "../Sprite";
import { Drawable, Layer } from "./Layer";
import { DamagePair, AttackInfo } from "../../Common/AttackInfo";

// 123
// NoRed[1][1], NoRed[0][2], NoRed[0][3], ...

class _DamageSkin {
	constructor() {
		/** @type {DamageNumberTextures} */
		this.NoRed = null;
		/** @type {DamageNumberTextures} */
		this.NoCri = null;
	}
}
class _DamageSkinDefault extends _DamageSkin {
	constructor() {
		super();

		/** @type {DamageNumberRenderer} */
		this.NoBlue = null;
		/** @type {DamageNumberRenderer} */
		this.NoViolet = null;
		/** @type {DamageNumberRenderer} */
		this.NoProduction = null;
		/** @type {DamageNumberRenderer} */
		this.NoKite = null;
	}
}


/** @type {{default:_DamageSkinDefault,[skin:string]:_DamageSkin}} */
const loaded_skin = {};

class DamageNumberTextures {
	constructor() {
		/** @type {Sprite} */
		for (let i = 0; i <= 9; ++i) {
			this[i] = null;
		}
		this.addedCanvasH = 0;
	}
	/**
	 * @param {string} path
	 */
	async _load(path) {
		const _raw = await $get.data(path);
		
		Object.keys(_raw).forEach(key => {
			let texture = new Sprite(_raw[key]);

			texture._url = [path, key].join("/");

			this[key] = texture;
		});

		this.addedCanvasH = _raw.addedCanvasH | 0;
	}
}
/** @type {Sprite} */
DamageNumberTextures.prototype.Miss = null;
/** @type {Sprite} */
DamageNumberTextures.prototype.guard = null;
/** @type {Sprite} */
DamageNumberTextures.prototype.shot = null;
/** @type {Sprite} */
DamageNumberTextures.prototype.effect = null;


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

		/** @type {string} */
		this.skin = null;

		/** @type {DamageNumberTextures[]} - this.textures[is_first_num ? 1:0][num] */
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
		this.skin = other.skin;
		this.style = other.style;
		this.textures = other.textures;

		//loading
		if (this._$promise) {
			this._$promise = other._$promise;
		}
	}

	/**
	 * @param {string} skin
	 * @param {string} style
	 * @returns {Promise<DamageNumberRenderer>}
	 */
	async _load(skin, style) {
		let tasks = [];
		let url;

		if (skin == "default") {
			url = this._default_base_path + style;
		}
		else {
			url = this._skin_base_path + [skin, style].join("/");
		}

		if (!loaded_skin[skin]) {
			loaded_skin[skin] = {};
		}
		loaded_skin[skin][style] = this;

		this._url = url;
		this.skin = skin;
		this.style = style;

		for (let i = 0; i <= 1; ++i) {
			const sPath = url + i;
			
			this.textures[i] = new DamageNumberTextures();

			tasks[i] = this.textures[i]._load(sPath);
		}

		await Promise.all(tasks);

		return this;
	}
		
	/**
	 * @param {string} skin
	 * @param {string} style
	 * @returns {Promise<DamageNumberRenderer>}
	 */
	async load(skin, style) {
		let loaded;

		if (loaded_skin[skin]) {
			loaded = loaded_skin[skin][style];
		}

		if (loaded) {
			this._copy(skin, loaded);
		}
		else {
			this._$promise = this._load(skin, style);

			await this._$promise;

			delete this._$promise;
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

	get _default_base_path() {
		return "/Effect/BasicEff";
	}
	get _skin_base_path() {
		return "/Effect/BasicEff/damageSkin/";
	}
}
DamageNumberRenderer.loaded_skin = loaded_skin;
DamageNumberRenderer.max_display_digit = Math.trunc(Math.log10(Number.MAX_SAFE_INTEGER) + 1);
DamageNumberRenderer.max_rand_y = 5;


export class DamageNumber extends Drawable {
	/**
	 * @param {string} skin
	 * @param {string} style
	 * @param {DamagePair} damagePair
	 * @param {number} x - center_x
	 * @param {number} y - bottom_y
	 * @param {number} delay
	 */
	constructor(skin, style, damagePair, x, y, delay) {
		super();

		this.x = x;
		this.y = y;

		this.vy = DamageNumber.move_y / DamageNumber.time_tt;

		this.delay = delay;
		this.time = 0;
		this.state = 0;

		this.damagePair = damagePair;

		/** @type {DamageNumberRenderer} */
		this.renderer;

		this._load(skin, style);
	}

	/**
	 * @param {string} skin
	 * @param {string} style
	 * @param {number} recursive
	 */
	_load(skin, style, recursive) {
		/** @type {DamageNumberRenderer} */
		let loaded;
		
		if (loaded_skin[skin]) {
			loaded = loaded_skin[skin][style];
		}

		if (loaded) {
			this.renderer = loaded;

			this._$promise = this.renderer._$promise;
		}
		else {
			this.renderer = new DamageNumberRenderer();
			this._$promise = this.renderer.load(skin, style);
		}
		if (this._$promise) {
			this.render = this.$noRender;

			this._$promise
				.then(() => {
					delete this.render;
					delete this._$promise;
				}).catch(() => {
					delete this._$promise;
					console.error(`Can't load damageSkin[${skin}][${style}]`);

					if (recursive) {
						throw Error();
					}
					else {
						console.log(`try load damageSkin["default"][${style}]`);
						this._load("default", style, 1);
					}
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

		if (this.delay && this.time >= this.delay) {
			this.time = 0;
			this.delay = 0;
		}
		else {
			this.y += this.vy * stamp;

			if (this.state == 0) {
				this.vy = this.vy * DamageNumber.move_avy;

				if (this.time > DamageNumber.time_d1) {
					this.time = 0;
					this.state = 1;
				}
			}
			else if (this.state == 1) {
				this.vy = this.vy * DamageNumber.move_avy2;

				if (this.time < DamageNumber.time_d2) {
					this.opacity = 1 - (this.time / DamageNumber.time_d2);
					//this.opacity = Math.clamp(this.opacity, 0, 1);
				}
				else {
					this.opacity = 0;
				}
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
DamageNumber.move_y = -300;
DamageNumber.move_avy = 1.001;
DamageNumber.move_avy2 = 0.99;

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
	 * @param {number} delay
	 * @param {string} skin
	 * @param {string} style
	 */
	_addTest(realDamage = 9876543210, critical = false, x = 0, y = 0, delay = 0, skin = null, style = "NoRed") {
		this.objects.push(new DamageNumber(skin, style, new DamagePair(realDamage, critical), x, y, delay));
	}

	/**
	 * @param {number} realDamage
	 * @param {number} critical
	 * @param {number} x - center_x
	 * @param {number} y - bottom_y
	 * @param {number} delay
	 * @param {string} skin
	 * @param {string} style
	 */
	_addTest2(realDamage = 9876543210, critical = false, x = 0, y = 0, delay = 0, skin = null, style = "NoRed") {
		this.objects.push(new DamageNumberTest(skin, style, new DamagePair(realDamage, critical), x, y, delay));
	}

	/**
	 * @param {string} style
	 * @param {AttackInfo} attackInfo
	 */
	_addAttack(skin, style, attackInfo) {
		attackInfo.allAttack.forEach(attack => {
			let target = attack.getTargetObject();
			if (target) {
				const pos = target.$physics.getPosition();
				let x, y;

				x = pos.x * $gv.CANVAS_SCALE;
				y = pos.y * $gv.CANVAS_SCALE - 70;

				attack.allDamage.forEach(damage => {
					this.addDamagePair(skin, style, damage, x, y);
				});
			}
		});
	}

	/**
	 * @template K
	 * @param {string} skin
	 * @param {K extends keyof loaded_skin[skin] ? K:never} style
	 * @param {DamagePair} damagePair
	 * @param {number} x - center_x
	 * @param {number} y - bottom_y
	 * @param {number} delay
	 */
	addDamagePair(skin, style, damagePair, x, y, delay = 0) {
		this.objects.push(new DamageNumber(skin, style, damagePair, x, y, delay));
	}
}


export const damageNumberLayer = new DamageNumberLayer();

window.$damageNumberLayer = damageNumberLayer;
window.$DamageNumber = DamageNumber
window.$DamageNumberTest = DamageNumberTest;
window.$DamageNumberRenderer = DamageNumberRenderer;
//DamageNumberRenderer.prototype._display_axis = true;

