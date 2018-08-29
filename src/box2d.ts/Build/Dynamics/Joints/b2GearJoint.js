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
// DEBUG: import { b2IsValid } from "../../Common/b2Math";
import { b2_linearSlop, b2Maybe } from "../../Common/b2Settings";
import { b2Vec2, b2Rot } from "../../Common/b2Math";
import { b2Joint, b2JointDef, b2JointType } from "./b2Joint";
/// Gear joint definition. This definition requires two existing
/// revolute or prismatic joints (any combination will work).
export class b2GearJointDef extends b2JointDef {
    constructor() {
        super(b2JointType.e_gearJoint);
        this.ratio = 1;
    }
}
export class b2GearJoint extends b2Joint {
    constructor(def) {
        super(def);
        this.m_typeA = b2JointType.e_unknownJoint;
        this.m_typeB = b2JointType.e_unknownJoint;
        // Solver shared
        this.m_localAnchorA = new b2Vec2();
        this.m_localAnchorB = new b2Vec2();
        this.m_localAnchorC = new b2Vec2();
        this.m_localAnchorD = new b2Vec2();
        this.m_localAxisC = new b2Vec2();
        this.m_localAxisD = new b2Vec2();
        this.m_referenceAngleA = 0;
        this.m_referenceAngleB = 0;
        this.m_constant = 0;
        this.m_ratio = 0;
        this.m_impulse = 0;
        // Solver temp
        this.m_indexA = 0;
        this.m_indexB = 0;
        this.m_indexC = 0;
        this.m_indexD = 0;
        this.m_lcA = new b2Vec2();
        this.m_lcB = new b2Vec2();
        this.m_lcC = new b2Vec2();
        this.m_lcD = new b2Vec2();
        this.m_mA = 0;
        this.m_mB = 0;
        this.m_mC = 0;
        this.m_mD = 0;
        this.m_iA = 0;
        this.m_iB = 0;
        this.m_iC = 0;
        this.m_iD = 0;
        this.m_JvAC = new b2Vec2();
        this.m_JvBD = new b2Vec2();
        this.m_JwA = 0;
        this.m_JwB = 0;
        this.m_JwC = 0;
        this.m_JwD = 0;
        this.m_mass = 0;
        this.m_qA = new b2Rot();
        this.m_qB = new b2Rot();
        this.m_qC = new b2Rot();
        this.m_qD = new b2Rot();
        this.m_lalcA = new b2Vec2();
        this.m_lalcB = new b2Vec2();
        this.m_lalcC = new b2Vec2();
        this.m_lalcD = new b2Vec2();
        this.m_joint1 = def.joint1;
        this.m_joint2 = def.joint2;
        this.m_typeA = this.m_joint1.GetType();
        this.m_typeB = this.m_joint2.GetType();
        // DEBUG: b2Assert(this.m_typeA === b2JointType.e_revoluteJoint || this.m_typeA === b2JointType.e_prismaticJoint);
        // DEBUG: b2Assert(this.m_typeB === b2JointType.e_revoluteJoint || this.m_typeB === b2JointType.e_prismaticJoint);
        let coordinateA, coordinateB;
        // TODO_ERIN there might be some problem with the joint edges in b2Joint.
        this.m_bodyC = this.m_joint1.GetBodyA();
        this.m_bodyA = this.m_joint1.GetBodyB();
        // Get geometry of joint1
        const xfA = this.m_bodyA.m_xf;
        const aA = this.m_bodyA.m_sweep.a;
        const xfC = this.m_bodyC.m_xf;
        const aC = this.m_bodyC.m_sweep.a;
        if (this.m_typeA === b2JointType.e_revoluteJoint) {
            const revolute = def.joint1;
            this.m_localAnchorC.Copy(revolute.m_localAnchorA);
            this.m_localAnchorA.Copy(revolute.m_localAnchorB);
            this.m_referenceAngleA = revolute.m_referenceAngle;
            this.m_localAxisC.SetZero();
            coordinateA = aA - aC - this.m_referenceAngleA;
        }
        else {
            const prismatic = def.joint1;
            this.m_localAnchorC.Copy(prismatic.m_localAnchorA);
            this.m_localAnchorA.Copy(prismatic.m_localAnchorB);
            this.m_referenceAngleA = prismatic.m_referenceAngle;
            this.m_localAxisC.Copy(prismatic.m_localXAxisA);
            // b2Vec2 pC = m_localAnchorC;
            const pC = this.m_localAnchorC;
            // b2Vec2 pA = b2MulT(xfC.q, b2Mul(xfA.q, m_localAnchorA) + (xfA.p - xfC.p));
            const pA = b2Rot.MulTRV(xfC.q, b2Vec2.AddVV(b2Rot.MulRV(xfA.q, this.m_localAnchorA, b2Vec2.s_t0), b2Vec2.SubVV(xfA.p, xfC.p, b2Vec2.s_t1), b2Vec2.s_t0), b2Vec2.s_t0); // pA uses s_t0
            // coordinateA = b2Dot(pA - pC, m_localAxisC);
            coordinateA = b2Vec2.DotVV(b2Vec2.SubVV(pA, pC, b2Vec2.s_t0), this.m_localAxisC);
        }
        this.m_bodyD = this.m_joint2.GetBodyA();
        this.m_bodyB = this.m_joint2.GetBodyB();
        // Get geometry of joint2
        const xfB = this.m_bodyB.m_xf;
        const aB = this.m_bodyB.m_sweep.a;
        const xfD = this.m_bodyD.m_xf;
        const aD = this.m_bodyD.m_sweep.a;
        if (this.m_typeB === b2JointType.e_revoluteJoint) {
            const revolute = def.joint2;
            this.m_localAnchorD.Copy(revolute.m_localAnchorA);
            this.m_localAnchorB.Copy(revolute.m_localAnchorB);
            this.m_referenceAngleB = revolute.m_referenceAngle;
            this.m_localAxisD.SetZero();
            coordinateB = aB - aD - this.m_referenceAngleB;
        }
        else {
            const prismatic = def.joint2;
            this.m_localAnchorD.Copy(prismatic.m_localAnchorA);
            this.m_localAnchorB.Copy(prismatic.m_localAnchorB);
            this.m_referenceAngleB = prismatic.m_referenceAngle;
            this.m_localAxisD.Copy(prismatic.m_localXAxisA);
            // b2Vec2 pD = m_localAnchorD;
            const pD = this.m_localAnchorD;
            // b2Vec2 pB = b2MulT(xfD.q, b2Mul(xfB.q, m_localAnchorB) + (xfB.p - xfD.p));
            const pB = b2Rot.MulTRV(xfD.q, b2Vec2.AddVV(b2Rot.MulRV(xfB.q, this.m_localAnchorB, b2Vec2.s_t0), b2Vec2.SubVV(xfB.p, xfD.p, b2Vec2.s_t1), b2Vec2.s_t0), b2Vec2.s_t0); // pB uses s_t0
            // coordinateB = b2Dot(pB - pD, m_localAxisD);
            coordinateB = b2Vec2.DotVV(b2Vec2.SubVV(pB, pD, b2Vec2.s_t0), this.m_localAxisD);
        }
        this.m_ratio = b2Maybe(def.ratio, 1);
        this.m_constant = coordinateA + this.m_ratio * coordinateB;
        this.m_impulse = 0;
    }
    InitVelocityConstraints(data) {
        this.m_indexA = this.m_bodyA.m_islandIndex;
        this.m_indexB = this.m_bodyB.m_islandIndex;
        this.m_indexC = this.m_bodyC.m_islandIndex;
        this.m_indexD = this.m_bodyD.m_islandIndex;
        this.m_lcA.Copy(this.m_bodyA.m_sweep.localCenter);
        this.m_lcB.Copy(this.m_bodyB.m_sweep.localCenter);
        this.m_lcC.Copy(this.m_bodyC.m_sweep.localCenter);
        this.m_lcD.Copy(this.m_bodyD.m_sweep.localCenter);
        this.m_mA = this.m_bodyA.m_invMass;
        this.m_mB = this.m_bodyB.m_invMass;
        this.m_mC = this.m_bodyC.m_invMass;
        this.m_mD = this.m_bodyD.m_invMass;
        this.m_iA = this.m_bodyA.m_invI;
        this.m_iB = this.m_bodyB.m_invI;
        this.m_iC = this.m_bodyC.m_invI;
        this.m_iD = this.m_bodyD.m_invI;
        const aA = data.positions[this.m_indexA].a;
        const vA = data.velocities[this.m_indexA].v;
        let wA = data.velocities[this.m_indexA].w;
        const aB = data.positions[this.m_indexB].a;
        const vB = data.velocities[this.m_indexB].v;
        let wB = data.velocities[this.m_indexB].w;
        const aC = data.positions[this.m_indexC].a;
        const vC = data.velocities[this.m_indexC].v;
        let wC = data.velocities[this.m_indexC].w;
        const aD = data.positions[this.m_indexD].a;
        const vD = data.velocities[this.m_indexD].v;
        let wD = data.velocities[this.m_indexD].w;
        // b2Rot qA(aA), qB(aB), qC(aC), qD(aD);
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB), qC = this.m_qC.SetAngle(aC), qD = this.m_qD.SetAngle(aD);
        this.m_mass = 0;
        if (this.m_typeA === b2JointType.e_revoluteJoint) {
            this.m_JvAC.SetZero();
            this.m_JwA = 1;
            this.m_JwC = 1;
            this.m_mass += this.m_iA + this.m_iC;
        }
        else {
            // b2Vec2 u = b2Mul(qC, m_localAxisC);
            const u = b2Rot.MulRV(qC, this.m_localAxisC, b2GearJoint.InitVelocityConstraints_s_u);
            // b2Vec2 rC = b2Mul(qC, m_localAnchorC - m_lcC);
            b2Vec2.SubVV(this.m_localAnchorC, this.m_lcC, this.m_lalcC);
            const rC = b2Rot.MulRV(qC, this.m_lalcC, b2GearJoint.InitVelocityConstraints_s_rC);
            // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_lcA);
            b2Vec2.SubVV(this.m_localAnchorA, this.m_lcA, this.m_lalcA);
            const rA = b2Rot.MulRV(qA, this.m_lalcA, b2GearJoint.InitVelocityConstraints_s_rA);
            // m_JvAC = u;
            this.m_JvAC.Copy(u);
            // m_JwC = b2Cross(rC, u);
            this.m_JwC = b2Vec2.CrossVV(rC, u);
            // m_JwA = b2Cross(rA, u);
            this.m_JwA = b2Vec2.CrossVV(rA, u);
            this.m_mass += this.m_mC + this.m_mA + this.m_iC * this.m_JwC * this.m_JwC + this.m_iA * this.m_JwA * this.m_JwA;
        }
        if (this.m_typeB === b2JointType.e_revoluteJoint) {
            this.m_JvBD.SetZero();
            this.m_JwB = this.m_ratio;
            this.m_JwD = this.m_ratio;
            this.m_mass += this.m_ratio * this.m_ratio * (this.m_iB + this.m_iD);
        }
        else {
            // b2Vec2 u = b2Mul(qD, m_localAxisD);
            const u = b2Rot.MulRV(qD, this.m_localAxisD, b2GearJoint.InitVelocityConstraints_s_u);
            // b2Vec2 rD = b2Mul(qD, m_localAnchorD - m_lcD);
            b2Vec2.SubVV(this.m_localAnchorD, this.m_lcD, this.m_lalcD);
            const rD = b2Rot.MulRV(qD, this.m_lalcD, b2GearJoint.InitVelocityConstraints_s_rD);
            // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_lcB);
            b2Vec2.SubVV(this.m_localAnchorB, this.m_lcB, this.m_lalcB);
            const rB = b2Rot.MulRV(qB, this.m_lalcB, b2GearJoint.InitVelocityConstraints_s_rB);
            // m_JvBD = m_ratio * u;
            b2Vec2.MulSV(this.m_ratio, u, this.m_JvBD);
            // m_JwD = m_ratio * b2Cross(rD, u);
            this.m_JwD = this.m_ratio * b2Vec2.CrossVV(rD, u);
            // m_JwB = m_ratio * b2Cross(rB, u);
            this.m_JwB = this.m_ratio * b2Vec2.CrossVV(rB, u);
            this.m_mass += this.m_ratio * this.m_ratio * (this.m_mD + this.m_mB) + this.m_iD * this.m_JwD * this.m_JwD + this.m_iB * this.m_JwB * this.m_JwB;
        }
        // Compute effective mass.
        this.m_mass = this.m_mass > 0 ? 1 / this.m_mass : 0;
        if (data.step.warmStarting) {
            // vA += (m_mA * m_impulse) * m_JvAC;
            vA.SelfMulAdd(this.m_mA * this.m_impulse, this.m_JvAC);
            wA += this.m_iA * this.m_impulse * this.m_JwA;
            // vB += (m_mB * m_impulse) * m_JvBD;
            vB.SelfMulAdd(this.m_mB * this.m_impulse, this.m_JvBD);
            wB += this.m_iB * this.m_impulse * this.m_JwB;
            // vC -= (m_mC * m_impulse) * m_JvAC;
            vC.SelfMulSub(this.m_mC * this.m_impulse, this.m_JvAC);
            wC -= this.m_iC * this.m_impulse * this.m_JwC;
            // vD -= (m_mD * m_impulse) * m_JvBD;
            vD.SelfMulSub(this.m_mD * this.m_impulse, this.m_JvBD);
            wD -= this.m_iD * this.m_impulse * this.m_JwD;
        }
        else {
            this.m_impulse = 0;
        }
        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
        // data.velocities[this.m_indexC].v = vC;
        data.velocities[this.m_indexC].w = wC;
        // data.velocities[this.m_indexD].v = vD;
        data.velocities[this.m_indexD].w = wD;
    }
    SolveVelocityConstraints(data) {
        const vA = data.velocities[this.m_indexA].v;
        let wA = data.velocities[this.m_indexA].w;
        const vB = data.velocities[this.m_indexB].v;
        let wB = data.velocities[this.m_indexB].w;
        const vC = data.velocities[this.m_indexC].v;
        let wC = data.velocities[this.m_indexC].w;
        const vD = data.velocities[this.m_indexD].v;
        let wD = data.velocities[this.m_indexD].w;
        // float32 Cdot = b2Dot(m_JvAC, vA - vC) + b2Dot(m_JvBD, vB - vD);
        let Cdot = b2Vec2.DotVV(this.m_JvAC, b2Vec2.SubVV(vA, vC, b2Vec2.s_t0)) +
            b2Vec2.DotVV(this.m_JvBD, b2Vec2.SubVV(vB, vD, b2Vec2.s_t0));
        Cdot += (this.m_JwA * wA - this.m_JwC * wC) + (this.m_JwB * wB - this.m_JwD * wD);
        const impulse = -this.m_mass * Cdot;
        this.m_impulse += impulse;
        // vA += (m_mA * impulse) * m_JvAC;
        vA.SelfMulAdd((this.m_mA * impulse), this.m_JvAC);
        wA += this.m_iA * impulse * this.m_JwA;
        // vB += (m_mB * impulse) * m_JvBD;
        vB.SelfMulAdd((this.m_mB * impulse), this.m_JvBD);
        wB += this.m_iB * impulse * this.m_JwB;
        // vC -= (m_mC * impulse) * m_JvAC;
        vC.SelfMulSub((this.m_mC * impulse), this.m_JvAC);
        wC -= this.m_iC * impulse * this.m_JwC;
        // vD -= (m_mD * impulse) * m_JvBD;
        vD.SelfMulSub((this.m_mD * impulse), this.m_JvBD);
        wD -= this.m_iD * impulse * this.m_JwD;
        // data.velocities[this.m_indexA].v = vA;
        data.velocities[this.m_indexA].w = wA;
        // data.velocities[this.m_indexB].v = vB;
        data.velocities[this.m_indexB].w = wB;
        // data.velocities[this.m_indexC].v = vC;
        data.velocities[this.m_indexC].w = wC;
        // data.velocities[this.m_indexD].v = vD;
        data.velocities[this.m_indexD].w = wD;
    }
    SolvePositionConstraints(data) {
        const cA = data.positions[this.m_indexA].c;
        let aA = data.positions[this.m_indexA].a;
        const cB = data.positions[this.m_indexB].c;
        let aB = data.positions[this.m_indexB].a;
        const cC = data.positions[this.m_indexC].c;
        let aC = data.positions[this.m_indexC].a;
        const cD = data.positions[this.m_indexD].c;
        let aD = data.positions[this.m_indexD].a;
        // b2Rot qA(aA), qB(aB), qC(aC), qD(aD);
        const qA = this.m_qA.SetAngle(aA), qB = this.m_qB.SetAngle(aB), qC = this.m_qC.SetAngle(aC), qD = this.m_qD.SetAngle(aD);
        const linearError = 0;
        let coordinateA, coordinateB;
        const JvAC = this.m_JvAC, JvBD = this.m_JvBD;
        let JwA, JwB, JwC, JwD;
        let mass = 0;
        if (this.m_typeA === b2JointType.e_revoluteJoint) {
            JvAC.SetZero();
            JwA = 1;
            JwC = 1;
            mass += this.m_iA + this.m_iC;
            coordinateA = aA - aC - this.m_referenceAngleA;
        }
        else {
            // b2Vec2 u = b2Mul(qC, m_localAxisC);
            const u = b2Rot.MulRV(qC, this.m_localAxisC, b2GearJoint.SolvePositionConstraints_s_u);
            // b2Vec2 rC = b2Mul(qC, m_localAnchorC - m_lcC);
            const rC = b2Rot.MulRV(qC, this.m_lalcC, b2GearJoint.SolvePositionConstraints_s_rC);
            // b2Vec2 rA = b2Mul(qA, m_localAnchorA - m_lcA);
            const rA = b2Rot.MulRV(qA, this.m_lalcA, b2GearJoint.SolvePositionConstraints_s_rA);
            // JvAC = u;
            JvAC.Copy(u);
            // JwC = b2Cross(rC, u);
            JwC = b2Vec2.CrossVV(rC, u);
            // JwA = b2Cross(rA, u);
            JwA = b2Vec2.CrossVV(rA, u);
            mass += this.m_mC + this.m_mA + this.m_iC * JwC * JwC + this.m_iA * JwA * JwA;
            // b2Vec2 pC = m_localAnchorC - m_lcC;
            const pC = this.m_lalcC;
            // b2Vec2 pA = b2MulT(qC, rA + (cA - cC));
            const pA = b2Rot.MulTRV(qC, b2Vec2.AddVV(rA, b2Vec2.SubVV(cA, cC, b2Vec2.s_t0), b2Vec2.s_t0), b2Vec2.s_t0); // pA uses s_t0
            // coordinateA = b2Dot(pA - pC, m_localAxisC);
            coordinateA = b2Vec2.DotVV(b2Vec2.SubVV(pA, pC, b2Vec2.s_t0), this.m_localAxisC);
        }
        if (this.m_typeB === b2JointType.e_revoluteJoint) {
            JvBD.SetZero();
            JwB = this.m_ratio;
            JwD = this.m_ratio;
            mass += this.m_ratio * this.m_ratio * (this.m_iB + this.m_iD);
            coordinateB = aB - aD - this.m_referenceAngleB;
        }
        else {
            // b2Vec2 u = b2Mul(qD, m_localAxisD);
            const u = b2Rot.MulRV(qD, this.m_localAxisD, b2GearJoint.SolvePositionConstraints_s_u);
            // b2Vec2 rD = b2Mul(qD, m_localAnchorD - m_lcD);
            const rD = b2Rot.MulRV(qD, this.m_lalcD, b2GearJoint.SolvePositionConstraints_s_rD);
            // b2Vec2 rB = b2Mul(qB, m_localAnchorB - m_lcB);
            const rB = b2Rot.MulRV(qB, this.m_lalcB, b2GearJoint.SolvePositionConstraints_s_rB);
            // JvBD = m_ratio * u;
            b2Vec2.MulSV(this.m_ratio, u, JvBD);
            // JwD = m_ratio * b2Cross(rD, u);
            JwD = this.m_ratio * b2Vec2.CrossVV(rD, u);
            // JwB = m_ratio * b2Cross(rB, u);
            JwB = this.m_ratio * b2Vec2.CrossVV(rB, u);
            mass += this.m_ratio * this.m_ratio * (this.m_mD + this.m_mB) + this.m_iD * JwD * JwD + this.m_iB * JwB * JwB;
            // b2Vec2 pD = m_localAnchorD - m_lcD;
            const pD = this.m_lalcD;
            // b2Vec2 pB = b2MulT(qD, rB + (cB - cD));
            const pB = b2Rot.MulTRV(qD, b2Vec2.AddVV(rB, b2Vec2.SubVV(cB, cD, b2Vec2.s_t0), b2Vec2.s_t0), b2Vec2.s_t0); // pB uses s_t0
            // coordinateB = b2Dot(pB - pD, m_localAxisD);
            coordinateB = b2Vec2.DotVV(b2Vec2.SubVV(pB, pD, b2Vec2.s_t0), this.m_localAxisD);
        }
        const C = (coordinateA + this.m_ratio * coordinateB) - this.m_constant;
        let impulse = 0;
        if (mass > 0) {
            impulse = -C / mass;
        }
        // cA += m_mA * impulse * JvAC;
        cA.SelfMulAdd(this.m_mA * impulse, JvAC);
        aA += this.m_iA * impulse * JwA;
        // cB += m_mB * impulse * JvBD;
        cB.SelfMulAdd(this.m_mB * impulse, JvBD);
        aB += this.m_iB * impulse * JwB;
        // cC -= m_mC * impulse * JvAC;
        cC.SelfMulSub(this.m_mC * impulse, JvAC);
        aC -= this.m_iC * impulse * JwC;
        // cD -= m_mD * impulse * JvBD;
        cD.SelfMulSub(this.m_mD * impulse, JvBD);
        aD -= this.m_iD * impulse * JwD;
        // data.positions[this.m_indexA].c = cA;
        data.positions[this.m_indexA].a = aA;
        // data.positions[this.m_indexB].c = cB;
        data.positions[this.m_indexB].a = aB;
        // data.positions[this.m_indexC].c = cC;
        data.positions[this.m_indexC].a = aC;
        // data.positions[this.m_indexD].c = cD;
        data.positions[this.m_indexD].a = aD;
        // TODO_ERIN not implemented
        return linearError < b2_linearSlop;
    }
    GetAnchorA(out) {
        return this.m_bodyA.GetWorldPoint(this.m_localAnchorA, out);
    }
    GetAnchorB(out) {
        return this.m_bodyB.GetWorldPoint(this.m_localAnchorB, out);
    }
    GetReactionForce(inv_dt, out) {
        // b2Vec2 P = m_impulse * m_JvAC;
        // return inv_dt * P;
        return b2Vec2.MulSV(inv_dt * this.m_impulse, this.m_JvAC, out);
    }
    GetReactionTorque(inv_dt) {
        // float32 L = m_impulse * m_JwA;
        // return inv_dt * L;
        return inv_dt * this.m_impulse * this.m_JwA;
    }
    GetJoint1() { return this.m_joint1; }
    GetJoint2() { return this.m_joint2; }
    GetRatio() {
        return this.m_ratio;
    }
    SetRatio(ratio) {
        // DEBUG: b2Assert(b2IsValid(ratio));
        this.m_ratio = ratio;
    }
    Dump(log) {
        const indexA = this.m_bodyA.m_islandIndex;
        const indexB = this.m_bodyB.m_islandIndex;
        const index1 = this.m_joint1.m_index;
        const index2 = this.m_joint2.m_index;
        log("  const jd: b2GearJointDef = new b2GearJointDef();\n");
        log("  jd.bodyA = bodies[%d];\n", indexA);
        log("  jd.bodyB = bodies[%d];\n", indexB);
        log("  jd.collideConnected = %s;\n", (this.m_collideConnected) ? ("true") : ("false"));
        log("  jd.joint1 = joints[%d];\n", index1);
        log("  jd.joint2 = joints[%d];\n", index2);
        log("  jd.ratio = %.15f;\n", this.m_ratio);
        log("  joints[%d] = this.m_world.CreateJoint(jd);\n", this.m_index);
    }
}
b2GearJoint.InitVelocityConstraints_s_u = new b2Vec2();
b2GearJoint.InitVelocityConstraints_s_rA = new b2Vec2();
b2GearJoint.InitVelocityConstraints_s_rB = new b2Vec2();
b2GearJoint.InitVelocityConstraints_s_rC = new b2Vec2();
b2GearJoint.InitVelocityConstraints_s_rD = new b2Vec2();
b2GearJoint.SolvePositionConstraints_s_u = new b2Vec2();
b2GearJoint.SolvePositionConstraints_s_rA = new b2Vec2();
b2GearJoint.SolvePositionConstraints_s_rB = new b2Vec2();
b2GearJoint.SolvePositionConstraints_s_rC = new b2Vec2();
b2GearJoint.SolvePositionConstraints_s_rD = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJHZWFySm9pbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9Cb3gyRC9EeW5hbWljcy9Kb2ludHMvYjJHZWFySm9pbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRiw2REFBNkQ7QUFDN0QsMERBQTBEO0FBQzFELE9BQU8sRUFBRSxhQUFhLEVBQUUsT0FBTyxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDakUsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQW1CLE1BQU0scUJBQXFCLENBQUM7QUFDckUsT0FBTyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFlLE1BQU0sV0FBVyxDQUFDO0FBYzFFLGdFQUFnRTtBQUNoRSw2REFBNkQ7QUFDN0QsTUFBTSxPQUFPLGNBQWUsU0FBUSxVQUFVO0lBTzVDO1FBQ0UsS0FBSyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUgxQixVQUFLLEdBQVcsQ0FBQyxDQUFDO0lBSXpCLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxXQUFZLFNBQVEsT0FBTztJQStEdEMsWUFBWSxHQUFvQjtRQUM5QixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUE1RE4sWUFBTyxHQUFnQixXQUFXLENBQUMsY0FBYyxDQUFDO1FBQ2xELFlBQU8sR0FBZ0IsV0FBVyxDQUFDLGNBQWMsQ0FBQztRQU96RCxnQkFBZ0I7UUFDQSxtQkFBYyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdEMsbUJBQWMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3RDLG1CQUFjLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUN0QyxtQkFBYyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFFdEMsaUJBQVksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3BDLGlCQUFZLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUU3QyxzQkFBaUIs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LElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEQsTUFBTSxFQUFFLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3BELElBQUksRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRCxNQUFNLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEQsSUFBSSxFQUFFLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLEVBQUUsR0FBVyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFbEQsa0VBQWtFO1FBQ2xFLElBQUksSUFBSSxHQUNOLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzVELE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDL0QsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDLENB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