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
// DEBUG: import { b2Assert } from "../../Common/b2Settings";
import { b2_linearSlop, b2_maxManifoldPoints, b2_velocityThreshold, b2_maxLinearCorrection, b2_baumgarte, b2_toiBaumgarte, b2MakeArray } from "../../Common/b2Settings";
import { b2Min, b2Max, b2Clamp, b2Vec2, b2Mat22, b2Rot, b2Transform } from "../../Common/b2Math";
import { b2WorldManifold } from "../../Collision/b2Collision";
import { b2ManifoldType } from "../../Collision/b2Collision";
import { b2TimeStep } from "../b2TimeStep";
// Solver debugging is normally disabled because the block solver sometimes has to deal with a poorly conditioned effective mass matrix.
// #define B2_DEBUG_SOLVER 0
export let g_blockSolve = false;
export class b2VelocityConstraintPoint {
    constructor() {
        this.rA = new b2Vec2();
        this.rB = new b2Vec2();
        this.normalImpulse = 0;
        this.tangentImpulse = 0;
        this.normalMass = 0;
        this.tangentMass = 0;
        this.velocityBias = 0;
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2VelocityConstraintPoint());
    }
}
export class b2ContactVelocityConstraint {
    constructor() {
        this.points = b2VelocityConstraintPoint.MakeArray(b2_maxManifoldPoints);
        this.normal = new b2Vec2();
        this.tangent = new b2Vec2();
        this.normalMass = new b2Mat22();
        this.K = new b2Mat22();
        this.indexA = 0;
        this.indexB = 0;
        this.invMassA = 0;
        this.invMassB = 0;
        this.invIA = 0;
        this.invIB = 0;
        this.friction = 0;
        this.restitution = 0;
        this.tangentSpeed = 0;
        this.pointCount = 0;
        this.contactIndex = 0;
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2ContactVelocityConstraint());
    }
}
export class b2ContactPositionConstraint {
    constructor() {
        this.localPoints = b2Vec2.MakeArray(b2_maxManifoldPoints);
        this.localNormal = new b2Vec2();
        this.localPoint = new b2Vec2();
        this.indexA = 0;
        this.indexB = 0;
        this.invMassA = 0;
        this.invMassB = 0;
        this.localCenterA = new b2Vec2();
        this.localCenterB = new b2Vec2();
        this.invIA = 0;
        this.invIB = 0;
        this.type = b2ManifoldType.e_unknown;
        this.radiusA = 0;
        this.radiusB = 0;
        this.pointCount = 0;
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2ContactPositionConstraint());
    }
}
export class b2ContactSolverDef {
    constructor() {
        this.step = new b2TimeStep();
        this.count = 0;
        this.allocator = null;
    }
}
export class b2PositionSolverManifold {
    constructor() {
        this.normal = new b2Vec2();
        this.point = new b2Vec2();
        this.separation = 0;
    }
    Initialize(pc, xfA, xfB, index) {
        const pointA = b2PositionSolverManifold.Initialize_s_pointA;
        const pointB = b2PositionSolverManifold.Initialize_s_pointB;
        const planePoint = b2PositionSolverManifold.Initialize_s_planePoint;
        const clipPoint = b2PositionSolverManifold.Initialize_s_clipPoint;
        // DEBUG: b2Assert(pc.pointCount > 0);
        switch (pc.type) {
            case b2ManifoldType.e_circles: {
                // b2Vec2 pointA = b2Mul(xfA, pc->localPoint);
                b2Transform.MulXV(xfA, pc.localPoint, pointA);
                // b2Vec2 pointB = b2Mul(xfB, pc->localPoints[0]);
                b2Transform.MulXV(xfB, pc.localPoints[0], pointB);
                // normal = pointB - pointA;
                // normal.Normalize();
                b2Vec2.SubVV(pointB, pointA, this.normal).SelfNormalize();
                // point = 0.5f * (pointA + pointB);
                b2Vec2.MidVV(pointA, pointB, this.point);
                // separation = b2Dot(pointB - pointA, normal) - pc->radius;
                this.separation = b2Vec2.DotVV(b2Vec2.SubVV(pointB, pointA, b2Vec2.s_t0), this.normal) - pc.radiusA - pc.radiusB;
                break;
            }
            case b2ManifoldType.e_faceA: {
                // normal = b2Mul(xfA.q, pc->localNormal);
                b2Rot.MulRV(xfA.q, pc.localNormal, this.normal);
                // b2Vec2 planePoint = b2Mul(xfA, pc->localPoint);
                b2Transform.MulXV(xfA, pc.localPoint, planePoint);
                // b2Vec2 clipPoint = b2Mul(xfB, pc->localPoints[index]);
                b2Transform.MulXV(xfB, pc.localPoints[index], clipPoint);
                // separation = b2Dot(clipPoint - planePoint, normal) - pc->radius;
                this.separation = b2Vec2.DotVV(b2Vec2.SubVV(clipPoint, planePoint, b2Vec2.s_t0), this.normal) - pc.radiusA - pc.radiusB;
                // point = clipPoint;
                this.point.Copy(clipPoint);
                break;
            }
            case b2ManifoldType.e_faceB: {
                // normal = b2Mul(xfB.q, pc->localNormal);
                b2Rot.MulRV(xfB.q, pc.localNormal, this.normal);
                // b2Vec2 planePoint = b2Mul(xfB, pc->localPoint);
                b2Transform.MulXV(xfB, pc.localPoint, planePoint);
                // b2Vec2 clipPoint = b2Mul(xfA, pc->localPoints[index]);
                b2Transform.MulXV(xfA, pc.localPoints[index], clipPoint);
                // separation = b2Dot(clipPoint - planePoint, normal) - pc->radius;
                this.separation = b2Vec2.DotVV(b2Vec2.SubVV(clipPoint, planePoint, b2Vec2.s_t0), this.normal) - pc.radiusA - pc.radiusB;
                // point = clipPoint;
                this.point.Copy(clipPoint);
                // Ensure normal points from A to B
                // normal = -normal;
                this.normal.SelfNeg();
                break;
            }
        }
    }
}
b2PositionSolverManifold.Initialize_s_pointA = new b2Vec2();
b2PositionSolverManifold.Initialize_s_pointB = new b2Vec2();
b2PositionSolverManifold.Initialize_s_planePoint = new b2Vec2();
b2PositionSolverManifold.Initialize_s_clipPoint = new b2Vec2();
export class b2ContactSolver {
    constructor() {
        this.m_step = new b2TimeStep();
        this.m_allocator = null;
        this.m_positionConstraints = b2ContactPositionConstraint.MakeArray(1024); // TODO: b2Settings
        this.m_velocityConstraints = b2ContactVelocityConstraint.MakeArray(1024); // TODO: b2Settings
        this.m_count = 0;
    }
    Initialize(def) {
        this.m_step.Copy(def.step);
        this.m_allocator = def.allocator;
        this.m_count = def.count;
        // TODO:
        if (this.m_positionConstraints.length < this.m_count) {
            const new_length = b2Max(this.m_positionConstraints.length * 2, this.m_count);
            while (this.m_positionConstraints.length < new_length) {
                this.m_positionConstraints[this.m_positionConstraints.length] = new b2ContactPositionConstraint();
            }
        }
        // TODO:
        if (this.m_velocityConstraints.length < this.m_count) {
            const new_length = b2Max(this.m_velocityConstraints.length * 2, this.m_count);
            while (this.m_velocityConstraints.length < new_length) {
                this.m_velocityConstraints[this.m_velocityConstraints.length] = new b2ContactVelocityConstraint();
            }
        }
        this.m_positions = def.positions;
        this.m_velocities = def.velocities;
        this.m_contacts = def.contacts;
        // Initialize position independent portions of the constraints.
        for (let i = 0; i < this.m_count; ++i) {
            const contact = this.m_contacts[i];
            const fixtureA = contact.m_fixtureA;
            const fixtureB = contact.m_fixtureB;
            const shapeA = fixtureA.GetShape();
            const shapeB = fixtureB.GetShape();
            const radiusA = shapeA.m_radius;
            const radiusB = shapeB.m_radius;
            const bodyA = fixtureA.GetBody();
            const bodyB = fixtureB.GetBody();
            const manifold = contact.GetManifold();
            const pointCount = manifold.pointCount;
            // DEBUG: b2Assert(pointCount > 0);
            const vc = this.m_velocityConstraints[i];
            vc.friction = contact.m_friction;
            vc.restitution = contact.m_restitution;
            vc.tangentSpeed = contact.m_tangentSpeed;
            vc.indexA = bodyA.m_islandIndex;
            vc.indexB = bodyB.m_islandIndex;
            vc.invMassA = bodyA.m_invMass;
            vc.invMassB = bodyB.m_invMass;
            vc.invIA = bodyA.m_invI;
            vc.invIB = bodyB.m_invI;
            vc.contactIndex = i;
            vc.pointCount = pointCount;
            vc.K.SetZero();
            vc.normalMass.SetZero();
            const pc = this.m_positionConstraints[i];
            pc.indexA = bodyA.m_islandIndex;
            pc.indexB = bodyB.m_islandIndex;
            pc.invMassA = bodyA.m_invMass;
            pc.invMassB = bodyB.m_invMass;
            pc.localCenterA.Copy(bodyA.m_sweep.localCenter);
            pc.localCenterB.Copy(bodyB.m_sweep.localCenter);
            pc.invIA = bodyA.m_invI;
            pc.invIB = bodyB.m_invI;
            pc.localNormal.Copy(manifold.localNormal);
            pc.localPoint.Copy(manifold.localPoint);
            pc.pointCount = pointCount;
            pc.radiusA = radiusA;
            pc.radiusB = radiusB;
            pc.type = manifold.type;
            for (let j = 0; j < pointCount; ++j) {
                const cp = manifold.points[j];
                const vcp = vc.points[j];
                if (this.m_step.warmStarting) {
                    vcp.normalImpulse = this.m_step.dtRatio * cp.normalImpulse;
                    vcp.tangentImpulse = this.m_step.dtRatio * cp.tangentImpulse;
                }
                else {
                    vcp.normalImpulse = 0;
                    vcp.tangentImpulse = 0;
                }
                vcp.rA.SetZero();
                vcp.rB.SetZero();
                vcp.normalMass = 0;
                vcp.tangentMass = 0;
                vcp.velocityBias = 0;
                pc.localPoints[j].Copy(cp.localPoint);
            }
        }
        return this;
    }
    InitializeVelocityConstraints() {
        const xfA = b2ContactSolver.InitializeVelocityConstraints_s_xfA;
        const xfB = b2ContactSolver.InitializeVelocityConstraints_s_xfB;
        const worldManifold = b2ContactSolver.InitializeVelocityConstraints_s_worldManifold;
        const k_maxConditionNumber = 1000;
        for (let i = 0; i < this.m_count; ++i) {
            const vc = this.m_velocityConstraints[i];
            const pc = this.m_positionConstraints[i];
            const radiusA = pc.radiusA;
            const radiusB = pc.radiusB;
            const manifold = this.m_contacts[vc.contactIndex].GetManifold();
            const indexA = vc.indexA;
            const indexB = vc.indexB;
            const mA = vc.invMassA;
            const mB = vc.invMassB;
            const iA = vc.invIA;
            const iB = vc.invIB;
            const localCenterA = pc.localCenterA;
            const localCenterB = pc.localCenterB;
            const cA = this.m_positions[indexA].c;
            const aA = this.m_positions[indexA].a;
            const vA = this.m_velocities[indexA].v;
            const wA = this.m_velocities[indexA].w;
            const cB = this.m_positions[indexB].c;
            const aB = this.m_positions[indexB].a;
            const vB = this.m_velocities[indexB].v;
            const wB = this.m_velocities[indexB].w;
            // DEBUG: b2Assert(manifold.pointCount > 0);
            xfA.q.SetAngle(aA);
            xfB.q.SetAngle(aB);
            b2Vec2.SubVV(cA, b2Rot.MulRV(xfA.q, localCenterA, b2Vec2.s_t0), xfA.p);
            b2Vec2.SubVV(cB, b2Rot.MulRV(xfB.q, localCenterB, b2Vec2.s_t0), xfB.p);
            worldManifold.Initialize(manifold, xfA, radiusA, xfB, radiusB);
            vc.normal.Copy(worldManifold.normal);
            b2Vec2.CrossVOne(vc.normal, vc.tangent); // compute from normal
            const pointCount = vc.pointCount;
            for (let j = 0; j < pointCount; ++j) {
                const vcp = vc.points[j];
                // vcp->rA = worldManifold.points[j] - cA;
                b2Vec2.SubVV(worldManifold.points[j], cA, vcp.rA);
                // vcp->rB = worldManifold.points[j] - cB;
                b2Vec2.SubVV(worldManifold.points[j], cB, vcp.rB);
                const rnA = b2Vec2.CrossVV(vcp.rA, vc.normal);
                const rnB = b2Vec2.CrossVV(vcp.rB, vc.normal);
                const kNormal = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
                vcp.normalMass = kNormal > 0 ? 1 / kNormal : 0;
                // b2Vec2 tangent = b2Cross(vc->normal, 1.0f);
                const tangent = vc.tangent; // precomputed from normal
                const rtA = b2Vec2.CrossVV(vcp.rA, tangent);
                const rtB = b2Vec2.CrossVV(vcp.rB, tangent);
                const kTangent = mA + mB + iA * rtA * rtA + iB * rtB * rtB;
                vcp.tangentMass = kTangent > 0 ? 1 / kTangent : 0;
                // Setup a velocity bias for restitution.
                vcp.velocityBias = 0;
                // float32 vRel = b2Dot(vc->normal, vB + b2Cross(wB, vcp->rB) - vA - b2Cross(wA, vcp->rA));
                const vRel = b2Vec2.DotVV(vc.normal, b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, vcp.rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, vcp.rA, b2Vec2.s_t1), b2Vec2.s_t0));
                if (vRel < (-b2_velocityThreshold)) {
                    vcp.velocityBias += (-vc.restitution * vRel);
                }
            }
            // If we have two points, then prepare the block solver.
            if (vc.pointCount === 2 && g_blockSolve) {
                const vcp1 = vc.points[0];
                const vcp2 = vc.points[1];
                const rn1A = b2Vec2.CrossVV(vcp1.rA, vc.normal);
                const rn1B = b2Vec2.CrossVV(vcp1.rB, vc.normal);
                const rn2A = b2Vec2.CrossVV(vcp2.rA, vc.normal);
                const rn2B = b2Vec2.CrossVV(vcp2.rB, vc.normal);
                const k11 = mA + mB + iA * rn1A * rn1A + iB * rn1B * rn1B;
                const k22 = mA + mB + iA * rn2A * rn2A + iB * rn2B * rn2B;
                const k12 = mA + mB + iA * rn1A * rn2A + iB * rn1B * rn2B;
                // Ensure a reasonable condition number.
                // float32 k_maxConditionNumber = 1000.0f;
                if (k11 * k11 < k_maxConditionNumber * (k11 * k22 - k12 * k12)) {
                    // K is safe to invert.
                    vc.K.ex.Set(k11, k12);
                    vc.K.ey.Set(k12, k22);
                    vc.K.GetInverse(vc.normalMass);
                }
                else {
                    // The constraints are redundant, just use one.
                    // TODO_ERIN use deepest?
                    vc.pointCount = 1;
                }
            }
        }
    }
    WarmStart() {
        const P = b2ContactSolver.WarmStart_s_P;
        // Warm start.
        for (let i = 0; i < this.m_count; ++i) {
            const vc = this.m_velocityConstraints[i];
            const indexA = vc.indexA;
            const indexB = vc.indexB;
            const mA = vc.invMassA;
            const iA = vc.invIA;
            const mB = vc.invMassB;
            const iB = vc.invIB;
            const pointCount = vc.pointCount;
            const vA = this.m_velocities[indexA].v;
            let wA = this.m_velocities[indexA].w;
            const vB = this.m_velocities[indexB].v;
            let wB = this.m_velocities[indexB].w;
            const normal = vc.normal;
            // b2Vec2 tangent = b2Cross(normal, 1.0f);
            const tangent = vc.tangent; // precomputed from normal
            for (let j = 0; j < pointCount; ++j) {
                const vcp = vc.points[j];
                // b2Vec2 P = vcp->normalImpulse * normal + vcp->tangentImpulse * tangent;
                b2Vec2.AddVV(b2Vec2.MulSV(vcp.normalImpulse, normal, b2Vec2.s_t0), b2Vec2.MulSV(vcp.tangentImpulse, tangent, b2Vec2.s_t1), P);
                // wA -= iA * b2Cross(vcp->rA, P);
                wA -= iA * b2Vec2.CrossVV(vcp.rA, P);
                // vA -= mA * P;
                vA.SelfMulSub(mA, P);
                // wB += iB * b2Cross(vcp->rB, P);
                wB += iB * b2Vec2.CrossVV(vcp.rB, P);
                // vB += mB * P;
                vB.SelfMulAdd(mB, P);
            }
            // this.m_velocities[indexA].v = vA;
            this.m_velocities[indexA].w = wA;
            // this.m_velocities[indexB].v = vB;
            this.m_velocities[indexB].w = wB;
        }
    }
    SolveVelocityConstraints() {
        const dv = b2ContactSolver.SolveVelocityConstraints_s_dv;
        const dv1 = b2ContactSolver.SolveVelocityConstraints_s_dv1;
        const dv2 = b2ContactSolver.SolveVelocityConstraints_s_dv2;
        const P = b2ContactSolver.SolveVelocityConstraints_s_P;
        const a = b2ContactSolver.SolveVelocityConstraints_s_a;
        const b = b2ContactSolver.SolveVelocityConstraints_s_b;
        const x = b2ContactSolver.SolveVelocityConstraints_s_x;
        const d = b2ContactSolver.SolveVelocityConstraints_s_d;
        const P1 = b2ContactSolver.SolveVelocityConstraints_s_P1;
        const P2 = b2ContactSolver.SolveVelocityConstraints_s_P2;
        const P1P2 = b2ContactSolver.SolveVelocityConstraints_s_P1P2;
        for (let i = 0; i < this.m_count; ++i) {
            const vc = this.m_velocityConstraints[i];
            const indexA = vc.indexA;
            const indexB = vc.indexB;
            const mA = vc.invMassA;
            const iA = vc.invIA;
            const mB = vc.invMassB;
            const iB = vc.invIB;
            const pointCount = vc.pointCount;
            const vA = this.m_velocities[indexA].v;
            let wA = this.m_velocities[indexA].w;
            const vB = this.m_velocities[indexB].v;
            let wB = this.m_velocities[indexB].w;
            // b2Vec2 normal = vc->normal;
            const normal = vc.normal;
            // b2Vec2 tangent = b2Cross(normal, 1.0f);
            const tangent = vc.tangent; // precomputed from normal
            const friction = vc.friction;
            // DEBUG: b2Assert(pointCount === 1 || pointCount === 2);
            // Solve tangent constraints first because non-penetration is more important
            // than friction.
            for (let j = 0; j < pointCount; ++j) {
                const vcp = vc.points[j];
                // Relative velocity at contact
                // b2Vec2 dv = vB + b2Cross(wB, vcp->rB) - vA - b2Cross(wA, vcp->rA);
                b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, vcp.rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, vcp.rA, b2Vec2.s_t1), dv);
                // Compute tangent force
                // float32 vt = b2Dot(dv, tangent) - vc->tangentSpeed;
                const vt = b2Vec2.DotVV(dv, tangent) - vc.tangentSpeed;
                let lambda = vcp.tangentMass * (-vt);
                // b2Clamp the accumulated force
                const maxFriction = friction * vcp.normalImpulse;
                const newImpulse = b2Clamp(vcp.tangentImpulse + lambda, (-maxFriction), maxFriction);
                lambda = newImpulse - vcp.tangentImpulse;
                vcp.tangentImpulse = newImpulse;
                // Apply contact impulse
                // b2Vec2 P = lambda * tangent;
                b2Vec2.MulSV(lambda, tangent, P);
                // vA -= mA * P;
                vA.SelfMulSub(mA, P);
                // wA -= iA * b2Cross(vcp->rA, P);
                wA -= iA * b2Vec2.CrossVV(vcp.rA, P);
                // vB += mB * P;
                vB.SelfMulAdd(mB, P);
                // wB += iB * b2Cross(vcp->rB, P);
                wB += iB * b2Vec2.CrossVV(vcp.rB, P);
            }
            // Solve normal constraints
            if (vc.pointCount === 1 || g_blockSolve === false) {
                for (let j = 0; j < pointCount; ++j) {
                    const vcp = vc.points[j];
                    // Relative velocity at contact
                    // b2Vec2 dv = vB + b2Cross(wB, vcp->rB) - vA - b2Cross(wA, vcp->rA);
                    b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, vcp.rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, vcp.rA, b2Vec2.s_t1), dv);
                    // Compute normal impulse
                    // float32 vn = b2Dot(dv, normal);
                    const vn = b2Vec2.DotVV(dv, normal);
                    let lambda = (-vcp.normalMass * (vn - vcp.velocityBias));
                    // b2Clamp the accumulated impulse
                    // float32 newImpulse = b2Max(vcp->normalImpulse + lambda, 0.0f);
                    const newImpulse = b2Max(vcp.normalImpulse + lambda, 0);
                    lambda = newImpulse - vcp.normalImpulse;
                    vcp.normalImpulse = newImpulse;
                    // Apply contact impulse
                    // b2Vec2 P = lambda * normal;
                    b2Vec2.MulSV(lambda, normal, P);
                    // vA -= mA * P;
                    vA.SelfMulSub(mA, P);
                    // wA -= iA * b2Cross(vcp->rA, P);
                    wA -= iA * b2Vec2.CrossVV(vcp.rA, P);
                    // vB += mB * P;
                    vB.SelfMulAdd(mB, P);
                    // wB += iB * b2Cross(vcp->rB, P);
                    wB += iB * b2Vec2.CrossVV(vcp.rB, P);
                }
            }
            else {
                // Block solver developed in collaboration with Dirk Gregorius (back in 01/07 on Box2D_Lite).
                // Build the mini LCP for this contact patch
                //
                // vn = A * x + b, vn >= 0, x >= 0 and vn_i * x_i = 0 with i = 1..2
                //
                // A = J * W * JT and J = ( -n, -r1 x n, n, r2 x n )
                // b = vn0 - velocityBias
                //
                // The system is solved using the "Total enumeration method" (s. Murty). The complementary constraint vn_i * x_i
                // implies that we must have in any solution either vn_i = 0 or x_i = 0. So for the 2D contact problem the cases
                // vn1 = 0 and vn2 = 0, x1 = 0 and x2 = 0, x1 = 0 and vn2 = 0, x2 = 0 and vn1 = 0 need to be tested. The first valid
                // solution that satisfies the problem is chosen.
                //
                // In order to account of the accumulated impulse 'a' (because of the iterative nature of the solver which only requires
                // that the accumulated impulse is clamped and not the incremental impulse) we change the impulse variable (x_i).
                //
                // Substitute:
                //
                // x = a + d
                //
                // a := old total impulse
                // x := new total impulse
                // d := incremental impulse
                //
                // For the current iteration we extend the formula for the incremental impulse
                // to compute the new total impulse:
                //
                // vn = A * d + b
                //    = A * (x - a) + b
                //    = A * x + b - A * a
                //    = A * x + b'
                // b' = b - A * a;
                const cp1 = vc.points[0];
                const cp2 = vc.points[1];
                // b2Vec2 a(cp1->normalImpulse, cp2->normalImpulse);
                a.Set(cp1.normalImpulse, cp2.normalImpulse);
                // DEBUG: b2Assert(a.x >= 0 && a.y >= 0);
                // Relative velocity at contact
                // b2Vec2 dv1 = vB + b2Cross(wB, cp1->rB) - vA - b2Cross(wA, cp1->rA);
                b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, cp1.rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, cp1.rA, b2Vec2.s_t1), dv1);
                // b2Vec2 dv2 = vB + b2Cross(wB, cp2->rB) - vA - b2Cross(wA, cp2->rA);
                b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, cp2.rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, cp2.rA, b2Vec2.s_t1), dv2);
                // Compute normal velocity
                // float32 vn1 = b2Dot(dv1, normal);
                let vn1 = b2Vec2.DotVV(dv1, normal);
                // float32 vn2 = b2Dot(dv2, normal);
                let vn2 = b2Vec2.DotVV(dv2, normal);
                // b2Vec2 b;
                b.x = vn1 - cp1.velocityBias;
                b.y = vn2 - cp2.velocityBias;
                // Compute b'
                // b -= b2Mul(vc->K, a);
                b.SelfSub(b2Mat22.MulMV(vc.K, a, b2Vec2.s_t0));
                /*
                #if B2_DEBUG_SOLVER === 1
                const k_errorTol: number = 0.001;
                #endif
                */
                for (;;) {
                    //
                    // Case 1: vn = 0
                    //
                    // 0 = A * x + b'
                    //
                    // Solve for x:
                    //
                    // x = - inv(A) * b'
                    //
                    // b2Vec2 x = - b2Mul(vc->normalMass, b);
                    b2Mat22.MulMV(vc.normalMass, b, x).SelfNeg();
                    if (x.x >= 0 && x.y >= 0) {
                        // Get the incremental impulse
                        // b2Vec2 d = x - a;
                        b2Vec2.SubVV(x, a, d);
                        // Apply incremental impulse
                        // b2Vec2 P1 = d.x * normal;
                        b2Vec2.MulSV(d.x, normal, P1);
                        // b2Vec2 P2 = d.y * normal;
                        b2Vec2.MulSV(d.y, normal, P2);
                        b2Vec2.AddVV(P1, P2, P1P2);
                        // vA -= mA * (P1 + P2);
                        vA.SelfMulSub(mA, P1P2);
                        // wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
                        wA -= iA * (b2Vec2.CrossVV(cp1.rA, P1) + b2Vec2.CrossVV(cp2.rA, P2));
                        // vB += mB * (P1 + P2);
                        vB.SelfMulAdd(mB, P1P2);
                        // wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
                        wB += iB * (b2Vec2.CrossVV(cp1.rB, P1) + b2Vec2.CrossVV(cp2.rB, P2));
                        // Accumulate
                        cp1.normalImpulse = x.x;
                        cp2.normalImpulse = x.y;
                        /*
                        #if B2_DEBUG_SOLVER === 1
                        // Postconditions
                        dv1 = vB + b2Cross(wB, cp1->rB) - vA - b2Cross(wA, cp1->rA);
                        dv2 = vB + b2Cross(wB, cp2->rB) - vA - b2Cross(wA, cp2->rA);
            
                        // Compute normal velocity
                        vn1 = b2Dot(dv1, normal);
                        vn2 = b2Dot(dv2, normal);
            
                        b2Assert(b2Abs(vn1 - cp1->velocityBias) < k_errorTol);
                        b2Assert(b2Abs(vn2 - cp2->velocityBias) < k_errorTol);
                        #endif
                        */
                        break;
                    }
                    //
                    // Case 2: vn1 = 0 and x2 = 0
                    //
                    //   0 = a11 * x1 + a12 * 0 + b1'
                    // vn2 = a21 * x1 + a22 * 0 + b2'
                    //
                    x.x = (-cp1.normalMass * b.x);
                    x.y = 0;
                    vn1 = 0;
                    vn2 = vc.K.ex.y * x.x + b.y;
                    if (x.x >= 0 && vn2 >= 0) {
                        // Get the incremental impulse
                        // b2Vec2 d = x - a;
                        b2Vec2.SubVV(x, a, d);
                        // Apply incremental impulse
                        // b2Vec2 P1 = d.x * normal;
                        b2Vec2.MulSV(d.x, normal, P1);
                        // b2Vec2 P2 = d.y * normal;
                        b2Vec2.MulSV(d.y, normal, P2);
                        b2Vec2.AddVV(P1, P2, P1P2);
                        // vA -= mA * (P1 + P2);
                        vA.SelfMulSub(mA, P1P2);
                        // wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
                        wA -= iA * (b2Vec2.CrossVV(cp1.rA, P1) + b2Vec2.CrossVV(cp2.rA, P2));
                        // vB += mB * (P1 + P2);
                        vB.SelfMulAdd(mB, P1P2);
                        // wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
                        wB += iB * (b2Vec2.CrossVV(cp1.rB, P1) + b2Vec2.CrossVV(cp2.rB, P2));
                        // Accumulate
                        cp1.normalImpulse = x.x;
                        cp2.normalImpulse = x.y;
                        /*
                        #if B2_DEBUG_SOLVER === 1
                        // Postconditions
                        dv1 = vB + b2Cross(wB, cp1->rB) - vA - b2Cross(wA, cp1->rA);
            
                        // Compute normal velocity
                        vn1 = b2Dot(dv1, normal);
            
                        b2Assert(b2Abs(vn1 - cp1->velocityBias) < k_errorTol);
                        #endif
                        */
                        break;
                    }
                    //
                    // Case 3: vn2 = 0 and x1 = 0
                    //
                    // vn1 = a11 * 0 + a12 * x2 + b1'
                    //   0 = a21 * 0 + a22 * x2 + b2'
                    //
                    x.x = 0;
                    x.y = (-cp2.normalMass * b.y);
                    vn1 = vc.K.ey.x * x.y + b.x;
                    vn2 = 0;
                    if (x.y >= 0 && vn1 >= 0) {
                        // Resubstitute for the incremental impulse
                        // b2Vec2 d = x - a;
                        b2Vec2.SubVV(x, a, d);
                        // Apply incremental impulse
                        // b2Vec2 P1 = d.x * normal;
                        b2Vec2.MulSV(d.x, normal, P1);
                        // b2Vec2 P2 = d.y * normal;
                        b2Vec2.MulSV(d.y, normal, P2);
                        b2Vec2.AddVV(P1, P2, P1P2);
                        // vA -= mA * (P1 + P2);
                        vA.SelfMulSub(mA, P1P2);
                        // wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
                        wA -= iA * (b2Vec2.CrossVV(cp1.rA, P1) + b2Vec2.CrossVV(cp2.rA, P2));
                        // vB += mB * (P1 + P2);
                        vB.SelfMulAdd(mB, P1P2);
                        // wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
                        wB += iB * (b2Vec2.CrossVV(cp1.rB, P1) + b2Vec2.CrossVV(cp2.rB, P2));
                        // Accumulate
                        cp1.normalImpulse = x.x;
                        cp2.normalImpulse = x.y;
                        /*
                        #if B2_DEBUG_SOLVER === 1
                        // Postconditions
                        dv2 = vB + b2Cross(wB, cp2->rB) - vA - b2Cross(wA, cp2->rA);
            
                        // Compute normal velocity
                        vn2 = b2Dot(dv2, normal);
            
                        b2Assert(b2Abs(vn2 - cp2->velocityBias) < k_errorTol);
                        #endif
                        */
                        break;
                    }
                    //
                    // Case 4: x1 = 0 and x2 = 0
                    //
                    // vn1 = b1
                    // vn2 = b2;
                    x.x = 0;
                    x.y = 0;
                    vn1 = b.x;
                    vn2 = b.y;
                    if (vn1 >= 0 && vn2 >= 0) {
                        // Resubstitute for the incremental impulse
                        // b2Vec2 d = x - a;
                        b2Vec2.SubVV(x, a, d);
                        // Apply incremental impulse
                        // b2Vec2 P1 = d.x * normal;
                        b2Vec2.MulSV(d.x, normal, P1);
                        // b2Vec2 P2 = d.y * normal;
                        b2Vec2.MulSV(d.y, normal, P2);
                        b2Vec2.AddVV(P1, P2, P1P2);
                        // vA -= mA * (P1 + P2);
                        vA.SelfMulSub(mA, P1P2);
                        // wA -= iA * (b2Cross(cp1->rA, P1) + b2Cross(cp2->rA, P2));
                        wA -= iA * (b2Vec2.CrossVV(cp1.rA, P1) + b2Vec2.CrossVV(cp2.rA, P2));
                        // vB += mB * (P1 + P2);
                        vB.SelfMulAdd(mB, P1P2);
                        // wB += iB * (b2Cross(cp1->rB, P1) + b2Cross(cp2->rB, P2));
                        wB += iB * (b2Vec2.CrossVV(cp1.rB, P1) + b2Vec2.CrossVV(cp2.rB, P2));
                        // Accumulate
                        cp1.normalImpulse = x.x;
                        cp2.normalImpulse = x.y;
                        break;
                    }
                    // No solution, give up. This is hit sometimes, but it doesn't seem to matter.
                    break;
                }
            }
            // this.m_velocities[indexA].v = vA;
            this.m_velocities[indexA].w = wA;
            // this.m_velocities[indexB].v = vB;
            this.m_velocities[indexB].w = wB;
        }
    }
    StoreImpulses() {
        for (let i = 0; i < this.m_count; ++i) {
            const vc = this.m_velocityConstraints[i];
            const manifold = this.m_contacts[vc.contactIndex].GetManifold();
            for (let j = 0; j < vc.pointCount; ++j) {
                manifold.points[j].normalImpulse = vc.points[j].normalImpulse;
                manifold.points[j].tangentImpulse = vc.points[j].tangentImpulse;
            }
        }
    }
    SolvePositionConstraints() {
        const xfA = b2ContactSolver.SolvePositionConstraints_s_xfA;
        const xfB = b2ContactSolver.SolvePositionConstraints_s_xfB;
        const psm = b2ContactSolver.SolvePositionConstraints_s_psm;
        const rA = b2ContactSolver.SolvePositionConstraints_s_rA;
        const rB = b2ContactSolver.SolvePositionConstraints_s_rB;
        const P = b2ContactSolver.SolvePositionConstraints_s_P;
        let minSeparation = 0;
        for (let i = 0; i < this.m_count; ++i) {
            const pc = this.m_positionConstraints[i];
            const indexA = pc.indexA;
            const indexB = pc.indexB;
            const localCenterA = pc.localCenterA;
            const mA = pc.invMassA;
            const iA = pc.invIA;
            const localCenterB = pc.localCenterB;
            const mB = pc.invMassB;
            const iB = pc.invIB;
            const pointCount = pc.pointCount;
            const cA = this.m_positions[indexA].c;
            let aA = this.m_positions[indexA].a;
            const cB = this.m_positions[indexB].c;
            let aB = this.m_positions[indexB].a;
            // Solve normal constraints
            for (let j = 0; j < pointCount; ++j) {
                xfA.q.SetAngle(aA);
                xfB.q.SetAngle(aB);
                b2Vec2.SubVV(cA, b2Rot.MulRV(xfA.q, localCenterA, b2Vec2.s_t0), xfA.p);
                b2Vec2.SubVV(cB, b2Rot.MulRV(xfB.q, localCenterB, b2Vec2.s_t0), xfB.p);
                psm.Initialize(pc, xfA, xfB, j);
                const normal = psm.normal;
                const point = psm.point;
                const separation = psm.separation;
                // b2Vec2 rA = point - cA;
                b2Vec2.SubVV(point, cA, rA);
                // b2Vec2 rB = point - cB;
                b2Vec2.SubVV(point, cB, rB);
                // Track max constraint error.
                minSeparation = b2Min(minSeparation, separation);
                // Prevent large corrections and allow slop.
                const C = b2Clamp(b2_baumgarte * (separation + b2_linearSlop), (-b2_maxLinearCorrection), 0);
                // Compute the effective mass.
                // float32 rnA = b2Cross(rA, normal);
                const rnA = b2Vec2.CrossVV(rA, normal);
                // float32 rnB = b2Cross(rB, normal);
                const rnB = b2Vec2.CrossVV(rB, normal);
                // float32 K = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
                const K = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
                // Compute normal impulse
                const impulse = K > 0 ? -C / K : 0;
                // b2Vec2 P = impulse * normal;
                b2Vec2.MulSV(impulse, normal, P);
                // cA -= mA * P;
                cA.SelfMulSub(mA, P);
                // aA -= iA * b2Cross(rA, P);
                aA -= iA * b2Vec2.CrossVV(rA, P);
                // cB += mB * P;
                cB.SelfMulAdd(mB, P);
                // aB += iB * b2Cross(rB, P);
                aB += iB * b2Vec2.CrossVV(rB, P);
            }
            // this.m_positions[indexA].c = cA;
            this.m_positions[indexA].a = aA;
            // this.m_positions[indexB].c = cB;
            this.m_positions[indexB].a = aB;
        }
        // We can't expect minSpeparation >= -b2_linearSlop because we don't
        // push the separation above -b2_linearSlop.
        return minSeparation > (-3 * b2_linearSlop);
    }
    SolveTOIPositionConstraints(toiIndexA, toiIndexB) {
        const xfA = b2ContactSolver.SolveTOIPositionConstraints_s_xfA;
        const xfB = b2ContactSolver.SolveTOIPositionConstraints_s_xfB;
        const psm = b2ContactSolver.SolveTOIPositionConstraints_s_psm;
        const rA = b2ContactSolver.SolveTOIPositionConstraints_s_rA;
        const rB = b2ContactSolver.SolveTOIPositionConstraints_s_rB;
        const P = b2ContactSolver.SolveTOIPositionConstraints_s_P;
        let minSeparation = 0;
        for (let i = 0; i < this.m_count; ++i) {
            const pc = this.m_positionConstraints[i];
            const indexA = pc.indexA;
            const indexB = pc.indexB;
            const localCenterA = pc.localCenterA;
            const localCenterB = pc.localCenterB;
            const pointCount = pc.pointCount;
            let mA = 0;
            let iA = 0;
            if (indexA === toiIndexA || indexA === toiIndexB) {
                mA = pc.invMassA;
                iA = pc.invIA;
            }
            let mB = 0;
            let iB = 0;
            if (indexB === toiIndexA || indexB === toiIndexB) {
                mB = pc.invMassB;
                iB = pc.invIB;
            }
            const cA = this.m_positions[indexA].c;
            let aA = this.m_positions[indexA].a;
            const cB = this.m_positions[indexB].c;
            let aB = this.m_positions[indexB].a;
            // Solve normal constraints
            for (let j = 0; j < pointCount; ++j) {
                xfA.q.SetAngle(aA);
                xfB.q.SetAngle(aB);
                b2Vec2.SubVV(cA, b2Rot.MulRV(xfA.q, localCenterA, b2Vec2.s_t0), xfA.p);
                b2Vec2.SubVV(cB, b2Rot.MulRV(xfB.q, localCenterB, b2Vec2.s_t0), xfB.p);
                psm.Initialize(pc, xfA, xfB, j);
                const normal = psm.normal;
                const point = psm.point;
                const separation = psm.separation;
                // b2Vec2 rA = point - cA;
                b2Vec2.SubVV(point, cA, rA);
                // b2Vec2 rB = point - cB;
                b2Vec2.SubVV(point, cB, rB);
                // Track max constraint error.
                minSeparation = b2Min(minSeparation, separation);
                // Prevent large corrections and allow slop.
                const C = b2Clamp(b2_toiBaumgarte * (separation + b2_linearSlop), (-b2_maxLinearCorrection), 0);
                // Compute the effective mass.
                // float32 rnA = b2Cross(rA, normal);
                const rnA = b2Vec2.CrossVV(rA, normal);
                // float32 rnB = b2Cross(rB, normal);
                const rnB = b2Vec2.CrossVV(rB, normal);
                // float32 K = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
                const K = mA + mB + iA * rnA * rnA + iB * rnB * rnB;
                // Compute normal impulse
                const impulse = K > 0 ? -C / K : 0;
                // b2Vec2 P = impulse * normal;
                b2Vec2.MulSV(impulse, normal, P);
                // cA -= mA * P;
                cA.SelfMulSub(mA, P);
                // aA -= iA * b2Cross(rA, P);
                aA -= iA * b2Vec2.CrossVV(rA, P);
                // cB += mB * P;
                cB.SelfMulAdd(mB, P);
                // aB += iB * b2Cross(rB, P);
                aB += iB * b2Vec2.CrossVV(rB, P);
            }
            // this.m_positions[indexA].c = cA;
            this.m_positions[indexA].a = aA;
            // this.m_positions[indexB].c = cB;
            this.m_positions[indexB].a = aB;
        }
        // We can't expect minSpeparation >= -b2_linearSlop because we don't
        // push the separation above -b2_linearSlop.
        return minSeparation >= -1.5 * b2_linearSlop;
    }
}
b2ContactSolver.InitializeVelocityConstraints_s_xfA = new b2Transform();
b2ContactSolver.InitializeVelocityConstraints_s_xfB = new b2Transform();
b2ContactSolver.InitializeVelocityConstraints_s_worldManifold = new b2WorldManifold();
b2ContactSolver.WarmStart_s_P = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_dv = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_dv1 = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_dv2 = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_P = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_a = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_b = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_x = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_d = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_P1 = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_P2 = new b2Vec2();
b2ContactSolver.SolveVelocityConstraints_s_P1P2 = new b2Vec2();
b2ContactSolver.SolvePositionConstraints_s_xfA = new b2Transform();
b2ContactSolver.SolvePositionConstraints_s_xfB = new b2Transform();
b2ContactSolver.SolvePositionConstraints_s_psm = new b2PositionSolverManifold();
b2ContactSolver.SolvePositionConstraints_s_rA = new b2Vec2();
b2ContactSolver.SolvePositionConstraints_s_rB = new b2Vec2();
b2ContactSolver.SolvePositionConstraints_s_P = new b2Vec2();
b2ContactSolver.SolveTOIPositionConstraints_s_xfA = new b2Transform();
b2ContactSolver.SolveTOIPositionConstraints_s_xfB = new b2Transform();
b2ContactSolver.SolveTOIPositionConstraints_s_psm = new b2PositionSolverManifold();
b2ContactSolver.SolveTOIPositionConstraints_s_rA = new b2Vec2();
b2ContactSolver.SolveTOIPositionConstraints_s_rB = new b2Vec2();
b2ContactSolver.SolveTOIPositionConstraints_s_P = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb250YWN0U29sdmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvQ29udGFjdHMvYjJDb250YWN0U29sdmVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsNkRBQTZEO0FBQzdELE9BQU8sRUFBRSxhQUFhLEVBQUUsb0JBQW9CLEVBQUUsb0JBQW9CLEVBQUUsc0JBQXNCLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxXQUFXLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN4SyxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFHakcsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQzlELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUs3RCxPQUFPLEVBQUUsVUFBVSxFQUEwQixNQUFNLGVBQWUsQ0FBQztBQUVuRSx3SUFBd0k7QUFDeEksNEJBQTRCO0FBRTVCLE1BQU0sQ0FBQyxJQUFJLFlBQVksR0FBWSxLQUFLLENBQUM7QUFFekMsTUFBTSxPQUFPLHlCQUF5QjtJQUF0QztRQUNrQixPQUFFLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUMxQixPQUFFLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNuQyxrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQixtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUMzQixlQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLGdCQUFXLEdBQVcsQ0FBQyxDQUFDO1FBQ3hCLGlCQUFZLEdBQVcsQ0FBQyxDQUFDO0lBS2xDLENBQUM7SUFIUSxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQWM7UUFDcEMsT0FBTyxXQUFXLENBQUMsTUFBTSxFQUFFLENB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LFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFL0MsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDOUMsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0MsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFL0MsNENBQTRDO1lBRTVDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN2RSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFdkUsYUFBYSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFL0QsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JD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