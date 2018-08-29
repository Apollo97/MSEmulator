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
import { b2_linearSlop } from "../../Common/b2Settings";
import { b2Sqrt } from "../../Common/b2Math";
import { b2Manifold } from "../../Collision/b2Collision";
import { b2TestOverlapShape } from "../../Collision/b2Collision";
import { b2TimeOfImpact, b2TOIInput, b2TOIOutput } from "../../Collision/b2TimeOfImpact";
/// Friction mixing law. The idea is to allow either fixture to drive the friction to zero.
/// For example, anything slides on ice.
export function b2MixFriction(friction1, friction2) {
    return b2Sqrt(friction1 * friction2);
}
/// Restitution mixing law. The idea is allow for anything to bounce off an inelastic surface.
/// For example, a superball bounces on anything.
export function b2MixRestitution(restitution1, restitution2) {
    return restitution1 > restitution2 ? restitution1 : restitution2;
}
export class b2ContactEdge {
    constructor(contact) {
        this.prev = null; ///< the previous contact edge in the body's contact list
        this.next = null; ///< the next contact edge in the body's contact list
        this.contact = contact;
    }
}
export class b2Contact {
    constructor() {
        this.m_islandFlag = false; /// Used when crawling contact graph when forming islands.
        this.m_touchingFlag = false; /// Set when the shapes are touching.
        this.m_enabledFlag = false; /// This contact can be disabled (by user)
        this.m_filterFlag = false; /// This contact needs filtering because a fixture filter was changed.
        this.m_bulletHitFlag = false; /// This bullet contact had a TOI event
        this.m_toiFlag = false; /// This contact has a valid TOI in m_toi
        this.m_prev = null;
        this.m_next = null;
        this.m_indexA = 0;
        this.m_indexB = 0;
        this.m_manifold = new b2Manifold(); // TODO: readonly
        this.m_toiCount = 0;
        this.m_toi = 0;
        this.m_friction = 0;
        this.m_restitution = 0;
        this.m_tangentSpeed = 0;
        this.m_oldManifold = new b2Manifold(); // TODO: readonly
        this.m_nodeA = new b2ContactEdge(this);
        this.m_nodeB = new b2ContactEdge(this);
    }
    GetManifold() {
        return this.m_manifold;
    }
    GetWorldManifold(worldManifold) {
        const bodyA = this.m_fixtureA.GetBody();
        const bodyB = this.m_fixtureB.GetBody();
        const shapeA = this.m_fixtureA.GetShape();
        const shapeB = this.m_fixtureB.GetShape();
        worldManifold.Initialize(this.m_manifold, bodyA.GetTransform(), shapeA.m_radius, bodyB.GetTransform(), shapeB.m_radius);
    }
    IsTouching() {
        return this.m_touchingFlag;
    }
    SetEnabled(flag) {
        this.m_enabledFlag = flag;
    }
    IsEnabled() {
        return this.m_enabledFlag;
    }
    GetNext() {
        return this.m_next;
    }
    GetFixtureA() {
        return this.m_fixtureA;
    }
    GetChildIndexA() {
        return this.m_indexA;
    }
    GetFixtureB() {
        return this.m_fixtureB;
    }
    GetChildIndexB() {
        return this.m_indexB;
    }
    FlagForFiltering() {
        this.m_filterFlag = true;
    }
    SetFriction(friction) {
        this.m_friction = friction;
    }
    GetFriction() {
        return this.m_friction;
    }
    ResetFriction() {
        this.m_friction = b2MixFriction(this.m_fixtureA.m_friction, this.m_fixtureB.m_friction);
    }
    SetRestitution(restitution) {
        this.m_restitution = restitution;
    }
    GetRestitution() {
        return this.m_restitution;
    }
    ResetRestitution() {
        this.m_restitution = b2MixRestitution(this.m_fixtureA.m_restitution, this.m_fixtureB.m_restitution);
    }
    SetTangentSpeed(speed) {
        this.m_tangentSpeed = speed;
    }
    GetTangentSpeed() {
        return this.m_tangentSpeed;
    }
    Reset(fixtureA, indexA, fixtureB, indexB) {
        this.m_islandFlag = false;
        this.m_touchingFlag = false;
        this.m_enabledFlag = true;
        this.m_filterFlag = false;
        this.m_bulletHitFlag = false;
        this.m_toiFlag = false;
        this.m_fixtureA = fixtureA;
        this.m_fixtureB = fixtureB;
        this.m_indexA = indexA;
        this.m_indexB = indexB;
        this.m_manifold.pointCount = 0;
        this.m_prev = null;
        this.m_next = null;
        delete this.m_nodeA.contact; // = null;
        this.m_nodeA.prev = null;
        this.m_nodeA.next = null;
        delete this.m_nodeA.other; // = null;
        delete this.m_nodeB.contact; // = null;
        this.m_nodeB.prev = null;
        this.m_nodeB.next = null;
        delete this.m_nodeB.other; // = null;
        this.m_toiCount = 0;
        this.m_friction = b2MixFriction(this.m_fixtureA.m_friction, this.m_fixtureB.m_friction);
        this.m_restitution = b2MixRestitution(this.m_fixtureA.m_restitution, this.m_fixtureB.m_restitution);
    }
    Update(listener) {
        const tManifold = this.m_oldManifold;
        this.m_oldManifold = this.m_manifold;
        this.m_manifold = tManifold;
        // Re-enable this contact.
        this.m_enabledFlag = true;
        let touching = false;
        const wasTouching = this.m_touchingFlag;
        const sensorA = this.m_fixtureA.IsSensor();
        const sensorB = this.m_fixtureB.IsSensor();
        const sensor = sensorA || sensorB;
        const bodyA = this.m_fixtureA.GetBody();
        const bodyB = this.m_fixtureB.GetBody();
        const xfA = bodyA.GetTransform();
        const xfB = bodyB.GetTransform();
        ///const aabbOverlap = b2TestOverlapAABB(this.m_fixtureA.GetAABB(0), this.m_fixtureB.GetAABB(0));
        // Is this contact a sensor?
        if (sensor) {
            ///if (aabbOverlap)
            ///{
            const shapeA = this.m_fixtureA.GetShape();
            const shapeB = this.m_fixtureB.GetShape();
            touching = b2TestOverlapShape(shapeA, this.m_indexA, shapeB, this.m_indexB, xfA, xfB);
            ///}
            // Sensors don't generate manifolds.
            this.m_manifold.pointCount = 0;
        }
        else {
            ///if (aabbOverlap)
            ///{
            this.Evaluate(this.m_manifold, xfA, xfB);
            touching = this.m_manifold.pointCount > 0;
            // Match old contact ids to new contact ids and copy the
            // stored impulses to warm start the solver.
            for (let i = 0; i < this.m_manifold.pointCount; ++i) {
                const mp2 = this.m_manifold.points[i];
                mp2.normalImpulse = 0;
                mp2.tangentImpulse = 0;
                const id2 = mp2.id;
                for (let j = 0; j < this.m_oldManifold.pointCount; ++j) {
                    const mp1 = this.m_oldManifold.points[j];
                    if (mp1.id.key === id2.key) {
                        mp2.normalImpulse = mp1.normalImpulse;
                        mp2.tangentImpulse = mp1.tangentImpulse;
                        break;
                    }
                }
            }
            ///}
            ///else
            ///{
            ///  this.m_manifold.pointCount = 0;
            ///}
            if (touching !== wasTouching) {
                bodyA.SetAwake(true);
                bodyB.SetAwake(true);
            }
        }
        this.m_touchingFlag = touching;
        if (!wasTouching && touching && listener) {
            listener.BeginContact(this);
        }
        if (wasTouching && !touching && listener) {
            listener.EndContact(this);
        }
        if (!sensor && touching && listener) {
            listener.PreSolve(this, this.m_oldManifold);
        }
    }
    ComputeTOI(sweepA, sweepB) {
        const input = b2Contact.ComputeTOI_s_input;
        input.proxyA.SetShape(this.m_fixtureA.GetShape(), this.m_indexA);
        input.proxyB.SetShape(this.m_fixtureB.GetShape(), this.m_indexB);
        input.sweepA.Copy(sweepA);
        input.sweepB.Copy(sweepB);
        input.tMax = b2_linearSlop;
        const output = b2Contact.ComputeTOI_s_output;
        b2TimeOfImpact(output, input);
        return output.t;
    }
}
b2Contact.ComputeTOI_s_input = new b2TOIInput();
b2Contact.ComputeTOI_s_output = new b2TOIOutput();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb250YWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vQm94MkQvRHluYW1pY3MvQ29udGFjdHMvYjJDb250YWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ3hELE9BQU8sRUFBRSxNQUFNLEVBQXdCLE1BQU0scUJBQXFCLENBQUM7QUFDbkUsT0FBTyxFQUFFLFVBQVUsRUFBaUQsTUFBTSw2QkFBNkIsQ0FBQztBQUN4RyxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQU16RiwyRkFBMkY7QUFDM0Ysd0NBQXdDO0FBQ3hDLE1BQU0sVUFBVSxhQUFhLENBQUMsU0FBaUIsRUFBRSxTQUFpQjtJQUNoRSxPQUFPLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLENBQUM7QUFDdkMsQ0FBQztBQUVELDhGQUE4RjtBQUM5RixpREFBaUQ7QUFDakQsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFlBQW9CLEVBQUUsWUFBb0I7SUFDekUsT0FBTyxZQUFZLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQztBQUNuRSxDQUFDO0FBRUQsTUFBTSxPQUFPLGFBQWE7SUFLeEIsWUFBWSxPQUFrQjtRQUZ2QixTQUFJLEdBQXlCLElBQUksQ0FBQyxDQUFDLHlEQUF5RDtRQUM1RixTQUFJLEdBQXlCLElBQUksQ0FBQyxDQUFDLHFEQUFxRDtRQUU3RixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztJQUN6QixDQUFDO0NBQ0Y7QUFFRCxNQUFNLE9BQWdCLFNBQVM7SUFnQzdCO1FBL0JPLGlCQUFZLEdBQVksS0FBSyxDQUFDLENB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