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
import { b2CollideCircles } from "../../Collision/b2CollideCircle";
import { b2Contact } from "./b2Contact";
export class b2CircleContact extends b2Contact {
    constructor() {
        super();
    }
    static Create(allocator) {
        return new b2CircleContact();
    }
    static Destroy(contact, allocator) {
    }
    Reset(fixtureA, indexA, fixtureB, indexB) {
        super.Reset(fixtureA, indexA, fixtureB, indexB);
    }
    Evaluate(manifold, xfA, xfB) {
        const shapeA = this.m_fixtureA.GetShape();
        const shapeB = this.m_fixtureB.GetShape();
        // DEBUG: b2Assert(shapeA.GetType() === b2ShapeType.e_circleShape);
        // DEBUG: b2Assert(shapeB.GetType() === b2ShapeType.e_circleShape);
        b2CollideCircles(manifold, shapeA, xfA, shapeB, xfB);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDaXJjbGVDb250YWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvQ29udGFjdHMvYjJDaXJjbGVDb250YWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBS0YsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFJbkUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUd4QyxNQUFNLE9BQU8sZUFBZ0IsU0FBUSxTQUFTO0lBQzVDO1FBQ0UsS0FBSyxFQUFFLENBQUM7SUFDVixDQUFDO0lBRU0sTUFBTSxDQUFDLE1BQU0sQ0FBQyxTQUFjO1FBQ2pDLE9BQU8sSUFBSSxlQUFlLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRU0sTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFrQixFQUFFLFNBQWM7SUFDeEQsQ0FBQztJQUVNLEtBQUssQ0FBQyxRQUFtQixFQUFFLE1BQWMsRUFBRSxRQUFtQixFQUFFLE1BQWM7UUFDbkYsS0FBSyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUNsRCxDQUFDO0lBRU0sUUFBUSxDQUFDLFFBQW9CLEVBQUUsR0FBZ0IsRUFBRSxHQUFnQjtRQUN0RSxNQUFNLE1BQU0sR0FBWSxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25ELE1BQU0sTUFBTSxHQUFZLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDbkQsbUVBQW1FO1FBQ25FLG1FQUFtRTtRQUNuRSxnQkFBZ0IsQ0FDZCxRQUFRLEVBQ1IsTUFBdUIsRUFBRSxHQUFHLEVBQzVCLE1BQXVCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDbEMsQ0FBQztDQUNGIn0=