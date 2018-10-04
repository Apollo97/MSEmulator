
import { PRemotePlayer, PPlayerBase } from "./PPlayer.js";

import { Animation } from "../Animation.js";
import { MobMoveElem } from "../../Client/PMovePath.js";


if (process.env.NODE_ENV !== 'production') {
	window.$MobAction_Stand_maxRepeat = 10;
	window.$MobAction_Move_maxRepeat = 10;
	window.$MobAction_Jump_maxRepeat = 10;
}


//window.$min_time = Infinity;
//window.$max_time = 0;


export class MobActionController {
	/**
	 * @param {Animation} animation
	 */
	constructor(animation) {
		/** @type {string} - ?? */
		this._name = null;

		/** @type {Animation} */
		this._ani = animation;

		this.is_end = false;
	}

	/** @type {number} - int */
	get maxRepeat() {
		if (process.env.NODE_ENV !== 'production') {
			let [maxRepeat = 1] = [window.$MobAction_Stand_maxRepeat];
			return maxRepeat;
		}
		else {
			return 10;
		}
	}

	/** reset */
	init() {
		this.is_end = false;
		this.repeat = 1;//Math.max(1, Math.ceil(Math.random() * this.maxRepeat));
		this._ani.reset();
	}

	/**
	 * @param {PMob} pMob
	 * @returns {boolean}
	 */
	isValid(pMob) {
		return true;
	}

	/**
	 * @virtual
	 * @param {PMob} pMob
	 */
	onUpdate(pMob) {
		throw new TypeError();
	}

	/**
	 * @virtual
	 * @param {PMob} pMob
	 */
	update(pMob) {
		this.onUpdate(pMob);
		
		let end = this._ani.isEnd();

		if (end) {
			this.repeat -= 1;

			if (this.repeat > 0) {
				//window.$min_time = Math.min(window.$min_time, this._ani.delta);
				//window.$max_time = Math.max(window.$max_time, this._ani.delta);
				this._ani.reset();
			}
			else {
				this.onEnd(pMob);
				this.is_end = true;
			}
		}
	}

	/**
	 * @param {PMob} pMob
	 */
	isEnd(pMob) {
		return this.is_end;
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
	 * @override
	 * @param {PMob} pMob
	 */
	onUpdate(pMob) {
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
	get maxRepeat() {
		if (process.env.NODE_ENV !== 'production') {
			let [maxRepeat = 1] = [window.$MobAction_Move_maxRepeat];
			return maxRepeat;
		}
		else {
			return 10;
		}
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
	 * @override
	 * @param {PMob} pMob
	 */
	onUpdate(pMob) {
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
	 * @override
	 * @param {PMob} pMob
	 */
	onUpdate(pMob) {
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
	get maxRepeat() {
		if (process.env.NODE_ENV !== 'production') {
			let [maxRepeat = 1] = [window.$MobAction_Jump_maxRepeat];
			return maxRepeat;
		}
		else {
			return 10;
		}
	}

	///** @override */
	//init() {
	//	super.init();
	//	//this.move = 1 || Math.random() > 0.5;
	//}

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
	 * @override
	 * @param {PMob} pMob
	 */
	onUpdate(pMob) {
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
	 * @override
	 * @param {PMob} pMob
	 */
	onUpdate(pMob) {
	}
}

export class PMob extends PPlayerBase {//PRemotePlayer
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
				this.setMovementSpeed(this._info.flySpeed || 100);
			}
			else {
				this.setMovementSpeed(this._info.speed || 100);
			}
		}

		/** @type {Rectangle} */
		this.activityRegion = null;

		//

		if (process.env.NODE_ENV !== 'production') {
			this.$debugControl = false;
		}

		//

		/** @type {MobActionController[]} */
		this.actions = [];

		//

		/** @type {MobActionController} */
		this.action = null;

		///** @type {number} */
		//this._actionId = null;
	}

	/**
	 * @param {number} actionId
	 */
	setAction(actionId) {
		//this._actionId = actionId;
		this.action = this.actions[actionId];

		if (!this.action) {
			debugger;
		}

		this.action.init();
	}

	/**
	 * @param {} param - ??
	 */
	__registerAction(param) {
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
					this.__registerAction(controller);
				}
			}
			else {
				console.warn("未完成 MobActionController: " + key);
			}
		});

		this.setAction(0);//set default
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
	 * @override
	 * @returns {string}
	 */
	get _body_category() {
		return "mob";
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
		return !(this._info.ignoreMoveImpact || this._walker_omega == 0 || this._info.noFlip);
	}
	
	/**
	 * renderer#action to physics#action
	 * @override
	 */
	control() {
		if (process.env.NODE_ENV !== 'production') {
			if (this.$debugControl) {
				this._basicControl(this.ikey);
				return;
			}
		}
		if (this.isCanMove()) {
			//??
			//switch (this._category) {
			//	case 1:
			//	case 6:
			//		this._control_random_action();
			//		break;
			//	case 8:
			//		this._control_random_action();
			//		break;
			//	default:
			//		this._control_random_action();
			//		break;
			//}

			this._control_random_action();

			this._basicControl(this.ikey);
		}
	}
	_control_random_action() {
		if (this.action) {
			if (this.action.isEnd(this)) {
				let actions = this.actions.filter(act => act.isValid(this));
				let next = Math.trunc(Math.random() * 100) % actions.length;
				//
				this.setAction(next);

				//console.log("mob: " + this.action.name);
			}
			else {
			}

			this.action.update(this);
		}
	}

	_control_basic_action() {
		this._basicControl(this.ikey);
	}

	stop() {
		const empty = {};
		this.ikey = empty;
		super.control(empty);
	}
	
	Step() {		
		super.Step();
		
		let rx0, rx1, limitAction;
		
		if (this.attackTarget && this.activityRegion) {
			rx0 = this.activityRegion.left + 1;
			rx1 = this.activityRegion.right - 1;
			limitAction = true;
		}
		else if (!this._enable_rx) {
			rx0 = this.chara.spawn.rx0 + 1;
			rx1 = this.chara.spawn.rx1 - 1;
			limitAction = false;
		}
		
		if (limitAction) {
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
	AfterStep() {
		super.AfterStep();
		
		const pos = this.getPosition();
		const x = pos.x * $gv.CANVAS_SCALE;
		const y = pos.y * $gv.CANVAS_SCALE;
		
		this.chara.x = x;
		this.chara.y = y;
		
		if (!this._info.noFlip) {
			this.chara.front = -this.state.front;
		}
	}

	///**
	// * @param {number} x
	// * @param {number} y
	// * @param {boolean} clearForce
	// */
	//setPosition(x, y, clearForce) {
	//	super.setPosition(x, y, clearForce);
	//	//if (window.$io) {
	//	//	const by = y - this.chara_profile.foot_width - this.chara_profile.height * 0.75 * 0.5;
	//	//	this._anchor.m_targetA.Set(x, by);
	//	//}
	//}

	///**
	// * @param {World} world
	// * @returns {void}
	// */
	//_create(world) {
	//	super._create(world);
	//}

	///**
	// * @param {CharacterMoveElem} moveElem
	// */
	//moveTo(moveElem) {
	//	this._anchor = this._create_anchor(world);
	//
	//	this.body.SetAwake(true);
	//	this.foot_walk.SetAwake(true);
	//
	//	this._anchor.m_targetA.Set(moveElem.x, moveElem.y);
	//
	//	super.moveTo(moveElem);
	//}
}

