
import { SkillAnimation } from "../game/Skill.js";
import { SceneObject } from "../game/SceneObject.js";//?? ref


export class AttackInfo {
	constructor() {
		/** @type {AttackPair[]} - { objectid, attack }[each monster] */
		this.allAttack = [];
		
		//TODO: make this JSON
		
		/** @type {string} */
		this.skillId = null;
	}
	
	///** returns {AttackInfo} */
	//clone() {
	//	let ai = new AttackInfo();
	//	//ai.allAttack = this.allAttack.slice();//??
	//	ai.skill = this.skill;
	//	return ai;
	//}
	
	///**
	// * @param {number} objectid
	// * @returns {AttackPair}
	// */
	//addAttack(objectid) {
	//	let attack = new AttackPair();
	//	attack.objectid = objectid;
	//	this.allAttack.push(attack);
	//}
	
	/**
	 * return current attack and set new instance
	 * @returns {AttackPair[]} - { objectid, attack }[each monster]
	 */
	shiftAllAttack() {
		let allAttack = this.allAttack;
		this.allAttack = [];
		return allAttack;
	}
}

const symbol_targetObject = Symbol("targetObject");

export class AttackPair {
	constructor() {
		/** @type {SceneObject} */
		this[symbol_targetObject] = null;

		///** @type {number} */
		//this.objectid = null;

		/** @type {DamagePair[]} - { realDamage, critical }[attackCount] */
		this.allDamage = [];
	}

	/**
	 * @returns {SceneObject}
	 */
	getTargetObject() {
		return this[symbol_targetObject];
	}

	/**
	 * @param {SceneObject} targetObject
	 */
	setTargetObject(targetObject) {
		this[symbol_targetObject] = targetObject;
	}

	/**
	 * targetObject # $objectid
	 * @returns {number}
	 */
	get objectid() {
		/** @type {SceneObject} */
		let obj = this[symbol_targetObject];
		return obj.$objectid;
	}
	/**
	 * set targetObject by objectid
	 * @param {number} objectid
	 */
	set objectid(objectid) {
		if (Number.isSafeInteger(objectid)) {
			/** @type {SceneObject} */
			let obj = scene_map.lifeMgr.entities[objectid];

			this.setTargetObject(obj);
		}
		else {
			//TODO: targetObject is player's character
		}
	}

	/**
	 * @param {number} realDamage
	 * @param {boolean} critical
	 * @returns {DamagePair}
	 */
	addDamage(realDamage, critical) {
		this.allDamage.push(new DamagePair(realDamage, critical));
	}
}

export class DamagePair {
	/**
	 * @param {number} realDamage
	 * @param {boolean} critical
	 */
	constructor(realDamage, critical) {
		/** @type {number} */
		this.realDamage = realDamage;

		/** @type {boolean} */
		this.critical = critical;
	}

	_validating() {
		return Number.isSafeInteger(this.realDamage);
	}

	/** @param {IRenderer} */
	_draw(renderer) {
		/** @type {CanvasRenderingContext2D} */
		const ctx = renderer.ctx;
		if (Number.isSafeInteger(this.realDamage)) {
			//draw
		}
		else {// debug, invalid damage
			ctx.filter = "gray-scale(1)";
			//draw
			ctx.filter = "none";
		}
	}
}

