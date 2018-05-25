
import { Randomizer } from "../math.js";

import { Animation } from "../Animation.js";
import { SceneObject } from "../SceneObject.js";

import { MobSkillBallDefinition, MobSkillBallBase, MobSkillBase } from "./MobSkillBase.js";

class FlowerTrapBallDefinition extends MobSkillBallDefinition {
	constructor() {
		super();
		this.size = 0;// 1~3
	}
}

export class FlowerTrapBall extends MobSkillBallBase {
	/**
	 * @param {FlowerTrapBallDefinition} ballDef
	 */
	constructor(ballDef, animations) {
		super(ballDef, animations);
		
		this.renderer = animations[ballDef.size].clone();
	}
	
	/** @param {PWorld} pWorld */
	create(pWorld) {
		this.$physics = {};// make dummy for debug
		
		super.create(pWorld);//complete create
	}
	
	get _BallDefinition() {
		return FlowerTrapBallDefinition;
	}
}

export class FlowerTrap extends MobSkillBase {
	constructor(_raw, _url) {
		super(_raw, _url);
		this.patterns = {};
	}
	
	/**
	 * @param {number} pattern - 0~2 int
	 * @param {number} x - int
	 * @param {number} y - int
	 * @param {boolean} flip - not sure
	 */
	_invoke(pattern, x, y, flip) {
		const pats = this._raw["pattern" + pattern];
		for (let i = 0; i in pats; ++i) {
			const pat = pats[i];
			let mx, my, angle;
			
			mx = x + (flip ? (-pat.pos.x) : (pat.pos.x));
			my = y + pat.pos.y;
			angle = pat.angle - 90;//texture is vertical, angle - 90deg
			
			let ball = new FlowerTrapBall({
				x: mx, y: my, angle: angle,
				size: pat.size,
				createDelay: pat.createDelay,
				collisionDelay: pat.collisionDelay,
				duration: pat.duration
			}, this.animations);
			
			$gv.SceneObjectMgr.addToScene(10, ball);
		}
	}
	
	/** @returns {void} */
	invoke() {
		this._invoke(Randomizer.nextInt(3), 1000, 48, Randomizer.nextBoolean());
	}
	
	/** @returns {string[]} */
	get _anima_name_list() {
		return ["XL", "L", "M", "S"];
	}
	
	/** @returns {string} */
	get _base_path() {
		return "Skill/MobSkill.img/238/level";
	}
}

