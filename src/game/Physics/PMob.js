
import box2d from "box2d-html5";

import { PRemoteCharacter } from "./PPlayer.js";


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
		if (mapMob) {
			if (mapMob.renderer.isFlyMob()) {
				this.setMovementSpeed(this._info.flySpeed);
			}
			else {
				this.setMovementSpeed(this._info.speed);
			}
		}
		
		/** @type {Rectangle} - false if no use */
		this.activityRegion = null;
		
		this.$debugControl = false;
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
			let ikey;
		
			switch (this._category) {
				case 1:
				case 6:
					ikey = this._control_basic(false);
					break;
				case 8:
					ikey = this._control_basic(true);
					break;
				default:
					ikey = this._control_basic(false);
					break;
			}
			
			//ikey["C"] = 0;
			//ikey["left"] = 0;
			//ikey["right"] = 0;
			
			super.control(ikey);
		}
	}
	_control_basic(isAllowJump) {
		const cr = 0.01
		let rand = Math.random();
		let rw = 1 + Math.random() * 3 + Math.random() * 6;
		let ikey = {};
		
		let low = (1 / (60 * rw));
		let upp = 0.9;//1 - low;
		let mid = 0.5 + Math.random() * 0.001;
		
		if (!this.state.jump) {
			if (rand < low && isAllowJump) {
				ikey["C"] = 1;
			}
			else if (rand >= low && rand < upp) {
				let front = this.state.front;
				//if (rand >= mid && rand <= (mid + low * 0.5)) {
				if (rand < (low * 2)) {
					front *= -1;
					//console.log("front: " + this.state.front);
				}
				if (front < 0) {
					ikey["left"] = 1;
					ikey["right"] = 0;
					//console.log("left");
				}
				else {
					ikey["left"] = 0;
					ikey["right"] = 1;
					//console.log("right");
				}
			}
		}
		else {
			// no thing
			ikey["C"] = 0;
			ikey["left"] = 0;
			ikey["right"] = 0;
		}
		return ikey;
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

