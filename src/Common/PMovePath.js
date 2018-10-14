
const { PPlayerState } = require("../game/Physics/PPlayerState.js");


class BaseMoveElem {
	constructor() {
		/** @type {number} */
		this.x = null;

		/** @type {number} */
		this.y = null;

		/** @type {number} - linear velocity x */
		this.vx = undefined;

		/** @type {number} - linear velocity y */
		this.vy = undefined;

		/** @type {number} - force x */
		this.fx = undefined;

		/** @type {number} - force y */
		this.fy = undefined;
		
		/** @type {boolean} */
		this.isAwake = undefined;// value = ?

		/** @type {Partial<PPlayerState>} - player physics state */
		this.pState = null;

		/** @type {{[action:string]:number}} */
		this.actionKey = undefined;

		/** @type {string} */
		this.action = undefined;
		/** @type {number} */
		this.action_frame = undefined;

		/** @type {string} */
		this.emotion = undefined;
		/** @type {number} */
		this.emotion_frame = undefined;

		/** @type {number} - time elapsed */
		this.elapsed = 0;
	}
}

class CharacterMoveElem extends BaseMoveElem {
}

class MobMoveElem extends BaseMoveElem {
	constructor() {
		super();

		/** @type {number} */
		this.objectid = undefined;
	}
}


module.exports = {
	BaseMoveElem,
	CharacterMoveElem,
	MobMoveElem,
};

