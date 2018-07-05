
import {
	PFilterHelper,
	b2_linearSleepTolerance,
	b2Vec2,
	b2BodyType, b2BodyDef, b2FixtureDef,
	b2Body, b2Fixture,
	b2PolygonShape, b2CircleShape,
	b2WheelJointDef, b2RevoluteJointDef, b2MouseJointDef,
	b2Joint, b2RevoluteJoint, b2MouseJoint,
	b2Contact,
} from "./Physics.js";

import { Foothold } from "./Foothold.js";

import { World } from "./World.js";

import { CharacterMoveElem } from "../../Client/PMovePath.js";
import { SceneObject } from "../SceneObject.js";

import { SceneMap } from "../Map.js";


const DEGTORAD = Math.PI / 180;

/**
 * physics profile
 */
const chara_profile = {
	width: 25 / $gv.CANVAS_SCALE,
	height: 48 / $gv.CANVAS_SCALE,
	density: 1,
	get foot_width() {
		return (chara_profile.width * 0.5);
	},
	get foot_j_width() {
		return (chara_profile.width * 0.4);
	},
};

(function () {
	const jumpSpeed = 555;//??
	const fallSpeed = 670;//px/s
	const walkSpeed = 125;//px/s
	
	window.JUMP_FORCE = jumpSpeed;
	window.MOVEMENT_VELOCITY = walkSpeed / $gv.CANVAS_SCALE;

	window.PLAYER_USE_WHEEL_WALKER = false;

	window.FOOT_FRICTION = 1;

	window.MOVEMENT_POWER = 140000;
	window.MOVEMENT_STOP_POWER = 140000;

	window.PORTAL_COOLDOWN = 1000;
})();


export class PPlayerState {
	constructor() {
		this.jump = true;

		/** @type {boolean} - ApplyForce(jump_force) until leave foothold */
		this._begin_jump = false;

		///** @type {0|1|2} noJump(0), Jumping(1), Falling(2) */
		//this.jumpState = true;
		this._drop = true;
		this.walk = false;

		this.prone = false;

		this.dropDown = false;

		this._fly = false;//not jump 
		
		this.brake = true;//??
		
		/** @type {-1|1} */
		this.front = -1;

		/** @type {number} - 無敵時間，unit is millisecond */
		this.invincible = 0;

		/** @type {number} - knockback time，unit is millisecond */
		this.knockback = 0;

		/** @type {boolean} - off walker power */
		this.outOfControl = false;

		/** @type {boolean} - can not move or jump */
		this.freeze = false;

		/** @type {boolean} - can not move or jump */
		this.invokeSkill = false;

		/** @type {number} - use portal cooldown time，unit is millisecond */
		this.portal_cooldown = 0;
	}
}

/**
 * @param {number} jump_height
 * @param {b2Vec2} gravity
 */
function _CalcJumpImpulse(jump_height, gravity) {
	let impulse = Math.sqrt(jump_height * 2.0 * Math.abs(gravity.y));
	//(impulse = m * v) => (F = ∫ Mass * dVel)
	return impulse;
}


class ControlKeys {
	constructor() {
		this.up = 0;
		this.left = 0;
		this.down = 0;
		this.right = 0;
		this.jump = 0;
		this.enterPortal = 0;//TODO: key: enterPortal
	}
}


class PCharacterBase {
	constructor() {
		/** @type {boolean} */
		this.disable = false;

		this.chara_profile = Object.assign({}, chara_profile);
		
		this.setMovementSpeed(100);

		/** @type {b2Body} */
		this.body = null;

		/** @type {b2Body} */
		this.foot_walk = null;

		/** @type {b2Joint|b2RevoluteJoint} */
		this.walker = null;

		/** @type {Foothold} - in World::Setp */
		this._foothold = null;

		/** @type {Foothold} */
		this.$foothold = null;

		/**
		 * where foothold chara dropDown
		 * @type {Foothold}
		 */
		this.prev_$fh = null;

		/** @type {{ x:number, y:number }} in World::Setp */
		this._foot_at = new b2Vec2();

		/**
		 * no contact leave_$fh
		 * @type {Foothold}
		 */
		this.leave_$fh = null;
		
		/** @type {MapPortal} */
		this.portal = null;

		/** @type {number} */
		this._walker_omega = 1;

		/** @type {number} */
		this.jump_force = JUMP_FORCE;

		this.state = new PPlayerState();
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 * @param {boolean} clearForce
	 */
	setPosition(x, y, clearForce) {
		const by = y - this.chara_profile.foot_width - this.chara_profile.height * 0.75 * 0.5;
		const fy = y - this.chara_profile.foot_width;

		this.body.SetPositionXY(x, by);

		try {
			if (this.foot_center)
				this.foot_center.SetPositionXY(x, fy);

			if (this.foot_walk)
				this.foot_walk.SetPositionXY(x, fy);

			if (clearForce) {
				const speed = new b2Vec2(0, 0);
				this.body.ConstantVelocity(speed);
				if (this.foot_center)
					this.foot_center.ConstantVelocity(speed);
				if (this.foot_walk)
					this.foot_walk.ConstantVelocity(speed);
			}
		}
		catch (ex) {
		}
	}
	
	/**
	 * get bottom position
	 * @returns {{x: number, y: number}}
	 */
	getPosition() {
		const pos = this.foot_walk.GetPosition();
		return new b2Vec2(pos.x, pos.y + this.chara_profile.foot_width);
	}

	/**
	 * from.tn(hp00_1) == to.pn(hp00_1) && from.pn(hp00) == to.tn(hp00)
	 * @param {MapPortal} portal
	 * @returns {boolean} true if enter portal
	 */
	_usePortal(portal) {
		if (!portal.enable || this.state.portal_cooldown > 0) {
			return false;
		}
		/** @type {SceneMap} */
		const mapRenderer = portal.mapRenderer;

		const mapController = mapRenderer.controller;
		
		const map_id = portal.getMap();
		
		if (portal.exeScript) {//TODO: portal script
			portal.exeScript(this);
		}
		else if (map_id) {
			if (map_id == mapRenderer.map_id) {
				const reg = portal.tn.match(/(^[a-z_]+)(\d+$)/) || portal.tn.match(/(^[a-z]+)\d+_\d+$/);//pn?tn?
				const cmd = reg[1];

				if (cmd == "hp") {
					let fromTn = portal.tn;
					let toPortal = mapRenderer.portalMgr.portals.find(function (toPortal) {
						return fromTn == toPortal.pn;
					});
					this._gotoPortal(toPortal);
				}
				else if (cmd == "pt_go") {
					debugger;//??

					const tpid = parseInt(reg[2], 10);
					const tp = mapRenderer.portalMgr.portals[tpid];

					this._gotoPortal(tp);
				}
				else {
					console.log(`portal.pn: ${portal.pn}, portal.tn: ${portal.tn}, %o`, portal);
					return false;
				}
			}
			else {
				mapController.doAfterStep(function () {
					mapRenderer.unload();
					mapRenderer.load(map_id);
				});
			}
		}
		else {
			console.log("portal: $o", portal);
			return false;
		}
		this.state.portal_cooldown = PORTAL_COOLDOWN;//防止重複
		return true;
	}
	/**
	 * @param {MapPortal} portal
	 */
	_gotoPortal(portal) {
		/** @type {SceneMap} */
		const mapRenderer = portal.mapRenderer;
		const mapController = mapRenderer.controller;

		//not in world.Step
		mapController.doAfterStep(() => {
			const x = portal.x / $gv.CANVAS_SCALE;
			const y = (portal.y - 3) / $gv.CANVAS_SCALE;//adj portal pos
			this.setPosition(x, y, true);
		});
	}
	actionJump() {
		this.state._begin_jump = true;
	}
	//actionWalk(front) {
	//}
	actionDropdown() {
		this.leave_$fh = this.$foothold;
		this.$foothold = null;
		this.state.dropDown = true;
		this.body.SetAwake(true);
	}
	
	/**
	 * @param {Partial<ControlKeys>} keys
	 */
	control(keys) {
		if (!this._isCanMove()) {
			return;
		}
		if (this.state.outOfControl) {
			this.walker.EnableMotor(false);
			return;
		}
		else {
			this.walker.EnableMotor(true);
		}

		if (this.portal && keys.up) {
			//TODO: enter portal key: keys.enterPortal
			debugger;
			let portal = this.portal;
			if (this._usePortal(portal)) {
				this.portal = null;//使用完畢
				return;
			}
		}
		
		const wheel_sp = this._walker_omega;
		const velocity = this.body.GetLinearVelocity();//foot_walk

		if (!this.state.jump && !this.state.dropDown) {
			//dropDown
			if (keys.down && keys.jump) {
				this.actionDropdown();
				return;
			}

			//趴下
			if (keys.down) {
				this.state.prone = true;
				return;
			}
			else {
				this.state.prone = false;
			}
		}
		else {
			this.state.prone = false;
		}
		
		if (keys.left) {
			this.state.walk = true;
			this.state.front = -1;
			this.walker.SetMotorSpeed(-wheel_sp);
			this.walker.SetMaxMotorTorque(MOVEMENT_POWER);
			//this.walker.EnableMotor(true);//power on
		}
		else if (keys.right) {
			this.state.walk = true;
			this.state.front = 1;
			this.walker.SetMotorSpeed(wheel_sp);
			this.walker.SetMaxMotorTorque(MOVEMENT_POWER);
			//this.walker.EnableMotor(true);//power on
		}
		else {
			this.state.walk = false;

			if (!this.state.jump) {
				this.walker.SetMotorSpeed(0);//stop motor
			}
			else {
				this.walker.SetMotorSpeed(0);//stop motor
			}
			this.walker.SetMaxMotorTorque(MOVEMENT_STOP_POWER);
			//this.walker.EnableMotor(false);//power off
		}

		if (keys.jump && this._isCanJump()) {
			this.actionJump();
		}
	}

	_isCanJump() {
		return !this.state.jump && !this.isDrop();
	}

	_isCanMove() {
		return !this.state.freeze && !this.state.invokeSkill;
	}

	/**
	 * @param {number} increment_percent - increment_percent >= -100
	 */
	setMovementSpeed(increment_percent) {
		if (!(Number.isSafeInteger(increment_percent) || (!Number.isNaN(increment_percent) && Number.isFinite(increment_percent)))) {
			debugger
			if (process.env.NODE_ENV !== '') {
				throw new TypeError("increment_percent must is number");
			}
		}
		
		let scale = (100 + increment_percent) / 100;
		if (scale > 0) {
			this._setWalkerOmegaFromVelocity(MOVEMENT_VELOCITY * scale);
		}
		else {
			this._setWalkerOmegaFromVelocity(0);
		}
	}
	/**
	 * @param {number} speed - speed = pixel / second
	 */
	setMovementSpeedPixel(speed) {
		let v = speed / $gv.CANVAS_SCALE;
		if (v > 0) {
			this._walker_omega = v;
		}
		else {
			this._walker_omega = 0;
		}
	}
	_setWalkerOmegaFromVelocity(movement_velocity) {
		this._walker_omega = movement_velocity / (Math.PI * this.chara_profile.width) * Math.PI;
	}

	/**
	 * @param {number} increment_percent - increment_percent >= -100
	 */
	setjumpForce(increment_percent) {
		if (!(Number.isSafeInteger(increment_percent) || (!Number.isNaN(increment_percent) && Number.isFinite(increment_percent)))) {
			debugger
			throw new TypeError("increment_percent must is number");
		}

		let scale = (100 + increment_percent) / 100;
		if (scale <= 0) {
			this.jump_force = 0;
		}
		else {
			const gravity = this.body.GetWorld().GetGravity();
			this.jump_force = JUMP_FORCE * scale;
		}
	}

	/**
	 * @returns {number}
	 */
	_getMass() {
		return this.body.GetMass() + this.foot_walk.GetMass();
	}

	/**
	 * @param {number} s
	 */
	setGravityScale(s) {
		this.body.SetGravityScale(s);
		this.foot_walk.SetGravityScale(s);
	}

	/**
	 * @param {World} world
	 * @returns {void}
	 */
	_create(world) {
		let first_pos = new b2Vec2(1 / $gv.CANVAS_SCALE, -2 / $gv.CANVAS_SCALE);
		let bdef = new b2BodyDef();
		let fdef = new b2FixtureDef();
		let shape = new b2PolygonShape();

		fdef.filter.loadPreset("default");

		bdef.type = (b2BodyType.b2_dynamicBody);//b2_dynamicBody//b2_staticBody//b2_kinematicBody
		bdef.bullet = true;//get real contact point
		bdef.position.Set(first_pos.x, first_pos.y);
		bdef.userData = this;

		fdef.userData = this;

		//create body
		{
			this.body = world.CreateBody(bdef);
			this.body.SetFixedRotation(true);
		}
		this.body.$type = "player";

		let jmp_body_pos_y = first_pos.y + this.chara_profile.height * 0.75 * 0.5;

		fdef.filter.maskBits = 0;

		//head
		{
			shape.SetAsBox(
				this.chara_profile.width * 0.5,
				this.chara_profile.height * 0.75 * 0.5,
				new b2Vec2(0, 0),
				0);

			fdef.density = this.chara_profile.density;
			fdef.friction = FOOT_FRICTION;
			fdef.restitution = 0;
			fdef.shape = (shape);
			//
			this.fixture = this.body.CreateFixture(fdef);
			this.fixture.$type = "player";
		}
		fdef.filter.loadPreset("default");

		//create walker
		{
			//bdef.type = (b2BodyType.b2_dynamicBody);//b2_dynamicBody//b2_staticBody//b2_kinematicBody
			bdef.position.Set(first_pos.x, jmp_body_pos_y);
			this.foot_walk = world.CreateBody(bdef);

			let circle = new b2CircleShape();
			circle.m_p.Set(0, 0);
			circle.m_radius = this.chara_profile.foot_width;
			fdef.shape = circle;
			fdef.density = this.chara_profile.density;
			//fdef.filter = world.getFilterDefine("pl_ft_walk");
			fdef.friction = FOOT_FRICTION;//walk
			fdef.restitution = 0;
			let fixture = this.foot_walk.CreateFixture(fdef);
			fixture.$type = "pl_ft_walk";

			this._set_foot_listener(fixture);
		}
		this.foot_walk.$type = "pl_ft_walk";

		//j2
		{
			let jd;

			if (PLAYER_USE_WHEEL_WALKER) {
				jd = new b2WheelJointDef();//b2WheelJointDef//b2RevoluteJointDef
			}
			else {
				jd = new b2RevoluteJointDef();//b2WheelJointDef//b2RevoluteJointDef
			}

			if (jd instanceof b2RevoluteJointDef) {
				jd.Initialize(this.body, this.foot_walk, new b2Vec2(first_pos.x, jmp_body_pos_y));
			}
			if (jd instanceof b2WheelJointDef) {
				jd.Initialize(this.body, this.foot_walk, new b2Vec2(first_pos.x, jmp_body_pos_y), new b2Vec2(0, -1));
			}
			jd.enableMotor = true;
			jd.maxMotorTorque = MOVEMENT_POWER;
			//jd.motorSpeed = 40;
			if (jd instanceof b2RevoluteJointDef) {
				jd.enableLimit = false;
				jd.lowerAngle = 0 * DEGTORAD;
				jd.upperAngle = -0 * DEGTORAD;
				jd.referenceAngle = 0;
			}
			if (jd instanceof b2WheelJointDef) {
				jd.frequencyHz = 10;//springs
				jd.dampingRatio = 1;//springs
			}
			this.walker = world.CreateJoint(jd);
		}
		
		this.body.addStep(this.Step.bind(this));
		this.body.addAfterStep(this.AfterStep.bind(this));
		
		this.setMovementSpeed(0);
		this.setjumpForce(0);
	}
	
	/**
	 * destroy this
	 * @param {World} world
	 * @returns {void}
	 */
	_destroy(world) {
		if (this.body) {
			world.DestroyBody(this.body);
			this.body = null;
		}
		else {
			console.log("this already dead");
		}
		if (this.foot_center) {
			world.DestroyBody(this.foot_center);
			this.foot_center = null;
		}
		if (this.foot_walk) {
			world.DestroyBody(this.foot_walk);
			this.foot_walk = null;
		}
	}

	/**
	 * @param {b2Fixture} fa - self
	 * @param {b2Fixture} fb - other
	 * @returns {boolean}
	 */
	_isFromSelfContact(fa, fb) {
		let a = fa.GetBody().GetUserData();	// A data
		let b = fb.GetBody().GetUserData();	// B data

		if (a && b && a.body && b.body && a.body == b.body) {
			return true;
		}

		return false;
	}

	/**
	 * @param {b2Contact} contact
	 * @param {b2Fixture} fa - self
	 * @param {b2Fixture} fb - other
	 * @returns {boolean} - return true if from self and disable this contact
	 */
	_ignoreSelfContact(contact, fa, fb) {
		if (this._isFromSelfContact(fa, fb)) {
			contact.SetEnabled(false);
			return true;
		}
		return false;
	}
	
	_set_foot_listener(foot_fixture) {
		foot_fixture.beginContact = this.__beginContact_walker;
		foot_fixture.endContact = this.__endContact_walker;
		foot_fixture.preSolve = this.__preSolve_walker;
	}
	
	__beginContact_walker(contact, fa, fb) {
		if (this._ignoreSelfContact(contact, fa, fb)) {
			return;
		}
		let target = fb.GetUserData();
		if (target) {
			switch (target.constructor.name) {
				case "MapPortal":
					this._beginContactPortal(target);
					break;
			}
		}
	}
	__endContact_walker(contact, fa, fb) {
		if (this._ignoreSelfContact(contact, fa, fb)) {
			return;
		}
		let target = fb.GetUserData();
		if (target) {
			switch (target.constructor.name) {
				case "MapPortal":
					this._endContactPortal(target);
					break;
			}
		}
	}
	__preSolve_walker(contact, oldManifold, fa, fb) {
		if (this._ignoreSelfContact(contact, fa, fb)) {
			return;
		}
		if (fa.$type == "pl_ft_walk" && fb.$type == "pl_ft_walk") {
			contact.SetEnabled(false);
			return;
		}
	}
	
	/** @param {MapPortal} portal */
	_beginContactPortal(portal) {
		this.portal = portal;
		
		if (portal.script) {
			console.log("goto map: " + portal.getMap() + "; " + portal.script);
		}
		else {
			console.log("goto map: " + portal.getMap());
		}
	}
	
	/** @param {MapPortal} portal */
	_endContactPortal(portal) {
		if (this.portal == portal) {
			this.portal = null;
		}
	}

	_which_foothold_contact(foothold, foot_at) {
		if (this.$foothold != foothold && !this.state._drop) {
			// 接觸多個 foothold 以 "下面" 的為主，上坡時以 "下(上)一個" 為主；忽略連續 foothold 重疊的點
			if (this._foot_at && foot_at.y < this._foot_at.y) {
				if (this.$foothold) {
					if ((this.$foothold.prev == foothold.id && foothold.y1 < this.$foothold.y1) ||
						(this.$foothold.next == foothold.id && foothold.y2 < this.$foothold.y2)) {
					}
					else {
						return false;
					}
				}
				else {
					return false;
				}
			}
		}
		this._foothold = foothold;
		this._foot_at = foot_at.Clone();
		return true;
	}

	/**
	 * @returns {boolean}
	 */
	isDrop() {
		return this.state.dropDown || this.state._drop;
	}

	_endContactFoothold() {
		for (let i = 0; i < this._endContactFootholdList.length; ++i) {
			let fh = this._endContactFootholdList[i];

			if (fh == this._$fallEdge) {
				this._$fallEdge = null;
			}
			else if (fh == this._foothold) {
				this._foothold = null;
				this._foot_at = null;
			}
			//else if (fh.id == this._foothold.id) {
			//	this._foothold = null;
			//	this._foot_at = null;
			//}

			if (this.$foothold && fh == this.$foothold) {
				this.prev_$fh = this.$foothold;
				this.$foothold = null;
			}
			if (this.leave_$fh && this.leave_$fh == fh) {
				this.leave_$fh = null;
			}
		}
		this._endContactFootholdList.length = 0;//clear
	}

	/**
	 * before world::step
	 * @param {number} stamp
	 */
	Step(stamp) {
		if (this.state._begin_jump) {
			const mass = this._getMass();
			const force = new b2Vec2(0, -mass * this.jump_force);
			this.body.ApplyForceToCenter(force);
		}
		this.state._drop = false;
		this._foothold = null;
		this._foot_at = null;

		if (this.state.knockback > 0) {
			this.state.knockback -= stamp;

			if (this.state.knockback > 0) {
				this.state.outOfControl = true;
				this.walker.EnableMotor(false);
			}
			else {
				this.state.knockback = 0;
				this.state.outOfControl = false;
				this.walker.EnableMotor(true);
			}
		}
		if (this.state.invincible > 0) {
			this.state.invincible -= stamp;
			if (this.state.invincible > 0) {
			}
			else {
				this.state.invincible = 0;
			}
		}
		if (this.state.portal_cooldown) {
			this.state.portal_cooldown -= stamp;
			if (this.state.portal_cooldown > 0) {
			}
			else {
				this.state.portal_cooldown = 0;
			}
		}
	}

	/**
	 * after world::step
	 */
	AfterStep() {
		//this._endContactFoothold();

		if (this.$foothold) {
			this.state.jump = false;
			if (this.$foothold == this._foothold) {
				//console.log("stable cantact");
				//debugger;
			}
		}
		else {
			this.state.jump = true;
			this.state._begin_jump = false;
			if (!this._foothold) {
			}
			else {
				//console.log("no stable cantact");
				//debugger;
			}
		}
		if (!this.state.dropDown) {
			if (this._foothold) {
				this.$foothold = this._foothold;
			}
		}
	}

	/**
	 * @returns {number}
	 */
	getLayer() {
		return this.$foothold ? this.$foothold.layer : (this.prev_$fh ? this.prev_$fh.layer : (this.leave_$fh ? this.leave_$fh : 5));
	}
}

class PCharacter extends PCharacterBase {
	constructor() {
		super(...arguments);

		/** @type {SceneCharacter} */
		this.chara = null;
	}

	/**
	 * need set this.state.outOfControl = true
	 * @param {number} moveX - unit is pixel
	 * @param {number} moveY - unit is pixel
	 */
	forceMove(moveX, moveY) {
		//TODO: calc move
		const mass = this._getMass();
		const move = new b2Vec2(moveX * mass, moveY * mass);
		this.body.ApplyLinearImpulseToCenter(move);
	}

	/**
	 * @param {number} moveX - unit is pixel
	 * @param {number} moveY - unit is pixel
	 * @param {number} [kbTime=1000] - knockback time, unit is millisecond
	 */
	knockback(moveX, moveY, kbTime = 1000) {
		const front = this.state.front;
		let fx, fy;
		
		fx = -moveX * front;
		//fy = this.state.jump ? moveY : -moveY;
		fy = -moveY;

		this.forceMove(fx, fy);
		this.state.knockback = kbTime;
		this.state.outOfControl = true;
	}

	/**
	 * @param {World} world
	 */
	_create_anchor(world) {
		let md = new b2MouseJointDef();
		md.bodyA = world.ground.bodies[0];
		md.bodyB = this.body;
		md.target.Copy(this.getPosition());
		md.maxForce = 1000 * this._getMass();
		return world.CreateJoint(md);
	}

	/**
	 * no anchor
	 * experimental
	 * @param {CharacterMoveElem} moveElem
	 */
	moveTo(moveElem) {
		const body = this.body;

		if (moveElem.elapsed == 0) {
			body.ConstantVelocityWorldCenter2(vx, vy);
		}
		else {
			const ALPHA = 0.7;
			const ONE_MINUS_ALPHA = 1 - ALPHA;
			let dx = moveElem.x - pos.x;
			let dy = moveElem.y - pos.y;
			let sx = dx / (moveElem.elapsed / $gv.FRAME_ELAPSED);//speed = pixel / second
			let sy = dy / (moveElem.elapsed / $gv.FRAME_ELAPSED);
			let oldVel = body.GetLinearVelocity();

			let vx, vy;

			if (moveElem.pState.jump) {
				this.setGravityScale(0);
			}
			else {
				this.setGravityScale(1);
				
				if (moveElem.pState.walk || sx) {
					this.walker.EnableMotor(false);//this.$physics.walker.IsMotorEnabled() == true
				}
				else {
					this.walker.EnableMotor(true);//keep stop
				}
			}

			if (sx) {
				if (moveElem.vx) {
					if (Math.sign(moveElem.vx) == Math.sign(sx)) {
						vx = oldVel.x * ONE_MINUS_ALPHA + moveElem.vx * ALPHA;
					}
					else {
						vx = oldVel.x * ONE_MINUS_ALPHA + sx * ALPHA;//修正座標
					}
				}
				else {
					vx = sx;//修正座標
				}
			}
			else {
				vx = 0;
			}

			if (sy) {
				if (moveElem.vy) {
					if (Math.sign(moveElem.vy) == Math.sign(sy)) {
						vy = oldVel.y * ONE_MINUS_ALPHA + moveElem.vy * ALPHA;
					}
					else {
						vy = oldVel.y * ONE_MINUS_ALPHA + sy * ALPHA;//修正座標
					}
				}
				else {
					vy = sy;//修正座標
				}
			}
			else {
				vy = 0;
			}

			body.ConstantVelocityWorldCenter2(vx, vy);
		}
	}
}

export class PPlayer extends PCharacter {
	constructor() {
		super(...arguments);
	}

	/**
	 * @param {World} world
	 * @returns {void}
	 */
	_create(world) {
		super._create(world);

		window.SCREEN_PRINTLN(() => "x", () => this.getPosition().x.toFixed(3) + " * " + $gv.CANVAS_SCALE + " = " + (this.getPosition().x * $gv.CANVAS_SCALE).toFixed(0));
		window.SCREEN_PRINTLN(() => "y", () => this.getPosition().y.toFixed(3) + " * " + $gv.CANVAS_SCALE + " = " + (this.getPosition().y * $gv.CANVAS_SCALE).toFixed(0));
		window.SCREEN_PRINTLN(() => "jump", () => this.state.jump);
		window.SCREEN_PRINTLN(() => "_drop", () => this.state._drop);
		window.SCREEN_PRINTLN(() => "ddrop", () => this.state.dropDown);
		window.SCREEN_PRINTLN(() => "$fh", () => this.$foothold ? this.$foothold.id : null);
		window.SCREEN_PRINTLN(() => "$fh->c", () => this.$foothold ? this.$foothold.chain : null);
		window.SCREEN_PRINTLN(() => "_fh", () => this._foothold ? this._foothold.id : null);
		window.SCREEN_PRINTLN(() => "p$fh", () => this.prev_$fh ? this.prev_$fh.id : null);
		window.SCREEN_PRINTLN(() => "leave_$fh", () => this.leave_$fh ? this.leave_$fh.id : null);

		window.SCREEN_PRINTLN(() => "(jump && !$fh)", () => this.state.jump && !this.$foothold);

		window.SCREEN_PRINTLN(() => "vel.x", () => (this.body.m_linearVelocity.x * $gv.CANVAS_SCALE).toFixed(0));
		window.SCREEN_PRINTLN(() => "vel.y", () => (this.body.m_linearVelocity.y * $gv.CANVAS_SCALE).toFixed(0));
	}
	
	/**
	 * before world::step
	 * @param {number} stamp
	 */
	Step(stamp) {
		super.Step(stamp);
		
		if ($gv.input_keyDown['B'] == 1 && !$gv.mouse_dl) {
			const px = $gv.m_viewRect.left + $gv.mouse_x;
			const py = $gv.m_viewRect.top + $gv.mouse_y;

			this.setPosition(px / $gv.CANVAS_SCALE, py / $gv.CANVAS_SCALE, true);
		}
		else if ($gv.input_keyDown['B'] > 0 && $gv.mouse_dl) {
			const center = $gv.m_viewRect.center;
			const px = $gv.m_viewRect.left + $gv.mouse_x - center.x;
			const py = $gv.m_viewRect.top + $gv.mouse_y - center.y;

			this.body.SetLinearVelocity(new b2Vec2(px / $gv.CANVAS_SCALE, py / $gv.CANVAS_SCALE));
			this.foot_walk.SetLinearVelocity(new b2Vec2(px / $gv.CANVAS_SCALE, py / $gv.CANVAS_SCALE));
		}
		else if ($gv.mouse_dm && $gv.mouse_dm % 12 == 1) {
			const px = $gv.m_viewRect.left + $gv.mouse_x;
			const py = $gv.m_viewRect.top + $gv.mouse_y;
			this.setPosition(px / $gv.CANVAS_SCALE, py / $gv.CANVAS_SCALE, true);
		}
	}

	get renderer() {
		debugger
		return this._$renderer;
	}
	set renderer(value) {
		this._$renderer = value;
	}
}

export class PRemoteCharacter extends PCharacter {
	constructor() {
		super(...arguments);

		/** @type {b2MouseJoint} */
		this._anchor = null;
	}

	/**
	 * @param {World} world
	 * @returns {void}
	 */
	_create(world) {
		super._create(world);

		if (window.$io) {
			this._anchor = this._create_anchor(world);
		}
		else {
			this.moveTo = super.moveTo;
		}
	}

	/**
	 * @param {CharacterMoveElem} moveElem
	 */
	moveTo(moveElem) {
		//if (this._anchor) {
			this._anchor.m_targetA.x = moveElem.x;
			this._anchor.m_targetA.y = moveElem.y;
		//}
		//else {
		//	super.moveTo(moveElem);
		//}
	}
}
