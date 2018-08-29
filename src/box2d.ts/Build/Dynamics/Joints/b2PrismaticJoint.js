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
import { b2_linearSlop, b2_maxLinearCorrection, b2_angularSlop, b2Maybe } from "../../Common/b2Settings";
import { b2Abs, b2Min, b2Max, b2Clamp, b2Vec2, b2Mat22, b2Vec3, b2Mat33, b2Rot } from "../../Common/b2Math";
import { b2Joint, b2JointDef, b2JointType, b2LimitState } from "./b2Joint";
/// Prismatic joint definition. This requires defining a line of
/// motion using an axis and an anchor point. The definition uses local
/// anchor points and a local axis so that the initial configuration
/// can violate the constraint slightly. The joint translation is zero
/// when the local anchor points coincide in world space. Using local
/// anchors and a local axis helps when saving and loading a game.
export class b2PrismaticJointDef extends b2JointDef {
    constructor() {
        super(b2JointType.e_prismaticJoint);
        this.localAnchorA = new b2Vec2();
        this.localAnchorB = new b2Vec2();
        this.localAxisA = new b2Vec2(1, 0);
        this.referenceAngle = 0;
        this.enableLimit = false;
        this.lowerTranslation = 0;
        this.upperTranslation = 0;
        this.enableMotor = false;
        this.maxMotorForce = 0;
        this.motorSpeed = 0;
    }
    Initialize(bA, bB, anchor, axis) {
        this.bodyA = bA;
        this.bodyB = bB;
        this.bodyA.GetLocalPoint(anchor, this.localAnchorA);
        this.bodyB.GetLocalPoint(anchor, this.localAnchorB);
        this.bodyA.GetLocalVector(axis, this.localAxisA);
        this.referenceAngle = this.bodyB.GetAngle() - this.bodyA.GetAngle();
    }
}
export class b2PrismaticJoint extends b2Joint {
    constructor(def) {
        super(def);
        // Solver shared
        this.m_localAnchorA = new b2Vec2();
        this.m_localAnchorB = new b2Vec2();
        this.m_localXAxisA = new b2Vec2();
        this.m_localYAxisA = new b2Vec2();
        this.m_referenceAngle = 0;
        this.m_impulse = new b2Vec3(0, 0, 0);
        this.m_motorImpulse = 0;
        this.m_lowerTranslation = 0;
        this.m_upperTranslation = 0;
        this.m_maxMotorForce = 0;
        this.m_motorSpeed = 0;
        this.m_enableLimit = false;
        this.m_enableMotor = false;
        this.m_limitState = b2LimitState.e_inactiveLimit;
        // Solver temp
        this.m_indexA = 0;
        this.m_indexB = 0;
        this.m_localCenterA = new b2Vec2();
        this.m_localCenterB = new b2Vec2();
        this.m_invMassA = 0;
        this.m_invMassB = 0;
        this.m_invIA = 0;
        this.m_invIB = 0;
        this.m_axis = new b2Vec2(0, 0);
        this.m_perp = new b2Vec2(0, 0);
        this.m_s1 = 0;
        this.m_s2 = 0;
        this.m_a1 = 0;
        this.m_a2 = 0;
        this.m_K = new b2Mat33();
        this.m_K3 = new b2Mat33();
        this.m_K2 = new b2Mat22();
        this.m_motorMass = 0;
        this.m_qA = new b2Rot();
        this.m_qB = new b2Rot();
        this.m_lalcA = new b2Vec2();
        this.m_lalcB = new b2Vec2();
        this.m_rA = new b2Vec2();
        this.m_rB = new b2Vec2();
        this.m_localAnchorA.Copy(b2Maybe(def.localAnchorA, b2Vec2.ZERO));
        this.m_localAnchorB.Copy(b2Maybe(def.localAnchorB, b2Vec2.ZERO));
        this.m_localXAxisA.Copy(b2Maybe(def.localAxisA, new b2Vec2(1, 0))).SelfNormalize();
        b2Vec2.CrossOneV(this.m_localXAxisA, this.m_localYAxisA);
        this.m_referenceAngle = b2Maybe(def.referenceAngle, 0);
        this.m_lowerTranslation = b2Maybe(def.lowerTranslation, 0);
        this.m_upperTranslation = b2Maybe(def.upperTranslation, 0);
        this.m_maxMotorForce = b2Maybe(def.maxMotorForce, 0);
        this.m_motorSpeed = b2Maybe(def.motorSpeed, 0);
        this.m_enableLimit = b2Maybe(def.enableLimit, false);
        this.m_enableMotor = b2Maybe(def.enableMotor, false);
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
        // Compute the effective masses.
        // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        b2Vec2.SubVV(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        const rA = b2Rot.MulRV(qA, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        b2Vec2.SubVV(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        const rB = b2Rot.MulRV(qB, this.m_lalcB, this.m_rB);
        // b2Vec2 d = (cB - cA) + rB - rA;
        const d = b2Vec2.AddVV(b2Vec2.SubVV(cB, cA, b2Vec2.s_t0), b2Vec2.SubVV(rB, rA, b2Vec2.s_t1), b2PrismaticJoint.InitVelocityConstraints_s_d);
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
        // Compute motor Jacobian and effective mass.
        {
            // m_axis = b2Mul(qA, m_localXAxisA);
            b2Rot.MulRV(qA, this.m_localXAxisA, this.m_axis);
            // m_a1 = b2Cross(d + rA, m_axis);
            this.m_a1 = b2Vec2.CrossVV(b2Vec2.AddVV(d, rA, b2Vec2.s_t0), this.m_axis);
            // m_a2 = b2Cross(rB, m_axis);
            this.m_a2 = b2Vec2.CrossVV(rB, this.m_axis);
            this.m_motorMass = mA + mB + iA * this.m_a1 * this.m_a1 + iB * this.m_a2 * this.m_a2;
            if (this.m_motorMass > 0) {
                this.m_motorMass = 1 / this.m_motorMass;
            }
        }
        // Prismatic constraint.
        {
            // m_perp = b2Mul(qA, m_localYAxisA);
            b2Rot.MulRV(qA, this.m_localYAxisA, this.m_perp);
            // m_s1 = b2Cross(d + rA, m_perp);
            this.m_s1 = b2Vec2.CrossVV(b2Vec2.AddVV(d, rA, b2Vec2.s_t0), this.m_perp);
            // m_s2 = b2Cross(rB, m_perp);
            this.m_s2 = b2Vec2.CrossVV(rB, this.m_perp);
            // float32 k11 = mA + mB + iA * m_s1 * m_s1 + iB * m_s2 * m_s2;
            this.m_K.ex.x = mA + mB + iA * this.m_s1 * this.m_s1 + iB * this.m_s2 * this.m_s2;
            // float32 k12 = iA * m_s1 + iB * m_s2;
            this.m_K.ex.y = iA * this.m_s1 + iB * this.m_s2;
            // float32 k13 = iA * m_s1 * m_a1 + iB * m_s2 * m_a2;
            this.m_K.ex.z = iA * this.m_s1 * this.m_a1 + iB * this.m_s2 * this.m_a2;
            this.m_K.ey.x = this.m_K.ex.y;
            // float32 k22 = iA + iB;
            this.m_K.ey.y = iA + iB;
            if (this.m_K.ey.y === 0) {
                // For bodies with fixed rotation.
                this.m_K.ey.y = 1;
            }
            // float32 k23 = iA * m_a1 + iB * m_a2;
            this.m_K.ey.z = iA * this.m_a1 + iB * this.m_a2;
            this.m_K.ez.x = this.m_K.ex.z;
            this.m_K.ez.y = this.m_K.ey.z;
            // float32 k33 = mA + mB + iA * m_a1 * m_a1 + iB * m_a2 * m_a2;
            this.m_K.ez.z = mA + mB + iA * this.m_a1 * this.m_a1 + iB * this.m_a2 * this.m_a2;
            // m_K.ex.Set(k11, k12, k13);
            // m_K.ey.Set(k12, k22, k23);
            // m_K.ez.Set(k13, k23, k33);
        }
        // Compute motor and limit terms.
        if (this.m_enableLimit) {
            // float32 jointTranslation = b2Dot(m_axis, d);
            const jointTranslation = b2Vec2.DotVV(this.m_axis, d);
            if (b2Abs(this.m_upperTranslation - this.m_lowerTranslation) < 2 * b2_linearSlop) {
                this.m_limitState = b2LimitState.e_equalLimits;
            }
            else if (jointTranslation <= this.m_lowerTranslation) {
                if (this.m_limitState !== b2LimitState.e_atLowerLimit) {
                    this.m_limitState = b2LimitState.e_atLowerLimit;
                    this.m_impulse.z = 0;
                }
            }
            else if (jointTranslation >= this.m_upperTranslation) {
                if (this.m_limitState !== b2LimitState.e_atUpperLimit) {
                    this.m_limitState = b2LimitState.e_atUpperLimit;
                    this.m_impulse.z = 0;
                }
            }
            else {
                this.m_limitState = b2LimitState.e_inactiveLimit;
                this.m_impulse.z = 0;
            }
        }
        else {
            this.m_limitState = b2LimitState.e_inactiveLimit;
            this.m_impulse.z = 0;
        }
        if (!this.m_enableMotor) {
            this.m_motorImpulse = 0;
        }
        if (data.step.warmStarting) {
            // Account for variable time step.
            // m_impulse *= data.step.dtRatio;
            this.m_impulse.SelfMul(data.step.dtRatio);
            this.m_motorImpulse *= data.step.dtRatio;
            // b2Vec2 P = m_impulse.x * m_perp + (m_motorImpulse + m_impulse.z) * m_axis;
            const P = b2Vec2.AddVV(b2Vec2.MulSV(this.m_impulse.x, this.m_perp, b2Vec2.s_t0), b2Vec2.MulSV((this.m_motorImpulse + this.m_impulse.z), this.m_axis, b2Vec2.s_t1), b2PrismaticJoint.InitVelocityConstraints_s_P);
            // float32 LA = m_impulse.x * m_s1 + m_impulse.y + (m_motorImpulse + m_impulse.z) * m_a1;
            const LA = this.m_impulse.x * this.m_s1 + this.m_impulse.y + (this.m_motorImpulse + this.m_impulse.z) * this.m_a1;
            // float32 LB = m_impulse.x * m_s2 + m_impulse.y + (m_motorImpulse + m_impulse.z) * m_a2;
            const LB = this.m_impulse.x * this.m_s2 + this.m_impulse.y + (this.m_motorImpulse + this.m_impulse.z) * this.m_a2;
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * LA;
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * LB;
        }
        else {
            this.m_impulse.SetZero();
            this.m_motorImpulse = 0;
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
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
        // Solve linear motor constraint.
        if (this.m_enableMotor && this.m_limitState !== b2LimitState.e_equalLimits) {
            // float32 Cdot = b2Dot(m_axis, vB - vA) + m_a2 * wB - m_a1 * wA;
            const Cdot = b2Vec2.DotVV(this.m_axis, b2Vec2.SubVV(vB, vA, b2Vec2.s_t0)) + this.m_a2 * wB - this.m_a1 * wA;
            let impulse = this.m_motorMass * (this.m_motorSpeed - Cdot);
            const oldImpulse = this.m_motorImpulse;
            const maxImpulse = data.step.dt * this.m_maxMotorForce;
            this.m_motorImpulse = b2Clamp(this.m_motorImpulse + impulse, (-maxImpulse), maxImpulse);
            impulse = this.m_motorImpulse - oldImpulse;
            // b2Vec2 P = impulse * m_axis;
            const P = b2Vec2.MulSV(impulse, this.m_axis, b2PrismaticJoint.SolveVelocityConstraints_s_P);
            const LA = impulse * this.m_a1;
            const LB = impulse * this.m_a2;
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * LA;
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * LB;
        }
        // b2Vec2 Cdot1;
        // Cdot1.x = b2Dot(m_perp, vB - vA) + m_s2 * wB - m_s1 * wA;
        const Cdot1_x = b2Vec2.DotVV(this.m_perp, b2Vec2.SubVV(vB, vA, b2Vec2.s_t0)) + this.m_s2 * wB - this.m_s1 * wA;
        // Cdot1.y = wB - wA;
        const Cdot1_y = wB - wA;
        if (this.m_enableLimit && this.m_limitState !== b2LimitState.e_inactiveLimit) {
            // Solve prismatic and limit constraint in block form.
            // float32 Cdot2;
            // Cdot2 = b2Dot(m_axis, vB - vA) + m_a2 * wB - m_a1 * wA;
            const Cdot2 = b2Vec2.DotVV(this.m_axis, b2Vec2.SubVV(vB, vA, b2Vec2.s_t0)) + this.m_a2 * wB - this.m_a1 * wA;
            // b2Vec3 Cdot(Cdot1.x, Cdot1.y, Cdot2);
            // b2Vec3 f1 = m_impulse;
            const f1 = b2PrismaticJoint.SolveVelocityConstraints_s_f1.Copy(this.m_impulse);
            // b2Vec3 df =  m_K.Solve33(-Cdot);
            const df3 = this.m_K.Solve33((-Cdot1_x), (-Cdot1_y), (-Cdot2), b2PrismaticJoint.SolveVelocityConstraints_s_df3);
            // m_impulse += df;
            this.m_impulse.SelfAdd(df3);
            if (this.m_limitState === b2LimitState.e_atLowerLimit) {
                this.m_impulse.z = b2Max(this.m_impulse.z, 0);
            }
            else if (this.m_limitState === b2LimitState.e_atUpperLimit) {
                this.m_impulse.z = b2Min(this.m_impulse.z, 0);
            }
            // f2(1:2) = invK(1:2,1:2) * (-Cdot(1:2) - K(1:2,3) * (f2(3) - f1(3))) + f1(1:2)
            // b2Vec2 b = -Cdot1 - (m_impulse.z - f1.z) * b2Vec2(m_K.ez.x, m_K.ez.y);
            const b_x = (-Cdot1_x) - (this.m_impulse.z - f1.z) * this.m_K.ez.x;
            const b_y = (-Cdot1_y) - (this.m_impulse.z - f1.z) * this.m_K.ez.y;
            // b2Vec2 f2r = m_K.Solve22(b) + b2Vec2(f1.x, f1.y);
            const f2r = this.m_K.Solve22(b_x, b_y, b2PrismaticJoint.SolveVelocityConstraints_s_f2r);
            f2r.x += f1.x;
            f2r.y += f1.y;
            // m_impulse.x = f2r.x;
            this.m_impulse.x = f2r.x;
            // m_impulse.y = f2r.y;
            this.m_impulse.y = f2r.y;
            // df = m_impulse - f1;
            df3.x = this.m_impulse.x - f1.x;
            df3.y = this.m_impulse.y - f1.y;
            df3.z = this.m_impulse.z - f1.z;
            // b2Vec2 P = df.x * m_perp + df.z * m_axis;
            const P = b2Vec2.AddVV(b2Vec2.MulSV(df3.x, this.m_perp, b2Vec2.s_t0), b2Vec2.MulSV(df3.z, this.m_axis, b2Vec2.s_t1), b2PrismaticJoint.SolveVelocityConstraints_s_P);
            // float32 LA = df.x * m_s1 + df.y + df.z * m_a1;
            const LA = df3.x * this.m_s1 + df3.y + df3.z * this.m_a1;
            // float32 LB = df.x * m_s2 + df.y + df.z * m_a2;
            const LB = df3.x * this.m_s2 + df3.y + df3.z * this.m_a2;
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * LA;
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * LB;
        }
        else {
            // Limit is inactive, just solve the prismatic constraint in block form.
            // b2Vec2 df = m_K.Solve22(-Cdot1);
            const df2 = this.m_K.Solve22((-Cdot1_x), (-Cdot1_y), b2PrismaticJoint.SolveVelocityConstraints_s_df2);
            this.m_impulse.x += df2.x;
            this.m_impulse.y += df2.y;
            // b2Vec2 P = df.x * m_perp;
            const P = b2Vec2.MulSV(df2.x, this.m_perp, b2PrismaticJoint.SolveVelocityConstraints_s_P);
            // float32 LA = df.x * m_s1 + df.y;
            const LA = df2.x * this.m_s1 + df2.y;
            // float32 LB = df.x * m_s2 + df.y;
            const LB = df2.x * this.m_s2 + df2.y;
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * LA;
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * LB;
        }
        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }
    SolvePositionConstraints(data) {
        const cA = data.positions[this.m_indexA].c;
        let aA = data.positions[this.m_indexA].a;
        const cB = data.positions[this.m_indexB].c;
        let aB = data.positions[this.m_indexB].a;
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB);
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
        // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        const rA = b2Rot.MulRV(qA, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        const rB = b2Rot.MulRV(qB, this.m_lalcB, this.m_rB);
        // b2Vec2 d = cB + rB - cA - rA;
        const d = b2Vec2.SubVV(b2Vec2.AddVV(cB, rB, b2Vec2.s_t0), b2Vec2.AddVV(cA, rA, b2Vec2.s_t1), b2PrismaticJoint.SolvePositionConstraints_s_d);
        // b2Vec2 axis = b2Mul(qA, m_localXAxisA);
        const axis = b2Rot.MulRV(qA, this.m_localXAxisA, this.m_axis);
        // float32 a1 = b2Cross(d + rA, axis);
        const a1 = b2Vec2.CrossVV(b2Vec2.AddVV(d, rA, b2Vec2.s_t0), axis);
        // float32 a2 = b2Cross(rB, axis);
        const a2 = b2Vec2.CrossVV(rB, axis);
        // b2Vec2 perp = b2Mul(qA, m_localYAxisA);
        const perp = b2Rot.MulRV(qA, this.m_localYAxisA, this.m_perp);
        // float32 s1 = b2Cross(d + rA, perp);
        const s1 = b2Vec2.CrossVV(b2Vec2.AddVV(d, rA, b2Vec2.s_t0), perp);
        // float32 s2 = b2Cross(rB, perp);
        const s2 = b2Vec2.CrossVV(rB, perp);
        // b2Vec3 impulse;
        let impulse = b2PrismaticJoint.SolvePositionConstraints_s_impulse;
        // b2Vec2 C1;
        // C1.x = b2Dot(perp, d);
        const C1_x = b2Vec2.DotVV(perp, d);
        // C1.y = aB - aA - m_referenceAngle;
        const C1_y = aB - aA - this.m_referenceAngle;
        let linearError = b2Abs(C1_x);
        const angularError = b2Abs(C1_y);
        let active = false;
        let C2 = 0;
        if (this.m_enableLimit) {
            // float32 translation = b2Dot(axis, d);
            const translation = b2Vec2.DotVV(axis, d);
            if (b2Abs(this.m_upperTranslation - this.m_lowerTranslation) < 2 * b2_linearSlop) {
                // Prevent large angular corrections
                C2 = b2Clamp(translation, (-b2_maxLinearCorrection), b2_maxLinearCorrection);
                linearError = b2Max(linearError, b2Abs(translation));
                active = true;
            }
            else if (translation <= this.m_lowerTranslation) {
                // Prevent large linear corrections and allow some slop.
                C2 = b2Clamp(translation - this.m_lowerTranslation + b2_linearSlop, (-b2_maxLinearCorrection), 0);
                linearError = b2Max(linearError, this.m_lowerTranslation - translation);
                active = true;
            }
            else if (translation >= this.m_upperTranslation) {
                // Prevent large linear corrections and allow some slop.
                C2 = b2Clamp(translation - this.m_upperTranslation - b2_linearSlop, 0, b2_maxLinearCorrection);
                linearError = b2Max(linearError, translation - this.m_upperTranslation);
                active = true;
            }
        }
        if (active) {
            // float32 k11 = mA + mB + iA * s1 * s1 + iB * s2 * s2;
            const k11 = mA + mB + iA * s1 * s1 + iB * s2 * s2;
            // float32 k12 = iA * s1 + iB * s2;
            const k12 = iA * s1 + iB * s2;
            // float32 k13 = iA * s1 * a1 + iB * s2 * a2;
            const k13 = iA * s1 * a1 + iB * s2 * a2;
            // float32 k22 = iA + iB;
            let k22 = iA + iB;
            if (k22 === 0) {
                // For fixed rotation
                k22 = 1;
            }
            // float32 k23 = iA * a1 + iB * a2;
            const k23 = iA * a1 + iB * a2;
            // float32 k33 = mA + mB + iA * a1 * a1 + iB * a2 * a2;
            const k33 = mA + mB + iA * a1 * a1 + iB * a2 * a2;
            // b2Mat33 K;
            const K = this.m_K3;
            // K.ex.Set(k11, k12, k13);
            K.ex.SetXYZ(k11, k12, k13);
            // K.ey.Set(k12, k22, k23);
            K.ey.SetXYZ(k12, k22, k23);
            // K.ez.Set(k13, k23, k33);
            K.ez.SetXYZ(k13, k23, k33);
            // b2Vec3 C;
            // C.x = C1.x;
            // C.y = C1.y;
            // C.z = C2;
            // impulse = K.Solve33(-C);
            impulse = K.Solve33((-C1_x), (-C1_y), (-C2), impulse);
        }
        else {
            // float32 k11 = mA + mB + iA * s1 * s1 + iB * s2 * s2;
            const k11 = mA + mB + iA * s1 * s1 + iB * s2 * s2;
            // float32 k12 = iA * s1 + iB * s2;
            const k12 = iA * s1 + iB * s2;
            // float32 k22 = iA + iB;
            let k22 = iA + iB;
            if (k22 === 0) {
                k22 = 1;
            }
            // b2Mat22 K;
            const K2 = this.m_K2;
            // K.ex.Set(k11, k12);
            K2.ex.Set(k11, k12);
            // K.ey.Set(k12, k22);
            K2.ey.Set(k12, k22);
            // b2Vec2 impulse1 = K.Solve(-C1);
            const impulse1 = K2.Solve((-C1_x), (-C1_y), b2PrismaticJoint.SolvePositionConstraints_s_impulse1);
            impulse.x = impulse1.x;
            impulse.y = impulse1.y;
            impulse.z = 0;
        }
        // b2Vec2 P = impulse.x * perp + impulse.z * axis;
        const P = b2Vec2.AddVV(b2Vec2.MulSV(impulse.x, perp, b2Vec2.s_t0), b2Vec2.MulSV(impulse.z, axis, b2Vec2.s_t1), b2PrismaticJoint.SolvePositionConstraints_s_P);
        // float32 LA = impulse.x * s1 + impulse.y + impulse.z * a1;
        const LA = impulse.x * s1 + impulse.y + impulse.z * a1;
        // float32 LB = impulse.x * s2 + impulse.y + impulse.z * a2;
        const LB = impulse.x * s2 + impulse.y + impulse.z * a2;
        // cA -= mA * P;
        cA.SelfMulSub(mA, P);
        aA -= iA * LA;
        // cB += mB * P;
        cB.SelfMulAdd(mB, P);
        aB += iB * LB;
        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;
        return linearError <= b2_linearSlop && angularError <= b2_angularSlop;
    }
    GetAnchorA(out) {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }
    GetAnchorB(out) {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }
    GetReactionForce(inv_dt, out) {
        // return inv_dt * (m_impulse.x * m_perp + (m_motorImpulse + m_impulse.z) * m_axis);
        out.x = inv_dt * (this.m_impulse.x * this.m_perp.x + (this.m_motorImpulse + this.m_impulse.z) * this.m_axis.x);
        out.y = inv_dt * (this.m_impulse.x * this.m_perp.y + (this.m_motorImpulse + this.m_impulse.z) * this.m_axis.y);
        return out;
    }
    GetReactionTorque(inv_dt) {
        return inv_dt * this.m_impulse.y;
    }
    GetLocalAnchorA() { return this.m_localAnchorA; }
    GetLocalAnchorB() { return this.m_localAnchorB; }
    GetLocalAxisA() { return this.m_localXAxisA; }
    GetReferenceAngle() { return this.m_referenceAngle; }
    GetJointTranslation() {
        // b2Vec2 pA = m_bodyA.GetWorldPoint(m_localAnchorA);
        const pA = this.m_bodyA.GetWorldPoint(this.m_localAnchorA, b2PrismaticJoint.GetJointTranslation_s_pA);
        // b2Vec2 pB = m_bodyB.GetWorldPoint(m_localAnchorB);
        const pB = this.m_bodyB.GetWorldPoint(this.m_localAnchorB, b2PrismaticJoint.GetJointTranslation_s_pB);
        // b2Vec2 d = pB - pA;
        const d = b2Vec2.SubVV(pB, pA, b2PrismaticJoint.GetJointTranslation_s_d);
        // b2Vec2 axis = m_bodyA.GetWorldVector(m_localXAxisA);
        const axis = this.m_bodyA.GetWorldVector(this.m_localXAxisA, b2PrismaticJoint.GetJointTranslation_s_axis);
        // float32 translation = b2Dot(d, axis);
        const translation = b2Vec2.DotVV(d, axis);
        return translation;
    }
    GetJointSpeed() {
        const bA = this.m_bodyA;
        const bB = this.m_bodyB;
        // b2Vec2 rA = b2Mul(bA->m_xf.q, m_localAnchorA - bA->m_sweep.localCenter);
        b2Vec2.SubVV(this.m_localAnchorA, bA.m_sweep.localCenter, this.m_lalcA);
        const rA = b2Rot.MulRV(bA.m_xf.q, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(bB->m_xf.q, m_localAnchorB - bB->m_sweep.localCenter);
        b2Vec2.SubVV(this.m_localAnchorB, bB.m_sweep.localCenter, this.m_lalcB);
        const rB = b2Rot.MulRV(bB.m_xf.q, this.m_lalcB, this.m_rB);
        // b2Vec2 pA = bA->m_sweep.c + rA;
        const pA = b2Vec2.AddVV(bA.m_sweep.c, rA, b2Vec2.s_t0); // pA uses s_t0
        // b2Vec2 pB = bB->m_sweep.c + rB;
        const pB = b2Vec2.AddVV(bB.m_sweep.c, rB, b2Vec2.s_t1); // pB uses s_t1
        // b2Vec2 d = pB - pA;
        const d = b2Vec2.SubVV(pB, pA, b2Vec2.s_t2); // d uses s_t2
        // b2Vec2 axis = b2Mul(bA.m_xf.q, m_localXAxisA);
        const axis = bA.GetWorldVector(this.m_localXAxisA, this.m_axis);
        const vA = bA.m_linearVelocity;
        const vB = bB.m_linearVelocity;
        const wA = bA.m_angularVelocity;
        const wB = bB.m_angularVelocity;
        // float32 speed = b2Dot(d, b2Cross(wA, axis)) + b2Dot(axis, vB + b2Cross(wB, rB) - vA - b2Cross(wA, rA));
        const speed = b2Vec2.DotVV(d, b2Vec2.CrossSV(wA, axis, b2Vec2.s_t0)) +
            b2Vec2.DotVV(axis, b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, rA, b2Vec2.s_t1), b2Vec2.s_t0));
        return speed;
    }
    IsLimitEnabled() {
        return this.m_enableLimit;
    }
    EnableLimit(flag) {
        if (flag !== this.m_enableLimit) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_enableLimit = flag;
            this.m_impulse.z = 0;
        }
    }
    GetLowerLimit() {
        return this.m_lowerTranslation;
    }
    GetUpperLimit() {
        return this.m_upperTranslation;
    }
    SetLimits(lower, upper) {
        if (lower !== this.m_lowerTranslation || upper !== this.m_upperTranslation) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_lowerTranslation = lower;
            this.m_upperTranslation = upper;
            this.m_impulse.z = 0;
        }
    }
    IsMotorEnabled() {
        return this.m_enableMotor;
    }
    EnableMotor(flag) {
        if (flag !== this.m_enableMotor) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_enableMotor = flag;
        }
    }
    SetMotorSpeed(speed) {
        if (speed !== this.m_motorSpeed) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_motorSpeed = speed;
        }
    }
    GetMotorSpeed() {
        return this.m_motorSpeed;
    }
    SetMaxMotorForce(force) {
        if (force !== this.m_maxMotorForce) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_maxMotorForce = force;
        }
    }
    GetMaxMotorForce() { return this.m_maxMotorForce; }
    GetMotorForce(inv_dt) {
        return inv_dt * this.m_motorImpulse;
    }
    Dump(log) {
        const indexA = this.m_bodyA.m_islandIndex;
        const indexB = this.m_bodyB.m_islandIndex;
        log("  const jd: b2PrismaticJointDef = new b2PrismaticJointDef();\n");
        log("  jd.bodyA = bodies[%d];\n", indexA);
        log("  jd.bodyB = bodies[%d];\n", indexB);
        log("  jd.collideConnected = %s;\n", (this.m_collideConnected) ? ("true") : ("false"));
        log("  jd.localAnchorA.Set(%.15f, %.15f);\n", this.m_localAnchorA.x, this.m_localAnchorA.y);
        log("  jd.localAnchorB.Set(%.15f, %.15f);\n", this.m_localAnchorB.x, this.m_localAnchorB.y);
        log("  jd.localAxisA.Set(%.15f, %.15f);\n", this.m_localXAxisA.x, this.m_localXAxisA.y);
        log("  jd.referenceAngle = %.15f;\n", this.m_referenceAngle);
        log("  jd.enableLimit = %s;\n", (this.m_enableLimit) ? ("true") : ("false"));
        log("  jd.lowerTranslation = %.15f;\n", this.m_lowerTranslation);
        log("  jd.upperTranslation = %.15f;\n", this.m_upperTranslation);
        log("  jd.enableMotor = %s;\n", (this.m_enableMotor) ? ("true") : ("false"));
        log("  jd.motorSpeed = %.15f;\n", this.m_motorSpeed);
        log("  jd.maxMotorForce = %.15f;\n", this.m_maxMotorForce);
        log("  joints[%d] = this.m_world.CreateJoint(jd);\n", this.m_index);
    }
}
b2PrismaticJoint.InitVelocityConstraints_s_d = new b2Vec2();
b2PrismaticJoint.InitVelocityConstraints_s_P = new b2Vec2();
b2PrismaticJoint.SolveVelocityConstraints_s_P = new b2Vec2();
b2PrismaticJoint.SolveVelocityConstraints_s_f2r = new b2Vec2();
b2PrismaticJoint.SolveVelocityConstraints_s_f1 = new b2Vec3();
b2PrismaticJoint.SolveVelocityConstraints_s_df3 = new b2Vec3();
b2PrismaticJoint.SolveVelocityConstraints_s_df2 = new b2Vec2();
// A velocity based solver computes reaction forces(impulses) using the velocity constraint solver.Under this context,
// the position solver is not there to resolve forces.It is only there to cope with integration error.
//
// Therefore, the pseudo impulses in the position solver do not have any physical meaning.Thus it is okay if they suck.
//
// We could take the active state from the velocity solver.However, the joint might push past the limit when the velocity
// solver indicates the limit is inactive.
b2PrismaticJoint.SolvePositionConstraints_s_d = new b2Vec2();
b2PrismaticJoint.SolvePositionConstraints_s_impulse = new b2Vec3();
b2PrismaticJoint.SolvePositionConstraints_s_impulse1 = new b2Vec2();
b2PrismaticJoint.SolvePositionConstraints_s_P = new b2Vec2();
b2PrismaticJoint.GetJointTranslation_s_pA = new b2Vec2();
b2PrismaticJoint.GetJointTranslation_s_pB = new b2Vec2();
b2PrismaticJoint.GetJointTranslation_s_d = new b2Vec2();
b2PrismaticJoint.GetJointTranslation_s_axis = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJQcmlzbWF0aWNKb2ludC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0R5bmFtaWNzL0pvaW50cy9iMlByaXNtYXRpY0pvaW50LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsT0FBTyxFQUFFLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDekcsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFNLE1BQU0scUJBQXFCLENBQUM7QUFFaEgsT0FBTyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBZSxNQUFNLFdBQVcsQ0FBQztBQXlCeEYsZ0VBQWdFO0FBQ2hFLHVFQUF1RTtBQUN2RSxvRUFBb0U7QUFDcEUsc0VBQXNFO0FBQ3RFLHFFQUFxRTtBQUNyRSxrRUFBa0U7QUFDbEUsTUFBTSxPQUFPLG1CQUFvQixTQUFRLFVBQVU7SUFxQmpEO1FBQ0UsS0FBSyxDQUFDLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBckJ0QixpQkFBWSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFFcEMsaUJBQVksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBRXBDLGVBQVUsR0FBVyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFL0MsbUJBQWMsR0FBVyxDQUFDLENBQUM7UUFFM0IsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFcEIscUJBQWdCLEdBQVcsQ0FBQyxDQUFDO1FBRTdCLHFCQUFnQixHQUFXLENBQUMsQ0FBQztRQUU3QixnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUVwQixrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUUx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