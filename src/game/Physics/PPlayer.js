
import box2d from "box2d-html5";

import { PBody, PFixture, PMouseJoint } from "./Physics.js"
import { Foothold } from "./Foothold.js";

import { CharacterMoveElem } from "../../Client/PMovePath.js"


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

	window.MIN_FRICTION = 0.05;
	window.MAX_FRICTION = 2;
	window.MOVEMENT_POWER = 140000;
	window.MOVEMENT_STOP_POWER = 140000;
})();


export class PPlayerState {
	constructor() {
		this.jump = true;
		///** @type {0|1|2} noJump(0), Jumping(1), Falling(2) */
		//this.jumpState = true;
		this._drop = true;
		this.walk = false;

		this.prone = false;

		this.dropDown = false;

		this._fly = false;//not jump 
		
		this.brake = true;
		
		/** @type {-1|1} */
		this.front = 1;
	}
}

/**
 * @param {number} jump_height
 * @param {box2d.b2Vec2} gravity
 */
function _CalcJumpImpulse(jump_height, gravity) {
	let impulse = Math.sqrt(jump_height * 2.0 * Math.abs(gravity.y));
	//(impulse = m * v) => (F = ∫ Mass * dVel)
	return impulse;
}

export class PEntityBase {
	constructor() {
		/** @type {boolean} */
		this.disable = false;

		this.chara_profile = Object.assign({}, chara_profile);
		
		this.setMovementSpeed(100);

		/** @type {PBody} */
		this.body = null;

		/** @type {PBody} */
		this.foot_walk = null;

		/** @type {box2d.b2Joint} */
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
		this._foot_at = new box2d.b2Vec2();

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
				const speed = new box2d.b2Vec2(0, 0);
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
		return new box2d.b2Vec2(pos.x, pos.y + this.chara_profile.foot_width);
	}

	/**
	 * @returns {boolean} true if enter portal
	 */
	_usePortal(portal) {
		if (!portal.enable) {
			return false;
		}
		const mapController = this.body.GetWorld();
		const mapRenderer = portal.mapRenderer;
		
		const map_id = portal.getMap();
		
		if (portal.exeScript) {
			portal.exeScript(this);
		}
		else if (map_id) {
			if (map_id == mapRenderer.map_id) {
				const reg = portal.tn.match(/(^[a-z_]+)(\d+$)/) || portal.tn.match(/(^[a-z]+)\d._(\d+$)/);//pn?tn?
				const cmd = reg[1];
				
				if (cmd == "pt_go" || cmd == "hp") {
					const tpid = parseInt(reg[2], 10);
					const tp = mapRenderer.portalMgr.portals[tpid];
					
					const x = tp.x / $gv.CANVAS_SCALE;
					const y = tp.y / $gv.CANVAS_SCALE;
					this.setPosition(x, y, true);
					
					return true;
				}
			}
			else {
				mapController.doAfterStep(function () {
					mapRenderer.load(map_id);
				});
				return true;
			}
		}
		return false;
	}
	actionGoPortal() {
		if (this.portal) {
		}
	}
	//actionJump() {
	//}
	//actionWalk(front) {
	//}
	actionDropdown() {
		this.leave_$fh = this.$foothold;
		this.$foothold = null;
		this.state.dropDown = true;
		this.body.SetAwake(true);
	}

	/**
	 * @param {{[x:string]:number}} keys
	 */
	control(keys) {
		if (this.portal && keys.up) {
			let portal = this.portal;
			if (this._usePortal(portal)) {
				this.portal = null;//使用完畢
				return;
			}
		}
		
		const wheel_sp = this.movement_omega;
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
				let vx = velocity.x;
				if (vx > 50 * box2d.b2_linearSlop) {
					this.walker.SetMotorSpeed(-vx * Math.PI / 2 / Math.PI / this.chara_profile.width / 2);
				}
				else if (vx < -50 * box2d.b2_linearSlop) {
					this.walker.SetMotorSpeed(-vx * Math.PI / 2 / Math.PI / this.chara_profile.width / 2);
				}
				else {
					this.walker.SetMotorSpeed(0);//stop motor
				}
			}
			else {
				this.walker.SetMotorSpeed(0);//stop motor
			}
			this.walker.SetMaxMotorTorque(MOVEMENT_STOP_POWER);
			//this.walker.EnableMotor(false);//power off
		}

		const jumpKey = keys.jump;
		if (!this.state.jump && !this.isDrop() && jumpKey) {
			const mass = this._getMass();
			const force = new box2d.b2Vec2(0, -mass * this.jump_force);
			this.body.ApplyForceToCenter(force);
		}
	}

	/**
	 * @param {number} speed - speed = pixel / second
	 */
	setMovementSpeedPixel(speed) {
		let v = speed / $gv.CANVAS_SCALE;
		if (v > 0) {
			this.movement_omega = v;
		}
		else {
			this.movement_omega = 0;
		}
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
			this.movement_omega = MOVEMENT_VELOCITY * scale;
		}
		else {
			this.movement_omega = 0;
		}
	}
	set movement_omega(movement_velocity) {
		this._walker_omega = movement_velocity / (Math.PI * this.chara_profile.width) * Math.PI;
	}
	get movement_omega() {
		return this._walker_omega;
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
		let first_pos = new box2d.b2Vec2(1 / $gv.CANVAS_SCALE, -2 / $gv.CANVAS_SCALE);
		let bdef = new box2d.b2BodyDef();
		let fdef = new box2d.b2FixtureDef();
		let shape = new box2d.b2PolygonShape();

		bdef.type = (box2d.b2BodyType.b2_dynamicBody);//box2d.b2_dynamicBody//b2_staticBody//b2_kinematicBody
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
			shape.SetAsOrientedBox(this.chara_profile.width * 0.5, this.chara_profile.height * 0.75 * 0.5,
				new box2d.b2Vec2(0, 0),
				0);

			fdef.density = this.chara_profile.density;
			fdef.friction = MAX_FRICTION;
			fdef.restitution = 0;
			fdef.shape = (shape);
			//
			this.fixture = this.body.CreateFixture(fdef);
			this.fixture.$type = "player";
		}
		fdef.filter.reset();

		//create walker
		{
			//bdef.type = (box2d.b2BodyType.b2_dynamicBody);//box2d.b2_dynamicBody//b2_staticBody//b2_kinematicBody
			bdef.position.Set(first_pos.x, jmp_body_pos_y);
			this.foot_walk = world.CreateBody(bdef);

			let circle = new box2d.b2CircleShape();
			circle.m_p.Set(0, 0);
			circle.m_radius = this.chara_profile.foot_width;
			fdef.shape = circle;
			fdef.density = this.chara_profile.density;
			//fdef.filter = world.getFilterDefine("pl_ft_walk");
			fdef.MAX_FRICTION = 1;//walk
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
				jd = new box2d.b2WheelJointDef();//b2WheelJointDef//b2RevoluteJointDef
			}
			else {
				jd = new box2d.b2RevoluteJointDef();//b2WheelJointDef//b2RevoluteJointDef
			}

			if (jd instanceof box2d.b2RevoluteJointDef) {
				jd.Initialize(this.body, this.foot_walk, new box2d.b2Vec2(first_pos.x, jmp_body_pos_y));
			}
			if (jd instanceof box2d.b2WheelJointDef) {
				jd.Initialize(this.body, this.foot_walk, new box2d.b2Vec2(first_pos.x, jmp_body_pos_y), new box2d.b2Vec2(0, -1));
			}
			jd.enableMotor = true;
			jd.maxMotorTorque = MOVEMENT_POWER;
			//jd.motorSpeed = 40;
			if (jd instanceof box2d.b2RevoluteJointDef) {
				jd.enableLimit = false;
				jd.lowerAngle = 0 * DEGTORAD;
				jd.upperAngle = -0 * DEGTORAD;
				jd.referenceAngle = 0;
			}
			if (jd instanceof box2d.b2WheelJointDef) {
				jd.frequencyHz = 10;//springs
				jd.dampingRatio = 1;//springs
			}
			this.walker = world.CreateJoint(jd);
		}
		
		this.body.Step = this.Step.bind(this);
		this.body.PostStep = this.PostStep.bind(this);
		
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
	
	_set_foot_listener(foot_fixture) {
		foot_fixture.beginContact = this.__beginContact_walker;
		foot_fixture.endContact = this.__endContact_walker;
		foot_fixture.preSolve = this.__preSolve_walker;
	}
	
	__beginContact_walker(contact, fa, fb) {
		if (contact._ignoreSelfContact(fa, fb)) {
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
		if (contact._ignoreSelfContact(fa, fb)) {
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
		if (contact._ignoreSelfContact(fa, fb)) {
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
			if (this._foot_at) {
				if (foot_at.y < this._foot_at.y) {
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

	/**
	 * before world::step
	 * @param {number} stamp
	 */
	Step(stamp) {
		this.state._drop = false;
		this._foothold = null;
		this._foot_at = null;
	}

	/**
	 * after world::step
	 */
	PostStep() {
		if (this.$foothold) {
			this.state.jump = false;
			if (this.$foothold == this._foothold) {
				//console.log("stable cantact");
				//debugger;
			}
		}
		else {
			this.state.jump = true;
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

export class PCharacterBase extends PEntityBase {
	constructor() {
		super(...arguments);
	}

	/**
	 * @param {World} world
	 */
	_create_anchor(world) {
		let md = new box2d.b2MouseJointDef();
		md.bodyA = world.ground.bodies[0];
		md.bodyB = this.body;
		md.target.Copy(this.getPosition());
		md.maxForce = 1000 * this._getMass();
		return world.CreateJoint(md);
	}

	/**
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

export class PPlayer extends PCharacterBase {
	constructor() {
		super(...arguments);
	}

	/**
	 * @param {World} world
	 * @returns {void}
	 */
	_create(world) {
		let that = this;

		super._create(world);

		window.SCREEN_PRINTLN(() => "x", () => that.getPosition().x.toFixed(3) + " * " + $gv.CANVAS_SCALE + " = " + (that.getPosition().x * $gv.CANVAS_SCALE).toFixed(0));
		window.SCREEN_PRINTLN(() => "y", () => that.getPosition().y.toFixed(3) + " * " + $gv.CANVAS_SCALE + " = " + (that.getPosition().y * $gv.CANVAS_SCALE).toFixed(0));
		window.SCREEN_PRINTLN(() => "jump", () => that.state.jump);
		window.SCREEN_PRINTLN(() => "_drop", () => that.state._drop);
		window.SCREEN_PRINTLN(() => "ddrop", () => that.state.dropDown);
		window.SCREEN_PRINTLN(() => "$fh", () => that.$foothold ? that.$foothold.id : null);
		window.SCREEN_PRINTLN(() => "$fh->c", () => that.$foothold ? that.$foothold.chain : null);
		window.SCREEN_PRINTLN(() => "_fh", () => that._foothold ? that._foothold.id : null);
		window.SCREEN_PRINTLN(() => "p$fh", () => that.prev_$fh ? that.prev_$fh.id : null);
		window.SCREEN_PRINTLN(() => "leave_$fh", () => that.leave_$fh ? that.leave_$fh.id : null);

		window.SCREEN_PRINTLN(() => "(jump && !$fh)", () => that.state.jump && !that.$foothold);

		window.SCREEN_PRINTLN(() => "velocity.x b", () => (that.body.m_linearVelocity.x * $gv.CANVAS_SCALE).toFixed(0));
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

			this.body.SetLinearVelocity(new box2d.b2Vec2(px / $gv.CANVAS_SCALE, py / $gv.CANVAS_SCALE));
			this.foot_walk.SetLinearVelocity(new box2d.b2Vec2(px / $gv.CANVAS_SCALE, py / $gv.CANVAS_SCALE));
		}
		else if ($gv.mouse_dm && $gv.mouse_dm % 12 == 1) {
			const px = $gv.m_viewRect.left + $gv.mouse_x;
			const py = $gv.m_viewRect.top + $gv.mouse_y;
			this.setPosition(px / $gv.CANVAS_SCALE, py / $gv.CANVAS_SCALE, true);
		}
	}
}

export class PRemoteCharacter extends PCharacterBase {
	constructor() {
		super(...arguments);

		/** @type {PMouseJoint} */
		this._anchor = null;
	}

	/**
	 * @param {World} world
	 * @returns {void}
	 */
	_create(world) {
		super._create(world);
		this._anchor = this._create_anchor(world);
	}

	/**
	 * @param {CharacterMoveElem} moveElem
	 */
	moveTo(moveElem) {
		this._anchor.SetTarget2(moveElem.x, moveElem.y);
	}
}
