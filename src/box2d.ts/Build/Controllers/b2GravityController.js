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
import { b2_epsilon } from "../Common/b2Settings";
import { b2Sqrt, b2Vec2 } from "../Common/b2Math";
/**
 * Applies simplified gravity between every pair of bodies
 */
export class b2GravityController extends b2Controller {
    constructor() {
        super(...arguments);
        /**
         * Specifies the strength of the gravitiation force
         */
        this.G = 1;
        /**
         * If true, gravity is proportional to r^-2, otherwise r^-1
         */
        this.invSqr = true;
    }
    /**
     * @see b2Controller::Step
     */
    Step(step) {
        if (this.invSqr) {
            for (let i = this.m_bodyList; i; i = i.nextBody) {
                const body1 = i.body;
                const p1 = body1.GetWorldCenter();
                const mass1 = body1.GetMass();
                for (let j = this.m_bodyList; j && j !== i; j = j.nextBody) {
                    const body2 = j.body;
                    const p2 = body2.GetWorldCenter();
                    const mass2 = body2.GetMass();
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const r2 = dx * dx + dy * dy;
                    if (r2 < b2_epsilon) {
                        continue;
                    }
                    const f = b2GravityController.Step_s_f.Set(dx, dy);
                    f.SelfMul(this.G / r2 / b2Sqrt(r2) * mass1 * mass2);
                    if (body1.IsAwake()) {
                        body1.ApplyForce(f, p1);
                    }
                    if (body2.IsAwake()) {
                        body2.ApplyForce(f.SelfMul(-1), p2);
                    }
                }
            }
        }
        else {
            for (let i = this.m_bodyList; i; i = i.nextBody) {
                const body1 = i.body;
                const p1 = body1.GetWorldCenter();
                const mass1 = body1.GetMass();
                for (let j = this.m_bodyList; j && j !== i; j = j.nextBody) {
                    const body2 = j.body;
                    const p2 = body2.GetWorldCenter();
                    const mass2 = body2.GetMass();
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const r2 = dx * dx + dy * dy;
                    if (r2 < b2_epsilon) {
                        continue;
                    }
                    const f = b2GravityController.Step_s_f.Set(dx, dy);
                    f.SelfMul(this.G / r2 * mass1 * mass2);
                    if (body1.IsAwake()) {
                        body1.ApplyForce(f, p1);
                    }
                    if (body2.IsAwake()) {
                        body2.ApplyForce(f.SelfMul(-1), p2);
                    }
                }
            }
        }
    }
    Draw(draw) { }
}
b2GravityController.Step_s_f = new b2Vec2();
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJHcmF2aXR5Q29udHJvbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0NvbnRyb2xsZXJzL2IyR3Jhdml0eUNvbnRyb2xsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFFSCwyQkFBMkI7QUFFM0IsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRTlDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUNsRCxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBR2xEOztHQUVHO0FBQ0gsTUFBTSxPQUFPLG1CQUFvQixTQUFRLFlBQVk7SUFBckQ7O1FBQ0U7O1dBRUc7UUFDSSxNQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2I7O1dBRUc7UUFDSSxXQUFNLEdBQUcsSUFBSSxDQUFDO0lBNkR2QixDQUFDO0lBM0RDOztPQUVHO0lBQ0ksSUFBSSxDQUFDLElBQWdCO1FBQzFCLElBQUksSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNmLEtBQUssSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUU7Z0JBQy9DLE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ3JCLE1BQU0sRUFBRSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFDbEMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUM5QixLQUFLLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUU7b0JBQzFELE1BQU0sS0FBSyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7b0JBQ3JCLE1B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