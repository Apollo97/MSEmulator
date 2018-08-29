/*
 * Copyright (c) 2013 Google, Inc.
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
// #if B2_ENABLE_PARTICLE
// DEBUG: import { b2Assert } from "../Common/b2Settings";
import { b2Vec2, b2Transform } from "../Common/b2Math";
import { b2Color } from "../Common/b2Draw";
export var b2ParticleGroupFlag;
(function (b2ParticleGroupFlag) {
    /// Prevents overlapping or leaking.
    b2ParticleGroupFlag[b2ParticleGroupFlag["b2_solidParticleGroup"] = 1] = "b2_solidParticleGroup";
    /// Keeps its shape.
    b2ParticleGroupFlag[b2ParticleGroupFlag["b2_rigidParticleGroup"] = 2] = "b2_rigidParticleGroup";
    /// Won't be destroyed if it gets empty.
    b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupCanBeEmpty"] = 4] = "b2_particleGroupCanBeEmpty";
    /// Will be destroyed on next simulation step.
    b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupWillBeDestroyed"] = 8] = "b2_particleGroupWillBeDestroyed";
    /// Updates depth data on next simulation step.
    b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupNeedsUpdateDepth"] = 16] = "b2_particleGroupNeedsUpdateDepth";
    b2ParticleGroupFlag[b2ParticleGroupFlag["b2_particleGroupInternalMask"] = 24] = "b2_particleGroupInternalMask";
})(b2ParticleGroupFlag || (b2ParticleGroupFlag = {}));
export class b2ParticleGroupDef {
    constructor() {
        this.flags = 0;
        this.groupFlags = 0;
        this.position = new b2Vec2();
        this.angle = 0.0;
        this.linearVelocity = new b2Vec2();
        this.angularVelocity = 0.0;
        this.color = new b2Color();
        this.strength = 1.0;
        this.shapeCount = 0;
        this.stride = 0;
        this.particleCount = 0;
        this.lifetime = 0;
        this.userData = null;
        this.group = null;
    }
}
export class b2ParticleGroup {
    constructor(system) {
        this.m_firstIndex = 0;
        this.m_lastIndex = 0;
        this.m_groupFlags = 0;
        this.m_strength = 1.0;
        this.m_prev = null;
        this.m_next = null;
        this.m_timestamp = -1;
        this.m_mass = 0.0;
        this.m_inertia = 0.0;
        this.m_center = new b2Vec2();
        this.m_linearVelocity = new b2Vec2();
        this.m_angularVelocity = 0.0;
        this.m_transform = new b2Transform();
        ///m_transform.SetIdentity();
        this.m_userData = null;
        this.m_system = system;
    }
    GetNext() {
        return this.m_next;
    }
    GetParticleSystem() {
        return this.m_system;
    }
    GetParticleCount() {
        return this.m_lastIndex - this.m_firstIndex;
    }
    GetBufferIndex() {
        return this.m_firstIndex;
    }
    ContainsParticle(index) {
        return this.m_firstIndex <= index && index < this.m_lastIndex;
    }
    GetAllParticleFlags() {
        if (!this.m_system.m_flagsBuffer.data) {
            throw new Error();
        }
        let flags = 0;
        for (let i = this.m_firstIndex; i < this.m_lastIndex; i++) {
            flags |= this.m_system.m_flagsBuffer.data[i];
        }
        return flags;
    }
    GetGroupFlags() {
        return this.m_groupFlags;
    }
    SetGroupFlags(flags) {
        // DEBUG: b2Assert((flags & b2ParticleGroupFlag.b2_particleGroupInternalMask) === 0);
        flags |= this.m_groupFlags & b2ParticleGroupFlag.b2_particleGroupInternalMask;
        this.m_system.SetGroupFlags(this, flags);
    }
    GetMass() {
        this.UpdateStatistics();
        return this.m_mass;
    }
    GetInertia() {
        this.UpdateStatistics();
        return this.m_inertia;
    }
    GetCenter() {
        this.UpdateStatistics();
        return this.m_center;
    }
    GetLinearVelocity() {
        this.UpdateStatistics();
        return this.m_linearVelocity;
    }
    GetAngularVelocity() {
        this.UpdateStatistics();
        return this.m_angularVelocity;
    }
    GetTransform() {
        return this.m_transform;
    }
    GetPosition() {
        return this.m_transform.p;
    }
    GetAngle() {
        return this.m_transform.q.GetAngle();
    }
    GetLinearVelocityFromWorldPoint(worldPoint, out) {
        const s_t0 = b2ParticleGroup.GetLinearVelocityFromWorldPoint_s_t0;
        this.UpdateStatistics();
        ///  return m_linearVelocity + b2Cross(m_angularVelocity, worldPoint - m_center);
        return b2Vec2.AddVCrossSV(this.m_linearVelocity, this.m_angularVelocity, b2Vec2.SubVV(worldPoint, this.m_center, s_t0), out);
    }
    GetUserData() {
        return this.m_userData;
    }
    SetUserData(data) {
        this.m_userData = data;
    }
    ApplyForce(force) {
        this.m_system.ApplyForce(this.m_firstIndex, this.m_lastIndex, force);
    }
    ApplyLinearImpulse(impulse) {
        this.m_system.ApplyLinearImpulse(this.m_firstIndex, this.m_lastIndex, impulse);
    }
    DestroyParticles(callDestructionListener) {
        if (this.m_system.m_world.IsLocked()) {
            throw new Error();
        }
        for (let i = this.m_firstIndex; i < this.m_lastIndex; i++) {
            this.m_system.DestroyParticle(i, callDestructionListener);
        }
    }
    UpdateStatistics() {
        if (!this.m_system.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_system.m_velocityBuffer.data) {
            throw new Error();
        }
        const p = new b2Vec2();
        const v = new b2Vec2();
        if (this.m_timestamp !== this.m_system.m_timestamp) {
            const m = this.m_system.GetParticleMass();
            ///  this.m_mass = 0;
            this.m_mass = m * (this.m_lastIndex - this.m_firstIndex);
            this.m_center.SetZero();
            this.m_linearVelocity.SetZero();
            for (let i = this.m_firstIndex; i < this.m_lastIndex; i++) {
                ///  this.m_mass += m;
                ///  this.m_center += m * this.m_system.m_positionBuffer.data[i];
                this.m_center.SelfMulAdd(m, this.m_system.m_positionBuffer.data[i]);
                ///  this.m_linearVelocity += m * this.m_system.m_velocityBuffer.data[i];
                this.m_linearVelocity.SelfMulAdd(m, this.m_system.m_velocityBuffer.data[i]);
            }
            if (this.m_mass > 0) {
                const inv_mass = 1 / this.m_mass;
                ///this.m_center *= 1 / this.m_mass;
                this.m_center.SelfMul(inv_mass);
                ///this.m_linearVelocity *= 1 / this.m_mass;
                this.m_linearVelocity.SelfMul(inv_mass);
            }
            this.m_inertia = 0;
            this.m_angularVelocity = 0;
            for (let i = this.m_firstIndex; i < this.m_lastIndex; i++) {
                ///b2Vec2 p = this.m_system.m_positionBuffer.data[i] - this.m_center;
                b2Vec2.SubVV(this.m_system.m_positionBuffer.data[i], this.m_center, p);
                ///b2Vec2 v = this.m_system.m_velocityBuffer.data[i] - this.m_linearVelocity;
                b2Vec2.SubVV(this.m_system.m_velocityBuffer.data[i], this.m_linearVelocity, v);
                this.m_inertia += m * b2Vec2.DotVV(p, p);
                this.m_angularVelocity += m * b2Vec2.CrossVV(p, v);
            }
            if (this.m_inertia > 0) {
                this.m_angularVelocity *= 1 / this.m_inertia;
            }
            this.m_timestamp = this.m_system.m_timestamp;
        }
    }
}
b2ParticleGroup.GetLinearVelocityFromWorldPoint_s_t0 = new b2Vec2();
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJQYXJ0aWNsZUdyb3VwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvUGFydGljbGUvYjJQYXJ0aWNsZUdyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0dBZ0JHO0FBRUgseUJBQXlCO0FBRXpCLDBEQUEwRDtBQUMxRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFdBQVcsRUFBTSxNQUFNLGtCQUFrQixDQUFDO0FBQzNELE9BQU8sRUFBRSxPQUFPLEVBQVEsTUFBTSxrQkFBa0IsQ0FBQztBQUtqRCxNQUFNLENBQU4sSUFBWSxtQkFhWDtBQWJELFdBQVksbUJBQW1CO0lBQzdCLG9DQUFvQztJQUNwQywrRkFBOEIsQ0FBQTtJQUM5QixvQkFBb0I7SUFDcEIsK0ZBQThCLENBQUE7SUFDOUIsd0NBQXdDO0lBQ3hDLHlHQUFtQyxDQUFBO0lBQ25DLDhDQUE4QztJQUM5QyxtSEFBd0MsQ0FBQTtJQUN4QywrQ0FBK0M7SUFDL0Msc0hBQXlDLENBQUE7SUFFekMsOEdBQWlHLENBQUE7QUFDbkcsQ0FBQyxFQWJXLG1CQUFtQixLQUFuQixtQkFBbUIsUUFhOUI7QUFzQkQsTUFBTSxPQUFPLGtCQUFrQjtJQUEvQjtRQUNTLFVBQUssR0FBbUIsQ0FBQyxDQUFDO1FBQzFCLGVBQVUsR0FBd0IsQ0FBQyxDQUFDO1FBQzNCLGFBQVEsR0FBVyxJQUFJLE1BQU0sRUFBRSxDQUFDO1FBQ3pDLFVBQUssR0FBVyxHQUFHLENBQUM7UUFDWCxtQkFBYyxHQUFXLElBQUksTUFBTSxFQUFFLENBQUM7UUFDL0Msb0JBQWUsR0FBVyxHQUFHLENBQUM7UUFDckIsVUFBSyxHQUFZLElBQUksT0FBTyxFQUFFLENBQUM7UUFDeEMsYUFBUSxHQUFXLEdBQUcsQ0FBQztRQUd2QixlQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQ3ZCLFdBQU0sR0FBVyxDQUFDLENBQUM7UUFDbkIsa0JBQWEsR0FBVyxDQUFDLENBQUM7UUFFMUIsYUFBUSxH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