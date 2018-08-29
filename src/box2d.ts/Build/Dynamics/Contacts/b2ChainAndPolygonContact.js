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
import { b2CollideEdgeAndPolygon } from "../../Collision/b2CollideEdge";
import { b2EdgeShape } from "../../Collision/Shapes/b2EdgeShape";
import { b2Contact } from "./b2Contact";
export class b2ChainAndPolygonContact extends b2Contact {
    constructor() {
        super();
    }
    static Create(allocator) {
        return new b2ChainAndPolygonContact();
    }
    static Destroy(contact, allocator) {
    }
    Reset(fixtureA, indexA, fixtureB, indexB) {
        super.Reset(fixtureA, indexA, fixtureB, indexB);
        // DEBUG: b2Assert(fixtureA.GetType() === b2ShapeType.e_chainShape);
        // DEBUG: b2Assert(fixtureB.GetType() === b2ShapeType.e_polygonShape);
    }
    Evaluate(manifold, xfA, xfB) {
        const shapeA = this.m_fixtureA.GetShape();
        const shapeB = this.m_fixtureB.GetShape();
        // DEBUG: b2Assert(shapeA instanceof b2ChainShape);
        // DEBUG: b2Assert(shapeB instanceof b2PolygonShape);
        const chain = shapeA;
        const edge = b2ChainAndPolygonContact.Evaluate_s_edge;
        chain.GetChildEdge(edge, this.m_indexA);
        b2CollideEdgeAndPolygon(manifold, edge, xfA, shapeB, xfB);
    }
}
b2ChainAndPolygonContact.Evaluate_s_edge = new b2EdgeShape();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDaGFpbkFuZFBvbHlnb25Db250YWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvQ29udGFjdHMvYjJDaGFpbkFuZFBvbHlnb25Db250YWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBS0YsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFJeEUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLG9DQUFvQyxDQUFDO0FBRWpFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHeEMsTUFBTSxPQUFPLHdCQUF5QixTQUFRLFNBQVM7SUFDckQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFFTSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWM7UUFDakMsT0FBTyxJQUFJLHdCQUF3QixFQUFFLENBQUM7SUFDeEMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBa0IsRUFBRSxTQUFjO0lBQ3hELENBQUM7SUFFTSxLQUFLLENBQUMsUUFBbUIsRUFBRSxNQUFjLEVBQUUsUUFBbUIsRUFBRSxNQUFjO1FBQ25GLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDaEQsb0VBQW9FO1FBQ3BFLHNFQUFzRTtJQUN4RSxDQUFDO0lBR00sUUFBUSxDQUFDLFFBQW9CLEVBQUUsR0FBZ0IsRUFBRSxHQUFnQjtRQUN0RSxNQUFNLE1BQU0sR0FBWSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25ELE1BQU0sTUFBTSxHQUFZLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkQsbURBQW1EO1FBQ25ELHFEQUFxRDtRQUNyRCxNQUFNLEtBQUssR0FBaUIsTUFBc0IsQ0FBQztRQUNuRCxNQUFNLElBQUksR0FBZ0Isd0JBQXdCLENBQUMsZUFBZSxDQUFDO1FBQ25FLEtBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN4Qyx1QkFBdUIsQ0FDckIsUUFBUSxFQUNSLElBQUksRUFBRSxHQUFHLEVBQ1QsTUFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuQyxDQUFDOztBQWJjLHdDQUFlLEdBQUcsSUFBSSxXQUFXLEVBQUUsQ0FBQyJ9