/*
* Copyright (c) 2006-2012 Erin Catto http://www.box2d.org
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
// DEBUG: import { b2IsValid } from "../../Common/b2Math";
import { b2Maybe } from "../../Common/b2Settings";
import { b2Clamp, b2Vec2, b2Mat22, b2Rot } from "../../Common/b2Math";
import { b2Joint, b2JointDef, b2JointType } from "./b2Joint";
export class b2MotorJointDef extends b2JointDef {
    constructor() {
        super(b2JointType.e_motorJoint);
        this.linearOffset = new b2Vec2(0, 0);
        this.angularOffset = 0;
        this.maxForce = 1;
        this.maxTorque = 1;
        this.correctionFactor = 0.3;
    }
    Initialize(bA, bB) {
        this.bodyA = bA;
        this.bodyB = bB;
        // b2Vec2 xB = bodyB->GetPosition();
        // linearOffset = bodyA->GetLocalPoint(xB);
        this.bodyA.GetLocalPoint(this.bodyB.GetPosition(), this.linearOffset);
        const angleA = this.bodyA.GetAngle();
        const angleB = this.bodyB.GetAngle();
        this.angularOffset = angleB - angleA;
    }
}
export class b2MotorJoint extends b2Joint {
    constructor(def) {
        super(def);
        // Solver shared
        this.m_linearOffset = new b2Vec2();
        this.m_angularOffset = 0;
        this.m_linearImpulse = new b2Vec2();
        this.m_angularImpulse = 0;
        this.m_maxForce = 0;
        this.m_maxTorque = 0;
        this.m_correctionFactor = 0.3;
        // Solver temp
        this.m_indexA = 0;
        this.m_indexB = 0;
        this.m_rA = new b2Vec2();
        this.m_rB = new b2Vec2();
        this.m_localCenterA = new b2Vec2();
        this.m_localCenterB = new b2Vec2();
        this.m_linearError = new b2Vec2();
        this.m_angularError = 0;
        this.m_invMassA = 0;
        this.m_invMassB = 0;
        this.m_invIA = 0;
        this.m_invIB = 0;
        this.m_linearMass = new b2Mat22();
        this.m_angularMass = 0;
        this.m_qA = new b2Rot();
        this.m_qB = new b2Rot();
        this.m_K = new b2Mat22();
        this.m_linearOffset.Copy(b2Maybe(def.linearOffset, b2Vec2.ZERO));
        this.m_linearImpulse.SetZero();
        this.m_maxForce = b2Maybe(def.maxForce, 0);
        this.m_maxTorque = b2Maybe(def.maxTorque, 0);
        this.m_correctionFactor = b2Maybe(def.correctionFactor, 0.3);
    }
    GetAnchorA(out) {
        const pos = this.m_bodyA.GetPosition();
        out.x = pos.x;
        out.y = pos.y;
        return out;
    }
    GetAnchorB(out) {
        const pos = this.m_bodyB.GetPosition();
        out.x = pos.x;
        out.y = pos.y;
        return out;
    }
    GetReactionForce(inv_dt, out) {
        // return inv_dt * m_linearImpulse;
        return b2Vec2.MulSV(inv_dt, this.m_linearImpulse, out);
    }
    GetReactionTorque(inv_dt) {
        return inv_dt * this.m_angularImpulse;
    }
    SetLinearOffset(linearOffset) {
        if (!b2Vec2.IsEqualToV(linearOffset, this.m_linearOffset)) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_linearOffset.Copy(linearOffset);
        }
    }
    GetLinearOffset() {
        return this.m_linearOffset;
    }
    SetAngularOffset(angularOffset) {
        if (angularOffset !== this.m_angularOffset) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_angularOffset = angularOffset;
        }
    }
    GetAngularOffset() {
        return this.m_angularOffset;
    }
    SetMaxForce(force) {
        // DEBUG: b2Assert(b2IsValid(force) && force >= 0);
        this.m_maxForce = force;
    }
    GetMaxForce() {
        return this.m_maxForce;
    }
    SetMaxTorque(torque) {
        // DEBUG: b2Assert(b2IsValid(torque) && torque >= 0);
        this.m_maxTorque = torque;
    }
    GetMaxTorque() {
        return this.m_maxTorque;
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
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB);
        // Compute the effective mass matrix.
        // this.m_rA = b2Mul(qA, m_linearOffset - this.m_localCenterA);
        const rA = b2Rot.MulRV(qA, b2Vec2.SubVV(this.m_linearOffset, this.m_localCenterA, b2Vec2.s_t0), this.m_rA);
        // this.m_rB = b2Mul(qB, -this.m_localCenterB);
        const rB = b2Rot.MulRV(qB, b2Vec2.NegV(this.m_localCenterB, b2Vec2.s_t0), this.m_rB);
        // J = [-I -r1_skew I r2_skew]
        // r_skew = [-ry; rx]
        // Matlab
        // K = [ mA+r1y^2*iA+mB+r2y^2*iB,  -r1y*iA*r1x-r2y*iB*r2x,          -r1y*iA-r2y*iB]
        //     [  -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB,           r1x*iA+r2x*iB]
        //     [          -r1y*iA-r2y*iB,           r1x*iA+r2x*iB,                   iA+iB]
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
        // Upper 2 by 2 of K for point to point
        const K = this.m_K;
        K.ex.x = mA + mB + iA * rA.y * rA.y + iB * rB.y * rB.y;
        K.ex.y = -iA * rA.x * rA.y - iB * rB.x * rB.y;
        K.ey.x = K.ex.y;
        K.ey.y = mA + mB + iA * rA.x * rA.x + iB * rB.x * rB.x;
        // this.m_linearMass = K.GetInverse();
        K.GetInverse(this.m_linearMass);
        this.m_angularMass = iA + iB;
        if (this.m_angularMass > 0) {
            this.m_angularMass = 1 / this.m_angularMass;
        }
        // this.m_linearError = cB + rB - cA - rA;
        b2Vec2.SubVV(b2Vec2.AddVV(cB, rB, b2Vec2.s_t0), b2Vec2.AddVV(cA, rA, b2Vec2.s_t1), this.m_linearError);
        this.m_angularError = aB - aA - this.m_angularOffset;
        if (data.step.warmStarting) {
            // Scale impulses to support a variable time step.
            // this.m_linearImpulse *= data.step.dtRatio;
            this.m_linearImpulse.SelfMul(data.step.dtRatio);
            this.m_angularImpulse *= data.step.dtRatio;
            // b2Vec2 P(this.m_linearImpulse.x, this.m_linearImpulse.y);
            const P = this.m_linearImpulse;
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * (b2Vec2.CrossVV(rA, P) + this.m_angularImpulse);
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * (b2Vec2.CrossVV(rB, P) + this.m_angularImpulse);
        }
        else {
            this.m_linearImpulse.SetZero();
            this.m_angularImpulse = 0;
        }
        // data.velocities[this.m_indexA].v = vA; // vA is a reference
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB; // vB is a reference
        data.velocities[this.m_indexB].w = wB;
    }
    SolveVelocityConstraints(data) {
        const vA = data.velocities[this.m_indexA].v;
        let wA = data.velocities[this.m_indexA].w;
        const vB = data.velocities[this.m_indexB].v;
        let wB = data.velocities[this.m_indexB].w;
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
        const h = data.step.dt;
        const inv_h = data.step.inv_dt;
        // Solve angular friction
        {
            const Cdot = wB - wA + inv_h * this.m_correctionFactor * this.m_angularError;
            let impulse = -this.m_angularMass * Cdot;
            const oldImpulse = this.m_angularImpulse;
            const maxImpulse = h * this.m_maxTorque;
            this.m_angularImpulse = b2Clamp(this.m_angularImpulse + impulse, -maxImpulse, maxImpulse);
            impulse = this.m_angularImpulse - oldImpulse;
            wA -= iA * impulse;
            wB += iB * impulse;
        }
        // Solve linear friction
        {
            const rA = this.m_rA;
            const rB = this.m_rB;
            // b2Vec2 Cdot = vB + b2Vec2.CrossSV(wB, rB) - vA - b2Vec2.CrossSV(wA, rA) + inv_h * this.m_correctionFactor * this.m_linearError;
            const Cdot_v2 = b2Vec2.AddVV(b2Vec2.SubVV(b2Vec2.AddVV(vB, b2Vec2.CrossSV(wB, rB, b2Vec2.s_t0), b2Vec2.s_t0), b2Vec2.AddVV(vA, b2Vec2.CrossSV(wA, rA, b2Vec2.s_t1), b2Vec2.s_t1), b2Vec2.s_t2), b2Vec2.MulSV(inv_h * this.m_correctionFactor, this.m_linearError, b2Vec2.s_t3), b2MotorJoint.SolveVelocityConstraints_s_Cdot_v2);
            // b2Vec2 impulse = -b2Mul(this.m_linearMass, Cdot);
            const impulse_v2 = b2Mat22.MulMV(this.m_linearMass, Cdot_v2, b2MotorJoint.SolveVelocityConstraints_s_impulse_v2).SelfNeg();
            // b2Vec2 oldImpulse = this.m_linearImpulse;
            const oldImpulse_v2 = b2MotorJoint.SolveVelocityConstraints_s_oldImpulse_v2.Copy(this.m_linearImpulse);
            // this.m_linearImpulse += impulse;
            this.m_linearImpulse.SelfAdd(impulse_v2);
            const maxImpulse = h * this.m_maxForce;
            if (this.m_linearImpulse.LengthSquared() > maxImpulse * maxImpulse) {
                this.m_linearImpulse.Normalize();
                // this.m_linearImpulse *= maxImpulse;
                this.m_linearImpulse.SelfMul(maxImpulse);
            }
            // impulse = this.m_linearImpulse - oldImpulse;
            b2Vec2.SubVV(this.m_linearImpulse, oldImpulse_v2, impulse_v2);
            // vA -= mA * impulse;
            vA.SelfMulSub(mA, impulse_v2);
            // wA -= iA * b2Vec2.CrossVV(rA, impulse);
            wA -= iA * b2Vec2.CrossVV(rA, impulse_v2);
            // vB += mB * impulse;
            vB.SelfMulAdd(mB, impulse_v2);
            // wB += iB * b2Vec2.CrossVV(rB, impulse);
            wB += iB * b2Vec2.CrossVV(rB, impulse_v2);
        }
        // data.velocities[this.m_indexA].v = vA; // vA is a reference
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB; // vB is a reference
        data.velocities[this.m_indexB].w = wB;
    }
    SolvePositionConstraints(data) {
        return true;
    }
    Dump(log) {
        const indexA = this.m_bodyA.m_islandIndex;
        const indexB = this.m_bodyB.m_islandIndex;
        log("  const jd: b2MotorJointDef = new b2MotorJointDef();\n");
        log("  jd.bodyA = bodies[%d];\n", indexA);
        log("  jd.bodyB = bodies[%d];\n", indexB);
        log("  jd.collideConnected = %s;\n", (this.m_collideConnected) ? ("true") : ("false"));
        log("  jd.linearOffset.Set(%.15f, %.15f);\n", this.m_linearOffset.x, this.m_linearOffset.y);
        log("  jd.angularOffset = %.15f;\n", this.m_angularOffset);
        log("  jd.maxForce = %.15f;\n", this.m_maxForce);
        log("  jd.maxTorque = %.15f;\n", this.m_maxTorque);
        log("  jd.correctionFactor = %.15f;\n", this.m_correctionFactor);
        log("  joints[%d] = this.m_world.CreateJoint(jd);\n", this.m_index);
    }
}
b2MotorJoint.SolveVelocityConstraints_s_Cdot_v2 = new b2Vec2();
b2MotorJoint.SolveVelocityConstraints_s_impulse_v2 = new b2Vec2();
b2MotorJoint.SolveVelocityConstraints_s_oldImpulse_v2 = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJNb3RvckpvaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvSm9pbnRzL2IyTW90b3JKb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLDZEQUE2RDtBQUM3RCwwREFBMEQ7QUFDMUQsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ2xELE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQU0sTUFBTSxxQkFBcUIsQ0FBQztBQUUxRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQWUsTUFBTSxXQUFXLENBQUM7QUE4QjFFLE1BQU0sT0FBTyxlQUFnQixTQUFRLFVBQVU7SUFXN0M7UUFDRSxLQUFLLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBWGxCLGlCQUFZLEdBQVcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWpELGtCQUFhLEdBQVcsQ0FBQyxDQUFDO1FBRTFCLGFBQVEsR0FBVyxDQUFDLENBQUM7UUFFckIsY0FBUyxHQUFXLENBQUMsQ0FBQztRQUV0QixxQkFBZ0IsR0FBVyxHQUFHLENBQUM7SUFJdEMsQ0FBQztJQUVNLFVBQVUsQ0FBQyxFQUFVLEVBQUUsRUFBVTtRQUN0QyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNoQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNoQixvQ0FBb0M7UUFDcEMsMkNBQTJDO1FBQzNDLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRXRFLE1BQU0sTUFBTSxHQUFXLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7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