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
System.register(["../Common/b2Settings", "./b2Body"], function (exports_1, context_1) {
    "use strict";
    var b2Settings_1, b2Body_1, b2DestructionListener, b2ContactFilter, b2ContactImpulse, b2ContactListener, b2QueryCallback, b2RayCastCallback;
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [
            function (b2Settings_1_1) {
                b2Settings_1 = b2Settings_1_1;
            },
            function (b2Body_1_1) {
                b2Body_1 = b2Body_1_1;
            }
        ],
        execute: function () {
            // #endif
            /// Joints and fixtures are destroyed when their associated
            /// body is destroyed. Implement this listener so that you
            /// may nullify references to these joints and shapes.
            b2DestructionListener = class b2DestructionListener {
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
            };
            exports_1("b2DestructionListener", b2DestructionListener);
            /// Implement this class to provide collision filtering. In other words, you can implement
            /// this class if you want finer control over contact creation.
            b2ContactFilter = class b2ContactFilter {
                /// Return true if contact calculations should be performed between these two shapes.
                /// @warning for performance reasons this is only called when the AABBs begin to overlap.
                ShouldCollide(fixtureA, fixtureB) {
                    const bodyA = fixtureA.GetBody();
                    const bodyB = fixtureB.GetBody();
                    // At least one body should be dynamic or kinematic.
                    if (bodyB.GetType() === b2Body_1.b2BodyType.b2_staticBody && bodyA.GetType() === b2Body_1.b2BodyType.b2_staticBody) {
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
            };
            // #endif
            b2ContactFilter.b2_defaultFilter = new b2ContactFilter();
            exports_1("b2ContactFilter", b2ContactFilter);
            /// Contact impulses for reporting. Impulses are used instead of forces because
            /// sub-step forces may approach infinity for rigid body collisions. These
            /// match up one-to-one with the contact points in b2Manifold.
            b2ContactImpulse = class b2ContactImpulse {
                constructor() {
                    this.normalImpulses = b2Settings_1.b2MakeNumberArray(b2Settings_1.b2_maxManifoldPoints);
                    this.tangentImpulses = b2Settings_1.b2MakeNumberArray(b2Settings_1.b2_maxManifoldPoints);
                    this.count = 0;
                }
            };
            exports_1("b2ContactImpulse", b2ContactImpulse);
            /// Implement this class to get contact information. You can use these results for
            /// things like sounds and game logic. You can also get contact results by
            /// traversing the contact lists after the time step. However, you might miss
            /// some contacts because continuous physics leads to sub-stepping.
            /// Additionally you may receive multiple callbacks for the same contact in a
            /// single time step.
            /// You should strive to make your callbacks efficient because there may be
            /// many callbacks per time step.
            /// @warning You cannot create/destroy Box2D entities inside these callbacks.
            b2ContactListener = class b2ContactListener {
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
            };
            b2ContactListener.b2_defaultListener = new b2ContactListener();
            exports_1("b2ContactListener", b2ContactListener);
            /// Callback class for AABB queries.
            /// See b2World::Query
            b2QueryCallback = class b2QueryCallback {
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
            };
            exports_1("b2QueryCallback", b2QueryCallback);
            /// Callback class for ray casts.
            /// See b2World::RayCast
            b2RayCastCallback = class b2RayCastCallback {
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
            };
            exports_1("b2RayCastCallback", b2RayCastCallback);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJXb3JsZENhbGxiYWNrcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0JveDJEL0R5bmFtaWNzL2IyV29ybGRDYWxsYmFja3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7Ozs7Ozs7Ozs7Ozs7OztZQVlGLFNBQVM7WUFFVCwyREFBMkQ7WUFDM0QsMERBQTBEO1lBQzFELHNEQUFzRDtZQUN0RCx3QkFBQTtnQkFDRSxzREFBc0Q7Z0JBQ3RELHFEQUFxRDtnQkFDOUMsZUFBZSxDQUFDLEtBQWMsSUFBUyxDQUFDO2dCQUUvQyx3REFBd0Q7Z0JBQ3hELDBDQUEwQztnQkFDbkMsaUJBQWlCLENBQUMsT0FBa0IsSUFBUyxDQUFDO2dCQUVyRCx5QkFBeUI7Z0JBQ3pCLDREQUE0RDtnQkFDckQsdUJBQXVCLENBQUMsS0FBc0IsSUFBUyxDQUFDO2dCQUUvRCxvREFBb0Q7Z0JBQ3BELDZDQUE2QztnQkFDN0MsNENBQTRDO2dCQUM1QyxxRUFBcUU7Z0JBQ3JFLGdDQUFnQztnQkFDekIsa0JBQWtCLENBQUMsTUFBd0IsRUFBRSxLQUFhLElBQVMsQ0FBQzthQUU1RSxDQUFBOztZQUVELDBGQUEwRjtZQUMxRiwrREFBK0Q7WUFDL0Qsa0JBQUE7Z0JBQ0UscUZBQXFGO2dCQUNyRix5RkFBeUY7Z0JBQ2xGLGFBQWEsQ0FBQyxRQUFtQixFQUFFLFFBQW1CO29CQUMzRCxNQUFNLEtBQUssR0FBVyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUM7b0JBQ3pDLE1BQU0sS0FBSyxHQUFXLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFFekMsb0RBQW9EO29CQUNwRCxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUUsS0FBSyxtQkFBVSxDQUFDLGFBQWEsSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLEtBQUssbUJBQVUsQ0FBQyxhQUFhLEVBQUU7d0JBQ2hHLE9BQU8sS0FBSyxDQUFDO3FCQUNkO29CQUVELGtDQUFr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