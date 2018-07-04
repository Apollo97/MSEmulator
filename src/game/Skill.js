
import { IRenderer } from "./IRenderer.js";
import { Sprite } from "./Sprite.js";
import { Animation } from "./Animation";
import { SceneObject } from "./SceneObject";
import { ActionAnimation } from './Renderer/CharacterActionAnimation.js';
import { CharacterAnimationBase } from "./Renderer/CharacterRenderer.js";
import { PPlayer } from "./Physics/PPlayer.js";
import { SceneCharacter } from "./SceneCharacter.js";
import { World } from "./Physics/World.js";
import { PBullet } from "./Physics/PBullet.js";
import { AttackInfo, AttackPair } from "../Common/AttackInfo.js";

import { Vec2 } from "./math.js";//dev


// skill timeline
//
// 以 ActionAnimation 控制流程
// skill 必須要有 ActionAnimation 才能正確運作(開始、結束)
//
// # normal skill
// -delay1        | delay2
// _init          | update
// defaultAction  | wait current_action end
//                | SkillEffect
//
// # rapid skill
// delay1      | delay2         | delay3
// _init       | control/update | update
// prepare     | loop           | end
// SkillEffect | SkillEffect    | SkillEffect


/**
 * 23001002(藝術跳躍)
 * 24001002(幻影瞬步)
 */
let jump2_info = {
	type: 40,
	casterMove: 1,
	avaliableInJumpingState: 1
};

/**
 * 23121000(伊修塔爾之環): localhost/xml2/Skill/2312.img/skill/23121000
 */
let rapid_attack_info = {
	type: 2,
	knockbackLimit: 80,
	rapidAttack: 1
};


class _SkillInfo {
	constructor() {
		this.type = 40;

		/** @type {boolean} */
		this.casterMove = 1;

		/** @type {boolean} */
		this.avaliableInJumpingState = 1;


		/** @type {boolean} */
		this.areaAttack = 1;

		this.knockbackLimit = 80;

		/** @type {boolean} */
		this.rapidAttack = 1;
	}
}
class _SkillCommonData {
	constructor() {
		/** @type {Vec2} */
		this.lt = null;//new Vec2(-200, -113)

		/** @type {Vec2} */
		this.rb = null;//new Vec2(-10, 0)

		/** @type {string} - code */
		this.mpCon = "3 + d(x / 6)";

		/** @type {string} - code */
		this.damage = "175 + 8 * x";

		/** @type {number} */
		this.mobCount = 6;

		/** @type {number} */
		this.attackCount = 1;

		/** @type {number} */
		this.maxLevel = 20;
	}
}
class _SkillData {
	constructor() {
		/** @type {{ [actType: number]: string }} */
		this.action = {
			"0": "dualVulcanLoop"
		};

		/** @type {_SkillCommonData} */
		this.common = null;

		/** @type {_SkillInfo} */
		this.info = null;

		/** @type {SkillEffectAnimation} - ? type */
		this.effect = null;

		/** @type {SkillEffectAnimation} - ? type */
		this.prepare = null;

		/** @type {SkillEffectAnimation} - ? type */
		this.keydown = null;

		/** @type {SkillEffectAnimation} - ? type */
		this.keydown0 = null;

		/** @type {SkillEffectAnimation} - ? type */
		this.keydownend = null;

		/** @type {{[skill_id:string]:{[type:number]:number}}} */
		this.finalAttack = {
			"23100006": {
				"0": 52
			}
		};

		/** @type {number} */
		this.masterLevel = 10;

		/** @type {number} */
		this.combatOrders = 1;

		/** @type {number} */
		this.weapon = 52;

		/** @type {number} */
		this.subWeapon = 35;

		/** @type {number} */
		this.psd = 1;

		/** @type {number} - ?? */
		this.psdSkill = {
			23111002: {}
		};

		/** @type {{[skill_id:string]:number}} */
		this.req = {
			"23111000": 20
		};

		/** @type {number} */
		this.canJobRidingUse = 1;
	}
}



export class SkillEffectAnimation extends Animation {
	constructor(raw, url) {
		super(raw, url);
		this.x = 0;
		this.y = 0;

		/** @type {{x: number, y: number, front:-1|1}} */
		this.targetRenderer = null;

		/** @type {PBullet} */
		this.$physics = null;

		this.is_loop = false;

		this.opacity = 1;
	}
	
	/**
	 * @param {string|number} type - ??
	 * @param {string} url - ??
	 * @param {object} raw - ??
	 */
	load(type) {
		if (!this._raw) {
			throw new Error("Not implement. skill data is loaded");
			this._url = [this._url, type].join("/");
			return super.load();
		}
		else {
			if (Array.isArray(this._raw[0])) {
				/** @type {Sprite[]} */
				this.textures = this._raw[type];
			}
			else {
				/** @type {Sprite[]} */
				this.textures = this._raw;
			}
		}
	}

	destroy() {
		super.destroy();

		this.$physics = null;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this.$physics) {
			this.update_p(stamp);
		}
		else if (this.targetRenderer) {
			this.update_r(stamp);
		}
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		if (this.$physics) {
			this.render_p(renderer);
		}
		else if (this.targetRenderer) {
			this.render_r(renderer);
		}
	}
	
	/**
	 * @param {number} stamp
	 */
	update_p(stamp) {
		super.update(stamp);
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render_p(renderer) {
		const pos = this.$physics.getPosition();
		const front = this.$physics.front;
		const x = pos.x * $gv.CANVAS_SCALE;
		const y = pos.y * $gv.CANVAS_SCALE;

		this.x = x;
		this.y = y;

		//renderer.pushGlobalAlpha();

		renderer.globalAlpha = this.opacity;
		this.draw(renderer, x, y, 0, front > 0);

		//renderer.popGlobalAlpha();
	}
	
	/**
	 * @param {number} stamp
	 */
	update_r(stamp) {
		stamp *= this.targetRenderer.speed;
		
		super.update(stamp);
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	render_r(renderer) {
		this.x = this.targetRenderer.x + this.targetRenderer.tx;//TODO: crr.tx and crr.ty ??
		this.y = this.targetRenderer.y + this.targetRenderer.ty;

		//renderer.pushGlobalAlpha();

		renderer.globalAlpha = this.opacity;
		this.draw(renderer, this.x, this.y, 0, this.targetRenderer.front > 0);

		//renderer.popGlobalAlpha();
	}
}

class SkillHitAnimation extends SkillEffectAnimation {
	constructor(raw, url) {
		super(raw, url);
	}
}



/**
 * TODO: SceneObject 取代 EffectManager
 */
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
			if (!eff.isEnd()) {
				eff.update(stamp);
			}
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
		renderer.pushGlobalAlpha();

		const effects = EffectManager._effects;
		for (let i = 0; i < effects.length; ++i) {
			effects[i].render(renderer);
		}

		renderer.popGlobalAlpha();
	}
}
/** @type {Animation[]} */
EffectManager._effects = [];

window.$EffectManager = EffectManager;



/**
 * 
 */
class SkillAnimationBase {
	///**
	// * @param {object} raw
	// * @param {string} url
	// */
	constructor(/*raw, url*/) {
		//this._raw = raw;

		/**
		 * @type {_SkillData}
		 */
		this.data = null;
		
		/** @type {string} */
		this.url = null;
		
		//this.textures = {
		//	effect: [],
		//	hit: {
		//		"0": []
		//	},
		//}

		/** @type {string} */
		this.skillId = null;

		/**
		 * actType = GetJobInfo(chara).avaliableWeapon.indexOf(ItemInfo.get(chara.weapon).type)
		 */
		this.actType = 0;
		
		/** @type {SceneObject} */
		this._owner = null;

		/** @type {CharacterAnimationBase} */
		this._crr = null;

		/** @type {ActionAnimation} */
		this._actani = null;
		
		/** @type {number} - skill type */
		this.type = 0;
		
		/** @type {boolean} */
		this._$is_end = false;
		
		/** @type {boolean} */
		this.is_launch = false;
		
		//if (raw && url) {
		//	this.__load(url, raw, null);
		//}

		/** @type {"prepare"|"keydown"|"keydownend"} */
		this.state = null;
	}

	/**
	 * @virtual
	 */
	_init() {
		this._applyDefaultAction();
	}

	get is_end() {
		return this._$is_end;
	}
	set is_end(value) {
		this._$is_end = value;
		if (value) {
			this.owner.$physics.state.invokeSkill = false;
		}
	}

	/** @type {SceneObject} */
	get owner() {
		return this._owner;
	}
	set owner(value) {
		if (!value) {
			return;
		}
		this._owner = value;

		this._crr = value.renderer;
		if (!this._crr) {
			return;
		}

		//const chara = value; //??
		//this.actType = GetJobInfo(chara).avaliableWeapon.indexOf(ItemInfo.get(chara.weapon).type)

		this._actani = this._crr.actani;
		if (!this._actani) {
			return;
		}
	}

	/**
	 * @alias owner
	 * @returns {SceneCharacter}
	 */
	get _owner_player() {
		return this._owner;
	}
	set _owner_player(value) {
		this.owner = value;
	}

	/**
	 * @param {string} action
	 */
	_applyAction(action) {
		if (this._actani && this.data) {
			const actions = this.data.action;
			this._actani.reload(action);//action ? 0, 1
			this._actani.loop = false;

			this.owner.$physics.state.invokeSkill = true;
		}
	}

	/** skill default action */
	_applyDefaultAction() {
		const actions = this.data.action;
		this._applyAction(actions[this.actType]);
	}
	
	/**
	 * download data, load texture
	 * @param {string} skillId
	 */
	async _load(skillId) {
		const jobID = /^(\d+)\d{4}$/.exec(skillId)[1];

		const url = `${this.constructor._base_path}/${jobID}.img/skill/${skillId}`;

		const raw = JSON.parse(await $get.pack(url));
		if (!raw) {
			alert("SkillAnimationBase");
			return;
		}
		this.data = raw;
		
		this.url = url;

		this.skillId = skillId;

		this.type = this.data.info ? (this.data.info.type || 0) : 0;//const

		this.__proto__ = this._decide_type().prototype;
		{
			this._loadTexture(raw);

			this._init();
		}
	}
	
	/**
	 * copy
	 * @param {SkillAnimationBase} skill_anim
	 * @param {SkillAnimationBase} proto - skill prototype
	 */
	_assign(skill_anim, proto) {
		this.data = skill_anim.data;
		
		this.url = skill_anim.url;

		this.skillId = skill_anim.skillId;
		
		this.type = skill_anim.type;//const

		this.__proto__ = this._decide_type().prototype;
		{
			this._init();
		}
	}
	
	_loadTexture() {
		for (let effName of this._effect_names) {
			let eff = this.data[effName];
			if (eff) {
				this.data[effName] = arrNd_texture(eff, [this.url, effName].join("/"));
			}
		}
		
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
			effect.action = arr1d.action;
			return effect;
		}
		function arr2d_texture(arr2d/*, url*/) {
			let hit = [];
			for (let i = 0; i in arr2d; ++i) {
				//const url_i = `${url}/${i}`;
				let group = arr2d[i];
				hit[i] = [];
				for (let  j = 0; j in group; ++j) {
					let data = group[j];
					let tex = new Sprite(data);//image base64
					//tex._url = `${url_i}/${j}`;
					hit[i][j] = tex;
				}
				hit[i].action = group.action;
			}
			return hit;
		}
	}

	/**
	 * reset and restart
	 */
	reset() {
		this._actani.reset();
		this.is_launch = false;
	}

	/**
	 * onKeydown + onKeyup
	 * TODO: 可控制方向的技能
	 * @virtual
	 * @param {Partial<_ArrowKey>} inputKey - keyDown tick counter
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 */
	control(inputKey, keyDown, keyUp) {
	}
	
	/**
	 * TODO: 自動攻擊、被動技能、debuf
	 * @virtual
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this.$promise) {
			//Now loading...
		}
		else {
			this.is_launch = true;
			this.is_end = true;
			console.warn("Skill not implement: " + this.skillId);
		}
	}

	/**
	 * @param {number} stamp
	 */
	_default_update(stamp) {
		stamp *= this._crr.speed;

		if (this._actani) {
			if (this._actani.delay) {// not start yet
				return;
			}
			else if (!this.is_launch) {
				this._addEffect();

				this.is_launch = true;
			}
			if (this._actani.isEnd()) {
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
	 * @param {SceneObject} targetObject
	 */
	addAttack(targetObject) {
		/** @type {SceneCharacter} */
		const owner = this._owner;

		let attack = new AttackPair();

		//attack.objectid = targetObject.$objectid;
		attack.setTargetObject(targetObject);

		attack.allDamage.length = this.data.common.attackCount;

		////apply damage
		//for (let i = 0; i < attack.allDamage.length; ++i) {
		//	targetObject.damage(owner, 123);
		//}
		////
		//targetObject.knockback(chara, 16, 16);

		this.attackInfo.allAttack.push(attack);
	}

	createBullet(effectName) {
		let eff, bullet;

		//bullet renderer
		{
			eff = this._addEffect(effectName);

			eff.is_loop = true;
		}

		//bullet physics
		{
			bullet = new PBullet(this.owner.$physics, this, eff);

			bullet._create();

			bullet.launch(null, this.owner.$physics.state.front * (window.$BULLET_SPEED | 32), 0);
		}

		//link renderer and physics
		eff.$physics = bullet;

		return bullet;
	}

	/**
	 * @param {boolean} [isBullet=false]
	 */
	_addDefaultEffect(isBullet) {
		this._applyDefaultAction();
		this._addEffect("effect", isBullet);
	}

	/**
	 * @param {string} [effectName="effect"]
	 * @param {boolean} [isBullet=false]
	 */
	_addEffect(effectName = "effect", isBullet) {
		let action = this.data[effectName].action;
		if (action) {
			this._applyAction(action);
		}

		try {
			const type = this.actType;
			let effect = new SkillEffectAnimation(this.data[effectName], [this.url, effectName].join("/"));

			if (isBullet) {
				//...??
			}
			else {
				effect.targetRenderer = this._crr;
			}
			effect.load(type);

			EffectManager.AddEffect(effect);

			return effect;
		}
		catch (ex) {
		}
	}
	
	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {{x: number, y: number}=} target
	 * @param {number=} type
	 */
	_addHitEffect(x, y, target, type) {
		let hit = new SkillHitAnimation();
		
		hit.target = target;
		
		hit.load(this.url + "/hit/" + type, this.data.hit, type);
		
		EffectManager.AddEffect(hit);
	}


	/**
	 * @returns {function():(T extends SkillAnimationBase)}
	 */
	_decide_type() {
		const info = this.data.info;

		//TODO: register skill

		switch (this.type) {
			case 1:
			case 2:
				if (info.rapidAttack) {
					return _SkillAnimation_RapidAttack;
				}
				break;
			case 40:
				if (info.casterMove && info.avaliableInJumpingState) {
					return _SkillAnimation_N_Jump;
				}
				break;
		}
		return _SkillAnimation_Default;
	}

	/**
	 * @virtual
	 */
	get _effect_names() {
		return ["effect", "hit"];
	}
	
	static get _base_path() {
		return "/Skill";
	}
}

class _SkillAnimation_Default extends SkillAnimationBase {
	constructor() {
		throw new TypeError("constructor");
	}

	/**
	 * @override
	 */
	_init() {
		this._applyDefaultAction();
	}

	/**
	 * @override
	 * @param {number} stamp
	 */
	update(stamp) {
		this._default_update(stamp);
	}
}

class _SkillAnimation_RapidAttack extends SkillAnimationBase {
	constructor() {
		throw new TypeError("constructor");
	}

	/**
	 * @override
	 */
	_init() {
		this._applyDefaultAction();

		this.state = "prepare";
		this._state_func = this._prepare;
		this.current_effect = this._addEffect(this.state);

		/** animation */
		this.time = 0;

		/** fire bullet */
		this.tick = 0;

		this.fadeTotalTime = this._actani.getTotalTime();
	}

	_prepare() {
		this.current_effect.opacity = this.time / this.fadeTotalTime;

		if (this._actani.isEnd()) {
			this.current_effect.opacity = 0;//prepare
			this.current_effect.destroy();

			this.state = "keydown";
			this._state_func = this._keydown;
			this.current_effect = this._addEffect(this.state);
			this.time = 0;//reset
		}
	}
	_keydown() {
		if (this._actani.isEnd()) {
			this.current_effect.reset();
			this.current_effect.opacity = 1;
			this._actani.reset();
			this.time = 0;//reset
		}
	}
	_keydownend() {
		this.current_effect.opacity = 1 - (this.time / this.fadeTotalTime);

		if (this._actani.isEnd()) {
			this.current_effect.opacity = 0;//keydownend
			this.current_effect.destroy();

			this.is_launch = true;
			this.is_end = true;
		}
	}

	/**
	 * @override
	 * @param {Partial<_ArrowKey>} inputKey - keyDown tick counter
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 */
	control(inputKey, keyDown, keyUp) {
		if (keyUp) {
			this.current_effect.opacity = 0;//keydown
			this.current_effect.destroy();

			this.state = "keydownend";
			this._state_func = this._keydownend;
			this.current_effect = this._addEffect(this.state);
			this.fadeTotalTime = this._actani.getTotalTime();
			this.time = 0;//reset
		}
	}

	/**
	 * @override
	 * @param {number} stamp
	 */
	update(stamp) {
		//keydown(first step): prepare
		//keydown(second step): keydown + keydown0
		//keyup: keydownend

		stamp *= this._crr.speed;

		this.time += stamp;

		++this.tick;

		this._state_func();

		if (this.tick % (window.$FIRE_BULLET_T | 3) == (window.$FIRE_BULLET_T2 | 2) && this.state != "keydownend") {
			this.createBullet("ball");
		}
	}

	/**
	 * @virtual
	 */
	get _effect_names() {
		return ["prepare", "keydown", "keydownend", "hit", "ball"];
	}
}

class _SkillAnimation_N_Jump extends SkillAnimationBase {
	constructor() {
		throw new TypeError("constructor");
	}

	/**
	 * @override
	 */
	_init() {
		this.jump_count = 0;//is_launch = this.jump_count > 0
		this.jump_max_count = 2;
	}

	jump2() {
		const crr = this._crr;
		const body = this._owner_player.$physics.body;

		body.ConstantVelocityWorldCenter2((window.$NJmpX || 40) * crr.front, (window.$NJmpY || 0));

		this._addDefaultEffect();
	}

	/**
	 * @override
	 * @param {Partial<_ArrowKey>} inputKey - keyDown tick counter
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 */
	control(inputKey, keyDown, keyUp) {
		if (!this._owner) {
			debugger;
			return;
		}
		const $physics = this._owner.$physics;

		if (keyUp && $physics.state.jump) {
			++this.jump_count;
		}

		if (this.jump_count == 0) {
			if (keyDown && $physics._isCanJump()) {//TODO: why 離開地面需要些時間 (keyDown > 0)
				$physics._actionJump();
			}
		}
		else if ($physics.state.jump) {
			if (keyDown == 1 && this.jump_count < this.jump_max_count) {
				this.jump2();
			}
		}
		else {//??
			this.is_end = true;
		}
	}

	/**
	 * @override
	 * @param {number} stamp
	 */
	update(stamp) {
		const $physics = this._owner.$physics;

		if ($physics.$foothold) {//!$physics._isCanJump()
			if (this._actani.isEnd()) {
				this.is_end = true;
			}
		}
	}
}

/**
 * TODO: add skill
 */
class __SkillAnimation_Template extends SkillAnimationBase {
	/**
	 * @override
	 */
	_init() {
		this._applyDefaultAction();
		// ...
	}

	/**
	 * @override
	 * @param {number} stamp
	 */
	update(stamp) {
	}
}

export class SceneSkill extends SkillAnimationBase {
	constructor() {
		super();

		/** @type {AttackInfo} */
		this.attackInfo = new AttackInfo();
	}

	/**
	 * @param {string} skillId
	 * @param {SceneObject} owner
	 */
	load(skillId, owner) {
		this.owner = owner;

		if (!skillId) {
			throw new Error("1 argument required");
		}
		
		if (String(skillId).length <= 4) {
			throw new Error("skill ID format");
		}
		//skillId = 1120017;//1001005;// jobId + 4-digit
		
		let loaded_skill = SceneSkill.__loaded_skill[skillId];
		if (loaded_skill && loaded_skill.data) {
			this._assign(loaded_skill);
		}
		else {
			let promise = this._load(skillId, owner);

			this.$promise = promise;

			SceneSkill.__loaded_skill[skillId] = this;

			promise.then(() => {
				delete this.$promise;
			});

			return promise;
		}
	}
}
SceneSkill.__loaded_skill = {};

window.$SceneSkill = SceneSkill;

class _ArrowKey {
	constructor() {
		this.left = 0;
		this.up = 0;
		this.right = 0;
		this.down = 0;
	}
}
