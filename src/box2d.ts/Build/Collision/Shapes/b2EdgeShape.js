/*
* Copyright (c) 2006-2010 Erin Catto http://www.box2d.org
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
import { b2_polygonRadius } from "../../Common/b2Settings";
import { b2Vec2, b2Rot, b2Transform } from "../../Common/b2Math";
import { b2Shape, b2ShapeType } from "./b2Shape";
/// A line segment (edge) shape. These can be connected in chains or loops
/// to other edge shapes. The connectivity information is used to ensure
/// correct contact normals.
export class b2EdgeShape extends b2Shape {
    constructor() {
        super(b2ShapeType.e_edgeShape, b2_polygonRadius);
        this.m_vertex1 = new b2Vec2();
        this.m_vertex2 = new b2Vec2();
        this.m_vertex0 = new b2Vec2();
        this.m_vertex3 = new b2Vec2();
        this.m_hasVertex0 = false;
        this.m_hasVertex3 = false;
    }
    /// Set this as an isolated edge.
    Set(v1, v2) {
        this.m_vertex1.Copy(v1);
        this.m_vertex2.Copy(v2);
        this.m_hasVertex0 = false;
        this.m_hasVertex3 = false;
        return this;
    }
    /// Implement b2Shape.
    Clone() {
        return new b2EdgeShape().Copy(this);
    }
    Copy(other) {
        super.Copy(other);
        // DEBUG: b2Assert(other instanceof b2EdgeShape);
        this.m_vertex1.Copy(other.m_vertex1);
        this.m_vertex2.Copy(other.m_vertex2);
        this.m_vertex0.Copy(other.m_vertex0);
        this.m_vertex3.Copy(other.m_vertex3);
        this.m_hasVertex0 = other.m_hasVertex0;
        this.m_hasVertex3 = other.m_hasVertex3;
        return this;
    }
    /// @see b2Shape::GetChildCount
    GetChildCount() {
        return 1;
    }
    /// @see b2Shape::TestPoint
    TestPoint(xf, p) {
        return false;
    }
    ComputeDistance(xf, p, normal, childIndex) {
        const v1 = b2Transform.MulXV(xf, this.m_vertex1, b2EdgeShape.ComputeDistance_s_v1);
        const v2 = b2Transform.MulXV(xf, this.m_vertex2, b2EdgeShape.ComputeDistance_s_v2);
        const d = b2Vec2.SubVV(p, v1, b2EdgeShape.ComputeDistance_s_d);
        const s = b2Vec2.SubVV(v2, v1, b2EdgeShape.ComputeDistance_s_s);
        const ds = b2Vec2.DotVV(d, s);
        if (ds > 0) {
            const s2 = b2Vec2.DotVV(s, s);
            if (ds > s2) {
                b2Vec2.SubVV(p, v2, d);
            }
            else {
                d.SelfMulSub(ds / s2, s);
            }
        }
        normal.Copy(d);
        return normal.Normalize();
    }
    RayCast(output, input, xf, childIndex) {
        // Put the ray into the edge's frame of reference.
        const p1 = b2Transform.MulTXV(xf, input.p1, b2EdgeShape.RayCast_s_p1);
        const p2 = b2Transform.MulTXV(xf, input.p2, b2EdgeShape.RayCast_s_p2);
        const d = b2Vec2.SubVV(p2, p1, b2EdgeShape.RayCast_s_d);
        const v1 = this.m_vertex1;
        const v2 = this.m_vertex2;
        const e = b2Vec2.SubVV(v2, v1, b2EdgeShape.RayCast_s_e);
        const normal = output.normal.Set(e.y, -e.x).SelfNormalize();
        // q = p1 + t * d
        // dot(normal, q - v1) = 0
        // dot(normal, p1 - v1) + t * dot(normal, d) = 0
        const numerator = b2Vec2.DotVV(normal, b2Vec2.SubVV(v1, p1, b2Vec2.s_t0));
        const denominator = b2Vec2.DotVV(normal, d);
        if (denominator === 0) {
            return false;
        }
        const t = numerator / denominator;
        if (t < 0 || input.maxFraction < t) {
            return false;
        }
        const q = b2Vec2.AddVMulSV(p1, t, d, b2EdgeShape.RayCast_s_q);
        // q = v1 + s * r
        // s = dot(q - v1, r) / dot(r, r)
        const r = b2Vec2.SubVV(v2, v1, b2EdgeShape.RayCast_s_r);
        const rr = b2Vec2.DotVV(r, r);
        if (rr === 0) {
            return false;
        }
        const s = b2Vec2.DotVV(b2Vec2.SubVV(q, v1, b2Vec2.s_t0), r) / rr;
        if (s < 0 || 1 < s) {
            return false;
        }
        output.fraction = t;
        b2Rot.MulRV(xf.q, output.normal, output.normal);
        if (numerator > 0) {
            output.normal.SelfNeg();
        }
        return true;
    }
    ComputeAABB(aabb, xf, childIndex) {
        const v1 = b2Transform.MulXV(xf, this.m_vertex1, b2EdgeShape.ComputeAABB_s_v1);
        const v2 = b2Transform.MulXV(xf, this.m_vertex2, b2EdgeShape.ComputeAABB_s_v2);
        b2Vec2.MinV(v1, v2, aabb.lowerBound);
        b2Vec2.MaxV(v1, v2, aabb.upperBound);
        const r = this.m_radius;
        aabb.lowerBound.SelfSubXY(r, r);
        aabb.upperBound.SelfAddXY(r, r);
    }
    /// @see b2Shape::ComputeMass
    ComputeMass(massData, density) {
        massData.mass = 0;
        b2Vec2.MidVV(this.m_vertex1, this.m_vertex2, massData.center);
        massData.I = 0;
    }
    SetupDistanceProxy(proxy, index) {
        proxy.m_vertices = proxy.m_buffer;
        proxy.m_vertices[0].Copy(this.m_vertex1);
        proxy.m_vertices[1].Copy(this.m_vertex2);
        proxy.m_count = 2;
        proxy.m_radius = this.m_radius;
    }
    ComputeSubmergedArea(normal, offset, xf, c) {
        c.SetZero();
        return 0;
    }
    Dump(log) {
        log("    const shape: b2EdgeShape = new b2EdgeShape();\n");
        log("    shape.m_radius = %.15f;\n", this.m_radius);
        log("    shape.m_vertex0.Set(%.15f, %.15f);\n", this.m_vertex0.x, this.m_vertex0.y);
        log("    shape.m_vertex1.Set(%.15f, %.15f);\n", this.m_vertex1.x, this.m_vertex1.y);
        log("    shape.m_vertex2.Set(%.15f, %.15f);\n", this.m_vertex2.x, this.m_vertex2.y);
        log("    shape.m_vertex3.Set(%.15f, %.15f);\n", this.m_vertex3.x, this.m_vertex3.y);
        log("    shape.m_hasVertex0 = %s;\n", this.m_hasVertex0);
        log("    shape.m_hasVertex3 = %s;\n", this.m_hasVertex3);
    }
}
// #if B2_ENABLE_PARTICLE
/// @see b2Shape::ComputeDistance
b2EdgeShape.ComputeDistance_s_v1 = new b2Vec2();
b2EdgeShape.ComputeDistance_s_v2 = new b2Vec2();
b2EdgeShape.ComputeDistance_s_d = new b2Vec2();
b2EdgeShape.ComputeDistance_s_s = new b2Vec2();
// #endif
/// Implement b2Shape.
// p = p1 + t * d
// v = v1 + s * e
// p1 + t * d = v1 + s * e
// s * e - t * d = p1 - v1
b2EdgeShape.RayCast_s_p1 = new b2Vec2();
b2EdgeShape.RayCast_s_p2 = new b2Vec2();
b2EdgeShape.RayCast_s_d = new b2Vec2();
b2EdgeShape.RayCast_s_e = new b2Vec2();
b2EdgeShape.RayCast_s_q = new b2Vec2();
b2EdgeShape.RayCast_s_r = new b2Vec2();
/// @see b2Shape::ComputeAABB
b2EdgeShape.ComputeAABB_s_v1 = new b2Vec2();
b2EdgeShape.ComputeAABB_s_v2 = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJFZGdlU2hhcGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9Cb3gyRC9Db2xsaXNpb24vU2hhcGVzL2IyRWRnZVNoYXBlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsNkRBQTZEO0FBQzdELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzNELE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBTSxNQUFNLHFCQUFxQixDQUFDO0FBSXJFLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRWpELDBFQUEwRTtBQUMxRSx3RUFBd0U7QUFDeEUsNEJBQTRCO0FBQzVCLE1BQU0sT0FBTyxXQUFZLFNBQVEsT0FBTztJQVF0QztRQUNFLEtBQUssQ0FBQyxXQUFXLENBQUMsV0FBVyxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFSbkMsY0FBUyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDakMsY0FBUyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDakMsY0FBUyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDakMsY0FBUyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDMUMsaUJBQVksR0FBWSxLQUFLLENBQUM7UUFDOUIsaUJBQVksR0FBWSxLQUFLLENBQUM7SUFJckMsQ0FBQztJQUVELGlDQUFpQztJQUMxQixHQUFHLENBQUMsRUFBTSxFQUFFLEVBQU07UUFDdkIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDMUIsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDMUIsT0FBTyxJ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