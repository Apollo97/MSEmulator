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
// #if B2_ENABLE_CONTROLLER
import { b2Controller } from "./b2Controller";
import { b2Vec2 } from "../Common/b2Math";
/**
 * Applies a force every frame
 */
export class b2ConstantAccelController extends b2Controller {
    constructor() {
        super(...arguments);
        /**
         * The acceleration to apply
         */
        this.A = new b2Vec2(0, 0);
    }
    Step(step) {
        const dtA = b2Vec2.MulSV(step.dt, this.A, b2ConstantAccelController.Step_s_dtA);
        for (let i = this.m_bodyList; i; i = i.nextBody) {
            const body = i.body;
            if (!body.IsAwake()) {
                continue;
            }
            body.SetLinearVelocity(b2Vec2.AddVV(body.GetLinearVelocity(), dtA, b2Vec2.s_t0));
        }
    }
    Draw(draw) { }
}
b2ConstantAccelController.Step_s_dtA = new b2Vec2();
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb25zdGFudEFjY2VsQ29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0NvbnRyb2xsZXJzL2IyQ29uc3RhbnRBY2NlbENvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFFSCwyQkFBMkI7QUFFM0IsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzlDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUkxQzs7R0FFRztBQUNILE1BQU0sT0FBTyx5QkFBMEIsU0FBUSxZQUFZO0lBQTNEOztRQUNFOztXQUVHO1FBQ2EsTUFBQyxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQWV2QyxDQUFDO0lBYlEsSUFBSSxDQUFDLElBQWdCO1FBQzFCLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLHlCQUF5QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2hGLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUU7WUFDL0MsTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNwQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUNuQixTQUFTO2FBQ1Y7WUFDRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDbEY7SUFDSCxDQUFDO0lBR00sSUFBSSxDQUFDLElBQVksSUFBRyxDQUFDOztBQUZiLG9DQUFVLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztBQUszQyxTQUFTIn0=