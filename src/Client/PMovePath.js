
import { PPlayerState } from "../game/Physics/PPlayer.js";//debug


export class BaseMoveElem {
	constructor() {
		/** @type {number} */
		this.x = null;

		/** @type {number} */
		this.y = null;

		/** @type {number} - linear velocity x */
		this.vx = null;

		/** @type {number} - linear velocity y */
		this.vy = null;

		/** @type {PPlayerState} - player physics state */
		this.pState = null;
	}
}

export class CharaMoveElem extends BaseMoveElem {
}

export class MobMoveElem extends BaseMoveElem {
}

