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
// DEBUG: import { b2Assert } from "../Common/b2Settings";
import { b2BroadPhase } from "../Collision/b2BroadPhase";
import { b2TestOverlapAABB } from "../Collision/b2Collision";
import { b2ContactFactory } from "./Contacts/b2ContactFactory";
import { b2BodyType } from "./b2Body";
import { b2ContactFilter, b2ContactListener } from "./b2WorldCallbacks";
// Delegate of b2World.
export class b2ContactManager {
    constructor() {
        this.m_broadPhase = new b2BroadPhase();
        this.m_contactList = null;
        this.m_contactCount = 0;
        this.m_contactFilter = b2ContactFilter.b2_defaultFilter;
        this.m_contactListener = b2ContactListener.b2_defaultListener;
        this.m_allocator = null;
        this.m_contactFactory = new b2ContactFactory(this.m_allocator);
    }
    // Broad-phase callback.
    AddPair(proxyA, proxyB) {
        // DEBUG: b2Assert(proxyA instanceof b2FixtureProxy);
        // DEBUG: b2Assert(proxyB instanceof b2FixtureProxy);
        let fixtureA = proxyA.fixture;
        let fixtureB = proxyB.fixture;
        let indexA = proxyA.childIndex;
        let indexB = proxyB.childIndex;
        let bodyA = fixtureA.GetBody();
        let bodyB = fixtureB.GetBody();
        // Are the fixtures on the same body?
        if (bodyA === bodyB) {
            return;
        }
        // TODO_ERIN use a hash table to remove a potential bottleneck when both
        // bodies have a lot of contacts.
        // Does a contact already exist?
        let edge = bodyB.GetContactList();
        while (edge) {
            if (edge.other === bodyA) {
                const fA = edge.contact.GetFixtureA();
                const fB = edge.contact.GetFixtureB();
                const iA = edge.contact.GetChildIndexA();
                const iB = edge.contact.GetChildIndexB();
                if (fA === fixtureA && fB === fixtureB && iA === indexA && iB === indexB) {
                    // A contact already exists.
                    return;
                }
                if (fA === fixtureB && fB === fixtureA && iA === indexB && iB === indexA) {
                    // A contact already exists.
                    return;
                }
            }
            edge = edge.next;
        }
        // Check user filtering.
        if (this.m_contactFilter && !this.m_contactFilter.ShouldCollide(fixtureA, fixtureB)) {
            return;
        }
        // Call the factory.
        const c = this.m_contactFactory.Create(fixtureA, indexA, fixtureB, indexB);
        if (c === null) {
            return;
        }
        // Contact creation may swap fixtures.
        fixtureA = c.GetFixtureA();
        fixtureB = c.GetFixtureB();
        indexA = c.GetChildIndexA();
        indexB = c.GetChildIndexB();
        bodyA = fixtureA.m_body;
        bodyB = fixtureB.m_body;
        // Insert into the world.
        c.m_prev = null;
        c.m_next = this.m_contactList;
        if (this.m_contactList !== null) {
            this.m_contactList.m_prev = c;
        }
        this.m_contactList = c;
        // Connect to island graph.
        // Connect to body A
        c.m_nodeA.contact = c;
        c.m_nodeA.other = bodyB;
        c.m_nodeA.prev = null;
        c.m_nodeA.next = bodyA.m_contactList;
        if (bodyA.m_contactList !== null) {
            bodyA.m_contactList.prev = c.m_nodeA;
        }
        bodyA.m_contactList = c.m_nodeA;
        // Connect to body B
        c.m_nodeB.contact = c;
        c.m_nodeB.other = bodyA;
        c.m_nodeB.prev = null;
        c.m_nodeB.next = bodyB.m_contactList;
        if (bodyB.m_contactList !== null) {
            bodyB.m_contactList.prev = c.m_nodeB;
        }
        bodyB.m_contactList = c.m_nodeB;
        // Wake up the bodies
        if (!fixtureA.IsSensor() && !fixtureB.IsSensor()) {
            bodyA.SetAwake(true);
            bodyB.SetAwake(true);
        }
        ++this.m_contactCount;
    }
    FindNewContacts() {
        this.m_broadPhase.UpdatePairs((proxyA, proxyB) => {
            this.AddPair(proxyA, proxyB);
        });
    }
    Destroy(c) {
        const fixtureA = c.GetFixtureA();
        const fixtureB = c.GetFixtureB();
        const bodyA = fixtureA.GetBody();
        const bodyB = fixtureB.GetBody();
        if (this.m_contactListener && c.IsTouching()) {
            this.m_contactListener.EndContact(c);
        }
        // Remove from the world.
        if (c.m_prev) {
            c.m_prev.m_next = c.m_next;
        }
        if (c.m_next) {
            c.m_next.m_prev = c.m_prev;
        }
        if (c === this.m_contactList) {
            this.m_contactList = c.m_next;
        }
        // Remove from body 1
        if (c.m_nodeA.prev) {
            c.m_nodeA.prev.next = c.m_nodeA.next;
        }
        if (c.m_nodeA.next) {
            c.m_nodeA.next.prev = c.m_nodeA.prev;
        }
        if (c.m_nodeA === bodyA.m_contactList) {
            bodyA.m_contactList = c.m_nodeA.next;
        }
        // Remove from body 2
        if (c.m_nodeB.prev) {
            c.m_nodeB.prev.next = c.m_nodeB.next;
        }
        if (c.m_nodeB.next) {
            c.m_nodeB.next.prev = c.m_nodeB.prev;
        }
        if (c.m_nodeB === bodyB.m_contactList) {
            bodyB.m_contactList = c.m_nodeB.next;
        }
        // Call the factory.
        this.m_contactFactory.Destroy(c);
        --this.m_contactCount;
    }
    // This is the top level collision call for the time step. Here
    // all the narrow phase collision is processed for the world
    // contact list.
    Collide() {
        // Update awake contacts.
        let c = this.m_contactList;
        while (c) {
            const fixtureA = c.GetFixtureA();
            const fixtureB = c.GetFixtureB();
            const indexA = c.GetChildIndexA();
            const indexB = c.GetChildIndexB();
            const bodyA = fixtureA.GetBody();
            const bodyB = fixtureB.GetBody();
            // Is this contact flagged for filtering?
            if (c.m_filterFlag) {
                // Check user filtering.
                if (this.m_contactFilter && !this.m_contactFilter.ShouldCollide(fixtureA, fixtureB)) {
                    const cNuke = c;
                    c = cNuke.m_next;
                    this.Destroy(cNuke);
                    continue;
                }
                // Clear the filtering flag.
                c.m_filterFlag = false;
            }
            const activeA = bodyA.IsAwake() && bodyA.m_type !== b2BodyType.b2_staticBody;
            const activeB = bodyB.IsAwake() && bodyB.m_type !== b2BodyType.b2_staticBody;
            // At least one body must be awake and it must be dynamic or kinematic.
            if (!activeA && !activeB) {
                c = c.m_next;
                continue;
            }
            const proxyA = fixtureA.m_proxies[indexA].treeNode;
            const proxyB = fixtureB.m_proxies[indexB].treeNode;
            const overlap = b2TestOverlapAABB(proxyA.aabb, proxyB.aabb);
            // Here we destroy contacts that cease to overlap in the broad-phase.
            if (!overlap) {
                const cNuke = c;
                c = cNuke.m_next;
                this.Destroy(cNuke);
                continue;
            }
            // The contact persists.
            c.Update(this.m_contactListener);
            c = c.m_next;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJDb250YWN0TWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0R5bmFtaWNzL2IyQ29udGFjdE1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRiwwREFBMEQ7QUFDMUQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRXpELE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRTdELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLDZCQUE2QixDQUFDO0FBQy9ELE9BQU8sRUFBVSxVQUFVLEVBQUUsTUFBTSxVQUFVLENBQUM7QUFFOUMsT0FBTyxFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBRXhFLHVCQUF1QjtBQUN2QixNQUFNLE9BQU8sZ0JBQWdCO0lBVTNCO1FBVGdCLGlCQUFZLEdBQWlDLElBQUksWUFBWSxFQUFrQixDQUFDO1FBQ3pGLGtCQUFhLEdBQXFCLElBQUksQ0FBQztRQUN2QyxtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUMzQixvQkFBZSxHQUFvQixlQUFlLENBQUMsZ0JBQWdCLENBQUM7UUFDcEUsc0JBQWlCLEdBQXNCLGlCQUFpQixDQUFDLGtCQUFrQixDQUFDO1FBQzVFLGdCQUFXLEdBQVEsSUFBSSxDQUFDO1FBSzdCLElBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNqRSxDQUFDO0lBRUQsd0JBQXdCO0lBQ2pCLE9BQU8sQ0FBQyxNQUFzQixFQUFFLE1BQXNCO1FBQzNELHFEQUFxRDtRQUNyRCxxREFBcUQ7UUFFckQsSUFBSSxRQUFRLEdBQWMsTUFBTSxDQUFDLE9BQU8sQ0FBQztRQUN6QyxJQUFJLFFBQVEsR0FBYyxNQUFNLENBQUMsT0FBTyxDQUFDO1FBRXpDLElBQUksTUFBTSxH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