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
export function b2Assert(condition, ...args) {
    if (!condition) {
        // debugger;
        throw new Error(...args);
    }
}
export function b2Maybe(value, def) {
    return value !== undefined ? value : def;
}
export const b2_maxFloat = 1E+37; // FLT_MAX instead of Number.MAX_VALUE;
export const b2_epsilon = 1E-5; // FLT_EPSILON instead of Number.MIN_VALUE;
export const b2_epsilon_sq = (b2_epsilon * b2_epsilon);
export const b2_pi = 3.14159265359; // Math.PI;
/// @file
/// Global tuning constants based on meters-kilograms-seconds (MKS) units.
///
// Collision
/// The maximum number of contact points between two convex shapes. Do
/// not change this value.
export const b2_maxManifoldPoints = 2;
/// The maximum number of vertices on a convex polygon. You cannot increase
/// this too much because b2BlockAllocator has a maximum object size.
export const b2_maxPolygonVertices = 8;
/// This is used to fatten AABBs in the dynamic tree. This allows proxies
/// to move by a small amount without triggering a tree adjustment.
/// This is in meters.
export const b2_aabbExtension = 0.1;
/// This is used to fatten AABBs in the dynamic tree. This is used to predict
/// the future position based on the current displacement.
/// This is a dimensionless multiplier.
export const b2_aabbMultiplier = 2;
/// A small length used as a collision and constraint tolerance. Usually it is
/// chosen to be numerically significant, but visually insignificant.
export const b2_linearSlop = 0.008; // 0.005;
/// A small angle used as a collision and constraint tolerance. Usually it is
/// chosen to be numerically significant, but visually insignificant.
export const b2_angularSlop = 2 / 180 * b2_pi;
/// The radius of the polygon/edge shape skin. This should not be modified. Making
/// this smaller means polygons will have an insufficient buffer for continuous collision.
/// Making it larger may create artifacts for vertex collision.
export const b2_polygonRadius = 2 * b2_linearSlop;
/// Maximum number of sub-steps per contact in continuous physics simulation.
export const b2_maxSubSteps = 8;
// Dynamics
/// Maximum number of contacts to be handled to solve a TOI impact.
export const b2_maxTOIContacts = 32;
/// A velocity threshold for elastic collisions. Any collision with a relative linear
/// velocity below this threshold will be treated as inelastic.
export const b2_velocityThreshold = 1;
/// The maximum linear position correction used when solving constraints. This helps to
/// prevent overshoot.
export const b2_maxLinearCorrection = 0.2;
/// The maximum angular position correction used when solving constraints. This helps to
/// prevent overshoot.
export const b2_maxAngularCorrection = 8 / 180 * b2_pi;
/// The maximum linear velocity of a body. This limit is very large and is used
/// to prevent numerical problems. You shouldn't need to adjust this.
export const b2_maxTranslation = 2;
export const b2_maxTranslationSquared = b2_maxTranslation * b2_maxTranslation;
/// The maximum angular velocity of a body. This limit is very large and is used
/// to prevent numerical problems. You shouldn't need to adjust this.
export const b2_maxRotation = 0.5 * b2_pi;
export const b2_maxRotationSquared = b2_maxRotation * b2_maxRotation;
/// This scale factor controls how fast overlap is resolved. Ideally this would be 1 so
/// that overlap is removed in one time step. However using values close to 1 often lead
/// to overshoot.
export const b2_baumgarte = 0.2;
export const b2_toiBaumgarte = 0.75;
// #if B2_ENABLE_PARTICLE
// Particle
/// A symbolic constant that stands for particle allocation error.
export const b2_invalidParticleIndex = -1;
export const b2_maxParticleIndex = 0x7FFFFFFF;
/// The default distance between particles, multiplied by the particle diameter.
export const b2_particleStride = 0.75;
/// The minimum particle weight that produces pressure.
export const b2_minParticleWeight = 1.0;
/// The upper limit for particle pressure.
export const b2_maxParticlePressure = 0.25;
/// The upper limit for force between particles.
export const b2_maxParticleForce = 0.5;
/// The maximum distance between particles in a triad, multiplied by the particle diameter.
export const b2_maxTriadDistance = 2.0;
export const b2_maxTriadDistanceSquared = (b2_maxTriadDistance * b2_maxTriadDistance);
/// The initial size of particle data buffers.
export const b2_minParticleSystemBufferCapacity = 256;
/// The time into the future that collisions against barrier particles will be detected.
export const b2_barrierCollisionTime = 2.5;
// #endif
// Sleep
/// The time that a body must be still before it will go to sleep.
export const b2_timeToSleep = 0.5;
/// A body cannot sleep if its linear velocity is above this tolerance.
export const b2_linearSleepTolerance = 0.01;
/// A body cannot sleep if its angular velocity is above this tolerance.
export const b2_angularSleepTolerance = 2 / 180 * b2_pi;
// Memory Allocation
/// Implement this function to use your own memory allocator.
export function b2Alloc(size) {
    return null;
}
/// If you implement b2Alloc, you should also implement this function.
export function b2Free(mem) {
}
/// Logging function.
export function b2Log(message, ...args) {
    // console.log(message, ...args);
}
/// Version numbering scheme.
/// See http://en.wikipedia.org/wiki/Software_versioning
export class b2Version {
    constructor(major = 0, minor = 0, revision = 0) {
        this.major = 0; ///< significant changes
        this.minor = 0; ///< incremental changes
        this.revision = 0; ///< bug fixes
        this.major = major;
        this.minor = minor;
        this.revision = revision;
    }
    toString() {
        return this.major + "." + this.minor + "." + this.revision;
    }
}
/// Current version.
export const b2_version = new b2Version(2, 3, 2);
export const b2_branch = "master";
export const b2_commit = "fbf51801d80fc389d43dc46524520e89043b6faf";
export function b2ParseInt(v) {
    return parseInt(v, 10);
}
export function b2ParseUInt(v) {
    return Math.abs(parseInt(v, 10));
}
export function b2MakeArray(length, init) {
    const a = [];
    for (let i = 0; i < length; ++i) {
        a.push(init(i));
    }
    return a;
}
export function b2MakeNullArray(length) {
    const a = [];
    for (let i = 0; i < length; ++i) {
        a.push(null);
    }
    return a;
}
export function b2MakeNumberArray(length, init = 0) {
    const a = [];
    for (let i = 0; i < length; ++i) {
        a.push(init);
    }
    return a;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJTZXR0aW5ncy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL0JveDJEL0NvbW1vbi9iMlNldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7O0VBZ0JFO0FBRUYsTUFBTSxVQUFVLFFBQVEsQ0FBQyxTQUFrQixFQUFFLEdBQUcsSUFBVztJQUN6RCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsWUFBWTtRQUNaLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUMxQjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsT0FBTyxDQUFJLEtBQW9CLEVBQUUsR0FBTTtJQUNyRCxPQUFPLEtBQUssS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDO0FBQzNDLENBQUM7QUFFRCxNQUFNLENBQUMsTUFBTSxXQUFXLEdBQVcsS0FBSyxDQUFDLENBQUMsdUNBQXVDO0FBQ2pGLE1BQU0sQ0FBQyxNQUFNLFVBQVUsR0FBVyxJQUFJLENBQUMsQ0FBQywyQ0FBMkM7QUFDbkYsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFXLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxDQUFDO0FBQy9ELE1BQU0sQ0FBQyxNQUFNLEtBQUssR0FBVyxhQUFhLENBQUMsQ0FBQyxXQUFXO0FBRXZELFNBQVM7QUFDVCwwRUFBMEU7QUFDMUUsR0FBRztBQUVILFlBQVk7QUFFWixzRUFBc0U7QUFDdEUsMEJBQTBCO0FBQzFCLE1BQU0sQ0FBQyxNQUFNLG9CQUFvQixHQUFXLENBQUMsQ0FBQztBQUU5QywyRUFBMkU7QUFDM0UscUVBQXFFO0FBQ3JFLE1BQU0sQ0FBQyxNQUFNLHFCQUFxQixHQUFXLENBQUMsQ0FBQztBQUUvQyx5RUFBeUU7QUFDekUsbUVBQW1FO0FBQ25FLHNCQUFzQjtBQUN0QixNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBVyxHQUFHLENBQUM7QUFFNUMs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