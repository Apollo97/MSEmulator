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
import { b2MakeArray, b2Maybe } from "../Common/b2Settings";
import { b2Vec2 } from "../Common/b2Math";
import { b2AABB } from "../Collision/b2Collision";
import { b2MassData } from "../Collision/Shapes/b2Shape";
/// This holds contact filtering data.
export class b2Filter {
    constructor() {
        /// The collision category bits. Normally you would just set one bit.
        this.categoryBits = 0x0001;
        /// The collision mask bits. This states the categories that this
        /// shape would accept for collision.
        this.maskBits = 0xFFFF;
        /// Collision groups allow a certain group of objects to never collide (negative)
        /// or always collide (positive). Zero means no collision group. Non-zero group
        /// filtering always wins against the mask bits.
        this.groupIndex = 0;
    }
    Clone() {
        return new b2Filter().Copy(this);
    }
    Copy(other) {
        // DEBUG: b2Assert(this !== other);
        this.categoryBits = other.categoryBits;
        this.maskBits = other.maskBits;
        this.groupIndex = other.groupIndex || 0;
        return this;
    }
}
b2Filter.DEFAULT = new b2Filter();
/// A fixture definition is used to create a fixture. This class defines an
/// abstract fixture definition. You can reuse fixture definitions safely.
export class b2FixtureDef {
    constructor() {
        /// Use this to store application specific fixture data.
        this.userData = null;
        /// The friction coefficient, usually in the range [0,1].
        this.friction = 0.2;
        /// The restitution (elasticity) usually in the range [0,1].
        this.restitution = 0;
        /// The density, usually in kg/m^2.
        this.density = 0;
        /// A sensor shape collects contact information but never generates a collision
        /// response.
        this.isSensor = false;
        /// Contact filtering data.
        this.filter = new b2Filter();
    }
}
/// This proxy is used internally to connect fixtures to the broad-phase.
export class b2FixtureProxy {
    constructor(fixture) {
        this.aabb = new b2AABB();
        this.childIndex = 0;
        this.fixture = fixture;
    }
}
/// A fixture is used to attach a shape to a body for collision detection. A fixture
/// inherits its transform from its parent. Fixtures hold additional non-geometric data
/// such as friction, collision filters, etc.
/// Fixtures are created via b2Body::CreateFixture.
/// @warning you cannot reuse fixtures.
export class b2Fixture {
    constructor(def, body) {
        this.m_density = 0;
        this.m_next = null;
        this.m_friction = 0;
        this.m_restitution = 0;
        this.m_proxies = [];
        this.m_proxyCount = 0;
        this.m_filter = new b2Filter();
        this.m_isSensor = false;
        this.m_userData = null;
        this.m_body = body;
        this.m_shape = def.shape.Clone();
    }
    /// Get the type of the child shape. You can use this to down cast to the concrete shape.
    /// @return the shape type.
    GetType() {
        return this.m_shape.GetType();
    }
    /// Get the child shape. You can modify the child shape, however you should not change the
    /// number of vertices because this will crash some collision caching mechanisms.
    /// Manipulating the shape may lead to non-physical behavior.
    GetShape() {
        return this.m_shape;
    }
    /// Set if this fixture is a sensor.
    SetSensor(sensor) {
        if (sensor !== this.m_isSensor) {
            this.m_body.SetAwake(true);
            this.m_isSensor = sensor;
        }
    }
    /// Is this fixture a sensor (non-solid)?
    /// @return the true if the shape is a sensor.
    IsSensor() {
        return this.m_isSensor;
    }
    /// Set the contact filtering data. This will not update contacts until the next time
    /// step when either parent body is active and awake.
    /// This automatically calls Refilter.
    SetFilterData(filter) {
        this.m_filter.Copy(filter);
        this.Refilter();
    }
    /// Get the contact filtering data.
    GetFilterData() {
        return this.m_filter;
    }
    /// Call this if you want to establish collision that was previously disabled by b2ContactFilter::ShouldCollide.
    Refilter() {
        // Flag associated contacts for filtering.
        let edge = this.m_body.GetContactList();
        while (edge) {
            const contact = edge.contact;
            const fixtureA = contact.GetFixtureA();
            const fixtureB = contact.GetFixtureB();
            if (fixtureA === this || fixtureB === this) {
                contact.FlagForFiltering();
            }
            edge = edge.next;
        }
        const world = this.m_body.GetWorld();
        if (world === null) {
            return;
        }
        // Touch each proxy so that new pairs may be created
        const broadPhase = world.m_contactManager.m_broadPhase;
        for (let i = 0; i < this.m_proxyCount; ++i) {
            broadPhase.TouchProxy(this.m_proxies[i].treeNode);
        }
    }
    /// Get the parent body of this fixture. This is NULL if the fixture is not attached.
    /// @return the parent body.
    GetBody() {
        return this.m_body;
    }
    /// Get the next fixture in the parent body's fixture list.
    /// @return the next shape.
    GetNext() {
        return this.m_next;
    }
    /// Get the user data that was assigned in the fixture definition. Use this to
    /// store your application specific data.
    GetUserData() {
        return this.m_userData;
    }
    /// Set the user data. Use this to store your application specific data.
    SetUserData(data) {
        this.m_userData = data;
    }
    /// Test a point for containment in this fixture.
    /// @param p a point in world coordinates.
    TestPoint(p) {
        return this.m_shape.TestPoint(this.m_body.GetTransform(), p);
    }
    // #if B2_ENABLE_PARTICLE
    ComputeDistance(p, normal, childIndex) {
        return this.m_shape.ComputeDistance(this.m_body.GetTransform(), p, normal, childIndex);
    }
    // #endif
    /// Cast a ray against this shape.
    /// @param output the ray-cast results.
    /// @param input the ray-cast input parameters.
    RayCast(output, input, childIndex) {
        return this.m_shape.RayCast(output, input, this.m_body.GetTransform(), childIndex);
    }
    /// Get the mass data for this fixture. The mass data is based on the density and
    /// the shape. The rotational inertia is about the shape's origin. This operation
    /// may be expensive.
    GetMassData(massData = new b2MassData()) {
        this.m_shape.ComputeMass(massData, this.m_density);
        return massData;
    }
    /// Set the density of this fixture. This will _not_ automatically adjust the mass
    /// of the body. You must call b2Body::ResetMassData to update the body's mass.
    SetDensity(density) {
        this.m_density = density;
    }
    /// Get the density of this fixture.
    GetDensity() {
        return this.m_density;
    }
    /// Get the coefficient of friction.
    GetFriction() {
        return this.m_friction;
    }
    /// Set the coefficient of friction. This will _not_ change the friction of
    /// existing contacts.
    SetFriction(friction) {
        this.m_friction = friction;
    }
    /// Get the coefficient of restitution.
    GetRestitution() {
        return this.m_restitution;
    }
    /// Set the coefficient of restitution. This will _not_ change the restitution of
    /// existing contacts.
    SetRestitution(restitution) {
        this.m_restitution = restitution;
    }
    /// Get the fixture's AABB. This AABB may be enlarge and/or stale.
    /// If you need a more accurate AABB, compute it using the shape and
    /// the body transform.
    GetAABB(childIndex) {
        // DEBUG: b2Assert(0 <= childIndex && childIndex < this.m_proxyCount);
        return this.m_proxies[childIndex].aabb;
    }
    /// Dump this fixture to the log file.
    Dump(log, bodyIndex) {
        log("    const fd: b2FixtureDef = new b2FixtureDef();\n");
        log("    fd.friction = %.15f;\n", this.m_friction);
        log("    fd.restitution = %.15f;\n", this.m_restitution);
        log("    fd.density = %.15f;\n", this.m_density);
        log("    fd.isSensor = %s;\n", (this.m_isSensor) ? ("true") : ("false"));
        log("    fd.filter.categoryBits = %d;\n", this.m_filter.categoryBits);
        log("    fd.filter.maskBits = %d;\n", this.m_filter.maskBits);
        log("    fd.filter.groupIndex = %d;\n", this.m_filter.groupIndex);
        this.m_shape.Dump(log);
        log("\n");
        log("    fd.shape = shape;\n");
        log("\n");
        log("    bodies[%d].CreateFixture(fd);\n", bodyIndex);
    }
    // We need separation create/destroy functions from the constructor/destructor because
    // the destructor cannot access the allocator (no destructor arguments allowed by C++).
    Create(def) {
        this.m_userData = def.userData;
        this.m_friction = b2Maybe(def.friction, 0.2);
        this.m_restitution = b2Maybe(def.restitution, 0);
        // this.m_body = body;
        this.m_next = null;
        this.m_filter.Copy(b2Maybe(def.filter, b2Filter.DEFAULT));
        this.m_isSensor = b2Maybe(def.isSensor, false);
        // Reserve proxy space
        // const childCount = m_shape->GetChildCount();
        // m_proxies = (b2FixtureProxy*)allocator->Allocate(childCount * sizeof(b2FixtureProxy));
        // for (int32 i = 0; i < childCount; ++i)
        // {
        //   m_proxies[i].fixture = NULL;
        //   m_proxies[i].proxyId = b2BroadPhase::e_nullProxy;
        // }
        // this.m_proxies = b2FixtureProxy.MakeArray(this.m_shape.GetChildCount());
        this.m_proxies = b2MakeArray(this.m_shape.GetChildCount(), (i) => new b2FixtureProxy(this));
        this.m_proxyCount = 0;
        this.m_density = b2Maybe(def.density, 0);
    }
    Destroy() {
        // The proxies must be destroyed before calling this.
        // DEBUG: b2Assert(this.m_proxyCount === 0);
        // Free the proxy array.
        // int32 childCount = m_shape->GetChildCount();
        // allocator->Free(m_proxies, childCount * sizeof(b2FixtureProxy));
        // m_proxies = NULL;
        // this.m_shape = null;
    }
    // These support body activation/deactivation.
    CreateProxies(xf) {
        const broadPhase = this.m_body.m_world.m_contactManager.m_broadPhase;
        // DEBUG: b2Assert(this.m_proxyCount === 0);
        // Create proxies in the broad-phase.
        this.m_proxyCount = this.m_shape.GetChildCount();
        for (let i = 0; i < this.m_proxyCount; ++i) {
            const proxy = this.m_proxies[i] = new b2FixtureProxy(this);
            this.m_shape.ComputeAABB(proxy.aabb, xf, i);
            proxy.treeNode = broadPhase.CreateProxy(proxy.aabb, proxy);
            proxy.childIndex = i;
        }
    }
    DestroyProxies() {
        const broadPhase = this.m_body.m_world.m_contactManager.m_broadPhase;
        // Destroy proxies in the broad-phase.
        for (let i = 0; i < this.m_proxyCount; ++i) {
            const proxy = this.m_proxies[i];
            delete proxy.treeNode.userData;
            broadPhase.DestroyProxy(proxy.treeNode);
            delete proxy.treeNode;
        }
        this.m_proxyCount = 0;
    }
    TouchProxies() {
        const broadPhase = this.m_body.m_world.m_contactManager.m_broadPhase;
        const proxyCount = this.m_proxyCount;
        for (let i = 0; i < proxyCount; ++i) {
            broadPhase.TouchProxy(this.m_proxies[i].treeNode);
        }
    }
    Synchronize(transform1, transform2) {
        if (this.m_proxyCount === 0) {
            return;
        }
        const broadPhase = this.m_body.m_world.m_contactManager.m_broadPhase;
        for (let i = 0; i < this.m_proxyCount; ++i) {
            const proxy = this.m_proxies[i];
            // Compute an AABB that covers the swept shape (may miss some rotation effect).
            const aabb1 = b2Fixture.Synchronize_s_aabb1;
            const aabb2 = b2Fixture.Synchronize_s_aabb2;
            this.m_shape.ComputeAABB(aabb1, transform1, i);
            this.m_shape.ComputeAABB(aabb2, transform2, i);
            proxy.aabb.Combine2(aabb1, aabb2);
            const displacement = b2Vec2.SubVV(transform2.p, transform1.p, b2Fixture.Synchronize_s_displacement);
            broadPhase.MoveProxy(proxy.treeNode, proxy.aabb, displacement);
        }
    }
}
b2Fixture.Synchronize_s_aabb1 = new b2AABB();
b2Fixture.Synchronize_s_aabb2 = new b2AABB();
b2Fixture.Synchronize_s_displacement = new b2Vec2();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJGaXh0dXJlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvRHluYW1pY3MvYjJGaXh0dXJlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsMERBQTBEO0FBQzFELE9BQU8sRUFBRSxXQUFXLEVBQUUsT0FBTyxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFFLE1BQU0sRUFBZSxNQUFNLGtCQUFrQixDQUFDO0FBRXZELE9BQU8sRUFBRSxNQUFNLEVBQW1DLE1BQU0sMEJBQTBCLENBQUM7QUFFbkYsT0FBTyxFQUF3QixVQUFVLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQWtCL0Usc0NBQXNDO0FBQ3RDLE1BQU0sT0FBTyxRQUFRO0lBQXJCO1FBR0UscUVBQXFFO1FBQzlELGlCQUFZLEdBQVcsTUFBTSxDQUFDO1FBRXJDLGlFQUFpRTtRQUNqRSxxQ0FBcUM7UUFDOUIsYUFBUSxHQUFXLE1BQU0sQ0FBQztRQUVqQyxpRkFBaUY7UUFDakYsK0VBQStFO1FBQy9FLGdEQUFnRDtRQUN6QyxlQUFVLEdBQVcsQ0FBQyxDQUFDO0lBYWhDLENBQUM7SUFYUSxLQUFLO1FBQ1YsT0FBTyxJQUFJLFFBQVEsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRU0sSUFBSSxDQUFDLEtBQWdCO1FBQzFCLG1DQUFtQztRQUNuQyxJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDdkMsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQy9CLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDOztBQXhCc0IsZ0JBQU8sR0FBdUIsSUFBSSxRQUFRLEVBQUUsQ0FBQztBQXNEdEUsMkVBQTJFO0FBQzNF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