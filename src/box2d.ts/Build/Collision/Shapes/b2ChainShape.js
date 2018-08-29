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
// DEBUG: import { b2Assert, b2_linearSlop } from "../../Common/b2Settings";
import { b2_polygonRadius } from "../../Common/b2Settings";
import { b2Vec2, b2Transform } from "../../Common/b2Math";
import { b2Shape, b2ShapeType } from "./b2Shape";
import { b2EdgeShape } from "./b2EdgeShape";
/// A chain shape is a free form sequence of line segments.
/// The chain has two-sided collision, so you can use inside and outside collision.
/// Therefore, you may use any winding order.
/// Since there may be many vertices, they are allocated using b2Alloc.
/// Connectivity information is used to create smooth collisions.
/// WARNING: The chain will not collide properly if there are self-intersections.
export class b2ChainShape extends b2Shape {
    constructor() {
        super(b2ShapeType.e_chainShape, b2_polygonRadius);
        this.m_vertices = [];
        this.m_count = 0;
        this.m_prevVertex = new b2Vec2();
        this.m_nextVertex = new b2Vec2();
        this.m_hasPrevVertex = false;
        this.m_hasNextVertex = false;
    }
    /// Create a loop. This automatically adjusts connectivity.
    /// @param vertices an array of vertices, these are copied
    /// @param count the vertex count
    CreateLoop(vertices, count = vertices.length, start = 0) {
        // DEBUG: b2Assert(count >= 3);
        if (count < 3) {
            return this;
        }
        // DEBUG: for (let i: number = 1; i < count; ++i) {
        // DEBUG:   const v1 = vertices[start + i - 1];
        // DEBUG:   const v2 = vertices[start + i];
        // DEBUG:   // If the code crashes here, it means your vertices are too close together.
        // DEBUG:   b2Assert(b2Vec2.DistanceSquaredVV(v1, v2) > b2_linearSlop * b2_linearSlop);
        // DEBUG: }
        this.m_count = count + 1;
        this.m_vertices = b2Vec2.MakeArray(this.m_count);
        for (let i = 0; i < count; ++i) {
            this.m_vertices[i].Copy(vertices[start + i]);
        }
        this.m_vertices[count].Copy(this.m_vertices[0]);
        this.m_prevVertex.Copy(this.m_vertices[this.m_count - 2]);
        this.m_nextVertex.Copy(this.m_vertices[1]);
        this.m_hasPrevVertex = true;
        this.m_hasNextVertex = true;
        return this;
    }
    /// Create a chain with isolated end vertices.
    /// @param vertices an array of vertices, these are copied
    /// @param count the vertex count
    CreateChain(vertices, count = vertices.length, start = 0) {
        // DEBUG: b2Assert(count >= 2);
        // DEBUG: for (let i: number = 1; i < count; ++i) {
        // DEBUG:   const v1 = vertices[start + i - 1];
        // DEBUG:   const v2 = vertices[start + i];
        // DEBUG:   // If the code crashes here, it means your vertices are too close together.
        // DEBUG:   b2Assert(b2Vec2.DistanceSquaredVV(v1, v2) > b2_linearSlop * b2_linearSlop);
        // DEBUG: }
        this.m_count = count;
        this.m_vertices = b2Vec2.MakeArray(count);
        for (let i = 0; i < count; ++i) {
            this.m_vertices[i].Copy(vertices[start + i]);
        }
        this.m_hasPrevVertex = false;
        this.m_hasNextVertex = false;
        this.m_prevVertex.SetZero();
        this.m_nextVertex.SetZero();
        return this;
    }
    /// Establish connectivity to a vertex that precedes the first vertex.
    /// Don't call this for loops.
    SetPrevVertex(prevVertex) {
        this.m_prevVertex.Copy(prevVertex);
        this.m_hasPrevVertex = true;
        return this;
    }
    /// Establish connectivity to a vertex that follows the last vertex.
    /// Don't call this for loops.
    SetNextVertex(nextVertex) {
        this.m_nextVertex.Copy(nextVertex);
        this.m_hasNextVertex = true;
        return this;
    }
    /// Implement b2Shape. Vertices are cloned using b2Alloc.
    Clone() {
        return new b2ChainShape().Copy(this);
    }
    Copy(other) {
        super.Copy(other);
        // DEBUG: b2Assert(other instanceof b2ChainShape);
        this.CreateChain(other.m_vertices, other.m_count);
        this.m_prevVertex.Copy(other.m_prevVertex);
        this.m_nextVertex.Copy(other.m_nextVertex);
        this.m_hasPrevVertex = other.m_hasPrevVertex;
        this.m_hasNextVertex = other.m_hasNextVertex;
        return this;
    }
    /// @see b2Shape::GetChildCount
    GetChildCount() {
        // edge count = vertex count - 1
        return this.m_count - 1;
    }
    /// Get a child edge.
    GetChildEdge(edge, index) {
        // DEBUG: b2Assert(0 <= index && index < this.m_count - 1);
        edge.m_type = b2ShapeType.e_edgeShape;
        edge.m_radius = this.m_radius;
        edge.m_vertex1.Copy(this.m_vertices[index]);
        edge.m_vertex2.Copy(this.m_vertices[index + 1]);
        if (index > 0) {
            edge.m_vertex0.Copy(this.m_vertices[index - 1]);
            edge.m_hasVertex0 = true;
        }
        else {
            edge.m_vertex0.Copy(this.m_prevVertex);
            edge.m_hasVertex0 = this.m_hasPrevVertex;
        }
        if (index < this.m_count - 2) {
            edge.m_vertex3.Copy(this.m_vertices[index + 2]);
            edge.m_hasVertex3 = true;
        }
        else {
            edge.m_vertex3.Copy(this.m_nextVertex);
            edge.m_hasVertex3 = this.m_hasNextVertex;
        }
    }
    /// This always return false.
    /// @see b2Shape::TestPoint
    TestPoint(xf, p) {
        return false;
    }
    ComputeDistance(xf, p, normal, childIndex) {
        const edge = b2ChainShape.ComputeDistance_s_edgeShape;
        this.GetChildEdge(edge, childIndex);
        return edge.ComputeDistance(xf, p, normal, 0);
    }
    RayCast(output, input, xf, childIndex) {
        // DEBUG: b2Assert(childIndex < this.m_count);
        const edgeShape = b2ChainShape.RayCast_s_edgeShape;
        edgeShape.m_vertex1.Copy(this.m_vertices[childIndex]);
        edgeShape.m_vertex2.Copy(this.m_vertices[(childIndex + 1) % this.m_count]);
        return edgeShape.RayCast(output, input, xf, 0);
    }
    ComputeAABB(aabb, xf, childIndex) {
        // DEBUG: b2Assert(childIndex < this.m_count);
        const vertexi1 = this.m_vertices[childIndex];
        const vertexi2 = this.m_vertices[(childIndex + 1) % this.m_count];
        const v1 = b2Transform.MulXV(xf, vertexi1, b2ChainShape.ComputeAABB_s_v1);
        const v2 = b2Transform.MulXV(xf, vertexi2, b2ChainShape.ComputeAABB_s_v2);
        b2Vec2.MinV(v1, v2, aabb.lowerBound);
        b2Vec2.MaxV(v1, v2, aabb.upperBound);
    }
    /// Chains have zero mass.
    /// @see b2Shape::ComputeMass
    ComputeMass(massData, density) {
        massData.mass = 0;
        massData.center.SetZero();
        massData.I = 0;
    }
    SetupDistanceProxy(proxy, index) {
        // DEBUG: b2Assert(0 <= index && index < this.m_count);
        proxy.m_vertices = proxy.m_buffer;
        proxy.m_vertices[0].Copy(this.m_vertices[index]);
        if (index + 1 < this.m_count) {
            proxy.m_vertices[1].Copy(this.m_vertices[index + 1]);
        }
        else {
            proxy.m_vertices[1].Copy(this.m_vertices[0]);
        }
        proxy.m_count = 2;
        proxy.m_radius = this.m_radius;
    }
    ComputeSubmergedArea(normal, offset, xf, c) {
        c.SetZero();
        return 0;
    }
    Dump(log) {
        log("    const shape: b2ChainShape = new b2ChainShape();\n");
        log("    const vs: b2Vec2[] = [];\n");
        for (let i = 0; i < this.m_count; ++i) {
            log("    vs[%d] = new bVec2(%.15f, %.15f);\n", i, this.m_vertices[i].x, this.m_vertices[i].y);
        }
        log("    shape.CreateChain(vs, %d);\n", this.m_count);
        log("    shape.m_prevVertex.Set(%.15f, %.15f);\n", this.m_prevVertex.x, this.m_prevVertex.y);
        log("    shape.m_nextVertex.Set(%.15f, %.15f);\n", this.m_nextVertex.x, this.m_nextVertex.y);
        log("    shape.m_hasPrevVertex = %s;\n", (this.m_hasPrevVertex) ? ("true") : ("false"));
        log("    shape.m_hasNextVertex = %s;\n", (this.m_hasNextVertex) ? ("true") : ("false"));
    }
}
// #if B2_ENABLE_PARTICLE
/// @see b2Shape::ComputeDistance
b2ChainShape.ComputeDistance_s_edgeShape = new b2EdgeShape();
// #endif
/// Implement b2Shape.
b2ChainShape.RayCast_s_edgeShape = new b2EdgeShape();
/// @see b2Shape::ComputeAABB
b2ChainShape.ComputeAABB_s_v1 = new b2Vec2();
b2ChainShape.ComputeAABB_s_v2 = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDaGFpblNoYXBlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvQ29sbGlzaW9uL1NoYXBlcy9iMkNoYWluU2hhcGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRiw0RUFBNEU7QUFDNUUsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFDM0QsT0FBTyxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQU0sTUFBTSxxQkFBcUIsQ0FBQztBQUk5RCxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLFdBQVcsQ0FBQztBQUNqRCxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBRTVDLDJEQUEyRDtBQUMzRCxtRkFBbUY7QUFDbkYsNkNBQTZDO0FBQzdDLHVFQUF1RTtBQUN2RSxpRUFBaUU7QUFDakUsaUZBQWlGO0FBQ2pGLE1BQU0sT0FBTyxZQUFhLFNBQVEsT0FBTztJQVF2QztRQUNFLEtBQUssQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFSN0MsZUFBVSxHQUFhLEVBQUUsQ0FBQztRQUMxQixZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQ1gsaUJBQVksR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3BDLGlCQUFZLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUM3QyxvQkFBZSxHQUFZLEtBQUssQ0FBQztRQUNqQyxvQkFBZSxHQUFZLEtBQUssQ0FBQztJQUl4QyxDQUFDO0lBRUQsMkRBQTJEO0lBQzNELDBEQUEwRDtJQUMxRCxpQ0FBaUM7SUFDMUIsVUFBVSxDQUFDLFFBQWMsRUFBRSxRQUFnQixRQUFRLENBQUMsTUFBTSxFQUFFLFFBQWdCLENBQUM7UUFDbEYsK0JBQStCO1FBQy9CLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtZQUNiLE9BQU8sSUFBSSxDQUFDO1NBQ2I7UUFDRCxt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