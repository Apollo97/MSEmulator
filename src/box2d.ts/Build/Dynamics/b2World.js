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
import { b2_epsilon, b2_maxSubSteps, b2_maxTOIContacts } from "../Common/b2Settings";
import { b2Min, b2Vec2, b2Transform, b2Sweep } from "../Common/b2Math";
import { b2Timer } from "../Common/b2Timer";
import { b2Color, b2DrawFlags } from "../Common/b2Draw";
import { b2AABB, b2RayCastInput, b2RayCastOutput, b2TestOverlapShape } from "../Collision/b2Collision";
import { b2TimeOfImpact, b2TOIInput, b2TOIOutput, b2TOIOutputState } from "../Collision/b2TimeOfImpact";
import { b2ShapeType } from "../Collision/Shapes/b2Shape";
import { b2JointType } from "./Joints/b2Joint";
import { b2AreaJoint } from "./Joints/b2AreaJoint";
import { b2DistanceJoint } from "./Joints/b2DistanceJoint";
import { b2FrictionJoint } from "./Joints/b2FrictionJoint";
import { b2GearJoint } from "./Joints/b2GearJoint";
import { b2MotorJoint } from "./Joints/b2MotorJoint";
import { b2MouseJoint } from "./Joints/b2MouseJoint";
import { b2PrismaticJoint } from "./Joints/b2PrismaticJoint";
import { b2PulleyJoint } from "./Joints/b2PulleyJoint";
import { b2RevoluteJoint } from "./Joints/b2RevoluteJoint";
import { b2RopeJoint } from "./Joints/b2RopeJoint";
import { b2WeldJoint } from "./Joints/b2WeldJoint";
import { b2WheelJoint } from "./Joints/b2WheelJoint";
import { b2Body, b2BodyType } from "./b2Body";
import { b2ContactManager } from "./b2ContactManager";
import { b2Island } from "./b2Island";
import { b2Profile, b2TimeStep } from "./b2TimeStep";
import { b2QueryCallback } from "./b2WorldCallbacks";
// #if B2_ENABLE_PARTICLE
import { b2_maxFloat } from "../Common/b2Settings";
import { b2CalculateParticleIterations } from "../Particle/b2Particle";
import { b2ParticleSystem } from "../Particle/b2ParticleSystem";
// #endif
/// The world class manages all physics entities, dynamic simulation,
/// and asynchronous queries. The world also contains efficient memory
/// management facilities.
export class b2World {
    // #endif
    /// Construct a world object.
    /// @param gravity the world gravity vector.
    constructor(gravity) {
        // b2BlockAllocator m_blockAllocator;
        // b2StackAllocator m_stackAllocator;
        this.m_newFixture = false;
        this.m_locked = false;
        this.m_clearForces = true;
        this.m_contactManager = new b2ContactManager();
        this.m_bodyList = null;
        this.m_jointList = null;
        // #if B2_ENABLE_PARTICLE
        this.m_particleSystemList = null;
        // #endif
        this.m_bodyCount = 0;
        this.m_jointCount = 0;
        this.m_gravity = new b2Vec2();
        this.m_allowSleep = true;
        this.m_destructionListener = null;
        this.m_debugDraw = null;
        // This is used to compute the time step ratio to
        // support a variable time step.
        this.m_inv_dt0 = 0;
        // These are for debugging the solver.
        this.m_warmStarting = true;
        this.m_continuousPhysics = true;
        this.m_subStepping = false;
        this.m_stepComplete = true;
        this.m_profile = new b2Profile();
        this.m_island = new b2Island();
        this.s_stack = [];
        // #if B2_ENABLE_CONTROLLER
        this.m_controllerList = null;
        this.m_controllerCount = 0;
        this.m_gravity.Copy(gravity);
    }
    /// Register a destruction listener. The listener is owned by you and must
    /// remain in scope.
    SetDestructionListener(listener) {
        this.m_destructionListener = listener;
    }
    /// Register a contact filter to provide specific control over collision.
    /// Otherwise the default filter is used (b2_defaultFilter). The listener is
    /// owned by you and must remain in scope.
    SetContactFilter(filter) {
        this.m_contactManager.m_contactFilter = filter;
    }
    /// Register a contact event listener. The listener is owned by you and must
    /// remain in scope.
    SetContactListener(listener) {
        this.m_contactManager.m_contactListener = listener;
    }
    /// Register a routine for debug drawing. The debug draw functions are called
    /// inside with b2World::DrawDebugData method. The debug draw object is owned
    /// by you and must remain in scope.
    SetDebugDraw(debugDraw) {
        this.m_debugDraw = debugDraw;
    }
    /// Create a rigid body given a definition. No reference to the definition
    /// is retained.
    /// @warning This function is locked during callbacks.
    CreateBody(def = {}) {
        if (this.IsLocked()) {
            throw new Error();
        }
        const b = new b2Body(def, this);
        // Add to world doubly linked list.
        b.m_prev = null;
        b.m_next = this.m_bodyList;
        if (this.m_bodyList) {
            this.m_bodyList.m_prev = b;
        }
        this.m_bodyList = b;
        ++this.m_bodyCount;
        return b;
    }
    /// Destroy a rigid body given a definition. No reference to the definition
    /// is retained. This function is locked during callbacks.
    /// @warning This automatically deletes all associated shapes and joints.
    /// @warning This function is locked during callbacks.
    DestroyBody(b) {
        // DEBUG: b2Assert(this.m_bodyCount > 0);
        if (this.IsLocked()) {
            throw new Error();
        }
        // Delete the attached joints.
        let je = b.m_jointList;
        while (je) {
            const je0 = je;
            je = je.next;
            if (this.m_destructionListener) {
                this.m_destructionListener.SayGoodbyeJoint(je0.joint);
            }
            this.DestroyJoint(je0.joint);
            b.m_jointList = je;
        }
        b.m_jointList = null;
        // #if B2_ENABLE_CONTROLLER
        // @see b2Controller list
        let coe = b.m_controllerList;
        while (coe) {
            const coe0 = coe;
            coe = coe.nextController;
            coe0.controller.RemoveBody(b);
        }
        // #endif
        // Delete the attached contacts.
        let ce = b.m_contactList;
        while (ce) {
            const ce0 = ce;
            ce = ce.next;
            this.m_contactManager.Destroy(ce0.contact);
        }
        b.m_contactList = null;
        // Delete the attached fixtures. This destroys broad-phase proxies.
        let f = b.m_fixtureList;
        while (f) {
            const f0 = f;
            f = f.m_next;
            if (this.m_destructionListener) {
                this.m_destructionListener.SayGoodbyeFixture(f0);
            }
            f0.DestroyProxies();
            f0.Destroy();
            b.m_fixtureList = f;
            b.m_fixtureCount -= 1;
        }
        b.m_fixtureList = null;
        b.m_fixtureCount = 0;
        // Remove world body list.
        if (b.m_prev) {
            b.m_prev.m_next = b.m_next;
        }
        if (b.m_next) {
            b.m_next.m_prev = b.m_prev;
        }
        if (b === this.m_bodyList) {
            this.m_bodyList = b.m_next;
        }
        --this.m_bodyCount;
    }
    static _Joint_Create(def, allocator) {
        switch (def.type) {
            case b2JointType.e_distanceJoint: return new b2DistanceJoint(def);
            case b2JointType.e_mouseJoint: return new b2MouseJoint(def);
            case b2JointType.e_prismaticJoint: return new b2PrismaticJoint(def);
            case b2JointType.e_revoluteJoint: return new b2RevoluteJoint(def);
            case b2JointType.e_pulleyJoint: return new b2PulleyJoint(def);
            case b2JointType.e_gearJoint: return new b2GearJoint(def);
            case b2JointType.e_wheelJoint: return new b2WheelJoint(def);
            case b2JointType.e_weldJoint: return new b2WeldJoint(def);
            case b2JointType.e_frictionJoint: return new b2FrictionJoint(def);
            case b2JointType.e_ropeJoint: return new b2RopeJoint(def);
            case b2JointType.e_motorJoint: return new b2MotorJoint(def);
            case b2JointType.e_areaJoint: return new b2AreaJoint(def);
        }
        throw new Error();
    }
    static _Joint_Destroy(joint, allocator) {
    }
    CreateJoint(def) {
        if (this.IsLocked()) {
            throw new Error();
        }
        const j = b2World._Joint_Create(def, null);
        // Connect to the world list.
        j.m_prev = null;
        j.m_next = this.m_jointList;
        if (this.m_jointList) {
            this.m_jointList.m_prev = j;
        }
        this.m_jointList = j;
        ++this.m_jointCount;
        // Connect to the bodies' doubly linked lists.
        // j.m_edgeA.joint = j;
        // j.m_edgeA.other = j.m_bodyB;
        j.m_edgeA.prev = null;
        j.m_edgeA.next = j.m_bodyA.m_jointList;
        if (j.m_bodyA.m_jointList) {
            j.m_bodyA.m_jointList.prev = j.m_edgeA;
        }
        j.m_bodyA.m_jointList = j.m_edgeA;
        // j.m_edgeB.joint = j;
        // j.m_edgeB.other = j.m_bodyA;
        j.m_edgeB.prev = null;
        j.m_edgeB.next = j.m_bodyB.m_jointList;
        if (j.m_bodyB.m_jointList) {
            j.m_bodyB.m_jointList.prev = j.m_edgeB;
        }
        j.m_bodyB.m_jointList = j.m_edgeB;
        const bodyA = def.bodyA;
        const bodyB = def.bodyB;
        // If the joint prevents collisions, then flag any contacts for filtering.
        if (!def.collideConnected) {
            let edge = bodyB.GetContactList();
            while (edge) {
                if (edge.other === bodyA) {
                    // Flag the contact for filtering at the next time step (where either
                    // body is awake).
                    edge.contact.FlagForFiltering();
                }
                edge = edge.next;
            }
        }
        // Note: creating a joint doesn't wake the bodies.
        return j;
    }
    /// Destroy a joint. This may cause the connected bodies to begin colliding.
    /// @warning This function is locked during callbacks.
    DestroyJoint(j) {
        if (this.IsLocked()) {
            throw new Error();
        }
        const collideConnected = j.m_collideConnected;
        // Remove from the doubly linked list.
        if (j.m_prev) {
            j.m_prev.m_next = j.m_next;
        }
        if (j.m_next) {
            j.m_next.m_prev = j.m_prev;
        }
        if (j === this.m_jointList) {
            this.m_jointList = j.m_next;
        }
        // Disconnect from island graph.
        const bodyA = j.m_bodyA;
        const bodyB = j.m_bodyB;
        // Wake up connected bodies.
        bodyA.SetAwake(true);
        bodyB.SetAwake(true);
        // Remove from body 1.
        if (j.m_edgeA.prev) {
            j.m_edgeA.prev.next = j.m_edgeA.next;
        }
        if (j.m_edgeA.next) {
            j.m_edgeA.next.prev = j.m_edgeA.prev;
        }
        if (j.m_edgeA === bodyA.m_jointList) {
            bodyA.m_jointList = j.m_edgeA.next;
        }
        j.m_edgeA.prev = null;
        j.m_edgeA.next = null;
        // Remove from body 2
        if (j.m_edgeB.prev) {
            j.m_edgeB.prev.next = j.m_edgeB.next;
        }
        if (j.m_edgeB.next) {
            j.m_edgeB.next.prev = j.m_edgeB.prev;
        }
        if (j.m_edgeB === bodyB.m_jointList) {
            bodyB.m_jointList = j.m_edgeB.next;
        }
        j.m_edgeB.prev = null;
        j.m_edgeB.next = null;
        b2World._Joint_Destroy(j, null);
        // DEBUG: b2Assert(this.m_jointCount > 0);
        --this.m_jointCount;
        // If the joint prevents collisions, then flag any contacts for filtering.
        if (!collideConnected) {
            let edge = bodyB.GetContactList();
            while (edge) {
                if (edge.other === bodyA) {
                    // Flag the contact for filtering at the next time step (where either
                    // body is awake).
                    edge.contact.FlagForFiltering();
                }
                edge = edge.next;
            }
        }
    }
    // #if B2_ENABLE_PARTICLE
    CreateParticleSystem(def) {
        if (this.IsLocked()) {
            throw new Error();
        }
        const p = new b2ParticleSystem(def, this);
        // Add to world doubly linked list.
        p.m_prev = null;
        p.m_next = this.m_particleSystemList;
        if (this.m_particleSystemList) {
            this.m_particleSystemList.m_prev = p;
        }
        this.m_particleSystemList = p;
        return p;
    }
    DestroyParticleSystem(p) {
        if (this.IsLocked()) {
            throw new Error();
        }
        // Remove world particleSystem list.
        if (p.m_prev) {
            p.m_prev.m_next = p.m_next;
        }
        if (p.m_next) {
            p.m_next.m_prev = p.m_prev;
        }
        if (p === this.m_particleSystemList) {
            this.m_particleSystemList = p.m_next;
        }
    }
    CalculateReasonableParticleIterations(timeStep) {
        if (this.m_particleSystemList === null) {
            return 1;
        }
        function GetSmallestRadius(world) {
            let smallestRadius = b2_maxFloat;
            for (let system = world.GetParticleSystemList(); system !== null; system = system.m_next) {
                smallestRadius = b2Min(smallestRadius, system.GetRadius());
            }
            return smallestRadius;
        }
        // Use the smallest radius, since that represents the worst-case.
        return b2CalculateParticleIterations(this.m_gravity.Length(), GetSmallestRadius(this), timeStep);
    }
    // #if B2_ENABLE_PARTICLE
    Step(dt, velocityIterations, positionIterations, particleIterations = this.CalculateReasonableParticleIterations(dt)) {
        // #else
        // public Step(dt: number, velocityIterations: number, positionIterations: number): void {
        // #endif
        const stepTimer = b2World.Step_s_stepTimer.Reset();
        // If new fixtures were added, we need to find the new contacts.
        if (this.m_newFixture) {
            this.m_contactManager.FindNewContacts();
            this.m_newFixture = false;
        }
        this.m_locked = true;
        const step = b2World.Step_s_step;
        step.dt = dt;
        step.velocityIterations = velocityIterations;
        step.positionIterations = positionIterations;
        // #if B2_ENABLE_PARTICLE
        step.particleIterations = particleIterations;
        // #endif
        if (dt > 0) {
            step.inv_dt = 1 / dt;
        }
        else {
            step.inv_dt = 0;
        }
        step.dtRatio = this.m_inv_dt0 * dt;
        step.warmStarting = this.m_warmStarting;
        // Update contacts. This is where some contacts are destroyed.
        const timer = b2World.Step_s_timer.Reset();
        this.m_contactManager.Collide();
        this.m_profile.collide = timer.GetMilliseconds();
        // Integrate velocities, solve velocity constraints, and integrate positions.
        if (this.m_stepComplete && step.dt > 0) {
            const timer = b2World.Step_s_timer.Reset();
            // #if B2_ENABLE_PARTICLE
            for (let p = this.m_particleSystemList; p; p = p.m_next) {
                p.Solve(step); // Particle Simulation
            }
            // #endif
            this.Solve(step);
            this.m_profile.solve = timer.GetMilliseconds();
        }
        // Handle TOI events.
        if (this.m_continuousPhysics && step.dt > 0) {
            const timer = b2World.Step_s_timer.Reset();
            this.SolveTOI(step);
            this.m_profile.solveTOI = timer.GetMilliseconds();
        }
        if (step.dt > 0) {
            this.m_inv_dt0 = step.inv_dt;
        }
        if (this.m_clearForces) {
            this.ClearForces();
        }
        this.m_locked = false;
        this.m_profile.step = stepTimer.GetMilliseconds();
    }
    /// Manually clear the force buffer on all bodies. By default, forces are cleared automatically
    /// after each call to Step. The default behavior is modified by calling SetAutoClearForces.
    /// The purpose of this function is to support sub-stepping. Sub-stepping is often used to maintain
    /// a fixed sized time step under a variable frame-rate.
    /// When you perform sub-stepping you will disable auto clearing of forces and instead call
    /// ClearForces after all sub-steps are complete in one pass of your game loop.
    /// @see SetAutoClearForces
    ClearForces() {
        for (let body = this.m_bodyList; body; body = body.m_next) {
            body.m_force.SetZero();
            body.m_torque = 0;
        }
    }
    // #if B2_ENABLE_PARTICLE
    DrawParticleSystem(system) {
        if (this.m_debugDraw === null) {
            return;
        }
        const particleCount = system.GetParticleCount();
        if (particleCount) {
            const radius = system.GetRadius();
            const positionBuffer = system.GetPositionBuffer();
            if (system.m_colorBuffer.data) {
                const colorBuffer = system.GetColorBuffer();
                this.m_debugDraw.DrawParticles(positionBuffer, radius, colorBuffer, particleCount);
            }
            else {
                this.m_debugDraw.DrawParticles(positionBuffer, radius, null, particleCount);
            }
        }
    }
    DrawDebugData() {
        if (this.m_debugDraw === null) {
            return;
        }
        const flags = this.m_debugDraw.GetFlags();
        const color = b2World.DrawDebugData_s_color.SetRGB(0, 0, 0);
        if (flags & b2DrawFlags.e_shapeBit) {
            for (let b = this.m_bodyList; b; b = b.m_next) {
                const xf = b.m_xf;
                this.m_debugDraw.PushTransform(xf);
                for (let f = b.GetFixtureList(); f; f = f.m_next) {
                    if (!b.IsActive()) {
                        color.SetRGB(0.5, 0.5, 0.3);
                        this.DrawShape(f, color);
                    }
                    else if (b.GetType() === b2BodyType.b2_staticBody) {
                        color.SetRGB(0.5, 0.9, 0.5);
                        this.DrawShape(f, color);
                    }
                    else if (b.GetType() === b2BodyType.b2_kinematicBody) {
                        color.SetRGB(0.5, 0.5, 0.9);
                        this.DrawShape(f, color);
                    }
                    else if (!b.IsAwake()) {
                        color.SetRGB(0.6, 0.6, 0.6);
                        this.DrawShape(f, color);
                    }
                    else {
                        color.SetRGB(0.9, 0.7, 0.7);
                        this.DrawShape(f, color);
                    }
                }
                this.m_debugDraw.PopTransform(xf);
            }
        }
        // #if B2_ENABLE_PARTICLE
        if (flags & b2DrawFlags.e_particleBit) {
            for (let p = this.m_particleSystemList; p; p = p.m_next) {
                this.DrawParticleSystem(p);
            }
        }
        // #endif
        if (flags & b2DrawFlags.e_jointBit) {
            for (let j = this.m_jointList; j; j = j.m_next) {
                this.DrawJoint(j);
            }
        }
        /*
        if (flags & b2DrawFlags.e_pairBit) {
          color.SetRGB(0.3, 0.9, 0.9);
          for (let contact = this.m_contactManager.m_contactList; contact; contact = contact.m_next) {
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();
    
            const cA = fixtureA.GetAABB().GetCenter();
            const cB = fixtureB.GetAABB().GetCenter();
    
            this.m_debugDraw.DrawSegment(cA, cB, color);
          }
        }
        */
        if (flags & b2DrawFlags.e_aabbBit) {
            color.SetRGB(0.9, 0.3, 0.9);
            const vs = b2World.DrawDebugData_s_vs;
            for (let b = this.m_bodyList; b; b = b.m_next) {
                if (!b.IsActive()) {
                    continue;
                }
                for (let f = b.GetFixtureList(); f; f = f.m_next) {
                    for (let i = 0; i < f.m_proxyCount; ++i) {
                        const proxy = f.m_proxies[i];
                        const aabb = proxy.treeNode.aabb;
                        vs[0].Set(aabb.lowerBound.x, aabb.lowerBound.y);
                        vs[1].Set(aabb.upperBound.x, aabb.lowerBound.y);
                        vs[2].Set(aabb.upperBound.x, aabb.upperBound.y);
                        vs[3].Set(aabb.lowerBound.x, aabb.upperBound.y);
                        this.m_debugDraw.DrawPolygon(vs, 4, color);
                    }
                }
            }
        }
        if (flags & b2DrawFlags.e_centerOfMassBit) {
            for (let b = this.m_bodyList; b; b = b.m_next) {
                const xf = b2World.DrawDebugData_s_xf;
                xf.q.Copy(b.m_xf.q);
                xf.p.Copy(b.GetWorldCenter());
                this.m_debugDraw.DrawTransform(xf);
            }
        }
        // #if B2_ENABLE_CONTROLLER
        // @see b2Controller list
        if (flags & b2DrawFlags.e_controllerBit) {
            for (let c = this.m_controllerList; c; c = c.m_next) {
                c.Draw(this.m_debugDraw);
            }
        }
        // #endif
    }
    /// Query the world for all fixtures that potentially overlap the
    /// provided AABB.
    /// @param callback a user implemented callback class.
    /// @param aabb the query box.
    QueryAABB(callback, aabb, fn) {
        this.m_contactManager.m_broadPhase.Query(aabb, (proxy) => {
            const fixture_proxy = proxy.userData;
            // DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
            const fixture = fixture_proxy.fixture;
            if (callback) {
                return callback.ReportFixture(fixture);
            }
            else if (fn) {
                return fn(fixture);
            }
            return true;
        });
        // #if B2_ENABLE_PARTICLE
        if (callback instanceof b2QueryCallback) {
            for (let p = this.m_particleSystemList; p; p = p.m_next) {
                if (callback.ShouldQueryParticleSystem(p)) {
                    p.QueryAABB(callback, aabb);
                }
            }
        }
        // #endif
    }
    QueryAllAABB(aabb, out = []) {
        this.QueryAABB(null, aabb, (fixture) => { out.push(fixture); return true; });
        return out;
    }
    /// Query the world for all fixtures that potentially overlap the
    /// provided point.
    /// @param callback a user implemented callback class.
    /// @param point the query point.
    QueryPointAABB(callback, point, fn) {
        this.m_contactManager.m_broadPhase.QueryPoint(point, (proxy) => {
            const fixture_proxy = proxy.userData;
            // DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
            const fixture = fixture_proxy.fixture;
            if (callback) {
                return callback.ReportFixture(fixture);
            }
            else if (fn) {
                return fn(fixture);
            }
            return true;
        });
        // #if B2_ENABLE_PARTICLE
        if (callback instanceof b2QueryCallback) {
            for (let p = this.m_particleSystemList; p; p = p.m_next) {
                if (callback.ShouldQueryParticleSystem(p)) {
                    p.QueryPointAABB(callback, point);
                }
            }
        }
        // #endif
    }
    QueryAllPointAABB(point, out = []) {
        this.QueryPointAABB(null, point, (fixture) => { out.push(fixture); return true; });
        return out;
    }
    QueryFixtureShape(callback, shape, index, transform, fn) {
        const aabb = b2World.QueryFixtureShape_s_aabb;
        shape.ComputeAABB(aabb, transform, index);
        this.m_contactManager.m_broadPhase.Query(aabb, (proxy) => {
            const fixture_proxy = proxy.userData;
            // DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
            const fixture = fixture_proxy.fixture;
            if (b2TestOverlapShape(shape, index, fixture.GetShape(), fixture_proxy.childIndex, transform, fixture.GetBody().GetTransform())) {
                if (callback) {
                    return callback.ReportFixture(fixture);
                }
                else if (fn) {
                    return fn(fixture);
                }
            }
            return true;
        });
        // #if B2_ENABLE_PARTICLE
        if (callback instanceof b2QueryCallback) {
            for (let p = this.m_particleSystemList; p; p = p.m_next) {
                if (callback.ShouldQueryParticleSystem(p)) {
                    p.QueryAABB(callback, aabb);
                }
            }
        }
        // #endif
    }
    QueryAllFixtureShape(shape, index, transform, out = []) {
        this.QueryFixtureShape(null, shape, index, transform, (fixture) => { out.push(fixture); return true; });
        return out;
    }
    QueryFixturePoint(callback, point, fn) {
        this.m_contactManager.m_broadPhase.QueryPoint(point, (proxy) => {
            const fixture_proxy = proxy.userData;
            // DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
            const fixture = fixture_proxy.fixture;
            if (fixture.TestPoint(point)) {
                if (callback) {
                    return callback.ReportFixture(fixture);
                }
                else if (fn) {
                    return fn(fixture);
                }
            }
            return true;
        });
        // #if B2_ENABLE_PARTICLE
        if (callback) {
            for (let p = this.m_particleSystemList; p; p = p.m_next) {
                if (callback.ShouldQueryParticleSystem(p)) {
                    p.QueryPointAABB(callback, point);
                }
            }
        }
        // #endif
    }
    QueryAllFixturePoint(point, out = []) {
        this.QueryFixturePoint(null, point, (fixture) => { out.push(fixture); return true; });
        return out;
    }
    RayCast(callback, point1, point2, fn) {
        const input = b2World.RayCast_s_input;
        input.maxFraction = 1;
        input.p1.Copy(point1);
        input.p2.Copy(point2);
        this.m_contactManager.m_broadPhase.RayCast(input, (input, proxy) => {
            const fixture_proxy = proxy.userData;
            // DEBUG: b2Assert(fixture_proxy instanceof b2FixtureProxy);
            const fixture = fixture_proxy.fixture;
            const index = fixture_proxy.childIndex;
            const output = b2World.RayCast_s_output;
            const hit = fixture.RayCast(output, input, index);
            if (hit) {
                const fraction = output.fraction;
                const point = b2World.RayCast_s_point;
                point.Set((1 - fraction) * point1.x + fraction * point2.x, (1 - fraction) * point1.y + fraction * point2.y);
                if (callback) {
                    return callback.ReportFixture(fixture, point, output.normal, fraction);
                }
                else if (fn) {
                    return fn(fixture, point, output.normal, fraction);
                }
            }
            return input.maxFraction;
        });
        // #if B2_ENABLE_PARTICLE
        if (callback) {
            for (let p = this.m_particleSystemList; p; p = p.m_next) {
                if (callback.ShouldQueryParticleSystem(p)) {
                    p.RayCast(callback, point1, point2);
                }
            }
        }
        // #endif
    }
    RayCastOne(point1, point2) {
        let result = null;
        let min_fraction = 1;
        this.RayCast(null, point1, point2, (fixture, point, normal, fraction) => {
            if (fraction < min_fraction) {
                min_fraction = fraction;
                result = fixture;
            }
            return min_fraction;
        });
        return result;
    }
    RayCastAll(point1, point2, out = []) {
        this.RayCast(null, point1, point2, (fixture, point, normal, fraction) => {
            out.push(fixture);
            return 1;
        });
        return out;
    }
    /// Get the world body list. With the returned body, use b2Body::GetNext to get
    /// the next body in the world list. A NULL body indicates the end of the list.
    /// @return the head of the world body list.
    GetBodyList() {
        return this.m_bodyList;
    }
    /// Get the world joint list. With the returned joint, use b2Joint::GetNext to get
    /// the next joint in the world list. A NULL joint indicates the end of the list.
    /// @return the head of the world joint list.
    GetJointList() {
        return this.m_jointList;
    }
    // #if B2_ENABLE_PARTICLE
    GetParticleSystemList() {
        return this.m_particleSystemList;
    }
    // #endif
    /// Get the world contact list. With the returned contact, use b2Contact::GetNext to get
    /// the next contact in the world list. A NULL contact indicates the end of the list.
    /// @return the head of the world contact list.
    /// @warning contacts are created and destroyed in the middle of a time step.
    /// Use b2ContactListener to avoid missing contacts.
    GetContactList() {
        return this.m_contactManager.m_contactList;
    }
    /// Enable/disable sleep.
    SetAllowSleeping(flag) {
        if (flag === this.m_allowSleep) {
            return;
        }
        this.m_allowSleep = flag;
        if (!this.m_allowSleep) {
            for (let b = this.m_bodyList; b; b = b.m_next) {
                b.SetAwake(true);
            }
        }
    }
    GetAllowSleeping() {
        return this.m_allowSleep;
    }
    /// Enable/disable warm starting. For testing.
    SetWarmStarting(flag) {
        this.m_warmStarting = flag;
    }
    GetWarmStarting() {
        return this.m_warmStarting;
    }
    /// Enable/disable continuous physics. For testing.
    SetContinuousPhysics(flag) {
        this.m_continuousPhysics = flag;
    }
    GetContinuousPhysics() {
        return this.m_continuousPhysics;
    }
    /// Enable/disable single stepped continuous physics. For testing.
    SetSubStepping(flag) {
        this.m_subStepping = flag;
    }
    GetSubStepping() {
        return this.m_subStepping;
    }
    /// Get the number of broad-phase proxies.
    GetProxyCount() {
        return this.m_contactManager.m_broadPhase.GetProxyCount();
    }
    /// Get the number of bodies.
    GetBodyCount() {
        return this.m_bodyCount;
    }
    /// Get the number of joints.
    GetJointCount() {
        return this.m_jointCount;
    }
    /// Get the number of contacts (each may have 0 or more contact points).
    GetContactCount() {
        return this.m_contactManager.m_contactCount;
    }
    /// Get the height of the dynamic tree.
    GetTreeHeight() {
        return this.m_contactManager.m_broadPhase.GetTreeHeight();
    }
    /// Get the balance of the dynamic tree.
    GetTreeBalance() {
        return this.m_contactManager.m_broadPhase.GetTreeBalance();
    }
    /// Get the quality metric of the dynamic tree. The smaller the better.
    /// The minimum is 1.
    GetTreeQuality() {
        return this.m_contactManager.m_broadPhase.GetTreeQuality();
    }
    /// Change the global gravity vector.
    SetGravity(gravity, wake = true) {
        if (!b2Vec2.IsEqualToV(this.m_gravity, gravity)) {
            this.m_gravity.Copy(gravity);
            if (wake) {
                for (let b = this.m_bodyList; b; b = b.m_next) {
                    b.SetAwake(true);
                }
            }
        }
    }
    /// Get the global gravity vector.
    GetGravity() {
        return this.m_gravity;
    }
    /// Is the world locked (in the middle of a time step).
    IsLocked() {
        return this.m_locked;
    }
    /// Set flag to control automatic clearing of forces after each time step.
    SetAutoClearForces(flag) {
        this.m_clearForces = flag;
    }
    /// Get the flag that controls automatic clearing of forces after each time step.
    GetAutoClearForces() {
        return this.m_clearForces;
    }
    /// Shift the world origin. Useful for large worlds.
    /// The body shift formula is: position -= newOrigin
    /// @param newOrigin the new origin with respect to the old origin
    ShiftOrigin(newOrigin) {
        if (this.IsLocked()) {
            throw new Error();
        }
        for (let b = this.m_bodyList; b; b = b.m_next) {
            b.m_xf.p.SelfSub(newOrigin);
            b.m_sweep.c0.SelfSub(newOrigin);
            b.m_sweep.c.SelfSub(newOrigin);
        }
        for (let j = this.m_jointList; j; j = j.m_next) {
            j.ShiftOrigin(newOrigin);
        }
        this.m_contactManager.m_broadPhase.ShiftOrigin(newOrigin);
    }
    /// Get the contact manager for testing.
    GetContactManager() {
        return this.m_contactManager;
    }
    /// Get the current profile.
    GetProfile() {
        return this.m_profile;
    }
    /// Dump the world into the log file.
    /// @warning this should be called outside of a time step.
    Dump(log) {
        if (this.m_locked) {
            return;
        }
        log("const g: b2Vec2 = new b2Vec2(%.15f, %.15f);\n", this.m_gravity.x, this.m_gravity.y);
        log("this.m_world.SetGravity(g);\n");
        log("const bodies: b2Body[] = [];\n");
        log("const joints: b2Joint[] = [];\n");
        let i = 0;
        for (let b = this.m_bodyList; b; b = b.m_next) {
            b.m_islandIndex = i;
            b.Dump(log);
            ++i;
        }
        i = 0;
        for (let j = this.m_jointList; j; j = j.m_next) {
            j.m_index = i;
            ++i;
        }
        // First pass on joints, skip gear joints.
        for (let j = this.m_jointList; j; j = j.m_next) {
            if (j.m_type === b2JointType.e_gearJoint) {
                continue;
            }
            log("{\n");
            j.Dump(log);
            log("}\n");
        }
        // Second pass on joints, only gear joints.
        for (let j = this.m_jointList; j; j = j.m_next) {
            if (j.m_type !== b2JointType.e_gearJoint) {
                continue;
            }
            log("{\n");
            j.Dump(log);
            log("}\n");
        }
    }
    DrawJoint(joint) {
        if (this.m_debugDraw === null) {
            return;
        }
        const bodyA = joint.GetBodyA();
        const bodyB = joint.GetBodyB();
        const xf1 = bodyA.m_xf;
        const xf2 = bodyB.m_xf;
        const x1 = xf1.p;
        const x2 = xf2.p;
        const p1 = joint.GetAnchorA(b2World.DrawJoint_s_p1);
        const p2 = joint.GetAnchorB(b2World.DrawJoint_s_p2);
        const color = b2World.DrawJoint_s_color.SetRGB(0.5, 0.8, 0.8);
        switch (joint.m_type) {
            case b2JointType.e_distanceJoint:
                this.m_debugDraw.DrawSegment(p1, p2, color);
                break;
            case b2JointType.e_pulleyJoint: {
                const pulley = joint;
                const s1 = pulley.GetGroundAnchorA();
                const s2 = pulley.GetGroundAnchorB();
                this.m_debugDraw.DrawSegment(s1, p1, color);
                this.m_debugDraw.DrawSegment(s2, p2, color);
                this.m_debugDraw.DrawSegment(s1, s2, color);
                break;
            }
            case b2JointType.e_mouseJoint: {
                const c = b2World.DrawJoint_s_c;
                c.Set(0.0, 1.0, 0.0);
                this.m_debugDraw.DrawPoint(p1, 4.0, c);
                this.m_debugDraw.DrawPoint(p2, 4.0, c);
                c.Set(0.8, 0.8, 0.8);
                this.m_debugDraw.DrawSegment(p1, p2, c);
                break;
            }
            default:
                this.m_debugDraw.DrawSegment(x1, p1, color);
                this.m_debugDraw.DrawSegment(p1, p2, color);
                this.m_debugDraw.DrawSegment(x2, p2, color);
        }
    }
    DrawShape(fixture, color) {
        if (this.m_debugDraw === null) {
            return;
        }
        const shape = fixture.GetShape();
        switch (shape.m_type) {
            case b2ShapeType.e_circleShape: {
                const circle = shape;
                const center = circle.m_p;
                const radius = circle.m_radius;
                const axis = b2Vec2.UNITX;
                this.m_debugDraw.DrawSolidCircle(center, radius, axis, color);
                break;
            }
            case b2ShapeType.e_edgeShape: {
                const edge = shape;
                const v1 = edge.m_vertex1;
                const v2 = edge.m_vertex2;
                this.m_debugDraw.DrawSegment(v1, v2, color);
                break;
            }
            case b2ShapeType.e_chainShape: {
                const chain = shape;
                const count = chain.m_count;
                const vertices = chain.m_vertices;
                const ghostColor = b2World.DrawShape_s_ghostColor.SetRGBA(0.75 * color.r, 0.75 * color.g, 0.75 * color.b, color.a);
                let v1 = vertices[0];
                this.m_debugDraw.DrawPoint(v1, 4.0, color);
                if (chain.m_hasPrevVertex) {
                    const vp = chain.m_prevVertex;
                    this.m_debugDraw.DrawSegment(vp, v1, ghostColor);
                    this.m_debugDraw.DrawCircle(vp, 0.1, ghostColor);
                }
                for (let i = 1; i < count; ++i) {
                    const v2 = vertices[i];
                    this.m_debugDraw.DrawSegment(v1, v2, color);
                    this.m_debugDraw.DrawPoint(v2, 4.0, color);
                    v1 = v2;
                }
                if (chain.m_hasNextVertex) {
                    const vn = chain.m_nextVertex;
                    this.m_debugDraw.DrawSegment(vn, v1, ghostColor);
                    this.m_debugDraw.DrawCircle(vn, 0.1, ghostColor);
                }
                break;
            }
            case b2ShapeType.e_polygonShape: {
                const poly = shape;
                const vertexCount = poly.m_count;
                const vertices = poly.m_vertices;
                this.m_debugDraw.DrawSolidPolygon(vertices, vertexCount, color);
                break;
            }
        }
    }
    Solve(step) {
        // #if B2_ENABLE_PARTICLE
        // update previous transforms
        for (let b = this.m_bodyList; b; b = b.m_next) {
            b.m_xf0.Copy(b.m_xf);
        }
        // #endif
        // #if B2_ENABLE_CONTROLLER
        // @see b2Controller list
        for (let controller = this.m_controllerList; controller; controller = controller.m_next) {
            controller.Step(step);
        }
        // #endif
        this.m_profile.solveInit = 0;
        this.m_profile.solveVelocity = 0;
        this.m_profile.solvePosition = 0;
        // Size the island for the worst case.
        const island = this.m_island;
        island.Initialize(this.m_bodyCount, this.m_contactManager.m_contactCount, this.m_jointCount, null, // this.m_stackAllocator,
        this.m_contactManager.m_contactListener);
        // Clear all the island flags.
        for (let b = this.m_bodyList; b; b = b.m_next) {
            b.m_islandFlag = false;
        }
        for (let c = this.m_contactManager.m_contactList; c; c = c.m_next) {
            c.m_islandFlag = false;
        }
        for (let j = this.m_jointList; j; j = j.m_next) {
            j.m_islandFlag = false;
        }
        // Build and simulate all awake islands.
        // DEBUG: const stackSize: number = this.m_bodyCount;
        const stack = this.s_stack;
        for (let seed = this.m_bodyList; seed; seed = seed.m_next) {
            if (seed.m_islandFlag) {
                continue;
            }
            if (!seed.IsAwake() || !seed.IsActive()) {
                continue;
            }
            // The seed can be dynamic or kinematic.
            if (seed.GetType() === b2BodyType.b2_staticBody) {
                continue;
            }
            // Reset island and stack.
            island.Clear();
            let stackCount = 0;
            stack[stackCount++] = seed;
            seed.m_islandFlag = true;
            // Perform a depth first search (DFS) on the constraint graph.
            while (stackCount > 0) {
                // Grab the next body off the stack and add it to the island.
                const b = stack[--stackCount];
                if (!b) {
                    throw new Error();
                }
                // DEBUG: b2Assert(b.IsActive());
                island.AddBody(b);
                // Make sure the body is awake. (without resetting sleep timer).
                b.m_awakeFlag = true;
                // To keep islands as small as possible, we don't
                // propagate islands across static bodies.
                if (b.GetType() === b2BodyType.b2_staticBody) {
                    continue;
                }
                // Search all contacts connected to this body.
                for (let ce = b.m_contactList; ce; ce = ce.next) {
                    const contact = ce.contact;
                    // Has this contact already been added to an island?
                    if (contact.m_islandFlag) {
                        continue;
                    }
                    // Is this contact solid and touching?
                    if (!contact.IsEnabled() || !contact.IsTouching()) {
                        continue;
                    }
                    // Skip sensors.
                    const sensorA = contact.m_fixtureA.m_isSensor;
                    const sensorB = contact.m_fixtureB.m_isSensor;
                    if (sensorA || sensorB) {
                        continue;
                    }
                    island.AddContact(contact);
                    contact.m_islandFlag = true;
                    const other = ce.other;
                    if (!other) {
                        throw new Error();
                    }
                    // Was the other body already added to this island?
                    if (other.m_islandFlag) {
                        continue;
                    }
                    // DEBUG: b2Assert(stackCount < stackSize);
                    stack[stackCount++] = other;
                    other.m_islandFlag = true;
                }
                // Search all joints connect to this body.
                for (let je = b.m_jointList; je; je = je.next) {
                    if (je.joint.m_islandFlag) {
                        continue;
                    }
                    const other = je.other;
                    // Don't simulate joints connected to inactive bodies.
                    if (!other.IsActive()) {
                        continue;
                    }
                    island.AddJoint(je.joint);
                    je.joint.m_islandFlag = true;
                    if (other.m_islandFlag) {
                        continue;
                    }
                    // DEBUG: b2Assert(stackCount < stackSize);
                    stack[stackCount++] = other;
                    other.m_islandFlag = true;
                }
            }
            const profile = new b2Profile();
            island.Solve(profile, step, this.m_gravity, this.m_allowSleep);
            this.m_profile.solveInit += profile.solveInit;
            this.m_profile.solveVelocity += profile.solveVelocity;
            this.m_profile.solvePosition += profile.solvePosition;
            // Post solve cleanup.
            for (let i = 0; i < island.m_bodyCount; ++i) {
                // Allow static bodies to participate in other islands.
                const b = island.m_bodies[i];
                if (b.GetType() === b2BodyType.b2_staticBody) {
                    b.m_islandFlag = false;
                }
            }
        }
        for (let i = 0; i < stack.length; ++i) {
            if (!stack[i]) {
                break;
            }
            stack[i] = null;
        }
        const timer = new b2Timer();
        // Synchronize fixtures, check for out of range bodies.
        for (let b = this.m_bodyList; b; b = b.m_next) {
            // If a body was not in an island then it did not move.
            if (!b.m_islandFlag) {
                continue;
            }
            if (b.GetType() === b2BodyType.b2_staticBody) {
                continue;
            }
            // Update fixtures (for broad-phase).
            b.SynchronizeFixtures();
        }
        // Look for new contacts.
        this.m_contactManager.FindNewContacts();
        this.m_profile.broadphase = timer.GetMilliseconds();
    }
    SolveTOI(step) {
        // b2Island island(2 * b2_maxTOIContacts, b2_maxTOIContacts, 0, &m_stackAllocator, m_contactManager.m_contactListener);
        const island = this.m_island;
        island.Initialize(2 * b2_maxTOIContacts, b2_maxTOIContacts, 0, null, this.m_contactManager.m_contactListener);
        if (this.m_stepComplete) {
            for (let b = this.m_bodyList; b; b = b.m_next) {
                b.m_islandFlag = false;
                b.m_sweep.alpha0 = 0;
            }
            for (let c = this.m_contactManager.m_contactList; c; c = c.m_next) {
                // Invalidate TOI
                c.m_toiFlag = false;
                c.m_islandFlag = false;
                c.m_toiCount = 0;
                c.m_toi = 1;
            }
        }
        // Find TOI events and solve them.
        for (;;) {
            // Find the first TOI.
            let minContact = null;
            let minAlpha = 1;
            for (let c = this.m_contactManager.m_contactList; c; c = c.m_next) {
                // Is this contact disabled?
                if (!c.IsEnabled()) {
                    continue;
                }
                // Prevent excessive sub-stepping.
                if (c.m_toiCount > b2_maxSubSteps) {
                    continue;
                }
                let alpha = 1;
                if (c.m_toiFlag) {
                    // This contact has a valid cached TOI.
                    alpha = c.m_toi;
                }
                else {
                    const fA = c.GetFixtureA();
                    const fB = c.GetFixtureB();
                    // Is there a sensor?
                    if (fA.IsSensor() || fB.IsSensor()) {
                        continue;
                    }
                    const bA = fA.GetBody();
                    const bB = fB.GetBody();
                    const typeA = bA.m_type;
                    const typeB = bB.m_type;
                    // DEBUG: b2Assert(typeA !== b2BodyType.b2_staticBody || typeB !== b2BodyType.b2_staticBody);
                    const activeA = bA.IsAwake() && typeA !== b2BodyType.b2_staticBody;
                    const activeB = bB.IsAwake() && typeB !== b2BodyType.b2_staticBody;
                    // Is at least one body active (awake and dynamic or kinematic)?
                    if (!activeA && !activeB) {
                        continue;
                    }
                    const collideA = bA.IsBullet() || typeA !== b2BodyType.b2_dynamicBody;
                    const collideB = bB.IsBullet() || typeB !== b2BodyType.b2_dynamicBody;
                    // Are these two non-bullet dynamic bodies?
                    if (!collideA && !collideB) {
                        continue;
                    }
                    // Compute the TOI for this contact.
                    // Put the sweeps onto the same time interval.
                    let alpha0 = bA.m_sweep.alpha0;
                    if (bA.m_sweep.alpha0 < bB.m_sweep.alpha0) {
                        alpha0 = bB.m_sweep.alpha0;
                        bA.m_sweep.Advance(alpha0);
                    }
                    else if (bB.m_sweep.alpha0 < bA.m_sweep.alpha0) {
                        alpha0 = bA.m_sweep.alpha0;
                        bB.m_sweep.Advance(alpha0);
                    }
                    // DEBUG: b2Assert(alpha0 < 1);
                    const indexA = c.GetChildIndexA();
                    const indexB = c.GetChildIndexB();
                    // Compute the time of impact in interval [0, minTOI]
                    const input = b2World.SolveTOI_s_toi_input;
                    input.proxyA.SetShape(fA.GetShape(), indexA);
                    input.proxyB.SetShape(fB.GetShape(), indexB);
                    input.sweepA.Copy(bA.m_sweep);
                    input.sweepB.Copy(bB.m_sweep);
                    input.tMax = 1;
                    const output = b2World.SolveTOI_s_toi_output;
                    b2TimeOfImpact(output, input);
                    // Beta is the fraction of the remaining portion of the .
                    const beta = output.t;
                    if (output.state === b2TOIOutputState.e_touching) {
                        alpha = b2Min(alpha0 + (1 - alpha0) * beta, 1);
                    }
                    else {
                        alpha = 1;
                    }
                    c.m_toi = alpha;
                    c.m_toiFlag = true;
                }
                if (alpha < minAlpha) {
                    // This is the minimum TOI found so far.
                    minContact = c;
                    minAlpha = alpha;
                }
            }
            if (minContact === null || 1 - 10 * b2_epsilon < minAlpha) {
                // No more TOI events. Done!
                this.m_stepComplete = true;
                break;
            }
            // Advance the bodies to the TOI.
            const fA = minContact.GetFixtureA();
            const fB = minContact.GetFixtureB();
            const bA = fA.GetBody();
            const bB = fB.GetBody();
            const backup1 = b2World.SolveTOI_s_backup1.Copy(bA.m_sweep);
            const backup2 = b2World.SolveTOI_s_backup2.Copy(bB.m_sweep);
            bA.Advance(minAlpha);
            bB.Advance(minAlpha);
            // The TOI contact likely has some new contact points.
            minContact.Update(this.m_contactManager.m_contactListener);
            minContact.m_toiFlag = false;
            ++minContact.m_toiCount;
            // Is the contact solid?
            if (!minContact.IsEnabled() || !minContact.IsTouching()) {
                // Restore the sweeps.
                minContact.SetEnabled(false);
                bA.m_sweep.Copy(backup1);
                bB.m_sweep.Copy(backup2);
                bA.SynchronizeTransform();
                bB.SynchronizeTransform();
                continue;
            }
            bA.SetAwake(true);
            bB.SetAwake(true);
            // Build the island
            island.Clear();
            island.AddBody(bA);
            island.AddBody(bB);
            island.AddContact(minContact);
            bA.m_islandFlag = true;
            bB.m_islandFlag = true;
            minContact.m_islandFlag = true;
            // Get contacts on bodyA and bodyB.
            // const bodies: b2Body[] = [bA, bB];
            for (let i = 0; i < 2; ++i) {
                const body = (i === 0) ? (bA) : (bB); // bodies[i];
                if (body.m_type === b2BodyType.b2_dynamicBody) {
                    for (let ce = body.m_contactList; ce; ce = ce.next) {
                        if (island.m_bodyCount === island.m_bodyCapacity) {
                            break;
                        }
                        if (island.m_contactCount === island.m_contactCapacity) {
                            break;
                        }
                        const contact = ce.contact;
                        // Has this contact already been added to the island?
                        if (contact.m_islandFlag) {
                            continue;
                        }
                        // Only add static, kinematic, or bullet bodies.
                        const other = ce.other;
                        if (other.m_type === b2BodyType.b2_dynamicBody &&
                            !body.IsBullet() && !other.IsBullet()) {
                            continue;
                        }
                        // Skip sensors.
                        const sensorA = contact.m_fixtureA.m_isSensor;
                        const sensorB = contact.m_fixtureB.m_isSensor;
                        if (sensorA || sensorB) {
                            continue;
                        }
                        // Tentatively advance the body to the TOI.
                        const backup = b2World.SolveTOI_s_backup.Copy(other.m_sweep);
                        if (!other.m_islandFlag) {
                            other.Advance(minAlpha);
                        }
                        // Update the contact points
                        contact.Update(this.m_contactManager.m_contactListener);
                        // Was the contact disabled by the user?
                        if (!contact.IsEnabled()) {
                            other.m_sweep.Copy(backup);
                            other.SynchronizeTransform();
                            continue;
                        }
                        // Are there contact points?
                        if (!contact.IsTouching()) {
                            other.m_sweep.Copy(backup);
                            other.SynchronizeTransform();
                            continue;
                        }
                        // Add the contact to the island
                        contact.m_islandFlag = true;
                        island.AddContact(contact);
                        // Has the other body already been added to the island?
                        if (other.m_islandFlag) {
                            continue;
                        }
                        // Add the other body to the island.
                        other.m_islandFlag = true;
                        if (other.m_type !== b2BodyType.b2_staticBody) {
                            other.SetAwake(true);
                        }
                        island.AddBody(other);
                    }
                }
            }
            const subStep = b2World.SolveTOI_s_subStep;
            subStep.dt = (1 - minAlpha) * step.dt;
            subStep.inv_dt = 1 / subStep.dt;
            subStep.dtRatio = 1;
            subStep.positionIterations = 20;
            subStep.velocityIterations = step.velocityIterations;
            // #if B2_ENABLE_PARTICLE
            subStep.particleIterations = step.particleIterations;
            // #endif
            subStep.warmStarting = false;
            island.SolveTOI(subStep, bA.m_islandIndex, bB.m_islandIndex);
            // Reset island flags and synchronize broad-phase proxies.
            for (let i = 0; i < island.m_bodyCount; ++i) {
                const body = island.m_bodies[i];
                body.m_islandFlag = false;
                if (body.m_type !== b2BodyType.b2_dynamicBody) {
                    continue;
                }
                body.SynchronizeFixtures();
                // Invalidate all contact TOIs on this displaced body.
                for (let ce = body.m_contactList; ce; ce = ce.next) {
                    ce.contact.m_toiFlag = false;
                    ce.contact.m_islandFlag = false;
                }
            }
            // Commit fixture proxy movements to the broad-phase so that new contacts are created.
            // Also, some contacts can be destroyed.
            this.m_contactManager.FindNewContacts();
            if (this.m_subStepping) {
                this.m_stepComplete = false;
                break;
            }
        }
    }
    // #if B2_ENABLE_CONTROLLER
    AddController(controller) {
        // b2Assert(controller.m_world === null, "Controller can only be a member of one world");
        // controller.m_world = this;
        controller.m_next = this.m_controllerList;
        controller.m_prev = null;
        if (this.m_controllerList) {
            this.m_controllerList.m_prev = controller;
        }
        this.m_controllerList = controller;
        ++this.m_controllerCount;
        return controller;
    }
    RemoveController(controller) {
        // b2Assert(controller.m_world === this, "Controller is not a member of this world");
        if (controller.m_prev) {
            controller.m_prev.m_next = controller.m_next;
        }
        if (controller.m_next) {
            controller.m_next.m_prev = controller.m_prev;
        }
        if (this.m_controllerList === controller) {
            this.m_controllerList = controller.m_next;
        }
        --this.m_controllerCount;
        controller.m_prev = null;
        controller.m_next = null;
        // delete controller.m_world; // = null;
        return controller;
    }
}
// #endif
/// Take a time step. This performs collision detection, integration,
/// and constraint solution.
/// @param timeStep the amount of time to simulate, this should not vary.
/// @param velocityIterations for the velocity constraint solver.
/// @param positionIterations for the position constraint solver.
b2World.Step_s_step = new b2TimeStep();
b2World.Step_s_stepTimer = new b2Timer();
b2World.Step_s_timer = new b2Timer();
// #endif
/// Call this to draw shapes and other debug draw data.
b2World.DrawDebugData_s_color = new b2Color(0, 0, 0);
b2World.DrawDebugData_s_vs = b2Vec2.MakeArray(4);
b2World.DrawDebugData_s_xf = new b2Transform();
b2World.QueryFixtureShape_s_aabb = new b2AABB();
/// Ray-cast the world for all fixtures in the path of the ray. Your callback
/// controls whether you get the closest point, any point, or n-points.
/// The ray-cast ignores shapes that contain the starting point.
/// @param callback a user implemented callback class.
/// @param point1 the ray starting point
/// @param point2 the ray ending point
b2World.RayCast_s_input = new b2RayCastInput();
b2World.RayCast_s_output = new b2RayCastOutput();
b2World.RayCast_s_point = new b2Vec2();
b2World.DrawJoint_s_p1 = new b2Vec2();
b2World.DrawJoint_s_p2 = new b2Vec2();
b2World.DrawJoint_s_color = new b2Color(0.5, 0.8, 0.8);
b2World.DrawJoint_s_c = new b2Color();
b2World.DrawShape_s_ghostColor = new b2Color();
b2World.SolveTOI_s_subStep = new b2TimeStep();
b2World.SolveTOI_s_backup = new b2Sweep();
b2World.SolveTOI_s_backup1 = new b2Sweep();
b2World.SolveTOI_s_backup2 = new b2Sweep();
b2World.SolveTOI_s_toi_input = new b2TOIInput();
b2World.SolveTOI_s_toi_output = new b2TOIOutput();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJXb3JsZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0R5bmFtaWNzL2IyV29ybGQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRiwwREFBMEQ7QUFDMUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNyRixPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFNLE1BQU0sa0JBQWtCLENBQUM7QUFDM0UsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzVDLE9BQU8sRUFBRSxPQUFPLEVBQVUsV0FBVyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDaEUsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLGtCQUFrQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFdkcsT0FBTyxFQUFFLGNBQWMsRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFDeEcsT0FBTyxFQUFXLFdBQVcsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBTW5FLE9BQU8sRUFBd0IsV0FBVyxFQUFlLE1BQU0sa0JBQWtCLENBQUM7QUFDbEYsT0FBTyxFQUFFLFdBQVcsRUFBbUIsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRSxPQUFPLEVBQUUsZUFBZSxFQUF1QixNQUFNLDBCQUEwQixDQUFDO0FBQ2hGLE9BQU8sRUFBRSxlQUFlLEVBQXVCLE1BQU0sMEJBQTBCLENBQUM7QUFDaEYsT0FBTyxFQUFFLFdBQVcsRUFBbUIsTUFBTSxzQkFBc0IsQ0FBQztBQUNwRSxPQUFPLEVBQUUsWUFBWSxFQUFvQixNQUFNLHVCQUF1QixDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxZQUFZLEVBQW9CLE1BQU0sdUJBQXVCLENBQUM7QUFDdkUsT0FB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