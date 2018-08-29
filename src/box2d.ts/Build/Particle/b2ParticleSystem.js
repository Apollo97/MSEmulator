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
// DEBUG: import { b2Assert, b2_maxParticleIndex } from "../Common/b2Settings";
import { b2_linearSlop, b2_maxFloat, b2_invalidParticleIndex, b2_minParticleSystemBufferCapacity, b2_maxTriadDistanceSquared, b2_barrierCollisionTime, b2MakeArray, b2Maybe } from "../Common/b2Settings";
import { b2_maxParticlePressure, b2_minParticleWeight, b2_maxParticleForce, b2_particleStride } from "../Common/b2Settings";
import { b2Min, b2Max, b2Abs, b2Clamp, b2Sqrt, b2InvSqrt, b2Vec2, b2Rot, b2Transform } from "../Common/b2Math";
import { b2Color } from "../Common/b2Draw";
import { b2AABB, b2RayCastInput, b2RayCastOutput } from "../Collision/b2Collision";
import { b2ShapeType, b2Shape } from "../Collision/Shapes/b2Shape";
import { b2EdgeShape } from "../Collision/Shapes/b2EdgeShape";
import { b2TimeStep } from "../Dynamics/b2TimeStep";
import { b2QueryCallback } from "../Dynamics/b2WorldCallbacks";
import { b2ParticleFlag, b2ParticleDef, b2ParticleHandle } from "./b2Particle";
import { b2ParticleGroupFlag, b2ParticleGroupDef, b2ParticleGroup } from "./b2ParticleGroup";
import { b2VoronoiDiagram } from "./b2VoronoiDiagram";
function std_iter_swap(array, a, b) {
    const tmp = array[a];
    array[a] = array[b];
    array[b] = tmp;
}
function default_compare(a, b) { return a < b; }
function std_sort(array, first = 0, len = array.length - first, cmp = default_compare) {
    let left = first;
    const stack = [];
    let pos = 0;
    for (;;) { /* outer loop */
        for (; left + 1 < len; len++) { /* sort left to len-1 */
            const pivot = array[left + Math.floor(Math.random() * (len - left))]; /* pick random pivot */
            stack[pos++] = len; /* sort right part later */
            for (let right = left - 1;;) { /* inner loop: partitioning */
                while (cmp(array[++right], pivot)) { } /* look for greater element */
                while (cmp(pivot, array[--len])) { } /* look for smaller element */
                if (right >= len) {
                    break;
                } /* partition point found? */
                std_iter_swap(array, right, len); /* the only swap */
            } /* partitioned, continue left part */
        }
        if (pos === 0) {
            break;
        } /* stack empty? */
        left = len; /* left to right is sorted */
        len = stack[--pos]; /* get next range to sort */
    }
    return array;
}
function std_stable_sort(array, first = 0, len = array.length - first, cmp = default_compare) {
    return std_sort(array, first, len, cmp);
}
function std_remove_if(array, predicate, length = array.length) {
    let l = 0;
    for (let c = 0; c < length; ++c) {
        // if we can be collapsed, keep l where it is.
        if (predicate(array[c])) {
            continue;
        }
        // this node can't be collapsed; push it back as far as we can.
        if (c === l) {
            ++l;
            continue; // quick exit if we're already in the right spot
        }
        // array[l++] = array[c];
        std_iter_swap(array, l++, c);
    }
    return l;
}
function std_lower_bound(array, first, last, val, cmp = default_compare) {
    let count = last - first;
    while (count > 0) {
        const step = Math.floor(count / 2);
        let it = first + step;
        if (cmp(array[it], val)) {
            first = ++it;
            count -= step + 1;
        }
        else {
            count = step;
        }
    }
    return first;
}
function std_upper_bound(array, first, last, val, cmp = default_compare) {
    let count = last - first;
    while (count > 0) {
        const step = Math.floor(count / 2);
        let it = first + step;
        if (!cmp(val, array[it])) {
            first = ++it;
            count -= step + 1;
        }
        else {
            count = step;
        }
    }
    return first;
}
function std_rotate(array, first, n_first, last) {
    let next = n_first;
    while (first !== next) {
        std_iter_swap(array, first++, next++);
        if (next === last) {
            next = n_first;
        }
        else if (first === n_first) {
            n_first = next;
        }
    }
}
function std_unique(array, first, last, cmp) {
    if (first === last) {
        return last;
    }
    let result = first;
    while (++first !== last) {
        if (!cmp(array[result], array[first])) {
            ///array[++result] = array[first];
            std_iter_swap(array, ++result, first);
        }
    }
    return ++result;
}
export class b2GrowableBuffer {
    constructor(allocator) {
        this.data = [];
        this.count = 0;
        this.capacity = 0;
        this.allocator = allocator;
    }
    Append() {
        if (this.count >= this.capacity) {
            this.Grow();
        }
        return this.count++;
    }
    Reserve(newCapacity) {
        if (this.capacity >= newCapacity) {
            return;
        }
        // DEBUG: b2Assert(this.capacity === this.data.length);
        for (let i = this.capacity; i < newCapacity; ++i) {
            this.data[i] = this.allocator();
        }
        this.capacity = newCapacity;
    }
    Grow() {
        // Double the capacity.
        const newCapacity = this.capacity ? 2 * this.capacity : b2_minParticleSystemBufferCapacity;
        // DEBUG: b2Assert(newCapacity > this.capacity);
        this.Reserve(newCapacity);
    }
    Free() {
        if (this.data.length === 0) {
            return;
        }
        this.data = [];
        this.capacity = 0;
        this.count = 0;
    }
    Shorten(newEnd) {
        // DEBUG: b2Assert(false);
    }
    Data() {
        return this.data;
    }
    GetCount() {
        return this.count;
    }
    SetCount(newCount) {
        // DEBUG: b2Assert(0 <= newCount && newCount <= this.capacity);
        this.count = newCount;
    }
    GetCapacity() {
        return this.capacity;
    }
    RemoveIf(pred) {
        // DEBUG: let count = 0;
        // DEBUG: for (let i = 0; i < this.count; ++i) {
        // DEBUG:   if (!pred(this.data[i])) {
        // DEBUG:     count++;
        // DEBUG:   }
        // DEBUG: }
        this.count = std_remove_if(this.data, pred, this.count);
        // DEBUG: b2Assert(count === this.count);
    }
    Unique(pred) {
        this.count = std_unique(this.data, 0, this.count, pred);
    }
}
export class b2FixtureParticleQueryCallback extends b2QueryCallback {
    constructor(system) {
        super();
        this.m_system = system;
    }
    ShouldQueryParticleSystem(system) {
        // Skip reporting particles.
        return false;
    }
    ReportFixture(fixture) {
        if (fixture.IsSensor()) {
            return true;
        }
        const shape = fixture.GetShape();
        const childCount = shape.GetChildCount();
        for (let childIndex = 0; childIndex < childCount; childIndex++) {
            const aabb = fixture.GetAABB(childIndex);
            const enumerator = this.m_system.GetInsideBoundsEnumerator(aabb);
            let index;
            while ((index = enumerator.GetNext()) >= 0) {
                this.ReportFixtureAndParticle(fixture, childIndex, index);
            }
        }
        return true;
    }
    ReportParticle(system, index) {
        return false;
    }
    ReportFixtureAndParticle(fixture, childIndex, index) {
        // DEBUG: b2Assert(false); // pure virtual
    }
}
export class b2ParticleContact {
    constructor() {
        this.indexA = 0;
        this.indexB = 0;
        this.weight = 0;
        this.normal = new b2Vec2();
        this.flags = 0;
    }
    SetIndices(a, b) {
        // DEBUG: b2Assert(a <= b2_maxParticleIndex && b <= b2_maxParticleIndex);
        this.indexA = a;
        this.indexB = b;
    }
    SetWeight(w) {
        this.weight = w;
    }
    SetNormal(n) {
        this.normal.Copy(n);
    }
    SetFlags(f) {
        this.flags = f;
    }
    GetIndexA() {
        return this.indexA;
    }
    GetIndexB() {
        return this.indexB;
    }
    GetWeight() {
        return this.weight;
    }
    GetNormal() {
        return this.normal;
    }
    GetFlags() {
        return this.flags;
    }
    IsEqual(rhs) {
        return this.indexA === rhs.indexA && this.indexB === rhs.indexB && this.flags === rhs.flags && this.weight === rhs.weight && this.normal.x === rhs.normal.x && this.normal.y === rhs.normal.y;
    }
    IsNotEqual(rhs) {
        return !this.IsEqual(rhs);
    }
    ApproximatelyEqual(rhs) {
        const MAX_WEIGHT_DIFF = 0.01; // Weight 0 ~ 1, so about 1%
        const MAX_NORMAL_DIFF_SQ = 0.01 * 0.01; // Normal length = 1, so 1%
        return this.indexA === rhs.indexA && this.indexB === rhs.indexB && this.flags === rhs.flags && b2Abs(this.weight - rhs.weight) < MAX_WEIGHT_DIFF && b2Vec2.DistanceSquaredVV(this.normal, rhs.normal) < MAX_NORMAL_DIFF_SQ;
    }
}
export class b2ParticleBodyContact {
    constructor() {
        this.index = 0; // Index of the particle making contact.
        this.weight = 0.0; // Weight of the contact. A value between 0.0f and 1.0f.
        this.normal = new b2Vec2(); // The normalized direction from the particle to the body.
        this.mass = 0.0; // The effective mass used in calculating force.
    }
}
export class b2ParticlePair {
    constructor() {
        this.indexA = 0; // Indices of the respective particles making pair.
        this.indexB = 0;
        this.flags = 0; // The logical sum of the particle flags. See the b2ParticleFlag enum.
        this.strength = 0.0; // The strength of cohesion among the particles.
        this.distance = 0.0; // The initial distance of the particles.
    }
}
export class b2ParticleTriad {
    constructor() {
        this.indexA = 0; // Indices of the respective particles making triad.
        this.indexB = 0;
        this.indexC = 0;
        this.flags = 0; // The logical sum of the particle flags. See the b2ParticleFlag enum.
        this.strength = 0.0; // The strength of cohesion among the particles.
        this.pa = new b2Vec2(0.0, 0.0); // Values used for calculation.
        this.pb = new b2Vec2(0.0, 0.0);
        this.pc = new b2Vec2(0.0, 0.0);
        this.ka = 0.0;
        this.kb = 0.0;
        this.kc = 0.0;
        this.s = 0.0;
    }
}
export class b2ParticleSystemDef {
    constructor() {
        // Initialize physical coefficients to the maximum values that
        // maintain numerical stability.
        /**
         * Enable strict Particle/Body contact check.
         * See SetStrictContactCheck for details.
         */
        this.strictContactCheck = false;
        /**
         * Set the particle density.
         * See SetDensity for details.
         */
        this.density = 1.0;
        /**
         * Change the particle gravity scale. Adjusts the effect of the
         * global gravity vector on particles. Default value is 1.0f.
         */
        this.gravityScale = 1.0;
        /**
         * Particles behave as circles with this radius. In Box2D units.
         */
        this.radius = 1.0;
        /**
         * Set the maximum number of particles.
         * By default, there is no maximum. The particle buffers can
         * continue to grow while b2World's block allocator still has
         * memory.
         * See SetMaxParticleCount for details.
         */
        this.maxCount = 0;
        /**
         * Increases pressure in response to compression
         * Smaller values allow more compression
         */
        this.pressureStrength = 0.005;
        /**
         * Reduces velocity along the collision normal
         * Smaller value reduces less
         */
        this.dampingStrength = 1.0;
        /**
         * Restores shape of elastic particle groups
         * Larger values increase elastic particle velocity
         */
        this.elasticStrength = 0.25;
        /**
         * Restores length of spring particle groups
         * Larger values increase spring particle velocity
         */
        this.springStrength = 0.25;
        /**
         * Reduces relative velocity of viscous particles
         * Larger values slow down viscous particles more
         */
        this.viscousStrength = 0.25;
        /**
         * Produces pressure on tensile particles
         * 0~0.2. Larger values increase the amount of surface tension.
         */
        this.surfaceTensionPressureStrength = 0.2;
        /**
         * Smoothes outline of tensile particles
         * 0~0.2. Larger values result in rounder, smoother,
         * water-drop-like clusters of particles.
         */
        this.surfaceTensionNormalStrength = 0.2;
        /**
         * Produces additional pressure on repulsive particles
         * Larger values repulse more
         * Negative values mean attraction. The range where particles
         * behave stably is about -0.2 to 2.0.
         */
        this.repulsiveStrength = 1.0;
        /**
         * Produces repulsion between powder particles
         * Larger values repulse more
         */
        this.powderStrength = 0.5;
        /**
         * Pushes particles out of solid particle group
         * Larger values repulse more
         */
        this.ejectionStrength = 0.5;
        /**
         * Produces static pressure
         * Larger values increase the pressure on neighboring partilces
         * For a description of static pressure, see
         * http://en.wikipedia.org/wiki/Static_pressure#Static_pressure_in_fluid_dynamics
         */
        this.staticPressureStrength = 0.2;
        /**
         * Reduces instability in static pressure calculation
         * Larger values make stabilize static pressure with fewer
         * iterations
         */
        this.staticPressureRelaxation = 0.2;
        /**
         * Computes static pressure more precisely
         * See SetStaticPressureIterations for details
         */
        this.staticPressureIterations = 8;
        /**
         * Determines how fast colors are mixed
         * 1.0f ==> mixed immediately
         * 0.5f ==> mixed half way each simulation step (see
         * b2World::Step())
         */
        this.colorMixingStrength = 0.5;
        /**
         * Whether to destroy particles by age when no more particles
         * can be created.  See #b2ParticleSystem::SetDestructionByAge()
         * for more information.
         */
        this.destroyByAge = true;
        /**
         * Granularity of particle lifetimes in seconds.  By default
         * this is set to (1.0f / 60.0f) seconds.  b2ParticleSystem uses
         * a 32-bit signed value to track particle lifetimes so the
         * maximum lifetime of a particle is (2^32 - 1) / (1.0f /
         * lifetimeGranularity) seconds. With the value set to 1/60 the
         * maximum lifetime or age of a particle is 2.27 years.
         */
        this.lifetimeGranularity = 1.0 / 60.0;
    }
    Copy(def) {
        this.strictContactCheck = def.strictContactCheck;
        this.density = def.density;
        this.gravityScale = def.gravityScale;
        this.radius = def.radius;
        this.maxCount = def.maxCount;
        this.pressureStrength = def.pressureStrength;
        this.dampingStrength = def.dampingStrength;
        this.elasticStrength = def.elasticStrength;
        this.springStrength = def.springStrength;
        this.viscousStrength = def.viscousStrength;
        this.surfaceTensionPressureStrength = def.surfaceTensionPressureStrength;
        this.surfaceTensionNormalStrength = def.surfaceTensionNormalStrength;
        this.repulsiveStrength = def.repulsiveStrength;
        this.powderStrength = def.powderStrength;
        this.ejectionStrength = def.ejectionStrength;
        this.staticPressureStrength = def.staticPressureStrength;
        this.staticPressureRelaxation = def.staticPressureRelaxation;
        this.staticPressureIterations = def.staticPressureIterations;
        this.colorMixingStrength = def.colorMixingStrength;
        this.destroyByAge = def.destroyByAge;
        this.lifetimeGranularity = def.lifetimeGranularity;
        return this;
    }
    Clone() {
        return new b2ParticleSystemDef().Copy(this);
    }
}
export class b2ParticleSystem {
    constructor(def, world) {
        this.m_paused = false;
        this.m_timestamp = 0;
        this.m_allParticleFlags = 0;
        this.m_needsUpdateAllParticleFlags = false;
        this.m_allGroupFlags = 0;
        this.m_needsUpdateAllGroupFlags = false;
        this.m_hasForce = false;
        this.m_iterationIndex = 0;
        this.m_inverseDensity = 0.0;
        this.m_particleDiameter = 0.0;
        this.m_inverseDiameter = 0.0;
        this.m_squaredDiameter = 0.0;
        this.m_count = 0;
        this.m_internalAllocatedCapacity = 0;
        /**
         * Allocator for b2ParticleHandle instances.
         */
        ///m_handleAllocator: any = null;
        /**
         * Maps particle indicies to handles.
         */
        this.m_handleIndexBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_flagsBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_positionBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_velocityBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_forceBuffer = [];
        /**
         * this.m_weightBuffer is populated in ComputeWeight and used in
         * ComputeDepth(), SolveStaticPressure() and SolvePressure().
         */
        this.m_weightBuffer = [];
        /**
         * When any particles have the flag b2_staticPressureParticle,
         * this.m_staticPressureBuffer is first allocated and used in
         * SolveStaticPressure() and SolvePressure().  It will be
         * reallocated on subsequent CreateParticle() calls.
         */
        this.m_staticPressureBuffer = [];
        /**
         * this.m_accumulationBuffer is used in many functions as a temporary
         * buffer for scalar values.
         */
        this.m_accumulationBuffer = [];
        /**
         * When any particles have the flag b2_tensileParticle,
         * this.m_accumulation2Buffer is first allocated and used in
         * SolveTensile() as a temporary buffer for vector values.  It
         * will be reallocated on subsequent CreateParticle() calls.
         */
        this.m_accumulation2Buffer = [];
        /**
         * When any particle groups have the flag b2_solidParticleGroup,
         * this.m_depthBuffer is first allocated and populated in
         * ComputeDepth() and used in SolveSolid(). It will be
         * reallocated on subsequent CreateParticle() calls.
         */
        this.m_depthBuffer = [];
        this.m_colorBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_groupBuffer = [];
        this.m_userDataBuffer = new b2ParticleSystem.UserOverridableBuffer();
        /**
         * Stuck particle detection parameters and record keeping
         */
        this.m_stuckThreshold = 0;
        this.m_lastBodyContactStepBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_bodyContactCountBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_consecutiveContactStepsBuffer = new b2ParticleSystem.UserOverridableBuffer();
        this.m_stuckParticleBuffer = new b2GrowableBuffer(() => 0);
        this.m_proxyBuffer = new b2GrowableBuffer(() => new b2ParticleSystem.Proxy());
        this.m_contactBuffer = new b2GrowableBuffer(() => new b2ParticleContact());
        this.m_bodyContactBuffer = new b2GrowableBuffer(() => new b2ParticleBodyContact());
        this.m_pairBuffer = new b2GrowableBuffer(() => new b2ParticlePair());
        this.m_triadBuffer = new b2GrowableBuffer(() => new b2ParticleTriad());
        /**
         * Time each particle should be destroyed relative to the last
         * time this.m_timeElapsed was initialized.  Each unit of time
         * corresponds to b2ParticleSystemDef::lifetimeGranularity
         * seconds.
         */
        this.m_expirationTimeBuffer = new b2ParticleSystem.UserOverridableBuffer();
        /**
         * List of particle indices sorted by expiration time.
         */
        this.m_indexByExpirationTimeBuffer = new b2ParticleSystem.UserOverridableBuffer();
        /**
         * Time elapsed in 32:32 fixed point.  Each non-fractional unit
         * of time corresponds to
         * b2ParticleSystemDef::lifetimeGranularity seconds.
         */
        this.m_timeElapsed = 0;
        /**
         * Whether the expiration time buffer has been modified and
         * needs to be resorted.
         */
        this.m_expirationTimeBufferRequiresSorting = false;
        this.m_groupCount = 0;
        this.m_groupList = null;
        this.m_def = new b2ParticleSystemDef();
        this.m_prev = null;
        this.m_next = null;
        this.SetStrictContactCheck(def.strictContactCheck);
        this.SetDensity(def.density);
        this.SetGravityScale(def.gravityScale);
        this.SetRadius(def.radius);
        this.SetMaxParticleCount(def.maxCount);
        // DEBUG: b2Assert(def.lifetimeGranularity > 0.0);
        this.m_def = def.Clone();
        this.m_world = world;
        this.SetDestructionByAge(this.m_def.destroyByAge);
    }
    static computeTag(x, y) {
        ///return ((uint32)(y + yOffset) << yShift) + (uint32)(xScale * x + xOffset);
        return ((((y + b2ParticleSystem.yOffset) >>> 0) << b2ParticleSystem.yShift) + ((b2ParticleSystem.xScale * x + b2ParticleSystem.xOffset) >>> 0)) >>> 0;
    }
    static computeRelativeTag(tag, x, y) {
        ///return tag + (y << yShift) + (x << xShift);
        return (tag + (y << b2ParticleSystem.yShift) + (x << b2ParticleSystem.xShift)) >>> 0;
    }
    Drop() {
        while (this.m_groupList) {
            this.DestroyParticleGroup(this.m_groupList);
        }
        this.FreeUserOverridableBuffer(this.m_handleIndexBuffer);
        this.FreeUserOverridableBuffer(this.m_flagsBuffer);
        this.FreeUserOverridableBuffer(this.m_lastBodyContactStepBuffer);
        this.FreeUserOverridableBuffer(this.m_bodyContactCountBuffer);
        this.FreeUserOverridableBuffer(this.m_consecutiveContactStepsBuffer);
        this.FreeUserOverridableBuffer(this.m_positionBuffer);
        this.FreeUserOverridableBuffer(this.m_velocityBuffer);
        this.FreeUserOverridableBuffer(this.m_colorBuffer);
        this.FreeUserOverridableBuffer(this.m_userDataBuffer);
        this.FreeUserOverridableBuffer(this.m_expirationTimeBuffer);
        this.FreeUserOverridableBuffer(this.m_indexByExpirationTimeBuffer);
        this.FreeBuffer(this.m_forceBuffer, this.m_internalAllocatedCapacity);
        this.FreeBuffer(this.m_weightBuffer, this.m_internalAllocatedCapacity);
        this.FreeBuffer(this.m_staticPressureBuffer, this.m_internalAllocatedCapacity);
        this.FreeBuffer(this.m_accumulationBuffer, this.m_internalAllocatedCapacity);
        this.FreeBuffer(this.m_accumulation2Buffer, this.m_internalAllocatedCapacity);
        this.FreeBuffer(this.m_depthBuffer, this.m_internalAllocatedCapacity);
        this.FreeBuffer(this.m_groupBuffer, this.m_internalAllocatedCapacity);
    }
    /**
     * Create a particle whose properties have been defined.
     *
     * No reference to the definition is retained.
     *
     * A simulation step must occur before it's possible to interact
     * with a newly created particle.  For example,
     * DestroyParticleInShape() will not destroy a particle until
     * b2World::Step() has been called.
     *
     * warning: This function is locked during callbacks.
     */
    CreateParticle(def) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        if (this.m_count >= this.m_internalAllocatedCapacity) {
            // Double the particle capacity.
            const capacity = this.m_count ? 2 * this.m_count : b2_minParticleSystemBufferCapacity;
            this.ReallocateInternalAllocatedBuffers(capacity);
        }
        if (this.m_count >= this.m_internalAllocatedCapacity) {
            // If the oldest particle should be destroyed...
            if (this.m_def.destroyByAge) {
                this.DestroyOldestParticle(0, false);
                // Need to destroy this particle *now* so that it's possible to
                // create a new particle.
                this.SolveZombie();
            }
            else {
                return b2_invalidParticleIndex;
            }
        }
        const index = this.m_count++;
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        this.m_flagsBuffer.data[index] = 0;
        if (this.m_lastBodyContactStepBuffer.data) {
            this.m_lastBodyContactStepBuffer.data[index] = 0;
        }
        if (this.m_bodyContactCountBuffer.data) {
            this.m_bodyContactCountBuffer.data[index] = 0;
        }
        if (this.m_consecutiveContactStepsBuffer.data) {
            this.m_consecutiveContactStepsBuffer.data[index] = 0;
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        this.m_positionBuffer.data[index] = (this.m_positionBuffer.data[index] || new b2Vec2()).Copy(b2Maybe(def.position, b2Vec2.ZERO));
        this.m_velocityBuffer.data[index] = (this.m_velocityBuffer.data[index] || new b2Vec2()).Copy(b2Maybe(def.velocity, b2Vec2.ZERO));
        this.m_weightBuffer[index] = 0;
        this.m_forceBuffer[index] = (this.m_forceBuffer[index] || new b2Vec2()).SetZero();
        if (this.m_staticPressureBuffer) {
            this.m_staticPressureBuffer[index] = 0;
        }
        if (this.m_depthBuffer) {
            this.m_depthBuffer[index] = 0;
        }
        const color = new b2Color().Copy(b2Maybe(def.color, b2Color.ZERO));
        if (this.m_colorBuffer.data || !color.IsZero()) {
            this.m_colorBuffer.data = this.RequestBuffer(this.m_colorBuffer.data);
            this.m_colorBuffer.data[index] = (this.m_colorBuffer.data[index] || new b2Color()).Copy(color);
        }
        if (this.m_userDataBuffer.data || def.userData) {
            this.m_userDataBuffer.data = this.RequestBuffer(this.m_userDataBuffer.data);
            this.m_userDataBuffer.data[index] = def.userData;
        }
        if (this.m_handleIndexBuffer.data) {
            this.m_handleIndexBuffer.data[index] = null;
        }
        ///Proxy& proxy = m_proxyBuffer.Append();
        const proxy = this.m_proxyBuffer.data[this.m_proxyBuffer.Append()];
        // If particle lifetimes are enabled or the lifetime is set in the particle
        // definition, initialize the lifetime.
        const lifetime = b2Maybe(def.lifetime, 0.0);
        const finiteLifetime = lifetime > 0.0;
        if (this.m_expirationTimeBuffer.data || finiteLifetime) {
            this.SetParticleLifetime(index, finiteLifetime ? lifetime :
                this.ExpirationTimeToLifetime(-this.GetQuantizedTimeElapsed()));
            // Add a reference to the newly added particle to the end of the
            // queue.
            if (!this.m_indexByExpirationTimeBuffer.data) {
                throw new Error();
            }
            this.m_indexByExpirationTimeBuffer.data[index] = index;
        }
        proxy.index = index;
        const group = b2Maybe(def.group, null);
        this.m_groupBuffer[index] = group;
        if (group) {
            if (group.m_firstIndex < group.m_lastIndex) {
                // Move particles in the group just before the new particle.
                this.RotateBuffer(group.m_firstIndex, group.m_lastIndex, index);
                // DEBUG: b2Assert(group.m_lastIndex === index);
                // Update the index range of the group to contain the new particle.
                group.m_lastIndex = index + 1;
            }
            else {
                // If the group is empty, reset the index range to contain only the
                // new particle.
                group.m_firstIndex = index;
                group.m_lastIndex = index + 1;
            }
        }
        this.SetParticleFlags(index, b2Maybe(def.flags, 0));
        return index;
    }
    /**
     * Retrieve a handle to the particle at the specified index.
     *
     * Please see #b2ParticleHandle for why you might want a handle.
     */
    GetParticleHandleFromIndex(index) {
        // DEBUG: b2Assert(index >= 0 && index < this.GetParticleCount() && index !== b2_invalidParticleIndex);
        this.m_handleIndexBuffer.data = this.RequestBuffer(this.m_handleIndexBuffer.data);
        let handle = this.m_handleIndexBuffer.data[index];
        if (handle) {
            return handle;
        }
        // Create a handle.
        ///handle = m_handleAllocator.Allocate();
        handle = new b2ParticleHandle();
        // DEBUG: b2Assert(handle !== null);
        handle.SetIndex(index);
        this.m_handleIndexBuffer.data[index] = handle;
        return handle;
    }
    /**
     * Destroy a particle.
     *
     * The particle is removed after the next simulation step (see
     * b2World::Step()).
     *
     * @param index Index of the particle to destroy.
     * @param callDestructionListener Whether to call the
     *      destruction listener just before the particle is
     *      destroyed.
     */
    DestroyParticle(index, callDestructionListener = false) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        let flags = b2ParticleFlag.b2_zombieParticle;
        if (callDestructionListener) {
            flags |= b2ParticleFlag.b2_destructionListenerParticle;
        }
        this.SetParticleFlags(index, this.m_flagsBuffer.data[index] | flags);
    }
    /**
     * Destroy the Nth oldest particle in the system.
     *
     * The particle is removed after the next b2World::Step().
     *
     * @param index Index of the Nth oldest particle to
     *      destroy, 0 will destroy the oldest particle in the
     *      system, 1 will destroy the next oldest particle etc.
     * @param callDestructionListener Whether to call the
     *      destruction listener just before the particle is
     *      destroyed.
     */
    DestroyOldestParticle(index, callDestructionListener = false) {
        const particleCount = this.GetParticleCount();
        // DEBUG: b2Assert(index >= 0 && index < particleCount);
        // Make sure particle lifetime tracking is enabled.
        // DEBUG: b2Assert(this.m_indexByExpirationTimeBuffer.data !== null);
        if (!this.m_indexByExpirationTimeBuffer.data) {
            throw new Error();
        }
        if (!this.m_expirationTimeBuffer.data) {
            throw new Error();
        }
        // Destroy the oldest particle (preferring to destroy finite
        // lifetime particles first) to free a slot in the buffer.
        const oldestFiniteLifetimeParticle = this.m_indexByExpirationTimeBuffer.data[particleCount - (index + 1)];
        const oldestInfiniteLifetimeParticle = this.m_indexByExpirationTimeBuffer.data[index];
        this.DestroyParticle(this.m_expirationTimeBuffer.data[oldestFiniteLifetimeParticle] > 0.0 ?
            oldestFiniteLifetimeParticle : oldestInfiniteLifetimeParticle, callDestructionListener);
    }
    /**
     * Destroy particles inside a shape.
     *
     * warning: This function is locked during callbacks.
     *
     * In addition, this function immediately destroys particles in
     * the shape in constrast to DestroyParticle() which defers the
     * destruction until the next simulation step.
     *
     * @return Number of particles destroyed.
     * @param shape Shape which encloses particles
     *      that should be destroyed.
     * @param xf Transform applied to the shape.
     * @param callDestructionListener Whether to call the
     *      world b2DestructionListener for each particle
     *      destroyed.
     */
    DestroyParticlesInShape(shape, xf, callDestructionListener = false) {
        const s_aabb = b2ParticleSystem.DestroyParticlesInShape_s_aabb;
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        const callback = new b2ParticleSystem.DestroyParticlesInShapeCallback(this, shape, xf, callDestructionListener);
        const aabb = s_aabb;
        shape.ComputeAABB(aabb, xf, 0);
        this.m_world.QueryAABB(callback, aabb);
        return callback.Destroyed();
    }
    /**
     * Create a particle group whose properties have been defined.
     *
     * No reference to the definition is retained.
     *
     * warning: This function is locked during callbacks.
     */
    CreateParticleGroup(groupDef) {
        const s_transform = b2ParticleSystem.CreateParticleGroup_s_transform;
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        const transform = s_transform;
        transform.SetPositionAngle(b2Maybe(groupDef.position, b2Vec2.ZERO), b2Maybe(groupDef.angle, 0));
        const firstIndex = this.m_count;
        if (groupDef.shape) {
            this.CreateParticlesWithShapeForGroup(groupDef.shape, groupDef, transform);
        }
        if (groupDef.shapes) {
            this.CreateParticlesWithShapesForGroup(groupDef.shapes, b2Maybe(groupDef.shapeCount, groupDef.shapes.length), groupDef, transform);
        }
        if (groupDef.positionData) {
            const count = b2Maybe(groupDef.particleCount, groupDef.positionData.length);
            for (let i = 0; i < count; i++) {
                const p = groupDef.positionData[i];
                this.CreateParticleForGroup(groupDef, transform, p);
            }
        }
        const lastIndex = this.m_count;
        let group = new b2ParticleGroup(this);
        group.m_firstIndex = firstIndex;
        group.m_lastIndex = lastIndex;
        group.m_strength = b2Maybe(groupDef.strength, 1);
        group.m_userData = groupDef.userData;
        group.m_transform.Copy(transform);
        group.m_prev = null;
        group.m_next = this.m_groupList;
        if (this.m_groupList) {
            this.m_groupList.m_prev = group;
        }
        this.m_groupList = group;
        ++this.m_groupCount;
        for (let i = firstIndex; i < lastIndex; i++) {
            this.m_groupBuffer[i] = group;
        }
        this.SetGroupFlags(group, b2Maybe(groupDef.groupFlags, 0));
        // Create pairs and triads between particles in the group.
        const filter = new b2ParticleSystem.ConnectionFilter();
        this.UpdateContacts(true);
        this.UpdatePairsAndTriads(firstIndex, lastIndex, filter);
        if (groupDef.group) {
            this.JoinParticleGroups(groupDef.group, group);
            group = groupDef.group;
        }
        return group;
    }
    /**
     * Join two particle groups.
     *
     * warning: This function is locked during callbacks.
     *
     * @param groupA the first group. Expands to encompass the second group.
     * @param groupB the second group. It is destroyed.
     */
    JoinParticleGroups(groupA, groupB) {
        if (this.m_world.IsLocked()) {
            throw new Error();
        }
        // DEBUG: b2Assert(groupA !== groupB);
        this.RotateBuffer(groupB.m_firstIndex, groupB.m_lastIndex, this.m_count);
        // DEBUG: b2Assert(groupB.m_lastIndex === this.m_count);
        this.RotateBuffer(groupA.m_firstIndex, groupA.m_lastIndex, groupB.m_firstIndex);
        // DEBUG: b2Assert(groupA.m_lastIndex === groupB.m_firstIndex);
        // Create pairs and triads connecting groupA and groupB.
        const filter = new b2ParticleSystem.JoinParticleGroupsFilter(groupB.m_firstIndex);
        this.UpdateContacts(true);
        this.UpdatePairsAndTriads(groupA.m_firstIndex, groupB.m_lastIndex, filter);
        for (let i = groupB.m_firstIndex; i < groupB.m_lastIndex; i++) {
            this.m_groupBuffer[i] = groupA;
        }
        const groupFlags = groupA.m_groupFlags | groupB.m_groupFlags;
        this.SetGroupFlags(groupA, groupFlags);
        groupA.m_lastIndex = groupB.m_lastIndex;
        groupB.m_firstIndex = groupB.m_lastIndex;
        this.DestroyParticleGroup(groupB);
    }
    /**
     * Split particle group into multiple disconnected groups.
     *
     * warning: This function is locked during callbacks.
     *
     * @param group the group to be split.
     */
    SplitParticleGroup(group) {
        this.UpdateContacts(true);
        const particleCount = group.GetParticleCount();
        // We create several linked lists. Each list represents a set of connected particles.
        ///ParticleListNode* nodeBuffer = (ParticleListNode*) m_world.m_stackAllocator.Allocate(sizeof(ParticleListNode) * particleCount);
        const nodeBuffer = b2MakeArray(particleCount, (index) => new b2ParticleSystem.ParticleListNode());
        b2ParticleSystem.InitializeParticleLists(group, nodeBuffer);
        this.MergeParticleListsInContact(group, nodeBuffer);
        const survivingList = b2ParticleSystem.FindLongestParticleList(group, nodeBuffer);
        this.MergeZombieParticleListNodes(group, nodeBuffer, survivingList);
        this.CreateParticleGroupsFromParticleList(group, nodeBuffer, survivingList);
        this.UpdatePairsAndTriadsWithParticleList(group, nodeBuffer);
        ///this.m_world.m_stackAllocator.Free(nodeBuffer);
    }
    /**
     * Get the world particle group list. With the returned group,
     * use b2ParticleGroup::GetNext to get the next group in the
     * world list.
     *
     * A null group indicates the end of the list.
     *
     * @return the head of the world particle group list.
     */
    GetParticleGroupList() {
        return this.m_groupList;
    }
    /**
     * Get the number of particle groups.
     */
    GetParticleGroupCount() {
        return this.m_groupCount;
    }
    /**
     * Get the number of particles.
     */
    GetParticleCount() {
        return this.m_count;
    }
    /**
     * Get the maximum number of particles.
     */
    GetMaxParticleCount() {
        return this.m_def.maxCount;
    }
    /**
     * Set the maximum number of particles.
     *
     * A value of 0 means there is no maximum. The particle buffers
     * can continue to grow while b2World's block allocator still
     * has memory.
     *
     * Note: If you try to CreateParticle() with more than this
     * count, b2_invalidParticleIndex is returned unless
     * SetDestructionByAge() is used to enable the destruction of
     * the oldest particles in the system.
     */
    SetMaxParticleCount(count) {
        // DEBUG: b2Assert(this.m_count <= count);
        this.m_def.maxCount = count;
    }
    /**
     * Get all existing particle flags.
     */
    GetAllParticleFlags() {
        return this.m_allParticleFlags;
    }
    /**
     * Get all existing particle group flags.
     */
    GetAllGroupFlags() {
        return this.m_allGroupFlags;
    }
    /**
     * Pause or unpause the particle system. When paused,
     * b2World::Step() skips over this particle system. All
     * b2ParticleSystem function calls still work.
     *
     * @param paused paused is true to pause, false to un-pause.
     */
    SetPaused(paused) {
        this.m_paused = paused;
    }
    /**
     * Initially, true, then, the last value passed into
     * SetPaused().
     *
     * @return true if the particle system is being updated in b2World::Step().
     */
    GetPaused() {
        return this.m_paused;
    }
    /**
     * Change the particle density.
     *
     * Particle density affects the mass of the particles, which in
     * turn affects how the particles interact with b2Bodies. Note
     * that the density does not affect how the particles interact
     * with each other.
     */
    SetDensity(density) {
        this.m_def.density = density;
        this.m_inverseDensity = 1 / this.m_def.density;
    }
    /**
     * Get the particle density.
     */
    GetDensity() {
        return this.m_def.density;
    }
    /**
     * Change the particle gravity scale. Adjusts the effect of the
     * global gravity vector on particles.
     */
    SetGravityScale(gravityScale) {
        this.m_def.gravityScale = gravityScale;
    }
    /**
     * Get the particle gravity scale.
     */
    GetGravityScale() {
        return this.m_def.gravityScale;
    }
    /**
     * Damping is used to reduce the velocity of particles. The
     * damping parameter can be larger than 1.0f but the damping
     * effect becomes sensitive to the time step when the damping
     * parameter is large.
     */
    SetDamping(damping) {
        this.m_def.dampingStrength = damping;
    }
    /**
     * Get damping for particles
     */
    GetDamping() {
        return this.m_def.dampingStrength;
    }
    /**
     * Change the number of iterations when calculating the static
     * pressure of particles. By default, 8 iterations. You can
     * reduce the number of iterations down to 1 in some situations,
     * but this may cause instabilities when many particles come
     * together. If you see particles popping away from each other
     * like popcorn, you may have to increase the number of
     * iterations.
     *
     * For a description of static pressure, see
     * http://en.wikipedia.org/wiki/Static_pressure#Static_pressure_in_fluid_dynamics
     */
    SetStaticPressureIterations(iterations) {
        this.m_def.staticPressureIterations = iterations;
    }
    /**
     * Get the number of iterations for static pressure of
     * particles.
     */
    GetStaticPressureIterations() {
        return this.m_def.staticPressureIterations;
    }
    /**
     * Change the particle radius.
     *
     * You should set this only once, on world start.
     * If you change the radius during execution, existing particles
     * may explode, shrink, or behave unexpectedly.
     */
    SetRadius(radius) {
        this.m_particleDiameter = 2 * radius;
        this.m_squaredDiameter = this.m_particleDiameter * this.m_particleDiameter;
        this.m_inverseDiameter = 1 / this.m_particleDiameter;
    }
    /**
     * Get the particle radius.
     */
    GetRadius() {
        return this.m_particleDiameter / 2;
    }
    /**
     * Get the position of each particle
     *
     * Array is length GetParticleCount()
     *
     * @return the pointer to the head of the particle positions array.
     */
    GetPositionBuffer() {
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        return this.m_positionBuffer.data;
    }
    /**
     * Get the velocity of each particle
     *
     * Array is length GetParticleCount()
     *
     * @return the pointer to the head of the particle velocities array.
     */
    GetVelocityBuffer() {
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        return this.m_velocityBuffer.data;
    }
    /**
     * Get the color of each particle
     *
     * Array is length GetParticleCount()
     *
     * @return the pointer to the head of the particle colors array.
     */
    GetColorBuffer() {
        this.m_colorBuffer.data = this.RequestBuffer(this.m_colorBuffer.data);
        return this.m_colorBuffer.data;
    }
    /**
     * Get the particle-group of each particle.
     *
     * Array is length GetParticleCount()
     *
     * @return the pointer to the head of the particle group array.
     */
    GetGroupBuffer() {
        return this.m_groupBuffer;
    }
    /**
     * Get the weight of each particle
     *
     * Array is length GetParticleCount()
     *
     * @return the pointer to the head of the particle positions array.
     */
    GetWeightBuffer() {
        return this.m_weightBuffer;
    }
    /**
     * Get the user-specified data of each particle.
     *
     * Array is length GetParticleCount()
     *
     * @return the pointer to the head of the particle user-data array.
     */
    GetUserDataBuffer() {
        this.m_userDataBuffer.data = this.RequestBuffer(this.m_userDataBuffer.data);
        return this.m_userDataBuffer.data;
    }
    /**
     * Get the flags for each particle. See the b2ParticleFlag enum.
     *
     * Array is length GetParticleCount()
     *
     * @return the pointer to the head of the particle-flags array.
     */
    GetFlagsBuffer() {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        return this.m_flagsBuffer.data;
    }
    /**
     * Set flags for a particle. See the b2ParticleFlag enum.
     */
    SetParticleFlags(index, newFlags) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        const oldFlags = this.m_flagsBuffer.data[index];
        if (oldFlags & ~newFlags) {
            // If any flags might be removed
            this.m_needsUpdateAllParticleFlags = true;
        }
        if (~this.m_allParticleFlags & newFlags) {
            // If any flags were added
            if (newFlags & b2ParticleFlag.b2_tensileParticle) {
                this.m_accumulation2Buffer = this.RequestBuffer(this.m_accumulation2Buffer);
            }
            if (newFlags & b2ParticleFlag.b2_colorMixingParticle) {
                this.m_colorBuffer.data = this.RequestBuffer(this.m_colorBuffer.data);
            }
            this.m_allParticleFlags |= newFlags;
        }
        this.m_flagsBuffer.data[index] = newFlags;
    }
    /**
     * Get flags for a particle. See the b2ParticleFlag enum.
     */
    GetParticleFlags(index) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        return this.m_flagsBuffer.data[index];
    }
    /**
     * Set an external buffer for particle data.
     *
     * Normally, the b2World's block allocator is used for particle
     * data. However, sometimes you may have an OpenGL or Java
     * buffer for particle data. To avoid data duplication, you may
     * supply this external buffer.
     *
     * Note that, when b2World's block allocator is used, the
     * particle data buffers can grow as required. However, when
     * external buffers are used, the maximum number of particles is
     * clamped to the size of the smallest external buffer.
     *
     * @param buffer a pointer to a block of memory.
     * @param capacity the number of values in the block.
     */
    SetFlagsBuffer(buffer, capacity) {
        this.SetUserOverridableBuffer(this.m_flagsBuffer, buffer, capacity);
    }
    SetPositionBuffer(buffer, capacity) {
        ///if (buffer instanceof Float32Array) {
        ///let array = [];
        ///for (let i = 0; i < capacity; ++i) {
        ///  array[i] = new b2Vec2(buffer.subarray(i * 2, i * 2 + 2));
        ///}
        ///this.SetUserOverridableBuffer(this.m_positionBuffer, array, capacity);
        ///} else {
        this.SetUserOverridableBuffer(this.m_positionBuffer, buffer, capacity);
        ///}
    }
    SetVelocityBuffer(buffer, capacity) {
        ///if (buffer instanceof Float32Array) {
        ///let array = [];
        ///for (let i = 0; i < capacity; ++i) {
        ///  array[i] = new b2Vec2(buffer.subarray(i * 2, i * 2 + 2));
        ///}
        ///this.SetUserOverridableBuffer(this.m_velocityBuffer, array, capacity);
        ///} else {
        this.SetUserOverridableBuffer(this.m_velocityBuffer, buffer, capacity);
        ///}
    }
    SetColorBuffer(buffer, capacity) {
        ///if (buffer instanceof Uint8Array) {
        ///let array: b2Color[] = [];
        ///for (let i = 0; i < capacity; ++i) {
        ///  array[i] = new b2Color(buffer.subarray(i * 4, i * 4 + 4));
        ///}
        ///this.SetUserOverridableBuffer(this.m_colorBuffer, array, capacity);
        ///} else {
        this.SetUserOverridableBuffer(this.m_colorBuffer, buffer, capacity);
        ///}
    }
    SetUserDataBuffer(buffer, capacity) {
        this.SetUserOverridableBuffer(this.m_userDataBuffer, buffer, capacity);
    }
    /**
     * Get contacts between particles
     * Contact data can be used for many reasons, for example to
     * trigger rendering or audio effects.
     */
    GetContacts() {
        return this.m_contactBuffer.data;
    }
    GetContactCount() {
        return this.m_contactBuffer.count;
    }
    /**
     * Get contacts between particles and bodies
     *
     * Contact data can be used for many reasons, for example to
     * trigger rendering or audio effects.
     */
    GetBodyContacts() {
        return this.m_bodyContactBuffer.data;
    }
    GetBodyContactCount() {
        return this.m_bodyContactBuffer.count;
    }
    /**
     * Get array of particle pairs. The particles in a pair:
     *   (1) are contacting,
     *   (2) are in the same particle group,
     *   (3) are part of a rigid particle group, or are spring, elastic,
     *       or wall particles.
     *   (4) have at least one particle that is a spring or barrier
     *       particle (i.e. one of the types in k_pairFlags),
     *   (5) have at least one particle that returns true for
     *       ConnectionFilter::IsNecessary,
     *   (6) are not zombie particles.
     *
     * Essentially, this is an array of spring or barrier particles
     * that are interacting. The array is sorted by b2ParticlePair's
     * indexA, and then indexB. There are no duplicate entries.
     */
    GetPairs() {
        return this.m_pairBuffer.data;
    }
    GetPairCount() {
        return this.m_pairBuffer.count;
    }
    /**
     * Get array of particle triads. The particles in a triad:
     *   (1) are in the same particle group,
     *   (2) are in a Voronoi triangle together,
     *   (3) are within b2_maxTriadDistance particle diameters of each
     *       other,
     *   (4) return true for ConnectionFilter::ShouldCreateTriad
     *   (5) have at least one particle of type elastic (i.e. one of the
     *       types in k_triadFlags),
     *   (6) are part of a rigid particle group, or are spring, elastic,
     *       or wall particles.
     *   (7) are not zombie particles.
     *
     * Essentially, this is an array of elastic particles that are
     * interacting. The array is sorted by b2ParticleTriad's indexA,
     * then indexB, then indexC. There are no duplicate entries.
     */
    GetTriads() {
        return this.m_triadBuffer.data;
    }
    GetTriadCount() {
        return this.m_triadBuffer.count;
    }
    /**
     * Set an optional threshold for the maximum number of
     * consecutive particle iterations that a particle may contact
     * multiple bodies before it is considered a candidate for being
     * "stuck". Setting to zero or less disables.
     */
    SetStuckThreshold(steps) {
        this.m_stuckThreshold = steps;
        if (steps > 0) {
            this.m_lastBodyContactStepBuffer.data = this.RequestBuffer(this.m_lastBodyContactStepBuffer.data);
            this.m_bodyContactCountBuffer.data = this.RequestBuffer(this.m_bodyContactCountBuffer.data);
            this.m_consecutiveContactStepsBuffer.data = this.RequestBuffer(this.m_consecutiveContactStepsBuffer.data);
        }
    }
    /**
     * Get potentially stuck particles from the last step; the user
     * must decide if they are stuck or not, and if so, delete or
     * move them
     */
    GetStuckCandidates() {
        ///return m_stuckParticleBuffer.Data();
        return this.m_stuckParticleBuffer.Data();
    }
    /**
     * Get the number of stuck particle candidates from the last
     * step.
     */
    GetStuckCandidateCount() {
        ///return m_stuckParticleBuffer.GetCount();
        return this.m_stuckParticleBuffer.GetCount();
    }
    /**
     * Compute the kinetic energy that can be lost by damping force
     */
    ComputeCollisionEnergy() {
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const s_v = b2ParticleSystem.ComputeCollisionEnergy_s_v;
        const vel_data = this.m_velocityBuffer.data;
        let sum_v2 = 0;
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            const n = contact.normal;
            ///b2Vec2 v = m_velocityBuffer.data[b] - m_velocityBuffer.data[a];
            const v = b2Vec2.SubVV(vel_data[b], vel_data[a], s_v);
            const vn = b2Vec2.DotVV(v, n);
            if (vn < 0) {
                sum_v2 += vn * vn;
            }
        }
        return 0.5 * this.GetParticleMass() * sum_v2;
    }
    /**
     * Set strict Particle/Body contact check.
     *
     * This is an option that will help ensure correct behavior if
     * there are corners in the world model where Particle/Body
     * contact is ambiguous. This option scales at n*log(n) of the
     * number of Particle/Body contacts, so it is best to only
     * enable if it is necessary for your geometry. Enable if you
     * see strange particle behavior around b2Body intersections.
     */
    SetStrictContactCheck(enabled) {
        this.m_def.strictContactCheck = enabled;
    }
    /**
     * Get the status of the strict contact check.
     */
    GetStrictContactCheck() {
        return this.m_def.strictContactCheck;
    }
    /**
     * Set the lifetime (in seconds) of a particle relative to the
     * current time.  A lifetime of less than or equal to 0.0f
     * results in the particle living forever until it's manually
     * destroyed by the application.
     */
    SetParticleLifetime(index, lifetime) {
        // DEBUG: b2Assert(this.ValidateParticleIndex(index));
        const initializeExpirationTimes = this.m_indexByExpirationTimeBuffer.data === null;
        this.m_expirationTimeBuffer.data = this.RequestBuffer(this.m_expirationTimeBuffer.data);
        this.m_indexByExpirationTimeBuffer.data = this.RequestBuffer(this.m_indexByExpirationTimeBuffer.data);
        // Initialize the inverse mapping buffer.
        if (initializeExpirationTimes) {
            const particleCount = this.GetParticleCount();
            for (let i = 0; i < particleCount; ++i) {
                this.m_indexByExpirationTimeBuffer.data[i] = i;
            }
        }
        ///const int32 quantizedLifetime = (int32)(lifetime / m_def.lifetimeGranularity);
        const quantizedLifetime = lifetime / this.m_def.lifetimeGranularity;
        // Use a negative lifetime so that it's possible to track which
        // of the infinite lifetime particles are older.
        const newExpirationTime = quantizedLifetime > 0.0 ? this.GetQuantizedTimeElapsed() + quantizedLifetime : quantizedLifetime;
        if (newExpirationTime !== this.m_expirationTimeBuffer.data[index]) {
            this.m_expirationTimeBuffer.data[index] = newExpirationTime;
            this.m_expirationTimeBufferRequiresSorting = true;
        }
    }
    /**
     * Get the lifetime (in seconds) of a particle relative to the
     * current time.  A value > 0.0f is returned if the particle is
     * scheduled to be destroyed in the future, values <= 0.0f
     * indicate the particle has an infinite lifetime.
     */
    GetParticleLifetime(index) {
        // DEBUG: b2Assert(this.ValidateParticleIndex(index));
        return this.ExpirationTimeToLifetime(this.GetExpirationTimeBuffer()[index]);
    }
    /**
     * Enable / disable destruction of particles in CreateParticle()
     * when no more particles can be created due to a prior call to
     * SetMaxParticleCount().  When this is enabled, the oldest
     * particle is destroyed in CreateParticle() favoring the
     * destruction of particles with a finite lifetime over
     * particles with infinite lifetimes. This feature is enabled by
     * default when particle lifetimes are tracked.  Explicitly
     * enabling this feature using this function enables particle
     * lifetime tracking.
     */
    SetDestructionByAge(enable) {
        if (enable) {
            this.GetExpirationTimeBuffer();
        }
        this.m_def.destroyByAge = enable;
    }
    /**
     * Get whether the oldest particle will be destroyed in
     * CreateParticle() when the maximum number of particles are
     * present in the system.
     */
    GetDestructionByAge() {
        return this.m_def.destroyByAge;
    }
    /**
     * Get the array of particle expiration times indexed by
     * particle index.
     *
     * GetParticleCount() items are in the returned array.
     */
    GetExpirationTimeBuffer() {
        this.m_expirationTimeBuffer.data = this.RequestBuffer(this.m_expirationTimeBuffer.data);
        return this.m_expirationTimeBuffer.data;
    }
    /**
     * Convert a expiration time value in returned by
     * GetExpirationTimeBuffer() to a time in seconds relative to
     * the current simulation time.
     */
    ExpirationTimeToLifetime(expirationTime) {
        return (expirationTime > 0 ?
            expirationTime - this.GetQuantizedTimeElapsed() :
            expirationTime) * this.m_def.lifetimeGranularity;
    }
    /**
     * Get the array of particle indices ordered by reverse
     * lifetime. The oldest particle indexes are at the end of the
     * array with the newest at the start.  Particles with infinite
     * lifetimes (i.e expiration times less than or equal to 0) are
     * placed at the start of the array.
     * ExpirationTimeToLifetime(GetExpirationTimeBuffer()[index]) is
     * equivalent to GetParticleLifetime(index).
     *
     * GetParticleCount() items are in the returned array.
     */
    GetIndexByExpirationTimeBuffer() {
        // If particles are present, initialize / reinitialize the lifetime buffer.
        if (this.GetParticleCount()) {
            this.SetParticleLifetime(0, this.GetParticleLifetime(0));
        }
        else {
            this.m_indexByExpirationTimeBuffer.data = this.RequestBuffer(this.m_indexByExpirationTimeBuffer.data);
        }
        if (!this.m_indexByExpirationTimeBuffer.data) {
            throw new Error();
        }
        return this.m_indexByExpirationTimeBuffer.data;
    }
    /**
     * Apply an impulse to one particle. This immediately modifies
     * the velocity. Similar to b2Body::ApplyLinearImpulse.
     *
     * @param index the particle that will be modified.
     * @param impulse impulse the world impulse vector, usually in N-seconds or kg-m/s.
     */
    ParticleApplyLinearImpulse(index, impulse) {
        this.ApplyLinearImpulse(index, index + 1, impulse);
    }
    /**
     * Apply an impulse to all particles between 'firstIndex' and
     * 'lastIndex'. This immediately modifies the velocity. Note
     * that the impulse is applied to the total mass of all
     * particles. So, calling ParticleApplyLinearImpulse(0, impulse)
     * and ParticleApplyLinearImpulse(1, impulse) will impart twice
     * as much velocity as calling just ApplyLinearImpulse(0, 1,
     * impulse).
     *
     * @param firstIndex the first particle to be modified.
     * @param lastIndex the last particle to be modified.
     * @param impulse the world impulse vector, usually in N-seconds or kg-m/s.
     */
    ApplyLinearImpulse(firstIndex, lastIndex, impulse) {
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        const numParticles = (lastIndex - firstIndex);
        const totalMass = numParticles * this.GetParticleMass();
        ///const b2Vec2 velocityDelta = impulse / totalMass;
        const velocityDelta = new b2Vec2().Copy(impulse).SelfMul(1 / totalMass);
        for (let i = firstIndex; i < lastIndex; i++) {
            ///m_velocityBuffer.data[i] += velocityDelta;
            vel_data[i].SelfAdd(velocityDelta);
        }
    }
    static IsSignificantForce(force) {
        return force.x !== 0 || force.y !== 0;
    }
    /**
     * Apply a force to the center of a particle.
     *
     * @param index the particle that will be modified.
     * @param force the world force vector, usually in Newtons (N).
     */
    ParticleApplyForce(index, force) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (b2ParticleSystem.IsSignificantForce(force) &&
            this.ForceCanBeApplied(this.m_flagsBuffer.data[index])) {
            this.PrepareForceBuffer();
            ///m_forceBuffer[index] += force;
            this.m_forceBuffer[index].SelfAdd(force);
        }
    }
    /**
     * Distribute a force across several particles. The particles
     * must not be wall particles. Note that the force is
     * distributed across all the particles, so calling this
     * function for indices 0..N is not the same as calling
     * ParticleApplyForce(i, force) for i in 0..N.
     *
     * @param firstIndex the first particle to be modified.
     * @param lastIndex the last particle to be modified.
     * @param force the world force vector, usually in Newtons (N).
     */
    ApplyForce(firstIndex, lastIndex, force) {
        // Ensure we're not trying to apply force to particles that can't move,
        // such as wall particles.
        // DEBUG: if (!this.m_flagsBuffer.data) { throw new Error(); }
        // DEBUG: let flags = 0;
        // DEBUG: for (let i = firstIndex; i < lastIndex; i++) {
        // DEBUG:   flags |= this.m_flagsBuffer.data[i];
        // DEBUG: }
        // DEBUG: b2Assert(this.ForceCanBeApplied(flags));
        // Early out if force does nothing (optimization).
        ///const b2Vec2 distributedForce = force / (float32)(lastIndex - firstIndex);
        const distributedForce = new b2Vec2().Copy(force).SelfMul(1 / (lastIndex - firstIndex));
        if (b2ParticleSystem.IsSignificantForce(distributedForce)) {
            this.PrepareForceBuffer();
            // Distribute the force over all the particles.
            for (let i = firstIndex; i < lastIndex; i++) {
                ///m_forceBuffer[i] += distributedForce;
                this.m_forceBuffer[i].SelfAdd(distributedForce);
            }
        }
    }
    /**
     * Get the next particle-system in the world's particle-system
     * list.
     */
    GetNext() {
        return this.m_next;
    }
    /**
     * Query the particle system for all particles that potentially
     * overlap the provided AABB.
     * b2QueryCallback::ShouldQueryParticleSystem is ignored.
     *
     * @param callback a user implemented callback class.
     * @param aabb the query box.
     */
    QueryAABB(callback, aabb) {
        if (this.m_proxyBuffer.count === 0) {
            return;
        }
        const beginProxy = 0;
        const endProxy = this.m_proxyBuffer.count;
        const firstProxy = std_lower_bound(this.m_proxyBuffer.data, beginProxy, endProxy, b2ParticleSystem.computeTag(this.m_inverseDiameter * aabb.lowerBound.x, this.m_inverseDiameter * aabb.lowerBound.y), b2ParticleSystem.Proxy.CompareProxyTag);
        const lastProxy = std_upper_bound(this.m_proxyBuffer.data, firstProxy, endProxy, b2ParticleSystem.computeTag(this.m_inverseDiameter * aabb.upperBound.x, this.m_inverseDiameter * aabb.upperBound.y), b2ParticleSystem.Proxy.CompareTagProxy);
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        for (let k = firstProxy; k < lastProxy; ++k) {
            const proxy = this.m_proxyBuffer.data[k];
            const i = proxy.index;
            const p = pos_data[i];
            if (aabb.lowerBound.x < p.x && p.x < aabb.upperBound.x &&
                aabb.lowerBound.y < p.y && p.y < aabb.upperBound.y) {
                if (!callback.ReportParticle(this, i)) {
                    break;
                }
            }
        }
    }
    /**
     * Query the particle system for all particles that potentially
     * overlap the provided shape's AABB. Calls QueryAABB
     * internally. b2QueryCallback::ShouldQueryParticleSystem is
     * ignored.
     *
     * @param callback a user implemented callback class.
     * @param shape the query shape
     * @param xf the transform of the AABB
     * @param childIndex
     */
    QueryShapeAABB(callback, shape, xf, childIndex = 0) {
        const s_aabb = b2ParticleSystem.QueryShapeAABB_s_aabb;
        const aabb = s_aabb;
        shape.ComputeAABB(aabb, xf, childIndex);
        this.QueryAABB(callback, aabb);
    }
    QueryPointAABB(callback, point, slop = b2_linearSlop) {
        const s_aabb = b2ParticleSystem.QueryPointAABB_s_aabb;
        const aabb = s_aabb;
        aabb.lowerBound.Set(point.x - slop, point.y - slop);
        aabb.upperBound.Set(point.x + slop, point.y + slop);
        this.QueryAABB(callback, aabb);
    }
    /**
     * Ray-cast the particle system for all particles in the path of
     * the ray. Your callback controls whether you get the closest
     * point, any point, or n-points. The ray-cast ignores particles
     * that contain the starting point.
     * b2RayCastCallback::ShouldQueryParticleSystem is ignored.
     *
     * @param callback a user implemented callback class.
     * @param point1 the ray starting point
     * @param point2 the ray ending point
     */
    RayCast(callback, point1, point2) {
        const s_aabb = b2ParticleSystem.RayCast_s_aabb;
        const s_p = b2ParticleSystem.RayCast_s_p;
        const s_v = b2ParticleSystem.RayCast_s_v;
        const s_n = b2ParticleSystem.RayCast_s_n;
        const s_point = b2ParticleSystem.RayCast_s_point;
        if (this.m_proxyBuffer.count === 0) {
            return;
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const aabb = s_aabb;
        b2Vec2.MinV(point1, point2, aabb.lowerBound);
        b2Vec2.MaxV(point1, point2, aabb.upperBound);
        let fraction = 1;
        // solving the following equation:
        // ((1-t)*point1+t*point2-position)^2=diameter^2
        // where t is a potential fraction
        ///b2Vec2 v = point2 - point1;
        const v = b2Vec2.SubVV(point2, point1, s_v);
        const v2 = b2Vec2.DotVV(v, v);
        const enumerator = this.GetInsideBoundsEnumerator(aabb);
        let i;
        while ((i = enumerator.GetNext()) >= 0) {
            ///b2Vec2 p = point1 - m_positionBuffer.data[i];
            const p = b2Vec2.SubVV(point1, pos_data[i], s_p);
            const pv = b2Vec2.DotVV(p, v);
            const p2 = b2Vec2.DotVV(p, p);
            const determinant = pv * pv - v2 * (p2 - this.m_squaredDiameter);
            if (determinant >= 0) {
                const sqrtDeterminant = b2Sqrt(determinant);
                // find a solution between 0 and fraction
                let t = (-pv - sqrtDeterminant) / v2;
                if (t > fraction) {
                    continue;
                }
                if (t < 0) {
                    t = (-pv + sqrtDeterminant) / v2;
                    if (t < 0 || t > fraction) {
                        continue;
                    }
                }
                ///b2Vec2 n = p + t * v;
                const n = b2Vec2.AddVMulSV(p, t, v, s_n);
                n.Normalize();
                ///float32 f = callback.ReportParticle(this, i, point1 + t * v, n, t);
                const f = callback.ReportParticle(this, i, b2Vec2.AddVMulSV(point1, t, v, s_point), n, t);
                fraction = b2Min(fraction, f);
                if (fraction <= 0) {
                    break;
                }
            }
        }
    }
    /**
     * Compute the axis-aligned bounding box for all particles
     * contained within this particle system.
     * @param aabb Returns the axis-aligned bounding box of the system.
     */
    ComputeAABB(aabb) {
        const particleCount = this.GetParticleCount();
        // DEBUG: b2Assert(aabb !== null);
        aabb.lowerBound.x = +b2_maxFloat;
        aabb.lowerBound.y = +b2_maxFloat;
        aabb.upperBound.x = -b2_maxFloat;
        aabb.upperBound.y = -b2_maxFloat;
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        for (let i = 0; i < particleCount; i++) {
            const p = pos_data[i];
            b2Vec2.MinV(aabb.lowerBound, p, aabb.lowerBound);
            b2Vec2.MaxV(aabb.upperBound, p, aabb.upperBound);
        }
        aabb.lowerBound.x -= this.m_particleDiameter;
        aabb.lowerBound.y -= this.m_particleDiameter;
        aabb.upperBound.x += this.m_particleDiameter;
        aabb.upperBound.y += this.m_particleDiameter;
    }
    FreeBuffer(b, capacity) {
        if (b === null) {
            return;
        }
        b.length = 0;
    }
    FreeUserOverridableBuffer(b) {
        if (b.userSuppliedCapacity === 0) {
            this.FreeBuffer(b.data, this.m_internalAllocatedCapacity);
        }
    }
    /**
     * Reallocate a buffer
     */
    ReallocateBuffer3(oldBuffer, oldCapacity, newCapacity) {
        // b2Assert(newCapacity > oldCapacity);
        if (newCapacity <= oldCapacity) {
            throw new Error();
        }
        const newBuffer = (oldBuffer) ? oldBuffer.slice() : [];
        newBuffer.length = newCapacity;
        return newBuffer;
    }
    /**
     * Reallocate a buffer
     */
    ReallocateBuffer5(buffer, userSuppliedCapacity, oldCapacity, newCapacity, deferred) {
        // b2Assert(newCapacity > oldCapacity);
        if (newCapacity <= oldCapacity) {
            throw new Error();
        }
        // A 'deferred' buffer is reallocated only if it is not NULL.
        // If 'userSuppliedCapacity' is not zero, buffer is user supplied and must
        // be kept.
        // b2Assert(!userSuppliedCapacity || newCapacity <= userSuppliedCapacity);
        if (!(!userSuppliedCapacity || newCapacity <= userSuppliedCapacity)) {
            throw new Error();
        }
        if ((!deferred || buffer) && !userSuppliedCapacity) {
            buffer = this.ReallocateBuffer3(buffer, oldCapacity, newCapacity);
        }
        return buffer; // TODO: fix this
    }
    /**
     * Reallocate a buffer
     */
    ReallocateBuffer4(buffer, oldCapacity, newCapacity, deferred) {
        // DEBUG: b2Assert(newCapacity > oldCapacity);
        return this.ReallocateBuffer5(buffer.data, buffer.userSuppliedCapacity, oldCapacity, newCapacity, deferred);
    }
    RequestBuffer(buffer) {
        if (!buffer) {
            if (this.m_internalAllocatedCapacity === 0) {
                this.ReallocateInternalAllocatedBuffers(b2_minParticleSystemBufferCapacity);
            }
            buffer = [];
            buffer.length = this.m_internalAllocatedCapacity;
        }
        return buffer;
    }
    /**
     * Reallocate the handle / index map and schedule the allocation
     * of a new pool for handle allocation.
     */
    ReallocateHandleBuffers(newCapacity) {
        // DEBUG: b2Assert(newCapacity > this.m_internalAllocatedCapacity);
        // Reallocate a new handle / index map buffer, copying old handle pointers
        // is fine since they're kept around.
        this.m_handleIndexBuffer.data = this.ReallocateBuffer4(this.m_handleIndexBuffer, this.m_internalAllocatedCapacity, newCapacity, true);
        // Set the size of the next handle allocation.
        ///this.m_handleAllocator.SetItemsPerSlab(newCapacity - this.m_internalAllocatedCapacity);
    }
    ReallocateInternalAllocatedBuffers(capacity) {
        function LimitCapacity(capacity, maxCount) {
            return maxCount && capacity > maxCount ? maxCount : capacity;
        }
        // Don't increase capacity beyond the smallest user-supplied buffer size.
        capacity = LimitCapacity(capacity, this.m_def.maxCount);
        capacity = LimitCapacity(capacity, this.m_flagsBuffer.userSuppliedCapacity);
        capacity = LimitCapacity(capacity, this.m_positionBuffer.userSuppliedCapacity);
        capacity = LimitCapacity(capacity, this.m_velocityBuffer.userSuppliedCapacity);
        capacity = LimitCapacity(capacity, this.m_colorBuffer.userSuppliedCapacity);
        capacity = LimitCapacity(capacity, this.m_userDataBuffer.userSuppliedCapacity);
        if (this.m_internalAllocatedCapacity < capacity) {
            this.ReallocateHandleBuffers(capacity);
            this.m_flagsBuffer.data = this.ReallocateBuffer4(this.m_flagsBuffer, this.m_internalAllocatedCapacity, capacity, false);
            // Conditionally defer these as they are optional if the feature is
            // not enabled.
            const stuck = this.m_stuckThreshold > 0;
            this.m_lastBodyContactStepBuffer.data = this.ReallocateBuffer4(this.m_lastBodyContactStepBuffer, this.m_internalAllocatedCapacity, capacity, stuck);
            this.m_bodyContactCountBuffer.data = this.ReallocateBuffer4(this.m_bodyContactCountBuffer, this.m_internalAllocatedCapacity, capacity, stuck);
            this.m_consecutiveContactStepsBuffer.data = this.ReallocateBuffer4(this.m_consecutiveContactStepsBuffer, this.m_internalAllocatedCapacity, capacity, stuck);
            this.m_positionBuffer.data = this.ReallocateBuffer4(this.m_positionBuffer, this.m_internalAllocatedCapacity, capacity, false);
            this.m_velocityBuffer.data = this.ReallocateBuffer4(this.m_velocityBuffer, this.m_internalAllocatedCapacity, capacity, false);
            this.m_forceBuffer = this.ReallocateBuffer5(this.m_forceBuffer, 0, this.m_internalAllocatedCapacity, capacity, false);
            this.m_weightBuffer = this.ReallocateBuffer5(this.m_weightBuffer, 0, this.m_internalAllocatedCapacity, capacity, false);
            this.m_staticPressureBuffer = this.ReallocateBuffer5(this.m_staticPressureBuffer, 0, this.m_internalAllocatedCapacity, capacity, true);
            this.m_accumulationBuffer = this.ReallocateBuffer5(this.m_accumulationBuffer, 0, this.m_internalAllocatedCapacity, capacity, false);
            this.m_accumulation2Buffer = this.ReallocateBuffer5(this.m_accumulation2Buffer, 0, this.m_internalAllocatedCapacity, capacity, true);
            this.m_depthBuffer = this.ReallocateBuffer5(this.m_depthBuffer, 0, this.m_internalAllocatedCapacity, capacity, true);
            this.m_colorBuffer.data = this.ReallocateBuffer4(this.m_colorBuffer, this.m_internalAllocatedCapacity, capacity, true);
            this.m_groupBuffer = this.ReallocateBuffer5(this.m_groupBuffer, 0, this.m_internalAllocatedCapacity, capacity, false);
            this.m_userDataBuffer.data = this.ReallocateBuffer4(this.m_userDataBuffer, this.m_internalAllocatedCapacity, capacity, true);
            this.m_expirationTimeBuffer.data = this.ReallocateBuffer4(this.m_expirationTimeBuffer, this.m_internalAllocatedCapacity, capacity, true);
            this.m_indexByExpirationTimeBuffer.data = this.ReallocateBuffer4(this.m_indexByExpirationTimeBuffer, this.m_internalAllocatedCapacity, capacity, false);
            this.m_internalAllocatedCapacity = capacity;
        }
    }
    CreateParticleForGroup(groupDef, xf, p) {
        const particleDef = new b2ParticleDef();
        particleDef.flags = b2Maybe(groupDef.flags, 0);
        ///particleDef.position = b2Mul(xf, p);
        b2Transform.MulXV(xf, p, particleDef.position);
        ///particleDef.velocity =
        ///  groupDef.linearVelocity +
        ///  b2Cross(groupDef.angularVelocity,
        ///      particleDef.position - groupDef.position);
        b2Vec2.AddVV(b2Maybe(groupDef.linearVelocity, b2Vec2.ZERO), b2Vec2.CrossSV(b2Maybe(groupDef.angularVelocity, 0), b2Vec2.SubVV(particleDef.position, b2Maybe(groupDef.position, b2Vec2.ZERO), b2Vec2.s_t0), b2Vec2.s_t0), particleDef.velocity);
        particleDef.color.Copy(b2Maybe(groupDef.color, b2Color.ZERO));
        particleDef.lifetime = b2Maybe(groupDef.lifetime, 0);
        particleDef.userData = groupDef.userData;
        this.CreateParticle(particleDef);
    }
    CreateParticlesStrokeShapeForGroup(shape, groupDef, xf) {
        const s_edge = b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_edge;
        const s_d = b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_d;
        const s_p = b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_p;
        let stride = b2Maybe(groupDef.stride, 0);
        if (stride === 0) {
            stride = this.GetParticleStride();
        }
        let positionOnEdge = 0;
        const childCount = shape.GetChildCount();
        for (let childIndex = 0; childIndex < childCount; childIndex++) {
            let edge = null;
            if (shape.GetType() === b2ShapeType.e_edgeShape) {
                edge = shape;
            }
            else {
                // DEBUG: b2Assert(shape.GetType() === b2ShapeType.e_chainShape);
                edge = s_edge;
                shape.GetChildEdge(edge, childIndex);
            }
            const d = b2Vec2.SubVV(edge.m_vertex2, edge.m_vertex1, s_d);
            const edgeLength = d.Length();
            while (positionOnEdge < edgeLength) {
                ///b2Vec2 p = edge.m_vertex1 + positionOnEdge / edgeLength * d;
                const p = b2Vec2.AddVMulSV(edge.m_vertex1, positionOnEdge / edgeLength, d, s_p);
                this.CreateParticleForGroup(groupDef, xf, p);
                positionOnEdge += stride;
            }
            positionOnEdge -= edgeLength;
        }
    }
    CreateParticlesFillShapeForGroup(shape, groupDef, xf) {
        const s_aabb = b2ParticleSystem.CreateParticlesFillShapeForGroup_s_aabb;
        const s_p = b2ParticleSystem.CreateParticlesFillShapeForGroup_s_p;
        let stride = b2Maybe(groupDef.stride, 0);
        if (stride === 0) {
            stride = this.GetParticleStride();
        }
        ///b2Transform identity;
        /// identity.SetIdentity();
        const identity = b2Transform.IDENTITY;
        const aabb = s_aabb;
        // DEBUG: b2Assert(shape.GetChildCount() === 1);
        shape.ComputeAABB(aabb, identity, 0);
        for (let y = Math.floor(aabb.lowerBound.y / stride) * stride; y < aabb.upperBound.y; y += stride) {
            for (let x = Math.floor(aabb.lowerBound.x / stride) * stride; x < aabb.upperBound.x; x += stride) {
                const p = s_p.Set(x, y);
                if (shape.TestPoint(identity, p)) {
                    this.CreateParticleForGroup(groupDef, xf, p);
                }
            }
        }
    }
    CreateParticlesWithShapeForGroup(shape, groupDef, xf) {
        switch (shape.GetType()) {
            case b2ShapeType.e_edgeShape:
            case b2ShapeType.e_chainShape:
                this.CreateParticlesStrokeShapeForGroup(shape, groupDef, xf);
                break;
            case b2ShapeType.e_polygonShape:
            case b2ShapeType.e_circleShape:
                this.CreateParticlesFillShapeForGroup(shape, groupDef, xf);
                break;
            default:
                // DEBUG: b2Assert(false);
                break;
        }
    }
    CreateParticlesWithShapesForGroup(shapes, shapeCount, groupDef, xf) {
        const compositeShape = new b2ParticleSystem.CompositeShape(shapes, shapeCount);
        this.CreateParticlesFillShapeForGroup(compositeShape, groupDef, xf);
    }
    CloneParticle(oldIndex, group) {
        const def = new b2ParticleDef();
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        def.flags = this.m_flagsBuffer.data[oldIndex];
        def.position.Copy(this.m_positionBuffer.data[oldIndex]);
        def.velocity.Copy(this.m_velocityBuffer.data[oldIndex]);
        if (this.m_colorBuffer.data) {
            def.color.Copy(this.m_colorBuffer.data[oldIndex]);
        }
        if (this.m_userDataBuffer.data) {
            def.userData = this.m_userDataBuffer.data[oldIndex];
        }
        def.group = group;
        const newIndex = this.CreateParticle(def);
        if (this.m_handleIndexBuffer.data) {
            const handle = this.m_handleIndexBuffer.data[oldIndex];
            if (handle) {
                handle.SetIndex(newIndex);
            }
            this.m_handleIndexBuffer.data[newIndex] = handle;
            this.m_handleIndexBuffer.data[oldIndex] = null;
        }
        if (this.m_lastBodyContactStepBuffer.data) {
            this.m_lastBodyContactStepBuffer.data[newIndex] =
                this.m_lastBodyContactStepBuffer.data[oldIndex];
        }
        if (this.m_bodyContactCountBuffer.data) {
            this.m_bodyContactCountBuffer.data[newIndex] =
                this.m_bodyContactCountBuffer.data[oldIndex];
        }
        if (this.m_consecutiveContactStepsBuffer.data) {
            this.m_consecutiveContactStepsBuffer.data[newIndex] =
                this.m_consecutiveContactStepsBuffer.data[oldIndex];
        }
        if (this.m_hasForce) {
            this.m_forceBuffer[newIndex].Copy(this.m_forceBuffer[oldIndex]);
        }
        if (this.m_staticPressureBuffer) {
            this.m_staticPressureBuffer[newIndex] = this.m_staticPressureBuffer[oldIndex];
        }
        if (this.m_depthBuffer) {
            this.m_depthBuffer[newIndex] = this.m_depthBuffer[oldIndex];
        }
        if (this.m_expirationTimeBuffer.data) {
            this.m_expirationTimeBuffer.data[newIndex] =
                this.m_expirationTimeBuffer.data[oldIndex];
        }
        return newIndex;
    }
    DestroyParticlesInGroup(group, callDestructionListener = false) {
        for (let i = group.m_firstIndex; i < group.m_lastIndex; i++) {
            this.DestroyParticle(i, callDestructionListener);
        }
    }
    DestroyParticleGroup(group) {
        // DEBUG: b2Assert(this.m_groupCount > 0);
        // DEBUG: b2Assert(group !== null);
        if (this.m_world.m_destructionListener) {
            this.m_world.m_destructionListener.SayGoodbyeParticleGroup(group);
        }
        this.SetGroupFlags(group, 0);
        for (let i = group.m_firstIndex; i < group.m_lastIndex; i++) {
            this.m_groupBuffer[i] = null;
        }
        if (group.m_prev) {
            group.m_prev.m_next = group.m_next;
        }
        if (group.m_next) {
            group.m_next.m_prev = group.m_prev;
        }
        if (group === this.m_groupList) {
            this.m_groupList = group.m_next;
        }
        --this.m_groupCount;
    }
    static ParticleCanBeConnected(flags, group) {
        return ((flags & (b2ParticleFlag.b2_wallParticle | b2ParticleFlag.b2_springParticle | b2ParticleFlag.b2_elasticParticle)) !== 0) ||
            ((group !== null) && ((group.GetGroupFlags() & b2ParticleGroupFlag.b2_rigidParticleGroup) !== 0));
    }
    UpdatePairsAndTriads(firstIndex, lastIndex, filter) {
        const s_dab = b2ParticleSystem.UpdatePairsAndTriads_s_dab;
        const s_dbc = b2ParticleSystem.UpdatePairsAndTriads_s_dbc;
        const s_dca = b2ParticleSystem.UpdatePairsAndTriads_s_dca;
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        // Create pairs or triads.
        // All particles in each pair/triad should satisfy the following:
        // * firstIndex <= index < lastIndex
        // * don't have b2_zombieParticle
        // * ParticleCanBeConnected returns true
        // * ShouldCreatePair/ShouldCreateTriad returns true
        // Any particles in each pair/triad should satisfy the following:
        // * filter.IsNeeded returns true
        // * have one of k_pairFlags/k_triadsFlags
        // DEBUG: b2Assert(firstIndex <= lastIndex);
        let particleFlags = 0;
        for (let i = firstIndex; i < lastIndex; i++) {
            particleFlags |= this.m_flagsBuffer.data[i];
        }
        if (particleFlags & b2ParticleSystem.k_pairFlags) {
            for (let k = 0; k < this.m_contactBuffer.count; k++) {
                const contact = this.m_contactBuffer.data[k];
                const a = contact.indexA;
                const b = contact.indexB;
                const af = this.m_flagsBuffer.data[a];
                const bf = this.m_flagsBuffer.data[b];
                const groupA = this.m_groupBuffer[a];
                const groupB = this.m_groupBuffer[b];
                if (a >= firstIndex && a < lastIndex &&
                    b >= firstIndex && b < lastIndex &&
                    !((af | bf) & b2ParticleFlag.b2_zombieParticle) &&
                    ((af | bf) & b2ParticleSystem.k_pairFlags) &&
                    (filter.IsNecessary(a) || filter.IsNecessary(b)) &&
                    b2ParticleSystem.ParticleCanBeConnected(af, groupA) &&
                    b2ParticleSystem.ParticleCanBeConnected(bf, groupB) &&
                    filter.ShouldCreatePair(a, b)) {
                    ///b2ParticlePair& pair = m_pairBuffer.Append();
                    const pair = this.m_pairBuffer.data[this.m_pairBuffer.Append()];
                    pair.indexA = a;
                    pair.indexB = b;
                    pair.flags = contact.flags;
                    pair.strength = b2Min(groupA ? groupA.m_strength : 1, groupB ? groupB.m_strength : 1);
                    ///pair.distance = b2Distance(pos_data[a], pos_data[b]); // TODO: this was wrong!
                    pair.distance = b2Vec2.DistanceVV(pos_data[a], pos_data[b]);
                }
                ///std::stable_sort(m_pairBuffer.Begin(), m_pairBuffer.End(), ComparePairIndices);
                std_stable_sort(this.m_pairBuffer.data, 0, this.m_pairBuffer.count, b2ParticleSystem.ComparePairIndices);
                ///m_pairBuffer.Unique(MatchPairIndices);
                this.m_pairBuffer.Unique(b2ParticleSystem.MatchPairIndices);
            }
        }
        if (particleFlags & b2ParticleSystem.k_triadFlags) {
            const diagram = new b2VoronoiDiagram(lastIndex - firstIndex);
            ///let necessary_count = 0;
            for (let i = firstIndex; i < lastIndex; i++) {
                const flags = this.m_flagsBuffer.data[i];
                const group = this.m_groupBuffer[i];
                if (!(flags & b2ParticleFlag.b2_zombieParticle) &&
                    b2ParticleSystem.ParticleCanBeConnected(flags, group)) {
                    ///if (filter.IsNecessary(i)) {
                    ///++necessary_count;
                    ///}
                    diagram.AddGenerator(pos_data[i], i, filter.IsNecessary(i));
                }
            }
            ///if (necessary_count === 0) {
            /////debugger;
            ///for (let i = firstIndex; i < lastIndex; i++) {
            ///  filter.IsNecessary(i);
            ///}
            ///}
            const stride = this.GetParticleStride();
            diagram.Generate(stride / 2, stride * 2);
            const system = this;
            const callback = /*UpdateTriadsCallback*/ (a, b, c) => {
                if (!system.m_flagsBuffer.data) {
                    throw new Error();
                }
                const af = system.m_flagsBuffer.data[a];
                const bf = system.m_flagsBuffer.data[b];
                const cf = system.m_flagsBuffer.data[c];
                if (((af | bf | cf) & b2ParticleSystem.k_triadFlags) &&
                    filter.ShouldCreateTriad(a, b, c)) {
                    const pa = pos_data[a];
                    const pb = pos_data[b];
                    const pc = pos_data[c];
                    const dab = b2Vec2.SubVV(pa, pb, s_dab);
                    const dbc = b2Vec2.SubVV(pb, pc, s_dbc);
                    const dca = b2Vec2.SubVV(pc, pa, s_dca);
                    const maxDistanceSquared = b2_maxTriadDistanceSquared * system.m_squaredDiameter;
                    if (b2Vec2.DotVV(dab, dab) > maxDistanceSquared ||
                        b2Vec2.DotVV(dbc, dbc) > maxDistanceSquared ||
                        b2Vec2.DotVV(dca, dca) > maxDistanceSquared) {
                        return;
                    }
                    const groupA = system.m_groupBuffer[a];
                    const groupB = system.m_groupBuffer[b];
                    const groupC = system.m_groupBuffer[c];
                    ///b2ParticleTriad& triad = m_system.m_triadBuffer.Append();
                    const triad = system.m_triadBuffer.data[system.m_triadBuffer.Append()];
                    triad.indexA = a;
                    triad.indexB = b;
                    triad.indexC = c;
                    triad.flags = af | bf | cf;
                    triad.strength = b2Min(b2Min(groupA ? groupA.m_strength : 1, groupB ? groupB.m_strength : 1), groupC ? groupC.m_strength : 1);
                    ///let midPoint = b2Vec2.MulSV(1.0 / 3.0, b2Vec2.AddVV(pa, b2Vec2.AddVV(pb, pc, new b2Vec2()), new b2Vec2()), new b2Vec2());
                    const midPoint_x = (pa.x + pb.x + pc.x) / 3.0;
                    const midPoint_y = (pa.y + pb.y + pc.y) / 3.0;
                    ///triad.pa = b2Vec2.SubVV(pa, midPoint, new b2Vec2());
                    triad.pa.x = pa.x - midPoint_x;
                    triad.pa.y = pa.y - midPoint_y;
                    ///triad.pb = b2Vec2.SubVV(pb, midPoint, new b2Vec2());
                    triad.pb.x = pb.x - midPoint_x;
                    triad.pb.y = pb.y - midPoint_y;
                    ///triad.pc = b2Vec2.SubVV(pc, midPoint, new b2Vec2());
                    triad.pc.x = pc.x - midPoint_x;
                    triad.pc.y = pc.y - midPoint_y;
                    triad.ka = -b2Vec2.DotVV(dca, dab);
                    triad.kb = -b2Vec2.DotVV(dab, dbc);
                    triad.kc = -b2Vec2.DotVV(dbc, dca);
                    triad.s = b2Vec2.CrossVV(pa, pb) + b2Vec2.CrossVV(pb, pc) + b2Vec2.CrossVV(pc, pa);
                }
            };
            diagram.GetNodes(callback);
            ///std::stable_sort(m_triadBuffer.Begin(), m_triadBuffer.End(), CompareTriadIndices);
            std_stable_sort(this.m_triadBuffer.data, 0, this.m_triadBuffer.count, b2ParticleSystem.CompareTriadIndices);
            ///m_triadBuffer.Unique(MatchTriadIndices);
            this.m_triadBuffer.Unique(b2ParticleSystem.MatchTriadIndices);
        }
    }
    UpdatePairsAndTriadsWithReactiveParticles() {
        const filter = new b2ParticleSystem.ReactiveFilter(this.m_flagsBuffer);
        this.UpdatePairsAndTriads(0, this.m_count, filter);
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        for (let i = 0; i < this.m_count; i++) {
            this.m_flagsBuffer.data[i] &= ~b2ParticleFlag.b2_reactiveParticle;
        }
        this.m_allParticleFlags &= ~b2ParticleFlag.b2_reactiveParticle;
    }
    static ComparePairIndices(a, b) {
        const diffA = a.indexA - b.indexA;
        if (diffA !== 0) {
            return diffA < 0;
        }
        return a.indexB < b.indexB;
    }
    static MatchPairIndices(a, b) {
        return a.indexA === b.indexA && a.indexB === b.indexB;
    }
    static CompareTriadIndices(a, b) {
        const diffA = a.indexA - b.indexA;
        if (diffA !== 0) {
            return diffA < 0;
        }
        const diffB = a.indexB - b.indexB;
        if (diffB !== 0) {
            return diffB < 0;
        }
        return a.indexC < b.indexC;
    }
    static MatchTriadIndices(a, b) {
        return a.indexA === b.indexA && a.indexB === b.indexB && a.indexC === b.indexC;
    }
    static InitializeParticleLists(group, nodeBuffer) {
        const bufferIndex = group.GetBufferIndex();
        const particleCount = group.GetParticleCount();
        for (let i = 0; i < particleCount; i++) {
            const node = nodeBuffer[i];
            node.list = node;
            node.next = null;
            node.count = 1;
            node.index = i + bufferIndex;
        }
    }
    MergeParticleListsInContact(group, nodeBuffer) {
        const bufferIndex = group.GetBufferIndex();
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            /*const b2ParticleContact&*/
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            if (!group.ContainsParticle(a) || !group.ContainsParticle(b)) {
                continue;
            }
            let listA = nodeBuffer[a - bufferIndex].list;
            let listB = nodeBuffer[b - bufferIndex].list;
            if (listA === listB) {
                continue;
            }
            // To minimize the cost of insertion, make sure listA is longer than
            // listB.
            if (listA.count < listB.count) {
                const _tmp = listA;
                listA = listB;
                listB = _tmp; ///b2Swap(listA, listB);
            }
            // DEBUG: b2Assert(listA.count >= listB.count);
            b2ParticleSystem.MergeParticleLists(listA, listB);
        }
    }
    static MergeParticleLists(listA, listB) {
        // Insert listB between index 0 and 1 of listA
        // Example:
        //     listA => a1 => a2 => a3 => null
        //     listB => b1 => b2 => null
        // to
        //     listA => listB => b1 => b2 => a1 => a2 => a3 => null
        // DEBUG: b2Assert(listA !== listB);
        for (let b = listB;;) {
            b.list = listA;
            const nextB = b.next;
            if (nextB) {
                b = nextB;
            }
            else {
                b.next = listA.next;
                break;
            }
        }
        listA.next = listB;
        listA.count += listB.count;
        listB.count = 0;
    }
    static FindLongestParticleList(group, nodeBuffer) {
        const particleCount = group.GetParticleCount();
        let result = nodeBuffer[0];
        for (let i = 0; i < particleCount; i++) {
            const node = nodeBuffer[i];
            if (result.count < node.count) {
                result = node;
            }
        }
        return result;
    }
    MergeZombieParticleListNodes(group, nodeBuffer, survivingList) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        const particleCount = group.GetParticleCount();
        for (let i = 0; i < particleCount; i++) {
            const node = nodeBuffer[i];
            if (node !== survivingList &&
                (this.m_flagsBuffer.data[node.index] & b2ParticleFlag.b2_zombieParticle)) {
                b2ParticleSystem.MergeParticleListAndNode(survivingList, node);
            }
        }
    }
    static MergeParticleListAndNode(list, node) {
        // Insert node between index 0 and 1 of list
        // Example:
        //     list => a1 => a2 => a3 => null
        //     node => null
        // to
        //     list => node => a1 => a2 => a3 => null
        // DEBUG: b2Assert(node !== list);
        // DEBUG: b2Assert(node.list === node);
        // DEBUG: b2Assert(node.count === 1);
        node.list = list;
        node.next = list.next;
        list.next = node;
        list.count++;
        node.count = 0;
    }
    CreateParticleGroupsFromParticleList(group, nodeBuffer, survivingList) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        const particleCount = group.GetParticleCount();
        const def = new b2ParticleGroupDef();
        def.groupFlags = group.GetGroupFlags();
        def.userData = group.GetUserData();
        for (let i = 0; i < particleCount; i++) {
            const list = nodeBuffer[i];
            if (!list.count || list === survivingList) {
                continue;
            }
            // DEBUG: b2Assert(list.list === list);
            const newGroup = this.CreateParticleGroup(def);
            for (let node = list; node; node = node.next) {
                const oldIndex = node.index;
                // DEBUG: const flags = this.m_flagsBuffer.data[oldIndex];
                // DEBUG: b2Assert(!(flags & b2ParticleFlag.b2_zombieParticle));
                const newIndex = this.CloneParticle(oldIndex, newGroup);
                this.m_flagsBuffer.data[oldIndex] |= b2ParticleFlag.b2_zombieParticle;
                node.index = newIndex;
            }
        }
    }
    UpdatePairsAndTriadsWithParticleList(group, nodeBuffer) {
        const bufferIndex = group.GetBufferIndex();
        // Update indices in pairs and triads. If an index belongs to the group,
        // replace it with the corresponding value in nodeBuffer.
        // Note that nodeBuffer is allocated only for the group and the index should
        // be shifted by bufferIndex.
        for (let k = 0; k < this.m_pairBuffer.count; k++) {
            const pair = this.m_pairBuffer.data[k];
            const a = pair.indexA;
            const b = pair.indexB;
            if (group.ContainsParticle(a)) {
                pair.indexA = nodeBuffer[a - bufferIndex].index;
            }
            if (group.ContainsParticle(b)) {
                pair.indexB = nodeBuffer[b - bufferIndex].index;
            }
        }
        for (let k = 0; k < this.m_triadBuffer.count; k++) {
            const triad = this.m_triadBuffer.data[k];
            const a = triad.indexA;
            const b = triad.indexB;
            const c = triad.indexC;
            if (group.ContainsParticle(a)) {
                triad.indexA = nodeBuffer[a - bufferIndex].index;
            }
            if (group.ContainsParticle(b)) {
                triad.indexB = nodeBuffer[b - bufferIndex].index;
            }
            if (group.ContainsParticle(c)) {
                triad.indexC = nodeBuffer[c - bufferIndex].index;
            }
        }
    }
    ComputeDepth() {
        ///b2ParticleContact* contactGroups = (b2ParticleContact*) this.m_world.m_stackAllocator.Allocate(sizeof(b2ParticleContact) * this.m_contactBuffer.GetCount());
        const contactGroups = []; // TODO: static
        let contactGroupsCount = 0;
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            const groupA = this.m_groupBuffer[a];
            const groupB = this.m_groupBuffer[b];
            if (groupA && groupA === groupB &&
                (groupA.m_groupFlags & b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth)) {
                contactGroups[contactGroupsCount++] = contact;
            }
        }
        ///b2ParticleGroup** groupsToUpdate = (b2ParticleGroup**) this.m_world.m_stackAllocator.Allocate(sizeof(b2ParticleGroup*) * this.m_groupCount);
        const groupsToUpdate = []; // TODO: static
        let groupsToUpdateCount = 0;
        for (let group = this.m_groupList; group; group = group.GetNext()) {
            if (group.m_groupFlags & b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth) {
                groupsToUpdate[groupsToUpdateCount++] = group;
                this.SetGroupFlags(group, group.m_groupFlags &
                    ~b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth);
                for (let i = group.m_firstIndex; i < group.m_lastIndex; i++) {
                    this.m_accumulationBuffer[i] = 0;
                }
            }
        }
        // Compute sum of weight of contacts except between different groups.
        for (let k = 0; k < contactGroupsCount; k++) {
            const contact = contactGroups[k];
            const a = contact.indexA;
            const b = contact.indexB;
            const w = contact.weight;
            this.m_accumulationBuffer[a] += w;
            this.m_accumulationBuffer[b] += w;
        }
        // DEBUG: b2Assert(this.m_depthBuffer !== null);
        for (let i = 0; i < groupsToUpdateCount; i++) {
            const group = groupsToUpdate[i];
            for (let i = group.m_firstIndex; i < group.m_lastIndex; i++) {
                const w = this.m_accumulationBuffer[i];
                this.m_depthBuffer[i] = w < 0.8 ? 0 : b2_maxFloat;
            }
        }
        // The number of iterations is equal to particle number from the deepest
        // particle to the nearest surface particle, and in general it is smaller
        // than sqrt of total particle number.
        ///int32 iterationCount = (int32)b2Sqrt((float)m_count);
        const iterationCount = b2Sqrt(this.m_count) >> 0;
        for (let t = 0; t < iterationCount; t++) {
            let updated = false;
            for (let k = 0; k < contactGroupsCount; k++) {
                const contact = contactGroups[k];
                const a = contact.indexA;
                const b = contact.indexB;
                const r = 1 - contact.weight;
                ///float32& ap0 = m_depthBuffer[a];
                const ap0 = this.m_depthBuffer[a];
                ///float32& bp0 = m_depthBuffer[b];
                const bp0 = this.m_depthBuffer[b];
                const ap1 = bp0 + r;
                const bp1 = ap0 + r;
                if (ap0 > ap1) {
                    ///ap0 = ap1;
                    this.m_depthBuffer[a] = ap1;
                    updated = true;
                }
                if (bp0 > bp1) {
                    ///bp0 = bp1;
                    this.m_depthBuffer[b] = bp1;
                    updated = true;
                }
            }
            if (!updated) {
                break;
            }
        }
        for (let i = 0; i < groupsToUpdateCount; i++) {
            const group = groupsToUpdate[i];
            for (let i = group.m_firstIndex; i < group.m_lastIndex; i++) {
                if (this.m_depthBuffer[i] < b2_maxFloat) {
                    this.m_depthBuffer[i] *= this.m_particleDiameter;
                }
                else {
                    this.m_depthBuffer[i] = 0;
                }
            }
        }
        ///this.m_world.m_stackAllocator.Free(groupsToUpdate);
        ///this.m_world.m_stackAllocator.Free(contactGroups);
    }
    GetInsideBoundsEnumerator(aabb) {
        const lowerTag = b2ParticleSystem.computeTag(this.m_inverseDiameter * aabb.lowerBound.x - 1, this.m_inverseDiameter * aabb.lowerBound.y - 1);
        const upperTag = b2ParticleSystem.computeTag(this.m_inverseDiameter * aabb.upperBound.x + 1, this.m_inverseDiameter * aabb.upperBound.y + 1);
        ///const Proxy* beginProxy = m_proxyBuffer.Begin();
        const beginProxy = 0;
        ///const Proxy* endProxy = m_proxyBuffer.End();
        const endProxy = this.m_proxyBuffer.count;
        ///const Proxy* firstProxy = std::lower_bound(beginProxy, endProxy, lowerTag);
        const firstProxy = std_lower_bound(this.m_proxyBuffer.data, beginProxy, endProxy, lowerTag, b2ParticleSystem.Proxy.CompareProxyTag);
        ///const Proxy* lastProxy = std::upper_bound(firstProxy, endProxy, upperTag);
        const lastProxy = std_upper_bound(this.m_proxyBuffer.data, beginProxy, endProxy, upperTag, b2ParticleSystem.Proxy.CompareTagProxy);
        // DEBUG: b2Assert(beginProxy <= firstProxy);
        // DEBUG: b2Assert(firstProxy <= lastProxy);
        // DEBUG: b2Assert(lastProxy <= endProxy);
        return new b2ParticleSystem.InsideBoundsEnumerator(this, lowerTag, upperTag, firstProxy, lastProxy);
    }
    UpdateAllParticleFlags() {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        this.m_allParticleFlags = 0;
        for (let i = 0; i < this.m_count; i++) {
            this.m_allParticleFlags |= this.m_flagsBuffer.data[i];
        }
        this.m_needsUpdateAllParticleFlags = false;
    }
    UpdateAllGroupFlags() {
        this.m_allGroupFlags = 0;
        for (let group = this.m_groupList; group; group = group.GetNext()) {
            this.m_allGroupFlags |= group.m_groupFlags;
        }
        this.m_needsUpdateAllGroupFlags = false;
    }
    AddContact(a, b, contacts) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        const s_d = b2ParticleSystem.AddContact_s_d;
        const pos_data = this.m_positionBuffer.data;
        // DEBUG: b2Assert(contacts === this.m_contactBuffer);
        ///b2Vec2 d = m_positionBuffer.data[b] - m_positionBuffer.data[a];
        const d = b2Vec2.SubVV(pos_data[b], pos_data[a], s_d);
        const distBtParticlesSq = b2Vec2.DotVV(d, d);
        if (distBtParticlesSq < this.m_squaredDiameter) {
            let invD = b2InvSqrt(distBtParticlesSq);
            if (!isFinite(invD)) {
                invD = 1.98177537e+019;
            }
            ///b2ParticleContact& contact = contacts.Append();
            const contact = this.m_contactBuffer.data[this.m_contactBuffer.Append()];
            contact.indexA = a;
            contact.indexB = b;
            contact.flags = this.m_flagsBuffer.data[a] | this.m_flagsBuffer.data[b];
            contact.weight = 1 - distBtParticlesSq * invD * this.m_inverseDiameter;
            ///contact.SetNormal(invD * d);
            b2Vec2.MulSV(invD, d, contact.normal);
        }
    }
    FindContacts_Reference(contacts) {
        // DEBUG: b2Assert(contacts === this.m_contactBuffer);
        const beginProxy = 0;
        const endProxy = this.m_proxyBuffer.count;
        this.m_contactBuffer.count = 0;
        for (let a = beginProxy, c = beginProxy; a < endProxy; a++) {
            const rightTag = b2ParticleSystem.computeRelativeTag(this.m_proxyBuffer.data[a].tag, 1, 0);
            for (let b = a + 1; b < endProxy; b++) {
                if (rightTag < this.m_proxyBuffer.data[b].tag) {
                    break;
                }
                this.AddContact(this.m_proxyBuffer.data[a].index, this.m_proxyBuffer.data[b].index, this.m_contactBuffer);
            }
            const bottomLeftTag = b2ParticleSystem.computeRelativeTag(this.m_proxyBuffer.data[a].tag, -1, 1);
            for (; c < endProxy; c++) {
                if (bottomLeftTag <= this.m_proxyBuffer.data[c].tag) {
                    break;
                }
            }
            const bottomRightTag = b2ParticleSystem.computeRelativeTag(this.m_proxyBuffer.data[a].tag, 1, 1);
            for (let b = c; b < endProxy; b++) {
                if (bottomRightTag < this.m_proxyBuffer.data[b].tag) {
                    break;
                }
                this.AddContact(this.m_proxyBuffer.data[a].index, this.m_proxyBuffer.data[b].index, this.m_contactBuffer);
            }
        }
    }
    ///void ReorderForFindContact(FindContactInput* reordered, int alignedCount) const;
    ///void GatherChecksOneParticle(const uint32 bound, const int startIndex, const int particleIndex, int* nextUncheckedIndex, b2GrowableBuffer<FindContactCheck>& checks) const;
    ///void GatherChecks(b2GrowableBuffer<FindContactCheck>& checks) const;
    ///void FindContacts_Simd(b2GrowableBuffer<b2ParticleContact>& contacts) const;
    FindContacts(contacts) {
        this.FindContacts_Reference(contacts);
    }
    ///static void UpdateProxyTags(const uint32* const tags, b2GrowableBuffer<Proxy>& proxies);
    ///static bool ProxyBufferHasIndex(int32 index, const Proxy* const a, int count);
    ///static int NumProxiesWithSameTag(const Proxy* const a, const Proxy* const b, int count);
    ///static bool AreProxyBuffersTheSame(const b2GrowableBuffer<Proxy>& a, const b2GrowableBuffer<Proxy>& b);
    UpdateProxies_Reference(proxies) {
        // DEBUG: b2Assert(proxies === this.m_proxyBuffer);
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const inv_diam = this.m_inverseDiameter;
        for (let k = 0; k < this.m_proxyBuffer.count; ++k) {
            const proxy = this.m_proxyBuffer.data[k];
            const i = proxy.index;
            const p = pos_data[i];
            proxy.tag = b2ParticleSystem.computeTag(inv_diam * p.x, inv_diam * p.y);
        }
    }
    ///void UpdateProxies_Simd(b2GrowableBuffer<Proxy>& proxies) const;
    UpdateProxies(proxies) {
        this.UpdateProxies_Reference(proxies);
    }
    SortProxies(proxies) {
        // DEBUG: b2Assert(proxies === this.m_proxyBuffer);
        ///std::sort(proxies.Begin(), proxies.End());
        std_sort(this.m_proxyBuffer.data, 0, this.m_proxyBuffer.count, b2ParticleSystem.Proxy.CompareProxyProxy);
    }
    FilterContacts(contacts) {
        // Optionally filter the contact.
        const contactFilter = this.GetParticleContactFilter();
        if (contactFilter === null) {
            return;
        }
        /// contacts.RemoveIf(b2ParticleContactRemovePredicate(this, contactFilter));
        // DEBUG: b2Assert(contacts === this.m_contactBuffer);
        const system = this;
        const predicate = (contact) => {
            return ((contact.flags & b2ParticleFlag.b2_particleContactFilterParticle) !== 0) && !contactFilter.ShouldCollideParticleParticle(system, contact.indexA, contact.indexB);
        };
        this.m_contactBuffer.RemoveIf(predicate);
    }
    NotifyContactListenerPreContact(particlePairs) {
        const contactListener = this.GetParticleContactListener();
        if (contactListener === null) {
            return;
        }
        ///particlePairs.Initialize(m_contactBuffer.Begin(), m_contactBuffer.GetCount(), GetFlagsBuffer());
        particlePairs.Initialize(this.m_contactBuffer, this.m_flagsBuffer);
        throw new Error(); // TODO: notify
    }
    NotifyContactListenerPostContact(particlePairs) {
        const contactListener = this.GetParticleContactListener();
        if (contactListener === null) {
            return;
        }
        // Loop through all new contacts, reporting any new ones, and
        // "invalidating" the ones that still exist.
        ///const b2ParticleContact* const endContact = m_contactBuffer.End();
        ///for (b2ParticleContact* contact = m_contactBuffer.Begin(); contact < endContact; ++contact)
        for (let k = 0; k < this.m_contactBuffer.count; ++k) {
            const contact = this.m_contactBuffer.data[k];
            ///ParticlePair pair;
            ///pair.first = contact.GetIndexA();
            ///pair.second = contact.GetIndexB();
            ///const int32 itemIndex = particlePairs.Find(pair);
            const itemIndex = -1; // TODO
            if (itemIndex >= 0) {
                // Already touching, ignore this contact.
                particlePairs.Invalidate(itemIndex);
            }
            else {
                // Just started touching, inform the listener.
                contactListener.BeginContactParticleParticle(this, contact);
            }
        }
        // Report particles that are no longer touching.
        // That is, any pairs that were not invalidated above.
        ///const int32 pairCount = particlePairs.GetCount();
        ///const ParticlePair* const pairs = particlePairs.GetBuffer();
        ///const int8* const valid = particlePairs.GetValidBuffer();
        ///for (int32 i = 0; i < pairCount; ++i)
        ///{
        ///  if (valid[i])
        ///  {
        ///    contactListener.EndContactParticleParticle(this, pairs[i].first, pairs[i].second);
        ///  }
        ///}
        throw new Error(); // TODO: notify
    }
    static b2ParticleContactIsZombie(contact) {
        return (contact.flags & b2ParticleFlag.b2_zombieParticle) === b2ParticleFlag.b2_zombieParticle;
    }
    UpdateContacts(exceptZombie) {
        this.UpdateProxies(this.m_proxyBuffer);
        this.SortProxies(this.m_proxyBuffer);
        ///b2ParticlePairSet particlePairs(&this.m_world.m_stackAllocator);
        const particlePairs = new b2ParticleSystem.b2ParticlePairSet(); // TODO: static
        this.NotifyContactListenerPreContact(particlePairs);
        this.FindContacts(this.m_contactBuffer);
        this.FilterContacts(this.m_contactBuffer);
        this.NotifyContactListenerPostContact(particlePairs);
        if (exceptZombie) {
            this.m_contactBuffer.RemoveIf(b2ParticleSystem.b2ParticleContactIsZombie);
        }
    }
    NotifyBodyContactListenerPreContact(fixtureSet) {
        const contactListener = this.GetFixtureContactListener();
        if (contactListener === null) {
            return;
        }
        ///fixtureSet.Initialize(m_bodyContactBuffer.Begin(), m_bodyContactBuffer.GetCount(), GetFlagsBuffer());
        fixtureSet.Initialize(this.m_bodyContactBuffer, this.m_flagsBuffer);
        throw new Error(); // TODO: notify
    }
    NotifyBodyContactListenerPostContact(fixtureSet) {
        const contactListener = this.GetFixtureContactListener();
        if (contactListener === null) {
            return;
        }
        // Loop through all new contacts, reporting any new ones, and
        // "invalidating" the ones that still exist.
        ///for (b2ParticleBodyContact* contact = m_bodyContactBuffer.Begin(); contact !== m_bodyContactBuffer.End(); ++contact)
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            // DEBUG: b2Assert(contact !== null);
            ///FixtureParticle fixtureParticleToFind;
            ///fixtureParticleToFind.first = contact.fixture;
            ///fixtureParticleToFind.second = contact.index;
            ///const int32 index = fixtureSet.Find(fixtureParticleToFind);
            const index = -1; // TODO
            if (index >= 0) {
                // Already touching remove this from the set.
                fixtureSet.Invalidate(index);
            }
            else {
                // Just started touching, report it!
                contactListener.BeginContactFixtureParticle(this, contact);
            }
        }
        // If the contact listener is enabled, report all fixtures that are no
        // longer in contact with particles.
        ///const FixtureParticle* const fixtureParticles = fixtureSet.GetBuffer();
        ///const int8* const fixtureParticlesValid = fixtureSet.GetValidBuffer();
        ///const int32 fixtureParticleCount = fixtureSet.GetCount();
        ///for (int32 i = 0; i < fixtureParticleCount; ++i)
        ///{
        ///  if (fixtureParticlesValid[i])
        ///  {
        ///    const FixtureParticle* const fixtureParticle = &fixtureParticles[i];
        ///    contactListener.EndContactFixtureParticle(fixtureParticle.first, this, fixtureParticle.second);
        ///  }
        ///}
        throw new Error(); // TODO: notify
    }
    UpdateBodyContacts() {
        const s_aabb = b2ParticleSystem.UpdateBodyContacts_s_aabb;
        // If the particle contact listener is enabled, generate a set of
        // fixture / particle contacts.
        ///FixtureParticleSet fixtureSet(&m_world.m_stackAllocator);
        const fixtureSet = new b2ParticleSystem.FixtureParticleSet(); // TODO: static
        this.NotifyBodyContactListenerPreContact(fixtureSet);
        if (this.m_stuckThreshold > 0) {
            if (!this.m_bodyContactCountBuffer.data) {
                throw new Error();
            }
            if (!this.m_lastBodyContactStepBuffer.data) {
                throw new Error();
            }
            if (!this.m_consecutiveContactStepsBuffer.data) {
                throw new Error();
            }
            const particleCount = this.GetParticleCount();
            for (let i = 0; i < particleCount; i++) {
                // Detect stuck particles, see comment in
                // b2ParticleSystem::DetectStuckParticle()
                this.m_bodyContactCountBuffer.data[i] = 0;
                if (this.m_timestamp > (this.m_lastBodyContactStepBuffer.data[i] + 1)) {
                    this.m_consecutiveContactStepsBuffer.data[i] = 0;
                }
            }
        }
        this.m_bodyContactBuffer.SetCount(0);
        this.m_stuckParticleBuffer.SetCount(0);
        const aabb = s_aabb;
        this.ComputeAABB(aabb);
        const callback = new b2ParticleSystem.UpdateBodyContactsCallback(this, this.GetFixtureContactFilter());
        this.m_world.QueryAABB(callback, aabb);
        if (this.m_def.strictContactCheck) {
            this.RemoveSpuriousBodyContacts();
        }
        this.NotifyBodyContactListenerPostContact(fixtureSet);
    }
    Solve(step) {
        const s_subStep = b2ParticleSystem.Solve_s_subStep;
        if (this.m_count === 0) {
            return;
        }
        // If particle lifetimes are enabled, destroy particles that are too old.
        if (this.m_expirationTimeBuffer.data) {
            this.SolveLifetimes(step);
        }
        if (this.m_allParticleFlags & b2ParticleFlag.b2_zombieParticle) {
            this.SolveZombie();
        }
        if (this.m_needsUpdateAllParticleFlags) {
            this.UpdateAllParticleFlags();
        }
        if (this.m_needsUpdateAllGroupFlags) {
            this.UpdateAllGroupFlags();
        }
        if (this.m_paused) {
            return;
        }
        for (this.m_iterationIndex = 0; this.m_iterationIndex < step.particleIterations; this.m_iterationIndex++) {
            ++this.m_timestamp;
            const subStep = s_subStep.Copy(step);
            subStep.dt /= step.particleIterations;
            subStep.inv_dt *= step.particleIterations;
            this.UpdateContacts(false);
            this.UpdateBodyContacts();
            this.ComputeWeight();
            if (this.m_allGroupFlags & b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth) {
                this.ComputeDepth();
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_reactiveParticle) {
                this.UpdatePairsAndTriadsWithReactiveParticles();
            }
            if (this.m_hasForce) {
                this.SolveForce(subStep);
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_viscousParticle) {
                this.SolveViscous();
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_repulsiveParticle) {
                this.SolveRepulsive(subStep);
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_powderParticle) {
                this.SolvePowder(subStep);
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_tensileParticle) {
                this.SolveTensile(subStep);
            }
            if (this.m_allGroupFlags & b2ParticleGroupFlag.b2_solidParticleGroup) {
                this.SolveSolid(subStep);
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_colorMixingParticle) {
                this.SolveColorMixing();
            }
            this.SolveGravity(subStep);
            if (this.m_allParticleFlags & b2ParticleFlag.b2_staticPressureParticle) {
                this.SolveStaticPressure(subStep);
            }
            this.SolvePressure(subStep);
            this.SolveDamping(subStep);
            if (this.m_allParticleFlags & b2ParticleSystem.k_extraDampingFlags) {
                this.SolveExtraDamping();
            }
            // SolveElastic and SolveSpring refer the current velocities for
            // numerical stability, they should be called as late as possible.
            if (this.m_allParticleFlags & b2ParticleFlag.b2_elasticParticle) {
                this.SolveElastic(subStep);
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_springParticle) {
                this.SolveSpring(subStep);
            }
            this.LimitVelocity(subStep);
            if (this.m_allGroupFlags & b2ParticleGroupFlag.b2_rigidParticleGroup) {
                this.SolveRigidDamping();
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_barrierParticle) {
                this.SolveBarrier(subStep);
            }
            // SolveCollision, SolveRigid and SolveWall should be called after
            // other force functions because they may require particles to have
            // specific velocities.
            this.SolveCollision(subStep);
            if (this.m_allGroupFlags & b2ParticleGroupFlag.b2_rigidParticleGroup) {
                this.SolveRigid(subStep);
            }
            if (this.m_allParticleFlags & b2ParticleFlag.b2_wallParticle) {
                this.SolveWall();
            }
            // The particle positions can be updated only at the end of substep.
            if (!this.m_positionBuffer.data) {
                throw new Error();
            }
            if (!this.m_velocityBuffer.data) {
                throw new Error();
            }
            for (let i = 0; i < this.m_count; i++) {
                ///m_positionBuffer.data[i] += subStep.dt * m_velocityBuffer.data[i];
                this.m_positionBuffer.data[i].SelfMulAdd(subStep.dt, this.m_velocityBuffer.data[i]);
            }
        }
    }
    SolveCollision(step) {
        const s_aabb = b2ParticleSystem.SolveCollision_s_aabb;
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        // This function detects particles which are crossing boundary of bodies
        // and modifies velocities of them so that they will move just in front of
        // boundary. This function function also applies the reaction force to
        // bodies as precisely as the numerical stability is kept.
        const aabb = s_aabb;
        aabb.lowerBound.x = +b2_maxFloat;
        aabb.lowerBound.y = +b2_maxFloat;
        aabb.upperBound.x = -b2_maxFloat;
        aabb.upperBound.y = -b2_maxFloat;
        for (let i = 0; i < this.m_count; i++) {
            const v = vel_data[i];
            const p1 = pos_data[i];
            ///let p2 = p1 + step.dt * v;
            const p2_x = p1.x + step.dt * v.x;
            const p2_y = p1.y + step.dt * v.y;
            ///aabb.lowerBound = b2Min(aabb.lowerBound, b2Min(p1, p2));
            aabb.lowerBound.x = b2Min(aabb.lowerBound.x, b2Min(p1.x, p2_x));
            aabb.lowerBound.y = b2Min(aabb.lowerBound.y, b2Min(p1.y, p2_y));
            ///aabb.upperBound = b2Max(aabb.upperBound, b2Max(p1, p2));
            aabb.upperBound.x = b2Max(aabb.upperBound.x, b2Max(p1.x, p2_x));
            aabb.upperBound.y = b2Max(aabb.upperBound.y, b2Max(p1.y, p2_y));
        }
        const callback = new b2ParticleSystem.SolveCollisionCallback(this, step);
        this.m_world.QueryAABB(callback, aabb);
    }
    LimitVelocity(step) {
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        const criticalVelocitySquared = this.GetCriticalVelocitySquared(step);
        for (let i = 0; i < this.m_count; i++) {
            const v = vel_data[i];
            const v2 = b2Vec2.DotVV(v, v);
            if (v2 > criticalVelocitySquared) {
                ///v *= b2Sqrt(criticalVelocitySquared / v2);
                v.SelfMul(b2Sqrt(criticalVelocitySquared / v2));
            }
        }
    }
    SolveGravity(step) {
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const s_gravity = b2ParticleSystem.SolveGravity_s_gravity;
        const vel_data = this.m_velocityBuffer.data;
        ///b2Vec2 gravity = step.dt * m_def.gravityScale * m_world.GetGravity();
        const gravity = b2Vec2.MulSV(step.dt * this.m_def.gravityScale, this.m_world.GetGravity(), s_gravity);
        for (let i = 0; i < this.m_count; i++) {
            vel_data[i].SelfAdd(gravity);
        }
    }
    SolveBarrier(step) {
        const s_aabb = b2ParticleSystem.SolveBarrier_s_aabb;
        const s_va = b2ParticleSystem.SolveBarrier_s_va;
        const s_vb = b2ParticleSystem.SolveBarrier_s_vb;
        const s_pba = b2ParticleSystem.SolveBarrier_s_pba;
        const s_vba = b2ParticleSystem.SolveBarrier_s_vba;
        const s_vc = b2ParticleSystem.SolveBarrier_s_vc;
        const s_pca = b2ParticleSystem.SolveBarrier_s_pca;
        const s_vca = b2ParticleSystem.SolveBarrier_s_vca;
        const s_qba = b2ParticleSystem.SolveBarrier_s_qba;
        const s_qca = b2ParticleSystem.SolveBarrier_s_qca;
        const s_dv = b2ParticleSystem.SolveBarrier_s_dv;
        const s_f = b2ParticleSystem.SolveBarrier_s_f;
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        // If a particle is passing between paired barrier particles,
        // its velocity will be decelerated to avoid passing.
        for (let i = 0; i < this.m_count; i++) {
            const flags = this.m_flagsBuffer.data[i];
            ///if ((flags & b2ParticleSystem.k_barrierWallFlags) === b2ParticleSystem.k_barrierWallFlags)
            if ((flags & b2ParticleSystem.k_barrierWallFlags) !== 0) {
                vel_data[i].SetZero();
            }
        }
        const tmax = b2_barrierCollisionTime * step.dt;
        const mass = this.GetParticleMass();
        for (let k = 0; k < this.m_pairBuffer.count; k++) {
            const pair = this.m_pairBuffer.data[k];
            if (pair.flags & b2ParticleFlag.b2_barrierParticle) {
                const a = pair.indexA;
                const b = pair.indexB;
                const pa = pos_data[a];
                const pb = pos_data[b];
                /// b2AABB aabb;
                const aabb = s_aabb;
                ///aabb.lowerBound = b2Min(pa, pb);
                b2Vec2.MinV(pa, pb, aabb.lowerBound);
                ///aabb.upperBound = b2Max(pa, pb);
                b2Vec2.MaxV(pa, pb, aabb.upperBound);
                const aGroup = this.m_groupBuffer[a];
                const bGroup = this.m_groupBuffer[b];
                ///b2Vec2 va = GetLinearVelocity(aGroup, a, pa);
                const va = this.GetLinearVelocity(aGroup, a, pa, s_va);
                ///b2Vec2 vb = GetLinearVelocity(bGroup, b, pb);
                const vb = this.GetLinearVelocity(bGroup, b, pb, s_vb);
                ///b2Vec2 pba = pb - pa;
                const pba = b2Vec2.SubVV(pb, pa, s_pba);
                ///b2Vec2 vba = vb - va;
                const vba = b2Vec2.SubVV(vb, va, s_vba);
                ///InsideBoundsEnumerator enumerator = GetInsideBoundsEnumerator(aabb);
                const enumerator = this.GetInsideBoundsEnumerator(aabb);
                let c;
                while ((c = enumerator.GetNext()) >= 0) {
                    const pc = pos_data[c];
                    const cGroup = this.m_groupBuffer[c];
                    if (aGroup !== cGroup && bGroup !== cGroup) {
                        ///b2Vec2 vc = GetLinearVelocity(cGroup, c, pc);
                        const vc = this.GetLinearVelocity(cGroup, c, pc, s_vc);
                        // Solve the equation below:
                        //   (1-s)*(pa+t*va)+s*(pb+t*vb) = pc+t*vc
                        // which expresses that the particle c will pass a line
                        // connecting the particles a and b at the time of t.
                        // if s is between 0 and 1, c will pass between a and b.
                        ///b2Vec2 pca = pc - pa;
                        const pca = b2Vec2.SubVV(pc, pa, s_pca);
                        ///b2Vec2 vca = vc - va;
                        const vca = b2Vec2.SubVV(vc, va, s_vca);
                        const e2 = b2Vec2.CrossVV(vba, vca);
                        const e1 = b2Vec2.CrossVV(pba, vca) - b2Vec2.CrossVV(pca, vba);
                        const e0 = b2Vec2.CrossVV(pba, pca);
                        let s, t;
                        ///b2Vec2 qba, qca;
                        const qba = s_qba, qca = s_qca;
                        if (e2 === 0) {
                            if (e1 === 0) {
                                continue;
                            }
                            t = -e0 / e1;
                            if (!(t >= 0 && t < tmax)) {
                                continue;
                            }
                            ///qba = pba + t * vba;
                            b2Vec2.AddVMulSV(pba, t, vba, qba);
                            ///qca = pca + t * vca;
                            b2Vec2.AddVMulSV(pca, t, vca, qca);
                            s = b2Vec2.DotVV(qba, qca) / b2Vec2.DotVV(qba, qba);
                            if (!(s >= 0 && s <= 1)) {
                                continue;
                            }
                        }
                        else {
                            const det = e1 * e1 - 4 * e0 * e2;
                            if (det < 0) {
                                continue;
                            }
                            const sqrtDet = b2Sqrt(det);
                            let t1 = (-e1 - sqrtDet) / (2 * e2);
                            let t2 = (-e1 + sqrtDet) / (2 * e2);
                            ///if (t1 > t2) b2Swap(t1, t2);
                            if (t1 > t2) {
                                const tmp = t1;
                                t1 = t2;
                                t2 = tmp;
                            }
                            t = t1;
                            ///qba = pba + t * vba;
                            b2Vec2.AddVMulSV(pba, t, vba, qba);
                            ///qca = pca + t * vca;
                            b2Vec2.AddVMulSV(pca, t, vca, qca);
                            ///s = b2Dot(qba, qca) / b2Dot(qba, qba);
                            s = b2Vec2.DotVV(qba, qca) / b2Vec2.DotVV(qba, qba);
                            if (!(t >= 0 && t < tmax && s >= 0 && s <= 1)) {
                                t = t2;
                                if (!(t >= 0 && t < tmax)) {
                                    continue;
                                }
                                ///qba = pba + t * vba;
                                b2Vec2.AddVMulSV(pba, t, vba, qba);
                                ///qca = pca + t * vca;
                                b2Vec2.AddVMulSV(pca, t, vca, qca);
                                ///s = b2Dot(qba, qca) / b2Dot(qba, qba);
                                s = b2Vec2.DotVV(qba, qca) / b2Vec2.DotVV(qba, qba);
                                if (!(s >= 0 && s <= 1)) {
                                    continue;
                                }
                            }
                        }
                        // Apply a force to particle c so that it will have the
                        // interpolated velocity at the collision point on line ab.
                        ///b2Vec2 dv = va + s * vba - vc;
                        const dv = s_dv;
                        dv.x = va.x + s * vba.x - vc.x;
                        dv.y = va.y + s * vba.y - vc.y;
                        ///b2Vec2 f = GetParticleMass() * dv;
                        const f = b2Vec2.MulSV(mass, dv, s_f);
                        if (cGroup && this.IsRigidGroup(cGroup)) {
                            // If c belongs to a rigid group, the force will be
                            // distributed in the group.
                            const mass = cGroup.GetMass();
                            const inertia = cGroup.GetInertia();
                            if (mass > 0) {
                                ///cGroup.m_linearVelocity += 1 / mass * f;
                                cGroup.m_linearVelocity.SelfMulAdd(1 / mass, f);
                            }
                            if (inertia > 0) {
                                ///cGroup.m_angularVelocity += b2Cross(pc - cGroup.GetCenter(), f) / inertia;
                                cGroup.m_angularVelocity += b2Vec2.CrossVV(b2Vec2.SubVV(pc, cGroup.GetCenter(), b2Vec2.s_t0), f) / inertia;
                            }
                        }
                        else {
                            ///m_velocityBuffer.data[c] += dv;
                            vel_data[c].SelfAdd(dv);
                        }
                        // Apply a reversed force to particle c after particle
                        // movement so that momentum will be preserved.
                        ///ParticleApplyForce(c, -step.inv_dt * f);
                        this.ParticleApplyForce(c, f.SelfMul(-step.inv_dt));
                    }
                }
            }
        }
    }
    SolveStaticPressure(step) {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        this.m_staticPressureBuffer = this.RequestBuffer(this.m_staticPressureBuffer);
        const criticalPressure = this.GetCriticalPressure(step);
        const pressurePerWeight = this.m_def.staticPressureStrength * criticalPressure;
        const maxPressure = b2_maxParticlePressure * criticalPressure;
        const relaxation = this.m_def.staticPressureRelaxation;
        /// Compute pressure satisfying the modified Poisson equation:
        ///   Sum_for_j((p_i - p_j) * w_ij) + relaxation * p_i =
        ///   pressurePerWeight * (w_i - b2_minParticleWeight)
        /// by iterating the calculation:
        ///   p_i = (Sum_for_j(p_j * w_ij) + pressurePerWeight *
        ///         (w_i - b2_minParticleWeight)) / (w_i + relaxation)
        /// where
        ///   p_i and p_j are static pressure of particle i and j
        ///   w_ij is contact weight between particle i and j
        ///   w_i is sum of contact weight of particle i
        for (let t = 0; t < this.m_def.staticPressureIterations; t++) {
            ///memset(m_accumulationBuffer, 0, sizeof(*m_accumulationBuffer) * m_count);
            for (let i = 0; i < this.m_count; i++) {
                this.m_accumulationBuffer[i] = 0;
            }
            for (let k = 0; k < this.m_contactBuffer.count; k++) {
                const contact = this.m_contactBuffer.data[k];
                if (contact.flags & b2ParticleFlag.b2_staticPressureParticle) {
                    const a = contact.indexA;
                    const b = contact.indexB;
                    const w = contact.weight;
                    this.m_accumulationBuffer[a] += w * this.m_staticPressureBuffer[b]; // a <- b
                    this.m_accumulationBuffer[b] += w * this.m_staticPressureBuffer[a]; // b <- a
                }
            }
            for (let i = 0; i < this.m_count; i++) {
                const w = this.m_weightBuffer[i];
                if (this.m_flagsBuffer.data[i] & b2ParticleFlag.b2_staticPressureParticle) {
                    const wh = this.m_accumulationBuffer[i];
                    const h = (wh + pressurePerWeight * (w - b2_minParticleWeight)) /
                        (w + relaxation);
                    this.m_staticPressureBuffer[i] = b2Clamp(h, 0.0, maxPressure);
                }
                else {
                    this.m_staticPressureBuffer[i] = 0;
                }
            }
        }
    }
    ComputeWeight() {
        // calculates the sum of contact-weights for each particle
        // that means dimensionless density
        ///memset(m_weightBuffer, 0, sizeof(*m_weightBuffer) * m_count);
        for (let k = 0; k < this.m_count; k++) {
            this.m_weightBuffer[k] = 0;
        }
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            const a = contact.index;
            const w = contact.weight;
            this.m_weightBuffer[a] += w;
        }
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            const w = contact.weight;
            this.m_weightBuffer[a] += w;
            this.m_weightBuffer[b] += w;
        }
    }
    SolvePressure(step) {
        const s_f = b2ParticleSystem.SolvePressure_s_f;
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        // calculates pressure as a linear function of density
        const criticalPressure = this.GetCriticalPressure(step);
        const pressurePerWeight = this.m_def.pressureStrength * criticalPressure;
        const maxPressure = b2_maxParticlePressure * criticalPressure;
        for (let i = 0; i < this.m_count; i++) {
            const w = this.m_weightBuffer[i];
            const h = pressurePerWeight * b2Max(0.0, w - b2_minParticleWeight);
            this.m_accumulationBuffer[i] = b2Min(h, maxPressure);
        }
        // ignores particles which have their own repulsive force
        if (this.m_allParticleFlags & b2ParticleSystem.k_noPressureFlags) {
            for (let i = 0; i < this.m_count; i++) {
                if (this.m_flagsBuffer.data[i] & b2ParticleSystem.k_noPressureFlags) {
                    this.m_accumulationBuffer[i] = 0;
                }
            }
        }
        // static pressure
        if (this.m_allParticleFlags & b2ParticleFlag.b2_staticPressureParticle) {
            // DEBUG: b2Assert(this.m_staticPressureBuffer !== null);
            for (let i = 0; i < this.m_count; i++) {
                if (this.m_flagsBuffer.data[i] & b2ParticleFlag.b2_staticPressureParticle) {
                    this.m_accumulationBuffer[i] += this.m_staticPressureBuffer[i];
                }
            }
        }
        // applies pressure between each particles in contact
        const velocityPerPressure = step.dt / (this.m_def.density * this.m_particleDiameter);
        const inv_mass = this.GetParticleInvMass();
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            const a = contact.index;
            const b = contact.body;
            const w = contact.weight;
            const m = contact.mass;
            const n = contact.normal;
            const p = pos_data[a];
            const h = this.m_accumulationBuffer[a] + pressurePerWeight * w;
            ///b2Vec2 f = velocityPerPressure * w * m * h * n;
            const f = b2Vec2.MulSV(velocityPerPressure * w * m * h, n, s_f);
            ///m_velocityBuffer.data[a] -= GetParticleInvMass() * f;
            vel_data[a].SelfMulSub(inv_mass, f);
            b.ApplyLinearImpulse(f, p, true);
        }
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            const w = contact.weight;
            const n = contact.normal;
            const h = this.m_accumulationBuffer[a] + this.m_accumulationBuffer[b];
            ///b2Vec2 f = velocityPerPressure * w * h * n;
            const f = b2Vec2.MulSV(velocityPerPressure * w * h, n, s_f);
            ///m_velocityBuffer.data[a] -= f;
            vel_data[a].SelfSub(f);
            ///m_velocityBuffer.data[b] += f;
            vel_data[b].SelfAdd(f);
        }
    }
    SolveDamping(step) {
        const s_v = b2ParticleSystem.SolveDamping_s_v;
        const s_f = b2ParticleSystem.SolveDamping_s_f;
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        // reduces normal velocity of each contact
        const linearDamping = this.m_def.dampingStrength;
        const quadraticDamping = 1 / this.GetCriticalVelocity(step);
        const inv_mass = this.GetParticleInvMass();
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            const a = contact.index;
            const b = contact.body;
            const w = contact.weight;
            const m = contact.mass;
            const n = contact.normal;
            const p = pos_data[a];
            ///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - m_velocityBuffer.data[a];
            const v = b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p, b2Vec2.s_t0), vel_data[a], s_v);
            const vn = b2Vec2.DotVV(v, n);
            if (vn < 0) {
                const damping = b2Max(linearDamping * w, b2Min(-quadraticDamping * vn, 0.5));
                ///b2Vec2 f = damping * m * vn * n;
                const f = b2Vec2.MulSV(damping * m * vn, n, s_f);
                ///m_velocityBuffer.data[a] += GetParticleInvMass() * f;
                vel_data[a].SelfMulAdd(inv_mass, f);
                ///b.ApplyLinearImpulse(-f, p, true);
                b.ApplyLinearImpulse(f.SelfNeg(), p, true);
            }
        }
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            const w = contact.weight;
            const n = contact.normal;
            ///b2Vec2 v = m_velocityBuffer.data[b] - m_velocityBuffer.data[a];
            const v = b2Vec2.SubVV(vel_data[b], vel_data[a], s_v);
            const vn = b2Vec2.DotVV(v, n);
            if (vn < 0) {
                ///float32 damping = b2Max(linearDamping * w, b2Min(- quadraticDamping * vn, 0.5f));
                const damping = b2Max(linearDamping * w, b2Min(-quadraticDamping * vn, 0.5));
                ///b2Vec2 f = damping * vn * n;
                const f = b2Vec2.MulSV(damping * vn, n, s_f);
                ///this.m_velocityBuffer.data[a] += f;
                vel_data[a].SelfAdd(f);
                ///this.m_velocityBuffer.data[b] -= f;
                vel_data[b].SelfSub(f);
            }
        }
    }
    SolveRigidDamping() {
        const s_t0 = b2ParticleSystem.SolveRigidDamping_s_t0;
        const s_t1 = b2ParticleSystem.SolveRigidDamping_s_t1;
        const s_p = b2ParticleSystem.SolveRigidDamping_s_p;
        const s_v = b2ParticleSystem.SolveRigidDamping_s_v;
        const invMassA = [0.0], invInertiaA = [0.0], tangentDistanceA = [0.0]; // TODO: static
        const invMassB = [0.0], invInertiaB = [0.0], tangentDistanceB = [0.0]; // TODO: static
        // Apply impulse to rigid particle groups colliding with other objects
        // to reduce relative velocity at the colliding point.
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const damping = this.m_def.dampingStrength;
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            const a = contact.index;
            const aGroup = this.m_groupBuffer[a];
            if (aGroup && this.IsRigidGroup(aGroup)) {
                const b = contact.body;
                const n = contact.normal;
                const w = contact.weight;
                const p = pos_data[a];
                ///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - aGroup.GetLinearVelocityFromWorldPoint(p);
                const v = b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p, s_t0), aGroup.GetLinearVelocityFromWorldPoint(p, s_t1), s_v);
                const vn = b2Vec2.DotVV(v, n);
                if (vn < 0) {
                    // The group's average velocity at particle position 'p' is pushing
                    // the particle into the body.
                    ///this.InitDampingParameterWithRigidGroupOrParticle(&invMassA, &invInertiaA, &tangentDistanceA, true, aGroup, a, p, n);
                    this.InitDampingParameterWithRigidGroupOrParticle(invMassA, invInertiaA, tangentDistanceA, true, aGroup, a, p, n);
                    // Calculate b.m_I from public functions of b2Body.
                    ///this.InitDampingParameter(&invMassB, &invInertiaB, &tangentDistanceB, b.GetMass(), b.GetInertia() - b.GetMass() * b.GetLocalCenter().LengthSquared(), b.GetWorldCenter(), p, n);
                    this.InitDampingParameter(invMassB, invInertiaB, tangentDistanceB, b.GetMass(), b.GetInertia() - b.GetMass() * b.GetLocalCenter().LengthSquared(), b.GetWorldCenter(), p, n);
                    ///float32 f = damping * b2Min(w, 1.0) * this.ComputeDampingImpulse(invMassA, invInertiaA, tangentDistanceA, invMassB, invInertiaB, tangentDistanceB, vn);
                    const f = damping * b2Min(w, 1.0) * this.ComputeDampingImpulse(invMassA[0], invInertiaA[0], tangentDistanceA[0], invMassB[0], invInertiaB[0], tangentDistanceB[0], vn);
                    ///this.ApplyDamping(invMassA, invInertiaA, tangentDistanceA, true, aGroup, a, f, n);
                    this.ApplyDamping(invMassA[0], invInertiaA[0], tangentDistanceA[0], true, aGroup, a, f, n);
                    ///b.ApplyLinearImpulse(-f * n, p, true);
                    b.ApplyLinearImpulse(b2Vec2.MulSV(-f, n, b2Vec2.s_t0), p, true);
                }
            }
        }
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            const n = contact.normal;
            const w = contact.weight;
            const aGroup = this.m_groupBuffer[a];
            const bGroup = this.m_groupBuffer[b];
            const aRigid = this.IsRigidGroup(aGroup);
            const bRigid = this.IsRigidGroup(bGroup);
            if (aGroup !== bGroup && (aRigid || bRigid)) {
                ///b2Vec2 p = 0.5f * (this.m_positionBuffer.data[a] + this.m_positionBuffer.data[b]);
                const p = b2Vec2.MidVV(pos_data[a], pos_data[b], s_p);
                ///b2Vec2 v = GetLinearVelocity(bGroup, b, p) - GetLinearVelocity(aGroup, a, p);
                const v = b2Vec2.SubVV(this.GetLinearVelocity(bGroup, b, p, s_t0), this.GetLinearVelocity(aGroup, a, p, s_t1), s_v);
                const vn = b2Vec2.DotVV(v, n);
                if (vn < 0) {
                    ///this.InitDampingParameterWithRigidGroupOrParticle(&invMassA, &invInertiaA, &tangentDistanceA, aRigid, aGroup, a, p, n);
                    this.InitDampingParameterWithRigidGroupOrParticle(invMassA, invInertiaA, tangentDistanceA, aRigid, aGroup, a, p, n);
                    ///this.InitDampingParameterWithRigidGroupOrParticle(&invMassB, &invInertiaB, &tangentDistanceB, bRigid, bGroup, b, p, n);
                    this.InitDampingParameterWithRigidGroupOrParticle(invMassB, invInertiaB, tangentDistanceB, bRigid, bGroup, b, p, n);
                    ///float32 f = damping * w * this.ComputeDampingImpulse(invMassA, invInertiaA, tangentDistanceA, invMassB, invInertiaB, tangentDistanceB, vn);
                    const f = damping * w * this.ComputeDampingImpulse(invMassA[0], invInertiaA[0], tangentDistanceA[0], invMassB[0], invInertiaB[0], tangentDistanceB[0], vn);
                    ///this.ApplyDamping(invMassA, invInertiaA, tangentDistanceA, aRigid, aGroup, a, f, n);
                    this.ApplyDamping(invMassA[0], invInertiaA[0], tangentDistanceA[0], aRigid, aGroup, a, f, n);
                    ///this.ApplyDamping(invMassB, invInertiaB, tangentDistanceB, bRigid, bGroup, b, -f, n);
                    this.ApplyDamping(invMassB[0], invInertiaB[0], tangentDistanceB[0], bRigid, bGroup, b, -f, n);
                }
            }
        }
    }
    SolveExtraDamping() {
        const s_v = b2ParticleSystem.SolveExtraDamping_s_v;
        const s_f = b2ParticleSystem.SolveExtraDamping_s_f;
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        // Applies additional damping force between bodies and particles which can
        // produce strong repulsive force. Applying damping force multiple times
        // is effective in suppressing vibration.
        const pos_data = this.m_positionBuffer.data;
        const inv_mass = this.GetParticleInvMass();
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            const a = contact.index;
            if (this.m_flagsBuffer.data[a] & b2ParticleSystem.k_extraDampingFlags) {
                const b = contact.body;
                const m = contact.mass;
                const n = contact.normal;
                const p = pos_data[a];
                ///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - m_velocityBuffer.data[a];
                const v = b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p, b2Vec2.s_t0), vel_data[a], s_v);
                ///float32 vn = b2Dot(v, n);
                const vn = b2Vec2.DotVV(v, n);
                if (vn < 0) {
                    ///b2Vec2 f = 0.5f * m * vn * n;
                    const f = b2Vec2.MulSV(0.5 * m * vn, n, s_f);
                    ///m_velocityBuffer.data[a] += GetParticleInvMass() * f;
                    vel_data[a].SelfMulAdd(inv_mass, f);
                    ///b.ApplyLinearImpulse(-f, p, true);
                    b.ApplyLinearImpulse(f.SelfNeg(), p, true);
                }
            }
        }
    }
    SolveWall() {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        for (let i = 0; i < this.m_count; i++) {
            if (this.m_flagsBuffer.data[i] & b2ParticleFlag.b2_wallParticle) {
                vel_data[i].SetZero();
            }
        }
    }
    SolveRigid(step) {
        const s_position = b2ParticleSystem.SolveRigid_s_position;
        const s_rotation = b2ParticleSystem.SolveRigid_s_rotation;
        const s_transform = b2ParticleSystem.SolveRigid_s_transform;
        const s_velocityTransform = b2ParticleSystem.SolveRigid_s_velocityTransform;
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        for (let group = this.m_groupList; group; group = group.GetNext()) {
            if (group.m_groupFlags & b2ParticleGroupFlag.b2_rigidParticleGroup) {
                group.UpdateStatistics();
                ///b2Rot rotation(step.dt * group.m_angularVelocity);
                const rotation = s_rotation;
                rotation.SetAngle(step.dt * group.m_angularVelocity);
                ///b2Transform transform(group.m_center + step.dt * group.m_linearVelocity - b2Mul(rotation, group.m_center), rotation);
                const position = b2Vec2.AddVV(group.m_center, b2Vec2.SubVV(b2Vec2.MulSV(step.dt, group.m_linearVelocity, b2Vec2.s_t0), b2Rot.MulRV(rotation, group.m_center, b2Vec2.s_t1), b2Vec2.s_t0), s_position);
                const transform = s_transform;
                transform.SetPositionRotation(position, rotation);
                ///group.m_transform = b2Mul(transform, group.m_transform);
                b2Transform.MulXX(transform, group.m_transform, group.m_transform);
                const velocityTransform = s_velocityTransform;
                velocityTransform.p.x = step.inv_dt * transform.p.x;
                velocityTransform.p.y = step.inv_dt * transform.p.y;
                velocityTransform.q.s = step.inv_dt * transform.q.s;
                velocityTransform.q.c = step.inv_dt * (transform.q.c - 1);
                for (let i = group.m_firstIndex; i < group.m_lastIndex; i++) {
                    ///m_velocityBuffer.data[i] = b2Mul(velocityTransform, m_positionBuffer.data[i]);
                    b2Transform.MulXV(velocityTransform, pos_data[i], vel_data[i]);
                }
            }
        }
    }
    SolveElastic(step) {
        const s_pa = b2ParticleSystem.SolveElastic_s_pa;
        const s_pb = b2ParticleSystem.SolveElastic_s_pb;
        const s_pc = b2ParticleSystem.SolveElastic_s_pc;
        const s_r = b2ParticleSystem.SolveElastic_s_r;
        const s_t0 = b2ParticleSystem.SolveElastic_s_t0;
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        const elasticStrength = step.inv_dt * this.m_def.elasticStrength;
        for (let k = 0; k < this.m_triadBuffer.count; k++) {
            const triad = this.m_triadBuffer.data[k];
            if (triad.flags & b2ParticleFlag.b2_elasticParticle) {
                const a = triad.indexA;
                const b = triad.indexB;
                const c = triad.indexC;
                const oa = triad.pa;
                const ob = triad.pb;
                const oc = triad.pc;
                ///b2Vec2 pa = m_positionBuffer.data[a];
                const pa = s_pa.Copy(pos_data[a]);
                ///b2Vec2 pb = m_positionBuffer.data[b];
                const pb = s_pb.Copy(pos_data[b]);
                ///b2Vec2 pc = m_positionBuffer.data[c];
                const pc = s_pc.Copy(pos_data[c]);
                const va = vel_data[a];
                const vb = vel_data[b];
                const vc = vel_data[c];
                ///pa += step.dt * va;
                pa.SelfMulAdd(step.dt, va);
                ///pb += step.dt * vb;
                pb.SelfMulAdd(step.dt, vb);
                ///pc += step.dt * vc;
                pc.SelfMulAdd(step.dt, vc);
                ///b2Vec2 midPoint = (float32) 1 / 3 * (pa + pb + pc);
                const midPoint_x = (pa.x + pb.x + pc.x) / 3.0;
                const midPoint_y = (pa.y + pb.y + pc.y) / 3.0;
                ///pa -= midPoint;
                pa.x -= midPoint_x;
                pa.y -= midPoint_y;
                ///pb -= midPoint;
                pb.x -= midPoint_x;
                pb.y -= midPoint_y;
                ///pc -= midPoint;
                pc.x -= midPoint_x;
                pc.y -= midPoint_y;
                ///b2Rot r;
                const r = s_r;
                r.s = b2Vec2.CrossVV(oa, pa) + b2Vec2.CrossVV(ob, pb) + b2Vec2.CrossVV(oc, pc);
                r.c = b2Vec2.DotVV(oa, pa) + b2Vec2.DotVV(ob, pb) + b2Vec2.DotVV(oc, pc);
                const r2 = r.s * r.s + r.c * r.c;
                let invR = b2InvSqrt(r2);
                if (!isFinite(invR)) {
                    invR = 1.98177537e+019;
                }
                r.s *= invR;
                r.c *= invR;
                ///r.angle = Math.atan2(r.s, r.c); // TODO: optimize
                const strength = elasticStrength * triad.strength;
                ///va += strength * (b2Mul(r, oa) - pa);
                b2Rot.MulRV(r, oa, s_t0);
                b2Vec2.SubVV(s_t0, pa, s_t0);
                b2Vec2.MulSV(strength, s_t0, s_t0);
                va.SelfAdd(s_t0);
                ///vb += strength * (b2Mul(r, ob) - pb);
                b2Rot.MulRV(r, ob, s_t0);
                b2Vec2.SubVV(s_t0, pb, s_t0);
                b2Vec2.MulSV(strength, s_t0, s_t0);
                vb.SelfAdd(s_t0);
                ///vc += strength * (b2Mul(r, oc) - pc);
                b2Rot.MulRV(r, oc, s_t0);
                b2Vec2.SubVV(s_t0, pc, s_t0);
                b2Vec2.MulSV(strength, s_t0, s_t0);
                vc.SelfAdd(s_t0);
            }
        }
    }
    SolveSpring(step) {
        const s_pa = b2ParticleSystem.SolveSpring_s_pa;
        const s_pb = b2ParticleSystem.SolveSpring_s_pb;
        const s_d = b2ParticleSystem.SolveSpring_s_d;
        const s_f = b2ParticleSystem.SolveSpring_s_f;
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        const springStrength = step.inv_dt * this.m_def.springStrength;
        for (let k = 0; k < this.m_pairBuffer.count; k++) {
            const pair = this.m_pairBuffer.data[k];
            if (pair.flags & b2ParticleFlag.b2_springParticle) {
                ///int32 a = pair.indexA;
                const a = pair.indexA;
                ///int32 b = pair.indexB;
                const b = pair.indexB;
                ///b2Vec2 pa = m_positionBuffer.data[a];
                const pa = s_pa.Copy(pos_data[a]);
                ///b2Vec2 pb = m_positionBuffer.data[b];
                const pb = s_pb.Copy(pos_data[b]);
                ///b2Vec2& va = m_velocityBuffer.data[a];
                const va = vel_data[a];
                ///b2Vec2& vb = m_velocityBuffer.data[b];
                const vb = vel_data[b];
                ///pa += step.dt * va;
                pa.SelfMulAdd(step.dt, va);
                ///pb += step.dt * vb;
                pb.SelfMulAdd(step.dt, vb);
                ///b2Vec2 d = pb - pa;
                const d = b2Vec2.SubVV(pb, pa, s_d);
                ///float32 r0 = pair.distance;
                const r0 = pair.distance;
                ///float32 r1 = d.Length();
                const r1 = d.Length();
                ///float32 strength = springStrength * pair.strength;
                const strength = springStrength * pair.strength;
                ///b2Vec2 f = strength * (r0 - r1) / r1 * d;
                const f = b2Vec2.MulSV(strength * (r0 - r1) / r1, d, s_f);
                ///va -= f;
                va.SelfSub(f);
                ///vb += f;
                vb.SelfAdd(f);
            }
        }
    }
    SolveTensile(step) {
        const s_weightedNormal = b2ParticleSystem.SolveTensile_s_weightedNormal;
        const s_s = b2ParticleSystem.SolveTensile_s_s;
        const s_f = b2ParticleSystem.SolveTensile_s_f;
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        // DEBUG: b2Assert(this.m_accumulation2Buffer !== null);
        for (let i = 0; i < this.m_count; i++) {
            this.m_accumulation2Buffer[i] = new b2Vec2();
            this.m_accumulation2Buffer[i].SetZero();
        }
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            if (contact.flags & b2ParticleFlag.b2_tensileParticle) {
                const a = contact.indexA;
                const b = contact.indexB;
                const w = contact.weight;
                const n = contact.normal;
                ///b2Vec2 weightedNormal = (1 - w) * w * n;
                const weightedNormal = b2Vec2.MulSV((1 - w) * w, n, s_weightedNormal);
                ///m_accumulation2Buffer[a] -= weightedNormal;
                this.m_accumulation2Buffer[a].SelfSub(weightedNormal);
                ///m_accumulation2Buffer[b] += weightedNormal;
                this.m_accumulation2Buffer[b].SelfAdd(weightedNormal);
            }
        }
        const criticalVelocity = this.GetCriticalVelocity(step);
        const pressureStrength = this.m_def.surfaceTensionPressureStrength * criticalVelocity;
        const normalStrength = this.m_def.surfaceTensionNormalStrength * criticalVelocity;
        const maxVelocityVariation = b2_maxParticleForce * criticalVelocity;
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            if (contact.flags & b2ParticleFlag.b2_tensileParticle) {
                const a = contact.indexA;
                const b = contact.indexB;
                const w = contact.weight;
                const n = contact.normal;
                const h = this.m_weightBuffer[a] + this.m_weightBuffer[b];
                ///b2Vec2 s = m_accumulation2Buffer[b] - m_accumulation2Buffer[a];
                const s = b2Vec2.SubVV(this.m_accumulation2Buffer[b], this.m_accumulation2Buffer[a], s_s);
                const fn = b2Min(pressureStrength * (h - 2) + normalStrength * b2Vec2.DotVV(s, n), maxVelocityVariation) * w;
                ///b2Vec2 f = fn * n;
                const f = b2Vec2.MulSV(fn, n, s_f);
                ///m_velocityBuffer.data[a] -= f;
                vel_data[a].SelfSub(f);
                ///m_velocityBuffer.data[b] += f;
                vel_data[b].SelfAdd(f);
            }
        }
    }
    SolveViscous() {
        const s_v = b2ParticleSystem.SolveViscous_s_v;
        const s_f = b2ParticleSystem.SolveViscous_s_f;
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        const viscousStrength = this.m_def.viscousStrength;
        const inv_mass = this.GetParticleInvMass();
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            const a = contact.index;
            if (this.m_flagsBuffer.data[a] & b2ParticleFlag.b2_viscousParticle) {
                const b = contact.body;
                const w = contact.weight;
                const m = contact.mass;
                const p = pos_data[a];
                ///b2Vec2 v = b.GetLinearVelocityFromWorldPoint(p) - m_velocityBuffer.data[a];
                const v = b2Vec2.SubVV(b.GetLinearVelocityFromWorldPoint(p, b2Vec2.s_t0), vel_data[a], s_v);
                ///b2Vec2 f = viscousStrength * m * w * v;
                const f = b2Vec2.MulSV(viscousStrength * m * w, v, s_f);
                ///m_velocityBuffer.data[a] += GetParticleInvMass() * f;
                vel_data[a].SelfMulAdd(inv_mass, f);
                ///b.ApplyLinearImpulse(-f, p, true);
                b.ApplyLinearImpulse(f.SelfNeg(), p, true);
            }
        }
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            if (contact.flags & b2ParticleFlag.b2_viscousParticle) {
                const a = contact.indexA;
                const b = contact.indexB;
                const w = contact.weight;
                ///b2Vec2 v = m_velocityBuffer.data[b] - m_velocityBuffer.data[a];
                const v = b2Vec2.SubVV(vel_data[b], vel_data[a], s_v);
                ///b2Vec2 f = viscousStrength * w * v;
                const f = b2Vec2.MulSV(viscousStrength * w, v, s_f);
                ///m_velocityBuffer.data[a] += f;
                vel_data[a].SelfAdd(f);
                ///m_velocityBuffer.data[b] -= f;
                vel_data[b].SelfSub(f);
            }
        }
    }
    SolveRepulsive(step) {
        const s_f = b2ParticleSystem.SolveRepulsive_s_f;
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        const repulsiveStrength = this.m_def.repulsiveStrength * this.GetCriticalVelocity(step);
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            if (contact.flags & b2ParticleFlag.b2_repulsiveParticle) {
                const a = contact.indexA;
                const b = contact.indexB;
                if (this.m_groupBuffer[a] !== this.m_groupBuffer[b]) {
                    const w = contact.weight;
                    const n = contact.normal;
                    ///b2Vec2 f = repulsiveStrength * w * n;
                    const f = b2Vec2.MulSV(repulsiveStrength * w, n, s_f);
                    ///m_velocityBuffer.data[a] -= f;
                    vel_data[a].SelfSub(f);
                    ///m_velocityBuffer.data[b] += f;
                    vel_data[b].SelfAdd(f);
                }
            }
        }
    }
    SolvePowder(step) {
        const s_f = b2ParticleSystem.SolvePowder_s_f;
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const pos_data = this.m_positionBuffer.data;
        const vel_data = this.m_velocityBuffer.data;
        const powderStrength = this.m_def.powderStrength * this.GetCriticalVelocity(step);
        const minWeight = 1.0 - b2_particleStride;
        const inv_mass = this.GetParticleInvMass();
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            const a = contact.index;
            if (this.m_flagsBuffer.data[a] & b2ParticleFlag.b2_powderParticle) {
                const w = contact.weight;
                if (w > minWeight) {
                    const b = contact.body;
                    const m = contact.mass;
                    const p = pos_data[a];
                    const n = contact.normal;
                    const f = b2Vec2.MulSV(powderStrength * m * (w - minWeight), n, s_f);
                    vel_data[a].SelfMulSub(inv_mass, f);
                    b.ApplyLinearImpulse(f, p, true);
                }
            }
        }
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            if (contact.flags & b2ParticleFlag.b2_powderParticle) {
                const w = contact.weight;
                if (w > minWeight) {
                    const a = contact.indexA;
                    const b = contact.indexB;
                    const n = contact.normal;
                    const f = b2Vec2.MulSV(powderStrength * (w - minWeight), n, s_f);
                    vel_data[a].SelfSub(f);
                    vel_data[b].SelfAdd(f);
                }
            }
        }
    }
    SolveSolid(step) {
        const s_f = b2ParticleSystem.SolveSolid_s_f;
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        // applies extra repulsive force from solid particle groups
        this.m_depthBuffer = this.RequestBuffer(this.m_depthBuffer);
        const ejectionStrength = step.inv_dt * this.m_def.ejectionStrength;
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            const a = contact.indexA;
            const b = contact.indexB;
            if (this.m_groupBuffer[a] !== this.m_groupBuffer[b]) {
                const w = contact.weight;
                const n = contact.normal;
                const h = this.m_depthBuffer[a] + this.m_depthBuffer[b];
                const f = b2Vec2.MulSV(ejectionStrength * h * w, n, s_f);
                vel_data[a].SelfSub(f);
                vel_data[b].SelfAdd(f);
            }
        }
    }
    SolveForce(step) {
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        const vel_data = this.m_velocityBuffer.data;
        const velocityPerForce = step.dt * this.GetParticleInvMass();
        for (let i = 0; i < this.m_count; i++) {
            ///m_velocityBuffer.data[i] += velocityPerForce * m_forceBuffer[i];
            vel_data[i].SelfMulAdd(velocityPerForce, this.m_forceBuffer[i]);
        }
        this.m_hasForce = false;
    }
    SolveColorMixing() {
        // mixes color between contacting particles
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_colorBuffer.data) {
            throw new Error();
        }
        const colorMixing = 0.5 * this.m_def.colorMixingStrength;
        if (colorMixing) {
            for (let k = 0; k < this.m_contactBuffer.count; k++) {
                const contact = this.m_contactBuffer.data[k];
                const a = contact.indexA;
                const b = contact.indexB;
                if (this.m_flagsBuffer.data[a] & this.m_flagsBuffer.data[b] &
                    b2ParticleFlag.b2_colorMixingParticle) {
                    const colorA = this.m_colorBuffer.data[a];
                    const colorB = this.m_colorBuffer.data[b];
                    // Use the static method to ensure certain compilers inline
                    // this correctly.
                    b2Color.MixColors(colorA, colorB, colorMixing);
                }
            }
        }
    }
    SolveZombie() {
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        // removes particles with zombie flag
        let newCount = 0;
        ///int32* newIndices = (int32*) this.m_world.m_stackAllocator.Allocate(sizeof(int32) * this.m_count);
        const newIndices = []; // TODO: static
        for (let i = 0; i < this.m_count; i++) {
            newIndices[i] = b2_invalidParticleIndex;
        }
        // DEBUG: b2Assert(newIndices.length === this.m_count);
        let allParticleFlags = 0;
        for (let i = 0; i < this.m_count; i++) {
            const flags = this.m_flagsBuffer.data[i];
            if (flags & b2ParticleFlag.b2_zombieParticle) {
                const destructionListener = this.m_world.m_destructionListener;
                if ((flags & b2ParticleFlag.b2_destructionListenerParticle) && destructionListener) {
                    destructionListener.SayGoodbyeParticle(this, i);
                }
                // Destroy particle handle.
                if (this.m_handleIndexBuffer.data) {
                    const handle = this.m_handleIndexBuffer.data[i];
                    if (handle) {
                        handle.SetIndex(b2_invalidParticleIndex);
                        this.m_handleIndexBuffer.data[i] = null;
                        ///m_handleAllocator.Free(handle);
                    }
                }
                newIndices[i] = b2_invalidParticleIndex;
            }
            else {
                newIndices[i] = newCount;
                if (i !== newCount) {
                    // Update handle to reference new particle index.
                    if (this.m_handleIndexBuffer.data) {
                        const handle = this.m_handleIndexBuffer.data[i];
                        if (handle) {
                            handle.SetIndex(newCount);
                        }
                        this.m_handleIndexBuffer.data[newCount] = handle;
                    }
                    this.m_flagsBuffer.data[newCount] = this.m_flagsBuffer.data[i];
                    if (this.m_lastBodyContactStepBuffer.data) {
                        this.m_lastBodyContactStepBuffer.data[newCount] = this.m_lastBodyContactStepBuffer.data[i];
                    }
                    if (this.m_bodyContactCountBuffer.data) {
                        this.m_bodyContactCountBuffer.data[newCount] = this.m_bodyContactCountBuffer.data[i];
                    }
                    if (this.m_consecutiveContactStepsBuffer.data) {
                        this.m_consecutiveContactStepsBuffer.data[newCount] = this.m_consecutiveContactStepsBuffer.data[i];
                    }
                    this.m_positionBuffer.data[newCount].Copy(this.m_positionBuffer.data[i]);
                    this.m_velocityBuffer.data[newCount].Copy(this.m_velocityBuffer.data[i]);
                    this.m_groupBuffer[newCount] = this.m_groupBuffer[i];
                    if (this.m_hasForce) {
                        this.m_forceBuffer[newCount].Copy(this.m_forceBuffer[i]);
                    }
                    if (this.m_staticPressureBuffer) {
                        this.m_staticPressureBuffer[newCount] = this.m_staticPressureBuffer[i];
                    }
                    if (this.m_depthBuffer) {
                        this.m_depthBuffer[newCount] = this.m_depthBuffer[i];
                    }
                    if (this.m_colorBuffer.data) {
                        this.m_colorBuffer.data[newCount].Copy(this.m_colorBuffer.data[i]);
                    }
                    if (this.m_userDataBuffer.data) {
                        this.m_userDataBuffer.data[newCount] = this.m_userDataBuffer.data[i];
                    }
                    if (this.m_expirationTimeBuffer.data) {
                        this.m_expirationTimeBuffer.data[newCount] = this.m_expirationTimeBuffer.data[i];
                    }
                }
                newCount++;
                allParticleFlags |= flags;
            }
        }
        // predicate functions
        const Test = {
            ///static bool IsProxyInvalid(const Proxy& proxy)
            IsProxyInvalid: (proxy) => {
                return proxy.index < 0;
            },
            ///static bool IsContactInvalid(const b2ParticleContact& contact)
            IsContactInvalid: (contact) => {
                return contact.indexA < 0 || contact.indexB < 0;
            },
            ///static bool IsBodyContactInvalid(const b2ParticleBodyContact& contact)
            IsBodyContactInvalid: (contact) => {
                return contact.index < 0;
            },
            ///static bool IsPairInvalid(const b2ParticlePair& pair)
            IsPairInvalid: (pair) => {
                return pair.indexA < 0 || pair.indexB < 0;
            },
            ///static bool IsTriadInvalid(const b2ParticleTriad& triad)
            IsTriadInvalid: (triad) => {
                return triad.indexA < 0 || triad.indexB < 0 || triad.indexC < 0;
            },
        };
        // update proxies
        for (let k = 0; k < this.m_proxyBuffer.count; k++) {
            const proxy = this.m_proxyBuffer.data[k];
            proxy.index = newIndices[proxy.index];
        }
        this.m_proxyBuffer.RemoveIf(Test.IsProxyInvalid);
        // update contacts
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            contact.indexA = newIndices[contact.indexA];
            contact.indexB = newIndices[contact.indexB];
        }
        this.m_contactBuffer.RemoveIf(Test.IsContactInvalid);
        // update particle-body contacts
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            contact.index = newIndices[contact.index];
        }
        this.m_bodyContactBuffer.RemoveIf(Test.IsBodyContactInvalid);
        // update pairs
        for (let k = 0; k < this.m_pairBuffer.count; k++) {
            const pair = this.m_pairBuffer.data[k];
            pair.indexA = newIndices[pair.indexA];
            pair.indexB = newIndices[pair.indexB];
        }
        this.m_pairBuffer.RemoveIf(Test.IsPairInvalid);
        // update triads
        for (let k = 0; k < this.m_triadBuffer.count; k++) {
            const triad = this.m_triadBuffer.data[k];
            triad.indexA = newIndices[triad.indexA];
            triad.indexB = newIndices[triad.indexB];
            triad.indexC = newIndices[triad.indexC];
        }
        this.m_triadBuffer.RemoveIf(Test.IsTriadInvalid);
        // Update lifetime indices.
        if (this.m_indexByExpirationTimeBuffer.data) {
            let writeOffset = 0;
            for (let readOffset = 0; readOffset < this.m_count; readOffset++) {
                const newIndex = newIndices[this.m_indexByExpirationTimeBuffer.data[readOffset]];
                if (newIndex !== b2_invalidParticleIndex) {
                    this.m_indexByExpirationTimeBuffer.data[writeOffset++] = newIndex;
                }
            }
        }
        // update groups
        for (let group = this.m_groupList; group; group = group.GetNext()) {
            let firstIndex = newCount;
            let lastIndex = 0;
            let modified = false;
            for (let i = group.m_firstIndex; i < group.m_lastIndex; i++) {
                const j = newIndices[i];
                if (j >= 0) {
                    firstIndex = b2Min(firstIndex, j);
                    lastIndex = b2Max(lastIndex, j + 1);
                }
                else {
                    modified = true;
                }
            }
            if (firstIndex < lastIndex) {
                group.m_firstIndex = firstIndex;
                group.m_lastIndex = lastIndex;
                if (modified) {
                    if (group.m_groupFlags & b2ParticleGroupFlag.b2_solidParticleGroup) {
                        this.SetGroupFlags(group, group.m_groupFlags | b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth);
                    }
                }
            }
            else {
                group.m_firstIndex = 0;
                group.m_lastIndex = 0;
                if (!(group.m_groupFlags & b2ParticleGroupFlag.b2_particleGroupCanBeEmpty)) {
                    this.SetGroupFlags(group, group.m_groupFlags | b2ParticleGroupFlag.b2_particleGroupWillBeDestroyed);
                }
            }
        }
        // update particle count
        this.m_count = newCount;
        ///m_world.m_stackAllocator.Free(newIndices);
        this.m_allParticleFlags = allParticleFlags;
        this.m_needsUpdateAllParticleFlags = false;
        // destroy bodies with no particles
        for (let group = this.m_groupList; group;) {
            const next = group.GetNext();
            if (group.m_groupFlags & b2ParticleGroupFlag.b2_particleGroupWillBeDestroyed) {
                this.DestroyParticleGroup(group);
            }
            group = next;
        }
    }
    /**
     * Destroy all particles which have outlived their lifetimes set
     * by SetParticleLifetime().
     */
    SolveLifetimes(step) {
        if (!this.m_expirationTimeBuffer.data) {
            throw new Error();
        }
        if (!this.m_indexByExpirationTimeBuffer.data) {
            throw new Error();
        }
        // Update the time elapsed.
        this.m_timeElapsed = this.LifetimeToExpirationTime(step.dt);
        // Get the floor (non-fractional component) of the elapsed time.
        const quantizedTimeElapsed = this.GetQuantizedTimeElapsed();
        const expirationTimes = this.m_expirationTimeBuffer.data;
        const expirationTimeIndices = this.m_indexByExpirationTimeBuffer.data;
        const particleCount = this.GetParticleCount();
        // Sort the lifetime buffer if it's required.
        if (this.m_expirationTimeBufferRequiresSorting) {
            ///const ExpirationTimeComparator expirationTimeComparator(expirationTimes);
            ///std::sort(expirationTimeIndices, expirationTimeIndices + particleCount, expirationTimeComparator);
            /**
             * Compare the lifetime of particleIndexA and particleIndexB
             * returning true if the lifetime of A is greater than B for
             * particles that will expire.  If either particle's lifetime is
             * infinite (<= 0.0f) this function return true if the lifetime
             * of A is lesser than B. When used with std::sort() this
             * results in an array of particle indicies sorted in reverse
             * order by particle lifetime.
             *
             * For example, the set of lifetimes
             * (1.0, 0.7, 0.3, 0.0, -1.0, 2.0)
             * would be sorted as
             * (0.0, 1.0, -2.0, 1.0, 0.7, 0.3)
             */
            const ExpirationTimeComparator = (particleIndexA, particleIndexB) => {
                const expirationTimeA = expirationTimes[particleIndexA];
                const expirationTimeB = expirationTimes[particleIndexB];
                const infiniteExpirationTimeA = expirationTimeA <= 0.0;
                const infiniteExpirationTimeB = expirationTimeB <= 0.0;
                return infiniteExpirationTimeA === infiniteExpirationTimeB ?
                    expirationTimeA > expirationTimeB : infiniteExpirationTimeA;
            };
            std_sort(expirationTimeIndices, 0, particleCount, ExpirationTimeComparator);
            this.m_expirationTimeBufferRequiresSorting = false;
        }
        // Destroy particles which have expired.
        for (let i = particleCount - 1; i >= 0; --i) {
            const particleIndex = expirationTimeIndices[i];
            const expirationTime = expirationTimes[particleIndex];
            // If no particles need to be destroyed, skip this.
            if (quantizedTimeElapsed < expirationTime || expirationTime <= 0) {
                break;
            }
            // Destroy this particle.
            this.DestroyParticle(particleIndex);
        }
    }
    RotateBuffer(start, mid, end) {
        // move the particles assigned to the given group toward the end of array
        if (start === mid || mid === end) {
            return;
        }
        // DEBUG: b2Assert(mid >= start && mid <= end);
        function newIndices(i) {
            if (i < start) {
                return i;
            }
            else if (i < mid) {
                return i + end - mid;
            }
            else if (i < end) {
                return i + start - mid;
            }
            else {
                return i;
            }
        }
        if (!this.m_flagsBuffer.data) {
            throw new Error();
        }
        if (!this.m_positionBuffer.data) {
            throw new Error();
        }
        if (!this.m_velocityBuffer.data) {
            throw new Error();
        }
        ///std::rotate(m_flagsBuffer.data + start, m_flagsBuffer.data + mid, m_flagsBuffer.data + end);
        std_rotate(this.m_flagsBuffer.data, start, mid, end);
        if (this.m_lastBodyContactStepBuffer.data) {
            ///std::rotate(m_lastBodyContactStepBuffer.data + start, m_lastBodyContactStepBuffer.data + mid, m_lastBodyContactStepBuffer.data + end);
            std_rotate(this.m_lastBodyContactStepBuffer.data, start, mid, end);
        }
        if (this.m_bodyContactCountBuffer.data) {
            ///std::rotate(m_bodyContactCountBuffer.data + start, m_bodyContactCountBuffer.data + mid, m_bodyContactCountBuffer.data + end);
            std_rotate(this.m_bodyContactCountBuffer.data, start, mid, end);
        }
        if (this.m_consecutiveContactStepsBuffer.data) {
            ///std::rotate(m_consecutiveContactStepsBuffer.data + start, m_consecutiveContactStepsBuffer.data + mid, m_consecutiveContactStepsBuffer.data + end);
            std_rotate(this.m_consecutiveContactStepsBuffer.data, start, mid, end);
        }
        ///std::rotate(m_positionBuffer.data + start, m_positionBuffer.data + mid, m_positionBuffer.data + end);
        std_rotate(this.m_positionBuffer.data, start, mid, end);
        ///std::rotate(m_velocityBuffer.data + start, m_velocityBuffer.data + mid, m_velocityBuffer.data + end);
        std_rotate(this.m_velocityBuffer.data, start, mid, end);
        ///std::rotate(m_groupBuffer + start, m_groupBuffer + mid, m_groupBuffer + end);
        std_rotate(this.m_groupBuffer, start, mid, end);
        if (this.m_hasForce) {
            ///std::rotate(m_forceBuffer + start, m_forceBuffer + mid, m_forceBuffer + end);
            std_rotate(this.m_forceBuffer, start, mid, end);
        }
        if (this.m_staticPressureBuffer) {
            ///std::rotate(m_staticPressureBuffer + start, m_staticPressureBuffer + mid, m_staticPressureBuffer + end);
            std_rotate(this.m_staticPressureBuffer, start, mid, end);
        }
        if (this.m_depthBuffer) {
            ///std::rotate(m_depthBuffer + start, m_depthBuffer + mid, m_depthBuffer + end);
            std_rotate(this.m_depthBuffer, start, mid, end);
        }
        if (this.m_colorBuffer.data) {
            ///std::rotate(m_colorBuffer.data + start, m_colorBuffer.data + mid, m_colorBuffer.data + end);
            std_rotate(this.m_colorBuffer.data, start, mid, end);
        }
        if (this.m_userDataBuffer.data) {
            ///std::rotate(m_userDataBuffer.data + start, m_userDataBuffer.data + mid, m_userDataBuffer.data + end);
            std_rotate(this.m_userDataBuffer.data, start, mid, end);
        }
        // Update handle indices.
        if (this.m_handleIndexBuffer.data) {
            ///std::rotate(m_handleIndexBuffer.data + start, m_handleIndexBuffer.data + mid, m_handleIndexBuffer.data + end);
            std_rotate(this.m_handleIndexBuffer.data, start, mid, end);
            for (let i = start; i < end; ++i) {
                const handle = this.m_handleIndexBuffer.data[i];
                if (handle) {
                    handle.SetIndex(newIndices(handle.GetIndex()));
                }
            }
        }
        if (this.m_expirationTimeBuffer.data) {
            ///std::rotate(m_expirationTimeBuffer.data + start, m_expirationTimeBuffer.data + mid, m_expirationTimeBuffer.data + end);
            std_rotate(this.m_expirationTimeBuffer.data, start, mid, end);
            // Update expiration time buffer indices.
            const particleCount = this.GetParticleCount();
            if (!this.m_indexByExpirationTimeBuffer.data) {
                throw new Error();
            }
            const indexByExpirationTime = this.m_indexByExpirationTimeBuffer.data;
            for (let i = 0; i < particleCount; ++i) {
                indexByExpirationTime[i] = newIndices(indexByExpirationTime[i]);
            }
        }
        // update proxies
        for (let k = 0; k < this.m_proxyBuffer.count; k++) {
            const proxy = this.m_proxyBuffer.data[k];
            proxy.index = newIndices(proxy.index);
        }
        // update contacts
        for (let k = 0; k < this.m_contactBuffer.count; k++) {
            const contact = this.m_contactBuffer.data[k];
            contact.indexA = newIndices(contact.indexA);
            contact.indexB = newIndices(contact.indexB);
        }
        // update particle-body contacts
        for (let k = 0; k < this.m_bodyContactBuffer.count; k++) {
            const contact = this.m_bodyContactBuffer.data[k];
            contact.index = newIndices(contact.index);
        }
        // update pairs
        for (let k = 0; k < this.m_pairBuffer.count; k++) {
            const pair = this.m_pairBuffer.data[k];
            pair.indexA = newIndices(pair.indexA);
            pair.indexB = newIndices(pair.indexB);
        }
        // update triads
        for (let k = 0; k < this.m_triadBuffer.count; k++) {
            const triad = this.m_triadBuffer.data[k];
            triad.indexA = newIndices(triad.indexA);
            triad.indexB = newIndices(triad.indexB);
            triad.indexC = newIndices(triad.indexC);
        }
        // update groups
        for (let group = this.m_groupList; group; group = group.GetNext()) {
            group.m_firstIndex = newIndices(group.m_firstIndex);
            group.m_lastIndex = newIndices(group.m_lastIndex - 1) + 1;
        }
    }
    GetCriticalVelocity(step) {
        return this.m_particleDiameter * step.inv_dt;
    }
    GetCriticalVelocitySquared(step) {
        const velocity = this.GetCriticalVelocity(step);
        return velocity * velocity;
    }
    GetCriticalPressure(step) {
        return this.m_def.density * this.GetCriticalVelocitySquared(step);
    }
    GetParticleStride() {
        return b2_particleStride * this.m_particleDiameter;
    }
    GetParticleMass() {
        const stride = this.GetParticleStride();
        return this.m_def.density * stride * stride;
    }
    GetParticleInvMass() {
        ///return 1.777777 * this.m_inverseDensity * this.m_inverseDiameter * this.m_inverseDiameter;
        // mass = density * stride^2, so we take the inverse of this.
        const inverseStride = this.m_inverseDiameter * (1.0 / b2_particleStride);
        return this.m_inverseDensity * inverseStride * inverseStride;
    }
    /**
     * Get the world's contact filter if any particles with the
     * b2_contactFilterParticle flag are present in the system.
     */
    GetFixtureContactFilter() {
        return (this.m_allParticleFlags & b2ParticleFlag.b2_fixtureContactFilterParticle) ?
            this.m_world.m_contactManager.m_contactFilter : null;
    }
    /**
     * Get the world's contact filter if any particles with the
     * b2_particleContactFilterParticle flag are present in the
     * system.
     */
    GetParticleContactFilter() {
        return (this.m_allParticleFlags & b2ParticleFlag.b2_particleContactFilterParticle) ?
            this.m_world.m_contactManager.m_contactFilter : null;
    }
    /**
     * Get the world's contact listener if any particles with the
     * b2_fixtureContactListenerParticle flag are present in the
     * system.
     */
    GetFixtureContactListener() {
        return (this.m_allParticleFlags & b2ParticleFlag.b2_fixtureContactListenerParticle) ?
            this.m_world.m_contactManager.m_contactListener : null;
    }
    /**
     * Get the world's contact listener if any particles with the
     * b2_particleContactListenerParticle flag are present in the
     * system.
     */
    GetParticleContactListener() {
        return (this.m_allParticleFlags & b2ParticleFlag.b2_particleContactListenerParticle) ?
            this.m_world.m_contactManager.m_contactListener : null;
    }
    SetUserOverridableBuffer(buffer, newData, newCapacity) {
        // DEBUG: b2Assert(((newData !== null) && (newCapacity > 0)) || ((newData === null) && (newCapacity === 0)));
        ///if (!buffer.userSuppliedCapacity)
        ///{
        ///this.m_world.m_blockAllocator.Free(buffer.data, sizeof(T) * m_internalAllocatedCapacity);
        ///}
        buffer.data = newData;
        buffer.userSuppliedCapacity = newCapacity;
    }
    SetGroupFlags(group, newFlags) {
        const oldFlags = group.m_groupFlags;
        if ((oldFlags ^ newFlags) & b2ParticleGroupFlag.b2_solidParticleGroup) {
            // If the b2_solidParticleGroup flag changed schedule depth update.
            newFlags |= b2ParticleGroupFlag.b2_particleGroupNeedsUpdateDepth;
        }
        if (oldFlags & ~newFlags) {
            // If any flags might be removed
            this.m_needsUpdateAllGroupFlags = true;
        }
        if (~this.m_allGroupFlags & newFlags) {
            // If any flags were added
            if (newFlags & b2ParticleGroupFlag.b2_solidParticleGroup) {
                this.m_depthBuffer = this.RequestBuffer(this.m_depthBuffer);
            }
            this.m_allGroupFlags |= newFlags;
        }
        group.m_groupFlags = newFlags;
    }
    static BodyContactCompare(lhs, rhs) {
        if (lhs.index === rhs.index) {
            // Subsort by weight, decreasing.
            return lhs.weight > rhs.weight;
        }
        return lhs.index < rhs.index;
    }
    RemoveSpuriousBodyContacts() {
        // At this point we have a list of contact candidates based on AABB
        // overlap.The AABB query that  generated this returns all collidable
        // fixtures overlapping particle bounding boxes.  This breaks down around
        // vertices where two shapes intersect, such as a "ground" surface made
        // of multiple b2PolygonShapes; it potentially applies a lot of spurious
        // impulses from normals that should not actually contribute.  See the
        // Ramp example in Testbed.
        //
        // To correct for this, we apply this algorithm:
        //   * sort contacts by particle and subsort by weight (nearest to farthest)
        //   * for each contact per particle:
        //      - project a point at the contact distance along the inverse of the
        //        contact normal
        //      - if this intersects the fixture that generated the contact, apply
        //         it, otherwise discard as impossible
        //      - repeat for up to n nearest contacts, currently we get good results
        //        from n=3.
        ///std::sort(m_bodyContactBuffer.Begin(), m_bodyContactBuffer.End(), b2ParticleSystem::BodyContactCompare);
        std_sort(this.m_bodyContactBuffer.data, 0, this.m_bodyContactBuffer.count, b2ParticleSystem.BodyContactCompare);
        ///int32 discarded = 0;
        ///std::remove_if(m_bodyContactBuffer.Begin(), m_bodyContactBuffer.End(), b2ParticleBodyContactRemovePredicate(this, &discarded));
        ///
        ///m_bodyContactBuffer.SetCount(m_bodyContactBuffer.GetCount() - discarded);
        const s_n = b2ParticleSystem.RemoveSpuriousBodyContacts_s_n;
        const s_pos = b2ParticleSystem.RemoveSpuriousBodyContacts_s_pos;
        const s_normal = b2ParticleSystem.RemoveSpuriousBodyContacts_s_normal;
        // Max number of contacts processed per particle, from nearest to farthest.
        // This must be at least 2 for correctness with concave shapes; 3 was
        // experimentally arrived at as looking reasonable.
        const k_maxContactsPerPoint = 3;
        const system = this;
        // Index of last particle processed.
        let lastIndex = -1;
        // Number of contacts processed for the current particle.
        let currentContacts = 0;
        // Output the number of discarded contacts.
        // let discarded = 0;
        const b2ParticleBodyContactRemovePredicate = (contact) => {
            // This implements the selection criteria described in
            // RemoveSpuriousBodyContacts().
            // This functor is iterating through a list of Body contacts per
            // Particle, ordered from near to far.  For up to the maximum number of
            // contacts we allow per point per step, we verify that the contact
            // normal of the Body that genenerated the contact makes physical sense
            // by projecting a point back along that normal and seeing if it
            // intersects the fixture generating the contact.
            if (contact.index !== lastIndex) {
                currentContacts = 0;
                lastIndex = contact.index;
            }
            if (currentContacts++ > k_maxContactsPerPoint) {
                // ++discarded;
                return true;
            }
            // Project along inverse normal (as returned in the contact) to get the
            // point to check.
            ///b2Vec2 n = contact.normal;
            const n = s_n.Copy(contact.normal);
            // weight is 1-(inv(diameter) * distance)
            ///n *= system.m_particleDiameter * (1 - contact.weight);
            n.SelfMul(system.m_particleDiameter * (1 - contact.weight));
            ///b2Vec2 pos = system.m_positionBuffer.data[contact.index] + n;
            if (!system.m_positionBuffer.data) {
                throw new Error();
            }
            const pos = b2Vec2.AddVV(system.m_positionBuffer.data[contact.index], n, s_pos);
            // pos is now a point projected back along the contact normal to the
            // contact distance. If the surface makes sense for a contact, pos will
            // now lie on or in the fixture generating
            if (!contact.fixture.TestPoint(pos)) {
                const childCount = contact.fixture.GetShape().GetChildCount();
                for (let childIndex = 0; childIndex < childCount; childIndex++) {
                    const normal = s_normal;
                    const distance = contact.fixture.ComputeDistance(pos, normal, childIndex);
                    if (distance < b2_linearSlop) {
                        return false;
                    }
                }
                // ++discarded;
                return true;
            }
            return false;
        };
        this.m_bodyContactBuffer.count = std_remove_if(this.m_bodyContactBuffer.data, b2ParticleBodyContactRemovePredicate, this.m_bodyContactBuffer.count);
    }
    DetectStuckParticle(particle) {
        // Detect stuck particles
        //
        // The basic algorithm is to allow the user to specify an optional
        // threshold where we detect whenever a particle is contacting
        // more than one fixture for more than threshold consecutive
        // steps. This is considered to be "stuck", and these are put
        // in a list the user can query per step, if enabled, to deal with
        // such particles.
        if (this.m_stuckThreshold <= 0) {
            return;
        }
        if (!this.m_bodyContactCountBuffer.data) {
            throw new Error();
        }
        if (!this.m_consecutiveContactStepsBuffer.data) {
            throw new Error();
        }
        if (!this.m_lastBodyContactStepBuffer.data) {
            throw new Error();
        }
        // Get the state variables for this particle.
        ///int32 * const consecutiveCount = &m_consecutiveContactStepsBuffer.data[particle];
        ///int32 * const lastStep = &m_lastBodyContactStepBuffer.data[particle];
        ///int32 * const bodyCount = &m_bodyContactCountBuffer.data[particle];
        // This is only called when there is a body contact for this particle.
        ///++(*bodyCount);
        ++this.m_bodyContactCountBuffer.data[particle];
        // We want to only trigger detection once per step, the first time we
        // contact more than one fixture in a step for a given particle.
        ///if (*bodyCount === 2)
        if (this.m_bodyContactCountBuffer.data[particle] === 2) {
            ///++(*consecutiveCount);
            ++this.m_consecutiveContactStepsBuffer.data[particle];
            ///if (*consecutiveCount > m_stuckThreshold)
            if (this.m_consecutiveContactStepsBuffer.data[particle] > this.m_stuckThreshold) {
                ///int32& newStuckParticle = m_stuckParticleBuffer.Append();
                ///newStuckParticle = particle;
                this.m_stuckParticleBuffer.data[this.m_stuckParticleBuffer.Append()] = particle;
            }
        }
        ///*lastStep = m_timestamp;
        this.m_lastBodyContactStepBuffer.data[particle] = this.m_timestamp;
    }
    /**
     * Determine whether a particle index is valid.
     */
    ValidateParticleIndex(index) {
        return index >= 0 && index < this.GetParticleCount() &&
            index !== b2_invalidParticleIndex;
    }
    /**
     * Get the time elapsed in
     * b2ParticleSystemDef::lifetimeGranularity.
     */
    GetQuantizedTimeElapsed() {
        ///return (int32)(m_timeElapsed >> 32);
        return Math.floor(this.m_timeElapsed / 0x100000000);
    }
    /**
     * Convert a lifetime in seconds to an expiration time.
     */
    LifetimeToExpirationTime(lifetime) {
        ///return m_timeElapsed + (int64)((lifetime / m_def.lifetimeGranularity) * (float32)(1LL << 32));
        return this.m_timeElapsed + Math.floor(((lifetime / this.m_def.lifetimeGranularity) * 0x100000000));
    }
    ForceCanBeApplied(flags) {
        return !(flags & b2ParticleFlag.b2_wallParticle);
    }
    PrepareForceBuffer() {
        if (!this.m_hasForce) {
            ///memset(m_forceBuffer, 0, sizeof(*m_forceBuffer) * m_count);
            for (let i = 0; i < this.m_count; i++) {
                this.m_forceBuffer[i].SetZero();
            }
            this.m_hasForce = true;
        }
    }
    IsRigidGroup(group) {
        return (group !== null) && ((group.m_groupFlags & b2ParticleGroupFlag.b2_rigidParticleGroup) !== 0);
    }
    GetLinearVelocity(group, particleIndex, point, out) {
        if (group && this.IsRigidGroup(group)) {
            return group.GetLinearVelocityFromWorldPoint(point, out);
        }
        else {
            if (!this.m_velocityBuffer.data) {
                throw new Error();
            }
            ///return m_velocityBuffer.data[particleIndex];
            return out.Copy(this.m_velocityBuffer.data[particleIndex]);
        }
    }
    InitDampingParameter(invMass, invInertia, tangentDistance, mass, inertia, center, point, normal) {
        ///*invMass = mass > 0 ? 1 / mass : 0;
        invMass[0] = mass > 0 ? 1 / mass : 0;
        ///*invInertia = inertia > 0 ? 1 / inertia : 0;
        invInertia[0] = inertia > 0 ? 1 / inertia : 0;
        ///*tangentDistance = b2Cross(point - center, normal);
        tangentDistance[0] = b2Vec2.CrossVV(b2Vec2.SubVV(point, center, b2Vec2.s_t0), normal);
    }
    InitDampingParameterWithRigidGroupOrParticle(invMass, invInertia, tangentDistance, isRigidGroup, group, particleIndex, point, normal) {
        if (group && isRigidGroup) {
            this.InitDampingParameter(invMass, invInertia, tangentDistance, group.GetMass(), group.GetInertia(), group.GetCenter(), point, normal);
        }
        else {
            if (!this.m_flagsBuffer.data) {
                throw new Error();
            }
            const flags = this.m_flagsBuffer.data[particleIndex];
            this.InitDampingParameter(invMass, invInertia, tangentDistance, flags & b2ParticleFlag.b2_wallParticle ? 0 : this.GetParticleMass(), 0, point, point, normal);
        }
    }
    ComputeDampingImpulse(invMassA, invInertiaA, tangentDistanceA, invMassB, invInertiaB, tangentDistanceB, normalVelocity) {
        const invMass = invMassA + invInertiaA * tangentDistanceA * tangentDistanceA +
            invMassB + invInertiaB * tangentDistanceB * tangentDistanceB;
        return invMass > 0 ? normalVelocity / invMass : 0;
    }
    ApplyDamping(invMass, invInertia, tangentDistance, isRigidGroup, group, particleIndex, impulse, normal) {
        if (group && isRigidGroup) {
            ///group.m_linearVelocity += impulse * invMass * normal;
            group.m_linearVelocity.SelfMulAdd(impulse * invMass, normal);
            ///group.m_angularVelocity += impulse * tangentDistance * invInertia;
            group.m_angularVelocity += impulse * tangentDistance * invInertia;
        }
        else {
            if (!this.m_velocityBuffer.data) {
                throw new Error();
            }
            ///m_velocityBuffer.data[particleIndex] += impulse * invMass * normal;
            this.m_velocityBuffer.data[particleIndex].SelfMulAdd(impulse * invMass, normal);
        }
    }
}
b2ParticleSystem.xTruncBits = 12;
b2ParticleSystem.yTruncBits = 12;
b2ParticleSystem.tagBits = 8 * 4; // 8u * sizeof(uint32);
b2ParticleSystem.yOffset = 1 << (b2ParticleSystem.yTruncBits - 1);
b2ParticleSystem.yShift = b2ParticleSystem.tagBits - b2ParticleSystem.yTruncBits;
b2ParticleSystem.xShift = b2ParticleSystem.tagBits - b2ParticleSystem.yTruncBits - b2ParticleSystem.xTruncBits;
b2ParticleSystem.xScale = 1 << b2ParticleSystem.xShift;
b2ParticleSystem.xOffset = b2ParticleSystem.xScale * (1 << (b2ParticleSystem.xTruncBits - 1));
b2ParticleSystem.yMask = ((1 << b2ParticleSystem.yTruncBits) - 1) << b2ParticleSystem.yShift;
b2ParticleSystem.xMask = ~b2ParticleSystem.yMask;
b2ParticleSystem.DestroyParticlesInShape_s_aabb = new b2AABB();
b2ParticleSystem.CreateParticleGroup_s_transform = new b2Transform();
b2ParticleSystem.ComputeCollisionEnergy_s_v = new b2Vec2();
b2ParticleSystem.QueryShapeAABB_s_aabb = new b2AABB();
b2ParticleSystem.QueryPointAABB_s_aabb = new b2AABB();
b2ParticleSystem.RayCast_s_aabb = new b2AABB();
b2ParticleSystem.RayCast_s_p = new b2Vec2();
b2ParticleSystem.RayCast_s_v = new b2Vec2();
b2ParticleSystem.RayCast_s_n = new b2Vec2();
b2ParticleSystem.RayCast_s_point = new b2Vec2();
/**
 * All particle types that require creating pairs
 */
b2ParticleSystem.k_pairFlags = b2ParticleFlag.b2_springParticle;
/**
 * All particle types that require creating triads
 */
b2ParticleSystem.k_triadFlags = b2ParticleFlag.b2_elasticParticle;
/**
 * All particle types that do not produce dynamic pressure
 */
b2ParticleSystem.k_noPressureFlags = b2ParticleFlag.b2_powderParticle | b2ParticleFlag.b2_tensileParticle;
/**
 * All particle types that apply extra damping force with bodies
 */
b2ParticleSystem.k_extraDampingFlags = b2ParticleFlag.b2_staticPressureParticle;
b2ParticleSystem.k_barrierWallFlags = b2ParticleFlag.b2_barrierParticle | b2ParticleFlag.b2_wallParticle;
b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_edge = new b2EdgeShape();
b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_d = new b2Vec2();
b2ParticleSystem.CreateParticlesStrokeShapeForGroup_s_p = new b2Vec2();
b2ParticleSystem.CreateParticlesFillShapeForGroup_s_aabb = new b2AABB();
b2ParticleSystem.CreateParticlesFillShapeForGroup_s_p = new b2Vec2();
b2ParticleSystem.UpdatePairsAndTriads_s_dab = new b2Vec2();
b2ParticleSystem.UpdatePairsAndTriads_s_dbc = new b2Vec2();
b2ParticleSystem.UpdatePairsAndTriads_s_dca = new b2Vec2();
b2ParticleSystem.AddContact_s_d = new b2Vec2();
b2ParticleSystem.UpdateBodyContacts_s_aabb = new b2AABB();
b2ParticleSystem.Solve_s_subStep = new b2TimeStep();
b2ParticleSystem.SolveCollision_s_aabb = new b2AABB();
b2ParticleSystem.SolveGravity_s_gravity = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_aabb = new b2AABB();
b2ParticleSystem.SolveBarrier_s_va = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_vb = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_pba = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_vba = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_vc = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_pca = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_vca = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_qba = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_qca = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_dv = new b2Vec2();
b2ParticleSystem.SolveBarrier_s_f = new b2Vec2();
b2ParticleSystem.SolvePressure_s_f = new b2Vec2();
b2ParticleSystem.SolveDamping_s_v = new b2Vec2();
b2ParticleSystem.SolveDamping_s_f = new b2Vec2();
b2ParticleSystem.SolveRigidDamping_s_t0 = new b2Vec2();
b2ParticleSystem.SolveRigidDamping_s_t1 = new b2Vec2();
b2ParticleSystem.SolveRigidDamping_s_p = new b2Vec2();
b2ParticleSystem.SolveRigidDamping_s_v = new b2Vec2();
b2ParticleSystem.SolveExtraDamping_s_v = new b2Vec2();
b2ParticleSystem.SolveExtraDamping_s_f = new b2Vec2();
b2ParticleSystem.SolveRigid_s_position = new b2Vec2();
b2ParticleSystem.SolveRigid_s_rotation = new b2Rot();
b2ParticleSystem.SolveRigid_s_transform = new b2Transform();
b2ParticleSystem.SolveRigid_s_velocityTransform = new b2Transform();
b2ParticleSystem.SolveElastic_s_pa = new b2Vec2();
b2ParticleSystem.SolveElastic_s_pb = new b2Vec2();
b2ParticleSystem.SolveElastic_s_pc = new b2Vec2();
b2ParticleSystem.SolveElastic_s_r = new b2Rot();
b2ParticleSystem.SolveElastic_s_t0 = new b2Vec2();
b2ParticleSystem.SolveSpring_s_pa = new b2Vec2();
b2ParticleSystem.SolveSpring_s_pb = new b2Vec2();
b2ParticleSystem.SolveSpring_s_d = new b2Vec2();
b2ParticleSystem.SolveSpring_s_f = new b2Vec2();
b2ParticleSystem.SolveTensile_s_weightedNormal = new b2Vec2();
b2ParticleSystem.SolveTensile_s_s = new b2Vec2();
b2ParticleSystem.SolveTensile_s_f = new b2Vec2();
b2ParticleSystem.SolveViscous_s_v = new b2Vec2();
b2ParticleSystem.SolveViscous_s_f = new b2Vec2();
b2ParticleSystem.SolveRepulsive_s_f = new b2Vec2();
b2ParticleSystem.SolvePowder_s_f = new b2Vec2();
b2ParticleSystem.SolveSolid_s_f = new b2Vec2();
b2ParticleSystem.RemoveSpuriousBodyContacts_s_n = new b2Vec2();
b2ParticleSystem.RemoveSpuriousBodyContacts_s_pos = new b2Vec2();
b2ParticleSystem.RemoveSpuriousBodyContacts_s_normal = new b2Vec2();
(function (b2ParticleSystem) {
    class UserOverridableBuffer {
        constructor() {
            this.data = null;
            this.userSuppliedCapacity = 0;
        }
    }
    b2ParticleSystem.UserOverridableBuffer = UserOverridableBuffer;
    class Proxy {
        constructor() {
            this.index = b2_invalidParticleIndex;
            this.tag = 0;
        }
        static CompareProxyProxy(a, b) {
            return a.tag < b.tag;
        }
        static CompareTagProxy(a, b) {
            return a < b.tag;
        }
        static CompareProxyTag(a, b) {
            return a.tag < b;
        }
    }
    b2ParticleSystem.Proxy = Proxy;
    class InsideBoundsEnumerator {
        /**
         * InsideBoundsEnumerator enumerates all particles inside the
         * given bounds.
         *
         * Construct an enumerator with bounds of tags and a range of
         * proxies.
         */
        constructor(system, lower, upper, first, last) {
            this.m_system = system;
            this.m_xLower = (lower & b2ParticleSystem.xMask) >>> 0;
            this.m_xUpper = (upper & b2ParticleSystem.xMask) >>> 0;
            this.m_yLower = (lower & b2ParticleSystem.yMask) >>> 0;
            this.m_yUpper = (upper & b2ParticleSystem.yMask) >>> 0;
            this.m_first = first;
            this.m_last = last;
            // DEBUG: b2Assert(this.m_first <= this.m_last);
        }
        /**
         * Get index of the next particle. Returns
         * b2_invalidParticleIndex if there are no more particles.
         */
        GetNext() {
            while (this.m_first < this.m_last) {
                const xTag = (this.m_system.m_proxyBuffer.data[this.m_first].tag & b2ParticleSystem.xMask) >>> 0;
                // #if B2_ASSERT_ENABLED
                // DEBUG: const yTag = (this.m_system.m_proxyBuffer.data[this.m_first].tag & b2ParticleSystem.yMask) >>> 0;
                // DEBUG: b2Assert(yTag >= this.m_yLower);
                // DEBUG: b2Assert(yTag <= this.m_yUpper);
                // #endif
                if (xTag >= this.m_xLower && xTag <= this.m_xUpper) {
                    return (this.m_system.m_proxyBuffer.data[this.m_first++]).index;
                }
                this.m_first++;
            }
            return b2_invalidParticleIndex;
        }
    }
    b2ParticleSystem.InsideBoundsEnumerator = InsideBoundsEnumerator;
    class ParticleListNode {
        constructor() {
            /**
             * The next node in the list.
             */
            this.next = null;
            /**
             * Number of entries in the list. Valid only for the node at the
             * head of the list.
             */
            this.count = 0;
            /**
             * Particle index.
             */
            this.index = 0;
        }
    }
    b2ParticleSystem.ParticleListNode = ParticleListNode;
    /**
     * @constructor
     */
    class FixedSetAllocator {
        Allocate(itemSize, count) {
            // TODO
            return count;
        }
        Clear() {
            // TODO
        }
        GetCount() {
            // TODO
            return 0;
        }
        Invalidate(itemIndex) {
            // TODO
        }
        GetValidBuffer() {
            // TODO
            return [];
        }
        GetBuffer() {
            // TODO
            return [];
        }
        SetCount(count) {
            // TODO
        }
    }
    b2ParticleSystem.FixedSetAllocator = FixedSetAllocator;
    class FixtureParticle {
        constructor(fixture, particle) {
            this.second = b2_invalidParticleIndex;
            this.first = fixture;
            this.second = particle;
        }
    }
    b2ParticleSystem.FixtureParticle = FixtureParticle;
    class FixtureParticleSet extends b2ParticleSystem.FixedSetAllocator {
        Initialize(bodyContactBuffer, flagsBuffer) {
            // TODO
        }
        Find(pair) {
            // TODO
            return b2_invalidParticleIndex;
        }
    }
    b2ParticleSystem.FixtureParticleSet = FixtureParticleSet;
    class ParticlePair {
        constructor(particleA, particleB) {
            this.first = b2_invalidParticleIndex;
            this.second = b2_invalidParticleIndex;
            this.first = particleA;
            this.second = particleB;
        }
    }
    b2ParticleSystem.ParticlePair = ParticlePair;
    class b2ParticlePairSet extends b2ParticleSystem.FixedSetAllocator {
        Initialize(contactBuffer, flagsBuffer) {
            // TODO
        }
        Find(pair) {
            // TODO
            return b2_invalidParticleIndex;
        }
    }
    b2ParticleSystem.b2ParticlePairSet = b2ParticlePairSet;
    class ConnectionFilter {
        /**
         * Is the particle necessary for connection?
         * A pair or a triad should contain at least one 'necessary'
         * particle.
         */
        IsNecessary(index) {
            return true;
        }
        /**
         * An additional condition for creating a pair.
         */
        ShouldCreatePair(a, b) {
            return true;
        }
        /**
         * An additional condition for creating a triad.
         */
        ShouldCreateTriad(a, b, c) {
            return true;
        }
    }
    b2ParticleSystem.ConnectionFilter = ConnectionFilter;
    class DestroyParticlesInShapeCallback extends b2QueryCallback {
        constructor(system, shape, xf, callDestructionListener) {
            super();
            this.m_callDestructionListener = false;
            this.m_destroyed = 0;
            this.m_system = system;
            this.m_shape = shape;
            this.m_xf = xf;
            this.m_callDestructionListener = callDestructionListener;
            this.m_destroyed = 0;
        }
        ReportFixture(fixture) {
            return false;
        }
        ReportParticle(particleSystem, index) {
            if (particleSystem !== this.m_system) {
                return false;
            }
            // DEBUG: b2Assert(index >= 0 && index < this.m_system.m_count);
            if (!this.m_system.m_positionBuffer.data) {
                throw new Error();
            }
            if (this.m_shape.TestPoint(this.m_xf, this.m_system.m_positionBuffer.data[index])) {
                this.m_system.DestroyParticle(index, this.m_callDestructionListener);
                this.m_destroyed++;
            }
            return true;
        }
        Destroyed() {
            return this.m_destroyed;
        }
    }
    b2ParticleSystem.DestroyParticlesInShapeCallback = DestroyParticlesInShapeCallback;
    class JoinParticleGroupsFilter extends b2ParticleSystem.ConnectionFilter {
        constructor(threshold) {
            super();
            this.m_threshold = 0;
            this.m_threshold = threshold;
        }
        /**
         * An additional condition for creating a pair.
         */
        ShouldCreatePair(a, b) {
            return (a < this.m_threshold && this.m_threshold <= b) ||
                (b < this.m_threshold && this.m_threshold <= a);
        }
        /**
         * An additional condition for creating a triad.
         */
        ShouldCreateTriad(a, b, c) {
            return (a < this.m_threshold || b < this.m_threshold || c < this.m_threshold) &&
                (this.m_threshold <= a || this.m_threshold <= b || this.m_threshold <= c);
        }
    }
    b2ParticleSystem.JoinParticleGroupsFilter = JoinParticleGroupsFilter;
    class CompositeShape extends b2Shape {
        constructor(shapes, shapeCount = shapes.length) {
            super(b2ShapeType.e_unknown, 0);
            this.m_shapeCount = 0;
            this.m_shapes = shapes;
            this.m_shapeCount = shapeCount;
        }
        Clone() {
            // DEBUG: b2Assert(false);
            throw new Error();
        }
        GetChildCount() {
            return 1;
        }
        /**
         * @see b2Shape::TestPoint
         */
        TestPoint(xf, p) {
            for (let i = 0; i < this.m_shapeCount; i++) {
                if (this.m_shapes[i].TestPoint(xf, p)) {
                    return true;
                }
            }
            return false;
        }
        /**
         * @see b2Shape::ComputeDistance
         */
        ComputeDistance(xf, p, normal, childIndex) {
            // DEBUG: b2Assert(false);
            return 0;
        }
        /**
         * Implement b2Shape.
         */
        RayCast(output, input, xf, childIndex) {
            // DEBUG: b2Assert(false);
            return false;
        }
        /**
         * @see b2Shape::ComputeAABB
         */
        ComputeAABB(aabb, xf, childIndex) {
            const s_subaabb = new b2AABB();
            aabb.lowerBound.x = +b2_maxFloat;
            aabb.lowerBound.y = +b2_maxFloat;
            aabb.upperBound.x = -b2_maxFloat;
            aabb.upperBound.y = -b2_maxFloat;
            // DEBUG: b2Assert(childIndex === 0);
            for (let i = 0; i < this.m_shapeCount; i++) {
                const childCount = this.m_shapes[i].GetChildCount();
                for (let j = 0; j < childCount; j++) {
                    const subaabb = s_subaabb;
                    this.m_shapes[i].ComputeAABB(subaabb, xf, j);
                    aabb.Combine1(subaabb);
                }
            }
        }
        /**
         * @see b2Shape::ComputeMass
         */
        ComputeMass(massData, density) {
            // DEBUG: b2Assert(false);
        }
        SetupDistanceProxy(proxy, index) {
            // DEBUG: b2Assert(false);
        }
        ComputeSubmergedArea(normal, offset, xf, c) {
            // DEBUG: b2Assert(false);
            return 0;
        }
        Dump(log) {
            // DEBUG: b2Assert(false);
        }
    }
    b2ParticleSystem.CompositeShape = CompositeShape;
    class ReactiveFilter extends b2ParticleSystem.ConnectionFilter {
        constructor(flagsBuffer) {
            super();
            this.m_flagsBuffer = flagsBuffer;
        }
        IsNecessary(index) {
            if (!this.m_flagsBuffer.data) {
                throw new Error();
            }
            return (this.m_flagsBuffer.data[index] & b2ParticleFlag.b2_reactiveParticle) !== 0;
        }
    }
    b2ParticleSystem.ReactiveFilter = ReactiveFilter;
    class UpdateBodyContactsCallback extends b2FixtureParticleQueryCallback {
        constructor(system, contactFilter) {
            super(system); // base class constructor
            this.m_contactFilter = contactFilter;
        }
        ShouldCollideFixtureParticle(fixture, particleSystem, particleIndex) {
            // Call the contact filter if it's set, to determine whether to
            // filter this contact.  Returns true if contact calculations should
            // be performed, false otherwise.
            if (this.m_contactFilter) {
                const flags = this.m_system.GetFlagsBuffer();
                if (flags[particleIndex] & b2ParticleFlag.b2_fixtureContactFilterParticle) {
                    return this.m_contactFilter.ShouldCollideFixtureParticle(fixture, this.m_system, particleIndex);
                }
            }
            return true;
        }
        ReportFixtureAndParticle(fixture, childIndex, a) {
            const s_n = b2ParticleSystem.UpdateBodyContactsCallback.ReportFixtureAndParticle_s_n;
            const s_rp = b2ParticleSystem.UpdateBodyContactsCallback.ReportFixtureAndParticle_s_rp;
            if (!this.m_system.m_flagsBuffer.data) {
                throw new Error();
            }
            if (!this.m_system.m_positionBuffer.data) {
                throw new Error();
            }
            const ap = this.m_system.m_positionBuffer.data[a];
            const n = s_n;
            const d = fixture.ComputeDistance(ap, n, childIndex);
            if (d < this.m_system.m_particleDiameter && this.ShouldCollideFixtureParticle(fixture, this.m_system, a)) {
                const b = fixture.GetBody();
                const bp = b.GetWorldCenter();
                const bm = b.GetMass();
                const bI = b.GetInertia() - bm * b.GetLocalCenter().LengthSquared();
                const invBm = bm > 0 ? 1 / bm : 0;
                const invBI = bI > 0 ? 1 / bI : 0;
                const invAm = this.m_system.m_flagsBuffer.data[a] &
                    b2ParticleFlag.b2_wallParticle ? 0 : this.m_system.GetParticleInvMass();
                ///b2Vec2 rp = ap - bp;
                const rp = b2Vec2.SubVV(ap, bp, s_rp);
                const rpn = b2Vec2.CrossVV(rp, n);
                const invM = invAm + invBm + invBI * rpn * rpn;
                ///b2ParticleBodyContact& contact = m_system.m_bodyContactBuffer.Append();
                const contact = this.m_system.m_bodyContactBuffer.data[this.m_system.m_bodyContactBuffer.Append()];
                contact.index = a;
                contact.body = b;
                contact.fixture = fixture;
                contact.weight = 1 - d * this.m_system.m_inverseDiameter;
                ///contact.normal = -n;
                contact.normal.Copy(n.SelfNeg());
                contact.mass = invM > 0 ? 1 / invM : 0;
                this.m_system.DetectStuckParticle(a);
            }
        }
    }
    UpdateBodyContactsCallback.ReportFixtureAndParticle_s_n = new b2Vec2();
    UpdateBodyContactsCallback.ReportFixtureAndParticle_s_rp = new b2Vec2();
    b2ParticleSystem.UpdateBodyContactsCallback = UpdateBodyContactsCallback;
    class SolveCollisionCallback extends b2FixtureParticleQueryCallback {
        constructor(system, step) {
            super(system); // base class constructor
            this.m_step = step;
        }
        ReportFixtureAndParticle(fixture, childIndex, a) {
            const s_p1 = b2ParticleSystem.SolveCollisionCallback.ReportFixtureAndParticle_s_p1;
            const s_output = b2ParticleSystem.SolveCollisionCallback.ReportFixtureAndParticle_s_output;
            const s_input = b2ParticleSystem.SolveCollisionCallback.ReportFixtureAndParticle_s_input;
            const s_p = b2ParticleSystem.SolveCollisionCallback.ReportFixtureAndParticle_s_p;
            const s_v = b2ParticleSystem.SolveCollisionCallback.ReportFixtureAndParticle_s_v;
            const s_f = b2ParticleSystem.SolveCollisionCallback.ReportFixtureAndParticle_s_f;
            const body = fixture.GetBody();
            if (!this.m_system.m_positionBuffer.data) {
                throw new Error();
            }
            if (!this.m_system.m_velocityBuffer.data) {
                throw new Error();
            }
            const ap = this.m_system.m_positionBuffer.data[a];
            const av = this.m_system.m_velocityBuffer.data[a];
            const output = s_output;
            const input = s_input;
            if (this.m_system.m_iterationIndex === 0) {
                // Put 'ap' in the local space of the previous frame
                ///b2Vec2 p1 = b2MulT(body.m_xf0, ap);
                const p1 = b2Transform.MulTXV(body.m_xf0, ap, s_p1);
                if (fixture.GetShape().GetType() === b2ShapeType.e_circleShape) {
                    // Make relative to the center of the circle
                    ///p1 -= body.GetLocalCenter();
                    p1.SelfSub(body.GetLocalCenter());
                    // Re-apply rotation about the center of the circle
                    ///p1 = b2Mul(body.m_xf0.q, p1);
                    b2Rot.MulRV(body.m_xf0.q, p1, p1);
                    // Subtract rotation of the current frame
                    ///p1 = b2MulT(body.m_xf.q, p1);
                    b2Rot.MulTRV(body.m_xf.q, p1, p1);
                    // Return to local space
                    ///p1 += body.GetLocalCenter();
                    p1.SelfAdd(body.GetLocalCenter());
                }
                // Return to global space and apply rotation of current frame
                ///input.p1 = b2Mul(body.m_xf, p1);
                b2Transform.MulXV(body.m_xf, p1, input.p1);
            }
            else {
                ///input.p1 = ap;
                input.p1.Copy(ap);
            }
            ///input.p2 = ap + m_step.dt * av;
            b2Vec2.AddVMulSV(ap, this.m_step.dt, av, input.p2);
            input.maxFraction = 1;
            if (fixture.RayCast(output, input, childIndex)) {
                const n = output.normal;
                ///b2Vec2 p = (1 - output.fraction) * input.p1 + output.fraction * input.p2 + b2_linearSlop * n;
                const p = s_p;
                p.x = (1 - output.fraction) * input.p1.x + output.fraction * input.p2.x + b2_linearSlop * n.x;
                p.y = (1 - output.fraction) * input.p1.y + output.fraction * input.p2.y + b2_linearSlop * n.y;
                ///b2Vec2 v = m_step.inv_dt * (p - ap);
                const v = s_v;
                v.x = this.m_step.inv_dt * (p.x - ap.x);
                v.y = this.m_step.inv_dt * (p.y - ap.y);
                ///m_system.m_velocityBuffer.data[a] = v;
                this.m_system.m_velocityBuffer.data[a].Copy(v);
                ///b2Vec2 f = m_step.inv_dt * m_system.GetParticleMass() * (av - v);
                const f = s_f;
                f.x = this.m_step.inv_dt * this.m_system.GetParticleMass() * (av.x - v.x);
                f.y = this.m_step.inv_dt * this.m_system.GetParticleMass() * (av.y - v.y);
                this.m_system.ParticleApplyForce(a, f);
            }
        }
        ReportParticle(system, index) {
            return false;
        }
    }
    SolveCollisionCallback.ReportFixtureAndParticle_s_p1 = new b2Vec2();
    SolveCollisionCallback.ReportFixtureAndParticle_s_output = new b2RayCastOutput();
    SolveCollisionCallback.ReportFixtureAndParticle_s_input = new b2RayCastInput();
    SolveCollisionCallback.ReportFixtureAndParticle_s_p = new b2Vec2();
    SolveCollisionCallback.ReportFixtureAndParticle_s_v = new b2Vec2();
    SolveCollisionCallback.ReportFixtureAndParticle_s_f = new b2Vec2();
    b2ParticleSystem.SolveCollisionCallback = SolveCollisionCallback;
})(b2ParticleSystem || (b2ParticleSystem = {}));
// #endif
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJQYXJ0aWNsZVN5c3RlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL1BhcnRpY2xlL2IyUGFydGljbGVTeXN0ZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFFSCx5QkFBeUI7QUFFekIsK0VBQStFO0FBQy9FLE9BQU8sRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFFLGtDQUFrQyxFQUFFLDBCQUEwQixFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUMxTSxPQUFPLEVBQUUsc0JBQXNCLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUM1SCxPQUFPLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQU0sTUFBTSxrQkFBa0IsQ0FBQztBQUNuSCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDM0MsT0FBTyxFQUFFLE1BQU0sRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDbkYsT0FBTyxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQWMsTUFBTSw2QkFBNkIsQ0FBQztBQUMvRSxPQUFPLEVBQUUsV0FBVyxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFFOUQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBSXBELE9BQU8sRUFBc0MsZUFBZSxFQUFxQixNQUFNLDhCQUE4QixDQUFDO0FBQ3RILE9BQU8sRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLGdCQUFnQixFQUFrQixNQUFNLGNBQWMsQ0FBQztBQUMvRixPQUFPLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtC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