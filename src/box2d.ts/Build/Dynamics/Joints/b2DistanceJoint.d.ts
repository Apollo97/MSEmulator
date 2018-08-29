import { b2Vec2, b2Rot, XY } from "../../Common/b2Math";
import { b2Joint, b2JointDef, b2IJointDef } from "./b2Joint";
import { b2SolverData } from "../b2TimeStep";
import { b2Body } from "../b2Body";
export interface b2IDistanceJointDef extends b2IJointDef {
    localAnchorA: XY;
    localAnchorB: XY;
    length: number;
    frequencyHz?: number;
    dampingRatio?: number;
}
export declare class b2DistanceJointDef extends b2JointDef implements b2IDistanceJointDef {
    readonly localAnchorA: b2Vec2;
    readonly localAnchorB: b2Vec2;
    length: number;
    frequencyHz: number;
    dampingRatio: number;
    constructor();
    Initialize(b1: b2Body, b2: b2Body, anchor1: XY, anchor2: XY): void;
}
export declare class b2DistanceJoint extends b2Joint {
    m_frequencyHz: number;
    m_dampingRatio: number;
    m_bias: number;
    readonly m_localAnchorA: b2Vec2;
    readonly m_localAnchorB: b2Vec2;
    m_gamma: number;
    m_impulse: number;
    m_length: number;
    m_indexA: number;
    m_indexB: number;
    readonly m_u: b2Vec2;
    readonly m_rA: b2Vec2;
    readonly m_rB: b2Vec2;
    readonly m_localCenterA: b2Vec2;
    readonly m_localCenterB: b2Vec2;
    m_invMassA: number;
    m_invMassB: number;
    m_invIA: number;
    m_invIB: number;
    m_mass: number;
    readonly m_qA: b2Rot;
    readonly m_qB: b2Rot;
    readonly m_lalcA: b2Vec2;
    readonly m_lalcB: b2Vec2;
    constructor(def: b2IDistanceJointDef);
    GetAnchorA<T extends XY>(out: T): T;
    GetAnchorB<T extends XY>(out: T): T;
    GetReactionForce<T extends XY>(inv_dt: number, out: T): T;
    GetReactionTorque(inv_dt: number): number;
    GetLocalAnchorA(): Readonly<b2Vec2>;
    GetLocalAnchorB(): Readonly<b2Vec2>;
    SetLength(length: number): void;
    Length(): number;
    SetFrequency(hz: number): void;
    GetFrequency(): number;
    SetDampingRatio(ratio: number): void;
    GetDampingRatio(): number;
    Dump(log: (format: string, ...args: any[]) => void): void;
    private static InitVelocityConstraints_s_P;
    InitVelocityConstraints(data: b2SolverData): void;
    private static SolveVelocityConstraints_s_vpA;
    private static SolveVelocityConstraints_s_vpB;
    private static SolveVelocityConstraints_s_P;
    SolveVelocityConstraints(data: b2SolverData): void;
    private static SolvePositionConstraints_s_P;
    SolvePositionConstraints(data: b2SolverData): boolean;
}
