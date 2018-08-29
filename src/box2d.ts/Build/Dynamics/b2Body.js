/*
* Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
*
* This software is provided 'as-is', without any express or implied
* warranty.  In no event will the authors be held liable for any damages
* arising from the use of this software.
* Permission is granted to anyone to use this software for any purpose,
* including commercial applications, and to alter it and redistribute it
* freely, subject to the following restrictions:
* 1. The origin of this software must not be misrepresented; you must not
* claim that you wrote the original software. If you use this software
* in a product, an acknowledgment in the product documentation would be
* appreciated but is not required.
* 2. Altered source versions must be plainly marked as such, and must not be
* misrepresented as being the original software.
* 3. This notice may not be removed or altered from any source distribution.
*/
// DEBUG: import { b2Assert } from "../Common/b2Settings";
// DEBUG: import { b2IsValid } from "../Common/b2Math";
import { b2Maybe } from "../Common/b2Settings";
import { b2Vec2, b2Rot, b2Transform, b2Sweep } from "../Common/b2Math";
import { b2Shape, b2MassData } from "../Collision/Shapes/b2Shape";
import { b2Fixture, b2FixtureDef } from "./b2Fixture";
// #endif
/// The body type.
/// static: zero mass, zero velocity, may be manually moved
/// kinematic: zero mass, non-zero velocity set by user, moved by solver
/// dynamic: positive mass, non-zero velocity determined by forces, moved by solver
export var b2BodyType;
(function (b2BodyType) {
    b2BodyType[b2BodyType["b2_unknown"] = -1] = "b2_unknown";
    b2BodyType[b2BodyType["b2_staticBody"] = 0] = "b2_staticBody";
    b2BodyType[b2BodyType["b2_kinematicBody"] = 1] = "b2_kinematicBody";
    b2BodyType[b2BodyType["b2_dynamicBody"] = 2] = "b2_dynamicBody";
    // TODO_ERIN
    // b2_bulletBody = 3
})(b2BodyType || (b2BodyType = {}));
/// A body definition holds all the data needed to construct a rigid body.
/// You can safely re-use body definitions. Shapes are added to a body after construction.
export class b2BodyDef {
    constructor() {
        /// The body type: static, kinematic, or dynamic.
        /// Note: if a dynamic body would have zero mass, the mass is set to one.
        this.type = b2BodyType.b2_staticBody;
        /// The world position of the body. Avoid creating bodies at the origin
        /// since this can lead to many overlapping shapes.
        this.position = new b2Vec2(0, 0);
        /// The world angle of the body in radians.
        this.angle = 0;
        /// The linear velocity of the body's origin in world co-ordinates.
        this.linearVelocity = new b2Vec2(0, 0);
        /// The angular velocity of the body.
        this.angularVelocity = 0;
        /// Linear damping is use to reduce the linear velocity. The damping parameter
        /// can be larger than 1.0f but the damping effect becomes sensitive to the
        /// time step when the damping parameter is large.
        this.linearDamping = 0;
        /// Angular damping is use to reduce the angular velocity. The damping parameter
        /// can be larger than 1.0f but the damping effect becomes sensitive to the
        /// time step when the damping parameter is large.
        this.angularDamping = 0;
        /// Set this flag to false if this body should never fall asleep. Note that
        /// this increases CPU usage.
        this.allowSleep = true;
        /// Is this body initially awake or sleeping?
        this.awake = true;
        /// Should this body be prevented from rotating? Useful for characters.
        this.fixedRotation = false;
        /// Is this a fast moving body that should be prevented from tunneling through
        /// other moving bodies? Note that all bodies are prevented from tunneling through
        /// kinematic and static bodies. This setting is only considered on dynamic bodies.
        /// @warning You should use this flag sparingly since it increases processing time.
        this.bullet = false;
        /// Does this body start out active?
        this.active = true;
        /// Use this to store application specific body data.
        this.userData = null;
        /// Scale the gravity applied to this body.
        this.gravityScale = 1;
    }
}
/// A rigid body. These are created via b2World::CreateBody.
export class b2Body {
    // #endif
    constructor(bd, world) {
        this.m_type = b2BodyType.b2_staticBody;
        this.m_islandFlag = false;
        this.m_awakeFlag = false;
        this.m_autoSleepFlag = false;
        this.m_bulletFlag = false;
        this.m_fixedRotationFlag = false;
        this.m_activeFlag = false;
        this.m_toiFlag = false;
        this.m_islandIndex = 0;
        this.m_xf = new b2Transform(); // the body origin transform
        // #if B2_ENABLE_PARTICLE
        this.m_xf0 = new b2Transform();
        // #endif
        this.m_sweep = new b2Sweep(); // the swept motion for CCD
        this.m_linearVelocity = new b2Vec2();
        this.m_angularVelocity = 0;
        this.m_force = new b2Vec2();
        this.m_torque = 0;
        this.m_prev = null;
        this.m_next = null;
        this.m_fixtureList = null;
        this.m_fixtureCount = 0;
        this.m_jointList = null;
        this.m_contactList = null;
        this.m_mass = 1;
        this.m_invMass = 1;
        // Rotational inertia about the center of mass.
        this.m_I = 0;
        this.m_invI = 0;
        this.m_linearDamping = 0;
        this.m_angularDamping = 0;
        this.m_gravityScale = 1;
        this.m_sleepTime = 0;
        this.m_userData = null;
        // #if B2_ENABLE_CONTROLLER
        this.m_controllerList = null;
        this.m_controllerCount = 0;
        this.m_bulletFlag = b2Maybe(bd.bullet, false);
        this.m_fixedRotationFlag = b2Maybe(bd.fixedRotation, false);
        this.m_autoSleepFlag = b2Maybe(bd.allowSleep, true);
        this.m_awakeFlag = b2Maybe(bd.awake, true);
        this.m_activeFlag = b2Maybe(bd.active, true);
        this.m_world = world;
        this.m_xf.p.Copy(b2Maybe(bd.position, b2Vec2.ZERO));
        // DEBUG: b2Assert(this.m_xf.p.IsValid());
        this.m_xf.q.SetAngle(b2Maybe(bd.angle, 0));
        // DEBUG: b2Assert(b2IsValid(this.m_xf.q.GetAngle()));
        // #if B2_ENABLE_PARTICLE
        this.m_xf0.Copy(this.m_xf);
        // #endif
        this.m_sweep.localCenter.SetZero();
        this.m_sweep.c0.Copy(this.m_xf.p);
        this.m_sweep.c.Copy(this.m_xf.p);
        this.m_sweep.a0 = this.m_sweep.a = this.m_xf.q.GetAngle();
        this.m_sweep.alpha0 = 0;
        this.m_linearVelocity.Copy(b2Maybe(bd.linearVelocity, b2Vec2.ZERO));
        // DEBUG: b2Assert(this.m_linearVelocity.IsValid());
        this.m_angularVelocity = b2Maybe(bd.angularVelocity, 0);
        // DEBUG: b2Assert(b2IsValid(this.m_angularVelocity));
        this.m_linearDamping = b2Maybe(bd.linearDamping, 0);
        this.m_angularDamping = b2Maybe(bd.angularDamping, 0);
        this.m_gravityScale = b2Maybe(bd.gravityScale, 1);
        // DEBUG: b2Assert(b2IsValid(this.m_gravityScale) && this.m_gravityScale >= 0);
        // DEBUG: b2Assert(b2IsValid(this.m_angularDamping) && this.m_angularDamping >= 0);
        // DEBUG: b2Assert(b2IsValid(this.m_linearDamping) && this.m_linearDamping >= 0);
        this.m_force.SetZero();
        this.m_torque = 0;
        this.m_sleepTime = 0;
        this.m_type = b2Maybe(bd.type, b2BodyType.b2_staticBody);
        if (bd.type === b2BodyType.b2_dynamicBody) {
            this.m_mass = 1;
            this.m_invMass = 1;
        }
        else {
            this.m_mass = 0;
            this.m_invMass = 0;
        }
        this.m_I = 0;
        this.m_invI = 0;
        this.m_userData = bd.userData;
        this.m_fixtureList = null;
        this.m_fixtureCount = 0;
        // #if B2_ENABLE_CONTROLLER
        this.m_controllerList = null;
        this.m_controllerCount = 0;
        // #endif
    }
    CreateFixture(a, b = 0) {
        if (a instanceof b2Shape) {
            return this.CreateFixtureShapeDensity(a, b);
        }
        else {
            return this.CreateFixtureDef(a);
        }
    }
    /// Creates a fixture and attach it to this body. Use this function if you need
    /// to set some fixture parameters, like friction. Otherwise you can create the
    /// fixture directly from a shape.
    /// If the density is non-zero, this function automatically updates the mass of the body.
    /// Contacts are not created until the next time step.
    /// @param def the fixture definition.
    /// @warning This function is locked during callbacks.
    CreateFixtureDef(def) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        const fixture = new b2Fixture(def, this);
        fixture.Create(def);
        if (this.m_activeFlag) {
            fixture.CreateProxies(this.m_xf);
        }
        fixture.m_next = this.m_fixtureList;
        this.m_fixtureList = fixture;
        ++this.m_fixtureCount;
        // fixture.m_body = this;
        // Adjust mass properties if needed.
        if (fixture.m_density > 0) {
            this.ResetMassData();
        }
        // Let the world know we have a new fixture. This will cause new contacts
        // to be created at the beginning of the next time step.
        this.m_world.m_newFixture = true;
        return fixture;
    }
    CreateFixtureShapeDensity(shape, density = 0) {
        const def = b2Body.CreateFixtureShapeDensity_s_def;
        def.shape = shape;
        def.density = density;
        return this.CreateFixtureDef(def);
    }
    /// Destroy a fixture. This removes the fixture from the broad-phase and
    /// destroys all contacts associated with this fixture. This will
    /// automatically adjust the mass of the body if the body is dynamic and the
    /// fixture has positive density.
    /// All fixtures attached to a body are implicitly destroyed when the body is destroyed.
    /// @param fixture the fixture to be removed.
    /// @warning This function is locked during callbacks.
    DestroyFixture(fixture) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        // DEBUG: b2Assert(fixture.m_body === this);
        // Remove the fixture from this body's singly linked list.
        // DEBUG: b2Assert(this.m_fixtureCount > 0);
        let node = this.m_fixtureList;
        let ppF = null;
        // DEBUG: let found: boolean = false;
        while (node !== null) {
            if (node === fixture) {
                if (ppF) {
                    ppF.m_next = fixture.m_next;
                }
                else {
                    this.m_fixtureList = fixture.m_next;
                }
                // DEBUG: found = true;
                break;
            }
            ppF = node;
            node = node.m_next;
        }
        // You tried to remove a shape that is not attached to this body.
        // DEBUG: b2Assert(found);
        // Destroy any contacts associated with the fixture.
        let edge = this.m_contactList;
        while (edge) {
            const c = edge.contact;
            edge = edge.next;
            const fixtureA = c.GetFixtureA();
            const fixtureB = c.GetFixtureB();
            if (fixture === fixtureA || fixture === fixtureB) {
                // This destroys the contact and removes it from
                // this body's contact list.
                this.m_world.m_contactManager.Destroy(c);
            }
        }
        if (this.m_activeFlag) {
            fixture.DestroyProxies();
        }
        // fixture.m_body = null;
        fixture.m_next = null;
        fixture.Destroy();
        --this.m_fixtureCount;
        // Reset the mass data.
        this.ResetMassData();
    }
    /// Set the position of the body's origin and rotation.
    /// This breaks any contacts and wakes the other bodies.
    /// Manipulating a body's transform may cause non-physical behavior.
    /// @param position the world position of the body's local origin.
    /// @param angle the world rotation in radians.
    SetTransformVec(position, angle) {
        this.SetTransformXY(position.x, position.y, angle);
    }
    SetTransformXY(x, y, angle) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        this.m_xf.q.SetAngle(angle);
        this.m_xf.p.Set(x, y);
        // #if B2_ENABLE_PARTICLE
        this.m_xf0.Copy(this.m_xf);
        // #endif
        b2Transform.MulXV(this.m_xf, this.m_sweep.localCenter, this.m_sweep.c);
        this.m_sweep.a = angle;
        this.m_sweep.c0.Copy(this.m_sweep.c);
        this.m_sweep.a0 = angle;
        for (let f = this.m_fixtureList; f; f = f.m_next) {
            f.Synchronize(this.m_xf, this.m_xf);
        }
        this.m_world.m_contactManager.FindNewContacts();
    }
    SetTransform(xf) {
        this.SetTransformVec(xf.p, xf.GetAngle());
    }
    /// Get the body transform for the body's origin.
    /// @return the world transform of the body's origin.
    GetTransform() {
        return this.m_xf;
    }
    /// Get the world body origin position.
    /// @return the world position of the body's origin.
    GetPosition() {
        return this.m_xf.p;
    }
    SetPosition(position) {
        this.SetTransformVec(position, this.GetAngle());
    }
    SetPositionXY(x, y) {
        this.SetTransformXY(x, y, this.GetAngle());
    }
    /// Get the angle in radians.
    /// @return the current world rotation angle in radians.
    GetAngle() {
        return this.m_sweep.a;
    }
    SetAngle(angle) {
        this.SetTransformVec(this.GetPosition(), angle);
    }
    /// Get the world position of the center of mass.
    GetWorldCenter() {
        return this.m_sweep.c;
    }
    /// Get the local position of the center of mass.
    GetLocalCenter() {
        return this.m_sweep.localCenter;
    }
    /// Set the linear velocity of the center of mass.
    /// @param v the new linear velocity of the center of mass.
    SetLinearVelocity(v) {
        if (this.m_type === b2BodyType.b2_staticBody) {
            return;
        }
        if (b2Vec2.DotVV(v, v) > 0) {
            this.SetAwake(true);
        }
        this.m_linearVelocity.Copy(v);
    }
    /// Get the linear velocity of the center of mass.
    /// @return the linear velocity of the center of mass.
    GetLinearVelocity() {
        return this.m_linearVelocity;
    }
    /// Set the angular velocity.
    /// @param omega the new angular velocity in radians/second.
    SetAngularVelocity(w) {
        if (this.m_type === b2BodyType.b2_staticBody) {
            return;
        }
        if (w * w > 0) {
            this.SetAwake(true);
        }
        this.m_angularVelocity = w;
    }
    /// Get the angular velocity.
    /// @return the angular velocity in radians/second.
    GetAngularVelocity() {
        return this.m_angularVelocity;
    }
    GetDefinition(bd) {
        bd.type = this.GetType();
        bd.allowSleep = this.m_autoSleepFlag;
        bd.angle = this.GetAngle();
        bd.angularDamping = this.m_angularDamping;
        bd.gravityScale = this.m_gravityScale;
        bd.angularVelocity = this.m_angularVelocity;
        bd.fixedRotation = this.m_fixedRotationFlag;
        bd.bullet = this.m_bulletFlag;
        bd.awake = this.m_awakeFlag;
        bd.linearDamping = this.m_linearDamping;
        bd.linearVelocity.Copy(this.GetLinearVelocity());
        bd.position.Copy(this.GetPosition());
        bd.userData = this.GetUserData();
        return bd;
    }
    /// Apply a force at a world point. If the force is not
    /// applied at the center of mass, it will generate a torque and
    /// affect the angular velocity. This wakes up the body.
    /// @param force the world force vector, usually in Newtons (N).
    /// @param point the world position of the point of application.
    /// @param wake also wake up the body
    ApplyForce(force, point, wake = true) {
        if (this.m_type !== b2BodyType.b2_dynamicBody) {
            return;
        }
        if (wake && !this.m_awakeFlag) {
            this.SetAwake(true);
        }
        // Don't accumulate a force if the body is sleeping.
        if (this.m_awakeFlag) {
            this.m_force.x += force.x;
            this.m_force.y += force.y;
            this.m_torque += ((point.x - this.m_sweep.c.x) * force.y - (point.y - this.m_sweep.c.y) * force.x);
        }
    }
    /// Apply a force to the center of mass. This wakes up the body.
    /// @param force the world force vector, usually in Newtons (N).
    /// @param wake also wake up the body
    ApplyForceToCenter(force, wake = true) {
        if (this.m_type !== b2BodyType.b2_dynamicBody) {
            return;
        }
        if (wake && !this.m_awakeFlag) {
            this.SetAwake(true);
        }
        // Don't accumulate a force if the body is sleeping.
        if (this.m_awakeFlag) {
            this.m_force.x += force.x;
            this.m_force.y += force.y;
        }
    }
    /// Apply a torque. This affects the angular velocity
    /// without affecting the linear velocity of the center of mass.
    /// @param torque about the z-axis (out of the screen), usually in N-m.
    /// @param wake also wake up the body
    ApplyTorque(torque, wake = true) {
        if (this.m_type !== b2BodyType.b2_dynamicBody) {
            return;
        }
        if (wake && !this.m_awakeFlag) {
            this.SetAwake(true);
        }
        // Don't accumulate a force if the body is sleeping.
        if (this.m_awakeFlag) {
            this.m_torque += torque;
        }
    }
    /// Apply an impulse at a point. This immediately modifies the velocity.
    /// It also modifies the angular velocity if the point of application
    /// is not at the center of mass. This wakes up the body.
    /// @param impulse the world impulse vector, usually in N-seconds or kg-m/s.
    /// @param point the world position of the point of application.
    /// @param wake also wake up the body
    ApplyLinearImpulse(impulse, point, wake = true) {
        if (this.m_type !== b2BodyType.b2_dynamicBody) {
            return;
        }
        if (wake && !this.m_awakeFlag) {
            this.SetAwake(true);
        }
        // Don't accumulate a force if the body is sleeping.
        if (this.m_awakeFlag) {
            this.m_linearVelocity.x += this.m_invMass * impulse.x;
            this.m_linearVelocity.y += this.m_invMass * impulse.y;
            this.m_angularVelocity += this.m_invI * ((point.x - this.m_sweep.c.x) * impulse.y - (point.y - this.m_sweep.c.y) * impulse.x);
        }
    }
    /// Apply an impulse at the center of gravity. This immediately modifies the velocity.
    /// @param impulse the world impulse vector, usually in N-seconds or kg-m/s.
    /// @param wake also wake up the body
    ApplyLinearImpulseToCenter(impulse, wake = true) {
        if (this.m_type !== b2BodyType.b2_dynamicBody) {
            return;
        }
        if (wake && !this.m_awakeFlag) {
            this.SetAwake(true);
        }
        // Don't accumulate a force if the body is sleeping.
        if (this.m_awakeFlag) {
            this.m_linearVelocity.x += this.m_invMass * impulse.x;
            this.m_linearVelocity.y += this.m_invMass * impulse.y;
        }
    }
    /// Apply an angular impulse.
    /// @param impulse the angular impulse in units of kg*m*m/s
    /// @param wake also wake up the body
    ApplyAngularImpulse(impulse, wake = true) {
        if (this.m_type !== b2BodyType.b2_dynamicBody) {
            return;
        }
        if (wake && !this.m_awakeFlag) {
            this.SetAwake(true);
        }
        // Don't accumulate a force if the body is sleeping.
        if (this.m_awakeFlag) {
            this.m_angularVelocity += this.m_invI * impulse;
        }
    }
    /// Get the total mass of the body.
    /// @return the mass, usually in kilograms (kg).
    GetMass() {
        return this.m_mass;
    }
    /// Get the rotational inertia of the body about the local origin.
    /// @return the rotational inertia, usually in kg-m^2.
    GetInertia() {
        return this.m_I + this.m_mass * b2Vec2.DotVV(this.m_sweep.localCenter, this.m_sweep.localCenter);
    }
    /// Get the mass data of the body.
    /// @return a struct containing the mass, inertia and center of the body.
    GetMassData(data) {
        data.mass = this.m_mass;
        data.I = this.m_I + this.m_mass * b2Vec2.DotVV(this.m_sweep.localCenter, this.m_sweep.localCenter);
        data.center.Copy(this.m_sweep.localCenter);
        return data;
    }
    SetMassData(massData) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        if (this.m_type !== b2BodyType.b2_dynamicBody) {
            return;
        }
        this.m_invMass = 0;
        this.m_I = 0;
        this.m_invI = 0;
        this.m_mass = massData.mass;
        if (this.m_mass <= 0) {
            this.m_mass = 1;
        }
        this.m_invMass = 1 / this.m_mass;
        if (massData.I > 0 && !this.m_fixedRotationFlag) {
            this.m_I = massData.I - this.m_mass * b2Vec2.DotVV(massData.center, massData.center);
            // DEBUG: b2Assert(this.m_I > 0);
            this.m_invI = 1 / this.m_I;
        }
        // Move center of mass.
        const oldCenter = b2Body.SetMassData_s_oldCenter.Copy(this.m_sweep.c);
        this.m_sweep.localCenter.Copy(massData.center);
        b2Transform.MulXV(this.m_xf, this.m_sweep.localCenter, this.m_sweep.c);
        this.m_sweep.c0.Copy(this.m_sweep.c);
        // Update center of mass velocity.
        b2Vec2.AddVCrossSV(this.m_linearVelocity, this.m_angularVelocity, b2Vec2.SubVV(this.m_sweep.c, oldCenter, b2Vec2.s_t0), this.m_linearVelocity);
    }
    ResetMassData() {
        // Compute mass data from shapes. Each shape has its own density.
        this.m_mass = 0;
        this.m_invMass = 0;
        this.m_I = 0;
        this.m_invI = 0;
        this.m_sweep.localCenter.SetZero();
        // Static and kinematic bodies have zero mass.
        if (this.m_type === b2BodyType.b2_staticBody || this.m_type === b2BodyType.b2_kinematicBody) {
            this.m_sweep.c0.Copy(this.m_xf.p);
            this.m_sweep.c.Copy(this.m_xf.p);
            this.m_sweep.a0 = this.m_sweep.a;
            return;
        }
        // DEBUG: b2Assert(this.m_type === b2BodyType.b2_dynamicBody);
        // Accumulate mass over all fixtures.
        const localCenter = b2Body.ResetMassData_s_localCenter.SetZero();
        for (let f = this.m_fixtureList; f; f = f.m_next) {
            if (f.m_density === 0) {
                continue;
            }
            const massData = f.GetMassData(b2Body.ResetMassData_s_massData);
            this.m_mass += massData.mass;
            localCenter.x += massData.center.x * massData.mass;
            localCenter.y += massData.center.y * massData.mass;
            this.m_I += massData.I;
        }
        // Compute center of mass.
        if (this.m_mass > 0) {
            this.m_invMass = 1 / this.m_mass;
            localCenter.x *= this.m_invMass;
            localCenter.y *= this.m_invMass;
        }
        else {
            // Force all dynamic bodies to have a positive mass.
            this.m_mass = 1;
            this.m_invMass = 1;
        }
        if (this.m_I > 0 && !this.m_fixedRotationFlag) {
            // Center the inertia about the center of mass.
            this.m_I -= this.m_mass * b2Vec2.DotVV(localCenter, localCenter);
            // DEBUG: b2Assert(this.m_I > 0);
            this.m_invI = 1 / this.m_I;
        }
        else {
            this.m_I = 0;
            this.m_invI = 0;
        }
        // Move center of mass.
        const oldCenter = b2Body.ResetMassData_s_oldCenter.Copy(this.m_sweep.c);
        this.m_sweep.localCenter.Copy(localCenter);
        b2Transform.MulXV(this.m_xf, this.m_sweep.localCenter, this.m_sweep.c);
        this.m_sweep.c0.Copy(this.m_sweep.c);
        // Update center of mass velocity.
        b2Vec2.AddVCrossSV(this.m_linearVelocity, this.m_angularVelocity, b2Vec2.SubVV(this.m_sweep.c, oldCenter, b2Vec2.s_t0), this.m_linearVelocity);
    }
    /// Get the world coordinates of a point given the local coordinates.
    /// @param localPoint a point on the body measured relative the the body's origin.
    /// @return the same point expressed in world coordinates.
    GetWorldPoint(localPoint, out) {
        return b2Transform.MulXV(this.m_xf, localPoint, out);
    }
    /// Get the world coordinates of a vector given the local coordinates.
    /// @param localVector a vector fixed in the body.
    /// @return the same vector expressed in world coordinates.
    GetWorldVector(localVector, out) {
        return b2Rot.MulRV(this.m_xf.q, localVector, out);
    }
    /// Gets a local point relative to the body's origin given a world point.
    /// @param a point in world coordinates.
    /// @return the corresponding local point relative to the body's origin.
    GetLocalPoint(worldPoint, out) {
        return b2Transform.MulTXV(this.m_xf, worldPoint, out);
    }
    /// Gets a local vector given a world vector.
    /// @param a vector in world coordinates.
    /// @return the corresponding local vector.
    GetLocalVector(worldVector, out) {
        return b2Rot.MulTRV(this.m_xf.q, worldVector, out);
    }
    /// Get the world linear velocity of a world point attached to this body.
    /// @param a point in world coordinates.
    /// @return the world velocity of a point.
    GetLinearVelocityFromWorldPoint(worldPoint, out) {
        return b2Vec2.AddVCrossSV(this.m_linearVelocity, this.m_angularVelocity, b2Vec2.SubVV(worldPoint, this.m_sweep.c, b2Vec2.s_t0), out);
    }
    /// Get the world velocity of a local point.
    /// @param a point in local coordinates.
    /// @return the world velocity of a point.
    GetLinearVelocityFromLocalPoint(localPoint, out) {
        return this.GetLinearVelocityFromWorldPoint(this.GetWorldPoint(localPoint, out), out);
    }
    /// Get the linear damping of the body.
    GetLinearDamping() {
        return this.m_linearDamping;
    }
    /// Set the linear damping of the body.
    SetLinearDamping(linearDamping) {
        this.m_linearDamping = linearDamping;
    }
    /// Get the angular damping of the body.
    GetAngularDamping() {
        return this.m_angularDamping;
    }
    /// Set the angular damping of the body.
    SetAngularDamping(angularDamping) {
        this.m_angularDamping = angularDamping;
    }
    /// Get the gravity scale of the body.
    GetGravityScale() {
        return this.m_gravityScale;
    }
    /// Set the gravity scale of the body.
    SetGravityScale(scale) {
        this.m_gravityScale = scale;
    }
    /// Set the type of this body. This may alter the mass and velocity.
    SetType(type) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        if (this.m_type === type) {
            return;
        }
        this.m_type = type;
        this.ResetMassData();
        if (this.m_type === b2BodyType.b2_staticBody) {
            this.m_linearVelocity.SetZero();
            this.m_angularVelocity = 0;
            this.m_sweep.a0 = this.m_sweep.a;
            this.m_sweep.c0.Copy(this.m_sweep.c);
            this.SynchronizeFixtures();
        }
        this.SetAwake(true);
        this.m_force.SetZero();
        this.m_torque = 0;
        // Delete the attached contacts.
        let ce = this.m_contactList;
        while (ce) {
            const ce0 = ce;
            ce = ce.next;
            this.m_world.m_contactManager.Destroy(ce0.contact);
        }
        this.m_contactList = null;
        // Touch the proxies so that new contacts will be created (when appropriate)
        for (let f = this.m_fixtureList; f; f = f.m_next) {
            f.TouchProxies();
        }
    }
    /// Get the type of this body.
    GetType() {
        return this.m_type;
    }
    /// Should this body be treated like a bullet for continuous collision detection?
    SetBullet(flag) {
        this.m_bulletFlag = flag;
    }
    /// Is this body treated like a bullet for continuous collision detection?
    IsBullet() {
        return this.m_bulletFlag;
    }
    /// You can disable sleeping on this body. If you disable sleeping, the
    /// body will be woken.
    SetSleepingAllowed(flag) {
        this.m_autoSleepFlag = flag;
        if (!flag) {
            this.SetAwake(true);
        }
    }
    /// Is this body allowed to sleep
    IsSleepingAllowed() {
        return this.m_autoSleepFlag;
    }
    /// Set the sleep state of the body. A sleeping body has very
    /// low CPU cost.
    /// @param flag set to true to wake the body, false to put it to sleep.
    SetAwake(flag) {
        if (flag) {
            this.m_awakeFlag = true;
            this.m_sleepTime = 0;
        }
        else {
            this.m_awakeFlag = false;
            this.m_sleepTime = 0;
            this.m_linearVelocity.SetZero();
            this.m_angularVelocity = 0;
            this.m_force.SetZero();
            this.m_torque = 0;
        }
    }
    /// Get the sleeping state of this body.
    /// @return true if the body is sleeping.
    IsAwake() {
        return this.m_awakeFlag;
    }
    /// Set the active state of the body. An inactive body is not
    /// simulated and cannot be collided with or woken up.
    /// If you pass a flag of true, all fixtures will be added to the
    /// broad-phase.
    /// If you pass a flag of false, all fixtures will be removed from
    /// the broad-phase and all contacts will be destroyed.
    /// Fixtures and joints are otherwise unaffected. You may continue
    /// to create/destroy fixtures and joints on inactive bodies.
    /// Fixtures on an inactive body are implicitly inactive and will
    /// not participate in collisions, ray-casts, or queries.
    /// Joints connected to an inactive body are implicitly inactive.
    /// An inactive body is still owned by a b2World object and remains
    /// in the body list.
    SetActive(flag) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        if (flag === this.IsActive()) {
            return;
        }
        this.m_activeFlag = flag;
        if (flag) {
            // Create all proxies.
            for (let f = this.m_fixtureList; f; f = f.m_next) {
                f.CreateProxies(this.m_xf);
            }
            // Contacts are created the next time step.
        }
        else {
            // Destroy all proxies.
            for (let f = this.m_fixtureList; f; f = f.m_next) {
                f.DestroyProxies();
            }
            // Destroy the attached contacts.
            let ce = this.m_contactList;
            while (ce) {
                const ce0 = ce;
                ce = ce.next;
                this.m_world.m_contactManager.Destroy(ce0.contact);
            }
            this.m_contactList = null;
        }
    }
    /// Get the active state of the body.
    IsActive() {
        return this.m_activeFlag;
    }
    /// Set this body to have fixed rotation. This causes the mass
    /// to be reset.
    SetFixedRotation(flag) {
        if (this.m_fixedRotationFlag === flag) {
            return;
        }
        this.m_fixedRotationFlag = flag;
        this.m_angularVelocity = 0;
        this.ResetMassData();
    }
    /// Does this body have fixed rotation?
    IsFixedRotation() {
        return this.m_fixedRotationFlag;
    }
    /// Get the list of all fixtures attached to this body.
    GetFixtureList() {
        return this.m_fixtureList;
    }
    /// Get the list of all joints attached to this body.
    GetJointList() {
        return this.m_jointList;
    }
    /// Get the list of all contacts attached to this body.
    /// @warning this list changes during the time step and you may
    /// miss some collisions if you don't use b2ContactListener.
    GetContactList() {
        return this.m_contactList;
    }
    /// Get the next body in the world's body list.
    GetNext() {
        return this.m_next;
    }
    /// Get the user data pointer that was provided in the body definition.
    GetUserData() {
        return this.m_userData;
    }
    /// Set the user data. Use this to store your application specific data.
    SetUserData(data) {
        this.m_userData = data;
    }
    /// Get the parent world of this body.
    GetWorld() {
        return this.m_world;
    }
    /// Dump this body to a log file
    Dump(log) {
        const bodyIndex = this.m_islandIndex;
        log("{\n");
        log("  const bd: b2BodyDef = new b2BodyDef();\n");
        let type_str = "";
        switch (this.m_type) {
            case b2BodyType.b2_staticBody:
                type_str = "b2BodyType.b2_staticBody";
                break;
            case b2BodyType.b2_kinematicBody:
                type_str = "b2BodyType.b2_kinematicBody";
                break;
            case b2BodyType.b2_dynamicBody:
                type_str = "b2BodyType.b2_dynamicBody";
                break;
            default:
                // DEBUG: b2Assert(false);
                break;
        }
        log("  bd.type = %s;\n", type_str);
        log("  bd.position.Set(%.15f, %.15f);\n", this.m_xf.p.x, this.m_xf.p.y);
        log("  bd.angle = %.15f;\n", this.m_sweep.a);
        log("  bd.linearVelocity.Set(%.15f, %.15f);\n", this.m_linearVelocity.x, this.m_linearVelocity.y);
        log("  bd.angularVelocity = %.15f;\n", this.m_angularVelocity);
        log("  bd.linearDamping = %.15f;\n", this.m_linearDamping);
        log("  bd.angularDamping = %.15f;\n", this.m_angularDamping);
        log("  bd.allowSleep = %s;\n", (this.m_autoSleepFlag) ? ("true") : ("false"));
        log("  bd.awake = %s;\n", (this.m_awakeFlag) ? ("true") : ("false"));
        log("  bd.fixedRotation = %s;\n", (this.m_fixedRotationFlag) ? ("true") : ("false"));
        log("  bd.bullet = %s;\n", (this.m_bulletFlag) ? ("true") : ("false"));
        log("  bd.active = %s;\n", (this.m_activeFlag) ? ("true") : ("false"));
        log("  bd.gravityScale = %.15f;\n", this.m_gravityScale);
        log("\n");
        log("  bodies[%d] = this.m_world.CreateBody(bd);\n", this.m_islandIndex);
        log("\n");
        for (let f = this.m_fixtureList; f; f = f.m_next) {
            log("  {\n");
            f.Dump(log, bodyIndex);
            log("  }\n");
        }
        log("}\n");
    }
    SynchronizeFixtures() {
        const xf1 = b2Body.SynchronizeFixtures_s_xf1;
        xf1.q.SetAngle(this.m_sweep.a0);
        b2Rot.MulRV(xf1.q, this.m_sweep.localCenter, xf1.p);
        b2Vec2.SubVV(this.m_sweep.c0, xf1.p, xf1.p);
        for (let f = this.m_fixtureList; f; f = f.m_next) {
            f.Synchronize(xf1, this.m_xf);
        }
    }
    SynchronizeTransform() {
        this.m_xf.q.SetAngle(this.m_sweep.a);
        b2Rot.MulRV(this.m_xf.q, this.m_sweep.localCenter, this.m_xf.p);
        b2Vec2.SubVV(this.m_sweep.c, this.m_xf.p, this.m_xf.p);
    }
    // This is used to prevent connected bodies from colliding.
    // It may lie, depending on the collideConnected flag.
    ShouldCollide(other) {
        // At least one body should be dynamic or kinematic.
        if (this.m_type === b2BodyType.b2_staticBody && other.m_type === b2BodyType.b2_staticBody) {
            return false;
        }
        return this.ShouldCollideConnected(other);
    }
    ShouldCollideConnected(other) {
        // Does a joint prevent collision?
        for (let jn = this.m_jointList; jn; jn = jn.next) {
            if (jn.other === other) {
                if (!jn.joint.m_collideConnected) {
                    return false;
                }
            }
        }
        return true;
    }
    Advance(alpha) {
        // Advance to the new safe time. This doesn't sync the broad-phase.
        this.m_sweep.Advance(alpha);
        this.m_sweep.c.Copy(this.m_sweep.c0);
        this.m_sweep.a = this.m_sweep.a0;
        this.m_xf.q.SetAngle(this.m_sweep.a);
        b2Rot.MulRV(this.m_xf.q, this.m_sweep.localCenter, this.m_xf.p);
        b2Vec2.SubVV(this.m_sweep.c, this.m_xf.p, this.m_xf.p);
    }
    // #if B2_ENABLE_CONTROLLER
    GetControllerList() {
        return this.m_controllerList;
    }
    GetControllerCount() {
        return this.m_controllerCount;
    }
}
/// Creates a fixture from a shape and attach it to this body.
/// This is a convenience function. Use b2FixtureDef if you need to set parameters
/// like friction, restitution, user data, or filtering.
/// If the density is non-zero, this function automatically updates the mass of the body.
/// @param shape the shape to be cloned.
/// @param density the shape density (set to zero for static bodies).
/// @warning This function is locked during callbacks.
b2Body.CreateFixtureShapeDensity_s_def = new b2FixtureDef();
/// Set the mass properties to override the mass properties of the fixtures.
/// Note that this changes the center of mass position.
/// Note that creating or destroying fixtures can also alter the mass.
/// This function has no effect if the body isn't dynamic.
/// @param massData the mass properties.
b2Body.SetMassData_s_oldCenter = new b2Vec2();
/// This resets the mass properties to the sum of the mass properties of the fixtures.
/// This normally does not need to be called unless you called SetMassData to override
/// the mass and you later want to reset the mass.
b2Body.ResetMassData_s_localCenter = new b2Vec2();
b2Body.ResetMassData_s_oldCenter = new b2Vec2();
b2Body.ResetMassData_s_massData = new b2MassData();
b2Body.SynchronizeFixtures_s_xf1 = new b2Transform();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJCb2R5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvRHluYW1pY3MvYjJCb2R5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsMERBQTBEO0FBQzFELHVEQUF1RDtBQUN2RCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBTSxNQUFNLGtCQUFrQixDQUFDO0FBQzNFLE9BQU8sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFHbEUsT0FBTyxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQWlCLE1BQU0sYUFBYSxDQUFDO0FBSXJFLFNBQVM7QUFFVCxrQkFBa0I7QUFDbEIsMkRBQTJEO0FBQzNELHdFQUF3RTtBQUN4RSxtRkFBbUY7QUFDbkYsTUFBTSxDQUFOLElBQVksVUFRWDtBQVJELFdBQVksVUFBVTtJQUNwQix3REFBZSxDQUFBO0lBQ2YsNkRBQWlCLENBQUE7SUFDakIsbUVBQW9CLENBQUE7SUFDcEIsK0RBQWtCLENBQUE7SUFFbEIsWUFBWTtJQUNaLG9CQUFvQjtBQUN0QixDQUFDLEVBUlcsVUFBVSxLQUFWLFVBQVUsUUFRckI7QUEwREQsMEVBQTBFO0FBQzFFLDBGQUEwRjtBQUMxRixNQUFNLE9BQU8sU0FBUztJQUF0QjtRQUNFLGlEQUFpRDtRQUNqRCx5RUFBeUU7UUFDbEUsU0FBSSxHQUFlLFVBQVUsQ0FBQyxhQUFhLENBQUM7UUFFbkQsdUVBQXVFO1FBQ3ZFLG1EQUFtRDtRQUNuQyxhQUFRLEdBQVcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXBELDJDQUEyQztRQUNwQyxVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBRXpCLG1FQUFtRTtRQUNuRCxtQkFBYyxHQUFXLElBQUksTUFBTSxDQUFD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