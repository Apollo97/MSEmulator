
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
 * 23121000(伊修塔爾之環): localhost/xml2/Skill/2312/skill/23121000
 */
let rapid_attack_info = {
	type: 2,
	knockbackLimit: 80,
	rapidAttack: 1
};


//超級技能是從30號開始
let aaa = {
	icon:                   "技能圖標（一般狀態）",
	iconMouseOver:          "技能圖標（鼠標劃過時）",
	iconDisabled:           "技能圖標（不可用時）",
	effect:                 "技能光效，此外還有相關的effect0、affected（隊友身上的光效）、special、repeat、ball（發射體光效）、 hit（擊中光效）、mob（怪物頭上的debuff光效）、tile（全屏光效會用到）、prepare（rapidAttack類技能起手光效）、keydown（rapidAttack類技能持續按住光效）、keydownend（rapidAttack類技能結束光效）、finish（rapidAttack類技能結束光效）",
	PVPcommon:              "天國的大亂斗里面的數據",
	req:                    "前置技能",
	reqLev:                 "要求等級",
	fixLevel:               "固定技能等級",
	info:                   "技能相關信息，包含攻擊類型、debuff類型等",
	elemAttr:               "技能元素屬性（i冰l雷f火s毒h聖d暗）",
	action:                 "技能動作指向（需要character.wz查看）",
	masterLevel:            "能力級別",
	combatOrders:           "戰鬥指令是否有效",
	notRemoved:             "不可消除，一般只會在buff技能出現，就是不被消技能",
	weapon:                 "武器限制，只有在用相應武器代碼的武器時才可以釋放",
	subWeapon:              "副武器限制，只有在用相應副武器代碼的副武器時才可以釋放",
	addAttack:              "銜接技能",
	finalAttack:            "終極攻擊",
	invisible:              "不可見（如無其他技能調用則和刪除是一樣的）",

	common: {//技能數據
		maxLevel: "最高等級",
		mpCon:                 "mp消耗",
		hpCon:                 "hp消耗",
		damage:                "傷害",
		bulletCount:           "發射體消耗（標 / 箭 / 子彈）",
		attackCount:           "段數",
		mobCount:              "攻擊怪物數",
		prop:                  "特殊效果引發機率",
		time:                  "buff / debuff持續時間、技能持續時間等",
		cooltime:              "冷卻時間",
		lt:                    "範圍，與rb一同使用，這個數值衡定技能最遠、最往上的有效位置",
		rb:                    "範圍，與lt一同使用，這個數值恆定技能最近、最往下的有效位置",
		range:                 "範圍，獨立使用，與ltrb一般不同時使用，射程類範圍",
		cr:                    "暴擊率",
		criticaldamageMin:     "最小暴擊傷害",
		criticaldamageMax:     "最大暴擊傷害",
		mastery:               "熟練度",
		damR:                  "百分比總傷",
		bdR:                   "百分比boss傷",
		ignoreMobpdpR:         "百分比無視怪物防禦率",
		dottime:               "持續傷害的時間",
		dot:                   "持續傷害的傷害",
		dotInterval:           "持續傷害的間隔時間",
		dotSuperpos:           "持續傷害的疊加次數",
		actionSpeed:           "攻速",
		booster:               "攻速",
		MaxDamageOver:         "傷害上限",
		psdSpeed:              "角色移動速度",
		psdJump:               "角色跳躍力",
		terR:                  "屬性傷害抗性",
		asrR:                  "異常狀態抗性",
		pdd:                   "物理防禦力",
		mdd:                   "魔法防禦力",
		mhp:                   "HP上限",
		mmp:                   "MP上限",
		str:                   "力量",
		dex:                   "敏捷",
		int:                   "智力",
		luk:                   "運氣",
		x:                     "一些常用的在服務器端存儲效果的數值，但不限於此",
		y:                     "一些常用的在服務器端存儲效果的數值，但不限於此",
		z:                     "一些常用的在服務器端存儲效果的數值，但不限於此",
		v:                     "一些常用的在服務器端存儲效果的數值，但不限於此",
		//xxxR:                  "xxx率",
		//xxxX:                  "xxx數值",
		//xxx2yyy:               "xxx按照一定比率增加到yyy上",
		//indiexxx:              "可疊加的xxx",
		//xxxMax:                "最大xxx",
		//Maxxxx:                "最大xxx",
		//xxxCon:                "xxx消耗",
		gauge:                 "夜光光暗指數",
	}
}


const evaluate = (function () {
	const u = x => Math.ceil(x);
	const d = x => Math.trunc(x);
	return (expr, x) => {
		return eval(expr);
	};
})();


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
	constructor(raw/*, url*/) {
		super(raw/*, url*/);
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
			throw new TypeError("raw");
			//this._url = [this._url, type].join("/");
			//return super.load();
		}
		else {
			if (Array.isArray(this._raw[type])) {
				/** @type {Sprite[]} */
				this.textures = this._raw[type];
			}
			else {
				/** @type {Sprite[]} */
				this.textures = this._raw;
			}
			if (process.env.NODE_ENV !== 'production') {
				if (!(this.textures[0] instanceof Sprite)) {
					throw new TypeError();
				}
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
		stamp *= this.targetRenderer.getSpeed();
		
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
	 * return this._owner as SceneCharacter
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
			const actions = this.data.action;//??
			this._actani.reload(action);//action ? 0, 1
			this._actani.loop = false;
			
			this.owner.$physics.state.invokeSkill = true;
		}
	}

	/**
	 * @returns {string}
	 */
	_getDefaultAction() {
		const actions = this.data.action;
		return actions[this.actType];
	}

	/** skill default action */
	_applyDefaultAction() {
		this._applyAction(this._getDefaultAction());
	}

	_isFinishDefaultAction() {
		const act = this._getDefaultAction();
		if (this._actani) {
			return this._actani._action != act;
		}
		else {
			return true;
		}
	}

	/**
	 * download data, load texture
	 * @param {string} skillId
	 */
	async _load(skillId) {
		const jobID = /^(\d+)\d{4}$/.exec(skillId)[1];

		const url = `${this.constructor._base_path}/${jobID}/skill/${skillId}`;

		let raw;
		try {
			raw = await $get.data(url);
		}
		catch (ex) {
			throw ex;
		}
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
				this.data[effName] = arrNd_texture(eff/*, [this.url, effName].join("/")*/);
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
				let tex = new Sprite(data);
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
					let tex = new Sprite(data);
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
	 * is owner can invoke skill
	 * @virtual
	 * @param {SceneCharacter} owner
	 * @returns {boolean}
	 */
	test(owner) {
		return true;
	}

	/**
	 * onKeydown + onKeyup
	 * TODO: 可控制方向的技能
	 * @virtual
	 * @param {Partial<_ArrowKey>} inputKey - keyDown tick counter
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 * @returns {boolean} - cancel player default control
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
	 * no timer
	 * @param {number} stamp
	 */
	_default_update(stamp) {
		//stamp *= this.targetRenderer.getSpeed();

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
			let effect = new SkillEffectAnimation(this.data[effectName]/*, [this.url, effectName].join("/")*/);

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
		super();
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
		super();
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

		this._crr.fixed_speed = true;
	}

	_prepare() {
		this.current_effect.opacity = this.time / this.fadeTotalTime;
		if (this.current_effect.opacity > 1) {
			this.current_effect.opacity = 1;
		}

		if (this._actani.isEnd()) {
			this.current_effect.opacity = 0;//prepare
			this.current_effect.destroy();

			this.state = "keydown";
			this._state_func = this._keydown;
			this.current_effect = this._addEffect(this.state);

			this._actani.loop = true;
			this.current_effect.is_loop = true;

			this.time = 0;//reset
		}
	}
	_keydown() {
		if (this._actani.isEnd()) {
			//this.current_effect.reset();
			//this.current_effect.opacity = 1;
			//this._actani.reset();
			this.time = 0;//reset
		}
	}
	_keydownend() {
		this.current_effect.opacity = 1 - (this.time / this.fadeTotalTime);
		if (this.current_effect.opacity < 0) {
			this.current_effect.opacity = 0;
		}

		if (this._actani.isEnd()) {
			this.current_effect.opacity = 0;//keydownend
			this.current_effect.destroy();

			this._crr.fixed_speed = false;
			this.is_launch = true;
			this.is_end = true;
		}
	}

	/**
	 * is owner can invoke skill
	 * @override
	 * @param {SceneCharacter} owner
	 * @returns {boolean}
	 */
	test(owner) {
		return true;
	}

	/**
	 * @override
	 * @param {Partial<_ArrowKey>} inputKey - keyDown tick counter
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 * @returns {boolean} - cancel player default control
	 */
	control(inputKey, keyDown, keyUp) {
		switch (this.state) {
			case "prepare":
			case "keydown":
				if (!keyDown || keyUp) {
					this.current_effect.opacity = 0;//keydown
					this.current_effect.destroy();

					this.state = "keydownend";
					this._state_func = this._keydownend;
					this.current_effect = this._addEffect(this.state);
					this.fadeTotalTime = this._actani.getTotalTime();

					this._actani.loop = false;
					this.time = 0;//reset
				}
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

		stamp *= this._crr.getSpeed();
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
		super();
		throw new TypeError("constructor");
	}

	/**
	 * @override
	 */
	_init() {
		this.jump_max_count = (window.jump_max_count || 2);
	}

	jump() {
		{
			const crr = this._crr;
			const $physics = this._owner_player.$physics;
			//const body = $physics.body;
			const foot_walk = $physics.foot_walk;

			//const pos = $physics.getPosition();
			//console.log("pos: { x: %o, y: %o }", pos.x, pos.y);

			//body.ConstantVelocityWorldCenter2((window.$NJmpX || 40) * crr.front, (window.$NJmpY || 0));
			foot_walk.ConstantVelocityWorldCenter2((window.$NJmpX || 40) * crr.front, (window.$NJmpY || 0));

			$physics.state.jump_count += $physics.state.jump_count ? 1 : 2;
		}
		this._addDefaultEffect();
	}

	/**
	 * is owner can invoke skill
	 * @override
	 * @param {SceneCharacter} owner
	 * @returns {boolean}
	 */
	test(owner) {
		if (this._owner_player.$remote) {
			return true;
		}
		else {
			const $physics = owner.$physics;
			const state = owner.$physics.state;
			return !$physics.$foothold && state.jump && state.jump_count < this.jump_max_count;
		}
		return false;
	}

	/**
	 * @override
	 * @param {Partial<_ArrowKey>} inputKey - keyDown tick counter
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 * @returns {boolean} - cancel player default control
	 */
	control(inputKey, keyDown, keyUp) {
		//if (!this._owner_player) {
		//	debugger;
		//	return;
		//}
		//if (keyDown == 1 && this.test(this._owner_player)) {
		//	const $physics = this._owner_player.$physics;
		//
		//	$physics.state.jump_count += $physics.state.jump_count ? 1 : 2;
		//
		//	this.jump2();
		//}
	}

	/**
	 * @override
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this._actani) {
			if (this._actani.delay) {// not start yet
				return;
			}
			else if (!this.is_launch) {
				this.jump();

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

		const $physics = this._owner_player.$physics;
		
		if (this._isFinishDefaultAction()) {
			this.is_end = true;
		}
		else {
			if ($physics.$foothold) {
				this.is_end = true;
			}
			else if (!$physics.state.jump) {
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
	 * is owner can invoke skill
	 * @override
	 * @param {SceneCharacter} owner
	 * @returns {boolean}
	 */
	test(owner) {
		//TODO: condition
		return true;
	}

	/**
	 * @override
	 * @param {Partial<_ArrowKey>} inputKey - keyDown tick counter
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 * @returns {boolean} - cancel player default control
	 */
	control(inputKey, keyDown, keyUp) {
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
	async load(skillId, owner) {
		this.owner = owner;

		if (!skillId || !owner) {
			throw new TypeError("arguments");
		}
		
		if (String(skillId).length <= 4) {
			throw new Error("skill ID format");
		}
		//skillId = 1120017;//1001005;// jobId + 4-digit

		this.attackInfo.skillId = skillId;
		
		this.update = this.wait_loading;
		this.control = this.wait_loading;
		
		try {
			let loaded_skill = SceneSkill.__loaded_skill[skillId];
			if (loaded_skill) {
				if (loaded_skill.$promise) {
					this.$promise = loaded_skill.$promise;
					await loaded_skill.$promise;
					delete this.$promise;
				}
				this._assign(loaded_skill);
			}
			else {
				let promise = this._load(skillId/*, owner*/);//owner ??

				this.$promise = promise;

				SceneSkill.__loaded_skill[skillId] = this;

				await promise;

				delete this.$promise;
			}
		}
		catch (ex) {
			console.error("can not load skill: %o, owner: %o", skillId, owner);
			delete this.$promise;
			this.update = this.__load_failed;//debug
			this.control = this.__load_failed;//debug
			//delete SceneSkill.__loaded_skill[skillId];//try reload
			throw ex;
		}
		
		delete this.update;
		delete this.control;
	}
	
	wait_loading() {
	}
	
	/**
	 * debug
	 */
	__load_failed() {
	}
	
	/**
	 * @param {string} skillId
	 * @returns {SceneSkill}
	 */
	static preload(skillId) {
		try {
			let loaded_skill = SceneSkill.__loaded_skill[skillId];
			if (loaded_skill) {
				return loaded_skill;
			}
			else {
				let skill = new SceneSkill();
				
				skill.load(skillId, "static preload no owner");
				
				return skill;
			}
		}
		catch (ex) {
			console.error("can not preload skill: %o", skillId);
			throw ex;
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
