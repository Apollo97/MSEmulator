
//import BigInt from "big-integer";//bitwise operation


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

	_normalize() {
		this.realDamage = this.realDamage | 0;
		this.critical = !!this.critical;

		if (!Number.isSafeInteger(this.realDamage)) {
			this.realDamage = 0;
		}
	}

	_validating() {
		return Number.isSafeInteger(this.realDamage);
	}

	/** @param {IRenderer} */
	draw(renderer) {
		/** @type {CanvasRenderingContext2D} */
		const ctx = renderer.ctx;
		if (Number.isSafeInteger(this.realDamage)) {
			//draw
		}
		else {//invalid damage
			ctx.filter = "gray-scale(1)";
			//draw
			ctx.filter = "none";
		}
	}
}

export class AttackInfo {
	constructor() {
		/** @type {AttackPair[]} - each monster */
		this.allDamage = [];

		/** @type {skill} */
		this.skill = null;
	}
}

export class AttackPair {
	/**
	 * @param {number} realDamage
	 * @param {boolean} critical
	 */
	constructor(objectid, attack) {
		/** @type {number} */
		this.objectid = objectid;

		/** @type {DamagePair[]} */
		this.attack = attack || [];
	}

	/**
	 * @param {number} realDamage
	 * @param {boolean} critical
	 */
	emplaceDamage(realDamage, critical) {
		this.attack.push(new DamagePair(realDamage, critical));
	}
}

