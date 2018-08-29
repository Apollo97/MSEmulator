/*
* Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
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
import { b2_pi, b2_linearSlop, b2_maxLinearCorrection, b2Maybe } from "../../Common/b2Settings";
import { b2Abs, b2Clamp, b2Vec2, b2Rot } from "../../Common/b2Math";
import { b2Joint, b2JointDef, b2JointType } from "./b2Joint";
/// Distance joint definition. This requires defining an
/// anchor point on both bodies and the non-zero length of the
/// distance joint. The definition uses local anchor points
/// so that the initial configuration can violate the constraint
/// slightly. This helps when saving and loading a game.
/// @warning Do not use a zero or short length.
export class b2DistanceJointDef extends b2JointDef {
    constructor() {
        super(b2JointType.e_distanceJoint);
        this.localAnchorA = new b2Vec2();
        this.localAnchorB = new b2Vec2();
        this.length = 1;
        this.frequencyHz = 0;
        this.dampingRatio = 0;
    }
    Initialize(b1, b2, anchor1, anchor2) {
        this.bodyA = b1;
        this.bodyB = b2;
        this.bodyA.GetLocalPoint(anchor1, this.localAnchorA);
        this.bodyB.GetLocalPoint(anchor2, this.localAnchorB);
        this.length = b2Vec2.DistanceVV(anchor1, anchor2);
        this.frequencyHz = 0;
        this.dampingRatio = 0;
    }
}
export class b2DistanceJoint extends b2Joint {
    constructor(def) {
        super(def);
        this.m_frequencyHz = 0;
        this.m_dampingRatio = 0;
        this.m_bias = 0;
        // Solver shared
        this.m_localAnchorA = new b2Vec2();
        this.m_localAnchorB = new b2Vec2();
        this.m_gamma = 0;
        this.m_impulse = 0;
        this.m_length = 0;
        // Solver temp
        this.m_indexA = 0;
        this.m_indexB = 0;
        this.m_u = new b2Vec2();
        this.m_rA = new b2Vec2();
        this.m_rB = new b2Vec2();
        this.m_localCenterA = new b2Vec2();
        this.m_localCenterB = new b2Vec2();
        this.m_invMassA = 0;
        this.m_invMassB = 0;
        this.m_invIA = 0;
        this.m_invIB = 0;
        this.m_mass = 0;
        this.m_qA = new b2Rot();
        this.m_qB = new b2Rot();
        this.m_lalcA = new b2Vec2();
        this.m_lalcB = new b2Vec2();
        this.m_frequencyHz = b2Maybe(def.frequencyHz, 0);
        this.m_dampingRatio = b2Maybe(def.dampingRatio, 0);
        this.m_localAnchorA.Copy(def.localAnchorA);
        this.m_localAnchorB.Copy(def.localAnchorB);
        this.m_length = def.length;
    }
    GetAnchorA(out) {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }
    GetAnchorB(out) {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }
    GetReactionForce(inv_dt, out) {
        out.x = inv_dt * this.m_impulse * this.m_u.x;
        out.y = inv_dt * this.m_impulse * this.m_u.y;
        return out;
    }
    GetReactionTorque(inv_dt) {
        return 0;
    }
    GetLocalAnchorA() { return this.m_localAnchorA; }
    GetLocalAnchorB() { return this.m_localAnchorB; }
    SetLength(length) {
        this.m_length = length;
    }
    Length() {
        return this.m_length;
    }
    SetFrequency(hz) {
        this.m_frequencyHz = hz;
    }
    GetFrequency() {
        return this.m_frequencyHz;
    }
    SetDampingRatio(ratio) {
        this.m_dampingRatio = ratio;
    }
    GetDampingRatio() {
        return this.m_dampingRatio;
    }
    Dump(log) {
        const indexA = this.m_bodyA.m_islandIndex;
        const indexB = this.m_bodyB.m_islandIndex;
        log("  const jd: b2DistanceJointDef = new b2DistanceJointDef();\n");
        log("  jd.bodyA = bodies[%d];\n", indexA);
        log("  jd.bodyB = bodies[%d];\n", indexB);
        log("  jd.collideConnected = %s;\n", (this.m_collideConnected) ? ("true") : ("false"));
        log("  jd.localAnchorA.Set(%.15f, %.15f);\n", this.m_localAnchorA.x, this.m_localAnchorA.y);
        log("  jd.localAnchorB.Set(%.15f, %.15f);\n", this.m_localAnchorB.x, this.m_localAnchorB.y);
        log("  jd.length = %.15f;\n", this.m_length);
        log("  jd.frequencyHz = %.15f;\n", this.m_frequencyHz);
        log("  jd.dampingRatio = %.15f;\n", this.m_dampingRatio);
        log("  joints[%d] = this.m_world.CreateJoint(jd);\n", this.m_index);
    }
    InitVelocityConstraints(data) {
        this.m_indexA = this.m_bodyA.m_islandIndex;
        this.m_indexB = this.m_bodyB.m_islandIndex;
        this.m_localCenterA.Copy(this.m_bodyA.m_sweep.localCenter);
        this.m_localCenterB.Copy(this.m_bodyB.m_sweep.localCenter);
        this.m_invMassA = this.m_bodyA.m_invMass;
        this.m_invMassB = this.m_bodyB.m_invMass;
        this.m_invIA = this.m_bodyA.m_invI;
        this.m_invIB = this.m_bodyB.m_invI;
        const cA = data.positions[this.m_indexA].c;
        const aA = data.positions[this.m_indexA].a;
        const vA = data.velocities[this.m_indexA].v;
        let wA = data.velocities[this.m_indexA].w;
        const cB = data.positions[this.m_indexB].c;
        const aB = data.positions[this.m_indexB].a;
        const vB = data.velocities[this.m_indexB].v;
        let wB = data.velocities[this.m_indexB].w;
        // const qA: b2Rot = new b2Rot(aA), qB: b2Rot = new b2Rot(aB);
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB);
        // m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        b2Vec2.SubVV(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        b2Rot.MulRV(qA, this.m_lalcA, this.m_rA);
        // m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        b2Vec2.SubVV(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        b2Rot.MulRV(qB, this.m_lalcB, this.m_rB);
        // m_u = cB + m_rB - cA - m_rA;
        this.m_u.x = cB.x + this.m_rB.x - cA.x - this.m_rA.x;
        this.m_u.y = cB.y + this.m_rB.y - cA.y - this.m_rA.y;
        // Handle singularity.
        const length = this.m_u.Length();
        if (length > b2_linearSlop) {
            this.m_u.SelfMul(1 / length);
        }
        else {
            this.m_u.SetZero();
        }
        // float32 crAu = b2Cross(m_rA, m_u);
        const crAu = b2Vec2.CrossVV(this.m_rA, this.m_u);
        // float32 crBu = b2Cross(m_rB, m_u);
        const crBu = b2Vec2.CrossVV(this.m_rB, this.m_u);
        // float32 invMass = m_invMassA + m_invIA * crAu * crAu + m_invMassB + m_invIB * crBu * crBu;
        let invMass = this.m_invMassA + this.m_invIA * crAu * crAu + this.m_invMassB + this.m_invIB * crBu * crBu;
        // Compute the effective mass matrix.
        this.m_mass = invMass !== 0 ? 1 / invMass : 0;
        if (this.m_frequencyHz > 0) {
            const C = length - this.m_length;
            // Frequency
            const omega = 2 * b2_pi * this.m_frequencyHz;
            // Damping coefficient
            const d = 2 * this.m_mass * this.m_dampingRatio * omega;
            // Spring stiffness
            const k = this.m_mass * omega * omega;
            // magic formulas
            const h = data.step.dt;
            this.m_gamma = h * (d + h * k);
            this.m_gamma = this.m_gamma !== 0 ? 1 / this.m_gamma : 0;
            this.m_bias = C * h * k * this.m_gamma;
            invMass += this.m_gamma;
            this.m_mass = invMass !== 0 ? 1 / invMass : 0;
        }
        else {
            this.m_gamma = 0;
            this.m_bias = 0;
        }
        if (data.step.warmStarting) {
            // Scale the impulse to support a variable time step.
            this.m_impulse *= data.step.dtRatio;
            // b2Vec2 P = m_impulse * m_u;
            const P = b2Vec2.MulSV(this.m_impulse, this.m_u, b2DistanceJoint.InitVelocityConstraints_s_P);
            // vA -= m_invMassA * P;
            vA.SelfMulSub(this.m_invMassA, P);
            // wA -= m_invIA * b2Cross(m_rA, P);
            wA -= this.m_invIA * b2Vec2.CrossVV(this.m_rA, P);
            // vB += m_invMassB * P;
            vB.SelfMulAdd(this.m_invMassB, P);
            // wB += m_invIB * b2Cross(m_rB, P);
            wB += this.m_invIB * b2Vec2.CrossVV(this.m_rB, P);
        }
        else {
            this.m_impulse = 0;
        }
        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }
    SolveVelocityConstraints(data) {
        const vA = data.velocities[this.m_indexA].v;
        let wA = data.velocities[this.m_indexA].w;
        const vB = data.velocities[this.m_indexB].v;
        let wB = data.velocities[this.m_indexB].w;
        // b2Vec2 vpA = vA + b2Cross(wA, m_rA);
        const vpA = b2Vec2.AddVCrossSV(vA, wA, this.m_rA, b2DistanceJoint.SolveVelocityConstraints_s_vpA);
        // b2Vec2 vpB = vB + b2Cross(wB, m_rB);
        const vpB = b2Vec2.AddVCrossSV(vB, wB, this.m_rB, b2DistanceJoint.SolveVelocityConstraints_s_vpB);
        // float32 Cdot = b2Dot(m_u, vpB - vpA);
        const Cdot = b2Vec2.DotVV(this.m_u, b2Vec2.SubVV(vpB, vpA, b2Vec2.s_t0));
        const impulse = (-this.m_mass * (Cdot + this.m_bias + this.m_gamma * this.m_impulse));
        this.m_impulse += impulse;
        // b2Vec2 P = impulse * m_u;
        const P = b2Vec2.MulSV(impulse, this.m_u, b2DistanceJoint.SolveVelocityConstraints_s_P);
        // vA -= m_invMassA * P;
        vA.SelfMulSub(this.m_invMassA, P);
        // wA -= m_invIA * b2Cross(m_rA, P);
        wA -= this.m_invIA * b2Vec2.CrossVV(this.m_rA, P);
        // vB += m_invMassB * P;
        vB.SelfMulAdd(this.m_invMassB, P);
        // wB += m_invIB * b2Cross(m_rB, P);
        wB += this.m_invIB * b2Vec2.CrossVV(this.m_rB, P);
        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }
    SolvePositionConstraints(data) {
        if (this.m_frequencyHz > 0) {
            // There is no position correction for soft distance constraints.
            return true;
        }
        const cA = data.positions[this.m_indexA].c;
        let aA = data.positions[this.m_indexA].a;
        const cB = data.positions[this.m_indexB].c;
        let aB = data.positions[this.m_indexB].a;
        // const qA: b2Rot = new b2Rot(aA), qB: b2Rot = new b2Rot(aB);
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB);
        // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        const rA = b2Rot.MulRV(qA, this.m_lalcA, this.m_rA); // use m_rA
        // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        const rB = b2Rot.MulRV(qB, this.m_lalcB, this.m_rB); // use m_rB
        // b2Vec2 u = cB + rB - cA - rA;
        const u = this.m_u; // use m_u
        u.x = cB.x + rB.x - cA.x - rA.x;
        u.y = cB.y + rB.y - cA.y - rA.y;
        // float32 length = u.Normalize();
        const length = this.m_u.Normalize();
        // float32 C = length - m_length;
        let C = length - this.m_length;
        C = b2Clamp(C, (-b2_maxLinearCorrection), b2_maxLinearCorrection);
        const impulse = (-this.m_mass * C);
        // b2Vec2 P = impulse * u;
        const P = b2Vec2.MulSV(impulse, u, b2DistanceJoint.SolvePositionConstraints_s_P);
        // cA -= m_invMassA * P;
        cA.SelfMulSub(this.m_invMassA, P);
        // aA -= m_invIA * b2Cross(rA, P);
        aA -= this.m_invIA * b2Vec2.CrossVV(rA, P);
        // cB += m_invMassB * P;
        cB.SelfMulAdd(this.m_invMassB, P);
        // aB += m_invIB * b2Cross(rB, P);
        aB += this.m_invIB * b2Vec2.CrossVV(rB, P);
        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;
        return b2Abs(C) < b2_linearSlop;
    }
}
b2DistanceJoint.InitVelocityConstraints_s_P = new b2Vec2();
b2DistanceJoint.SolveVelocityConstraints_s_vpA = new b2Vec2();
b2DistanceJoint.SolveVelocityConstraints_s_vpB = new b2Vec2();
b2DistanceJoint.SolveVelocityConstraints_s_P = new b2Vec2();
b2DistanceJoint.SolvePositionConstraints_s_P = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJEaXN0YW5jZUpvaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvSm9pbnRzL2IyRGlzdGFuY2VKb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLE9BQU8sRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLHNCQUFzQixFQUFFLE9BQU8sRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ2hHLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQU0sTUFBTSxxQkFBcUIsQ0FBQztBQUN4RSxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQWUsTUFBTSxXQUFXLENBQUM7QUFZMUUsd0RBQXdEO0FBQ3hELDhEQUE4RDtBQUM5RCwyREFBMkQ7QUFDM0QsZ0VBQWdFO0FBQ2hFLHdEQUF3RDtBQUN4RCwrQ0FBK0M7QUFDL0MsTUFBTSxPQUFPLGtCQUFtQixTQUFRLFVBQVU7SUFPaEQ7UUFDRSxLQUFLLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBUHJCLGlCQUFZLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNwQyxpQkFBWSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDN0MsV0FBTSxHQUFXLENBQUMsQ0FBQztRQUNuQixnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUN4QixpQkFBWSxHQUFXLENBQUMsQ0FBQztJQUloQyxDQUFDO0lBRU0sVUFBVSxDQUFDLEVBQVUsRUFBRSxFQUFVLEVBQUUsT0FBVyxFQUFFLE9BQVc7UUFDaEUsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNyRCxJ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