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
import { b2Vec2 } from "../../Common/b2Math";
/// This holds the mass data computed for a shape.
export class b2MassData {
    constructor() {
        /// The mass of the shape, usually in kilograms.
        this.mass = 0;
        /// The position of the shape's centroid relative to the shape's origin.
        this.center = new b2Vec2(0, 0);
        /// The rotational inertia of the shape about the local origin.
        this.I = 0;
    }
}
export var b2ShapeType;
(function (b2ShapeType) {
    b2ShapeType[b2ShapeType["e_unknown"] = -1] = "e_unknown";
    b2ShapeType[b2ShapeType["e_circleShape"] = 0] = "e_circleShape";
    b2ShapeType[b2ShapeType["e_edgeShape"] = 1] = "e_edgeShape";
    b2ShapeType[b2ShapeType["e_polygonShape"] = 2] = "e_polygonShape";
    b2ShapeType[b2ShapeType["e_chainShape"] = 3] = "e_chainShape";
    b2ShapeType[b2ShapeType["e_shapeTypeCount"] = 4] = "e_shapeTypeCount";
})(b2ShapeType || (b2ShapeType = {}));
/// A shape is used for collision detection. You can create a shape however you like.
/// Shapes used for simulation in b2World are created automatically when a b2Fixture
/// is created. Shapes may encapsulate a one or more child shapes.
export class b2Shape {
    constructor(type, radius) {
        this.m_type = b2ShapeType.e_unknown;
        /// Radius of a shape. For polygonal shapes this must be b2_polygonRadius. There is no support for
        /// making rounded polygons.
        this.m_radius = 0;
        this.m_type = type;
        this.m_radius = radius;
    }
    Copy(other) {
        // DEBUG: b2Assert(this.m_type === other.m_type);
        this.m_radius = other.m_radius;
        return this;
    }
    /// Get the type of this shape. You can use this to down cast to the concrete shape.
    /// @return the shape type.
    GetType() {
        return this.m_type;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJTaGFwZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0NvbGxpc2lvbi9TaGFwZXMvYjJTaGFwZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLDZEQUE2RDtBQUM3RCxPQUFPLEVBQUUsTUFBTSxFQUFlLE1BQU0scUJBQXFCLENBQUM7QUFJMUQsa0RBQWtEO0FBQ2xELE1BQU0sT0FBTyxVQUFVO0lBQXZCO1FBQ0UsZ0RBQWdEO1FBQ3pDLFNBQUksR0FBVyxDQUFDLENBQUM7UUFFeEIsd0VBQXdFO1FBQ3hELFdBQU0sR0FBVyxJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFbEQsK0RBQStEO1FBQ3hELE1BQUMsR0FBVyxDQUFDLENBQUM7SUFDdkIsQ0FBQztDQUFBO0FBRUQsTUFBTSxDQUFOLElBQVksV0FPWDtBQVBELFdBQVksV0FBVztJQUNyQix3REFBYyxDQUFBO0lBQ2QsK0RBQWlCLENBQUE7SUFDakIsMkRBQWUsQ0FBQTtJQUNmLGlFQUFrQixDQUFBO0lBQ2xCLDZEQUFnQixDQUFBO0lBQ2hCLHFFQUFvQixDQUFBO0FBQ3RCLENBQUMsRUFQVyxXQUFXLEtBQVgsV0FBVyxRQU90QjtBQUVELHFGQUFxRjtBQUNyRixvRkFBb0Y7QUFDcEYsa0VBQWtFO0FBQ2xFLE1BQU0sT0FBZ0IsT0FBTztJQU8zQixZQUFZLElBQWlCLEVBQUUsTUFBYztRQU50QyxXQUFNLEdBQWdCLFdBQVcsQ0FBQyxTQUFTLENBQUM7UUFFcEQsa0dBQWtHO1FBQ2xHLDRCQUE0QjtRQUNwQixhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBRzFCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ25CLElBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO0lBQ3pCLENBQUM7SUFLTSxJQUFJLENBQUMsS0FBYztRQUN4QixpREFBaUQ7UUFDakQsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQy9CLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVELG9GQUFvRjtJQUNwRiwyQkFBMkI7SUFDcEIsT0FBTztRQUNaLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0NBMkNGIn0=