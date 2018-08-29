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
import { b2_maxManifoldPoints, b2MakeNumberArray } from "../Common/b2Settings";
import { b2BodyType } from "./b2Body";
// #endif
/// Joints and fixtures are destroyed when their associated
/// body is destroyed. Implement this listener so that you
/// may nullify references to these joints and shapes.
export class b2DestructionListener {
    /// Called when any joint is about to be destroyed due
    /// to the destruction of one of its attached bodies.
    SayGoodbyeJoint(joint) { }
    /// Called when any fixture is about to be destroyed due
    /// to the destruction of its parent body.
    SayGoodbyeFixture(fixture) { }
    // #if B2_ENABLE_PARTICLE
    /// Called when any particle group is about to be destroyed.
    SayGoodbyeParticleGroup(group) { }
    /// Called when a particle is about to be destroyed.
    /// The index can be used in conjunction with
    /// b2ParticleSystem::GetUserDataBuffer() or
    /// b2ParticleSystem::GetParticleHandleFromIndex() to determine which
    /// particle has been destroyed.
    SayGoodbyeParticle(system, index) { }
}
/// Implement this class to provide collision filtering. In other words, you can implement
/// this class if you want finer control over contact creation.
export class b2ContactFilter {
    /// Return true if contact calculations should be performed between these two shapes.
    /// @warning for performance reasons this is only called when the AABBs begin to overlap.
    ShouldCollide(fixtureA, fixtureB) {
        const bodyA = fixtureA.GetBody();
        const bodyB = fixtureB.GetBody();
        // At least one body should be dynamic or kinematic.
        if (bodyB.GetType() === b2BodyType.b2_staticBody && bodyA.GetType() === b2BodyType.b2_staticBody) {
            return false;
        }
        // Does a joint prevent collision?
        if (!bodyB.ShouldCollideConnected(bodyA)) {
            return false;
        }
        const filter1 = fixtureA.GetFilterData();
        const filter2 = fixtureB.GetFilterData();
        if (filter1.groupIndex === filter2.groupIndex && filter1.groupIndex !== 0) {
            return (filter1.groupIndex > 0);
        }
        const collide = (((filter1.maskBits & filter2.categoryBits) !== 0) && ((filter1.categoryBits & filter2.maskBits) !== 0));
        return collide;
    }
    // #if B2_ENABLE_PARTICLE
    ShouldCollideFixtureParticle(fixture, system, index) {
        return true;
    }
    ShouldCollideParticleParticle(system, indexA, indexB) {
        return true;
    }
}
// #endif
b2ContactFilter.b2_defaultFilter = new b2ContactFilter();
/// Contact impulses for reporting. Impulses are used instead of forces because
/// sub-step forces may approach infinity for rigid body collisions. These
/// match up one-to-one with the contact points in b2Manifold.
export class b2ContactImpulse {
    constructor() {
        this.normalImpulses = b2MakeNumberArray(b2_maxManifoldPoints);
        this.tangentImpulses = b2MakeNumberArray(b2_maxManifoldPoints);
        this.count = 0;
    }
}
/// Implement this class to get contact information. You can use these results for
/// things like sounds and game logic. You can also get contact results by
/// traversing the contact lists after the time step. However, you might miss
/// some contacts because continuous physics leads to sub-stepping.
/// Additionally you may receive multiple callbacks for the same contact in a
/// single time step.
/// You should strive to make your callbacks efficient because there may be
/// many callbacks per time step.
/// @warning You cannot create/destroy Box2D entities inside these callbacks.
export class b2ContactListener {
    /// Called when two fixtures begin to touch.
    BeginContact(contact) { }
    /// Called when two fixtures cease to touch.
    EndContact(contact) { }
    // #if B2_ENABLE_PARTICLE
    BeginContactFixtureParticle(system, contact) { }
    EndContactFixtureParticle(system, contact) { }
    BeginContactParticleParticle(system, contact) { }
    EndContactParticleParticle(system, contact) { }
    // #endif
    /// This is called after a contact is updated. This allows you to inspect a
    /// contact before it goes to the solver. If you are careful, you can modify the
    /// contact manifold (e.g. disable contact).
    /// A copy of the old manifold is provided so that you can detect changes.
    /// Note: this is called only for awake bodies.
    /// Note: this is called even when the number of contact points is zero.
    /// Note: this is not called for sensors.
    /// Note: if you set the number of contact points to zero, you will not
    /// get an EndContact callback. However, you may get a BeginContact callback
    /// the next step.
    PreSolve(contact, oldManifold) { }
    /// This lets you inspect a contact after the solver is finished. This is useful
    /// for inspecting impulses.
    /// Note: the contact manifold does not include time of impact impulses, which can be
    /// arbitrarily large if the sub-step is small. Hence the impulse is provided explicitly
    /// in a separate data structure.
    /// Note: this is only called for contacts that are touching, solid, and awake.
    PostSolve(contact, impulse) { }
}
b2ContactListener.b2_defaultListener = new b2ContactListener();
/// Callback class for AABB queries.
/// See b2World::Query
export class b2QueryCallback {
    /// Called for each fixture found in the query AABB.
    /// @return false to terminate the query.
    ReportFixture(fixture) {
        return true;
    }
    // #if B2_ENABLE_PARTICLE
    ReportParticle(system, index) {
        return false;
    }
    ShouldQueryParticleSystem(system) {
        return true;
    }
}
/// Callback class for ray casts.
/// See b2World::RayCast
export class b2RayCastCallback {
    /// Called for each fixture found in the query. You control how the ray cast
    /// proceeds by returning a float:
    /// return -1: ignore this fixture and continue
    /// return 0: terminate the ray cast
    /// return fraction: clip the ray to this point
    /// return 1: don't clip the ray and continue
    /// @param fixture the fixture hit by the ray
    /// @param point the point of initial intersection
    /// @param normal the normal vector at the point of intersection
    /// @return -1 to filter, 0 to terminate, fraction to clip the ray for
    /// closest hit, 1 to continue
    ReportFixture(fixture, point, normal, fraction) {
        return fraction;
    }
    // #if B2_ENABLE_PARTICLE
    ReportParticle(system, index, point, normal, fraction) {
        return 0;
    }
    ShouldQueryParticleSystem(system) {
        return true;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJXb3JsZENhbGxiYWNrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0R5bmFtaWNzL2IyV29ybGRDYWxsYmFja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRixPQUFPLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUkvRSxPQUFPLEVBQVUsVUFBVSxFQUFFLE1BQU0sVUFBVSxDQUFDO0FBTTlDLFNBQVM7QUFFVCwyREFBMkQ7QUFDM0QsMERBQTBEO0FBQzFELHNEQUFzRDtBQUN0RCxNQUFNLE9BQU8scUJBQXFCO0lBQ2hDLHNEQUFzRDtJQUN0RCxxREFBcUQ7SUFDOUMsZUFBZSxDQUFDLEtBQWMsSUFBUyxDQUFDO0lBRS9DLHdEQUF3RDtJQUN4RCwwQ0FBMEM7SUFDbkMsaUJBQWlCLENBQUMsT0FBa0IsSUFBUyxDQUFDO0lBRXJELHlCQUF5QjtJQUN6Qiw0REFBNEQ7SUFDckQsdUJBQXVCLENBQUMsS0FBc0IsSUFBUyxDQUFDO0lBRS9ELG9EQUFvRDtJQUNwRCw2Q0FBNkM7SUFDN0MsNENBQTRDO0lBQzVDLHFFQUFxRTtJQUNyRSxnQ0FBZ0M7SUFDekIsa0JBQWtCLENBQUMsTUFBd0IsRUFBRSxLQUFhLElBQVMsQ0FBQztDQUU1RTtBQUVELDBGQUEwRjtBQUMxRiwrREFBK0Q7QUFDL0QsTUFBTSxPQUFPLGVBQWU7SUFDMUIscUZBQXFGO0lBQ3JGLHlGQUF5RjtJQUNsRixhQUFhLENBQUMsUUFBbUIsRUFBRSxRQUFtQjtRQUMzRCxNQUFNLEtBQUssR0FBVyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDekMsTUFBTSxLQUFLLEdBQVcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBRXpDLG9EQUFvRDtRQUNwRCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxVQUFVLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxVQUFVLENBQUMsYUFBYSxFQUFFO1lBQ2hHLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFFRCxrQ0FBa0M7UUFDbEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUN4QyxPQUFPLEtBQUssQ0FBQztTQUNkO1FBRUQsTUFBTSxPQUFPLEdBQWEsUUFBUSxDQUFDLGFBQWEsRUFBRSxDQUFDO1FBQ25ELE1BQU0sT0FBTyxHQUFhLFFBQVEsQ0FBQyxhQUFhLEVBQUUsQ0FBQztRQUVuRCxJQUFJLE9BQU8sQ0FBQyxVQUFVLEtBQUssT0FBTyxDQUFDLFVBQVUsSUFBSSxPQUFPLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtZQUN6RSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNqQztRQUVELE1BQU0sT0FBTyxHQUFZLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xJLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCx5QkFBeUI7SUFDbEIsNEJBQTRCLENBQUMsT0FBa0IsRUFBRSxNQUF3QixFQUFFLEtBQWE7UUFDN0YsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBRU0sNkJBQTZCLENBQUMsTUFBd0IsRUFBRSxNQUFjLEVBQUUsTUFBYztRQUMzRixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7O0FBQ0QsU0FBUztBQUVjLGdDQUFnQixHQUFvQixJQUFJLGVBQWUsRUFBRSxDQUFDO0FBR25GLCtFQUErRTtBQUMvRSwwRUFBMEU7QUFDMUUsOERBQThEO0FBQzlELE1BQU0sT0FBTyxnQkFBZ0I7SUFBN0I7UUFDUyxtQkFBYyxHQUFhLGlCQUFpQixDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbkUsb0JBQWUsR0FBYSxpQkFBaUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBQ3BFLFVBQUssR0FBVyxDQUFDLENBQUM7SUFDM0IsQ0FBQztDQUFBO0FBRUQsa0ZBQWtGO0FBQ2xGLDBFQUEwRTtBQUMxRSw2RUFBNkU7QUFDN0UsbUVBQW1FO0FBQ25FLDZFQUE2RTtBQUM3RSxxQkFBcUI7QUFDckIsMkVBQTJFO0FBQzNFLGlDQUFpQztBQUNqQyw2RUFBNkU7QUFDN0UsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qiw0Q0FBNEM7SUFDckMsWUFBWSxDQUFDLE9BQWtCLElBQVMsQ0FBQztJQUVoRCw0Q0FBNEM7SUFDckMsVUFBVSxDQUFDLE9BQWtCLElBQVMsQ0FBQztJQUU5Qyx5QkFBeUI7SUFDbEIsMkJBQTJCLENBQUMsTUFBd0IsRUFBRSxPQUE4QixJQUFTLENBQUM7SUFDOUYseUJBQXlCLENBQUMsTUFBd0IsRUFBRSxPQUE4QixJQUFTLENBQUM7SUFDNUYsNEJBQTRCLENBQUMsTUFBd0IsRUFBRSxPQUEwQixJQUFTLENBQUM7SUFDM0YsMEJBQTBCLENBQUMsTUFBd0IsRUFBRSxPQUEwQixJQUFTLENBQUM7SUFDaEcsU0FBUztJQUVULDJFQUEyRTtJQUMzRSxnRkFBZ0Y7SUFDaEYsNENBQTRDO0lBQzVDLDBFQUEwRTtJQUMxRSwrQ0FBK0M7SUFDL0Msd0VBQXdFO0lBQ3hFLHlDQUF5QztJQUN6Qyx1RUFBdUU7SUFDdkUsNEVBQTRFO0lBQzVFLGtCQUFrQjtJQUNYLFFBQVEsQ0FBQyxPQUFrQixFQUFFLFdBQXVCLElBQVMsQ0FBQztJQUVyRSxnRkFBZ0Y7SUFDaEYsNEJBQTRCO0lBQzVCLHFGQUFxRjtJQUNyRix3RkFBd0Y7SUFDeEYsaUNBQWlDO0lBQ2pDLCtFQUErRTtJQUN4RSxTQUFTLENBQUMsT0FBa0IsRUFBRSxPQUF5QixJQUFTLENBQUM7O0FBRWpELG9DQUFrQixHQUFzQixJQUFJLGlCQUFpQixFQUFFLENBQUM7QUFHekYsb0NBQW9DO0FBQ3BDLHNCQUFzQjtBQUN0QixNQUFNLE9BQU8sZUFBZTtJQUMxQixvREFBb0Q7SUFDcEQseUNBQXlDO0lBQ2xDLGFBQWEsQ0FBQyxPQUFrQjtRQUNyQyxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRCx5QkFBeUI7SUFDbEIsY0FBYyxDQUFDLE1BQXdCLEVBQUUsS0FBYTtRQUMzRCxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFDTSx5QkFBeUIsQ0FBQyxNQUF3QjtRQUN2RCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FFRjtBQUlELGlDQUFpQztBQUNqQyx3QkFBd0I7QUFDeEIsTUFBTSxPQUFPLGlCQUFpQjtJQUM1Qiw0RUFBNEU7SUFDNUUsa0NBQWtDO0lBQ2xDLCtDQUErQztJQUMvQyxvQ0FBb0M7SUFDcEMsK0NBQStDO0lBQy9DLDZDQUE2QztJQUM3Qyw2Q0FBNkM7SUFDN0Msa0RBQWtEO0lBQ2xELGdFQUFnRTtJQUNoRSxzRUFBc0U7SUFDdEUsOEJBQThCO0lBQ3ZCLGFBQWEsQ0FBQyxPQUFrQixFQUFFLEtBQWEsRUFBRSxNQUFjLEVBQUUsUUFBZ0I7UUFDdEYsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUVELHlCQUF5QjtJQUNsQixjQUFjLENBQUMsTUFBd0IsRUFBRSxLQUFhLEVBQUUsS0FBYSxFQUFFLE1BQWMsRUFBRSxRQUFnQjtRQUM1RyxPQUFPLENBQUMsQ0FBQztJQUNYLENBQUM7SUFDTSx5QkFBeUIsQ0FBQyxNQUF3QjtRQUN2RCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FFRiJ9