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
import { b2_linearSlop, b2_maxPolygonVertices } from "../Common/b2Settings";
import { b2Abs, b2Max, b2Vec2, b2Rot, b2Transform, b2Sweep } from "../Common/b2Math";
import { b2Timer } from "../Common/b2Timer";
import { b2Distance, b2DistanceInput, b2DistanceOutput, b2DistanceProxy, b2SimplexCache } from "./b2Distance";
export let b2_toiTime = 0;
export let b2_toiMaxTime = 0;
export let b2_toiCalls = 0;
export let b2_toiIters = 0;
export let b2_toiMaxIters = 0;
export let b2_toiRootIters = 0;
export let b2_toiMaxRootIters = 0;
export function b2_toi_reset() {
    b2_toiTime = 0;
    b2_toiMaxTime = 0;
    b2_toiCalls = 0;
    b2_toiIters = 0;
    b2_toiMaxIters = 0;
    b2_toiRootIters = 0;
    b2_toiMaxRootIters = 0;
}
const b2TimeOfImpact_s_xfA = new b2Transform();
const b2TimeOfImpact_s_xfB = new b2Transform();
const b2TimeOfImpact_s_pointA = new b2Vec2();
const b2TimeOfImpact_s_pointB = new b2Vec2();
const b2TimeOfImpact_s_normal = new b2Vec2();
const b2TimeOfImpact_s_axisA = new b2Vec2();
const b2TimeOfImpact_s_axisB = new b2Vec2();
/// Input parameters for b2TimeOfImpact
export class b2TOIInput {
    constructor() {
        this.proxyA = new b2DistanceProxy();
        this.proxyB = new b2DistanceProxy();
        this.sweepA = new b2Sweep();
        this.sweepB = new b2Sweep();
        this.tMax = 0; // defines sweep interval [0, tMax]
    }
}
/// Output parameters for b2TimeOfImpact.
export var b2TOIOutputState;
(function (b2TOIOutputState) {
    b2TOIOutputState[b2TOIOutputState["e_unknown"] = 0] = "e_unknown";
    b2TOIOutputState[b2TOIOutputState["e_failed"] = 1] = "e_failed";
    b2TOIOutputState[b2TOIOutputState["e_overlapped"] = 2] = "e_overlapped";
    b2TOIOutputState[b2TOIOutputState["e_touching"] = 3] = "e_touching";
    b2TOIOutputState[b2TOIOutputState["e_separated"] = 4] = "e_separated";
})(b2TOIOutputState || (b2TOIOutputState = {}));
export class b2TOIOutput {
    constructor() {
        this.state = b2TOIOutputState.e_unknown;
        this.t = 0;
    }
}
export var b2SeparationFunctionType;
(function (b2SeparationFunctionType) {
    b2SeparationFunctionType[b2SeparationFunctionType["e_unknown"] = -1] = "e_unknown";
    b2SeparationFunctionType[b2SeparationFunctionType["e_points"] = 0] = "e_points";
    b2SeparationFunctionType[b2SeparationFunctionType["e_faceA"] = 1] = "e_faceA";
    b2SeparationFunctionType[b2SeparationFunctionType["e_faceB"] = 2] = "e_faceB";
})(b2SeparationFunctionType || (b2SeparationFunctionType = {}));
export class b2SeparationFunction {
    constructor() {
        this.m_sweepA = new b2Sweep();
        this.m_sweepB = new b2Sweep();
        this.m_type = b2SeparationFunctionType.e_unknown;
        this.m_localPoint = new b2Vec2();
        this.m_axis = new b2Vec2();
    }
    Initialize(cache, proxyA, sweepA, proxyB, sweepB, t1) {
        this.m_proxyA = proxyA;
        this.m_proxyB = proxyB;
        const count = cache.count;
        // DEBUG: b2Assert(0 < count && count < 3);
        this.m_sweepA.Copy(sweepA);
        this.m_sweepB.Copy(sweepB);
        const xfA = b2TimeOfImpact_s_xfA;
        const xfB = b2TimeOfImpact_s_xfB;
        this.m_sweepA.GetTransform(xfA, t1);
        this.m_sweepB.GetTransform(xfB, t1);
        if (count === 1) {
            this.m_type = b2SeparationFunctionType.e_points;
            const localPointA = this.m_proxyA.GetVertex(cache.indexA[0]);
            const localPointB = this.m_proxyB.GetVertex(cache.indexB[0]);
            const pointA = b2Transform.MulXV(xfA, localPointA, b2TimeOfImpact_s_pointA);
            const pointB = b2Transform.MulXV(xfB, localPointB, b2TimeOfImpact_s_pointB);
            b2Vec2.SubVV(pointB, pointA, this.m_axis);
            const s = this.m_axis.Normalize();
            // #if B2_ENABLE_PARTICLE
            this.m_localPoint.SetZero();
            // #endif
            return s;
        }
        else if (cache.indexA[0] === cache.indexA[1]) {
            // Two points on B and one on A.
            this.m_type = b2SeparationFunctionType.e_faceB;
            const localPointB1 = this.m_proxyB.GetVertex(cache.indexB[0]);
            const localPointB2 = this.m_proxyB.GetVertex(cache.indexB[1]);
            b2Vec2.CrossVOne(b2Vec2.SubVV(localPointB2, localPointB1, b2Vec2.s_t0), this.m_axis).SelfNormalize();
            const normal = b2Rot.MulRV(xfB.q, this.m_axis, b2TimeOfImpact_s_normal);
            b2Vec2.MidVV(localPointB1, localPointB2, this.m_localPoint);
            const pointB = b2Transform.MulXV(xfB, this.m_localPoint, b2TimeOfImpact_s_pointB);
            const localPointA = this.m_proxyA.GetVertex(cache.indexA[0]);
            const pointA = b2Transform.MulXV(xfA, localPointA, b2TimeOfImpact_s_pointA);
            let s = b2Vec2.DotVV(b2Vec2.SubVV(pointA, pointB, b2Vec2.s_t0), normal);
            if (s < 0) {
                this.m_axis.SelfNeg();
                s = -s;
            }
            return s;
        }
        else {
            // Two points on A and one or two points on B.
            this.m_type = b2SeparationFunctionType.e_faceA;
            const localPointA1 = this.m_proxyA.GetVertex(cache.indexA[0]);
            const localPointA2 = this.m_proxyA.GetVertex(cache.indexA[1]);
            b2Vec2.CrossVOne(b2Vec2.SubVV(localPointA2, localPointA1, b2Vec2.s_t0), this.m_axis).SelfNormalize();
            const normal = b2Rot.MulRV(xfA.q, this.m_axis, b2TimeOfImpact_s_normal);
            b2Vec2.MidVV(localPointA1, localPointA2, this.m_localPoint);
            const pointA = b2Transform.MulXV(xfA, this.m_localPoint, b2TimeOfImpact_s_pointA);
            const localPointB = this.m_proxyB.GetVertex(cache.indexB[0]);
            const pointB = b2Transform.MulXV(xfB, localPointB, b2TimeOfImpact_s_pointB);
            let s = b2Vec2.DotVV(b2Vec2.SubVV(pointB, pointA, b2Vec2.s_t0), normal);
            if (s < 0) {
                this.m_axis.SelfNeg();
                s = -s;
            }
            return s;
        }
    }
    FindMinSeparation(indexA, indexB, t) {
        const xfA = b2TimeOfImpact_s_xfA;
        const xfB = b2TimeOfImpact_s_xfB;
        this.m_sweepA.GetTransform(xfA, t);
        this.m_sweepB.GetTransform(xfB, t);
        switch (this.m_type) {
            case b2SeparationFunctionType.e_points: {
                const axisA = b2Rot.MulTRV(xfA.q, this.m_axis, b2TimeOfImpact_s_axisA);
                const axisB = b2Rot.MulTRV(xfB.q, b2Vec2.NegV(this.m_axis, b2Vec2.s_t0), b2TimeOfImpact_s_axisB);
                indexA[0] = this.m_proxyA.GetSupport(axisA);
                indexB[0] = this.m_proxyB.GetSupport(axisB);
                const localPointA = this.m_proxyA.GetVertex(indexA[0]);
                const localPointB = this.m_proxyB.GetVertex(indexB[0]);
                const pointA = b2Transform.MulXV(xfA, localPointA, b2TimeOfImpact_s_pointA);
                const pointB = b2Transform.MulXV(xfB, localPointB, b2TimeOfImpact_s_pointB);
                const separation = b2Vec2.DotVV(b2Vec2.SubVV(pointB, pointA, b2Vec2.s_t0), this.m_axis);
                return separation;
            }
            case b2SeparationFunctionType.e_faceA: {
                const normal = b2Rot.MulRV(xfA.q, this.m_axis, b2TimeOfImpact_s_normal);
                const pointA = b2Transform.MulXV(xfA, this.m_localPoint, b2TimeOfImpact_s_pointA);
                const axisB = b2Rot.MulTRV(xfB.q, b2Vec2.NegV(normal, b2Vec2.s_t0), b2TimeOfImpact_s_axisB);
                indexA[0] = -1;
                indexB[0] = this.m_proxyB.GetSupport(axisB);
                const localPointB = this.m_proxyB.GetVertex(indexB[0]);
                const pointB = b2Transform.MulXV(xfB, localPointB, b2TimeOfImpact_s_pointB);
                const separation = b2Vec2.DotVV(b2Vec2.SubVV(pointB, pointA, b2Vec2.s_t0), normal);
                return separation;
            }
            case b2SeparationFunctionType.e_faceB: {
                const normal = b2Rot.MulRV(xfB.q, this.m_axis, b2TimeOfImpact_s_normal);
                const pointB = b2Transform.MulXV(xfB, this.m_localPoint, b2TimeOfImpact_s_pointB);
                const axisA = b2Rot.MulTRV(xfA.q, b2Vec2.NegV(normal, b2Vec2.s_t0), b2TimeOfImpact_s_axisA);
                indexB[0] = -1;
                indexA[0] = this.m_proxyA.GetSupport(axisA);
                const localPointA = this.m_proxyA.GetVertex(indexA[0]);
                const pointA = b2Transform.MulXV(xfA, localPointA, b2TimeOfImpact_s_pointA);
                const separation = b2Vec2.DotVV(b2Vec2.SubVV(pointA, pointB, b2Vec2.s_t0), normal);
                return separation;
            }
            default:
                // DEBUG: b2Assert(false);
                indexA[0] = -1;
                indexB[0] = -1;
                return 0;
        }
    }
    Evaluate(indexA, indexB, t) {
        const xfA = b2TimeOfImpact_s_xfA;
        const xfB = b2TimeOfImpact_s_xfB;
        this.m_sweepA.GetTransform(xfA, t);
        this.m_sweepB.GetTransform(xfB, t);
        switch (this.m_type) {
            case b2SeparationFunctionType.e_points: {
                const localPointA = this.m_proxyA.GetVertex(indexA);
                const localPointB = this.m_proxyB.GetVertex(indexB);
                const pointA = b2Transform.MulXV(xfA, localPointA, b2TimeOfImpact_s_pointA);
                const pointB = b2Transform.MulXV(xfB, localPointB, b2TimeOfImpact_s_pointB);
                const separation = b2Vec2.DotVV(b2Vec2.SubVV(pointB, pointA, b2Vec2.s_t0), this.m_axis);
                return separation;
            }
            case b2SeparationFunctionType.e_faceA: {
                const normal = b2Rot.MulRV(xfA.q, this.m_axis, b2TimeOfImpact_s_normal);
                const pointA = b2Transform.MulXV(xfA, this.m_localPoint, b2TimeOfImpact_s_pointA);
                const localPointB = this.m_proxyB.GetVertex(indexB);
                const pointB = b2Transform.MulXV(xfB, localPointB, b2TimeOfImpact_s_pointB);
                const separation = b2Vec2.DotVV(b2Vec2.SubVV(pointB, pointA, b2Vec2.s_t0), normal);
                return separation;
            }
            case b2SeparationFunctionType.e_faceB: {
                const normal = b2Rot.MulRV(xfB.q, this.m_axis, b2TimeOfImpact_s_normal);
                const pointB = b2Transform.MulXV(xfB, this.m_localPoint, b2TimeOfImpact_s_pointB);
                const localPointA = this.m_proxyA.GetVertex(indexA);
                const pointA = b2Transform.MulXV(xfA, localPointA, b2TimeOfImpact_s_pointA);
                const separation = b2Vec2.DotVV(b2Vec2.SubVV(pointA, pointB, b2Vec2.s_t0), normal);
                return separation;
            }
            default:
                // DEBUG: b2Assert(false);
                return 0;
        }
    }
}
const b2TimeOfImpact_s_timer = new b2Timer();
const b2TimeOfImpact_s_cache = new b2SimplexCache();
const b2TimeOfImpact_s_distanceInput = new b2DistanceInput();
const b2TimeOfImpact_s_distanceOutput = new b2DistanceOutput();
const b2TimeOfImpact_s_fcn = new b2SeparationFunction();
const b2TimeOfImpact_s_indexA = [0];
const b2TimeOfImpact_s_indexB = [0];
const b2TimeOfImpact_s_sweepA = new b2Sweep();
const b2TimeOfImpact_s_sweepB = new b2Sweep();
export function b2TimeOfImpact(output, input) {
    const timer = b2TimeOfImpact_s_timer.Reset();
    ++b2_toiCalls;
    output.state = b2TOIOutputState.e_unknown;
    output.t = input.tMax;
    const proxyA = input.proxyA;
    const proxyB = input.proxyB;
    const maxVertices = b2Max(b2_maxPolygonVertices, proxyA.m_count, proxyB.m_count);
    const sweepA = b2TimeOfImpact_s_sweepA.Copy(input.sweepA);
    const sweepB = b2TimeOfImpact_s_sweepB.Copy(input.sweepB);
    // Large rotations can make the root finder fail, so we normalize the
    // sweep angles.
    sweepA.Normalize();
    sweepB.Normalize();
    const tMax = input.tMax;
    const totalRadius = proxyA.m_radius + proxyB.m_radius;
    const target = b2Max(b2_linearSlop, totalRadius - 3 * b2_linearSlop);
    const tolerance = 0.25 * b2_linearSlop;
    // DEBUG: b2Assert(target > tolerance);
    let t1 = 0;
    const k_maxIterations = 20; // TODO_ERIN b2Settings
    let iter = 0;
    // Prepare input for distance query.
    const cache = b2TimeOfImpact_s_cache;
    cache.count = 0;
    const distanceInput = b2TimeOfImpact_s_distanceInput;
    distanceInput.proxyA.Copy(input.proxyA);
    distanceInput.proxyB.Copy(input.proxyB);
    distanceInput.useRadii = false;
    // The outer loop progressively attempts to compute new separating axes.
    // This loop terminates when an axis is repeated (no progress is made).
    for (;;) {
        const xfA = b2TimeOfImpact_s_xfA;
        const xfB = b2TimeOfImpact_s_xfB;
        sweepA.GetTransform(xfA, t1);
        sweepB.GetTransform(xfB, t1);
        // Get the distance between shapes. We can also use the results
        // to get a separating axis.
        distanceInput.transformA.Copy(xfA);
        distanceInput.transformB.Copy(xfB);
        const distanceOutput = b2TimeOfImpact_s_distanceOutput;
        b2Distance(distanceOutput, cache, distanceInput);
        // If the shapes are overlapped, we give up on continuous collision.
        if (distanceOutput.distance <= 0) {
            // Failure!
            output.state = b2TOIOutputState.e_overlapped;
            output.t = 0;
            break;
        }
        if (distanceOutput.distance < target + tolerance) {
            // Victory!
            output.state = b2TOIOutputState.e_touching;
            output.t = t1;
            break;
        }
        // Initialize the separating axis.
        const fcn = b2TimeOfImpact_s_fcn;
        fcn.Initialize(cache, proxyA, sweepA, proxyB, sweepB, t1);
        /*
        #if 0
            // Dump the curve seen by the root finder {
              const int32 N = 100;
              float32 dx = 1.0f / N;
              float32 xs[N+1];
              float32 fs[N+1];
        
              float32 x = 0.0f;
        
              for (int32 i = 0; i <= N; ++i) {
                sweepA.GetTransform(&xfA, x);
                sweepB.GetTransform(&xfB, x);
                float32 f = fcn.Evaluate(xfA, xfB) - target;
        
                printf("%g %g\n", x, f);
        
                xs[i] = x;
                fs[i] = f;
        
                x += dx;
              }
            }
        #endif
        */
        // Compute the TOI on the separating axis. We do this by successively
        // resolving the deepest point. This loop is bounded by the number of vertices.
        let done = false;
        let t2 = tMax;
        let pushBackIter = 0;
        for (;;) {
            // Find the deepest point at t2. Store the witness point indices.
            const indexA = b2TimeOfImpact_s_indexA;
            const indexB = b2TimeOfImpact_s_indexB;
            let s2 = fcn.FindMinSeparation(indexA, indexB, t2);
            // Is the final configuration separated?
            if (s2 > (target + tolerance)) {
                // Victory!
                output.state = b2TOIOutputState.e_separated;
                output.t = tMax;
                done = true;
                break;
            }
            // Has the separation reached tolerance?
            if (s2 > (target - tolerance)) {
                // Advance the sweeps
                t1 = t2;
                break;
            }
            // Compute the initial separation of the witness points.
            let s1 = fcn.Evaluate(indexA[0], indexB[0], t1);
            // Check for initial overlap. This might happen if the root finder
            // runs out of iterations.
            if (s1 < (target - tolerance)) {
                output.state = b2TOIOutputState.e_failed;
                output.t = t1;
                done = true;
                break;
            }
            // Check for touching
            if (s1 <= (target + tolerance)) {
                // Victory! t1 should hold the TOI (could be 0.0).
                output.state = b2TOIOutputState.e_touching;
                output.t = t1;
                done = true;
                break;
            }
            // Compute 1D root of: f(x) - target = 0
            let rootIterCount = 0;
            let a1 = t1;
            let a2 = t2;
            for (;;) {
                // Use a mix of the secant rule and bisection.
                let t = 0;
                if (rootIterCount & 1) {
                    // Secant rule to improve convergence.
                    t = a1 + (target - s1) * (a2 - a1) / (s2 - s1);
                }
                else {
                    // Bisection to guarantee progress.
                    t = 0.5 * (a1 + a2);
                }
                ++rootIterCount;
                ++b2_toiRootIters;
                const s = fcn.Evaluate(indexA[0], indexB[0], t);
                if (b2Abs(s - target) < tolerance) {
                    // t2 holds a tentative value for t1
                    t2 = t;
                    break;
                }
                // Ensure we continue to bracket the root.
                if (s > target) {
                    a1 = t;
                    s1 = s;
                }
                else {
                    a2 = t;
                    s2 = s;
                }
                if (rootIterCount === 50) {
                    break;
                }
            }
            b2_toiMaxRootIters = b2Max(b2_toiMaxRootIters, rootIterCount);
            ++pushBackIter;
            if (pushBackIter === maxVertices) {
                break;
            }
        }
        ++iter;
        ++b2_toiIters;
        if (done) {
            break;
        }
        if (iter === k_maxIterations) {
            // Root finder got stuck. Semi-victory.
            output.state = b2TOIOutputState.e_failed;
            output.t = t1;
            break;
        }
    }
    b2_toiMaxIters = b2Max(b2_toiMaxIters, iter);
    const time = timer.GetMilliseconds();
    b2_toiMaxTime = b2Max(b2_toiMaxTime, time);
    b2_toiTime += time;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJUaW1lT2ZJbXBhY3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9Cb3gyRC9Db2xsaXNpb24vYjJUaW1lT2ZJbXBhY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7RUFnQkU7QUFFRiwwREFBMEQ7QUFDMUQsT0FBTyxFQUFFLGFBQWEsRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBQzVFLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLE9BQU8sRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBQ3JGLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUM1QyxPQUFPLEVBQUUsVUFBVSxFQUFFLGVBQWUsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUUsY0FBYyxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBRTlHLE1BQU0sQ0FBQyxJQUFJLFVBQVUsR0FBVyxDQUFDLENBQUM7QUFDbEMsTUFBTSxDQUFDLElBQUksYUFBYSxHQUFXLENBQUMsQ0FBQztBQUNyQyxNQUFNLENBQUMsSUFBSSxXQUFXLEdBQVcsQ0FBQyxDQUFDO0FBQ25DLE1BQU0sQ0FBQyxJQUFJLFdBQVcsR0FBVyxDQUFDLENBQUM7QUFDbkMsTUFBTSxDQUFDLElBQUksY0FBYyxHQUFXLENBQUMsQ0FBQztBQUN0QyxNQUFNLENBQUMsSUFBSSxlQUFlLEdBQVcsQ0FBQyxDQUFDO0FBQ3ZDLE1BQU0sQ0FBQyxJQUFJLGtCQUFrQixHQUFXLENBQUMsQ0FBQztBQUMxQyxNQUFNLFVBQVUsWUFBWTtJQUMxQixVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsYUFBYSxHQUFHLENBQUMsQ0FBQztJQUNsQixXQUFXLEdBQUcsQ0FBQyxDQUFDO0lBQ2hCLFdBQVcsR0FBRyxDQUFDLENBQUM7SUFDaEIsY0FBYyxHQUFHLENBQUMsQ0FBQztJQUNuQixlQUFlLEdBQUcs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