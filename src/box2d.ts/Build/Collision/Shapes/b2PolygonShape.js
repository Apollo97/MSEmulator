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
// DEBUG: import { b2Assert, b2_epsilon_sq } from "../../Common/b2Settings";
import { b2_epsilon, b2_maxFloat, b2_linearSlop, b2_polygonRadius } from "../../Common/b2Settings";
import { b2Vec2, b2Rot, b2Transform } from "../../Common/b2Math";
import { b2MassData } from "./b2Shape";
import { b2Shape, b2ShapeType } from "./b2Shape";
/// A convex polygon. It is assumed that the interior of the polygon is to
/// the left of each edge.
/// In most cases you should not need many vertices for a convex polygon.
export class b2PolygonShape extends b2Shape {
    constructor() {
        super(b2ShapeType.e_polygonShape, b2_polygonRadius);
        this.m_centroid = new b2Vec2(0, 0);
        this.m_vertices = [];
        this.m_normals = [];
        this.m_count = 0;
    }
    /// Implement b2Shape.
    Clone() {
        return new b2PolygonShape().Copy(this);
    }
    Copy(other) {
        super.Copy(other);
        // DEBUG: b2Assert(other instanceof b2PolygonShape);
        this.m_centroid.Copy(other.m_centroid);
        this.m_count = other.m_count;
        this.m_vertices = b2Vec2.MakeArray(this.m_count);
        this.m_normals = b2Vec2.MakeArray(this.m_count);
        for (let i = 0; i < this.m_count; ++i) {
            this.m_vertices[i].Copy(other.m_vertices[i]);
            this.m_normals[i].Copy(other.m_normals[i]);
        }
        return this;
    }
    /// @see b2Shape::GetChildCount
    GetChildCount() {
        return 1;
    }
    Set(vertices, count = vertices.length, start = 0) {
        // DEBUG: b2Assert(3 <= count);
        if (count < 3) {
            return this.SetAsBox(1, 1);
        }
        let n = count;
        // Perform welding and copy vertices into local buffer.
        const ps = [];
        for (let i = 0; i < n; ++i) {
            const /*b2Vec2*/ v = vertices[start + i];
            let /*bool*/ unique = true;
            for (let /*int32*/ j = 0; j < ps.length; ++j) {
                if (b2Vec2.DistanceSquaredVV(v, ps[j]) < ((0.5 * b2_linearSlop) * (0.5 * b2_linearSlop))) {
                    unique = false;
                    break;
                }
            }
            if (unique) {
                ps.push(v);
            }
        }
        n = ps.length;
        if (n < 3) {
            // Polygon is degenerate.
            // DEBUG: b2Assert(false);
            return this.SetAsBox(1.0, 1.0);
        }
        // Create the convex hull using the Gift wrapping algorithm
        // http://en.wikipedia.org/wiki/Gift_wrapping_algorithm
        // Find the right most point on the hull
        let i0 = 0;
        let x0 = ps[0].x;
        for (let i = 1; i < n; ++i) {
            const x = ps[i].x;
            if (x > x0 || (x === x0 && ps[i].y < ps[i0].y)) {
                i0 = i;
                x0 = x;
            }
        }
        const hull = [];
        let m = 0;
        let ih = i0;
        for (;;) {
            hull[m] = ih;
            let ie = 0;
            for (let j = 1; j < n; ++j) {
                if (ie === ih) {
                    ie = j;
                    continue;
                }
                const r = b2Vec2.SubVV(ps[ie], ps[hull[m]], b2PolygonShape.Set_s_r);
                const v = b2Vec2.SubVV(ps[j], ps[hull[m]], b2PolygonShape.Set_s_v);
                const c = b2Vec2.CrossVV(r, v);
                if (c < 0) {
                    ie = j;
                }
                // Collinearity check
                if (c === 0 && v.LengthSquared() > r.LengthSquared()) {
                    ie = j;
                }
            }
            ++m;
            ih = ie;
            if (ie === i0) {
                break;
            }
        }
        this.m_count = m;
        this.m_vertices = b2Vec2.MakeArray(this.m_count);
        this.m_normals = b2Vec2.MakeArray(this.m_count);
        // Copy vertices.
        for (let i = 0; i < m; ++i) {
            this.m_vertices[i].Copy(ps[hull[i]]);
        }
        // Compute normals. Ensure the edges have non-zero length.
        for (let i = 0; i < m; ++i) {
            const vertexi1 = this.m_vertices[i];
            const vertexi2 = this.m_vertices[(i + 1) % m];
            const edge = b2Vec2.SubVV(vertexi2, vertexi1, b2Vec2.s_t0); // edge uses s_t0
            // DEBUG: b2Assert(edge.LengthSquared() > b2_epsilon_sq);
            b2Vec2.CrossVOne(edge, this.m_normals[i]).SelfNormalize();
        }
        // Compute the polygon centroid.
        b2PolygonShape.ComputeCentroid(this.m_vertices, m, this.m_centroid);
        return this;
    }
    SetAsArray(vertices, count = vertices.length) {
        return this.Set(vertices, count);
    }
    /// Build vertices to represent an axis-aligned box or an oriented box.
    /// @param hx the half-width.
    /// @param hy the half-height.
    /// @param center the center of the box in local coordinates.
    /// @param angle the rotation of the box in local coordinates.
    SetAsBox(hx, hy, center, angle = 0) {
        this.m_count = 4;
        this.m_vertices = b2Vec2.MakeArray(this.m_count);
        this.m_normals = b2Vec2.MakeArray(this.m_count);
        this.m_vertices[0].Set((-hx), (-hy));
        this.m_vertices[1].Set(hx, (-hy));
        this.m_vertices[2].Set(hx, hy);
        this.m_vertices[3].Set((-hx), hy);
        this.m_normals[0].Set(0, (-1));
        this.m_normals[1].Set(1, 0);
        this.m_normals[2].Set(0, 1);
        this.m_normals[3].Set((-1), 0);
        this.m_centroid.SetZero();
        if (center) {
            this.m_centroid.Copy(center);
            const xf = new b2Transform();
            xf.SetPosition(center);
            xf.SetRotationAngle(angle);
            // Transform vertices and normals.
            for (let i = 0; i < this.m_count; ++i) {
                b2Transform.MulXV(xf, this.m_vertices[i], this.m_vertices[i]);
                b2Rot.MulRV(xf.q, this.m_normals[i], this.m_normals[i]);
            }
        }
        return this;
    }
    TestPoint(xf, p) {
        const pLocal = b2Transform.MulTXV(xf, p, b2PolygonShape.TestPoint_s_pLocal);
        for (let i = 0; i < this.m_count; ++i) {
            const dot = b2Vec2.DotVV(this.m_normals[i], b2Vec2.SubVV(pLocal, this.m_vertices[i], b2Vec2.s_t0));
            if (dot > 0) {
                return false;
            }
        }
        return true;
    }
    ComputeDistance(xf, p, normal, childIndex) {
        const pLocal = b2Transform.MulTXV(xf, p, b2PolygonShape.ComputeDistance_s_pLocal);
        let maxDistance = -b2_maxFloat;
        const normalForMaxDistance = b2PolygonShape.ComputeDistance_s_normalForMaxDistance.Copy(pLocal);
        for (let i = 0; i < this.m_count; ++i) {
            const dot = b2Vec2.DotVV(this.m_normals[i], b2Vec2.SubVV(pLocal, this.m_vertices[i], b2Vec2.s_t0));
            if (dot > maxDistance) {
                maxDistance = dot;
                normalForMaxDistance.Copy(this.m_normals[i]);
            }
        }
        if (maxDistance > 0) {
            const minDistance = b2PolygonShape.ComputeDistance_s_minDistance.Copy(normalForMaxDistance);
            let minDistance2 = maxDistance * maxDistance;
            for (let i = 0; i < this.m_count; ++i) {
                const distance = b2Vec2.SubVV(pLocal, this.m_vertices[i], b2PolygonShape.ComputeDistance_s_distance);
                const distance2 = distance.LengthSquared();
                if (minDistance2 > distance2) {
                    minDistance.Copy(distance);
                    minDistance2 = distance2;
                }
            }
            b2Rot.MulRV(xf.q, minDistance, normal);
            normal.Normalize();
            return Math.sqrt(minDistance2);
        }
        else {
            b2Rot.MulRV(xf.q, normalForMaxDistance, normal);
            return maxDistance;
        }
    }
    RayCast(output, input, xf, childIndex) {
        // Put the ray into the polygon's frame of reference.
        const p1 = b2Transform.MulTXV(xf, input.p1, b2PolygonShape.RayCast_s_p1);
        const p2 = b2Transform.MulTXV(xf, input.p2, b2PolygonShape.RayCast_s_p2);
        const d = b2Vec2.SubVV(p2, p1, b2PolygonShape.RayCast_s_d);
        let lower = 0, upper = input.maxFraction;
        let index = -1;
        for (let i = 0; i < this.m_count; ++i) {
            // p = p1 + a * d
            // dot(normal, p - v) = 0
            // dot(normal, p1 - v) + a * dot(normal, d) = 0
            const numerator = b2Vec2.DotVV(this.m_normals[i], b2Vec2.SubVV(this.m_vertices[i], p1, b2Vec2.s_t0));
            const denominator = b2Vec2.DotVV(this.m_normals[i], d);
            if (denominator === 0) {
                if (numerator < 0) {
                    return false;
                }
            }
            else {
                // Note: we want this predicate without division:
                // lower < numerator / denominator, where denominator < 0
                // Since denominator < 0, we have to flip the inequality:
                // lower < numerator / denominator <==> denominator * lower > numerator.
                if (denominator < 0 && numerator < lower * denominator) {
                    // Increase lower.
                    // The segment enters this half-space.
                    lower = numerator / denominator;
                    index = i;
                }
                else if (denominator > 0 && numerator < upper * denominator) {
                    // Decrease upper.
                    // The segment exits this half-space.
                    upper = numerator / denominator;
                }
            }
            // The use of epsilon here causes the assert on lower to trip
            // in some cases. Apparently the use of epsilon was to make edge
            // shapes work, but now those are handled separately.
            // if (upper < lower - b2_epsilon)
            if (upper < lower) {
                return false;
            }
        }
        // DEBUG: b2Assert(0 <= lower && lower <= input.maxFraction);
        if (index >= 0) {
            output.fraction = lower;
            b2Rot.MulRV(xf.q, this.m_normals[index], output.normal);
            return true;
        }
        return false;
    }
    ComputeAABB(aabb, xf, childIndex) {
        const lower = b2Transform.MulXV(xf, this.m_vertices[0], aabb.lowerBound);
        const upper = aabb.upperBound.Copy(lower);
        for (let i = 0; i < this.m_count; ++i) {
            const v = b2Transform.MulXV(xf, this.m_vertices[i], b2PolygonShape.ComputeAABB_s_v);
            b2Vec2.MinV(v, lower, lower);
            b2Vec2.MaxV(v, upper, upper);
        }
        const r = this.m_radius;
        lower.SelfSubXY(r, r);
        upper.SelfAddXY(r, r);
    }
    ComputeMass(massData, density) {
        // Polygon mass, centroid, and inertia.
        // Let rho be the polygon density in mass per unit area.
        // Then:
        // mass = rho * int(dA)
        // centroid.x = (1/mass) * rho * int(x * dA)
        // centroid.y = (1/mass) * rho * int(y * dA)
        // I = rho * int((x*x + y*y) * dA)
        //
        // We can compute these integrals by summing all the integrals
        // for each triangle of the polygon. To evaluate the integral
        // for a single triangle, we make a change of variables to
        // the (u,v) coordinates of the triangle:
        // x = x0 + e1x * u + e2x * v
        // y = y0 + e1y * u + e2y * v
        // where 0 <= u && 0 <= v && u + v <= 1.
        //
        // We integrate u from [0,1-v] and then v from [0,1].
        // We also need to use the Jacobian of the transformation:
        // D = cross(e1, e2)
        //
        // Simplification: triangle centroid = (1/3) * (p1 + p2 + p3)
        //
        // The rest of the derivation is handled by computer algebra.
        // DEBUG: b2Assert(this.m_count >= 3);
        const center = b2PolygonShape.ComputeMass_s_center.SetZero();
        let area = 0;
        let I = 0;
        // s is the reference point for forming triangles.
        // It's location doesn't change the result (except for rounding error).
        const s = b2PolygonShape.ComputeMass_s_s.SetZero();
        // This code would put the reference point inside the polygon.
        for (let i = 0; i < this.m_count; ++i) {
            s.SelfAdd(this.m_vertices[i]);
        }
        s.SelfMul(1 / this.m_count);
        const k_inv3 = 1 / 3;
        for (let i = 0; i < this.m_count; ++i) {
            // Triangle vertices.
            const e1 = b2Vec2.SubVV(this.m_vertices[i], s, b2PolygonShape.ComputeMass_s_e1);
            const e2 = b2Vec2.SubVV(this.m_vertices[(i + 1) % this.m_count], s, b2PolygonShape.ComputeMass_s_e2);
            const D = b2Vec2.CrossVV(e1, e2);
            const triangleArea = 0.5 * D;
            area += triangleArea;
            // Area weighted centroid
            center.SelfAdd(b2Vec2.MulSV(triangleArea * k_inv3, b2Vec2.AddVV(e1, e2, b2Vec2.s_t0), b2Vec2.s_t1));
            const ex1 = e1.x;
            const ey1 = e1.y;
            const ex2 = e2.x;
            const ey2 = e2.y;
            const intx2 = ex1 * ex1 + ex2 * ex1 + ex2 * ex2;
            const inty2 = ey1 * ey1 + ey2 * ey1 + ey2 * ey2;
            I += (0.25 * k_inv3 * D) * (intx2 + inty2);
        }
        // Total mass
        massData.mass = density * area;
        // Center of mass
        // DEBUG: b2Assert(area > b2_epsilon);
        center.SelfMul(1 / area);
        b2Vec2.AddVV(center, s, massData.center);
        // Inertia tensor relative to the local origin (point s).
        massData.I = density * I;
        // Shift to center of mass then to original body origin.
        massData.I += massData.mass * (b2Vec2.DotVV(massData.center, massData.center) - b2Vec2.DotVV(center, center));
    }
    Validate() {
        for (let i = 0; i < this.m_count; ++i) {
            const i1 = i;
            const i2 = (i + 1) % this.m_count;
            const p = this.m_vertices[i1];
            const e = b2Vec2.SubVV(this.m_vertices[i2], p, b2PolygonShape.Validate_s_e);
            for (let j = 0; j < this.m_count; ++j) {
                if (j === i1 || j === i2) {
                    continue;
                }
                const v = b2Vec2.SubVV(this.m_vertices[j], p, b2PolygonShape.Validate_s_v);
                const c = b2Vec2.CrossVV(e, v);
                if (c < 0) {
                    return false;
                }
            }
        }
        return true;
    }
    SetupDistanceProxy(proxy, index) {
        proxy.m_vertices = this.m_vertices;
        proxy.m_count = this.m_count;
        proxy.m_radius = this.m_radius;
    }
    ComputeSubmergedArea(normal, offset, xf, c) {
        // Transform plane into shape co-ordinates
        const normalL = b2Rot.MulTRV(xf.q, normal, b2PolygonShape.ComputeSubmergedArea_s_normalL);
        const offsetL = offset - b2Vec2.DotVV(normal, xf.p);
        const depths = [];
        let diveCount = 0;
        let intoIndex = -1;
        let outoIndex = -1;
        let lastSubmerged = false;
        for (let i = 0; i < this.m_count; ++i) {
            depths[i] = b2Vec2.DotVV(normalL, this.m_vertices[i]) - offsetL;
            const isSubmerged = depths[i] < (-b2_epsilon);
            if (i > 0) {
                if (isSubmerged) {
                    if (!lastSubmerged) {
                        intoIndex = i - 1;
                        diveCount++;
                    }
                }
                else {
                    if (lastSubmerged) {
                        outoIndex = i - 1;
                        diveCount++;
                    }
                }
            }
            lastSubmerged = isSubmerged;
        }
        switch (diveCount) {
            case 0:
                if (lastSubmerged) {
                    // Completely submerged
                    const md = b2PolygonShape.ComputeSubmergedArea_s_md;
                    this.ComputeMass(md, 1);
                    b2Transform.MulXV(xf, md.center, c);
                    return md.mass;
                }
                else {
                    // Completely dry
                    return 0;
                }
            case 1:
                if (intoIndex === (-1)) {
                    intoIndex = this.m_count - 1;
                }
                else {
                    outoIndex = this.m_count - 1;
                }
                break;
        }
        const intoIndex2 = ((intoIndex + 1) % this.m_count);
        const outoIndex2 = ((outoIndex + 1) % this.m_count);
        const intoLamdda = (0 - depths[intoIndex]) / (depths[intoIndex2] - depths[intoIndex]);
        const outoLamdda = (0 - depths[outoIndex]) / (depths[outoIndex2] - depths[outoIndex]);
        const intoVec = b2PolygonShape.ComputeSubmergedArea_s_intoVec.Set(this.m_vertices[intoIndex].x * (1 - intoLamdda) + this.m_vertices[intoIndex2].x * intoLamdda, this.m_vertices[intoIndex].y * (1 - intoLamdda) + this.m_vertices[intoIndex2].y * intoLamdda);
        const outoVec = b2PolygonShape.ComputeSubmergedArea_s_outoVec.Set(this.m_vertices[outoIndex].x * (1 - outoLamdda) + this.m_vertices[outoIndex2].x * outoLamdda, this.m_vertices[outoIndex].y * (1 - outoLamdda) + this.m_vertices[outoIndex2].y * outoLamdda);
        // Initialize accumulator
        let area = 0;
        const center = b2PolygonShape.ComputeSubmergedArea_s_center.SetZero();
        let p2 = this.m_vertices[intoIndex2];
        let p3;
        // An awkward loop from intoIndex2+1 to outIndex2
        let i = intoIndex2;
        while (i !== outoIndex2) {
            i = (i + 1) % this.m_count;
            if (i === outoIndex2) {
                p3 = outoVec;
            }
            else {
                p3 = this.m_vertices[i];
            }
            const triangleArea = 0.5 * ((p2.x - intoVec.x) * (p3.y - intoVec.y) - (p2.y - intoVec.y) * (p3.x - intoVec.x));
            area += triangleArea;
            // Area weighted centroid
            center.x += triangleArea * (intoVec.x + p2.x + p3.x) / 3;
            center.y += triangleArea * (intoVec.y + p2.y + p3.y) / 3;
            p2 = p3;
        }
        // Normalize and transform centroid
        center.SelfMul(1 / area);
        b2Transform.MulXV(xf, center, c);
        return area;
    }
    Dump(log) {
        log("    const shape: b2PolygonShape = new b2PolygonShape();\n");
        log("    const vs: b2Vec2[] = [];\n");
        for (let i = 0; i < this.m_count; ++i) {
            log("    vs[%d] = new b2Vec2(%.15f, %.15f);\n", i, this.m_vertices[i].x, this.m_vertices[i].y);
        }
        log("    shape.Set(vs, %d);\n", this.m_count);
    }
    static ComputeCentroid(vs, count, out) {
        // DEBUG: b2Assert(count >= 3);
        const c = out;
        c.SetZero();
        let area = 0;
        // s is the reference point for forming triangles.
        // It's location doesn't change the result (except for rounding error).
        const pRef = b2PolygonShape.ComputeCentroid_s_pRef.SetZero();
        /*
    #if 0
        // This code would put the reference point inside the polygon.
        for (let i: number = 0; i < count; ++i) {
          pRef.SelfAdd(vs[i]);
        }
        pRef.SelfMul(1 / count);
    #endif
        */
        const inv3 = 1 / 3;
        for (let i = 0; i < count; ++i) {
            // Triangle vertices.
            const p1 = pRef;
            const p2 = vs[i];
            const p3 = vs[(i + 1) % count];
            const e1 = b2Vec2.SubVV(p2, p1, b2PolygonShape.ComputeCentroid_s_e1);
            const e2 = b2Vec2.SubVV(p3, p1, b2PolygonShape.ComputeCentroid_s_e2);
            const D = b2Vec2.CrossVV(e1, e2);
            const triangleArea = 0.5 * D;
            area += triangleArea;
            // Area weighted centroid
            c.x += triangleArea * inv3 * (p1.x + p2.x + p3.x);
            c.y += triangleArea * inv3 * (p1.y + p2.y + p3.y);
        }
        // Centroid
        // DEBUG: b2Assert(area > b2_epsilon);
        c.SelfMul(1 / area);
        return c;
    }
}
/// Create a convex hull from the given array of points.
/// @warning the points may be re-ordered, even if they form a convex polygon
/// @warning collinear points are handled but not removed. Collinear points
/// may lead to poor stacking behavior.
b2PolygonShape.Set_s_r = new b2Vec2();
b2PolygonShape.Set_s_v = new b2Vec2();
/// @see b2Shape::TestPoint
b2PolygonShape.TestPoint_s_pLocal = new b2Vec2();
// #if B2_ENABLE_PARTICLE
/// @see b2Shape::ComputeDistance
b2PolygonShape.ComputeDistance_s_pLocal = new b2Vec2();
b2PolygonShape.ComputeDistance_s_normalForMaxDistance = new b2Vec2();
b2PolygonShape.ComputeDistance_s_minDistance = new b2Vec2();
b2PolygonShape.ComputeDistance_s_distance = new b2Vec2();
// #endif
/// Implement b2Shape.
b2PolygonShape.RayCast_s_p1 = new b2Vec2();
b2PolygonShape.RayCast_s_p2 = new b2Vec2();
b2PolygonShape.RayCast_s_d = new b2Vec2();
/// @see b2Shape::ComputeAABB
b2PolygonShape.ComputeAABB_s_v = new b2Vec2();
/// @see b2Shape::ComputeMass
b2PolygonShape.ComputeMass_s_center = new b2Vec2();
b2PolygonShape.ComputeMass_s_s = new b2Vec2();
b2PolygonShape.ComputeMass_s_e1 = new b2Vec2();
b2PolygonShape.ComputeMass_s_e2 = new b2Vec2();
b2PolygonShape.Validate_s_e = new b2Vec2();
b2PolygonShape.Validate_s_v = new b2Vec2();
b2PolygonShape.ComputeSubmergedArea_s_normalL = new b2Vec2();
b2PolygonShape.ComputeSubmergedArea_s_md = new b2MassData();
b2PolygonShape.ComputeSubmergedArea_s_intoVec = new b2Vec2();
b2PolygonShape.ComputeSubmergedArea_s_outoVec = new b2Vec2();
b2PolygonShape.ComputeSubmergedArea_s_center = new b2Vec2();
b2PolygonShape.ComputeCentroid_s_pRef = new b2Vec2();
b2PolygonShape.ComputeCentroid_s_e1 = new b2Vec2();
b2PolygonShape.ComputeCentroid_s_e2 = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJQb2x5Z29uU2hhcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9Cb3gyRC9Db2xsaXNpb24vU2hhcGVzL2IyUG9seWdvblNoYXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsNEVBQTRFO0FBQzVFLE9BQU8sRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ25HLE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBTSxNQUFNLHFCQUFxQixDQUFDO0FBR3JFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFFakQsMEVBQTBFO0FBQzFFLDBCQUEwQjtBQUMxQix5RUFBeUU7QUFDekUsTUFBTSxPQUFPLGNBQWUsU0FBUSxPQUFPO0lBTXpDO1FBQ0UsS0FBSyxDQUFDLFdBQVcsQ0FBQyxjQUFjLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQU50QyxlQUFVLEdBQVcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQy9DLGVBQVUsR0FBYSxFQUFFLENBQUM7UUFDMUIsY0FBUyxHQUFhLEVBQUUsQ0FBQztRQUN6QixZQUFPLEdBQVcsQ0FBQyxDQUFDO0lBSTNCLENBQUM7SUFFRCxzQkFBc0I7SUFDZixLQUFLO1FBQ1YsT0FBTyxJQUFJLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBRU0sSUFBSSxDQUFDLEtBQXFCO1FBQy9CLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbEIsb0RBQW9EO1FBRXBELElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENB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