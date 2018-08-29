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
import { b2_epsilon } from "../Common/b2Settings";
import { b2Color } from "../Common/b2Draw";
/**
 * Calculates buoyancy forces for fluids in the form of a half
 * plane.
 */
export class b2BuoyancyController extends b2Controller {
    constructor() {
        super(...arguments);
        /**
         * The outer surface normal
         */
        this.normal = new b2Vec2(0, 1);
        /**
         * The height of the fluid surface along the normal
         */
        this.offset = 0;
        /**
         * The fluid density
         */
        this.density = 0;
        /**
         * Fluid velocity, for drag calculations
         */
        this.velocity = new b2Vec2(0, 0);
        /**
         * Linear drag co-efficient
         */
        this.linearDrag = 0;
        /**
         * Angular drag co-efficient
         */
        this.angularDrag = 0;
        /**
         * If false, bodies are assumed to be uniformly dense, otherwise
         * use the shapes densities
         */
        this.useDensity = false; //False by default to prevent a gotcha
        /**
         * If true, gravity is taken from the world instead of the
         */
        this.useWorldGravity = true;
        /**
         * Gravity vector, if the world's gravity is not used
         */
        this.gravity = new b2Vec2(0, 0);
    }
    Step(step) {
        if (!this.m_bodyList) {
            return;
        }
        if (this.useWorldGravity) {
            this.gravity.Copy(this.m_bodyList.body.GetWorld().GetGravity());
        }
        for (let i = this.m_bodyList; i; i = i.nextBody) {
            const body = i.body;
            if (!body.IsAwake()) {
                //Buoyancy force is just a function of position,
                //so unlike most forces, it is safe to ignore sleeping bodes
                continue;
            }
            const areac = new b2Vec2();
            const massc = new b2Vec2();
            let area = 0;
            let mass = 0;
            for (let fixture = body.GetFixtureList(); fixture; fixture = fixture.m_next) {
                const sc = new b2Vec2();
                const sarea = fixture.GetShape().ComputeSubmergedArea(this.normal, this.offset, body.GetTransform(), sc);
                area += sarea;
                areac.x += sarea * sc.x;
                areac.y += sarea * sc.y;
                let shapeDensity = 0;
                if (this.useDensity) {
                    //TODO: Expose density publicly
                    shapeDensity = fixture.GetDensity();
                }
                else {
                    shapeDensity = 1;
                }
                mass += sarea * shapeDensity;
                massc.x += sarea * sc.x * shapeDensity;
                massc.y += sarea * sc.y * shapeDensity;
            }
            areac.x /= area;
            areac.y /= area;
            //    b2Vec2 localCentroid = b2MulT(body->GetXForm(),areac);
            massc.x /= mass;
            massc.y /= mass;
            if (area < b2_epsilon) {
                continue;
            }
            //Buoyancy
            const buoyancyForce = this.gravity.Clone().SelfNeg();
            buoyancyForce.SelfMul(this.density * area);
            body.ApplyForce(buoyancyForce, massc);
            //Linear drag
            const dragForce = body.GetLinearVelocityFromWorldPoint(areac, new b2Vec2());
            dragForce.SelfSub(this.velocity);
            dragForce.SelfMul((-this.linearDrag * area));
            body.ApplyForce(dragForce, areac);
            //Angular drag
            //TODO: Something that makes more physical sense?
            body.ApplyTorque((-body.GetInertia() / body.GetMass() * area * body.GetAngularVelocity() * this.angularDrag));
        }
    }
    Draw(debugDraw) {
        const r = 100;
        const p1 = new b2Vec2();
        const p2 = new b2Vec2();
        p1.x = this.normal.x * this.offset + this.normal.y * r;
        p1.y = this.normal.y * this.offset - this.normal.x * r;
        p2.x = this.normal.x * this.offset - this.normal.y * r;
        p2.y = this.normal.y * this.offset + this.normal.x * r;
        const color = new b2Color(0, 0, 0.8);
        debugDraw.DrawSegment(p1, p2, color);
    }
}
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJCdW95YW5jeUNvbnRyb2xsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9Cb3gyRC9Db250cm9sbGVycy9iMkJ1b3lhbmN5Q29udHJvbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztHQWdCRztBQUVILDJCQUEyQjtBQUUzQixPQUFPLEVBQUUsWUFBWSxFQUFvQixNQUFNLGdCQUFnQixDQUFDO0FBQ2hFLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUUxQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDbEQsT0FBTyxFQUFVLE9BQU8sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRW5EOzs7R0FHRztBQUNILE1BQU0sT0FBTyxvQkFBcUIsU0FBUSxZQUFZO0lBQXREOztRQUNFOztXQUVHO1FBQ2EsV0FBTSxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUMxQzs7V0FFRztRQUNJLFdBQU0sR0FBRyxDQUFDLENBQUM7UUFDbEI7O1dBRUc7UUFDSSxZQUFPLEdBQUcsQ0FBQyxDQUFDO1FBQ25COztXQUVHO1FBQ2EsYUFBUSxHQUFHLElBQUksTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1Qzs7V0FFRztRQUNJLGVBQVUsR0FBRyxDQUFDLENBQUM7UUFDdEI7O1dBRUc7UUFDSSxnQkFBVyxHQUFHLENBQUMsQ0FBQztRQUN2Qjs7O1dBR0c7UUFDSSxlQUFVLEdBQUcsS0FBSyxDQUFDLENBQUMsc0NBQXNDO1FBQ2pFOztXQUVHO1FBQ0ksb0JBQWUsR0FBRyxJQUFJLENBQUM7UUFDOUI7O1dBRUc7UUFDYSxZQUFPLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBeUU3QyxDQUFDO0lBdkVRLElBQUksQ0FBQyxJQUFnQjtRQUMxQixJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNwQixPQUFPO1NBQ1I7UUFDRCxJQUFJLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFDeEIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztTQUNqRTtRQUNELEtBQUssSUFBSSxDQUFDLEdBQTRCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFO1lBQ3hFLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsRUFBRTtnQkFDbkIsZ0RBQWdEO2dCQUNoRCw0REFBNEQ7Z0JBQzVELFNBQVM7YUFDVjtZQUNELE1BQU0sS0FBSyxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7WUFDM0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQztZQUMzQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7WUFDYixJQUFJLElBQUksR0FBRyxDQUFDLENBQUM7WUFDYixLQUFLLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsRUFBRSxPQUFPLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUU7Z0JBQzNFLE1BQU0sRUFBRSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7Z0JBQ3hCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO2dCQUN6RyxJQUFJLElBQUksS0FBSyxDQUFDO2dCQUNkLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLEtBQUssQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLElBQUksWUFBWSxHQUFHLENBQUMsQ0FBQztnQkFDckIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFO29CQUNuQiwrQkFBK0I7b0JBQy9CLFlBQVksR0FBRyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUM7aUJBQ3JDO3FCQUFNO29CQUNMLFlBQVksR0FBRyxDQUFDLENBQUM7aUJBQ2xCO2dCQUNELElBQUksSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDO2dCQUM3QixLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQztnQkFDdkMsS0FBSyxDQUFDLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7YUFDeEM7WUFDRCxLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztZQUNoQixLQUFLLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztZQUNoQiw0REFBNEQ7WUFDNUQsS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7WUFDaEIsS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7WUFDaEIsSUFBSSxJQUFJLEdBQUcsVUFBVSxFQUFFO2dCQUNyQixTQUFTO2FBQ1Y7WUFDRCxVQUFVO1lBQ1YsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUNyRCxhQUFhLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLENBQUM7WUFDM0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDdEMsYUFBYTtZQUNiLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQywrQkFBK0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzVFLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsVUFBVSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsQyxjQUFjO1lBQ2QsaURBQWlEO1lBQ2pELElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxFQUFFLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1NBQy9HO0lBQ0gsQ0FBQztJQUVNLElBQUksQ0FBQyxTQUFpQjtRQUMzQixNQUFNLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDZCxNQUFNLEVBQUUsR0FBRyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3hCLE1BQU0sRUFBRSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7UUFDeEIsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN2RCxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZELEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdkQsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV2RCxNQUFNLEtBQUssR0FBRyxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXJDLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBQ0Y7QUFFRCxTQUFTIn0=