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
import { b2_linearSlop, b2_angularSlop, b2_maxAngularCorrection, b2Maybe } from "../../Common/b2Settings";
import { b2Abs, b2Clamp, b2Vec2, b2Mat22, b2Vec3, b2Mat33, b2Rot } from "../../Common/b2Math";
import { b2Joint, b2JointDef, b2JointType, b2LimitState } from "./b2Joint";
/// Revolute joint definition. This requires defining an
/// anchor point where the bodies are joined. The definition
/// uses local anchor points so that the initial configuration
/// can violate the constraint slightly. You also need to
/// specify the initial relative angle for joint limits. This
/// helps when saving and loading a game.
/// The local anchor points are measured from the body's origin
/// rather than the center of mass because:
/// 1. you might not know where the center of mass will be.
/// 2. if you add/remove shapes from a body and recompute the mass,
///    the joints will be broken.
export class b2RevoluteJointDef extends b2JointDef {
    constructor() {
        super(b2JointType.e_revoluteJoint);
        this.localAnchorA = new b2Vec2(0, 0);
        this.localAnchorB = new b2Vec2(0, 0);
        this.referenceAngle = 0;
        this.enableLimit = false;
        this.lowerAngle = 0;
        this.upperAngle = 0;
        this.enableMotor = false;
        this.motorSpeed = 0;
        this.maxMotorTorque = 0;
    }
    Initialize(bA, bB, anchor) {
        this.bodyA = bA;
        this.bodyB = bB;
        this.bodyA.GetLocalPoint(anchor, this.localAnchorA);
        this.bodyB.GetLocalPoint(anchor, this.localAnchorB);
        this.referenceAngle = this.bodyB.GetAngle() - this.bodyA.GetAngle();
    }
}
export class b2RevoluteJoint extends b2Joint {
    constructor(def) {
        super(def);
        // Solver shared
        this.m_localAnchorA = new b2Vec2();
        this.m_localAnchorB = new b2Vec2();
        this.m_impulse = new b2Vec3();
        this.m_motorImpulse = 0;
        this.m_enableMotor = false;
        this.m_maxMotorTorque = 0;
        this.m_motorSpeed = 0;
        this.m_enableLimit = false;
        this.m_referenceAngle = 0;
        this.m_lowerAngle = 0;
        this.m_upperAngle = 0;
        // Solver temp
        this.m_indexA = 0;
        this.m_indexB = 0;
        this.m_rA = new b2Vec2();
        this.m_rB = new b2Vec2();
        this.m_localCenterA = new b2Vec2();
        this.m_localCenterB = new b2Vec2();
        this.m_invMassA = 0;
        this.m_invMassB = 0;
        this.m_invIA = 0;
        this.m_invIB = 0;
        this.m_mass = new b2Mat33(); // effective mass for point-to-point constraint.
        this.m_motorMass = 0; // effective mass for motor/limit angular constraint.
        this.m_limitState = b2LimitState.e_inactiveLimit;
        this.m_qA = new b2Rot();
        this.m_qB = new b2Rot();
        this.m_lalcA = new b2Vec2();
        this.m_lalcB = new b2Vec2();
        this.m_K = new b2Mat22();
        this.m_localAnchorA.Copy(b2Maybe(def.localAnchorA, b2Vec2.ZERO));
        this.m_localAnchorB.Copy(b2Maybe(def.localAnchorB, b2Vec2.ZERO));
        this.m_referenceAngle = b2Maybe(def.referenceAngle, 0);
        this.m_impulse.SetZero();
        this.m_motorImpulse = 0;
        this.m_lowerAngle = b2Maybe(def.lowerAngle, 0);
        this.m_upperAngle = b2Maybe(def.upperAngle, 0);
        this.m_maxMotorTorque = b2Maybe(def.maxMotorTorque, 0);
        this.m_motorSpeed = b2Maybe(def.motorSpeed, 0);
        this.m_enableLimit = b2Maybe(def.enableLimit, false);
        this.m_enableMotor = b2Maybe(def.enableMotor, false);
        this.m_limitState = b2LimitState.e_inactiveLimit;
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
        const aA = data.positions[this.m_indexA].a;
        const vA = data.velocities[this.m_indexA].v;
        let wA = data.velocities[this.m_indexA].w;
        const aB = data.positions[this.m_indexB].a;
        const vB = data.velocities[this.m_indexB].v;
        let wB = data.velocities[this.m_indexB].w;
        // b2Rot qA(aA), qB(aB);
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB);
        // m_rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        b2Vec2.SubVV(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        b2Rot.MulRV(qA, this.m_lalcA, this.m_rA);
        // m_rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        b2Vec2.SubVV(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        b2Rot.MulRV(qB, this.m_lalcB, this.m_rB);
        // J = [-I -r1_skew I r2_skew]
        //     [ 0       -1 0       1]
        // r_skew = [-ry; rx]
        // Matlab
        // K = [ mA+r1y^2*iA+mB+r2y^2*iB,  -r1y*iA*r1x-r2y*iB*r2x,          -r1y*iA-r2y*iB]
        //     [  -r1y*iA*r1x-r2y*iB*r2x, mA+r1x^2*iA+mB+r2x^2*iB,           r1x*iA+r2x*iB]
        //     [          -r1y*iA-r2y*iB,           r1x*iA+r2x*iB,                   iA+iB]
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
        const fixedRotation = (iA + iB === 0);
        this.m_mass.ex.x = mA + mB + this.m_rA.y * this.m_rA.y * iA + this.m_rB.y * this.m_rB.y * iB;
        this.m_mass.ey.x = -this.m_rA.y * this.m_rA.x * iA - this.m_rB.y * this.m_rB.x * iB;
        this.m_mass.ez.x = -this.m_rA.y * iA - this.m_rB.y * iB;
        this.m_mass.ex.y = this.m_mass.ey.x;
        this.m_mass.ey.y = mA + mB + this.m_rA.x * this.m_rA.x * iA + this.m_rB.x * this.m_rB.x * iB;
        this.m_mass.ez.y = this.m_rA.x * iA + this.m_rB.x * iB;
        this.m_mass.ex.z = this.m_mass.ez.x;
        this.m_mass.ey.z = this.m_mass.ez.y;
        this.m_mass.ez.z = iA + iB;
        this.m_motorMass = iA + iB;
        if (this.m_motorMass > 0) {
            this.m_motorMass = 1 / this.m_motorMass;
        }
        if (!this.m_enableMotor || fixedRotation) {
            this.m_motorImpulse = 0;
        }
        if (this.m_enableLimit && !fixedRotation) {
            const jointAngle = aB - aA - this.m_referenceAngle;
            if (b2Abs(this.m_upperAngle - this.m_lowerAngle) < 2 * b2_angularSlop) {
                this.m_limitState = b2LimitState.e_equalLimits;
            }
            else if (jointAngle <= this.m_lowerAngle) {
                if (this.m_limitState !== b2LimitState.e_atLowerLimit) {
                    this.m_impulse.z = 0;
                }
                this.m_limitState = b2LimitState.e_atLowerLimit;
            }
            else if (jointAngle >= this.m_upperAngle) {
                if (this.m_limitState !== b2LimitState.e_atUpperLimit) {
                    this.m_impulse.z = 0;
                }
                this.m_limitState = b2LimitState.e_atUpperLimit;
            }
            else {
                this.m_limitState = b2LimitState.e_inactiveLimit;
                this.m_impulse.z = 0;
            }
        }
        else {
            this.m_limitState = b2LimitState.e_inactiveLimit;
        }
        if (data.step.warmStarting) {
            // Scale impulses to support a variable time step.
            this.m_impulse.SelfMul(data.step.dtRatio);
            this.m_motorImpulse *= data.step.dtRatio;
            // b2Vec2 P(m_impulse.x, m_impulse.y);
            const P = b2RevoluteJoint.InitVelocityConstraints_s_P.Set(this.m_impulse.x, this.m_impulse.y);
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * (b2Vec2.CrossVV(this.m_rA, P) + this.m_motorImpulse + this.m_impulse.z);
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * (b2Vec2.CrossVV(this.m_rB, P) + this.m_motorImpulse + this.m_impulse.z);
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
        const fixedRotation = (iA + iB === 0);
        // Solve motor constraint.
        if (this.m_enableMotor && this.m_limitState !== b2LimitState.e_equalLimits && !fixedRotation) {
            const Cdot = wB - wA - this.m_motorSpeed;
            let impulse = -this.m_motorMass * Cdot;
            const oldImpulse = this.m_motorImpulse;
            const maxImpulse = data.step.dt * this.m_maxMotorTorque;
            this.m_motorImpulse = b2Clamp(this.m_motorImpulse + impulse, -maxImpulse, maxImpulse);
            impulse = this.m_motorImpulse - oldImpulse;
            wA -= iA * impulse;
            wB += iB * impulse;
        }
        // Solve limit constraint.
        if (this.m_enableLimit && this.m_limitState !== b2LimitState.e_inactiveLimit && !fixedRotation) {
            // b2Vec2 Cdot1 = vB + b2Cross(wB, m_rB) - vA - b2Cross(wA, m_rA);
            const Cdot1 = b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, this.m_rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, this.m_rA, b2Vec2.s_t1), b2RevoluteJoint.SolveVelocityConstraints_s_Cdot1);
            const Cdot2 = wB - wA;
            // b2Vec3 Cdot(Cdot1.x, Cdot1.y, Cdot2);
            // b2Vec3 impulse = -this.m_mass.Solve33(Cdot);
            const impulse_v3 = this.m_mass.Solve33(Cdot1.x, Cdot1.y, Cdot2, b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v3).SelfNeg();
            if (this.m_limitState === b2LimitState.e_equalLimits) {
                this.m_impulse.SelfAdd(impulse_v3);
            }
            else if (this.m_limitState === b2LimitState.e_atLowerLimit) {
                const newImpulse = this.m_impulse.z + impulse_v3.z;
                if (newImpulse < 0) {
                    // b2Vec2 rhs = -Cdot1 + m_impulse.z * b2Vec2(m_mass.ez.x, m_mass.ez.y);
                    const rhs_x = -Cdot1.x + this.m_impulse.z * this.m_mass.ez.x;
                    const rhs_y = -Cdot1.y + this.m_impulse.z * this.m_mass.ez.y;
                    const reduced_v2 = this.m_mass.Solve22(rhs_x, rhs_y, b2RevoluteJoint.SolveVelocityConstraints_s_reduced_v2);
                    impulse_v3.x = reduced_v2.x;
                    impulse_v3.y = reduced_v2.y;
                    impulse_v3.z = -this.m_impulse.z;
                    this.m_impulse.x += reduced_v2.x;
                    this.m_impulse.y += reduced_v2.y;
                    this.m_impulse.z = 0;
                }
                else {
                    this.m_impulse.SelfAdd(impulse_v3);
                }
            }
            else if (this.m_limitState === b2LimitState.e_atUpperLimit) {
                const newImpulse = this.m_impulse.z + impulse_v3.z;
                if (newImpulse > 0) {
                    // b2Vec2 rhs = -Cdot1 + m_impulse.z * b2Vec2(m_mass.ez.x, m_mass.ez.y);
                    const rhs_x = -Cdot1.x + this.m_impulse.z * this.m_mass.ez.x;
                    const rhs_y = -Cdot1.y + this.m_impulse.z * this.m_mass.ez.y;
                    const reduced_v2 = this.m_mass.Solve22(rhs_x, rhs_y, b2RevoluteJoint.SolveVelocityConstraints_s_reduced_v2);
                    impulse_v3.x = reduced_v2.x;
                    impulse_v3.y = reduced_v2.y;
                    impulse_v3.z = -this.m_impulse.z;
                    this.m_impulse.x += reduced_v2.x;
                    this.m_impulse.y += reduced_v2.y;
                    this.m_impulse.z = 0;
                }
                else {
                    this.m_impulse.SelfAdd(impulse_v3);
                }
            }
            // b2Vec2 P(impulse.x, impulse.y);
            const P = b2RevoluteJoint.SolveVelocityConstraints_s_P.Set(impulse_v3.x, impulse_v3.y);
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * (b2Vec2.CrossVV(this.m_rA, P) + impulse_v3.z);
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * (b2Vec2.CrossVV(this.m_rB, P) + impulse_v3.z);
        }
        else {
            // Solve point-to-point constraint
            // b2Vec2 Cdot = vB + b2Cross(wB, m_rB) - vA - b2Cross(wA, m_rA);
            const Cdot_v2 = b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, this.m_rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, this.m_rA, b2Vec2.s_t1), b2RevoluteJoint.SolveVelocityConstraints_s_Cdot_v2);
            // b2Vec2 impulse = m_mass.Solve22(-Cdot);
            const impulse_v2 = this.m_mass.Solve22(-Cdot_v2.x, -Cdot_v2.y, b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v2);
            this.m_impulse.x += impulse_v2.x;
            this.m_impulse.y += impulse_v2.y;
            // vA -= mA * impulse;
            vA.SelfMulSub(mA, impulse_v2);
            wA -= iA * b2Vec2.CrossVV(this.m_rA, impulse_v2);
            // vB += mB * impulse;
            vB.SelfMulAdd(mB, impulse_v2);
            wB += iB * b2Vec2.CrossVV(this.m_rB, impulse_v2);
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
        // b2Rot qA(aA), qB(aB);
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB);
        let angularError = 0;
        let positionError = 0;
        const fixedRotation = (this.m_invIA + this.m_invIB === 0);
        // Solve angular limit constraint.
        if (this.m_enableLimit && this.m_limitState !== b2LimitState.e_inactiveLimit && !fixedRotation) {
            const angle = aB - aA - this.m_referenceAngle;
            let limitImpulse = 0;
            if (this.m_limitState === b2LimitState.e_equalLimits) {
                // Prevent large angular corrections
                const C = b2Clamp(angle - this.m_lowerAngle, -b2_maxAngularCorrection, b2_maxAngularCorrection);
                limitImpulse = -this.m_motorMass * C;
                angularError = b2Abs(C);
            }
            else if (this.m_limitState === b2LimitState.e_atLowerLimit) {
                let C = angle - this.m_lowerAngle;
                angularError = -C;
                // Prevent large angular corrections and allow some slop.
                C = b2Clamp(C + b2_angularSlop, -b2_maxAngularCorrection, 0);
                limitImpulse = -this.m_motorMass * C;
            }
            else if (this.m_limitState === b2LimitState.e_atUpperLimit) {
                let C = angle - this.m_upperAngle;
                angularError = C;
                // Prevent large angular corrections and allow some slop.
                C = b2Clamp(C - b2_angularSlop, 0, b2_maxAngularCorrection);
                limitImpulse = -this.m_motorMass * C;
            }
            aA -= this.m_invIA * limitImpulse;
            aB += this.m_invIB * limitImpulse;
        }
        // Solve point-to-point constraint.
        {
            qA.SetAngle(aA);
            qB.SetAngle(aB);
            // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
            b2Vec2.SubVV(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
            const rA = b2Rot.MulRV(qA, this.m_lalcA, this.m_rA);
            // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
            b2Vec2.SubVV(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
            const rB = b2Rot.MulRV(qB, this.m_lalcB, this.m_rB);
            // b2Vec2 C = cB + rB - cA - rA;
            const C_v2 = b2Vec2.SubVV(b2Vec2.AddVV(cB, rB, b2Vec2.s_t0), b2Vec2.AddVV(cA, rA, b2Vec2.s_t1), b2RevoluteJoint.SolvePositionConstraints_s_C_v2);
            // positionError = C.Length();
            positionError = C_v2.Length();
            const mA = this.m_invMassA, mB = this.m_invMassB;
            const iA = this.m_invIA, iB = this.m_invIB;
            const K = this.m_K;
            K.ex.x = mA + mB + iA * rA.y * rA.y + iB * rB.y * rB.y;
            K.ex.y = -iA * rA.x * rA.y - iB * rB.x * rB.y;
            K.ey.x = K.ex.y;
            K.ey.y = mA + mB + iA * rA.x * rA.x + iB * rB.x * rB.x;
            // b2Vec2 impulse = -K.Solve(C);
            const impulse = K.Solve(C_v2.x, C_v2.y, b2RevoluteJoint.SolvePositionConstraints_s_impulse).SelfNeg();
            // cA -= mA * impulse;
            cA.SelfMulSub(mA, impulse);
            aA -= iA * b2Vec2.CrossVV(rA, impulse);
            // cB += mB * impulse;
            cB.SelfMulAdd(mB, impulse);
            aB += iB * b2Vec2.CrossVV(rB, impulse);
        }
        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;
        return positionError <= b2_linearSlop && angularError <= b2_angularSlop;
    }
    GetAnchorA(out) {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }
    GetAnchorB(out) {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }
    GetReactionForce(inv_dt, out) {
        // b2Vec2 P(this.m_impulse.x, this.m_impulse.y);
        // return inv_dt * P;
        out.x = inv_dt * this.m_impulse.x;
        out.y = inv_dt * this.m_impulse.y;
        return out;
    }
    GetReactionTorque(inv_dt) {
        return inv_dt * this.m_impulse.z;
    }
    GetLocalAnchorA() { return this.m_localAnchorA; }
    GetLocalAnchorB() { return this.m_localAnchorB; }
    GetReferenceAngle() { return this.m_referenceAngle; }
    GetJointAngle() {
        // b2Body* bA = this.m_bodyA;
        // b2Body* bB = this.m_bodyB;
        // return bB->this.m_sweep.a - bA->this.m_sweep.a - this.m_referenceAngle;
        return this.m_bodyB.m_sweep.a - this.m_bodyA.m_sweep.a - this.m_referenceAngle;
    }
    GetJointSpeed() {
        // b2Body* bA = this.m_bodyA;
        // b2Body* bB = this.m_bodyB;
        // return bB->this.m_angularVelocity - bA->this.m_angularVelocity;
        return this.m_bodyB.m_angularVelocity - this.m_bodyA.m_angularVelocity;
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
    GetMotorTorque(inv_dt) {
        return inv_dt * this.m_motorImpulse;
    }
    GetMotorSpeed() {
        return this.m_motorSpeed;
    }
    SetMaxMotorTorque(torque) {
        if (torque !== this.m_maxMotorTorque) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_maxMotorTorque = torque;
        }
    }
    GetMaxMotorTorque() { return this.m_maxMotorTorque; }
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
        return this.m_lowerAngle;
    }
    GetUpperLimit() {
        return this.m_upperAngle;
    }
    SetLimits(lower, upper) {
        if (lower !== this.m_lowerAngle || upper !== this.m_upperAngle) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_impulse.z = 0;
            this.m_lowerAngle = lower;
            this.m_upperAngle = upper;
        }
    }
    SetMotorSpeed(speed) {
        if (speed !== this.m_motorSpeed) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_motorSpeed = speed;
        }
    }
    Dump(log) {
        const indexA = this.m_bodyA.m_islandIndex;
        const indexB = this.m_bodyB.m_islandIndex;
        log("  const jd: b2RevoluteJointDef = new b2RevoluteJointDef();\n");
        log("  jd.bodyA = bodies[%d];\n", indexA);
        log("  jd.bodyB = bodies[%d];\n", indexB);
        log("  jd.collideConnected = %s;\n", (this.m_collideConnected) ? ("true") : ("false"));
        log("  jd.localAnchorA.Set(%.15f, %.15f);\n", this.m_localAnchorA.x, this.m_localAnchorA.y);
        log("  jd.localAnchorB.Set(%.15f, %.15f);\n", this.m_localAnchorB.x, this.m_localAnchorB.y);
        log("  jd.referenceAngle = %.15f;\n", this.m_referenceAngle);
        log("  jd.enableLimit = %s;\n", (this.m_enableLimit) ? ("true") : ("false"));
        log("  jd.lowerAngle = %.15f;\n", this.m_lowerAngle);
        log("  jd.upperAngle = %.15f;\n", this.m_upperAngle);
        log("  jd.enableMotor = %s;\n", (this.m_enableMotor) ? ("true") : ("false"));
        log("  jd.motorSpeed = %.15f;\n", this.m_motorSpeed);
        log("  jd.maxMotorTorque = %.15f;\n", this.m_maxMotorTorque);
        log("  joints[%d] = this.m_world.CreateJoint(jd);\n", this.m_index);
    }
}
b2RevoluteJoint.InitVelocityConstraints_s_P = new b2Vec2();
b2RevoluteJoint.SolveVelocityConstraints_s_P = new b2Vec2();
b2RevoluteJoint.SolveVelocityConstraints_s_Cdot_v2 = new b2Vec2();
b2RevoluteJoint.SolveVelocityConstraints_s_Cdot1 = new b2Vec2();
b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v3 = new b2Vec3();
b2RevoluteJoint.SolveVelocityConstraints_s_reduced_v2 = new b2Vec2();
b2RevoluteJoint.SolveVelocityConstraints_s_impulse_v2 = new b2Vec2();
b2RevoluteJoint.SolvePositionConstraints_s_C_v2 = new b2Vec2();
b2RevoluteJoint.SolvePositionConstraints_s_impulse = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJSZXZvbHV0ZUpvaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvSm9pbnRzL2IyUmV2b2x1dGVKb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLE9BQU8sRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLHVCQUF1QixFQUFFLE9BQU8sRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzFHLE9BQU8sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQU0sTUFBTSxxQkFBcUIsQ0FBQztBQUVsRyxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFlLE1BQU0sV0FBVyxDQUFDO0FBdUJ4Rix3REFBd0Q7QUFDeEQsNERBQTREO0FBQzVELDhEQUE4RDtBQUM5RCx5REFBeUQ7QUFDekQsNkRBQTZEO0FBQzdELHlDQUF5QztBQUN6QywrREFBK0Q7QUFDL0QsMkNBQTJDO0FBQzNDLDJEQUEyRDtBQUMzRCxtRUFBbUU7QUFDbkUsaUNBQWlDO0FBQ2pDLE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxVQUFVO0lBbUJoRDtRQUNFLEtBQUssQ0FBQyxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7UUFuQnJCLGlCQUFZLEdBQVcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXhDLGlCQUFZLEdBQVcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRWpELG1CQUFjLEdBQVcsQ0FBQyxDQUFDO1FBRTNCLGdCQUFXLEdBQUcsS0FBSyxDQUFDO1FBRXBCLGVBQVUsR0FBVyxDQUFDLENBQUM7UUFFdkIsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUV2QixnQkFBVyxHQUFHLEtBQUssQ0FBQztRQUVwQixlQUFV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QyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3hELElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUM3RixJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUN2RCxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDcEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFFM0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1FBQzNCLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEVBQUU7WUFDeEIsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUN6QztRQUVELElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxJQUFJLGFBQWEsRUFBRTtZQUN4QyxJQUFJLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztTQUN6QjtRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUN4QyxNQUFNLFVBQVUsR0FBVyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztZQUMzRCxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsY0FBYyxFQUFFO2dCQUNyRSxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUM7YUFDaEQ7aUJBQU0sSUFBSSxVQUFVLElBQUksSUFBSSxDQUFDLFlBQVksRUFBRTtnQkFDMUMsSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFlBQVksQ0FBQyxjQUFjLEVBQUU7b0JBQ3JELElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDdEI7Z0JBQ0QsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUMsY0FBYyxDQUFDO2FBQ2pEO2lCQUFNLElBQUksVUFBVSxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7Z0JBQzFDLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsY0FBYyxFQUFFO29CQUNyRCxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ3RCO2dCQUNELElBQUksQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQzthQUNqRDtpQkFBTTtnQkFDTCxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN0QjtTQUNGO2FBQU07WUFDTCxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUM7U0FDbEQ7UUFFRCxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQzFCLGtEQUFrRDtZQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFFekMsc0NBQXNDO1lBQ3RDLE1BQU0sQ0FBQyxHQUFXLGVBQWUsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUV0RyxnQkFBZ0I7WUFDaEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFbkYsZ0JBQWdCO1lBQ2hCLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BGO2FBQU07WUFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1NBQ3pCO1FBRUQseUNBQXlDO1FBQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDdEMseUNBQXlDO1FBQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQVFNLHdCQUF3QixDQUFDLElBQWtCO1FBQ2hELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEQsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVsRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ2pFLE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUM7UUFFM0QsTUFBTSxhQUFhLEdBQVksQ0FBQyxFQUFFLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRS9DLDBCQUEwQjtRQUMxQixJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsYUFBYSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQzVGLE1BQU0sSUFBSSxHQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNqRCxJQUFJLE9BQU8sR0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBQy9DLE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDL0MsTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1lBQ2hFLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3RGLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQztZQUUzQyxFQUFFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUNuQixFQUFFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQztTQUNwQjtRQUVELDBCQUEwQjtRQUMxQixJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsZUFBZSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQzlGLGtFQUFrRTtZQUNsRSxNQUFNLEtBQUssR0FBVyxNQUFNLENBQUMsS0FBSyxDQUNoQyxNQUFNLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQ2xELE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDbEQsZUFBZSxDQUFDLGdDQUFnQyxDQUFDLENBQUM7WUFDcEQsTUFBTSxLQUFLLEdBQVcsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUM5Qix3Q0FBd0M7WUFFeEMsK0NBQStDO1lBQy9DLE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLHFDQUFxQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFekksSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFlBQVksQ0FBQyxhQUFhLEVBQUU7Z0JBQ3BELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO2FBQ3BDO2lCQUFNLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsY0FBYyxFQUFFO2dCQUM1RCxNQUFNLFVBQVUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUMzRCxJQUFJLFVBQVUsR0FBRyxDQUFDLEVBQUU7b0JBQ2xCLHdFQUF3RTtvQkFDeEUsTUFBTSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDN0QsTUFBTSxLQUFLLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDN0QsTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMscUNBQXFDLENBQUMsQ0FBQztvQkFDcEgsVUFBVSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUM1QixVQUFVLENBQUMsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQzVCLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDakMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUN0QjtxQkFBTTtvQkFDTCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztpQkFDcEM7YUFDRjtpQkFBTSxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssWUFBWSxDQUFDLGNBQWMsRUFBRTtnQkFDNUQsTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxVQUFVLEdBQUcsQ0FBQyxFQUFFO29CQUNsQix3RUFBd0U7b0JBQ3hFLE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdELE1BQU0sS0FBSyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQzdELE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLHFDQUFxQyxDQUFDLENBQUM7b0JBQ3BILFVBQVUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQztvQkFDNUIsVUFBVSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDO29CQUM1QixVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUM7b0JBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDdEI7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7aUJBQ3BDO2FBQ0Y7WUFFRCxrQ0FBa0M7WUFDbEMsTUFBTSxDQUFDLEdBQVcsZUFBZSxDQUFDLDRCQUE0QixDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUvRixnQkFBZ0I7WUFDaEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekQsZ0JBQWdCO1lBQ2hCLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzFEO2FBQU07WUFDTCxrQ0FBa0M7WUFDbEMsaUVBQWlFO1lBQ2pFLE1BQU0sT0FBTyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQ2xDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDbEQsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUNsRCxlQUFlLENBQUMsa0NBQWtDLENBQUMsQ0FBQztZQUN0RCwwQ0FBMEM7WUFDMUMsTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMscUNBQXFDLENBQUMsQ0FBQztZQUU5SCxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFFakMsc0JBQXNCO1lBQ3RCLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQzlCLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBRWpELHNCQUFzQjtZQUN0QixFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztZQUM5QixFQUFFLElBQUksRUFBRSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztTQUNsRDtRQUVELHlDQUF5QztRQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3RDLHlDQUF5QztRQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3hDLENBQUM7SUFJTSx3QkFBd0IsQ0FBQyxJQUFrQjtRQUNoRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsSUFBSSxFQUFFLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLEVBQUUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakQsd0JBQXdCO1FBQ3hCLE1BQU0sRUFBRSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FBVSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUU3RSxJQUFJLFlBQVksR0FBVyxDQUFDLENBQUM7UUFDN0IsSUFBSSxhQUFhLEdBQVcsQ0FBQyxDQUFDO1FBRTlCLE1BQU0sYUFBYSxHQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRW5FLGtDQUFrQztRQUNsQyxJQUFJLElBQUksQ0FBQyxhQUFhLElBQUksSUFBSSxDQUFDLFlBQVksS0FBSyxZQUFZLENBQUMsZUFBZSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQzlGLE1BQU0sS0FBSyxHQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1lBQ3RELElBQUksWUFBWSxHQUFXLENBQUMsQ0FBQztZQUU3QixJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssWUFBWSxDQUFDLGFBQWEsRUFBRTtnQkFDcEQsb0NBQW9DO2dCQUNwQyxNQUFNLENBQUMsR0FBVyxPQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO2dCQUN4RyxZQUFZLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztnQkFDckMsWUFBWSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN6QjtpQkFBTSxJQUFJLElBQUksQ0FBQyxZQUFZLEtBQUssWUFBWSxDQUFDLGNBQWMsRUFBRTtnQkFDNUQsSUFBSSxDQUFDLEdBQVcsS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7Z0JBQzFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztnQkFFbEIseURBQXlEO2dCQUN6RCxDQUFDLEdBQUcsT0FBTyxDQUFDLENBQUMsR0FBRyxjQUFjLEVBQUUsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDN0QsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7YUFDdEM7aUJBQU0sSUFBSSxJQUFJLENBQUMsWUFBWSxLQUFLLFlBQVksQ0FBQyxjQUFjLEVBQUU7Z0JBQzVELElBQUksQ0FBQyxHQUFXLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDO2dCQUMxQyxZQUFZLEdBQUcsQ0FBQyxDQUFDO2dCQUVqQix5REFBeUQ7Z0JBQ3pELENBQUMsR0FBRyxPQUFPLENBQUMsQ0FBQyxHQUFHLGNBQWMsRUFBRSxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztnQkFDNUQsWUFBWSxHQUFHLENBQUMsSUFBSSxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUM7YUFDdEM7WUFFRCxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUM7WUFDbEMsRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDO1NBQ25DO1FBRUQsbUNBQW1DO1FBQ25DO1lBQ0UsRUFBRSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNoQixFQUFFLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2hCLDBEQUEwRDtZQUMxRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDckUsTUFBTSxFQUFFLEdBQVcsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUQsMERBQTBEO1lBQzFELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNyRSxNQUFNLEVBQUUsR0FBVyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUU1RCxnQ0FBZ0M7WUFDaEMsTUFBTSxJQUFJLEdBQ1IsTUFBTSxDQUFDLEtBQUssQ0FDVixNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUNqQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUNqQyxlQUFlLENBQUMsK0JBQStCLENBQUMsQ0FBQztZQUNyRCw4QkFBOEI7WUFDOUIsYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUU5QixNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxFQUFFLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ2pFLE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUM7WUFFM0QsTUFBTSxDQUFDLEdBQVksSUFBSSxDQUFDLEdBQUcsQ0FBQztZQUM1QixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUN2RCxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM5QyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNoQixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUV2RCxnQ0FBZ0M7WUFDaEMsTUFBTSxPQUFPLEdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsZUFBZSxDQUFDLGtDQUFrQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7WUFFOUcsc0JBQXNCO1lBQ3RCLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNCLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFdkMsc0JBQXNCO1lBQ3RCLEVBQUUsQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQzNCLEVBQUUsSUFBSSxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDeEM7UUFFRCx3Q0FBd0M7UUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUNyQyx3Q0FBd0M7UUFDeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUVyQyxPQUFPLGFBQWEsSUFBSSxhQUFhLElBQUksWUFBWSxJQUFJLGNBQWMsQ0FBQztJQUMxRSxDQUFDO0lBRU0sVUFBVSxDQUFlLEdBQU07UUFDcEMsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQzlELENBQUM7SUFFTSxVQUFVLENBQWUsR0FBTTtRQUNwQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVNLGdCQUFnQixDQUFlLE1BQWMsRUFBRSxHQUFNO1FBQzFELGdEQUFnRDtRQUNoRCxxQkFBcUI7UUFDckIsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbEMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDbEMsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRU0saUJBQWlCLENBQUMsTUFBYztRQUNyQyxPQUFPLE1BQU0sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRU0sZUFBZSxLQUF1QixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBRW5FLGVBQWUsS0FBdUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVuRSxpQkFBaUIsS0FBYSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFFN0QsYUFBYTtRQUNsQiw2QkFBNkI7UUFDN0IsNkJBQTZCO1FBQzdCLDBFQUEwRTtRQUMxRSxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBQ2pGLENBQUM7SUFFTSxhQUFhO1FBQ2xCLDZCQUE2QjtRQUM3Qiw2QkFBNkI7UUFDN0Isa0VBQWtFO1FBQ2xFLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO0lBQ3pFLENBQUM7SUFFTSxjQUFjO1FBQ25CLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM1QixDQUFDO0lBRU0sV0FBVyxDQUFDLElBQWE7UUFDOUIsSUFBSSxJQUFJLEtBQUssSUFBSSxDQUFDLGFBQWEsRUFBRTtZQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUMzQjtJQUNILENBQUM7SUFFTSxjQUFjLENBQUMsTUFBYztRQUNsQyxPQUFPLE1BQU0sR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO0lBQ3RDLENBQUM7SUFFTSxhQUFhO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMzQixDQUFDO0lBRU0saUJBQWlCLENBQUMsTUFBYztRQUNyQyxJQUFJLE1BQU0sS0FBSyxJQUFJLENBQUMsZ0JBQWdCLEVBQUU7WUFDcEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQztTQUNoQztJQUNILENBQUM7SUFFTSxpQkFBaUIsS0FBYSxPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUM7SUFFN0QsY0FBYztRQUNuQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztJQUVNLFdBQVcsQ0FBQyxJQUFhO1FBQzlCLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7WUFDMUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3RCO0lBQ0gsQ0FBQztJQUVNLGFBQWE7UUFDbEIsT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0lBQzNCLENBQUM7SUFFTSxhQUFhO1FBQ2xCLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztJQUMzQixDQUFDO0lBRU0sU0FBUyxDQUFDLEtBQWEsRUFBRSxLQUFhO1FBRTNDLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxZQUFZLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDOUQsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1lBQzFCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1NBQzNCO0lBQ0gsQ0FBQztJQUVNLGFBQWEsQ0FBQyxLQUFhO1FBQ2hDLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7U0FDM0I7SUFDSCxDQUFDO0lBRU0sSUFBSSxDQUFDLEdBQTZDO1FBQ3ZELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQzFDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBRTFDLEdBQUcsQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO1FBQ3BFLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUMxQyxHQUFHLENBQUMsNEJBQTRCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLCtCQUErQixFQUFFLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUN2RixHQUFHLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RixHQUFHLENBQUMsd0NBQXdDLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM1RixHQUFHLENBQUMsZ0NBQWdDLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDN0QsR0FBRyxDQUFDLDBCQUEwQixFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDN0UsR0FBRyxDQUFDLDRCQUE0QixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNyRCxHQUFHLENBQUMsNEJBQTRCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3JELEdBQUcsQ0FBQywwQkFBMEIsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1FBQzdFLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDckQsR0FBRyxDQUFDLGdDQUFnQyxFQUFFLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQzdELEdBQUcsQ0FBQyxnREFBZ0QsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEUsQ0FBQzs7QUFsY2MsMkNBQTJCLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQThHM0MsNENBQTRCLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUNwRCxrREFBa0MsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQzFELGdEQUFnQyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7QUFDeEQscURBQXFDLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUM3RCxxREFBcUMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQzdELHFEQUFxQyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7QUFnSDdELCtDQUErQixHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFDL0Msa0RBQWtDLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQyJ9