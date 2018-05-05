
import { Sprite } from "./Sprite.js";
import { Animation } from "./Animation";
import { ActionAnimation } from './Renderer/CharacterActionAnimation.js';

/**
 * @interface {IEffectAnimation}
 */
class SkillEffectAnimation extends Animation {
	constructor(raw, url) {
		super(raw, url);
		this.x = 0;
		this.y = 0;
		this.targetRenderer = null;
		this.is_loop = false;
	}
	
	/**
	 * @param {string} url
	 * @param {object} raw
	 */
	load(type) {
		if (!this._raw) {
			throw new Error("Not implement. skill data is loaded");
			this._url = this._url + "/" + type;
			return super.load();
		}
		else {
			if (Array.isArray(this._raw[0])) {
				this.textures = this._raw[type];
			}
			else {
				this.textures = this._raw;
			}
		}
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this.targetRenderer) {
			stamp *= this.targetRenderer.speed;
		}
		
		super.update(stamp);
		
		if (this.targetRenderer) {
			this.x = this.targetRenderer.x + this.targetRenderer.tx;
			this.y = this.targetRenderer.y + this.targetRenderer.ty;
		}
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		this.draw(renderer, this.x, this.y, 0, this.targetRenderer.front > 0);
	}
}

class SkillHitAnimation extends SkillEffectAnimation {
	constructor(raw, url) {
		super(raw, url);
	}
}

// 被 SceneObject... 取代
export class EffectManager {
	constructor() {
	}
	
	static AddEffect(effect) {
		effect.update(0);//init effect position
		
		EffectManager._effects.push(effect);
	}
	
	/**
	 * @param {number} stamp
	 */
	static Update(stamp) {
		const effects = EffectManager._effects;
		
		EffectManager._effects = effects.filter(function (eff) {
			eff.update(stamp);
			if (eff.isEnd()) {
				eff.destroy();
				return false;
			}
			return true;
		});
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	static Render(renderer) {
		const effects = EffectManager._effects;
		for (let  i = 0; i < effects.length; ++i) {
			effects[i].render(renderer);
		}
	}
}
/** @type {AnimationBase[]} */
EffectManager._effects = [];

window.$EffectManager = EffectManager;

/**
 * Skill type 1
 */
class SkillAnimationBase {
	/**
	 * @param {object} raw
	 * @param {string} url
	 */
	constructor(raw, url) {
		//this._raw = raw;
		
		this.data = null;
		
		/** @type {string} */
		this.url = null;
		
		//this.textures = {
		//	effect: [],
		//	hit: {
		//		"0": []
		//	},
		//}

		this.skillId = null;
		
		this.actType = 0;//??
		
		/** @type {SceneObject} */
		this._owner = null;

		/** @type {CharacterAnimationBase} */
		this._crr = null;
		
		/** @type {number} */
		this.type = 0;
		
		/** @type {boolean} */
		this.is_end = false;
		
		/** @type {boolean} */
		this.is_launch = false;
		
		if (raw && url) {
			this._load(url, raw);
		}
	}

	/** @type {ActionAnimation} */
	get owner() {
		return this._owner;
	}
	set owner(value) {
		this._owner = value;
		this._crr = this.owner.renderer;
	}
	
	/** @type {ActionAnimation} */
	get actani() {
		return this._crr.actani;
	}
	set actani(value) {
		if (this.owner) {
			this._crr.actani = value;
		}
	}
	
	/**
	 * download data
	 * @param {string} skillId
	 */
	async load(skillId) {
		const jobID = /^(\d+)\d{4}$/.exec(skillId)[1];

		const url = `${this.constructor._base_path}/${jobID}.img/skill/${skillId}`;

		const raw = JSON.parse(await $get.pack(url));
		if (!raw) {
			alert("SkillAnimationBase");
			return;
		}

		this.skillId = skillId;

		this._load(url, raw);
	}

	/**
	 * process raw data
	 */
	async _load(url, raw) {
		this.url = url;
		
		let data = this._transformRawData(raw);
		
		this.type = data.info ? (data.info.type || 0) : 0;//const

		//this.owner.actani
		//this.actani = new ActionAnimation();
		this.actani.reload(data.action[this.actType]);//action ? 0, 1
		this.actani.loop = false;
		
		this.data = data;
	}
	
	/** @param {SkillAnimationBase} skill_anim - clone */
	_assign(skill_anim) {
		this.skillId = skill_anim.skillId;

		this.data = skill_anim.data;
		
		this.type = skill_anim.type;//const
		
		this.url = skill_anim.url;

		//this.owner.actani
		//this.actani = new ActionAnimation();
		this.actani.reload(skill_anim.data.action[skill_anim.actType]);//action ? 0, 1
		this.actani.loop = false;
	}
	
	_transformRawData(raw) {
		if (raw.effect) {
			raw.effect = arrNd_texture(raw.effect, `${this.url}/effect`);
		}
		if (raw.hit) {
			raw.hit = arrNd_texture(raw.hit, `${this.url}/hit`);
		}
		
		return raw;
		
		function arrNd_texture(arrNd/*, url*/) {
			if ("0" in arrNd[0]) {
				return arr2d_texture(arrNd/*, url*/);
			}
			else {
				return arr1d_texture(arrNd/*, url*/);
			}
		}
		function arr1d_texture(arr1d/*, url*/) {
			let effect = [];
			for (let  i = 0; i in arr1d; ++i) {
				let data = arr1d[i];
				let tex = new Sprite(data);//image base64
				//tex._url = `${url}/${i}`;
				effect[i] = tex;
			}
			return effect;
		}
		function arr2d_texture(arr2d/*, url*/) {
			let hit = [];
			for (let  i = 0; i in arr2d; ++i) {
				//const url_i = `${url}/${i}`;
				let group = arr2d[i];
				hit[i] = [];
				for (let  j = 0; j in group; ++j) {
					let data = group[j];
					let tex = new Sprite(data);//image base64
					//tex._url = `${url_i}/${j}`;
					hit[i][j] = tex;
				}
			}
			return hit;
		}
	}
	
	reset() {
		this.actani.reset();
		this.is_launch = false;
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		/** @type {CharacterRenderer} */
		const ownerRenderer = this._crr;
		
		stamp *= ownerRenderer.speed;
		
		if (this.actani) {
			if (this.actani.delay) {// not start yet
				return;
			}
			else if (!this.is_launch) {
				const type = window.$skill_wt || 0;

				try {
					this.addEffect(ownerRenderer.x, ownerRenderer.y, ownerRenderer, type);
				}
				catch (ex) {
				}

				this.is_launch = true;
			}
			if (this.actani.isEnd()) {
				this.is_end = true;
			}
		}
		else {
			this.is_launch = true;
			this.is_end = true;
		}
	}
	
	isEnd() {
		return this.is_end;
	}
	
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {{x: number, y: number}=} targetRenderer - 'attack target renderer' or 'owner renderer'
	 * @param {number=} type
	 */
	addEffect(x, y, targetRenderer, type) {
		let effect = new SkillEffectAnimation(this.data.effect, this.url + "/effect");
		
		effect.targetRenderer = targetRenderer;
		
		effect.load(type);
		
		EffectManager.AddEffect(effect);
	}
	
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {{x: number, y: number}=} target
	 * @param {number=} type
	 */
	addHitEffect(x, y, target, type) {
		let hit = new SkillHitAnimation();
		
		hit.target = target;
		
		hit.load(this.url + "/hit/" + type, this.data.hit, type);
		
		EffectManager.AddEffect(hit);
	}
	
	static get _base_path() {
		return "/Skill";
	}
}

export class SkillAnimation extends SkillAnimationBase {
	constructor() {
		super();
	}
	
	/**
	 * @param {number|string} skillId
	 */
	load(skillId) {
		if (!skillId) {
			throw new Error("1 argument required");
		}
		skillId = String(skillId);
		
		if (String(skillId).length <= 4) {
			throw new Error("skill ID format");
		}
		skillId = window.$skill || skillId || 1120017;//1001005;// jobId + 4-digit
		
		let loaded_skill = this.constructor.__loaded_skill[skillId];
		if (loaded_skill && loaded_skill.data) {
			this._assign(loaded_skill);
		}
		else {
			let promise = super.load(skillId);
			this.constructor.__loaded_skill[skillId] = this;
			return promise;
		}
	}
}
SkillAnimation.__loaded_skill = {};

window.$SkillAnimation = SkillAnimation;

window.$dummy = {
	x: 0,
	y: 0,
	tx: 0,
	ty: 0,
	front: 1,
}
