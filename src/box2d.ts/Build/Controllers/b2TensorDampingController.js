/*
 * Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
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
// #if B2_ENABLE_CONTROLLER
import { b2Controller } from "./b2Controller";
import { b2Mat22, b2Vec2, b2Max } from "../Common/b2Math";
import { b2_epsilon } from "../Common/b2Settings";
/**
 * Applies top down linear damping to the controlled bodies
 * The damping is calculated by multiplying velocity by a matrix
 * in local co-ordinates.
 */
export class b2TensorDampingController extends b2Controller {
    constructor() {
        super(...arguments);
        /// Tensor to use in damping model
        this.T = new b2Mat22();
        /*Some examples (matrixes in format (row1; row2))
        (-a 0; 0 -a)    Standard isotropic damping with strength a
        ( 0 a; -a 0)    Electron in fixed field - a force at right angles to velocity with proportional magnitude
        (-a 0; 0 -b)    Differing x and y damping. Useful e.g. for top-down wheels.
        */
        //By the way, tensor in this case just means matrix, don't let the terminology get you down.
        /// Set this to a positive number to clamp the maximum amount of damping done.
        this.maxTimestep = 0;
    }
    // Typically one wants maxTimestep to be 1/(max eigenvalue of T), so that damping will never cause something to reverse direction
    /**
     * @see b2Controller::Step
     */
    Step(step) {
        let timestep = step.dt;
        if (timestep <= b2_epsilon) {
            return;
        }
        if (timestep > this.maxTimestep && this.maxTimestep > 0) {
            timestep = this.maxTimestep;
        }
        for (let i = this.m_bodyList; i; i = i.nextBody) {
            const body = i.body;
            if (!body.IsAwake()) {
                continue;
            }
            const damping = body.GetWorldVector(b2Mat22.MulMV(this.T, body.GetLocalVector(body.GetLinearVelocity(), b2Vec2.s_t0), b2Vec2.s_t1), b2TensorDampingController.Step_s_damping);
            //    body->SetLinearVelocity(body->GetLinearVelocity() + timestep * damping);
            body.SetLinearVelocity(b2Vec2.AddVV(body.GetLinearVelocity(), b2Vec2.MulSV(timestep, damping, b2Vec2.s_t0), b2Vec2.s_t1));
        }
    }
    Draw(draw) { }
    /**
     * Sets damping independantly along the x and y axes
     */
    SetAxisAligned(xDamping, yDamping) {
        this.T.ex.x = (-xDamping);
        this.T.ex.y = 0;
        this.T.ey.x = 0;
        this.T.ey.y = (-yDamping);
        if (xDamping > 0 || yDamping > 0) {
            this.maxTimestep = 1 / b2Max(xDamping, yDamping);
        }
        else {
            this.maxTimestep = 0;
        }
    }
}
b2TensorDampingController.Step_s_damping = new b2Vec2();
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJUZW5zb3JEYW1waW5nQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0NvbnRyb2xsZXJzL2IyVGVuc29yRGFtcGluZ0NvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFFSCwyQkFBMkI7QUFFM0IsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRTFELE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUdsRDs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLHlCQUEwQixTQUFRLFlBQVk7SUFBM0Q7O1FBQ0ksa0NBQWtDO1FBQ2xCLE1BQUMsR0FBRyxJQUFJLE9BQU8sRUFBRSxDQUFDO1FBQ2xDOzs7O1VBSUU7UUFDRiw0RkFBNEY7UUFFNUYsOEVBQThFO1FBQ3ZFLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO0lBaUQzQixDQUFDO0lBaERHLGlJQUFpSTtJQUVqSTs7T0FFRztJQUNJLElBQUksQ0FBQyxJQUFnQjtRQUN4QixJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ3ZCLElBQUksUUFBUSxJQUFJLFVBQVUsRUFBRTtZQUN4QixPQUFPO1NBQ1Y7UUFDRCxJQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUFFO1lBQ3JELFFBQVEsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO1NBQy9CO1FBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRTtZQUM3QyxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUU7Z0JBQ2pCLFNBQVM7YUFDWjtZQUNELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQ25DLE9BQU8sQ0FBQyxLQUFLLENBQ1QsSUFBSSxDQUFDLENBQUMsRUFDTixJQUFJLENBQUMsY0FBYyxDQUNuQixJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDeEIsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUNaLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFDaEIseUJBQXlCLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDMUMsOEVBQThFO1lBQzlFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDN0g7SUFDTCxDQUFDO0lBR00sSUFBSSxDQUFDLElBQVksSUFBRyxDQUFDO0lBRTVCOztPQUVHO0lBQ0ksY0FBYyxDQUFDLFFBQWdCLEVBQUUsUUFBZ0I7UUFDdEQsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hCLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDaEIsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQixJQUFJLFFBQVEsR0FBRyxDQUFDLElBQUksUUFBUSxHQUFHLENBQUMsRUFBRTtZQUNoQyxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2xEO2FBQU07WUFDTCxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQztTQUN0QjtJQUNILENBQUM7O0FBakJjLHdDQUFjLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQW9CakQsU0FBUyJ9