
import box2d from "box2d-html5";


export class ContactListener /** @extends box2d.b2ContactListener */ {
	BeginContact(/** @param {box2d.b2Contact} contact */contact) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa._invokeBeginContact(contact, fa, fb);
		fb._invokeBeginContact(contact, fb, fa);
	}
	EndContact(/** @param b2Contact */contact) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa._invokeEndContact(contact, fa, fb);
		fb._invokeEndContact(contact, fb, fa);
	}
	PreSolve(/*b2Contact */contact, /*b2Manifold */oldManifold) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa._invokePreSolve(contact, oldManifold, fa, fb);
		fb._invokePreSolve(contact, oldManifold, fb, fa);
	}
	PostSolve(/*b2Contact */contact, /*b2ContactImpulse */impulse) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa._invokePostSolve(contact, impulse, fa, fb);
		fb._invokePostSolve(contact, impulse, fb, fa);
	}
}

/**
 * @param {box2d.b2Fixture} fa - self
 * @param {box2d.b2Fixture} fb - other
 * @returns {boolean}
 */
box2d.b2Contact.prototype.isFromSelfContact = function (fa, fb) {
	let a = fa.GetBody().GetUserData();	// A data
	let b = fb.GetBody().GetUserData();	// B data
	
	if (a && b && a.body && b.body && a.body == b.body) {
		return true;
	}

	return false;
}

/**
 * @param {box2d.b2Fixture} fa - self
 * @param {box2d.b2Fixture} fb - other
 * @returns {boolean} - return true if from self and disable this contact
 */
box2d.b2Contact.prototype._ignoreSelfContact = function (fa, fb) {
	if (this.isFromSelfContact(fa, fb)) {
		this.SetEnabled(false);
		return true;
	}
	return false;
}

export class PFilter extends box2d.b2Filter {
	constructor() {
		super(...arguments);
		this.reset();
	}

	noContact() {
		this.maskBits = 0;
	}

	reset() {
		this.groupIndex = 0;
		this.maskBits = 0xFFFFFFFF;//all
		this.categoryBits = 1;
	}

	/**
	 * get defined filter
	 */
	static getPreset(name) {
		if (name) {
			return new PFilter();
		}
		else {
			return new PFilter();
		}
	}
}
box2d.b2Filter = PFilter;

let b2Vec2_temp = new box2d.b2Vec2(0, 0)

export class PBody extends box2d.b2Body {
	constructor() {
		super(...arguments);
	}
	
	Step() {
	}
	PostStep() {
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	SetLinearVelocity2(x, y) {
		b2Vec2_temp.x = x;
		b2Vec2_temp.y = y;
		this.SetLinearVelocity(b2Vec2_temp);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	ApplyForce2(x, y) {
		b2Vec2_temp.x = x;
		b2Vec2_temp.y = y;
		this.ApplyForce(b2Vec2_temp);
	}

	/**
	 * '原速度'(sourceVel)快速加速到'指定速度'(desiredVel)
	 * @param {box2d.b2Vec2} desiredVel
	 * @param {box2d.b2Vec2} sourceVel
	 * @param {box2d.b2Vec2} point
	 */
	Acceleration(desiredVel, sourceVel, point) {
		if (point) {
			point = point;
			point.__proto__ = box2d.b2Vec2.prototype;
		}
		else {
			point = this.GetWorldCenter();
		}
		
		let velChange = box2d.b2SubVV(desiredVel, sourceVel, new box2d.b2Vec2());
		let m = this.GetMass();
		let ix = m * velChange.x;
		let iy = m * velChange.y;

		let impulse = new box2d.b2Vec2(ix, iy);
		this.ApplyLinearImpulse(impulse, point, true);
	}

	/**
	 * '原速度'(sourceVelX)快速加速到'指定速度'(desiredVel)
	 * @param {number} desiredVelX
	 * @param {box2d.b2Vec2} sourceVel
	 * @param {box2d.b2Vec2} point
	 * @description - set point.__proto__ = box2d.b2Vec2.prototype
	 */
	AccelerationX(desiredVelX, sourceVel, point) {
		point = point || this.GetWorldCenter();
		point.__proto__ = box2d.b2Vec2.prototype;

		let velChangeX = desiredVelX - sourceVel.x;
		let m = this.GetMass();
		let ix = m * velChangeX;

		let impulse = new box2d.b2Vec2(ix, 0);
		this.ApplyLinearImpulse(impulse, point, true);
	}

	/**
	 * '原速度'(sourceVelY)快速加速到'指定速度'(desiredVel)
	 * @param {number} desiredVelY
	 * @param {box2d.b2Vec2} sourceVel
	 * @param {box2d.b2Vec2} point
	 * @description - set point.__proto__ = box2d.b2Vec2.prototype
	 */
	AccelerationY(desiredVelY, sourceVel, point) {
		point = point || this.GetWorldCenter();
		point.__proto__ = box2d.b2Vec2.prototype;

		let velChangeY = desiredVelY - sourceVel.y;
		let m = this.GetMass();
		let iy = m * velChangeY;

		let impulse = new box2d.b2Vec2(0, iy);
		this.ApplyLinearImpulse(impulse, point, true);
	}

	/**
	 * 等速度運動
	 * @param {box2d.b2Vec2} desiredVel
	 * @param {box2d.b2Vec2} point
	 * @description - set point.__proto__ = box2d.b2Vec2.prototype
	 */
	ConstantVelocity(desiredVel, point) {
		this.Acceleration(desiredVel, this.GetLinearVelocity(), point || this.GetWorldCenter());
	}

	/**
	 * 等速度運動 X
	 * @param{number} desiredVelX
	 * @param{box2d.b2Vec2} point
	 * @description - set point.__proto__ = box2d.b2Vec2.prototype
	 */
	ConstantVelocityX(desiredVelX, point) {
		this.AccelerationX(desiredVelX, this.GetLinearVelocity(), point || this.GetWorldCenter());
	}

	/**
	 * 等速度運動 Y
	 * @param {number} desiredVelY
	 * @param {box2d.b2Vec2} point
	 * @description - set point.__proto__ = box2d.b2Vec2.prototype
	 */
	ConstantVelocityY(desiredVelY, point) {
		this.AccelerationY(desiredVelY, this.GetLinearVelocity(), point || this.GetWorldCenter());
	}
}
box2d.b2Body = PBody;

export class PFixture extends box2d.b2Fixture {
	//constructor() {
	//	super(...arguments);
	//}
	//beginContact(contact, fa, fb) {
	//}
	//endContact(contact, fa, fb) {
	//}
	//preSolve(contact, oldManifold, fa, fb) {
	//}
	//postSolve(contact, impulse, fa, fb) {
	//}
	constructor() {
		super(...arguments);

		/** @type {Array<function(box2d.b2Contact, box2d.b2Fixture, box2d.b2Fixture):void>} */
		this._beginContact = [];

		/** @type {Array<function(box2d.b2Contact, box2d.b2Fixture, box2d.b2Fixture):void>} */
		this._endContact = [];

		/** @type {Array<function(box2d.b2Contact, box2d.b2Manifold, box2d.b2Fixture, box2d.b2Fixture):void>} */
		this._preSolve = [];

		/** @type {Array<function(box2d.b2Contact, box2d.b2ContactImpulse, box2d.b2Fixture, box2d.b2Fixture):void>} */
		this._postSolve = [];
	}

	///**
	// * @returns {number}
	// */
	//getOwnerBodyID() {
	//	let host = this.GetUserData();
	//	if (host && 'owner' in host) {
	//		return host.owner.body.id;
	//	}
	//}

	/**
	 * @param {box2d.b2Contact} contact
	 */
	_invokeBeginContact(contact, fa, fb) {
		for (let i of this._beginContact) {
			i.call(this.m_userData, contact, fa, fb);
		}
	}
	/**
	 * @param {box2d.b2Contact} contact
	 */
	_invokeEndContact(contact, fa, fb) {
		for (let i of this._endContact) {
			i.call(this.m_userData, contact, fa, fb);
		}
	}
	/**
	 * @param {box2d.b2Contact} contact
	 * @param {box2d.b2Manifold} oldManifold
	 */
	_invokePreSolve(contact, oldManifold, fa, fb) {
		for (let i of this._preSolve) {
			i.call(this.m_userData, contact, oldManifold, fa, fb);
		}
	}
	/**
	 * @param {box2d.b2Contact} contact
	 * @param {box2d.b2ContactImpulse} impulse
	 */
	_invokePostSolve(contact, impulse, fa, fb) {
		for (let i of this._postSolve) {
			i.call(this.m_userData, contact, impulse, fa, fb);
		}
	}

	/** @type {function(box2d.b2Contact, box2d.b2Fixture, box2d.b2Fixture):void} */
	get beginContact() {
	}
	set beginContact(event) {
		if (typeof event == 'function')
			this._beginContact.push(event);
		else debugger
	}

	/** @type {function(box2d.b2Contact, box2d.b2Fixture, box2d.b2Fixture):void} */
	get endContact() {
	}
	set endContact(event) {
		if (typeof event == 'function')
			this._endContact.push(event);
		else debugger
	}

	/** @type {function(box2d.b2Contact, box2d.b2Manifold, box2d.b2Fixture, box2d.b2Fixture):void} */
	get preSolve() {
	}
	set preSolve(event) {
		if (typeof event == 'function')
			this._preSolve.push(event);
		else debugger
	}

	/** @type {function(box2d.b2Contact, box2d.b2ContactImpulse, box2d.b2Fixture, box2d.b2Fixture):void} */
	get postSolve() {
	}
	set postSolve(event) {
		if (typeof event == 'function')
			this._postSolve.push(event);
		else debugger
	}
}
box2d.b2Fixture = PFixture;

export class PMouseJoint extends box2d.b2MouseJoint {
	constructor() {
		super(...arguments);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	SetTarget2(x, y) {
		0 == this.m_bodyB.IsAwake() && this.m_bodyB.SetAwake(!0), this.m_targetA.x = x, this.m_targetA.y = y
	}
}
box2d.b2MouseJoint = PMouseJoint;
