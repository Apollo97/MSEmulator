/*
* Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
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
import { b2MakeArray } from "../Common/b2Settings";
import { b2Vec2 } from "../Common/b2Math";
/// Profiling data. Times are in milliseconds.
export class b2Profile {
    constructor() {
        this.step = 0;
        this.collide = 0;
        this.solve = 0;
        this.solveInit = 0;
        this.solveVelocity = 0;
        this.solvePosition = 0;
        this.broadphase = 0;
        this.solveTOI = 0;
    }
    Reset() {
        this.step = 0;
        this.collide = 0;
        this.solve = 0;
        this.solveInit = 0;
        this.solveVelocity = 0;
        this.solvePosition = 0;
        this.broadphase = 0;
        this.solveTOI = 0;
        return this;
    }
}
/// This is an internal structure.
export class b2TimeStep {
    constructor() {
        this.dt = 0; // time step
        this.inv_dt = 0; // inverse time step (0 if dt == 0).
        this.dtRatio = 0; // dt * inv_dt0
        this.velocityIterations = 0;
        this.positionIterations = 0;
        // #if B2_ENABLE_PARTICLE
        this.particleIterations = 0;
        // #endif
        this.warmStarting = false;
    }
    Copy(step) {
        this.dt = step.dt;
        this.inv_dt = step.inv_dt;
        this.dtRatio = step.dtRatio;
        this.positionIterations = step.positionIterations;
        this.velocityIterations = step.velocityIterations;
        // #if B2_ENABLE_PARTICLE
        this.particleIterations = step.particleIterations;
        // #endif
        this.warmStarting = step.warmStarting;
        return this;
    }
}
export class b2Position {
    constructor() {
        this.c = new b2Vec2();
        this.a = 0;
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2Position());
    }
}
export class b2Velocity {
    constructor() {
        this.v = new b2Vec2();
        this.w = 0;
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2Velocity());
    }
}
export class b2SolverData {
    constructor() {
        this.step = new b2TimeStep();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJUaW1lU3RlcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0R5bmFtaWNzL2IyVGltZVN0ZXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRixPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDbkQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRTFDLDhDQUE4QztBQUM5QyxNQUFNLE9BQU8sU0FBUztJQUF0QjtRQUNTLFNBQUksR0FBVyxDQUFDLENBQUM7UUFDakIsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUNwQixVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBQ2xCLGNBQVMsR0FBVyxDQUFDLENBQUM7UUFDdEIsa0JBQWEsR0FBVyxDQUFDLENBQUM7UUFDMUIsa0JBQWEsR0FBVyxDQUFDLENBQUM7UUFDMUIsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUN2QixhQUFRLEdBQVcsQ0FBQyxDQUFDO0lBYTlCLENBQUM7SUFYUSxLQUFLO1FBQ1YsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLENBQUM7UUFDZCxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztRQUNqQixJQUFJLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNmLElBQUksQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1FBQ25CLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxDQUFDO1FBQ2xCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztDQUNGO0FBRUQsa0NBQWtDO0FBQ2xDLE1BQU0sT0FBTyxVQUFVO0lBQXZCO1FBQ1MsT0FBRSxHQUFXLENBQUMsQ0FBQyxDQUFDLFlBQVk7UUFDNUIsV0FBTSxHQUFXLENBQUMsQ0FBQyxDQUFDLG9DQUFvQztRQUN4RCxZQUFPLEdBQVcsQ0FBQyxDQUFDLENBQUMsZUFBZTtRQUNwQyx1QkFBa0IsR0FBVyxDQUFDLENBQUM7UUFDL0IsdUJBQWtCLEdBQVcsQ0FBQyxDQUFDO1FBQ3RDLHlCQUF5QjtRQUNsQix1QkFBa0IsR0FBVyxDQUFDLENBQUM7UUFDdEMsU0FBUztRQUNGLGlCQUFZLEdBQVksS0FBSyxDQUFDO0lBY3ZDLENBQUM7SUFaUSxJQUFJLENBQUMsSUFBZ0I7UUFDMUIsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMxQixJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDNUIsSUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQztRQUNsRCxJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2xELHlCQUF5QjtRQUN6QixJQUFJLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDLGtCQUFrQixDQUFDO1FBQ2xELFNBQVM7UUFDVCxJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7UUFDdEMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQU8sVUFBVTtJQUF2QjtRQUNrQixNQUFDLEdBQVcsSUFBSSxNQUFNLEVBQUUsQ0FBQztRQUNsQyxNQUFDLEdBQVcsQ0FBQyxDQUFDO0lBS3ZCLENBQUM7SUFIUSxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQWM7UUFDcEMsT0FBTyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBUyxFQUFjLEVBQUUsQ0FBQyxJQUFJLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDMUUsQ0FBQztDQUNGO0FBRUQsTUFBTSxPQUFPLFVBQVU7SUFBdkI7UUFDa0IsTUFBQyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDbEMsTUFBQyxHQUFXLENBQUMsQ0FBQztJQUt2QixDQUFDO0lBSFEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFjO1FBQ3BDLE9BQU8sV0FBVyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQVMsRUFBYyxFQUFFLENBQUMsSUFBSSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQzFFLENBQUM7Q0FDRjtBQUVELE1BQU0sT0FBTyxZQUFZO0lBQXpCO1FBQ2tCLFNBQUksR0FBZSxJQUFJLFVBQVUsRUFBRSxDQUFDO0lBR3RELENBQUM7Q0FBQSJ9