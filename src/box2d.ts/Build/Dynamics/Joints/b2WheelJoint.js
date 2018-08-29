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
// DEBUG: import { b2Assert } from "../../Common/b2Settings";
import { b2_pi, b2_linearSlop, b2Maybe } from "../../Common/b2Settings";
import { b2Abs, b2Clamp, b2Vec2, b2Rot } from "../../Common/b2Math";
import { b2Joint, b2JointDef, b2JointType } from "./b2Joint";
/// Wheel joint definition. This requires defining a line of
/// motion using an axis and an anchor point. The definition uses local
/// anchor points and a local axis so that the initial configuration
/// can violate the constraint slightly. The joint translation is zero
/// when the local anchor points coincide in world space. Using local
/// anchors and a local axis helps when saving and loading a game.
export class b2WheelJointDef extends b2JointDef {
    constructor() {
        super(b2JointType.e_wheelJoint);
        this.localAnchorA = new b2Vec2(0, 0);
        this.localAnchorB = new b2Vec2(0, 0);
        this.localAxisA = new b2Vec2(1, 0);
        this.enableMotor = false;
        this.maxMotorTorque = 0;
        this.motorSpeed = 0;
        this.frequencyHz = 2;
        this.dampingRatio = 0.7;
    }
    Initialize(bA, bB, anchor, axis) {
        this.bodyA = bA;
        this.bodyB = bB;
        this.bodyA.GetLocalPoint(anchor, this.localAnchorA);
        this.bodyB.GetLocalPoint(anchor, this.localAnchorB);
        this.bodyA.GetLocalVector(axis, this.localAxisA);
    }
}
export class b2WheelJoint extends b2Joint {
    constructor(def) {
        super(def);
        this.m_frequencyHz = 0;
        this.m_dampingRatio = 0;
        // Solver shared
        this.m_localAnchorA = new b2Vec2();
        this.m_localAnchorB = new b2Vec2();
        this.m_localXAxisA = new b2Vec2();
        this.m_localYAxisA = new b2Vec2();
        this.m_impulse = 0;
        this.m_motorImpulse = 0;
        this.m_springImpulse = 0;
        this.m_maxMotorTorque = 0;
        this.m_motorSpeed = 0;
        this.m_enableMotor = false;
        // Solver temp
        this.m_indexA = 0;
        this.m_indexB = 0;
        this.m_localCenterA = new b2Vec2();
        this.m_localCenterB = new b2Vec2();
        this.m_invMassA = 0;
        this.m_invMassB = 0;
        this.m_invIA = 0;
        this.m_invIB = 0;
        this.m_ax = new b2Vec2();
        this.m_ay = new b2Vec2();
        this.m_sAx = 0;
        this.m_sBx = 0;
        this.m_sAy = 0;
        this.m_sBy = 0;
        this.m_mass = 0;
        this.m_motorMass = 0;
        this.m_springMass = 0;
        this.m_bias = 0;
        this.m_gamma = 0;
        this.m_qA = new b2Rot();
        this.m_qB = new b2Rot();
        this.m_lalcA = new b2Vec2();
        this.m_lalcB = new b2Vec2();
        this.m_rA = new b2Vec2();
        this.m_rB = new b2Vec2();
        this.m_frequencyHz = b2Maybe(def.frequencyHz, 2);
        this.m_dampingRatio = b2Maybe(def.dampingRatio, 0.7);
        this.m_localAnchorA.Copy(b2Maybe(def.localAnchorA, b2Vec2.ZERO));
        this.m_localAnchorB.Copy(b2Maybe(def.localAnchorB, b2Vec2.ZERO));
        this.m_localXAxisA.Copy(b2Maybe(def.localAxisA, b2Vec2.UNITX));
        b2Vec2.CrossOneV(this.m_localXAxisA, this.m_localYAxisA);
        this.m_maxMotorTorque = b2Maybe(def.maxMotorTorque, 0);
        this.m_motorSpeed = b2Maybe(def.motorSpeed, 0);
        this.m_enableMotor = b2Maybe(def.enableMotor, false);
        this.m_ax.SetZero();
        this.m_ay.SetZero();
    }
    GetMotorSpeed() {
        return this.m_motorSpeed;
    }
    GetMaxMotorTorque() {
        return this.m_maxMotorTorque;
    }
    SetSpringFrequencyHz(hz) {
        this.m_frequencyHz = hz;
    }
    GetSpringFrequencyHz() {
        return this.m_frequencyHz;
    }
    SetSpringDampingRatio(ratio) {
        this.m_dampingRatio = ratio;
    }
    GetSpringDampingRatio() {
        return this.m_dampingRatio;
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
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
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
        // b2Vec2 d = cB + rB - cA - rA;
        const d = b2Vec2.SubVV(b2Vec2.AddVV(cB, rB, b2Vec2.s_t0), b2Vec2.AddVV(cA, rA, b2Vec2.s_t1), b2WheelJoint.InitVelocityConstraints_s_d);
        // Point to line constraint
        {
            // m_ay = b2Mul(qA, m_localYAxisA);
            b2Rot.MulRV(qA, this.m_localYAxisA, this.m_ay);
            // m_sAy = b2Cross(d + rA, m_ay);
            this.m_sAy = b2Vec2.CrossVV(b2Vec2.AddVV(d, rA, b2Vec2.s_t0), this.m_ay);
            // m_sBy = b2Cross(rB, m_ay);
            this.m_sBy = b2Vec2.CrossVV(rB, this.m_ay);
            this.m_mass = mA + mB + iA * this.m_sAy * this.m_sAy + iB * this.m_sBy * this.m_sBy;
            if (this.m_mass > 0) {
                this.m_mass = 1 / this.m_mass;
            }
        }
        // Spring constraint
        this.m_springMass = 0;
        this.m_bias = 0;
        this.m_gamma = 0;
        if (this.m_frequencyHz > 0) {
            // m_ax = b2Mul(qA, m_localXAxisA);
            b2Rot.MulRV(qA, this.m_localXAxisA, this.m_ax);
            // m_sAx = b2Cross(d + rA, m_ax);
            this.m_sAx = b2Vec2.CrossVV(b2Vec2.AddVV(d, rA, b2Vec2.s_t0), this.m_ax);
            // m_sBx = b2Cross(rB, m_ax);
            this.m_sBx = b2Vec2.CrossVV(rB, this.m_ax);
            const invMass = mA + mB + iA * this.m_sAx * this.m_sAx + iB * this.m_sBx * this.m_sBx;
            if (invMass > 0) {
                this.m_springMass = 1 / invMass;
                const C = b2Vec2.DotVV(d, this.m_ax);
                // Frequency
                const omega = 2 * b2_pi * this.m_frequencyHz;
                // Damping coefficient
                const damp = 2 * this.m_springMass * this.m_dampingRatio * omega;
                // Spring stiffness
                const k = this.m_springMass * omega * omega;
                // magic formulas
                const h = data.step.dt;
                this.m_gamma = h * (damp + h * k);
                if (this.m_gamma > 0) {
                    this.m_gamma = 1 / this.m_gamma;
                }
                this.m_bias = C * h * k * this.m_gamma;
                this.m_springMass = invMass + this.m_gamma;
                if (this.m_springMass > 0) {
                    this.m_springMass = 1 / this.m_springMass;
                }
            }
        }
        else {
            this.m_springImpulse = 0;
        }
        // Rotational motor
        if (this.m_enableMotor) {
            this.m_motorMass = iA + iB;
            if (this.m_motorMass > 0) {
                this.m_motorMass = 1 / this.m_motorMass;
            }
        }
        else {
            this.m_motorMass = 0;
            this.m_motorImpulse = 0;
        }
        if (data.step.warmStarting) {
            // Account for variable time step.
            this.m_impulse *= data.step.dtRatio;
            this.m_springImpulse *= data.step.dtRatio;
            this.m_motorImpulse *= data.step.dtRatio;
            // b2Vec2 P = m_impulse * m_ay + m_springImpulse * m_ax;
            const P = b2Vec2.AddVV(b2Vec2.MulSV(this.m_impulse, this.m_ay, b2Vec2.s_t0), b2Vec2.MulSV(this.m_springImpulse, this.m_ax, b2Vec2.s_t1), b2WheelJoint.InitVelocityConstraints_s_P);
            // float32 LA = m_impulse * m_sAy + m_springImpulse * m_sAx + m_motorImpulse;
            const LA = this.m_impulse * this.m_sAy + this.m_springImpulse * this.m_sAx + this.m_motorImpulse;
            // float32 LB = m_impulse * m_sBy + m_springImpulse * m_sBx + m_motorImpulse;
            const LB = this.m_impulse * this.m_sBy + this.m_springImpulse * this.m_sBx + this.m_motorImpulse;
            // vA -= m_invMassA * P;
            vA.SelfMulSub(this.m_invMassA, P);
            wA -= this.m_invIA * LA;
            // vB += m_invMassB * P;
            vB.SelfMulAdd(this.m_invMassB, P);
            wB += this.m_invIB * LB;
        }
        else {
            this.m_impulse = 0;
            this.m_springImpulse = 0;
            this.m_motorImpulse = 0;
        }
        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
    }
    SolveVelocityConstraints(data) {
        const mA = this.m_invMassA, mB = this.m_invMassB;
        const iA = this.m_invIA, iB = this.m_invIB;
        const vA = data.velocities[this.m_indexA].v;
        let wA = data.velocities[this.m_indexA].w;
        const vB = data.velocities[this.m_indexB].v;
        let wB = data.velocities[this.m_indexB].w;
        // Solve spring constraint
        {
            const Cdot = b2Vec2.DotVV(this.m_ax, b2Vec2.SubVV(vB, vA, b2Vec2.s_t0)) + this.m_sBx * wB - this.m_sAx * wA;
            const impulse = -this.m_springMass * (Cdot + this.m_bias + this.m_gamma * this.m_springImpulse);
            this.m_springImpulse += impulse;
            // b2Vec2 P = impulse * m_ax;
            const P = b2Vec2.MulSV(impulse, this.m_ax, b2WheelJoint.SolveVelocityConstraints_s_P);
            const LA = impulse * this.m_sAx;
            const LB = impulse * this.m_sBx;
            // vA -= mA * P;
            vA.SelfMulSub(mA, P);
            wA -= iA * LA;
            // vB += mB * P;
            vB.SelfMulAdd(mB, P);
            wB += iB * LB;
        }
        // Solve rotational motor constraint
        {
            const Cdot = wB - wA - this.m_motorSpeed;
            let impulse = -this.m_motorMass * Cdot;
            const oldImpulse = this.m_motorImpulse;
            const maxImpulse = data.step.dt * this.m_maxMotorTorque;
            this.m_motorImpulse = b2Clamp(this.m_motorImpulse + impulse, -maxImpulse, maxImpulse);
            impulse = this.m_motorImpulse - oldImpulse;
            wA -= iA * impulse;
            wB += iB * impulse;
        }
        // Solve point to line constraint
        {
            const Cdot = b2Vec2.DotVV(this.m_ay, b2Vec2.SubVV(vB, vA, b2Vec2.s_t0)) + this.m_sBy * wB - this.m_sAy * wA;
            const impulse = -this.m_mass * Cdot;
            this.m_impulse += impulse;
            // b2Vec2 P = impulse * m_ay;
            const P = b2Vec2.MulSV(impulse, this.m_ay, b2WheelJoint.SolveVelocityConstraints_s_P);
            const LA = impulse * this.m_sAy;
            const LB = impulse * this.m_sBy;
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
        // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_localCenterA);
        b2Vec2.SubVV(this.m_localAnchorA, this.m_localCenterA, this.m_lalcA);
        const rA = b2Rot.MulRV(qA, this.m_lalcA, this.m_rA);
        // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_localCenterB);
        b2Vec2.SubVV(this.m_localAnchorB, this.m_localCenterB, this.m_lalcB);
        const rB = b2Rot.MulRV(qB, this.m_lalcB, this.m_rB);
        // b2Vec2 d = (cB - cA) + rB - rA;
        const d = b2Vec2.AddVV(b2Vec2.SubVV(cB, cA, b2Vec2.s_t0), b2Vec2.SubVV(rB, rA, b2Vec2.s_t1), b2WheelJoint.SolvePositionConstraints_s_d);
        // b2Vec2 ay = b2Mul(qA, m_localYAxisA);
        const ay = b2Rot.MulRV(qA, this.m_localYAxisA, this.m_ay);
        // float32 sAy = b2Cross(d + rA, ay);
        const sAy = b2Vec2.CrossVV(b2Vec2.AddVV(d, rA, b2Vec2.s_t0), ay);
        // float32 sBy = b2Cross(rB, ay);
        const sBy = b2Vec2.CrossVV(rB, ay);
        // float32 C = b2Dot(d, ay);
        const C = b2Vec2.DotVV(d, this.m_ay);
        const k = this.m_invMassA + this.m_invMassB + this.m_invIA * this.m_sAy * this.m_sAy + this.m_invIB * this.m_sBy * this.m_sBy;
        let impulse;
        if (k !== 0) {
            impulse = -C / k;
        }
        else {
            impulse = 0;
        }
        // b2Vec2 P = impulse * ay;
        const P = b2Vec2.MulSV(impulse, ay, b2WheelJoint.SolvePositionConstraints_s_P);
        const LA = impulse * sAy;
        const LB = impulse * sBy;
        // cA -= m_invMassA * P;
        cA.SelfMulSub(this.m_invMassA, P);
        aA -= this.m_invIA * LA;
        // cB += m_invMassB * P;
        cB.SelfMulAdd(this.m_invMassB, P);
        aB += this.m_invIB * LB;
        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;
        return b2Abs(C) <= b2_linearSlop;
    }
    GetDefinition(def) {
        // DEBUG: b2Assert(false); // TODO
        return def;
    }
    GetAnchorA(out) {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }
    GetAnchorB(out) {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }
    GetReactionForce(inv_dt, out) {
        // return inv_dt * (m_impulse * m_ay + m_springImpulse * m_ax);
        out.x = inv_dt * (this.m_impulse * this.m_ay.x + this.m_springImpulse * this.m_ax.x);
        out.y = inv_dt * (this.m_impulse * this.m_ay.y + this.m_springImpulse * this.m_ax.y);
        return out;
    }
    GetReactionTorque(inv_dt) {
        return inv_dt * this.m_motorImpulse;
    }
    GetLocalAnchorA() { return this.m_localAnchorA; }
    GetLocalAnchorB() { return this.m_localAnchorB; }
    GetLocalAxisA() { return this.m_localXAxisA; }
    GetJointTranslation() {
        return this.GetPrismaticJointTranslation();
    }
    GetJointLinearSpeed() {
        return this.GetPrismaticJointSpeed();
    }
    GetJointAngle() {
        return this.GetRevoluteJointAngle();
    }
    GetJointAngularSpeed() {
        return this.GetRevoluteJointSpeed();
    }
    GetPrismaticJointTranslation() {
        const bA = this.m_bodyA;
        const bB = this.m_bodyB;
        const pA = bA.GetWorldPoint(this.m_localAnchorA, new b2Vec2());
        const pB = bB.GetWorldPoint(this.m_localAnchorB, new b2Vec2());
        const d = b2Vec2.SubVV(pB, pA, new b2Vec2());
        const axis = bA.GetWorldVector(this.m_localXAxisA, new b2Vec2());
        const translation = b2Vec2.DotVV(d, axis);
        return translation;
    }
    GetPrismaticJointSpeed() {
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
        const axis = bA.GetWorldVector(this.m_localXAxisA, new b2Vec2());
        const vA = bA.m_linearVelocity;
        const vB = bB.m_linearVelocity;
        const wA = bA.m_angularVelocity;
        const wB = bB.m_angularVelocity;
        // float32 speed = b2Dot(d, b2Cross(wA, axis)) + b2Dot(axis, vB + b2Cross(wB, rB) - vA - b2Cross(wA, rA));
        const speed = b2Vec2.DotVV(d, b2Vec2.CrossSV(wA, axis, b2Vec2.s_t0)) +
            b2Vec2.DotVV(axis, b2Vec2.SubVV(b2Vec2.AddVCrossSV(vB, wB, rB, b2Vec2.s_t0), b2Vec2.AddVCrossSV(vA, wA, rA, b2Vec2.s_t1), b2Vec2.s_t0));
        return speed;
    }
    GetRevoluteJointAngle() {
        // b2Body* bA = this.m_bodyA;
        // b2Body* bB = this.m_bodyB;
        // return bB->this.m_sweep.a - bA->this.m_sweep.a;
        return this.m_bodyB.m_sweep.a - this.m_bodyA.m_sweep.a;
    }
    GetRevoluteJointSpeed() {
        const wA = this.m_bodyA.m_angularVelocity;
        const wB = this.m_bodyB.m_angularVelocity;
        return wB - wA;
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
    SetMaxMotorTorque(force) {
        if (force !== this.m_maxMotorTorque) {
            this.m_bodyA.SetAwake(true);
            this.m_bodyB.SetAwake(true);
            this.m_maxMotorTorque = force;
        }
    }
    GetMotorTorque(inv_dt) {
        return inv_dt * this.m_motorImpulse;
    }
    Dump(log) {
        const indexA = this.m_bodyA.m_islandIndex;
        const indexB = this.m_bodyB.m_islandIndex;
        log("  const jd: b2WheelJointDef = new b2WheelJointDef();\n");
        log("  jd.bodyA = bodies[%d];\n", indexA);
        log("  jd.bodyB = bodies[%d];\n", indexB);
        log("  jd.collideConnected = %s;\n", (this.m_collideConnected) ? ("true") : ("false"));
        log("  jd.localAnchorA.Set(%.15f, %.15f);\n", this.m_localAnchorA.x, this.m_localAnchorA.y);
        log("  jd.localAnchorB.Set(%.15f, %.15f);\n", this.m_localAnchorB.x, this.m_localAnchorB.y);
        log("  jd.localAxisA.Set(%.15f, %.15f);\n", this.m_localXAxisA.x, this.m_localXAxisA.y);
        log("  jd.enableMotor = %s;\n", (this.m_enableMotor) ? ("true") : ("false"));
        log("  jd.motorSpeed = %.15f;\n", this.m_motorSpeed);
        log("  jd.maxMotorTorque = %.15f;\n", this.m_maxMotorTorque);
        log("  jd.frequencyHz = %.15f;\n", this.m_frequencyHz);
        log("  jd.dampingRatio = %.15f;\n", this.m_dampingRatio);
        log("  joints[%d] = this.m_world.CreateJoint(jd);\n", this.m_index);
    }
}
b2WheelJoint.InitVelocityConstraints_s_d = new b2Vec2();
b2WheelJoint.InitVelocityConstraints_s_P = new b2Vec2();
b2WheelJoint.SolveVelocityConstraints_s_P = new b2Vec2();
b2WheelJoint.SolvePositionConstraints_s_d = new b2Vec2();
b2WheelJoint.SolvePositionConstraints_s_P = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJXaGVlbEpvaW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvSm9pbnRzL2IyV2hlZWxKb2ludC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLDZEQUE2RDtBQUM3RCxPQUFPLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxPQUFPLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUN4RSxPQUFPLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFNLE1BQU0scUJBQXFCLENBQUM7QUFDeEUsT0FBTyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFlLE1BQU0sV0FBVyxDQUFDO0FBc0IxRSw0REFBNEQ7QUFDNUQsdUVBQXVFO0FBQ3ZFLG9FQUFvRTtBQUNwRSxzRUFBc0U7QUFDdEUscUVBQXFFO0FBQ3JFLGtFQUFrRTtBQUNsRSxNQUFNLE9BQU8sZUFBZ0IsU0FBUSxVQUFVO0lBaUI3QztRQUNFLEtBQUssQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7UUFqQmxCLGlCQUFZLEdBQVcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXhDLGlCQUFZLEdBQVcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRXhDLGVBQVUsR0FBVyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFL0MsZ0JBQVcsR0FBRyxLQUFLLENBQUM7UUFFcEIsbUJBQWMsR0FBVyxDQUFDLENBQUM7UUFFM0IsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUV2QixnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUV4QixpQkFBWSxHQUFXLEdBQUcsQ0FBQztJQUlsQyxDQUFDO0lBRU0sVUFBVSxDQUFDLEVBQVUsRUFBRSxFQUFVLEVBQUUsTUFBYyxFQUFFLElBQVk7UUFDcEUsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7UUFDaEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ3BELElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7SUFDbkQsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFPLFlBQWEsU0FBUSxPQUFPO0lBaUR2QyxZQUFZLEdBQXFCO1FBQy9CLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztRQWpETixrQkFBYSxHQUFXLENBQUMsQ0FBQztRQUMxQixtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUVsQyxnQkFBZ0I7UUFDQSxtQkFBYyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdEMsbUJBQWMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3RDLGtCQUFhLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNyQyxrQkFBYSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFFOUMsY0FBUyxHQUFXLENBQUMsQ0FBQztRQUN0QixtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUMzQixvQkFBZSxHQUFXLENBQUMsQ0FBQztRQUU1QixxQkFBZ0IsR0FBVyxDQUFDLENBQUM7UUFDN0IsaUJBQVksR0FBVyxDQUFDLENBQUM7UUFDekIsa0JBQWEsR0FBRyxLQUFLLENBQUM7UUFFN0IsY0FBYztRQUNQLGFBQVEsR0FBVyxDQUFDLENBQUM7UUFDckIsYUFBUSxHQUFXLENBQUMsQ0FBQztRQUNaLG1CQUFjLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN0QyxtQkFBYyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDL0MsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUN2QixlQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFDcEIsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUVYLFNBQUksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzVCLFNBQUksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3JDLFVBQUssR0FBVyxDQUFDLENBQUM7UUFDbEIsVUFBSyxHQUFXLENBQUMsQ0FBQztRQUNsQixVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBQ2xCLFVBQUssR0FBVyxDQUFDLENBQUM7UUFFbEIsV0FBTSxHQUFXLENBQUMsQ0FBQztRQUNuQixnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUN4QixpQkFBWSxHQUFXLENBQUMsQ0FBQztRQUV6QixXQUFNLEdBQVcsQ0FBQyxDQUFDO1FBQ25CLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFFWCxTQUFJLEdBQVUsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUMxQixTQUFJLEdBQVUsSUFBSSxLQUFLLEVBQUUsQ0FBQztRQUMxQixZQUFPLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUMvQixZQUFPLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUMvQixTQUFJLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUM1QixTQUFJLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUsxQyxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pELElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFFckQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDakUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDL0QsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV6RCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMvQyxJQUFJLENBQUMsYUFBYSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXJELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUN0QixDQUFDO0lBRU0sYUFBYTtRQUNsQixPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7SUFDM0IsQ0FBQztJQUVNLGlCQUFpQjtRQUN0QixPQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQztJQUMvQixDQUFDO0lBRU0sb0JBQW9CLENBQUMsRUFBVTtRQUNwQyxJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRU0sb0JBQW9CO1FBQ3pCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQztJQUM1QixDQUFDO0lBRU0scUJBQXFCLENBQUMsS0FBYTtRQUN4QyxJQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBRU0scUJBQXFCO1FBQzFCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUM3QixDQUFDO0lBSU0sdUJBQXVCLENBQUMsSUFBa0I7UUFDL0MsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUMzQyxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDO1FBQzNDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDekMsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztRQUN6QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7UUFFbkMsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFVBQVUsRUFBRSxFQUFFLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUNqRSxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBRTNELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUVsRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25ELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbEQsTUFBTSxFQUFFLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTdFLGdDQUFnQztRQUNoQywwREFBMEQ7UUFDMUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sRUFBRSxHQUFXLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzVELDBEQUEwRDtRQUMxRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckUsTUFBTSxFQUFFLEdBQVcsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsZ0NBQWdDO1FBQ2hDLE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQzVCLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQ2pDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQ2pDLFlBQVksQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO1FBRTVDLDJCQUEyQjtRQUMzQjtZQUNFLG1DQUFtQztZQUNuQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxpQ0FBaUM7WUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pFLDZCQUE2QjtZQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUzQyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBRXBGLElBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7YUFDL0I7U0FDRjtRQUVELG9CQUFvQjtRQUNwQixJQUFJLENBQUMsWUFBWSxHQUFHLENBQUMsQ0FBQztRQUN0QixJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNoQixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNqQixJQUFJLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLG1DQUFtQztZQUNuQyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxpQ0FBaUM7WUFDakMsSUFBSSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3pFLDZCQUE2QjtZQUM3QixJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUUzQyxNQUFNLE9BQU8sR0FBVyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUU5RixJQUFJLE9BQU8sR0FBRyxDQUFDLEVBQUU7Z0JBQ2YsSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDO2dCQUVoQyxNQUFNLENBQUMsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRTdDLFlBQVk7Z0JBQ1osTUFBTSxLQUFLLEdBQVcsQ0FBQyxHQUFHLEtBQUssR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO2dCQUVyRCxzQkFBc0I7Z0JBQ3RCLE1BQU0sSUFBSSxHQUFXLENBQUMsR0FBRyxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO2dCQUV6RSxtQkFBbUI7Z0JBQ25CLE1BQU0sQ0FBQyxHQUFXLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQztnQkFFcEQsaUJBQWlCO2dCQUNqQixNQUFNLENBQUMsR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztnQkFDL0IsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFO29CQUNwQixJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO2lCQUNqQztnQkFFRCxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBRXZDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7Z0JBQzNDLElBQUksSUFBSSxDQUFDLFlBQVksR0FBRyxDQUFDLEVBQUU7b0JBQ3pCLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7aUJBQzNDO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsSUFBSSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7U0FDMUI7UUFFRCxtQkFBbUI7UUFDbkIsSUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztZQUMzQixJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFO2dCQUN4QixJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO2FBQ3pDO1NBQ0Y7YUFBTTtZQUNMLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDO1lBQ3JCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1NBQ3pCO1FBRUQsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMxQixrQ0FBa0M7WUFDbEMsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztZQUNwQyxJQUFJLENBQUMsZUFBZSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDO1lBQzFDLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFFekMsd0RBQXdEO1lBQ3hELE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQzVCLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDcEQsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUMxRCxZQUFZLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUM1Qyw2RUFBNkU7WUFDN0UsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1lBQ3pHLDZFQUE2RTtZQUM3RSxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7WUFFekcsd0JBQXdCO1lBQ3hCLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFFeEIsd0JBQXdCO1lBQ3hCLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNsQyxFQUFFLElBQUksSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7U0FDekI7YUFBTTtZQUNMLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLElBQUksQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1lBQ3pCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1NBQ3pCO1FBRUQseUNBQXlDO1FBQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDdEMseUNBQXlDO1FBQ3pDLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUdNLHdCQUF3QixDQUFDLElBQWtCO1FBQ2hELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUM7UUFDakUsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUUzRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxFQUFFLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbEQsMEJBQTBCO1FBQzFCO1lBQ0UsTUFBTSxJQUFJLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztZQUNwSCxNQUFNLE9BQU8sR0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUN4RyxJQUFJLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBQztZQUVoQyw2QkFBNkI7WUFDN0IsTUFBTSxDQUFDLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUM5RixNQUFNLEVBQUUsR0FBVyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN4QyxNQUFNLEVBQUUsR0FBVyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUV4QyxnQkFBZ0I7WUFDaEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFFZCxnQkFBZ0I7WUFDaEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7U0FDZjtRQUVELG9DQUFvQztRQUNwQztZQUNFLE1BQU0sSUFBSSxHQUFXLEVBQUUsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQztZQUNqRCxJQUFJLE9BQU8sR0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1lBRS9DLE1BQU0sVUFBVSxHQUFXLElBQUksQ0FBQyxjQUFjLENBQUM7WUFDL0MsTUFBTSxVQUFVLEdBQVcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO1lBQ2hFLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1lBQ3RGLE9BQU8sR0FBRyxJQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQztZQUUzQyxFQUFFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQztZQUNuQixFQUFFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQztTQUNwQjtRQUVELGlDQUFpQztRQUNqQztZQUNFLE1BQU0sSUFBSSxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7WUFDcEgsTUFBTSxPQUFPLEdBQVcsQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUM1QyxJQUFJLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQztZQUUxQiw2QkFBNkI7WUFDN0IsTUFBTSxDQUFDLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxZQUFZLENBQUMsNEJBQTRCLENBQUMsQ0FBQztZQUM5RixNQUFNLEVBQUUsR0FBVyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN4QyxNQUFNLEVBQUUsR0FBVyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUV4QyxnQkFBZ0I7WUFDaEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFFZCxnQkFBZ0I7WUFDaEIsRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDckIsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUM7U0FDZjtRQUVELHlDQUF5QztRQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3RDLHlDQUF5QztRQUN6QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO0lBQ3hDLENBQUM7SUFJTSx3QkFBd0IsQ0FBQyxJQUFrQjtRQUNoRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsSUFBSSxFQUFFLEdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuRCxJQUFJLEVBQUUsR0FBVyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFakQsTUFBTSxFQUFFLEdBQVUsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxHQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRTdFLDBEQUEwRDtRQUMxRCxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckUsTUFBTSxFQUFFLEdBQVcsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUQsMERBQTBEO1FBQzFELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNyRSxNQUFNLEVBQUUsR0FBVyxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUM1RCxrQ0FBa0M7UUFDbEMsTUFBTSxDQUFDLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FDNUIsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDakMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDakMsWUFBWSxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFFN0Msd0NBQXdDO1FBQ3hDLE1BQU0sRUFBRSxHQUFXLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRWxFLHFDQUFxQztRQUNyQyxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDakUsaUNBQWlDO1FBQ2pDLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRW5DLDRCQUE0QjtRQUM1QixNQUFNLENBQUMsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFN0MsTUFBTSxDQUFDLEdBQVcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1FBRXRJLElBQUksT0FBZSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNYLE9BQU8sR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDbkI7YUFBTTtZQUNMLE9BQU8sR0FBRyxDQUFDLENBQUM7U0FDYjtRQUVELDJCQUEyQjtRQUMzQixNQUFNLENBQUMsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsWUFBWSxDQUFDLDRCQUE0QixDQUFDLENBQUM7UUFDdkYsTUFBTSxFQUFFLEdBQVcsT0FBTyxHQUFHLEdBQUcsQ0FBQztRQUNqQyxNQUFNLEVBQUUsR0FBVyxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBRWpDLHdCQUF3QjtRQUN4QixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLHdCQUF3QjtRQUN4QixFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDbEMsRUFBRSxJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1FBRXhCLHdDQUF3QztRQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ3JDLHdDQUF3QztRQUN4QyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRXJDLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLGFBQWEsQ0FBQztJQUNuQyxDQUFDO0lBRU0sYUFBYSxDQUFDLEdBQW9CO1FBQ3ZDLGtDQUFrQztRQUNsQyxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFTSxVQUFVLENBQWUsR0FBTTtRQUNwQyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDOUQsQ0FBQztJQUVNLFVBQVUsQ0FBZSxHQUFNO1FBQ3BDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUM5RCxDQUFDO0lBRU0sZ0JBQWdCLENBQWUsTUFBYyxFQUFFLEdBQU07UUFDMUQsK0RBQStEO1FBQy9ELEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckYsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyRixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFTSxpQkFBaUIsQ0FBQyxNQUFjO1FBQ3JDLE9BQU8sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDdEMsQ0FBQztJQUVNLGVBQWUsS0FBdUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVuRSxlQUFlLEtBQXVCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFFbkUsYUFBYSxLQUF1QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO0lBRWhFLG1CQUFtQjtRQUN4QixPQUFPLElBQUksQ0FBQyw0QkFBNEIsRUFBRSxDQUFDO0lBQzdDLENBQUM7SUFFTSxtQkFBbUI7UUFDeEIsT0FBTyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUN2QyxDQUFDO0lBRU0sYUFBYTtRQUNsQixPQUFPLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0lBQ3RDLENBQUM7SUFFTSxvQkFBb0I7UUFDekIsT0FBTyxJQUFJLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUN0QyxDQUFDO0lBRU0sNEJBQTRCO1FBQ2pDLE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDaEMsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUVoQyxNQUFNLEVBQUUsR0FBVyxFQUFFLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3ZFLE1BQU0sRUFBRSxHQUFXLEVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdkUsTUFBTSxDQUFDLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNyRCxNQUFNLElBQUksR0FBVyxFQUFFLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBRXpFLE1BQU0sV0FBVyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ2xELE9BQU8sV0FBVyxDQUFDO0lBQ3JCLENBQUM7SUFFTSxzQkFBc0I7UUFDM0IsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQztRQUNoQyxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDO1FBRWhDLDJFQUEyRTtRQUMzRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3hFLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDM0QsMkVBQTJFO1FBQzNFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxFQUFFLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDeEUsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUMzRCxrQ0FBa0M7UUFDbEMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZTtRQUN2RSxrQ0FBa0M7UUFDbEMsTUFBTSxFQUFFLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZTtRQUN2RSxzQkFBc0I7UUFDdEIsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWM7UUFDM0QsaURBQWlEO1FBQ2pELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFFakUsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDO1FBQy9CLE1BQU0sRUFBRSxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQztRQUMvQixNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsaUJBQWlCLENBQUM7UUFDaEMsTUFBTSxFQUFFLEdBQUcsRUFBRSxDQUFDLGlCQUFpQixDQUFDO1FBRWhDLDBHQUEwRztRQUMxRyxNQUFNLEtBQUssR0FDVCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RELE1BQU0sQ0FBQyxLQUFLLENBQ1YsSUFBSSxFQUNKLE1BQU0sQ0FBQyxLQUFLLENBQ1YsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQzNDLE1BQU0sQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUMzQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUNwQixPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFTSxxQkFBcUI7UUFDMUIsNkJBQTZCO1FBQzdCLDZCQUE2QjtRQUM3QixrREFBa0Q7UUFDbEQsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFTSxxQkFBcUI7UUFDMUIsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUNsRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDO1FBQ2xELE9BQU8sRUFBRSxHQUFHLEVBQUUsQ0FBQztJQUNqQixDQUFDO0lBRU0sY0FBYztRQUNuQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUM7SUFDNUIsQ0FBQztJQUVNLFdBQVcsQ0FBQyxJQUFhO1FBQzlCLElBQUksSUFBSSxLQUFLLElBQUksQ0FBQyxhQUFhLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUIsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLENBQUM7U0FDM0I7SUFDSCxDQUFDO0lBRU0sYUFBYSxDQUFDLEtBQWE7UUFDaEMsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLFlBQVksRUFBRTtZQUMvQixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztTQUMzQjtJQUNILENBQUM7SUFFTSxpQkFBaUIsQ0FBQyxLQUFhO1FBQ3BDLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxnQkFBZ0IsRUFBRTtZQUNuQyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsS0FBSyxDQUFDO1NBQy9CO0lBQ0gsQ0FBQztJQUVNLGNBQWMsQ0FBQyxNQUFjO1FBQ2xDLE9BQU8sTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUM7SUFDdEMsQ0FBQztJQUVNLElBQUksQ0FBQyxHQUE2QztRQUN2RCxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUMxQyxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQztRQUUxQyxHQUFHLENBQUMsd0RBQXdELENBQUMsQ0FBQztRQUM5RCxHQUFHLENBQUMsNEJBQTRCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDMUMsR0FBRyxDQUFDLDRCQUE0QixFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQzFDLEdBQUcsQ0FBQywrQkFBK0IsRUFBRSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDdkYsR0FBRyxDQUFDLHdDQUF3QyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUYsR0FBRyxDQUFDLHdDQUF3QyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUYsR0FBRyxDQUFDLHNDQUFzQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEYsR0FBRyxDQUFDLDBCQUEwQixFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7UUFDN0UsR0FBRyxDQUFDLDRCQUE0QixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNyRCxHQUFHLENBQUMsZ0NBQWdDLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDN0QsR0FBRyxDQUFDLDZCQUE2QixFQUFFLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN2RCxHQUFHLENBQUMsOEJBQThCLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBQ3pELEdBQUcsQ0FBQyxnREFBZ0QsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDdEUsQ0FBQzs7QUFyYmMsd0NBQTJCLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUMzQyx3Q0FBMkIsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBbUozQyx5Q0FBNEIsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBc0U1Qyx5Q0FBNEIsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQzVDLHlDQUE0QixHQUFHLElBQUksTUFBTSxFQUFFLENBQUMifQ==