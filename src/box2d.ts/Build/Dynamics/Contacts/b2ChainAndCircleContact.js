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
import { b2EdgeShape } from "../../Collision/Shapes/b2EdgeShape";
import { b2Contact } from "./b2Contact";
export class b2ChainAndCircleContact extends b2Contact {
    constructor() {
        super();
    }
    static Create(allocator) {
        return new b2ChainAndCircleContact();
    }
    static Destroy(contact, allocator) {
    }
    Reset(fixtureA, indexA, fixtureB, indexB) {
        super.Reset(fixtureA, indexA, fixtureB, indexB);
        // DEBUG: b2Assert(fixtureA.GetType() === b2ShapeType.e_chainShape);
        // DEBUG: b2Assert(fixtureB.GetType() === b2ShapeType.e_circleShape);
    }
    Evaluate(manifold, xfA, xfB) {
        const shapeA = this.m_fixtureA.GetShape();
        const shapeB = this.m_fixtureB.GetShape();
        // DEBUG: b2Assert(shapeA instanceof b2ChainShape);
        // DEBUG: b2Assert(shapeB instanceof b2CircleShape);
        const chain = shapeA;
        const edge = b2ChainAndCircleContact.Evaluate_s_edge;
        chain.GetChildEdge(edge, this.m_indexA);
        b2CollideEdgeAndCircle(manifold, edge, xfA, shapeB, xfB);
    }
}
b2ChainAndCircleContact.Evaluate_s_edge = new b2EdgeShape();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDaGFpbkFuZENpcmNsZUNvbnRhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9Cb3gyRC9EeW5hbWljcy9Db250YWN0cy9iMkNoYWluQW5kQ2lyY2xlQ29udGFjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUtGLE9BQU8sRUFBRSxzQkFBc0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBS3ZFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNqRSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBR3hDLE1BQU0sT0FBTyx1QkFBd0IsU0FBUSxTQUFTO0lBQ3BEO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBRU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFjO1FBQ2pDLE9BQU8sSUFBSSx1QkFBdUIsRUFBRSxDQUFDO0lBQ3ZDLENBQUM7SUFFTSxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQWtCLEVBQUUsU0FBYztJQUN4RCxDQUFDO0lBRU0sS0FBSyxDQUFDLFFBQW1CLEVBQUUsTUFBYyxFQUFFLFFBQW1CLEVBQUUsTUFBYztRQUNuRixLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ2hELG9FQUFvRTtRQUNwRSxxRUFBcUU7SUFDdkUsQ0FBQztJQUdNLFFBQVEsQ0FBQyxRQUFvQixFQUFFLEdBQWdCLEVBQUUsR0FBZ0I7UUFDdEUsTUFBTSxNQUFNLEdBQVksSUFBSSxDQUFDLFVBQVUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUNuRCxNQUFNLE1BQU0sR0FBWSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25ELG1EQUFtRDtRQUNuRCxvREFBb0Q7UUFDcEQsTUFBTSxLQUFLLEdBQWlCLE1BQXNCLENBQUM7UUFDbkQsTUFBTSxJQUFJLEdBQWdCLHVCQUF1QixDQUFDLGVBQWUsQ0FBQztRQUNsRSxLQUFLLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsc0JBQXNCLENBQ3BCLFFBQVEsRUFDUixJQUFJLEVBQUUsR0FBRyxFQUNULE1BQXVCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbEMsQ0FBQzs7QUFiYyx1Q0FBZSxHQUFHLElBQUksV0FBVyxFQUFFLENBQUMifQ==