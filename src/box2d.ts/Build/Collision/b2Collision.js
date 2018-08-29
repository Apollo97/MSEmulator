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
import { b2_maxFloat, b2_epsilon, b2_epsilon_sq, b2_maxManifoldPoints, b2MakeArray, b2MakeNumberArray } from "../Common/b2Settings";
import { b2Abs, b2Min, b2Max, b2Vec2, b2Rot, b2Transform } from "../Common/b2Math";
import { b2Distance, b2DistanceInput, b2DistanceOutput, b2SimplexCache } from "./b2Distance";
/// @file
/// Structures and functions used for computing contact points, distance
/// queries, and TOI queries.
export var b2ContactFeatureType;
(function (b2ContactFeatureType) {
    b2ContactFeatureType[b2ContactFeatureType["e_vertex"] = 0] = "e_vertex";
    b2ContactFeatureType[b2ContactFeatureType["e_face"] = 1] = "e_face";
})(b2ContactFeatureType || (b2ContactFeatureType = {}));
/// The features that intersect to form the contact point
/// This must be 4 bytes or less.
export class b2ContactFeature {
    constructor() {
        this._key = 0;
        this._key_invalid = false;
        this._indexA = 0;
        this._indexB = 0;
        this._typeA = 0;
        this._typeB = 0;
    }
    get key() {
        if (this._key_invalid) {
            this._key_invalid = false;
            this._key = this._indexA | (this._indexB << 8) | (this._typeA << 16) | (this._typeB << 24);
        }
        return this._key;
    }
    set key(value) {
        this._key = value;
        this._key_invalid = false;
        this._indexA = this._key & 0xff;
        this._indexB = (this._key >> 8) & 0xff;
        this._typeA = (this._key >> 16) & 0xff;
        this._typeB = (this._key >> 24) & 0xff;
    }
    get indexA() {
        return this._indexA;
    }
    set indexA(value) {
        this._indexA = value;
        this._key_invalid = true;
    }
    get indexB() {
        return this._indexB;
    }
    set indexB(value) {
        this._indexB = value;
        this._key_invalid = true;
    }
    get typeA() {
        return this._typeA;
    }
    set typeA(value) {
        this._typeA = value;
        this._key_invalid = true;
    }
    get typeB() {
        return this._typeB;
    }
    set typeB(value) {
        this._typeB = value;
        this._key_invalid = true;
    }
}
/// Contact ids to facilitate warm starting.
export class b2ContactID {
    constructor() {
        this.cf = new b2ContactFeature();
    }
    Copy(o) {
        this.key = o.key;
        return this;
    }
    Clone() {
        return new b2ContactID().Copy(this);
    }
    get key() {
        return this.cf.key;
    }
    set key(value) {
        this.cf.key = value;
    }
}
/// A manifold point is a contact point belonging to a contact
/// manifold. It holds details related to the geometry and dynamics
/// of the contact points.
/// The local point usage depends on the manifold type:
/// -e_circles: the local center of circleB
/// -e_faceA: the local center of cirlceB or the clip point of polygonB
/// -e_faceB: the clip point of polygonA
/// This structure is stored across time steps, so we keep it small.
/// Note: the impulses are used for internal caching and may not
/// provide reliable contact forces, especially for high speed collisions.
export class b2ManifoldPoint {
    constructor() {
        this.localPoint = new b2Vec2(); ///< usage depends on manifold type
        this.normalImpulse = 0; ///< the non-penetration impulse
        this.tangentImpulse = 0; ///< the friction impulse
        this.id = new b2ContactID(); // TODO: readonly  ///< uniquely identifies a contact point between two shapes
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2ManifoldPoint());
    }
    Reset() {
        this.localPoint.SetZero();
        this.normalImpulse = 0;
        this.tangentImpulse = 0;
        this.id.key = 0;
    }
    Copy(o) {
        this.localPoint.Copy(o.localPoint);
        this.normalImpulse = o.normalImpulse;
        this.tangentImpulse = o.tangentImpulse;
        this.id.Copy(o.id);
        return this;
    }
}
export var b2ManifoldType;
(function (b2ManifoldType) {
    b2ManifoldType[b2ManifoldType["e_unknown"] = -1] = "e_unknown";
    b2ManifoldType[b2ManifoldType["e_circles"] = 0] = "e_circles";
    b2ManifoldType[b2ManifoldType["e_faceA"] = 1] = "e_faceA";
    b2ManifoldType[b2ManifoldType["e_faceB"] = 2] = "e_faceB";
})(b2ManifoldType || (b2ManifoldType = {}));
/// A manifold for two touching convex shapes.
/// Box2D supports multiple types of contact:
/// - clip point versus plane with radius
/// - point versus point with radius (circles)
/// The local point usage depends on the manifold type:
/// -e_circles: the local center of circleA
/// -e_faceA: the center of faceA
/// -e_faceB: the center of faceB
/// Similarly the local normal usage:
/// -e_circles: not used
/// -e_faceA: the normal on polygonA
/// -e_faceB: the normal on polygonB
/// We store contacts in this way so that position correction can
/// account for movement, which is critical for continuous physics.
/// All contact scenarios must be expressed in one of these types.
/// This structure is stored across time steps, so we keep it small.
export class b2Manifold {
    constructor() {
        this.points = b2ManifoldPoint.MakeArray(b2_maxManifoldPoints);
        this.localNormal = new b2Vec2();
        this.localPoint = new b2Vec2();
        this.type = b2ManifoldType.e_unknown;
        this.pointCount = 0;
    }
    Reset() {
        for (let i = 0; i < b2_maxManifoldPoints; ++i) {
            // DEBUG: b2Assert(this.points[i] instanceof b2ManifoldPoint);
            this.points[i].Reset();
        }
        this.localNormal.SetZero();
        this.localPoint.SetZero();
        this.type = b2ManifoldType.e_unknown;
        this.pointCount = 0;
    }
    Copy(o) {
        this.pointCount = o.pointCount;
        for (let i = 0; i < b2_maxManifoldPoints; ++i) {
            // DEBUG: b2Assert(this.points[i] instanceof b2ManifoldPoint);
            this.points[i].Copy(o.points[i]);
        }
        this.localNormal.Copy(o.localNormal);
        this.localPoint.Copy(o.localPoint);
        this.type = o.type;
        return this;
    }
    Clone() {
        return new b2Manifold().Copy(this);
    }
}
export class b2WorldManifold {
    constructor() {
        this.normal = new b2Vec2();
        this.points = b2Vec2.MakeArray(b2_maxManifoldPoints);
        this.separations = b2MakeNumberArray(b2_maxManifoldPoints);
    }
    Initialize(manifold, xfA, radiusA, xfB, radiusB) {
        if (manifold.pointCount === 0) {
            return;
        }
        switch (manifold.type) {
            case b2ManifoldType.e_circles: {
                this.normal.Set(1, 0);
                const pointA = b2Transform.MulXV(xfA, manifold.localPoint, b2WorldManifold.Initialize_s_pointA);
                const pointB = b2Transform.MulXV(xfB, manifold.points[0].localPoint, b2WorldManifold.Initialize_s_pointB);
                if (b2Vec2.DistanceSquaredVV(pointA, pointB) > b2_epsilon_sq) {
                    b2Vec2.SubVV(pointB, pointA, this.normal).SelfNormalize();
                }
                const cA = b2Vec2.AddVMulSV(pointA, radiusA, this.normal, b2WorldManifold.Initialize_s_cA);
                const cB = b2Vec2.SubVMulSV(pointB, radiusB, this.normal, b2WorldManifold.Initialize_s_cB);
                b2Vec2.MidVV(cA, cB, this.points[0]);
                this.separations[0] = b2Vec2.DotVV(b2Vec2.SubVV(cB, cA, b2Vec2.s_t0), this.normal); // b2Dot(cB - cA, normal);
                break;
            }
            case b2ManifoldType.e_faceA: {
                b2Rot.MulRV(xfA.q, manifold.localNormal, this.normal);
                const planePoint = b2Transform.MulXV(xfA, manifold.localPoint, b2WorldManifold.Initialize_s_planePoint);
                for (let i = 0; i < manifold.pointCount; ++i) {
                    const clipPoint = b2Transform.MulXV(xfB, manifold.points[i].localPoint, b2WorldManifold.Initialize_s_clipPoint);
                    const s = radiusA - b2Vec2.DotVV(b2Vec2.SubVV(clipPoint, planePoint, b2Vec2.s_t0), this.normal);
                    const cA = b2Vec2.AddVMulSV(clipPoint, s, this.normal, b2WorldManifold.Initialize_s_cA);
                    const cB = b2Vec2.SubVMulSV(clipPoint, radiusB, this.normal, b2WorldManifold.Initialize_s_cB);
                    b2Vec2.MidVV(cA, cB, this.points[i]);
                    this.separations[i] = b2Vec2.DotVV(b2Vec2.SubVV(cB, cA, b2Vec2.s_t0), this.normal); // b2Dot(cB - cA, normal);
                }
                break;
            }
            case b2ManifoldType.e_faceB: {
                b2Rot.MulRV(xfB.q, manifold.localNormal, this.normal);
                const planePoint = b2Transform.MulXV(xfB, manifold.localPoint, b2WorldManifold.Initialize_s_planePoint);
                for (let i = 0; i < manifold.pointCount; ++i) {
                    const clipPoint = b2Transform.MulXV(xfA, manifold.points[i].localPoint, b2WorldManifold.Initialize_s_clipPoint);
                    const s = radiusB - b2Vec2.DotVV(b2Vec2.SubVV(clipPoint, planePoint, b2Vec2.s_t0), this.normal);
                    const cB = b2Vec2.AddVMulSV(clipPoint, s, this.normal, b2WorldManifold.Initialize_s_cB);
                    const cA = b2Vec2.SubVMulSV(clipPoint, radiusA, this.normal, b2WorldManifold.Initialize_s_cA);
                    b2Vec2.MidVV(cA, cB, this.points[i]);
                    this.separations[i] = b2Vec2.DotVV(b2Vec2.SubVV(cA, cB, b2Vec2.s_t0), this.normal); // b2Dot(cA - cB, normal);
                }
                // Ensure normal points from A to B.
                this.normal.SelfNeg();
                break;
            }
        }
    }
}
b2WorldManifold.Initialize_s_pointA = new b2Vec2();
b2WorldManifold.Initialize_s_pointB = new b2Vec2();
b2WorldManifold.Initialize_s_cA = new b2Vec2();
b2WorldManifold.Initialize_s_cB = new b2Vec2();
b2WorldManifold.Initialize_s_planePoint = new b2Vec2();
b2WorldManifold.Initialize_s_clipPoint = new b2Vec2();
/// This is used for determining the state of contact points.
export var b2PointState;
(function (b2PointState) {
    b2PointState[b2PointState["b2_nullState"] = 0] = "b2_nullState";
    b2PointState[b2PointState["b2_addState"] = 1] = "b2_addState";
    b2PointState[b2PointState["b2_persistState"] = 2] = "b2_persistState";
    b2PointState[b2PointState["b2_removeState"] = 3] = "b2_removeState";
})(b2PointState || (b2PointState = {}));
/// Compute the point states given two manifolds. The states pertain to the transition from manifold1
/// to manifold2. So state1 is either persist or remove while state2 is either add or persist.
export function b2GetPointStates(state1, state2, manifold1, manifold2) {
    // Detect persists and removes.
    let i;
    for (i = 0; i < manifold1.pointCount; ++i) {
        const id = manifold1.points[i].id;
        const key = id.key;
        state1[i] = b2PointState.b2_removeState;
        for (let j = 0, jct = manifold2.pointCount; j < jct; ++j) {
            if (manifold2.points[j].id.key === key) {
                state1[i] = b2PointState.b2_persistState;
                break;
            }
        }
    }
    for (; i < b2_maxManifoldPoints; ++i) {
        state1[i] = b2PointState.b2_nullState;
    }
    // Detect persists and adds.
    for (i = 0; i < manifold2.pointCount; ++i) {
        const id = manifold2.points[i].id;
        const key = id.key;
        state2[i] = b2PointState.b2_addState;
        for (let j = 0, jct = manifold1.pointCount; j < jct; ++j) {
            if (manifold1.points[j].id.key === key) {
                state2[i] = b2PointState.b2_persistState;
                break;
            }
        }
    }
    for (; i < b2_maxManifoldPoints; ++i) {
        state2[i] = b2PointState.b2_nullState;
    }
}
/// Used for computing contact manifolds.
export class b2ClipVertex {
    constructor() {
        this.v = new b2Vec2();
        this.id = new b2ContactID();
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2ClipVertex());
    }
    Copy(other) {
        this.v.Copy(other.v);
        this.id.Copy(other.id);
        return this;
    }
}
/// Ray-cast input data. The ray extends from p1 to p1 + maxFraction * (p2 - p1).
export class b2RayCastInput {
    constructor() {
        this.p1 = new b2Vec2();
        this.p2 = new b2Vec2();
        this.maxFraction = 1;
    }
    Copy(o) {
        this.p1.Copy(o.p1);
        this.p2.Copy(o.p2);
        this.maxFraction = o.maxFraction;
        return this;
    }
}
/// Ray-cast output data. The ray hits at p1 + fraction * (p2 - p1), where p1 and p2
/// come from b2RayCastInput.
export class b2RayCastOutput {
    constructor() {
        this.normal = new b2Vec2();
        this.fraction = 0;
    }
    Copy(o) {
        this.normal.Copy(o.normal);
        this.fraction = o.fraction;
        return this;
    }
}
/// An axis aligned bounding box.
export class b2AABB {
    constructor() {
        this.lowerBound = new b2Vec2(); ///< the lower vertex
        this.upperBound = new b2Vec2(); ///< the upper vertex
        this.m_cache_center = new b2Vec2(); // access using GetCenter()
        this.m_cache_extent = new b2Vec2(); // access using GetExtents()
    }
    Copy(o) {
        this.lowerBound.Copy(o.lowerBound);
        this.upperBound.Copy(o.upperBound);
        return this;
    }
    /// Verify that the bounds are sorted.
    IsValid() {
        const d_x = this.upperBound.x - this.lowerBound.x;
        const d_y = this.upperBound.y - this.lowerBound.y;
        let valid = d_x >= 0 && d_y >= 0;
        valid = valid && this.lowerBound.IsValid() && this.upperBound.IsValid();
        return valid;
    }
    /// Get the center of the AABB.
    GetCenter() {
        return b2Vec2.MidVV(this.lowerBound, this.upperBound, this.m_cache_center);
    }
    /// Get the extents of the AABB (half-widths).
    GetExtents() {
        return b2Vec2.ExtVV(this.lowerBound, this.upperBound, this.m_cache_extent);
    }
    /// Get the perimeter length
    GetPerimeter() {
        const wx = this.upperBound.x - this.lowerBound.x;
        const wy = this.upperBound.y - this.lowerBound.y;
        return 2 * (wx + wy);
    }
    /// Combine an AABB into this one.
    Combine1(aabb) {
        this.lowerBound.x = b2Min(this.lowerBound.x, aabb.lowerBound.x);
        this.lowerBound.y = b2Min(this.lowerBound.y, aabb.lowerBound.y);
        this.upperBound.x = b2Max(this.upperBound.x, aabb.upperBound.x);
        this.upperBound.y = b2Max(this.upperBound.y, aabb.upperBound.y);
        return this;
    }
    /// Combine two AABBs into this one.
    Combine2(aabb1, aabb2) {
        this.lowerBound.x = b2Min(aabb1.lowerBound.x, aabb2.lowerBound.x);
        this.lowerBound.y = b2Min(aabb1.lowerBound.y, aabb2.lowerBound.y);
        this.upperBound.x = b2Max(aabb1.upperBound.x, aabb2.upperBound.x);
        this.upperBound.y = b2Max(aabb1.upperBound.y, aabb2.upperBound.y);
        return this;
    }
    static Combine(aabb1, aabb2, out) {
        out.Combine2(aabb1, aabb2);
        return out;
    }
    /// Does this aabb contain the provided AABB.
    Contains(aabb) {
        let result = true;
        result = result && this.lowerBound.x <= aabb.lowerBound.x;
        result = result && this.lowerBound.y <= aabb.lowerBound.y;
        result = result && aabb.upperBound.x <= this.upperBound.x;
        result = result && aabb.upperBound.y <= this.upperBound.y;
        return result;
    }
    // From Real-time Collision Detection, p179.
    RayCast(output, input) {
        let tmin = (-b2_maxFloat);
        let tmax = b2_maxFloat;
        const p_x = input.p1.x;
        const p_y = input.p1.y;
        const d_x = input.p2.x - input.p1.x;
        const d_y = input.p2.y - input.p1.y;
        const absD_x = b2Abs(d_x);
        const absD_y = b2Abs(d_y);
        const normal = output.normal;
        if (absD_x < b2_epsilon) {
            // Parallel.
            if (p_x < this.lowerBound.x || this.upperBound.x < p_x) {
                return false;
            }
        }
        else {
            const inv_d = 1 / d_x;
            let t1 = (this.lowerBound.x - p_x) * inv_d;
            let t2 = (this.upperBound.x - p_x) * inv_d;
            // Sign of the normal vector.
            let s = (-1);
            if (t1 > t2) {
                const t3 = t1;
                t1 = t2;
                t2 = t3;
                s = 1;
            }
            // Push the min up
            if (t1 > tmin) {
                normal.x = s;
                normal.y = 0;
                tmin = t1;
            }
            // Pull the max down
            tmax = b2Min(tmax, t2);
            if (tmin > tmax) {
                return false;
            }
        }
        if (absD_y < b2_epsilon) {
            // Parallel.
            if (p_y < this.lowerBound.y || this.upperBound.y < p_y) {
                return false;
            }
        }
        else {
            const inv_d = 1 / d_y;
            let t1 = (this.lowerBound.y - p_y) * inv_d;
            let t2 = (this.upperBound.y - p_y) * inv_d;
            // Sign of the normal vector.
            let s = (-1);
            if (t1 > t2) {
                const t3 = t1;
                t1 = t2;
                t2 = t3;
                s = 1;
            }
            // Push the min up
            if (t1 > tmin) {
                normal.x = 0;
                normal.y = s;
                tmin = t1;
            }
            // Pull the max down
            tmax = b2Min(tmax, t2);
            if (tmin > tmax) {
                return false;
            }
        }
        // Does the ray start inside the box?
        // Does the ray intersect beyond the max fraction?
        if (tmin < 0 || input.maxFraction < tmin) {
            return false;
        }
        // Intersection.
        output.fraction = tmin;
        return true;
    }
    TestContain(point) {
        if (point.x < this.lowerBound.x || this.upperBound.x < point.x) {
            return false;
        }
        if (point.y < this.lowerBound.y || this.upperBound.y < point.y) {
            return false;
        }
        return true;
    }
    TestOverlap(other) {
        const d1_x = other.lowerBound.x - this.upperBound.x;
        const d1_y = other.lowerBound.y - this.upperBound.y;
        const d2_x = this.lowerBound.x - other.upperBound.x;
        const d2_y = this.lowerBound.y - other.upperBound.y;
        if (d1_x > 0 || d1_y > 0) {
            return false;
        }
        if (d2_x > 0 || d2_y > 0) {
            return false;
        }
        return true;
    }
}
export function b2TestOverlapAABB(a, b) {
    const d1_x = b.lowerBound.x - a.upperBound.x;
    const d1_y = b.lowerBound.y - a.upperBound.y;
    const d2_x = a.lowerBound.x - b.upperBound.x;
    const d2_y = a.lowerBound.y - b.upperBound.y;
    if (d1_x > 0 || d1_y > 0) {
        return false;
    }
    if (d2_x > 0 || d2_y > 0) {
        return false;
    }
    return true;
}
/// Clipping for contact manifolds.
export function b2ClipSegmentToLine(vOut, vIn, normal, offset, vertexIndexA) {
    // Start with no output points
    let numOut = 0;
    const vIn0 = vIn[0];
    const vIn1 = vIn[1];
    // Calculate the distance of end points to the line
    const distance0 = b2Vec2.DotVV(normal, vIn0.v) - offset;
    const distance1 = b2Vec2.DotVV(normal, vIn1.v) - offset;
    // If the points are behind the plane
    if (distance0 <= 0) {
        vOut[numOut++].Copy(vIn0);
    }
    if (distance1 <= 0) {
        vOut[numOut++].Copy(vIn1);
    }
    // If the points are on different sides of the plane
    if (distance0 * distance1 < 0) {
        // Find intersection point of edge and plane
        const interp = distance0 / (distance0 - distance1);
        const v = vOut[numOut].v;
        v.x = vIn0.v.x + interp * (vIn1.v.x - vIn0.v.x);
        v.y = vIn0.v.y + interp * (vIn1.v.y - vIn0.v.y);
        // VertexA is hitting edgeB.
        const id = vOut[numOut].id;
        id.cf.indexA = vertexIndexA;
        id.cf.indexB = vIn0.id.cf.indexB;
        id.cf.typeA = b2ContactFeatureType.e_vertex;
        id.cf.typeB = b2ContactFeatureType.e_face;
        ++numOut;
    }
    return numOut;
}
/// Determine if two generic shapes overlap.
const b2TestOverlapShape_s_input = new b2DistanceInput();
const b2TestOverlapShape_s_simplexCache = new b2SimplexCache();
const b2TestOverlapShape_s_output = new b2DistanceOutput();
export function b2TestOverlapShape(shapeA, indexA, shapeB, indexB, xfA, xfB) {
    const input = b2TestOverlapShape_s_input.Reset();
    input.proxyA.SetShape(shapeA, indexA);
    input.proxyB.SetShape(shapeB, indexB);
    input.transformA.Copy(xfA);
    input.transformB.Copy(xfB);
    input.useRadii = true;
    const simplexCache = b2TestOverlapShape_s_simplexCache.Reset();
    simplexCache.count = 0;
    const output = b2TestOverlapShape_s_output.Reset();
    b2Distance(output, simplexCache, input);
    return output.distance < 10 * b2_epsilon;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb2xsaXNpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9Cb3gyRC9Db2xsaXNpb24vYjJDb2xsaXNpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRiwwREFBMEQ7QUFDMUQsT0FBTyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLG9CQUFvQixFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3BJLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRW5GLE9BQU8sRUFBRSxVQUFVLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxNQUFNLGNBQWMsQ0FBQztBQUU3RixTQUFTO0FBQ1Qsd0VBQXdFO0FBQ3hFLDZCQUE2QjtBQUU3QixNQUFNLENBQU4sSUFBWSxvQkFHWDtBQUhELFdBQVksb0JBQW9CO0lBQzlCLHVFQUFZLENBQUE7SUFDWixtRUFBVSxDQUFBO0FBQ1osQ0FBQyxFQUhXLG9CQUFvQixLQUFwQixvQkFBb0IsUUFHL0I7QUFFRCx5REFBeUQ7QUFDekQsaUNBQWlDO0FBQ2pDLE1BQU0sT0FBTyxnQkFBZ0I7SUFBN0I7UUFDVSxTQUFJLEdBQVcsQ0FBQyxDQUFDO1FBQ2pCLGlCQUFZLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFDcEIsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUNwQixXQUFNLEdBQXlCLENBQUMsQ0FBQztRQUNqQyxXQUFNLEdBQXlCLENBQUMsQ0FBQztJQXNEM0MsQ0FBQztJQXBEQyxJQUFXLEdBQUc7UUFDWixJQUFJLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDckIsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7WUFDMUIsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1NBQzVGO1FBQ0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRCxJQUFXLEdBQUcsQ0FBQyxLQUFhO1FBQzFCLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO1FBQ2xCLElBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO1FBQzFCLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQztRQUN2QyxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDekMsQ0FBQztJQUVELElBQVcsTUFBTTtRQUNmLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUN0QixDQUFDO0lBRUQsSUFBVyxNQUFNLENBQUMsS0FBYTtRQUM3QixJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztJQUMzQixDQUFDO0lBRUQsSUFBVyxNQUFNO1FBQ2YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDO0lBQ3RCLENBQUM7SUFFRCxJQUFXLE1BQU0sQ0FBQyxLQUFhO1FBQzdCLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0lBQzNCLENBQUM7SUFFRCxJQUFXLEtBQUs7UUFDZCxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7SUFDckIsQ0FBQztJQUVELElBQVcsS0FBSyxDQUFDLEtBQWE7UUFDNUIsSUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFDcEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7SUFDM0IsQ0FBQztJQUVELElBQVcsS0FBSztRQUNkLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQsSUFBVyxLQUFLLENBQUMsS0FBYTtRQUM1QixJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztRQUNwQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztJQUMzQixDQUFDO0NBQ0Y7QUFFRCw0Q0FBNEM7QUFDNUMsTUFBTSxPQUFPLFdBQVc7SUFBeEI7UUFDa0IsT0FBRSxHQUFxQixJQUFJLGdCQUFnQixFQUFFLENBQUM7SUFrQmhFLENBQUM7SUFoQlEsSUFBSSxDQUFDLENBQWM7UUFDeEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDO1FBQ2pCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLEtBQUs7UUFDVixPQUFPLElBQUksV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxJQUFXLEdBQUc7UUFDWixPQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxJQUFXLEdBQUcsQ0FBQyxLQUFhO1FBQzFCLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUN0QixDQUFDO0NBQ0Y7QUFFRCw4REFBOEQ7QUFDOUQsbUVBQW1FO0FBQ25FLDBCQUEwQjtBQUMxQix1REFBdUQ7QUFDdkQsMkNBQTJDO0FBQzNDLHVFQUF1RTtBQUN2RSx3Q0FBd0M7QUFDeEMsb0VBQW9FO0FBQ3BFLGdFQUFnRTtBQUNoRSwwRUFBMEU7QUFDMUUsTUFBTSxPQUFPLGVBQWU7SUFBNUI7UUFDa0IsZUFBVSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBRSxtQ0FBbUM7UUFDaEYsa0JBQWEsR0FBVyxDQUFDLENBQUMsQ0FBTSxnQ0FBZ0M7UUFDaEUsbUJBQWMsR0FBVyxDQUFDLENBQUMsQ0FBTSx5QkFBeUI7UUFDMUQsT0FBRSxHQUFnQixJQUFJLFdBQVcsRUFBRSxDQUFDLENBQUMsOEVBQThFO0lBb0I1SCxDQUFDO0lBbEJRLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBYztRQUNwQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFTLEVBQW1CLEVBQUUsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUVNLEtBQUs7UUFDVixJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxjQUFjLEdBQUcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNsQixDQUFDO0lBRU0sSUFBSSxDQUFDLENBQWtCO1FBQzVCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxhQUFhLENBQUM7UUFDckMsSUFBSSxDQUFDLGNBQWMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNuQixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQUVELE1BQU0sQ0FBTixJQUFZLGNBS1g7QUFMRCxXQUFZLGNBQWM7SUFDeEIsOERBQWMsQ0FBQTtJQUNkLDZEQUFhLENBQUE7SUFDYix5REFBVyxDQUFBO0lBQ1gseURBQVcsQ0FBQTtBQUNiLENBQUMsRUFMVyxjQUFjLEtBQWQsY0FBYyxRQUt6QjtBQUVELDhDQUE4QztBQUM5Qyw2Q0FBNkM7QUFDN0MseUNBQXlDO0FBQ3pDLDhDQUE4QztBQUM5Qyx1REFBdUQ7QUFDdkQsMkNBQTJDO0FBQzNDLGlDQUFpQztBQUNqQyxpQ0FBaUM7QUFDakMscUNBQXFDO0FBQ3JDLHdCQUF3QjtBQUN4QixvQ0FBb0M7QUFDcEMsb0NBQW9DO0FBQ3BDLGlFQUFpRTtBQUNqRSxtRUFBbUU7QUFDbkUsa0VBQWtFO0FBQ2xFLG9FQUFvRTtBQUNwRSxNQUFNLE9BQU8sVUFBVTtJQUF2QjtRQUNrQixXQUFNLEdBQXNCLGVBQWUsQ0FBQyxTQUFTLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUM1RSxnQkFBVyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDbkMsZUFBVSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDM0MsU0FBSSxHQUFtQixjQUFjLENBQUMsU0FBUyxDQUFDO1FBQ2hELGVBQVUsR0FBVyxDQUFDLENBQUM7SUE0QmhDLENBQUM7SUExQlEsS0FBSztRQUNWLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUNyRCw4REFBOEQ7WUFDOUQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUN4QjtRQUNELElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDM0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMxQixJQUFJLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxTQUFTLENBQUM7UUFDckMsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVNLElBQUksQ0FBQyxDQUFhO1FBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQztRQUMvQixLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLEVBQUU7WUFDckQsOERBQThEO1lBQzlELElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNsQztRQUNELElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ25CLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVNLEtBQUs7UUFDVixPQUFPLElBQUksVUFBVSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JDLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxlQUFlO0lBQTVCO1FBQ2tCLFdBQU0sR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzlCLFdBQU0sR0FBYSxNQUFNLENBQUMsU0FBUyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDMUQsZ0JBQVcsR0FBYSxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBK0RsRixDQUFDO0lBdkRRLFVBQVUsQ0FBQyxRQUFvQixFQUFFLEdBQWdCLEVBQUUsT0FBZSxFQUFFLEdBQWdCLEVBQUUsT0FBZTtRQUMxRyxJQUFJLFFBQVEsQ0FBQyxVQUFVLEtBQUssQ0FBQyxFQUFFO1lBQzdCLE9BQU87U0FDUjtRQUVELFFBQVEsUUFBUSxDQUFDLElBQUksRUFBRTtZQUN2QixLQUFLLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO2dCQUN0QixNQUFNLE1BQU0sR0FBVyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO2dCQUN4RyxNQUFNLE1BQU0sR0FBVyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBQztnQkFDbEgsSUFBSSxNQUFNLENBQUMsaUJBQWlCLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLGFBQWEsRUFBRTtvQkFDNUQsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztpQkFDM0Q7Z0JBRUQsTUFBTSxFQUFFLEdBQVcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUNuRyxNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ25HLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtnQkFDOUcsTUFBTTthQUNQO1lBRUgsS0FBSyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pCLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxVQUFVLEdBQVcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFFaEgsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7b0JBQ3BELE1BQU0sU0FBUyxHQUFXLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO29CQUN4SCxNQUFNLENBQUMsR0FBVyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEcsTUFBTSxFQUFFLEdBQVcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNoRyxNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3RHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtpQkFDL0c7Z0JBQ0QsTUFBTTthQUNQO1lBRUgsS0FBSyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3pCLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEQsTUFBTSxVQUFVLEdBQVcsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxlQUFlLENBQUMsdUJBQXVCLENBQUMsQ0FBQztnQkFFaEgsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7b0JBQ3BELE1BQU0sU0FBUyxHQUFXLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLGVBQWUsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO29CQUN4SCxNQUFNLENBQUMsR0FBVyxPQUFPLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDeEcsTUFBTSxFQUFFLEdBQVcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsZUFBZSxDQUFDLGVBQWUsQ0FBQyxDQUFDO29CQUNoRyxNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxlQUFlLENBQUMsZUFBZSxDQUFDLENBQUM7b0JBQ3RHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQ3JDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLDBCQUEwQjtpQkFDL0c7Z0JBRUQsb0NBQW9DO2dCQUNwQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUN0QixNQUFNO2FBQ1A7U0FDRjtJQUNILENBQUM7O0FBNURjLG1DQUFtQixHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFDbkMsbUNBQW1CLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUNuQywrQkFBZSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFDL0IsK0JBQWUsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQy9CLHVDQUF1QixHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFDdkMsc0NBQXNCLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQTBEdkQsNkRBQTZEO0FBQzdELE1BQU0sQ0FBTixJQUFZLFlBS1g7QUFMRCxXQUFZLFlBQVk7SUFDdEIsK0RBQWdCLENBQUE7SUFDaEIsNkRBQWUsQ0FBQTtJQUNmLHFFQUFtQixDQUFBO0lBQ25CLG1FQUFrQixDQUFBO0FBQ3BCLENBQUMsRUFMVyxZQUFZLEtBQVosWUFBWSxRQUt2QjtBQUVELHFHQUFxRztBQUNyRyw4RkFBOEY7QUFDOUYsTUFBTSxVQUFVLGdCQUFnQixDQUFDLE1BQXNCLEVBQUUsTUFBc0IsRUFBRSxTQUFxQixFQUFFLFNBQXFCO0lBQzNILCtCQUErQjtJQUMvQixJQUFJLENBQVMsQ0FBQztJQUNkLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUN6QyxNQUFNLEVBQUUsR0FBZ0IsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDL0MsTUFBTSxHQUFHLEdBQVcsRUFBRSxDQUFDLEdBQUcsQ0FBQztRQUUzQixNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBQztRQUV4QyxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxHQUFHLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQ2hFLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLEdBQUcsRUFBRTtnQkFDdEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxlQUFlLENBQUM7Z0JBQ3pDLE1BQU07YUFDUDtTQUNGO0tBQ0Y7SUFDRCxPQUFPLENBQUMsR0FBRyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNwQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUcsWUFBWSxDQUFDLFlBQVksQ0FBQztLQUN2QztJQUVELDRCQUE0QjtJQUM1QixLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDekMsTUFBTSxFQUFFLEdBQWdCLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQy9DLE1BQU0sR0FBRyxHQUFXLEVBQUUsQ0FBQyxHQUFHLENBQUM7UUFFM0IsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUM7UUFFckMsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUNoRSxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHLEVBQUU7Z0JBQ3RDLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsZUFBZSxDQUFDO2dCQUN6QyxNQUFNO2FBQ1A7U0FDRjtLQUNGO0lBQ0QsT0FBTyxDQUFDLEdBQUcsb0JBQW9CLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDcEMsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUM7S0FDdkM7QUFDSCxDQUFDO0FBRUQseUNBQXlDO0FBQ3pDLE1BQU0sT0FBTyxZQUFZO0lBQXpCO1FBQ2tCLE1BQUMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3pCLE9BQUUsR0FBZ0IsSUFBSSxXQUFXLEVBQUUsQ0FBQztJQVd0RCxDQUFDO0lBVFEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFjO1FBQ3BDLE9BQU8sV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQVMsRUFBZ0IsRUFBRSxDQUFDLElBQUksWUFBWSxFQUFFLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRU0sSUFBSSxDQUFDLEtBQW1CO1FBQzdCLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkIsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUFFRCxpRkFBaUY7QUFDakYsTUFBTSxPQUFPLGNBQWM7SUFBM0I7UUFDa0IsT0FBRSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDMUIsT0FBRSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDbkMsZ0JBQVcsR0FBVyxDQUFDLENBQUM7SUFRakMsQ0FBQztJQU5RLElBQUksQ0FBQyxDQUFpQjtRQUMzQixJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDbkIsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQztRQUNqQyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjtBQUVELG9GQUFvRjtBQUNwRiw2QkFBNkI7QUFDN0IsTUFBTSxPQUFPLGVBQWU7SUFBNUI7UUFDa0IsV0FBTSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDdkMsYUFBUSxHQUFXLENBQUMsQ0FBQztJQU85QixDQUFDO0lBTFEsSUFBSSxDQUFDLENBQWtCO1FBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzQixJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUM7UUFDM0IsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUFFRCxpQ0FBaUM7QUFDakMsTUFBTSxPQUFPLE1BQU07SUFBbkI7UUFDa0IsZUFBVSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQyxxQkFBcUI7UUFDeEQsZUFBVSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQyxxQkFBcUI7UUFFdkQsbUJBQWMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDLENBQUMsMkJBQTJCO1FBQ2xFLG1CQUFjLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQyxDQUFDLDRCQUE0QjtJQXlMdEYsQ0FBQztJQXZMUSxJQUFJLENBQUMsQ0FBUztRQUNuQixJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25DLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELHNDQUFzQztJQUMvQixPQUFPO1FBQ1osTUFBTSxHQUFHLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDMUQsTUFBTSxHQUFHLEdBQVcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDMUQsSUFBSSxLQUFLLEdBQVksR0FBRyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQzFDLEtBQUssR0FBRyxLQUFLLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ3hFLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztJQUVELCtCQUErQjtJQUN4QixTQUFTO1FBQ2QsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVELDhDQUE4QztJQUN2QyxVQUFVO1FBQ2YsT0FBTyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDN0UsQ0FBQztJQUVELDRCQUE0QjtJQUNyQixZQUFZO1FBQ2pCLE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sRUFBRSxHQUFXLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQ3pELE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxrQ0FBa0M7SUFDM0IsUUFBUSxDQUFDLElBQVk7UUFDMUIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEUsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRUQsb0NBQW9DO0lBQzdCLFFBQVEsQ0FBQyxLQUFhLEVBQUUsS0FBYTtRQUMxQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNsRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFVBQVUsQ0FBQyxD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