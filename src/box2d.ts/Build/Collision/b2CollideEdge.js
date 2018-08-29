// DEBUG: import { b2Assert } from "../Common/b2Settings";
import { b2_maxFloat, b2_angularSlop, b2_maxManifoldPoints } from "../Common/b2Settings";
import { b2Min, b2Vec2, b2Rot, b2Transform } from "../Common/b2Math";
import { b2ContactFeatureType, b2ContactID } from "./b2Collision";
import { b2ManifoldType, b2ClipVertex, b2ClipSegmentToLine } from "./b2Collision";
const b2CollideEdgeAndCircle_s_Q = new b2Vec2();
const b2CollideEdgeAndCircle_s_e = new b2Vec2();
const b2CollideEdgeAndCircle_s_d = new b2Vec2();
const b2CollideEdgeAndCircle_s_e1 = new b2Vec2();
const b2CollideEdgeAndCircle_s_e2 = new b2Vec2();
const b2CollideEdgeAndCircle_s_P = new b2Vec2();
const b2CollideEdgeAndCircle_s_n = new b2Vec2();
const b2CollideEdgeAndCircle_s_id = new b2ContactID();
export function b2CollideEdgeAndCircle(manifold, edgeA, xfA, circleB, xfB) {
    manifold.pointCount = 0;
    // Compute circle in frame of edge
    const Q = b2Transform.MulTXV(xfA, b2Transform.MulXV(xfB, circleB.m_p, b2Vec2.s_t0), b2CollideEdgeAndCircle_s_Q);
    const A = edgeA.m_vertex1;
    const B = edgeA.m_vertex2;
    const e = b2Vec2.SubVV(B, A, b2CollideEdgeAndCircle_s_e);
    // Barycentric coordinates
    const u = b2Vec2.DotVV(e, b2Vec2.SubVV(B, Q, b2Vec2.s_t0));
    const v = b2Vec2.DotVV(e, b2Vec2.SubVV(Q, A, b2Vec2.s_t0));
    const radius = edgeA.m_radius + circleB.m_radius;
    // const cf: b2ContactFeature = new b2ContactFeature();
    const id = b2CollideEdgeAndCircle_s_id;
    id.cf.indexB = 0;
    id.cf.typeB = b2ContactFeatureType.e_vertex;
    // Region A
    if (v <= 0) {
        const P = A;
        const d = b2Vec2.SubVV(Q, P, b2CollideEdgeAndCircle_s_d);
        const dd = b2Vec2.DotVV(d, d);
        if (dd > radius * radius) {
            return;
        }
        // Is there an edge connected to A?
        if (edgeA.m_hasVertex0) {
            const A1 = edgeA.m_vertex0;
            const B1 = A;
            const e1 = b2Vec2.SubVV(B1, A1, b2CollideEdgeAndCircle_s_e1);
            const u1 = b2Vec2.DotVV(e1, b2Vec2.SubVV(B1, Q, b2Vec2.s_t0));
            // Is the circle in Region AB of the previous edge?
            if (u1 > 0) {
                return;
            }
        }
        id.cf.indexA = 0;
        id.cf.typeA = b2ContactFeatureType.e_vertex;
        manifold.pointCount = 1;
        manifold.type = b2ManifoldType.e_circles;
        manifold.localNormal.SetZero();
        manifold.localPoint.Copy(P);
        manifold.points[0].id.Copy(id);
        // manifold.points[0].id.key = 0;
        // manifold.points[0].id.cf = cf;
        manifold.points[0].localPoint.Copy(circleB.m_p);
        return;
    }
    // Region B
    if (u <= 0) {
        const P = B;
        const d = b2Vec2.SubVV(Q, P, b2CollideEdgeAndCircle_s_d);
        const dd = b2Vec2.DotVV(d, d);
        if (dd > radius * radius) {
            return;
        }
        // Is there an edge connected to B?
        if (edgeA.m_hasVertex3) {
            const B2 = edgeA.m_vertex3;
            const A2 = B;
            const e2 = b2Vec2.SubVV(B2, A2, b2CollideEdgeAndCircle_s_e2);
            const v2 = b2Vec2.DotVV(e2, b2Vec2.SubVV(Q, A2, b2Vec2.s_t0));
            // Is the circle in Region AB of the next edge?
            if (v2 > 0) {
                return;
            }
        }
        id.cf.indexA = 1;
        id.cf.typeA = b2ContactFeatureType.e_vertex;
        manifold.pointCount = 1;
        manifold.type = b2ManifoldType.e_circles;
        manifold.localNormal.SetZero();
        manifold.localPoint.Copy(P);
        manifold.points[0].id.Copy(id);
        // manifold.points[0].id.key = 0;
        // manifold.points[0].id.cf = cf;
        manifold.points[0].localPoint.Copy(circleB.m_p);
        return;
    }
    // Region AB
    const den = b2Vec2.DotVV(e, e);
    // DEBUG: b2Assert(den > 0);
    const P = b2CollideEdgeAndCircle_s_P;
    P.x = (1 / den) * (u * A.x + v * B.x);
    P.y = (1 / den) * (u * A.y + v * B.y);
    const d = b2Vec2.SubVV(Q, P, b2CollideEdgeAndCircle_s_d);
    const dd = b2Vec2.DotVV(d, d);
    if (dd > radius * radius) {
        return;
    }
    const n = b2CollideEdgeAndCircle_s_n.Set(-e.y, e.x);
    if (b2Vec2.DotVV(n, b2Vec2.SubVV(Q, A, b2Vec2.s_t0)) < 0) {
        n.Set(-n.x, -n.y);
    }
    n.Normalize();
    id.cf.indexA = 0;
    id.cf.typeA = b2ContactFeatureType.e_face;
    manifold.pointCount = 1;
    manifold.type = b2ManifoldType.e_faceA;
    manifold.localNormal.Copy(n);
    manifold.localPoint.Copy(A);
    manifold.points[0].id.Copy(id);
    // manifold.points[0].id.key = 0;
    // manifold.points[0].id.cf = cf;
    manifold.points[0].localPoint.Copy(circleB.m_p);
}
class b2EPAxis {
    constructor() {
        this.type = 0 /* e_unknown */;
        this.index = 0;
        this.separation = 0;
    }
}
class b2TempPolygon {
    constructor() {
        this.vertices = [];
        this.normals = [];
        this.count = 0;
    }
}
class b2ReferenceFace {
    constructor() {
        this.i1 = 0;
        this.i2 = 0;
        this.v1 = new b2Vec2();
        this.v2 = new b2Vec2();
        this.normal = new b2Vec2();
        this.sideNormal1 = new b2Vec2();
        this.sideOffset1 = 0;
        this.sideNormal2 = new b2Vec2();
        this.sideOffset2 = 0;
    }
}
class b2EPCollider {
    constructor() {
        this.m_polygonB = new b2TempPolygon();
        this.m_xf = new b2Transform();
        this.m_centroidB = new b2Vec2();
        this.m_v0 = new b2Vec2();
        this.m_v1 = new b2Vec2();
        this.m_v2 = new b2Vec2();
        this.m_v3 = new b2Vec2();
        this.m_normal0 = new b2Vec2();
        this.m_normal1 = new b2Vec2();
        this.m_normal2 = new b2Vec2();
        this.m_normal = new b2Vec2();
        this.m_type1 = 0 /* e_isolated */;
        this.m_type2 = 0 /* e_isolated */;
        this.m_lowerLimit = new b2Vec2();
        this.m_upperLimit = new b2Vec2();
        this.m_radius = 0;
        this.m_front = false;
    }
    Collide(manifold, edgeA, xfA, polygonB, xfB) {
        b2Transform.MulTXX(xfA, xfB, this.m_xf);
        b2Transform.MulXV(this.m_xf, polygonB.m_centroid, this.m_centroidB);
        this.m_v0.Copy(edgeA.m_vertex0);
        this.m_v1.Copy(edgeA.m_vertex1);
        this.m_v2.Copy(edgeA.m_vertex2);
        this.m_v3.Copy(edgeA.m_vertex3);
        const hasVertex0 = edgeA.m_hasVertex0;
        const hasVertex3 = edgeA.m_hasVertex3;
        const edge1 = b2Vec2.SubVV(this.m_v2, this.m_v1, b2EPCollider.s_edge1);
        edge1.Normalize();
        this.m_normal1.Set(edge1.y, -edge1.x);
        const offset1 = b2Vec2.DotVV(this.m_normal1, b2Vec2.SubVV(this.m_centroidB, this.m_v1, b2Vec2.s_t0));
        let offset0 = 0;
        let offset2 = 0;
        let convex1 = false;
        let convex2 = false;
        // Is there a preceding edge?
        if (hasVertex0) {
            const edge0 = b2Vec2.SubVV(this.m_v1, this.m_v0, b2EPCollider.s_edge0);
            edge0.Normalize();
            this.m_normal0.Set(edge0.y, -edge0.x);
            convex1 = b2Vec2.CrossVV(edge0, edge1) >= 0;
            offset0 = b2Vec2.DotVV(this.m_normal0, b2Vec2.SubVV(this.m_centroidB, this.m_v0, b2Vec2.s_t0));
        }
        // Is there a following edge?
        if (hasVertex3) {
            const edge2 = b2Vec2.SubVV(this.m_v3, this.m_v2, b2EPCollider.s_edge2);
            edge2.Normalize();
            this.m_normal2.Set(edge2.y, -edge2.x);
            convex2 = b2Vec2.CrossVV(edge1, edge2) > 0;
            offset2 = b2Vec2.DotVV(this.m_normal2, b2Vec2.SubVV(this.m_centroidB, this.m_v2, b2Vec2.s_t0));
        }
        // Determine front or back collision. Determine collision normal limits.
        if (hasVertex0 && hasVertex3) {
            if (convex1 && convex2) {
                this.m_front = offset0 >= 0 || offset1 >= 0 || offset2 >= 0;
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal0);
                    this.m_upperLimit.Copy(this.m_normal2);
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal1).SelfNeg();
                }
            }
            else if (convex1) {
                this.m_front = offset0 >= 0 || (offset1 >= 0 && offset2 >= 0);
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal0);
                    this.m_upperLimit.Copy(this.m_normal1);
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal2).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal1).SelfNeg();
                }
            }
            else if (convex2) {
                this.m_front = offset2 >= 0 || (offset0 >= 0 && offset1 >= 0);
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal1);
                    this.m_upperLimit.Copy(this.m_normal2);
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal0).SelfNeg();
                }
            }
            else {
                this.m_front = offset0 >= 0 && offset1 >= 0 && offset2 >= 0;
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal1);
                    this.m_upperLimit.Copy(this.m_normal1);
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal2).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal0).SelfNeg();
                }
            }
        }
        else if (hasVertex0) {
            if (convex1) {
                this.m_front = offset0 >= 0 || offset1 >= 0;
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal0);
                    this.m_upperLimit.Copy(this.m_normal1).SelfNeg();
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal1);
                    this.m_upperLimit.Copy(this.m_normal1).SelfNeg();
                }
            }
            else {
                this.m_front = offset0 >= 0 && offset1 >= 0;
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal1);
                    this.m_upperLimit.Copy(this.m_normal1).SelfNeg();
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal1);
                    this.m_upperLimit.Copy(this.m_normal0).SelfNeg();
                }
            }
        }
        else if (hasVertex3) {
            if (convex2) {
                this.m_front = offset1 >= 0 || offset2 >= 0;
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal2);
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal1);
                }
            }
            else {
                this.m_front = offset1 >= 0 && offset2 >= 0;
                if (this.m_front) {
                    this.m_normal.Copy(this.m_normal1);
                    this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal1);
                }
                else {
                    this.m_normal.Copy(this.m_normal1).SelfNeg();
                    this.m_lowerLimit.Copy(this.m_normal2).SelfNeg();
                    this.m_upperLimit.Copy(this.m_normal1);
                }
            }
        }
        else {
            this.m_front = offset1 >= 0;
            if (this.m_front) {
                this.m_normal.Copy(this.m_normal1);
                this.m_lowerLimit.Copy(this.m_normal1).SelfNeg();
                this.m_upperLimit.Copy(this.m_normal1).SelfNeg();
            }
            else {
                this.m_normal.Copy(this.m_normal1).SelfNeg();
                this.m_lowerLimit.Copy(this.m_normal1);
                this.m_upperLimit.Copy(this.m_normal1);
            }
        }
        // Get polygonB in frameA
        this.m_polygonB.count = polygonB.m_count;
        for (let i = 0; i < polygonB.m_count; ++i) {
            if (this.m_polygonB.vertices.length <= i) {
                this.m_polygonB.vertices.push(new b2Vec2());
            }
            if (this.m_polygonB.normals.length <= i) {
                this.m_polygonB.normals.push(new b2Vec2());
            }
            b2Transform.MulXV(this.m_xf, polygonB.m_vertices[i], this.m_polygonB.vertices[i]);
            b2Rot.MulRV(this.m_xf.q, polygonB.m_normals[i], this.m_polygonB.normals[i]);
        }
        this.m_radius = polygonB.m_radius + edgeA.m_radius;
        manifold.pointCount = 0;
        const edgeAxis = this.ComputeEdgeSeparation(b2EPCollider.s_edgeAxis);
        // If no valid normal can be found than this edge should not collide.
        if (edgeAxis.type === 0 /* e_unknown */) {
            return;
        }
        if (edgeAxis.separation > this.m_radius) {
            return;
        }
        const polygonAxis = this.ComputePolygonSeparation(b2EPCollider.s_polygonAxis);
        if (polygonAxis.type !== 0 /* e_unknown */ && polygonAxis.separation > this.m_radius) {
            return;
        }
        // Use hysteresis for jitter reduction.
        const k_relativeTol = 0.98;
        const k_absoluteTol = 0.001;
        let primaryAxis;
        if (polygonAxis.type === 0 /* e_unknown */) {
            primaryAxis = edgeAxis;
        }
        else if (polygonAxis.separation > k_relativeTol * edgeAxis.separation + k_absoluteTol) {
            primaryAxis = polygonAxis;
        }
        else {
            primaryAxis = edgeAxis;
        }
        const ie = b2EPCollider.s_ie;
        const rf = b2EPCollider.s_rf;
        if (primaryAxis.type === 1 /* e_edgeA */) {
            manifold.type = b2ManifoldType.e_faceA;
            // Search for the polygon normal that is most anti-parallel to the edge normal.
            let bestIndex = 0;
            let bestValue = b2Vec2.DotVV(this.m_normal, this.m_polygonB.normals[0]);
            for (let i = 1; i < this.m_polygonB.count; ++i) {
                const value = b2Vec2.DotVV(this.m_normal, this.m_polygonB.normals[i]);
                if (value < bestValue) {
                    bestValue = value;
                    bestIndex = i;
                }
            }
            const i1 = bestIndex;
            const i2 = (i1 + 1) % this.m_polygonB.count;
            const ie0 = ie[0];
            ie0.v.Copy(this.m_polygonB.vertices[i1]);
            ie0.id.cf.indexA = 0;
            ie0.id.cf.indexB = i1;
            ie0.id.cf.typeA = b2ContactFeatureType.e_face;
            ie0.id.cf.typeB = b2ContactFeatureType.e_vertex;
            const ie1 = ie[1];
            ie1.v.Copy(this.m_polygonB.vertices[i2]);
            ie1.id.cf.indexA = 0;
            ie1.id.cf.indexB = i2;
            ie1.id.cf.typeA = b2ContactFeatureType.e_face;
            ie1.id.cf.typeB = b2ContactFeatureType.e_vertex;
            if (this.m_front) {
                rf.i1 = 0;
                rf.i2 = 1;
                rf.v1.Copy(this.m_v1);
                rf.v2.Copy(this.m_v2);
                rf.normal.Copy(this.m_normal1);
            }
            else {
                rf.i1 = 1;
                rf.i2 = 0;
                rf.v1.Copy(this.m_v2);
                rf.v2.Copy(this.m_v1);
                rf.normal.Copy(this.m_normal1).SelfNeg();
            }
        }
        else {
            manifold.type = b2ManifoldType.e_faceB;
            const ie0 = ie[0];
            ie0.v.Copy(this.m_v1);
            ie0.id.cf.indexA = 0;
            ie0.id.cf.indexB = primaryAxis.index;
            ie0.id.cf.typeA = b2ContactFeatureType.e_vertex;
            ie0.id.cf.typeB = b2ContactFeatureType.e_face;
            const ie1 = ie[1];
            ie1.v.Copy(this.m_v2);
            ie1.id.cf.indexA = 0;
            ie1.id.cf.indexB = primaryAxis.index;
            ie1.id.cf.typeA = b2ContactFeatureType.e_vertex;
            ie1.id.cf.typeB = b2ContactFeatureType.e_face;
            rf.i1 = primaryAxis.index;
            rf.i2 = (rf.i1 + 1) % this.m_polygonB.count;
            rf.v1.Copy(this.m_polygonB.vertices[rf.i1]);
            rf.v2.Copy(this.m_polygonB.vertices[rf.i2]);
            rf.normal.Copy(this.m_polygonB.normals[rf.i1]);
        }
        rf.sideNormal1.Set(rf.normal.y, -rf.normal.x);
        rf.sideNormal2.Copy(rf.sideNormal1).SelfNeg();
        rf.sideOffset1 = b2Vec2.DotVV(rf.sideNormal1, rf.v1);
        rf.sideOffset2 = b2Vec2.DotVV(rf.sideNormal2, rf.v2);
        // Clip incident edge against extruded edge1 side edges.
        const clipPoints1 = b2EPCollider.s_clipPoints1;
        const clipPoints2 = b2EPCollider.s_clipPoints2;
        let np = 0;
        // Clip to box side 1
        np = b2ClipSegmentToLine(clipPoints1, ie, rf.sideNormal1, rf.sideOffset1, rf.i1);
        if (np < b2_maxManifoldPoints) {
            return;
        }
        // Clip to negative box side 1
        np = b2ClipSegmentToLine(clipPoints2, clipPoints1, rf.sideNormal2, rf.sideOffset2, rf.i2);
        if (np < b2_maxManifoldPoints) {
            return;
        }
        // Now clipPoints2 contains the clipped points.
        if (primaryAxis.type === 1 /* e_edgeA */) {
            manifold.localNormal.Copy(rf.normal);
            manifold.localPoint.Copy(rf.v1);
        }
        else {
            manifold.localNormal.Copy(polygonB.m_normals[rf.i1]);
            manifold.localPoint.Copy(polygonB.m_vertices[rf.i1]);
        }
        let pointCount = 0;
        for (let i = 0; i < b2_maxManifoldPoints; ++i) {
            let separation;
            separation = b2Vec2.DotVV(rf.normal, b2Vec2.SubVV(clipPoints2[i].v, rf.v1, b2Vec2.s_t0));
            if (separation <= this.m_radius) {
                const cp = manifold.points[pointCount];
                if (primaryAxis.type === 1 /* e_edgeA */) {
                    b2Transform.MulTXV(this.m_xf, clipPoints2[i].v, cp.localPoint);
                    cp.id = clipPoints2[i].id;
                }
                else {
                    cp.localPoint.Copy(clipPoints2[i].v);
                    cp.id.cf.typeA = clipPoints2[i].id.cf.typeB;
                    cp.id.cf.typeB = clipPoints2[i].id.cf.typeA;
                    cp.id.cf.indexA = clipPoints2[i].id.cf.indexB;
                    cp.id.cf.indexB = clipPoints2[i].id.cf.indexA;
                }
                ++pointCount;
            }
        }
        manifold.pointCount = pointCount;
    }
    ComputeEdgeSeparation(out) {
        const axis = out;
        axis.type = 1 /* e_edgeA */;
        axis.index = this.m_front ? 0 : 1;
        axis.separation = b2_maxFloat;
        for (let i = 0; i < this.m_polygonB.count; ++i) {
            const s = b2Vec2.DotVV(this.m_normal, b2Vec2.SubVV(this.m_polygonB.vertices[i], this.m_v1, b2Vec2.s_t0));
            if (s < axis.separation) {
                axis.separation = s;
            }
        }
        return axis;
    }
    ComputePolygonSeparation(out) {
        const axis = out;
        axis.type = 0 /* e_unknown */;
        axis.index = -1;
        axis.separation = -b2_maxFloat;
        const perp = b2EPCollider.s_perp.Set(-this.m_normal.y, this.m_normal.x);
        for (let i = 0; i < this.m_polygonB.count; ++i) {
            const n = b2Vec2.NegV(this.m_polygonB.normals[i], b2EPCollider.s_n);
            const s1 = b2Vec2.DotVV(n, b2Vec2.SubVV(this.m_polygonB.vertices[i], this.m_v1, b2Vec2.s_t0));
            const s2 = b2Vec2.DotVV(n, b2Vec2.SubVV(this.m_polygonB.vertices[i], this.m_v2, b2Vec2.s_t0));
            const s = b2Min(s1, s2);
            if (s > this.m_radius) {
                // No collision
                axis.type = 2 /* e_edgeB */;
                axis.index = i;
                axis.separation = s;
                return axis;
            }
            // Adjacency
            if (b2Vec2.DotVV(n, perp) >= 0) {
                if (b2Vec2.DotVV(b2Vec2.SubVV(n, this.m_upperLimit, b2Vec2.s_t0), this.m_normal) < -b2_angularSlop) {
                    continue;
                }
            }
            else {
                if (b2Vec2.DotVV(b2Vec2.SubVV(n, this.m_lowerLimit, b2Vec2.s_t0), this.m_normal) < -b2_angularSlop) {
                    continue;
                }
            }
            if (s > axis.separation) {
                axis.type = 2 /* e_edgeB */;
                axis.index = i;
                axis.separation = s;
            }
        }
        return axis;
    }
}
b2EPCollider.s_edge1 = new b2Vec2();
b2EPCollider.s_edge0 = new b2Vec2();
b2EPCollider.s_edge2 = new b2Vec2();
b2EPCollider.s_ie = b2ClipVertex.MakeArray(2);
b2EPCollider.s_rf = new b2ReferenceFace();
b2EPCollider.s_clipPoints1 = b2ClipVertex.MakeArray(2);
b2EPCollider.s_clipPoints2 = b2ClipVertex.MakeArray(2);
b2EPCollider.s_edgeAxis = new b2EPAxis();
b2EPCollider.s_polygonAxis = new b2EPAxis();
b2EPCollider.s_n = new b2Vec2();
b2EPCollider.s_perp = new b2Vec2();
const b2CollideEdgeAndPolygon_s_collider = new b2EPCollider();
export function b2CollideEdgeAndPolygon(manifold, edgeA, xfA, polygonB, xfB) {
    const collider = b2CollideEdgeAndPolygon_s_collider;
    collider.Collide(manifold, edgeA, xfA, polygonB, xfB);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb2xsaWRlRWRnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0NvbGxpc2lvbi9iMkNvbGxpZGVFZGdlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLDBEQUEwRDtBQUMxRCxPQUFPLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQ3pGLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNyRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsV0FBVyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBQ2xFLE9BQU8sRUFBYyxjQUFjLEVBQW1CLFlBQVksRUFBRSxtQkFBbUIsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUsvRyxNQUFNLDBCQUEwQixHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7QUFDeEQsTUFBTSwwQkFBMEIsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3hELE1BQU0sMEJBQTBCLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN4RCxNQUFNLDJCQUEyQixHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7QUFDekQsTUFBTSwyQkFBMkIsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3pELE1BQU0sMEJBQTBCLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN4RCxNQUFNLDBCQUEwQixHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7QUFDeEQsTUFBTSwyQkFBMkIsR0FBZ0IsSUFBSSxXQUFXLEVBQUUsQ0FBQztBQUNuRSxNQUFNLFVBQVUsc0JBQXNCLENBQUMsUUFBb0IsRUFBRSxLQUFrQixFQUFFLEdBQWdCLEVBQUUsT0FBc0IsRUFBRSxHQUFnQjtJQUN6SSxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztJQUV4QixrQ0FBa0M7SUFDbEMsTUFBTSxDQUFDLEdBQVcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztJQUV4SCxNQUFNLENBQUMsR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDO0lBQ2xDLE1BQU0sQ0FBQyxHQUFXLEtBQUssQ0FBQyxTQUFTLENBQUM7SUFDbEMsTUFBTSxDQUFDLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFFakUsMEJBQTBCO0lBQzFCLE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNuRSxNQUFNLENBQUMsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7SUFFbkUsTUFBTSxNQUFNLEdBQVcsS0FBSyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBRXpELHVEQUF1RDtJQUN2RCxNQUFNLEVBQUUsR0FBZ0IsMkJBQTJCLENBQUM7SUFDcEQsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQztJQUU1QyxXQUFXO0lBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ1YsTUFBTSxDQUFDLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sRUFBRSxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLElBQUksRUFBRSxHQUFHLE1BQU0sR0FBRyxNQUFNLEVBQUU7WUFDeEIsT0FBTztTQUNSO1FBRUQsbUNBQW1DO1FBQ25DLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRTtZQUN0QixNQUFNLEVBQUUsR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDO1lBQ25DLE1BQU0sRUFBRSxHQUFXLENBQUMsQ0FBQztZQUNyQixNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztZQUNyRSxNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFdEUsbURBQW1EO1lBQ25ELElBQUksRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDVixPQUFPO2FBQ1I7U0FDRjtRQUVELEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNqQixFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUM7UUFDNUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDeEIsUUFBUSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO1FBQ3pDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDL0IsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9CLGlDQUFpQztRQUNqQyxpQ0FBaUM7UUFDakMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoRCxPQUFPO0tBQ1I7SUFFRCxXQUFXO0lBQ1gsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ1YsTUFBTSxDQUFDLEdBQVcsQ0FBQyxDQUFDO1FBQ3BCLE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO1FBQ2pFLE1BQU0sRUFBRSxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLElBQUksRUFBRSxHQUFHLE1BQU0sR0FBRyxNQUFNLEVBQUU7WUFDeEIsT0FBTztTQUNSO1FBRUQsbUNBQW1DO1FBQ25DLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRTtZQUN0QixNQUFNLEVBQUUsR0FBVyxLQUFLLENBQUMsU0FBUyxDQUFDO1lBQ25DLE1BQU0sRUFBRSxHQUFXLENBQUMsQ0FBQztZQUNyQixNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztZQUNyRSxNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFFdEUsK0NBQStDO1lBQy9DLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRTtnQkFDVixPQUFPO2FBQ1I7U0FDRjtRQUVELEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztRQUNqQixFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUM7UUFDNUMsUUFBUSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDeEIsUUFBUSxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO1FBQ3pDLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDL0IsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQy9CLGlDQUFpQztRQUNqQyxpQ0FBaUM7UUFDakMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoRCxPQUFPO0tBQ1I7SUFFRCxZQUFZO0lBQ1osTUFBTSxHQUFHLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDdkMsNEJBQTRCO0lBQzVCLE1BQU0sQ0FBQyxHQUFXLDBCQUEwQixDQUFDO0lBQzdDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQ2pFLE1BQU0sRUFBRSxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLElBQUksRUFBRSxHQUFHLE1BQU0sR0FBRyxNQUFNLEVBQUU7UUFDeEIsT0FBTztLQUNSO0lBRUQsTUFBTSxDQUFDLEdBQVcsMEJBQTBCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUQsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ3hELENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ25CO0lBQ0QsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBRWQsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQztJQUMxQyxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztJQUN4QixRQUFRLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUM7SUFDdkMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDN0IsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUIsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9CLGlDQUFpQztJQUNqQyxpQ0FBaUM7SUFDakMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBUUQsTUFBTSxRQUFRO0lBQWQ7UUFDUyxTQUFJLHFCQUF3QztRQUM1QyxVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBQ2xCLGVBQVUsR0FBVyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUFBO0FBRUQsTUFBTSxhQUFhO0lBQW5CO1FBQ1MsYUFBUSxHQUFhLEVBQUUsQ0FBQztRQUN4QixZQUFPLEdBQWEsRUFBRSxDQUFDO1FBQ3ZCLFVBQUssR0FBVyxDQUFDLENBQUM7SUFDM0IsQ0FBQztDQUFBO0FBRUQsTUFBTSxlQUFlO0lBQXJCO1FBQ1MsT0FBRSxHQUFXLENBQUMsQ0FBQztRQUNmLE9BQUUsR0FBVyxDQUFDLENBQUM7UUFDTixPQUFFLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUMxQixPQUFFLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUMxQixXQUFNLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUM5QixnQkFBVyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDNUMsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDZixnQkFBVyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDNUMsZ0JBQVcsR0FBVyxDQUFDLENBQUM7SUFDakMsQ0FBQztDQUFBO0FBUUQsTUFBTSxZQUFZO0lBQWxCO1FBQ2tCLGVBQVUsR0FBa0IsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNoRCxTQUFJLEdBQWdCLElBQUksV0FBVyxFQUFFLENBQUM7UUFDdEMsZ0JBQVcsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ25DLFNBQUksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzVCLFNBQUksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzVCLFNBQUksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzVCLFNBQUksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQzVCLGNBQVMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ2pDLGNBQVMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ2pDLGNBQVMsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ2pDLGFBQVEsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3pDLFlBQU8sc0JBQXFDO1FBQzVDLFlBQU8sc0JBQXFDO1FBQ25DLGlCQUFZLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNwQyxpQkFBWSxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDN0MsYUFBUSxHQUFXLENBQUMsQ0FBQztRQUNyQixZQUFPLEdBQVksS0FBSyxDQUFDO0lBd1lsQyxDQUFDO0lBN1hRLE9BQU8sQ0FBQyxRQUFvQixFQUFFLEtBQWtCLEVBQUUsR0FBZ0IsRUFBRSxRQUF3QixFQUFFLEdBQWdCO1FBQ25ILFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFeEMsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXBFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2hDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVoQyxNQUFNLFVBQVUsR0FBWSxLQUFLLENBQUMsWUFBWSxDQUFDO1FBQy9DLE1BQU0sVUFBVSxHQUFZLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFFL0MsTUFBTSxLQUFLLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQy9FLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLE1BQU0sT0FBTyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztRQUM3RyxJQUFJLE9BQU8sR0FBVyxDQUFDLENBQUM7UUFDeEIsSUFBSSxPQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ3hCLElBQUksT0FBTyxHQUFZLEtBQUssQ0FBQztRQUM3QixJQUFJLE9BQU8sR0FBWSxLQUFLLENBQUM7UUFFN0IsNkJBQTZCO1FBQzdCLElBQUksVUFBVSxFQUFFO1lBQ2QsTUFBTSxLQUFLLEdBQVcsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQy9FLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNsQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3RDLE9BQU8sR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDNUMsT0FBTyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNoRztRQUVELDZCQUE2QjtRQUM3QixJQUFJLFVBQVUsRUFBRTtZQUNkLE1BQU0sS0FBSyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUMvRSxLQUFLLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDbEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0QyxPQUFPLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLE9BQU8sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDaEc7UUFFRCx3RUFBd0U7UUFDeEUsSUFBSSxVQUFVLElBQUksVUFBVSxFQUFFO1lBQzVCLElBQUksT0FBTyxJQUFJLE9BQU8sRUFBRTtnQkFDdEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQztnQkFDNUQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUN4QztxQkFBTTtvQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNsRDthQUNGO2lCQUFNLElBQUksT0FBTyxFQUFFO2dCQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUN4QztxQkFBTTtvQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNsRDthQUNGO2lCQUFNLElBQUksT0FBTyxFQUFFO2dCQUNsQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDOUQsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUN4QztxQkFBTTtvQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNsRDthQUNGO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxJQUFJLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUM7Z0JBQzVELElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNuQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDeEM7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUM3QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ2pELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDbEQ7YUFDRjtTQUNGO2FBQU0sSUFBSSxVQUFVLEVBQUU7WUFDckIsSUFBSSxPQUFPLEVBQUU7Z0JBQ1gsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksQ0FBQyxJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUM7Z0JBQzVDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtvQkFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO29CQUNuQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDbEQ7cUJBQU07b0JBQ0wsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUM3QyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ3ZDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztpQkFDbEQ7YUFDRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNsRDtxQkFBTTtvQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO2lCQUNsRDthQUNGO1NBQ0Y7YUFBTSxJQUFJLFVBQVUsRUFBRTtZQUNyQixJQUFJLE9BQU8sRUFBRTtnQkFDWCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQztnQkFDNUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO29CQUNoQixJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7b0JBQ25DLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUN4QztxQkFBTTtvQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDakQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2lCQUN4QzthQUNGO2lCQUFNO2dCQUNMLElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxJQUFJLENBQUMsSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDO2dCQUM1QyxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7b0JBQ2hCLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztvQkFDbkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNqRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQ3hDO3FCQUFNO29CQUNMLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDN0MsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO29CQUNqRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7aUJBQ3hDO2FBQ0Y7U0FDRjthQUFNO1lBQ0wsSUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLElBQUksQ0FBQyxDQUFDO1lBQzVCLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRTtnQkFDaEIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNuQyxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2pELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUNsRDtpQkFBTTtnQkFDTCxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQzdDLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztnQkFDdkMsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ3hDO1NBQ0Y7UUFFRCx5QkFBeUI7UUFDekIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQztRQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRTtZQUNqRCxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7Z0JBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQzthQUFFO1lBQzFGLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQUU7WUFDeEYsV0FBVyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNsRixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM3RTtRQUVELElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBRW5ELFFBQVEsQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBRXhCLE1BQU0sUUFBUSxHQUFhLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFL0UscUVBQXFFO1FBQ3JFLElBQUksUUFBUSxDQUFDLElBQUksc0JBQTJCLEVBQUU7WUFDNUMsT0FBTztTQUNSO1FBRUQsSUFBSSxRQUFRLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDdkMsT0FBTztTQUNSO1FBRUQsTUFBTSxXQUFXLEdBQWEsSUFBSSxDQUFDLHdCQUF3QixDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUN4RixJQUFJLFdBQVcsQ0FBQyxJQUFJLHNCQUEyQixJQUFJLFdBQVcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUN6RixPQUFPO1NBQ1I7UUFFRCx1Q0FBdUM7UUFDdkMsTUFBTSxhQUFhLEdBQVcsSUFBSSxDQUFDO1FBQ25DLE1BQU0sYUFBYSxHQUFXLEtBQUssQ0FBQztRQUVwQyxJQUFJLFdBQXFCLENBQUM7UUFDMUIsSUFBSSxXQUFXLENBQUMsSUFBSSxzQkFBMkIsRUFBRTtZQUMvQyxXQUFXLEdBQUcsUUFBUSxDQUFDO1NBQ3hCO2FBQU0sSUFBSSxXQUFXLENBQUMsVUFBVSxHQUFHLGFBQWEsR0FBRyxRQUFRLENBQUMsVUFBVSxHQUFHLGFBQWEsRUFBRTtZQUN2RixXQUFXLEdBQUcsV0FBVyxDQUFDO1NBQzNCO2FBQU07WUFDTCxXQUFXLEdBQUcsUUFBUSxDQUFDO1NBQ3hCO1FBRUQsTUFBTSxFQUFFLEdBQW1CLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDN0MsTUFBTSxFQUFFLEdBQW9CLFlBQVksQ0FBQyxJQUFJLENBQUM7UUFDOUMsSUFBSSxXQUFXLENBQUMsSUFBSSxvQkFBeUIsRUFBRTtZQUM3QyxRQUFRLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUM7WUFFdkMsK0VBQStFO1lBQy9FLElBQUksU0FBUyxHQUFXLENBQUMsQ0FBQztZQUMxQixJQUFJLFNBQVMsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoRixLQUFLLElBQUksQ0FBQyxHQUFXLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLEVBQUU7Z0JBQ3RELE1BQU0sS0FBSyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5RSxJQUFJLEtBQUssR0FBRyxTQUFTLEVBQUU7b0JBQ3JCLFNBQVMsR0FBRyxLQUFLLENBQUM7b0JBQ2xCLFNBQVMsR0FBRyxDQUFDLENBQUM7aUJBQ2Y7YUFDRjtZQUVELE1BQU0sRUFBRSxHQUFXLFNBQVMsQ0FBQztZQUM3QixNQUFNLEVBQUUsR0FBVyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQztZQUVwRCxNQUFNLEdBQUcsR0FBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNyQixHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7WUFDOUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQztZQUVoRCxNQUFNLEdBQUcsR0FBaUIsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDekMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNyQixHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7WUFDOUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQztZQUVoRCxJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7Z0JBQ2hCLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNWLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNWLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEIsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0QixFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDaEM7aUJBQU07Z0JBQ0wsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ1YsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7Z0JBQ1YsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUN0QixFQUFFLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxQztTQUNGO2FBQU07WUFDTCxRQUFRLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxPQUFPLENBQUM7WUFFdkMsTUFBTSxHQUFHLEdBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNyQixHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUNyQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDO1lBQ2hELEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7WUFFOUMsTUFBTSxHQUFHLEdBQWlCLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNoQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDdEIsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUNyQixHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQztZQUNyQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEdBQUcsb0JBQW9CLENBQUMsUUFBUSxDQUFDO1lBQ2hELEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxNQUFNLENBQUM7WUFFOUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDO1lBQzFCLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDO1lBQzVDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzVDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ2hEO1FBRUQsRUFBRSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlDLEVBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUM5QyxFQUFFLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDckQsRUFBRSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXJELHdEQUF3RDtRQUN4RCxNQUFNLFdBQVcsR0FBbUIsWUFBWSxDQUFDLGFBQWEsQ0FBQztRQUMvRCxNQUFNLFdBQVcsR0FBbUIsWUFBWSxDQUFDLGFBQWEsQ0FBQztRQUMvRCxJQUFJLEVBQUUsR0FBVyxDQUFDLENBQUM7UUFFbkIscUJBQXFCO1FBQ3JCLEVBQUUsR0FBRyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFakYsSUFBSSxFQUFFLEdBQUcsb0JBQW9CLEVBQUU7WUFDN0IsT0FBTztTQUNSO1FBRUQsOEJBQThCO1FBQzlCLEVBQUUsR0FBRyxtQkFBbUIsQ0FBQyxXQUFXLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDLFdBQVcsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFMUYsSUFBSSxFQUFFLEdBQUcsb0JBQW9CLEVBQUU7WUFDN0IsT0FBTztTQUNSO1FBRUQsK0NBQStDO1FBQy9DLElBQUksV0FBVyxDQUFDLElBQUksb0JBQXlCLEVBQUU7WUFDN0MsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3JDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNqQzthQUFNO1lBQ0wsUUFBUSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUNyRCxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3REO1FBRUQsSUFBSSxVQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQzNCLEtBQUssSUFBSSxDQUFDLEdBQVcsQ0FBQyxFQUFFLENBQUMsR0FBRyxvQkFBb0IsRUFBRSxFQUFFLENBQUMsRUFBRTtZQUNyRCxJQUFJLFVBQWtCLENBQUM7WUFFdkIsVUFBVSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUV6RixJQUFJLFVBQVUsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUMvQixNQUFNLEVBQUUsR0FBb0IsUUFBUSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFeEQsSUFBSSxXQUFXLENBQUMsSUFBSSxvQkFBeUIsRUFBRTtvQkFDN0MsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUMvRCxFQUFFLENBQUMsRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7aUJBQzNCO3FCQUFNO29CQUNMLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDckMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQztvQkFDNUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQztvQkFDNUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztvQkFDOUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQztpQkFDL0M7Z0JBRUQsRUFBRSxVQUFVLENBQUM7YUFDZDtTQUNGO1FBRUQsUUFBUSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDbkMsQ0FBQztJQUVNLHFCQUFxQixDQUFDLEdBQWE7UUFDeEMsTUFBTSxJQUFJLEdBQWEsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLGtCQUF1QixDQUFDO1FBQ2pDLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxXQUFXLENBQUM7UUFFOUIsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQ3RELE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDakgsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRTtnQkFDdkIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7YUFDckI7U0FDRjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUlNLHdCQUF3QixDQUFDLEdBQWE7UUFDM0MsTUFBTSxJQUFJLEdBQWEsR0FBRyxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLG9CQUF5QixDQUFDO1FBQ25DLElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLFdBQVcsQ0FBQztRQUUvQixNQUFNLElBQUksR0FBVyxZQUFZLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFaEYsS0FBSyxJQUFJLENBQUMsR0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1lBQ3RELE1BQU0sQ0FBQyxHQUFXLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRTVFLE1BQU0sRUFBRSxHQUFXLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUN0RyxNQUFNLEVBQUUsR0FBVyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDdEcsTUFBTSxDQUFDLEdBQVcsS0FBSyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVoQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNyQixlQUFlO2dCQUNmLElBQUksQ0FBQyxJQUFJLGtCQUF1QixDQUFDO2dCQUNqQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztnQkFDZixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQztnQkFDcEIsT0FBTyxJQUFJLENBQUM7YUFDYjtZQUVELFlBQVk7WUFDWixJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDOUIsSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRTtvQkFDbEcsU0FBUztpQkFDVjthQUNGO2lCQUFNO2dCQUNMLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUU7b0JBQ2xHLFNBQVM7aUJBQ1Y7YUFDRjtZQUVELElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUU7Z0JBQ3ZCLElBQUksQ0FBQyxJQUFJLGtCQUF1QixDQUFDO2dCQUNqQyxJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztnQkFDZixJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQzthQUNyQjtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDOztBQXJZYyxvQkFBTyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7QUFDdkIsb0JBQU8sR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ3ZCLG9CQUFPLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUN2QixpQkFBSSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDakMsaUJBQUksR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO0FBQzdCLDBCQUFhLEdBQUcsWUFBWSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMxQywwQkFBYSxHQUFHLFlBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsdUJBQVUsR0FBRyxJQUFJLFFBQVEsRUFBRSxDQUFDO0FBQzVCLDBCQUFhLEdBQUcsSUFBSSxRQUFRLEVBQUUsQ0FBQztBQWlWL0IsZ0JBQUcsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO0FBQ25CLG1CQUFNLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQThDdkMsTUFBTSxrQ0FBa0MsR0FBaUIsSUFBSSxZQUFZLEVBQUUsQ0FBQztBQUM1RSxNQUFNLFVBQVUsdUJBQXVCLENBQUMsUUFBb0IsRUFBRSxLQUFrQixFQUFFLEdBQWdCLEVBQUUsUUFBd0IsRUFBRSxHQUFnQjtJQUM1SSxNQUFNLFFBQVEsR0FBaUIsa0NBQWtDLENBQUM7SUFDbEUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDeEQsQ0FBQyJ9