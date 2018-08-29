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
import { b2Contact } from "./b2Contact";
export class b2EdgeAndPolygonContact extends b2Contact {
    constructor() {
        super();
    }
    static Create(allocator) {
        return new b2EdgeAndPolygonContact();
    }
    static Destroy(contact, allocator) {
    }
    Reset(fixtureA, indexA, fixtureB, indexB) {
        super.Reset(fixtureA, indexA, fixtureB, indexB);
        // DEBUG: b2Assert(fixtureA.GetType() === b2ShapeType.e_edgeShape);
        // DEBUG: b2Assert(fixtureB.GetType() === b2ShapeType.e_polygonShape);
    }
    Evaluate(manifold, xfA, xfB) {
        const shapeA = this.m_fixtureA.GetShape();
        const shapeB = this.m_fixtureB.GetShape();
        // DEBUG: b2Assert(shapeA instanceof b2EdgeShape);
        // DEBUG: b2Assert(shapeB instanceof b2PolygonShape);
        b2CollideEdgeAndPolygon(manifold, shapeA, xfA, shapeB, xfB);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJFZGdlQW5kUG9seWdvbkNvbnRhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9Cb3gyRC9EeW5hbWljcy9Db250YWN0cy9iMkVkZ2VBbmRQb2x5Z29uQ29udGFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUtGLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBS3hFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFHeEMsTUFBTSxPQUFPLHVCQUF3QixTQUFRLFNBQVM7SUFDcEQ7UUFDRSxLQUFLLEVBQUUsQ0FBQztJQUNWLENBQUM7SUFFTSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQWM7UUFDakMsT0FBTyxJQUFJLHVCQUF1QixFQUFFLENBQUM7SUFDdkMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBa0IsRUFBRSxTQUFjO0lBQ3hELENBQUM7SUFFTSxLQUFLLENBQUMsUUFBbUIsRUFBRSxNQUFjLEVBQUUsUUFBbUIsRUFBRSxNQUFjO1FBQ25GLEtBQUssQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDaEQsbUVBQW1FO1FBQ25FLHNFQUFzRTtJQUN4RSxDQUFDO0lBRU0sUUFBUSxDQUFDLFFBQW9CLEVBQUUsR0FBZ0IsRUFBRSxHQUFnQjtRQUN0RSxNQUFNLE1BQU0sR0FBWSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25ELE1BQU0sTUFBTSxHQUFZLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkQsa0RBQWtEO1FBQ2xELHFEQUFxRDtRQUNyRCx1QkFBdUIsQ0FDckIsUUFBUSxFQUNSLE1BQXFCLEVBQUUsR0FBRyxFQUMxQixNQUF3QixFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ25DLENBQUM7Q0FDRiJ9