/*
* Copyright (c) 2006-2009 Erin Catto http://www.box2d.org
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
import { b2_maxFloat, b2_timeToSleep } from "../Common/b2Settings";
import { b2_maxTranslation, b2_maxTranslationSquared } from "../Common/b2Settings";
import { b2_maxRotation, b2_maxRotationSquared } from "../Common/b2Settings";
import { b2_linearSleepTolerance, b2_angularSleepTolerance } from "../Common/b2Settings";
import { b2Abs, b2Min, b2Max, b2Vec2 } from "../Common/b2Math";
import { b2Timer } from "../Common/b2Timer";
import { b2ContactSolver, b2ContactSolverDef } from "./Contacts/b2ContactSolver";
import { b2BodyType } from "./b2Body";
import { b2SolverData, b2Position, b2Velocity } from "./b2TimeStep";
import { b2ContactImpulse } from "./b2WorldCallbacks";
/*
Position Correction Notes
=========================
I tried the several algorithms for position correction of the 2D revolute joint.
I looked at these systems:
- simple pendulum (1m diameter sphere on massless 5m stick) with initial angular velocity of 100 rad/s.
- suspension bridge with 30 1m long planks of length 1m.
- multi-link chain with 30 1m long links.

Here are the algorithms:

Baumgarte - A fraction of the position error is added to the velocity error. There is no
separate position solver.

Pseudo Velocities - After the velocity solver and position integration,
the position error, Jacobian, and effective mass are recomputed. Then
the velocity constraints are solved with pseudo velocities and a fraction
of the position error is added to the pseudo velocity error. The pseudo
velocities are initialized to zero and there is no warm-starting. After
the position solver, the pseudo velocities are added to the positions.
This is also called the First Order World method or the Position LCP method.

Modified Nonlinear Gauss-Seidel (NGS) - Like Pseudo Velocities except the
position error is re-computed for each constraint and the positions are updated
after the constraint is solved. The radius vectors (aka Jacobians) are
re-computed too (otherwise the algorithm has horrible instability). The pseudo
velocity states are not needed because they are effectively zero at the beginning
of each iteration. Since we have the current position error, we allow the
iterations to terminate early if the error becomes smaller than b2_linearSlop.

Full NGS or just NGS - Like Modified NGS except the effective mass are re-computed
each time a constraint is solved.

Here are the results:
Baumgarte - this is the cheapest algorithm but it has some stability problems,
especially with the bridge. The chain links separate easily close to the root
and they jitter as they struggle to pull together. This is one of the most common
methods in the field. The big drawback is that the position correction artificially
affects the momentum, thus leading to instabilities and false bounce. I used a
bias factor of 0.2. A larger bias factor makes the bridge less stable, a smaller
factor makes joints and contacts more spongy.

Pseudo Velocities - the is more stable than the Baumgarte method. The bridge is
stable. However, joints still separate with large angular velocities. Drag the
simple pendulum in a circle quickly and the joint will separate. The chain separates
easily and does not recover. I used a bias factor of 0.2. A larger value lead to
the bridge collapsing when a heavy cube drops on it.

Modified NGS - this algorithm is better in some ways than Baumgarte and Pseudo
Velocities, but in other ways it is worse. The bridge and chain are much more
stable, but the simple pendulum goes unstable at high angular velocities.

Full NGS - stable in all tests. The joints display good stiffness. The bridge
still sags, but this is better than infinite forces.

Recommendations
Pseudo Velocities are not really worthwhile because the bridge and chain cannot
recover from joint separation. In other cases the benefit over Baumgarte is small.

Modified NGS is not a robust method for the revolute joint due to the violent
instability seen in the simple pendulum. Perhaps it is viable with other constraint
types, especially scalar constraints where the effective mass is a scalar.

This leaves Baumgarte and Full NGS. Baumgarte has small, but manageable instabilities
and is very fast. I don't think we can escape Baumgarte, especially in highly
demanding cases where high constraint fidelity is not needed.

Full NGS is robust and easy on the eyes. I recommend this as an option for
higher fidelity simulation and certainly for suspension bridges and long chains.
Full NGS might be a good choice for ragdolls, especially motorized ragdolls where
joint separation can be problematic. The number of NGS iterations can be reduced
for better performance without harming robustness much.

Each joint in a can be handled differently in the position solver. So I recommend
a system where the user can select the algorithm on a per joint basis. I would
probably default to the slower Full NGS and let the user select the faster
Baumgarte method in performance critical scenarios.
*/
/*
Cache Performance

The Box2D solvers are dominated by cache misses. Data structures are designed
to increase the number of cache hits. Much of misses are due to random access
to body data. The constraint structures are iterated over linearly, which leads
to few cache misses.

The bodies are not accessed during iteration. Instead read only data, such as
the mass values are stored with the constraints. The mutable data are the constraint
impulses and the bodies velocities/positions. The impulses are held inside the
constraint structures. The body velocities/positions are held in compact, temporary
arrays to increase the number of cache hits. Linear and angular velocity are
stored in a single array since multiple arrays lead to multiple misses.
*/
/*
2D Rotation

R = [cos(theta) -sin(theta)]
    [sin(theta) cos(theta) ]

thetaDot = omega

Let q1 = cos(theta), q2 = sin(theta).
R = [q1 -q2]
    [q2  q1]

q1Dot = -thetaDot * q2
q2Dot = thetaDot * q1

q1_new = q1_old - dt * w * q2
q2_new = q2_old + dt * w * q1
then normalize.

This might be faster than computing sin+cos.
However, we can compute sin+cos of the same angle fast.
*/
export class b2Island {
    constructor() {
        this.m_allocator = null;
        this.m_bodies = [ /*1024*/]; // TODO: b2Settings
        this.m_contacts = [ /*1024*/]; // TODO: b2Settings
        this.m_joints = [ /*1024*/]; // TODO: b2Settings
        this.m_positions = b2Position.MakeArray(1024); // TODO: b2Settings
        this.m_velocities = b2Velocity.MakeArray(1024); // TODO: b2Settings
        this.m_bodyCount = 0;
        this.m_jointCount = 0;
        this.m_contactCount = 0;
        this.m_bodyCapacity = 0;
        this.m_contactCapacity = 0;
        this.m_jointCapacity = 0;
    }
    Initialize(bodyCapacity, contactCapacity, jointCapacity, allocator, listener) {
        this.m_bodyCapacity = bodyCapacity;
        this.m_contactCapacity = contactCapacity;
        this.m_jointCapacity = jointCapacity;
        this.m_bodyCount = 0;
        this.m_contactCount = 0;
        this.m_jointCount = 0;
        this.m_allocator = allocator;
        this.m_listener = listener;
        // TODO:
        // while (this.m_bodies.length < bodyCapacity) {
        //   this.m_bodies[this.m_bodies.length] = null;
        // }
        // TODO:
        // while (this.m_contacts.length < contactCapacity) {
        //   this.m_contacts[this.m_contacts.length] = null;
        // }
        // TODO:
        // while (this.m_joints.length < jointCapacity) {
        //   this.m_joints[this.m_joints.length] = null;
        // }
        // TODO:
        if (this.m_positions.length < bodyCapacity) {
            const new_length = b2Max(this.m_positions.length * 2, bodyCapacity);
            while (this.m_positions.length < new_length) {
                this.m_positions[this.m_positions.length] = new b2Position();
            }
        }
        // TODO:
        if (this.m_velocities.length < bodyCapacity) {
            const new_length = b2Max(this.m_velocities.length * 2, bodyCapacity);
            while (this.m_velocities.length < new_length) {
                this.m_velocities[this.m_velocities.length] = new b2Velocity();
            }
        }
    }
    Clear() {
        this.m_bodyCount = 0;
        this.m_contactCount = 0;
        this.m_jointCount = 0;
    }
    AddBody(body) {
        // DEBUG: b2Assert(this.m_bodyCount < this.m_bodyCapacity);
        body.m_islandIndex = this.m_bodyCount;
        this.m_bodies[this.m_bodyCount++] = body;
    }
    AddContact(contact) {
        // DEBUG: b2Assert(this.m_contactCount < this.m_contactCapacity);
        this.m_contacts[this.m_contactCount++] = contact;
    }
    AddJoint(joint) {
        // DEBUG: b2Assert(this.m_jointCount < this.m_jointCapacity);
        this.m_joints[this.m_jointCount++] = joint;
    }
    Solve(profile, step, gravity, allowSleep) {
        const timer = b2Island.s_timer.Reset();
        const h = step.dt;
        // Integrate velocities and apply damping. Initialize the body state.
        for (let i = 0; i < this.m_bodyCount; ++i) {
            const b = this.m_bodies[i];
            // const c: b2Vec2 =
            this.m_positions[i].c.Copy(b.m_sweep.c);
            const a = b.m_sweep.a;
            const v = this.m_velocities[i].v.Copy(b.m_linearVelocity);
            let w = b.m_angularVelocity;
            // Store positions for continuous collision.
            b.m_sweep.c0.Copy(b.m_sweep.c);
            b.m_sweep.a0 = b.m_sweep.a;
            if (b.m_type === b2BodyType.b2_dynamicBody) {
                // Integrate velocities.
                v.x += h * (b.m_gravityScale * gravity.x + b.m_invMass * b.m_force.x);
                v.y += h * (b.m_gravityScale * gravity.y + b.m_invMass * b.m_force.y);
                w += h * b.m_invI * b.m_torque;
                // Apply damping.
                // ODE: dv/dt + c * v = 0
                // Solution: v(t) = v0 * exp(-c * t)
                // Time step: v(t + dt) = v0 * exp(-c * (t + dt)) = v0 * exp(-c * t) * exp(-c * dt) = v * exp(-c * dt)
                // v2 = exp(-c * dt) * v1
                // Pade approximation:
                // v2 = v1 * 1 / (1 + c * dt)
                v.SelfMul(1.0 / (1.0 + h * b.m_linearDamping));
                w *= 1.0 / (1.0 + h * b.m_angularDamping);
            }
            // this.m_positions[i].c = c;
            this.m_positions[i].a = a;
            // this.m_velocities[i].v = v;
            this.m_velocities[i].w = w;
        }
        timer.Reset();
        // Solver data
        const solverData = b2Island.s_solverData;
        solverData.step.Copy(step);
        solverData.positions = this.m_positions;
        solverData.velocities = this.m_velocities;
        // Initialize velocity constraints.
        const contactSolverDef = b2Island.s_contactSolverDef;
        contactSolverDef.step.Copy(step);
        contactSolverDef.contacts = this.m_contacts;
        contactSolverDef.count = this.m_contactCount;
        contactSolverDef.positions = this.m_positions;
        contactSolverDef.velocities = this.m_velocities;
        contactSolverDef.allocator = this.m_allocator;
        const contactSolver = b2Island.s_contactSolver.Initialize(contactSolverDef);
        contactSolver.InitializeVelocityConstraints();
        if (step.warmStarting) {
            contactSolver.WarmStart();
        }
        for (let i = 0; i < this.m_jointCount; ++i) {
            this.m_joints[i].InitVelocityConstraints(solverData);
        }
        profile.solveInit = timer.GetMilliseconds();
        // Solve velocity constraints.
        timer.Reset();
        for (let i = 0; i < step.velocityIterations; ++i) {
            for (let j = 0; j < this.m_jointCount; ++j) {
                this.m_joints[j].SolveVelocityConstraints(solverData);
            }
            contactSolver.SolveVelocityConstraints();
        }
        // Store impulses for warm starting
        contactSolver.StoreImpulses();
        profile.solveVelocity = timer.GetMilliseconds();
        // Integrate positions.
        for (let i = 0; i < this.m_bodyCount; ++i) {
            const c = this.m_positions[i].c;
            let a = this.m_positions[i].a;
            const v = this.m_velocities[i].v;
            let w = this.m_velocities[i].w;
            // Check for large velocities
            const translation = b2Vec2.MulSV(h, v, b2Island.s_translation);
            if (b2Vec2.DotVV(translation, translation) > b2_maxTranslationSquared) {
                const ratio = b2_maxTranslation / translation.Length();
                v.SelfMul(ratio);
            }
            const rotation = h * w;
            if (rotation * rotation > b2_maxRotationSquared) {
                const ratio = b2_maxRotation / b2Abs(rotation);
                w *= ratio;
            }
            // Integrate
            c.x += h * v.x;
            c.y += h * v.y;
            a += h * w;
            // this.m_positions[i].c = c;
            this.m_positions[i].a = a;
            // this.m_velocities[i].v = v;
            this.m_velocities[i].w = w;
        }
        // Solve position constraints
        timer.Reset();
        let positionSolved = false;
        for (let i = 0; i < step.positionIterations; ++i) {
            const contactsOkay = contactSolver.SolvePositionConstraints();
            let jointsOkay = true;
            for (let j = 0; j < this.m_jointCount; ++j) {
                const jointOkay = this.m_joints[j].SolvePositionConstraints(solverData);
                jointsOkay = jointsOkay && jointOkay;
            }
            if (contactsOkay && jointsOkay) {
                // Exit early if the position errors are small.
                positionSolved = true;
                break;
            }
        }
        // Copy state buffers back to the bodies
        for (let i = 0; i < this.m_bodyCount; ++i) {
            const body = this.m_bodies[i];
            body.m_sweep.c.Copy(this.m_positions[i].c);
            body.m_sweep.a = this.m_positions[i].a;
            body.m_linearVelocity.Copy(this.m_velocities[i].v);
            body.m_angularVelocity = this.m_velocities[i].w;
            body.SynchronizeTransform();
        }
        profile.solvePosition = timer.GetMilliseconds();
        this.Report(contactSolver.m_velocityConstraints);
        if (allowSleep) {
            let minSleepTime = b2_maxFloat;
            const linTolSqr = b2_linearSleepTolerance * b2_linearSleepTolerance;
            const angTolSqr = b2_angularSleepTolerance * b2_angularSleepTolerance;
            for (let i = 0; i < this.m_bodyCount; ++i) {
                const b = this.m_bodies[i];
                if (b.GetType() === b2BodyType.b2_staticBody) {
                    continue;
                }
                if (!b.m_autoSleepFlag ||
                    b.m_angularVelocity * b.m_angularVelocity > angTolSqr ||
                    b2Vec2.DotVV(b.m_linearVelocity, b.m_linearVelocity) > linTolSqr) {
                    b.m_sleepTime = 0;
                    minSleepTime = 0;
                }
                else {
                    b.m_sleepTime += h;
                    minSleepTime = b2Min(minSleepTime, b.m_sleepTime);
                }
            }
            if (minSleepTime >= b2_timeToSleep && positionSolved) {
                for (let i = 0; i < this.m_bodyCount; ++i) {
                    const b = this.m_bodies[i];
                    b.SetAwake(false);
                }
            }
        }
    }
    SolveTOI(subStep, toiIndexA, toiIndexB) {
        // DEBUG: b2Assert(toiIndexA < this.m_bodyCount);
        // DEBUG: b2Assert(toiIndexB < this.m_bodyCount);
        // Initialize the body state.
        for (let i = 0; i < this.m_bodyCount; ++i) {
            const b = this.m_bodies[i];
            this.m_positions[i].c.Copy(b.m_sweep.c);
            this.m_positions[i].a = b.m_sweep.a;
            this.m_velocities[i].v.Copy(b.m_linearVelocity);
            this.m_velocities[i].w = b.m_angularVelocity;
        }
        const contactSolverDef = b2Island.s_contactSolverDef;
        contactSolverDef.contacts = this.m_contacts;
        contactSolverDef.count = this.m_contactCount;
        contactSolverDef.allocator = this.m_allocator;
        contactSolverDef.step.Copy(subStep);
        contactSolverDef.positions = this.m_positions;
        contactSolverDef.velocities = this.m_velocities;
        const contactSolver = b2Island.s_contactSolver.Initialize(contactSolverDef);
        // Solve position constraints.
        for (let i = 0; i < subStep.positionIterations; ++i) {
            const contactsOkay = contactSolver.SolveTOIPositionConstraints(toiIndexA, toiIndexB);
            if (contactsOkay) {
                break;
            }
        }
        /*
        #if 0
          // Is the new position really safe?
          for (int32 i = 0; i < this.m_contactCount; ++i) {
            b2Contact* c = this.m_contacts[i];
            b2Fixture* fA = c.GetFixtureA();
            b2Fixture* fB = c.GetFixtureB();
      
            b2Body* bA = fA.GetBody();
            b2Body* bB = fB.GetBody();
      
            int32 indexA = c.GetChildIndexA();
            int32 indexB = c.GetChildIndexB();
      
            b2DistanceInput input;
            input.proxyA.Set(fA.GetShape(), indexA);
            input.proxyB.Set(fB.GetShape(), indexB);
            input.transformA = bA.GetTransform();
            input.transformB = bB.GetTransform();
            input.useRadii = false;
      
            b2DistanceOutput output;
            b2SimplexCache cache;
            cache.count = 0;
            b2Distance(&output, &cache, &input);
      
            if (output.distance === 0 || cache.count === 3) {
              cache.count += 0;
            }
          }
        #endif
        */
        // Leap of faith to new safe state.
        this.m_bodies[toiIndexA].m_sweep.c0.Copy(this.m_positions[toiIndexA].c);
        this.m_bodies[toiIndexA].m_sweep.a0 = this.m_positions[toiIndexA].a;
        this.m_bodies[toiIndexB].m_sweep.c0.Copy(this.m_positions[toiIndexB].c);
        this.m_bodies[toiIndexB].m_sweep.a0 = this.m_positions[toiIndexB].a;
        // No warm starting is needed for TOI events because warm
        // starting impulses were applied in the discrete solver.
        contactSolver.InitializeVelocityConstraints();
        // Solve velocity constraints.
        for (let i = 0; i < subStep.velocityIterations; ++i) {
            contactSolver.SolveVelocityConstraints();
        }
        // Don't store the TOI contact forces for warm starting
        // because they can be quite large.
        const h = subStep.dt;
        // Integrate positions
        for (let i = 0; i < this.m_bodyCount; ++i) {
            const c = this.m_positions[i].c;
            let a = this.m_positions[i].a;
            const v = this.m_velocities[i].v;
            let w = this.m_velocities[i].w;
            // Check for large velocities
            const translation = b2Vec2.MulSV(h, v, b2Island.s_translation);
            if (b2Vec2.DotVV(translation, translation) > b2_maxTranslationSquared) {
                const ratio = b2_maxTranslation / translation.Length();
                v.SelfMul(ratio);
            }
            const rotation = h * w;
            if (rotation * rotation > b2_maxRotationSquared) {
                const ratio = b2_maxRotation / b2Abs(rotation);
                w *= ratio;
            }
            // Integrate
            c.SelfMulAdd(h, v);
            a += h * w;
            // this.m_positions[i].c = c;
            this.m_positions[i].a = a;
            // this.m_velocities[i].v = v;
            this.m_velocities[i].w = w;
            // Sync bodies
            const body = this.m_bodies[i];
            body.m_sweep.c.Copy(c);
            body.m_sweep.a = a;
            body.m_linearVelocity.Copy(v);
            body.m_angularVelocity = w;
            body.SynchronizeTransform();
        }
        this.Report(contactSolver.m_velocityConstraints);
    }
    Report(constraints) {
        if (this.m_listener === null) {
            return;
        }
        for (let i = 0; i < this.m_contactCount; ++i) {
            const c = this.m_contacts[i];
            if (!c) {
                continue;
            }
            const vc = constraints[i];
            const impulse = b2Island.s_impulse;
            impulse.count = vc.pointCount;
            for (let j = 0; j < vc.pointCount; ++j) {
                impulse.normalImpulses[j] = vc.points[j].normalImpulse;
                impulse.tangentImpulses[j] = vc.points[j].tangentImpulse;
            }
            this.m_listener.PostSolve(c, impulse);
        }
    }
}
b2Island.s_timer = new b2Timer();
b2Island.s_solverData = new b2SolverData();
b2Island.s_contactSolverDef = new b2ContactSolverDef();
b2Island.s_contactSolver = new b2ContactSolver();
b2Island.s_translation = new b2Vec2();
b2Island.s_impulse = new b2ContactImpulse();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJJc2xhbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9Cb3gyRC9EeW5hbWljcy9iMklzbGFuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLDBEQUEwRDtBQUMxRCxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ25FLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ25GLE9BQU8sRUFBRSxjQUFjLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUM3RSxPQUFPLEVBQUUsdUJBQXVCLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUN6RixPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDL0QsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBRSxlQUFlLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUdqRixPQUFPLEVBQVUsVUFBVSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzlDLE9BQU8sRUFBeUIsWUFBWSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFDM0YsT0FBTyxFQUFFLGdCQUFnQixFQUFxQixNQUFNLG9CQUFvQixDQUFDO0FBRXpFOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQTZFRTtBQUVGOzs7Ozs7Ozs7Ozs7OztFQWNFO0FBRUY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXFCRTtBQUVGLE1BQU0sT0FBTyxRQUFRO0lBQXJCO1FBQ1MsZ0JBQVcsR0FBUSxJQUFJLENBQUM7UUFHeEIs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