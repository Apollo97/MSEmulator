
import { PRemoteCharacter } from "./PPlayer.js";

import { Animation } from "../Animation.js";


window.$MobAction_Move_Priority = 2;
window.$MobAction_Jump_Priority = 1;


export class MobActionController {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		/** @type {string} - ?? */
		this._name = null;

		/** @type {Animation} */
		this._ani = animation;
	}

	/** @type {number} - int */
	get priority() {
		return 1;
	}

	init() {
	}

	/**
	 * @param {PMob} pMob
	 * @returns {boolean}
	 */
	isValid(pMob) {
		return true;
	}

	/**
	 * @param {PMob} pMob
	 */
	update(pMob) {
	}

	/**
	 * @param {PMob} pMob
	 */
	isEnd(pMob) {
		let end = this._ani.isEnd();
		if (end) {
			this.onEnd(pMob);
			return true;
		}
		return false;
	}

	/**
	 * @param {PMob} pMob
	 */
	onEnd(pMob) {
	}
}

export class MobAction_Stand extends MobActionController {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		super(animation);
		this._name = "stand";
	}

	/**
	 * @param {PMob} pMob
	 */
	update(pMob) {
		//保持停止。
		pMob.ikey["left"] = 0;
		pMob.ikey["right"] = 0;
	}
}

export class _MobAction_Move extends MobActionController {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		super(animation);
		this._name = "move";
		this.front = 0;
	}

	/** @type {number} - int */
	get priority() {
		return window.$MobAction_Move_Priority;
	}
	
	/**
	 * @param {PMob} pMob
	 * @returns {boolean}
	 */
	isValid(pMob) {
		let name = pMob.action._name;

		//switch (pMob.action._name) {
		//	case "attack":
		//		return false;
		//	default:
				if (name.startsWith("attack")) {
					return false;
				}
		//		break;
		//}
		return true;
	}
}

export class MobAction_MoveLeft extends _MobAction_Move {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		super(animation);
		this.front = -1;
	}

	/**
	 * @param {PMob} pMob
	 * @returns {boolean}
	 */
	isValid(pMob) {
		return super.isValid(pMob) && (!pMob.state.jump || this.front == pMob.state.front);
	}

	/**
	 * @param {PMob} pMob
	 */
	update(pMob) {
		pMob.ikey["left"] = 1;
		pMob.ikey["right"] = 0;
	}
	
	///**
	// * @param {PMob} pMob
	// */
	//onEnd(pMob) {
	//	pMob.ikey["left"] = 0;//不停止移動，下個動作在處理。
	//}
}

export class MobAction_MoveRight extends _MobAction_Move {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		super(animation);
		this.front = 1;
	}

	/**
	 * @param {PMob} pMob
	 * @returns {boolean}
	 */
	isValid(pMob) {
		return super.isValid(pMob) && (!pMob.state.jump || this.front == pMob.state.front);
	}

	/**
	 * @param {PMob} pMob
	 */
	update(pMob) {
		pMob.ikey["left"] = 0;
		pMob.ikey["right"] = 1;
	}
	
	///**
	// * @param {PMob} pMob
	// */
	//onEnd(pMob) {
	//	pMob.ikey["right"] = 0;//不停止移動，下個動作在處理。
	//}
}

export class MobAction_Jump extends MobActionController {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		super(animation);
		this._name = "jump";
		//this.move = false;
	}

	/** @type {number} - int */
	get priority() {
		return window.$MobAction_Jump_Priority;
	}

	init() {
		//this.move = 1 || Math.random() > 0.5;
	}

	/**
	 * @param {PMob} pMob
	 * @returns {boolean}
	 */
	isValid(pMob) {
		let name = pMob.action._name;

		switch (pMob.action._name) {
			case "attack":
				return false;
			default:
				if (name.startsWith("attack")) {
					return false;
				}
				break;
		}
		return !pMob.state.jump;
	}

	/**
	 * @param {PMob} pMob
	 */
	update(pMob) {
		if (pMob.state.walk) {
			if (pMob.state.front < 0) {
				pMob.ikey["left"] = 1;
			}
			else if (pMob.state.front > 0) {
				pMob.ikey["right"] = 1;
			}
		}
		pMob.ikey["jump"] = 1;
	}

	/**
	 * @param {PMob} pMob
	 */
	onEnd(pMob) {
		//if (this.move) {
		//	if (pMob.state.front < 0) {
		//		pMob.ikey["left"] = 0;
		//	}
		//	else if (pMob.state.front > 0) {
		//		pMob.ikey["right"] = 0;
		//	}
		//}
		pMob.ikey["jump"] = 0;
	}
}

export class MobAction_Attack extends MobActionController {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		super(animation);
		this._name = "attack";
	}

	/**
	 * @param {PMob} pMob
	 * @returns {boolean}
	 */
	isValid(pMob) {
		return pMob.action.isEnd();
	}

	/**
	 * @param {PMob} pMob
	 */
	update(pMob) {
	}
}

export class PMob extends PRemoteCharacter {
	/**
	 * @param {MapMob} mapMob
	 */
	constructor(mapMob) {
		super();
		
		/** @type {PPlayer} */
		this.attackTarget = true;
		
		/** @type {PPlayer} */
		this._enable_rx = false;
		
		/** @type {MapMob} */
		this.chara = mapMob;

		//TODO: move this code to ??
		if (mapMob) {
			if (mapMob.renderer.isFlyMob()) {
				this.setMovementSpeed(this._info.flySpeed);
			}
			else {
				this.setMovementSpeed(this._info.speed);
			}
		}
		
		/** @type {Rectangle} */
		this.activityRegion = null;
		
		this.$debugControl = false;

		/** @type {{[action:string]:number}} */
		this.ikey = {};

		/** @type {MobActionController[]} */
		this.actions = [];

		/** @type {MobActionController} */
		this.action = null;
	}

	/**
	 * @param {} param - ??
	 */
	_registerAction(param) {
		this.actions.push(param);
	}

	/**
	 * {[action:string]:{ controller:MobActionController, renderer:Animation }}
	 * @param {{[action:string]:Animation}} actions
	 * @param {{[action:string]:MobActionController[]} =act_map
	 */
	_loadAction(actions, act_map) {
		act_map = act_map || {
			stand: [MobAction_Stand],
			move: [MobAction_MoveLeft, MobAction_MoveRight],
			jump: [MobAction_Jump],
		};
		
		Object.keys(actions).forEach(key => {
			if (actions[key] && act_map[key]) {
				const list = act_map[key];
				for (let type of list) {
					let controller = new type(actions[key]);
					let priority = controller.priority;

					if (process.env.NODE_ENV !== 'production') {
						if (!(Number.isSafeInteger(priority) && priority > 0)) {
							debugger;
						}
					}

					for (let i = 0; i < priority; ++i) {
						this._registerAction(controller);
					}
				}
			}
			else {
				console.warn("未完成 MobActionController: " + key);
			}
		});

		this.action = this.actions[0];
		if (!this.action) {
			debugger;
		}
	}
	
	get _info() {
		return this.chara.renderer._raw.info;
	}
	get hasBodyDamage() {
		if (this._info.bodyAttack != 0 && this._info.bodyAttack != 1) {
			alert("bodyAttack:" + this._info.bodyAttack);
		}
		return this._info.bodyAttack != 0;
	}
	get _speed() {
		return this._info.speed;
	}
	get _pushed() {
		return this._info.pushed;
	}
	get _fs() {
		return this._info.fs;
	}
	get _category() {
		return this._info.category;
	}
	
	/**
	 * @param {World} world
	 * @returns {void}
	 */
	_create(world) {
		super._create(world);
		
		this.setPosition(this.chara.x / $gv.CANVAS_SCALE, this.chara.y / $gv.CANVAS_SCALE, true);
		
		this._appleMobCategory(this._category);
	}
	_appleMobCategory(category) {
		switch (category) {
			case 1:
			case 6:
				this.__setAsWalkOnlyMob();
				break;
			case 8:
				this.__setAsJumpDropMob();
				break;
			default:
				this.__setAsWalkOnlyMob();
				break;
		}
		this.chara.front = this.chara.spawn.f ? 1:-1;
	}
	__setAsWalkOnlyMob() {
		const ground = this.body.GetWorld().ground;
		
		const fhId = this.chara.spawn.fh;
		
		if (fhId >= 0) {
			let fh = ground.footholds[fhId];

			this.activityRegion = ground.rectChains[fh.chain];
		}
	}
	__setAsJumpDropMob() {
	}
	
	isCanMove() {
		return !(this._info.ignoreMoveImpact || this.movement_omega == 0 || this._info.noFlip);
	}
	
	/** @override */
	control() {
		if (this.isCanMove()) {
			switch (this._category) {
				case 1:
				case 6:
					this._control_basic(false);
					break;
				case 8:
					this._control_basic(true);
					break;
				default:
					this._control_basic(false);
					break;
			}
			
			//this.ikey["jump"] = 0;
			//this.ikey["left"] = 0;
			//this.ikey["right"] = 0;

			super.control(this.ikey);
		}
	}
	_control_basic(isAllowJump) {
		if (this.action) {
			if (this.action.isEnd(this)) {
				let actions = this.actions.filter(act => act.isValid(this));
				let next = Math.trunc(Math.random() * 100) % actions.length;

				this.action = actions[next];

				if (!this.action) {
					debugger;
				}

				this.action.init();

				//console.log("mob: " + this.action.name);
			}
			else {
			}

			this.action.update(this);
		}
	}
	
	Step() {		
		super.Step();
		
		this.control();
		
		let rx0, rx1, limit_action;
		
		if (this.attackTarget && this.activityRegion) {
			rx0 = this.activityRegion.left;
			rx1 = this.activityRegion.right;
			limit_action = true;
		}
		else if (!this._enable_rx) {
			rx0 = this.chara.spawn.rx0;
			rx1 = this.chara.spawn.rx1;
			limit_action = false;
		}
		
		if (limit_action) {
			const cbpos = this.body.GetPosition();
			const x = cbpos.x * $gv.CANVAS_SCALE;
			const y = cbpos.y * $gv.CANVAS_SCALE;
			const dx0 = rx0 - x;
			const dx1 = x - rx1;
			
			if (dx0 > 0) {
				const fwpos = this.foot_walk.GetPosition();
				this.body.SetPositionXY(rx0 / $gv.CANVAS_SCALE, cbpos.y);
				this.foot_walk.SetPositionXY(rx0 / $gv.CANVAS_SCALE, fwpos.y);
			}
			else if (dx1 > 0) {
				const fwpos = this.foot_walk.GetPosition();
				this.body.SetPositionXY(rx1 / $gv.CANVAS_SCALE, cbpos.y);
				this.foot_walk.SetPositionXY(rx1 / $gv.CANVAS_SCALE, fwpos.y);

				if (!this.attackTarget) {
					this.state.front *= -1;
				}
			}
		}
	}
	PostStep() {
		super.PostStep();
		
		const pos = this.getPosition();
		const x = pos.x * $gv.CANVAS_SCALE;
		const y = pos.y * $gv.CANVAS_SCALE;
		
		this.chara.x = x;
		this.chara.y = y;
		
		if (!this._info.noFlip) {
			this.chara.front = -this.state.front;
		}
	}
}

