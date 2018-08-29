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
import { b2CollidePolygons } from "../../Collision/b2CollidePolygon";
import { b2Contact } from "./b2Contact";
export class b2PolygonContact extends b2Contact {
    constructor() {
        super();
    }
    static Create(allocator) {
        return new b2PolygonContact();
    }
    static Destroy(contact, allocator) {
    }
    Reset(fixtureA, indexA, fixtureB, indexB) {
        super.Reset(fixtureA, indexA, fixtureB, indexB);
    }
    Evaluate(manifold, xfA, xfB) {
        const shapeA = this.m_fixtureA.GetShape();
        const shapeB = this.m_fixtureB.GetShape();
        // DEBUG: b2Assert(shapeA.GetType() === b2ShapeType.e_polygonShape);
        // DEBUG: b2Assert(shapeB.GetType() === b2ShapeType.e_polygonShape);
        b2CollidePolygons(manifold, shapeA, xfA, shapeB, xfB);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJQb2x5Z29uQ29udGFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0R5bmFtaWNzL0NvbnRhY3RzL2IyUG9seWdvbkNvbnRhY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFLRixPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUlyRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3hDLE1BQU0sT0FBTyxnQkFBaUIsU0FBUSxTQUFTO0lBQzdDO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBRU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFjO1FBQ2pDLE9BQU8sSUFBSSxnQkFBZ0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWtCLEVBQUUsU0FBYztJQUN4RCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQW1CLEVBQUUsTUFBYyxFQUFFLFFBQW1CLEVBQUUsTUFBYztRQUNuRixLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ2xELENBQUM7SUFFTSxRQUFRLENBQUMsUUFBb0IsRUFBRSxHQUFnQixFQUFFLEdBQWdCO1FBQ3RFLE1BQU0sTUFBTSxHQUFZLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkQsTUFBTSxNQUFNLEdBQVksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuRCxvRUFBb0U7UUFDcEUsb0VBQW9FO1FBQ3BFLGlCQUFpQixDQUNmLFFBQVEsRUFDUixNQUF3QixFQUFFLEdBQUcsRUFDN0IsTUFBd0IsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNuQyxDQUFDO0NBQ0YifQ==