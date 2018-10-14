

class PPlayerState {
	constructor() {
		/** @type {boolean} - ApplyForce(jump_force) until leave foothold */
		this._begin_jump = false;

		/** jump_count = jump ? jump_count : 0 */
		this.jump = true;

		/** jump_count = jump ? jump_count : 0 */
		this.jump_count = 0;

		/** ?? */
		this._drop = true;

		this.walk = false;

		this.prone = false;

		/** TODO: fallDown */
		this.dropDown = false;

		this._fly = false;//not jump 

		this.brake = true;//??

		/** @type {-1|1} */
		this.front = -1;

		/** @type {boolean} - is use ladder */
		this.ladder = false;

		/**
		 * action animation
		 * @type {-1|0|1} - up: -1, down: 1, stop: 0
		 */
		this.ladder_move_dir = 0;

		/** @type {number} - 無敵時間，unit is millisecond */
		this.invincible = 0;

		/** @type {boolean} - can not move or jump */
		this.freeze = false;

		/** @type {boolean} - can not move or jump */
		this.invokeSkill = false;

		/** @type {number} - use portal cooldown time，unit is millisecond */
		this.portal_cooldown = 0;

		//

		/** @type {number} - knockback time，unit is millisecond */
		this.knockback = 0;

		/** @type {boolean} - off walker power */
		this.outOfControl = false;
	}
}

module.exports = {
	PPlayerState,
}

