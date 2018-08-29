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
// DEBUG: import { b2Assert } from "../../Common/b2Settings";
import { b2_pi, b2_epsilon } from "../../Common/b2Settings";
import { b2Sq, b2Sqrt, b2Asin, b2Pow, b2Vec2, b2Transform } from "../../Common/b2Math";
import { b2Shape, b2ShapeType } from "./b2Shape";
/// A circle shape.
export class b2CircleShape extends b2Shape {
    constructor(radius = 0) {
        super(b2ShapeType.e_circleShape, radius);
        this.m_p = new b2Vec2();
    }
    Set(position, radius = this.m_radius) {
        this.m_p.Copy(position);
        this.m_radius = radius;
        return this;
    }
    /// Implement b2Shape.
    Clone() {
        return new b2CircleShape().Copy(this);
    }
    Copy(other) {
        super.Copy(other);
        // DEBUG: b2Assert(other instanceof b2CircleShape);
        this.m_p.Copy(other.m_p);
        return this;
    }
    /// @see b2Shape::GetChildCount
    GetChildCount() {
        return 1;
    }
    TestPoint(transform, p) {
        const center = b2Transform.MulXV(transform, this.m_p, b2CircleShape.TestPoint_s_center);
        const d = b2Vec2.SubVV(p, center, b2CircleShape.TestPoint_s_d);
        return b2Vec2.DotVV(d, d) <= b2Sq(this.m_radius);
    }
    ComputeDistance(xf, p, normal, childIndex) {
        const center = b2Transform.MulXV(xf, this.m_p, b2CircleShape.ComputeDistance_s_center);
        b2Vec2.SubVV(p, center, normal);
        return normal.Normalize() - this.m_radius;
    }
    RayCast(output, input, transform, childIndex) {
        const position = b2Transform.MulXV(transform, this.m_p, b2CircleShape.RayCast_s_position);
        const s = b2Vec2.SubVV(input.p1, position, b2CircleShape.RayCast_s_s);
        const b = b2Vec2.DotVV(s, s) - b2Sq(this.m_radius);
        // Solve quadratic equation.
        const r = b2Vec2.SubVV(input.p2, input.p1, b2CircleShape.RayCast_s_r);
        const c = b2Vec2.DotVV(s, r);
        const rr = b2Vec2.DotVV(r, r);
        const sigma = c * c - rr * b;
        // Check for negative discriminant and short segment.
        if (sigma < 0 || rr < b2_epsilon) {
            return false;
        }
        // Find the point of intersection of the line with the circle.
        let a = (-(c + b2Sqrt(sigma)));
        // Is the intersection point on the segment?
        if (0 <= a && a <= input.maxFraction * rr) {
            a /= rr;
            output.fraction = a;
            b2Vec2.AddVMulSV(s, a, r, output.normal).SelfNormalize();
            return true;
        }
        return false;
    }
    ComputeAABB(aabb, transform, childIndex) {
        const p = b2Transform.MulXV(transform, this.m_p, b2CircleShape.ComputeAABB_s_p);
        aabb.lowerBound.Set(p.x - this.m_radius, p.y - this.m_radius);
        aabb.upperBound.Set(p.x + this.m_radius, p.y + this.m_radius);
    }
    /// @see b2Shape::ComputeMass
    ComputeMass(massData, density) {
        const radius_sq = b2Sq(this.m_radius);
        massData.mass = density * b2_pi * radius_sq;
        massData.center.Copy(this.m_p);
        // inertia about the local origin
        massData.I = massData.mass * (0.5 * radius_sq + b2Vec2.DotVV(this.m_p, this.m_p));
    }
    SetupDistanceProxy(proxy, index) {
        proxy.m_vertices = proxy.m_buffer;
        proxy.m_vertices[0].Copy(this.m_p);
        proxy.m_count = 1;
        proxy.m_radius = this.m_radius;
    }
    ComputeSubmergedArea(normal, offset, xf, c) {
        const p = b2Transform.MulXV(xf, this.m_p, new b2Vec2());
        const l = (-(b2Vec2.DotVV(normal, p) - offset));
        if (l < (-this.m_radius) + b2_epsilon) {
            // Completely dry
            return 0;
        }
        if (l > this.m_radius) {
            // Completely wet
            c.Copy(p);
            return b2_pi * this.m_radius * this.m_radius;
        }
        // Magic
        const r2 = this.m_radius * this.m_radius;
        const l2 = l * l;
        const area = r2 * (b2Asin(l / this.m_radius) + b2_pi / 2) + l * b2Sqrt(r2 - l2);
        const com = (-2 / 3 * b2Pow(r2 - l2, 1.5) / area);
        c.x = p.x + normal.x * com;
        c.y = p.y + normal.y * com;
        return area;
    }
    Dump(log) {
        log("    const shape: b2CircleShape = new b2CircleShape();\n");
        log("    shape.m_radius = %.15f;\n", this.m_radius);
        log("    shape.m_p.Set(%.15f, %.15f);\n", this.m_p.x, this.m_p.y);
    }
}
/// Implement b2Shape.
b2CircleShape.TestPoint_s_center = new b2Vec2();
b2CircleShape.TestPoint_s_d = new b2Vec2();
// #if B2_ENABLE_PARTICLE
/// @see b2Shape::ComputeDistance
b2CircleShape.ComputeDistance_s_center = new b2Vec2();
// #endif
/// Implement b2Shape.
// Collision Detection in Interactive 3D Environments by Gino van den Bergen
// From Section 3.1.2
// x = s + a * r
// norm(x) = radius
b2CircleShape.RayCast_s_position = new b2Vec2();
b2CircleShape.RayCast_s_s = new b2Vec2();
b2CircleShape.RayCast_s_r = new b2Vec2();
/// @see b2Shape::ComputeAABB
b2CircleShape.ComputeAABB_s_p = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDaXJjbGVTaGFwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0NvbGxpc2lvbi9TaGFwZXMvYjJDaXJjbGVTaGFwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLDZEQUE2RDtBQUM3RCxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQzVELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBTSxNQUFNLHFCQUFxQixDQUFDO0FBSTNGLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sV0FBVyxDQUFDO0FBRWpELG1CQUFtQjtBQUNuQixNQUFNLE9BQU8sYUFBYyxTQUFRLE9BQU87SUFHeEMsWUFBWSxTQUFpQixDQUFDO1FBQzVCLEtBQUssQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBSDNCLFFBQUcsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO0lBSTNDLENBQUM7SUFFTSxHQUFHLENBQUMsUUFBWSxFQUFFLFNBQWlCLElBQUksQ0FBQyxRQUFRO1FBQ3JELElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3hCLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO1FBQ3ZCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELHNCQUFzQjtJQUNmLEtBQUs7UUFDVixPQUFPLElBQUksYUFBYSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFTSxJQUFJLENBQUMsS0FBb0I7UUFDOUIsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVsQixtREFBbUQ7UUFFbkQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENB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