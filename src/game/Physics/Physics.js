
const box2d = require("../../Box2D/build/Box2D/Box2D/Box2D.js");

const { FilterHelper } = require("./Filter.js");

const {
	b2Vec2,
	b2Body, b2Fixture,
	b2Contact, b2Manifold, b2ContactImpulse,
	b2ContactListener
} = box2d;


window.$box2d = box2d;

let b2Vec2_temp = new b2Vec2();

/** @type {string} */
b2Body.prototype.$type = null;

b2Body.prototype.Step = function (stamp) {
	if (this._on_step) {
		for (let fn of this._on_step) {
			fn(stamp);
		}
	}
}
b2Body.prototype.AfterStep = function (stamp) {
	if (this._on_after_step) {
		for (let fn of this._on_after_step) {
			fn(stamp);
		}
	}
}

/**
 * @param {function():void} func
 */
b2Body.prototype.addStep = function (func) {
	this._on_step = this._on_step || [];
	this._on_step.push(func);
}

/**
 * @param {function():void} func
 */
b2Body.prototype.addAfterStep = function (func) {
	this._on_after_step = this._on_after_step || [];
	this._on_after_step.push(func);
}

/**
 * @param {number} x
 * @param {number} y
 */
b2Body.prototype.SetLinearVelocity2 = function (x, y) {
	b2Vec2_temp.x = x;
	b2Vec2_temp.y = y;
	this.SetLinearVelocity(b2Vec2_temp, true);
}

/**
 * @param {number} x
 * @param {number} y
 */
b2Body.prototype.ApplyForceToCenter2 = function (x, y) {
	b2Vec2_temp.x = x;
	b2Vec2_temp.y = y;
	this.ApplyForceToCenter(b2Vec2_temp, true);
}

/**
 * @param {number} x
 * @param {number} y
 */
b2Body.prototype.ApplyLinearImpulseToCenter2 = function (x, y) {
	b2Vec2_temp.x = x;
	b2Vec2_temp.y = y;
	this.ApplyLinearImpulseToCenter(b2Vec2_temp, true);
}

/**
 * '原速度'(sourceVel)快速加速到'指定速度'(desiredVel)
 * @param {b2Vec2} desiredVel
 * @param {b2Vec2} sourceVel
 * @param {b2Vec2} point
 */
b2Body.prototype.Acceleration = function (desiredVel, sourceVel, point) {
	if (!point) {
		point = this.GetWorldCenter();
	}

	let velChange = b2Vec2.SubVV(desiredVel, sourceVel, b2Vec2_temp);
	let m = this.GetMass();
	let ix = m * velChange.x;
	let iy = m * velChange.y;

	let impulse = b2Vec2_temp.Set(ix, iy);
	this.ApplyLinearImpulse(impulse, point, true);
}

/**
 * '原速度'(sourceVelX)快速加速到'指定速度'(desiredVel)
 * @param {number} desiredVelX
 * @param {b2Vec2} sourceVel
 * @param {b2Vec2} point
 */
b2Body.prototype.AccelerationX = function (desiredVelX, sourceVel, point) {
	if (!point) {
		point = this.GetWorldCenter();
	}

	let velChangeX = desiredVelX - sourceVel.x;
	let m = this.GetMass();
	let ix = m * velChangeX;

	let impulse = b2Vec2_temp.Set(ix, 0);
	this.ApplyLinearImpulse(impulse, point, true);
}

/**
 * '原速度'(sourceVelY)快速加速到'指定速度'(desiredVel)
 * @param {number} desiredVelY
 * @param {b2Vec2} sourceVel
 * @param {b2Vec2} point
 */
b2Body.prototype.AccelerationY = function (desiredVelY, sourceVel, point) {
	if (!point) {
		point = this.GetWorldCenter();
	}

	let velChangeY = desiredVelY - sourceVel.y;
	let m = this.GetMass();
	let iy = m * velChangeY;

	let impulse = b2Vec2_temp.Set(0, iy);
	this.ApplyLinearImpulse(impulse, point, true);
}

/**
 * 等速度運動
 * @param {b2Vec2} desiredVel
 * @param {b2Vec2} point
 */
b2Body.prototype.ConstantVelocity = function (desiredVel, point) {
	this.Acceleration(desiredVel, this.GetLinearVelocity(), point || this.GetWorldCenter());
}

/**
 * @param {number} desiredVelX
 * @param {number} desiredVelY
 * @param {number} pointX
 * @param {number} pointY
 */
b2Body.prototype.ConstantVelocity2 = function (desiredVelX, desiredVelY, pointX, pointY) {
	const desiredVel = new b2Vec2(desiredVelX, desiredVelY);
	const point = new b2Vec2(pointX, pointY);

	const sourceVel = this.GetLinearVelocity();
	const m = this.GetMass();

	let impulse = new b2Vec2();

	let velChange = b2Vec2.SubVV(desiredVel, sourceVel, impulse);
	impulse.x = m * velChange.x;
	impulse.y = m * velChange.y;

	this.ApplyLinearImpulse(impulse, point, true);
}

/**
 * @param {number} desiredVelX
 * @param {number} desiredVelY
 */
b2Body.prototype.ConstantVelocityWorldCenter2 = function (desiredVelX, desiredVelY) {
	const desiredVel = new b2Vec2(desiredVelX, desiredVelY);

	const sourceVel = this.GetLinearVelocity();
	const m = this.GetMass();

	let impulse = new b2Vec2();

	let velChange = b2Vec2.SubVV(desiredVel, sourceVel, impulse);
	impulse.x = m * velChange.x;
	impulse.y = m * velChange.y;

	this.ApplyLinearImpulseToCenter(impulse, true);
}

/**
 * 等速度運動 X
 * @param{number} desiredVelX
 * @param{b2Vec2} point
 */
b2Body.prototype.ConstantVelocityX = function (desiredVelX, point) {
	this.AccelerationX(desiredVelX, this.GetLinearVelocity(), point || this.GetWorldCenter());
}

/**
 * 等速度運動 Y
 * @param {number} desiredVelY
 * @param {b2Vec2} point
 */
b2Body.prototype.ConstantVelocityY = function (desiredVelY, point) {
	this.AccelerationY(desiredVelY, this.GetLinearVelocity(), point || this.GetWorldCenter());
}

/**
 * @param {b2Contact} contact
 * @param {b2Fixture} fa
 * @param {b2Fixture} fb
 */
b2Fixture.prototype.beginContact = function (contact, fa, fb) {
}

/**
 * @param {b2Contact} contact
 * @param {b2Fixture} fa
 * @param {b2Fixture} fb
 */
b2Fixture.prototype.endContact = function (contact, fa, fb) {
}

/**
 * @param {b2Contact} contact
 * @param {b2Manifold} oldManifold
 * @param {b2Fixture} fa
 * @param {b2Fixture} fb
 */
b2Fixture.prototype.preSolve = function (contact, oldManifold, fa, fb) {
}

/**
 * @param {b2Contact} contact
 * @param {b2ContactImpulse} impulse
 * @param {b2Fixture} fa
 * @param {b2Fixture} fb
 */
b2Fixture.prototype.postSolve = function (contact, impulse, fa, fb) {
}

/** @returns {string} */
b2Fixture.prototype.getOwnerID = function () {
	let host = this.GetUserData();
	if (host && host.owner) {
		return host.owner.id;
	}
}

class FixtureContactListener {
	/**
	 * @param {b2Contact} contact
	 * @param {b2Fixture} fa
	 * @param {b2Fixture} fb
	 */
	beginContact (contact, fa, fb) {
	}

	/**
	 * @param {b2Contact} contact
	 * @param {b2Fixture} fa
	 * @param {b2Fixture} fb
	 */
	endContact (contact, fa, fb) {
	}

	/**
	 * @param {b2Contact} contact
	 * @param {b2Manifold} oldManifold
	 * @param {b2Fixture} fa
	 * @param {b2Fixture} fb
	 */
	preSolve (contact, oldManifold, fa, fb) {
	}

	/**
	 * @param {b2Contact} contact
	 * @param {b2ContactImpulse} impulse
	 * @param {b2Fixture} fa
	 * @param {b2Fixture} fb
	 */
	postSolve (contact, impulse, fa, fb) {
	}
}



module.exports = Object.assign(box2d, {
	FixtureContactListener, FilterHelper
});
