
/**
 * usage:
 *	var fairyDust = new FairyDust();
 *	fairyDust.load(4).then(()=>fairyDust.invoke());
 */
 
import box2d from "../../../public/box2d-html5.js";

import { Randomizer } from "../math.js";

import { Animation } from "../Animation.js";
import { SceneObject } from "../SceneObject.js";

import { MobSkillBallDefinition, MobSkillBallBase, MobSkillBase } from "./MobSkillBase.js";


class FairyDustBallDefinition extends MobSkillBallDefinition {
	constructor() {
		super();
		this.scale = 0;// 1~3
	}
}

export class FairyDustBall extends MobSkillBallBase {
	/**
	 * @param {FairyDustBallDefinition} ballDef
	 */
	constructor(ballDef, animations) {
		super(ballDef, animations);
		
		this.x = 1000;
		this.y = -80;
		
		//this.scale = ballDef.scale;
		
		this.renderer = animations["ball" + ballDef.scale].clone();
	}
	
	/** @param {PWorld} pWorld */
	create(pWorld) {
		this.$physics = {};// make dummy for debug
		
		super.create(pWorld);//complete create
	}
	
	get _BallDefinition() {
		return FairyDustBallDefinition;
	}
}
export class FairyDustBallHit extends SceneObject {
	constructor(target, animations) {
		super();
		//MouseJoint
		//World.CreateJoint()
	}
}

export class FairyDust extends MobSkillBase {
	constructor(_raw, _url) {
		super(_raw, _url);
	}
	
	/** @param {4|10} level */
	
	invoke() {
		const s = this._raw.s;
		const s2 = this._raw.s2;
		const v = this._raw.v;
		const v2 = this._raw.v2;
		const w = this._raw.w;
		const w2 = this._raw.w2;
		const u = this._raw.u;
		let x = this._raw.x;
		
		for (let i = 0, max = Randomizer.randInt(w, w + w2); i < max; i++) {
			x += Randomizer.nextInt(x);
			let ball = new FairyDustBall({
				scale: Randomizer.nextInt(3),
				createDelay: u,
				moveSpeed: v + Randomizer.nextInt(v2),
				angle: x + Randomizer.randInt(s, s2),
			}, this.animations);
			SceneObjectMgr.addToScene(10, ball);
		}
	}
	
	/** @returns {string[]} */
	get _anima_name_list() {
		return ["ball0", "ball1", "ball2"];
	}
	
	get _base_path() {
		return "Skill/MobSkill.img/238/level";
	}
}

export class _FairyDust extends FairyDust {
	constructor(_raw, _url) {
		super(_raw, _url);
	}
	/** @override */
	load(level) {
		if (!this._raw && !this._url) {
			this._raw = window.MOB_SKILL_RAW[238].level[level];
			this._url = [this._base_path, level].join("/");
		}
		super.load(level);
	}
}

