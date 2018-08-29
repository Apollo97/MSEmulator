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
import { b2CollideEdgeAndCircle } from "../../Collision/b2CollideEdge";
import { b2Contact } from "./b2Contact";
export class b2EdgeAndCircleContact extends b2Contact {
    constructor() {
        super();
    }
    static Create(allocator) {
        return new b2EdgeAndCircleContact();
    }
    static Destroy(contact, allocator) {
    }
    Reset(fixtureA, indexA, fixtureB, indexB) {
        super.Reset(fixtureA, indexA, fixtureB, indexB);
        // DEBUG: b2Assert(fixtureA.GetType() === b2ShapeType.e_edgeShape);
        // DEBUG: b2Assert(fixtureB.GetType() === b2ShapeType.e_circleShape);
    }
    Evaluate(manifold, xfA, xfB) {
        const shapeA = this.m_fixtureA.GetShape();
        const shapeB = this.m_fixtureB.GetShape();
        // DEBUG: b2Assert(shapeA instanceof b2EdgeShape);
        // DEBUG: b2Assert(shapeB instanceof b2CircleShape);
        b2CollideEdgeAndCircle(manifold, shapeA, xfA, shapeB, xfB);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJFZGdlQW5kQ2lyY2xlQ29udGFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0R5bmFtaWNzL0NvbnRhY3RzL2IyRWRnZUFuZENpcmNsZUNvbnRhY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFLRixPQUFPLEVBQUUsc0JBQXNCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUt2RSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3hDLE1BQU0sT0FBTyxzQkFBdUIsU0FBUSxTQUFTO0lBQ25EO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBRU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFjO1FBQ2pDLE9BQU8sSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0lBQ3RDLENBQUM7SUFFTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWtCLEVBQUUsU0FBYztJQUN4RCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQW1CLEVBQUUsTUFBYyxFQUFFLFFBQW1CLEVBQUUsTUFBYztRQUNuRixLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2hELG1FQUFtRTtRQUNuRSxxRUFBcUU7SUFDdkUsQ0FBQztJQUVNLFFBQVEsQ0FBQyxRQUFvQixFQUFFLEdBQWdCLEVBQUUsR0FBZ0I7UUFDdEUsTUFBTSxNQUFNLEdBQVksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuRCxNQUFNLE1BQU0sR0FBWSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25ELGtEQUFrRDtRQUNsRCxvREFBb0Q7UUFDcEQsc0JBQXNCLENBQ3BCLFFBQVEsRUFDUixNQUFxQixFQUFFLEdBQUcsRUFDMUIsTUFBdUIsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUNsQyxDQUFDO0NBQ0YifQ==