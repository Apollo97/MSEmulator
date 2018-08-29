import { b2Vec2, b2Transform } from "../Common/b2Math";
import { b2AABB, b2RayCastInput, b2RayCastOutput } from "../Collision/b2Collision";
import { b2TreeNode } from "../Collision/b2DynamicTree";
import { b2Shape, b2ShapeType, b2MassData } from "../Collision/Shapes/b2Shape";
import { b2Body } from "./b2Body";
export interface b2IFilter {
    categoryBits: number;
    maskBits: number;
    groupIndex?: number;
}
export declare class b2Filter implements b2IFilter {
    static readonly DEFAULT: Readonly<b2Filter>;
    categoryBits: number;
    maskBits: number;
    groupIndex: number;
    Clone(): b2Filter;
    Copy(other: b2IFilter): this;
}
export interface b2IFixtureDef {
    shape: b2Shape;
    userData?: any;
    friction?: number;
    restitution?: number;
    density?: number;
    isSensor?: boolean;
    filter?: b2IFilter;
}
export declare class b2FixtureDef implements b2IFixtureDef {
    shape: b2Shape;
    userData: any;
    friction: number;
    restitution: number;
    density: number;
    isSensor: boolean;
    readonly filter: b2Filter;
}
export declare class b2FixtureProxy {
    readonly aabb: b2AABB;
    fixture: b2Fixture;
    childIndex: number;
    treeNode: b2TreeNode<b2FixtureProxy>;
    constructor(fixture: b2Fixture);
}
export declare class b2Fixture {
    m_density: number;
    m_next: b2Fixture | null;
    readonly m_body: b2Body;
    readonly m_shape: b2Shape;
    m_friction: number;
    m_restitution: number;
    m_proxies: b2FixtureProxy[];
    m_proxyCount: number;
    readonly m_filter: b2Filter;
    m_isSensor: boolean;
    m_userData: any;
    constructor(def: b2IFixtureDef, body: b2Body);
    GetType(): b2ShapeType;
    GetShape(): b2Shape;
    SetSensor(sensor: boolean): void;
    IsSensor(): boolean;
    SetFilterData(filter: b2Filter): void;
    GetFilterData(): Readonly<b2Filter>;
    Refilter(): void;
    GetBody(): b2Body;
    GetNext(): b2Fixture | null;
    GetUserData(): any;
    SetUserData(data: any): void;
    TestPoint(p: b2Vec2): boolean;
    ComputeDistance(p: b2Vec2, normal: b2Vec2, childIndex: number): number;
    RayCast(output: b2RayCastOutput, input: b2RayCastInput, childIndex: number): boolean;
    GetMassData(massData?: b2MassData): b2MassData;
    SetDensity(density: number): void;
    GetDensity(): number;
    GetFriction(): number;
    SetFriction(friction: number): void;
    GetRestitution(): number;
    SetRestitution(restitution: number): void;
    GetAABB(childIndex: number): Readonly<b2AABB>;
    Dump(log: (format: string, ...args: any[]) => void, bodyIndex: number): void;
    Create(def: b2IFixtureDef): void;
    Destroy(): void;
    CreateProxies(xf: b2Transform): void;
    DestroyProxies(): void;
    TouchProxies(): void;
    private static Synchronize_s_aabb1;
    private static Synchronize_s_aabb2;
    private static Synchronize_s_displacement;
    Synchronize(transform1: b2Transform, transform2: b2Transform): void;
}
