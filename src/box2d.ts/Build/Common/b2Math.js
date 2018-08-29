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
// DEBUG: import { b2Assert } from "./b2Settings";
import { b2_pi, b2_epsilon, b2MakeArray } from "./b2Settings";
export const b2_pi_over_180 = b2_pi / 180;
export const b2_180_over_pi = 180 / b2_pi;
export const b2_two_pi = 2 * b2_pi;
export const b2Abs = Math.abs;
export const b2Min = Math.min;
export const b2Max = Math.max;
export function b2Clamp(a, lo, hi) {
    return (a < lo) ? (lo) : ((a > hi) ? (hi) : (a));
}
export function b2Swap(a, b) {
    // DEBUG: b2Assert(false);
    const tmp = a[0];
    a[0] = b[0];
    b[0] = tmp;
}
/// This function is used to ensure that a floating point number is
/// not a NaN or infinity.
export const b2IsValid = isFinite;
export function b2Sq(n) {
    return n * n;
}
/// This is a approximate yet fast inverse square-root.
export function b2InvSqrt(n) {
    return 1 / Math.sqrt(n);
}
export const b2Sqrt = Math.sqrt;
export const b2Pow = Math.pow;
export function b2DegToRad(degrees) {
    return degrees * b2_pi_over_180;
}
export function b2RadToDeg(radians) {
    return radians * b2_180_over_pi;
}
export const b2Cos = Math.cos;
export const b2Sin = Math.sin;
export const b2Acos = Math.acos;
export const b2Asin = Math.asin;
export const b2Atan2 = Math.atan2;
export function b2NextPowerOfTwo(x) {
    x |= (x >> 1) & 0x7FFFFFFF;
    x |= (x >> 2) & 0x3FFFFFFF;
    x |= (x >> 4) & 0x0FFFFFFF;
    x |= (x >> 8) & 0x00FFFFFF;
    x |= (x >> 16) & 0x0000FFFF;
    return x + 1;
}
export function b2IsPowerOfTwo(x) {
    return x > 0 && (x & (x - 1)) === 0;
}
export function b2Random() {
    return Math.random() * 2 - 1;
}
export function b2RandomRange(lo, hi) {
    return (hi - lo) * Math.random() + lo;
}
/// A 2D column vector.
export class b2Vec2 {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
    Clone() {
        return new b2Vec2(this.x, this.y);
    }
    SetZero() {
        this.x = 0;
        this.y = 0;
        return this;
    }
    Set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    Copy(other) {
        this.x = other.x;
        this.y = other.y;
        return this;
    }
    SelfAdd(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
    SelfAddXY(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }
    SelfSub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }
    SelfSubXY(x, y) {
        this.x -= x;
        this.y -= y;
        return this;
    }
    SelfMul(s) {
        this.x *= s;
        this.y *= s;
        return this;
    }
    SelfMulAdd(s, v) {
        this.x += s * v.x;
        this.y += s * v.y;
        return this;
    }
    SelfMulSub(s, v) {
        this.x -= s * v.x;
        this.y -= s * v.y;
        return this;
    }
    Dot(v) {
        return this.x * v.x + this.y * v.y;
    }
    Cross(v) {
        return this.x * v.y - this.y * v.x;
    }
    Length() {
        const x = this.x, y = this.y;
        return Math.sqrt(x * x + y * y);
    }
    LengthSquared() {
        const x = this.x, y = this.y;
        return (x * x + y * y);
    }
    Normalize() {
        const length = this.Length();
        if (length >= b2_epsilon) {
            const inv_length = 1 / length;
            this.x *= inv_length;
            this.y *= inv_length;
        }
        return length;
    }
    SelfNormalize() {
        const length = this.Length();
        if (length >= b2_epsilon) {
            const inv_length = 1 / length;
            this.x *= inv_length;
            this.y *= inv_length;
        }
        return this;
    }
    SelfRotate(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        const x = this.x;
        this.x = c * x - s * this.y;
        this.y = s * x + c * this.y;
        return this;
    }
    IsValid() {
        return isFinite(this.x) && isFinite(this.y);
    }
    SelfCrossVS(s) {
        const x = this.x;
        this.x = s * this.y;
        this.y = -s * x;
        return this;
    }
    SelfCrossSV(s) {
        const x = this.x;
        this.x = -s * this.y;
        this.y = s * x;
        return this;
    }
    SelfMinV(v) {
        this.x = b2Min(this.x, v.x);
        this.y = b2Min(this.y, v.y);
        return this;
    }
    SelfMaxV(v) {
        this.x = b2Max(this.x, v.x);
        this.y = b2Max(this.y, v.y);
        return this;
    }
    SelfAbs() {
        this.x = b2Abs(this.x);
        this.y = b2Abs(this.y);
        return this;
    }
    SelfNeg() {
        this.x = (-this.x);
        this.y = (-this.y);
        return this;
    }
    SelfSkew() {
        const x = this.x;
        this.x = -this.y;
        this.y = x;
        return this;
    }
    static MakeArray(length) {
        return b2MakeArray(length, (i) => new b2Vec2());
    }
    static AbsV(v, out) {
        out.x = b2Abs(v.x);
        out.y = b2Abs(v.y);
        return out;
    }
    static MinV(a, b, out) {
        out.x = b2Min(a.x, b.x);
        out.y = b2Min(a.y, b.y);
        return out;
    }
    static MaxV(a, b, out) {
        out.x = b2Max(a.x, b.x);
        out.y = b2Max(a.y, b.y);
        return out;
    }
    static ClampV(v, lo, hi, out) {
        out.x = b2Clamp(v.x, lo.x, hi.x);
        out.y = b2Clamp(v.y, lo.y, hi.y);
        return out;
    }
    static RotateV(v, radians, out) {
        const v_x = v.x, v_y = v.y;
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        out.x = c * v_x - s * v_y;
        out.y = s * v_x + c * v_y;
        return out;
    }
    static DotVV(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    static CrossVV(a, b) {
        return a.x * b.y - a.y * b.x;
    }
    static CrossVS(v, s, out) {
        const v_x = v.x;
        out.x = s * v.y;
        out.y = -s * v_x;
        return out;
    }
    static CrossVOne(v, out) {
        const v_x = v.x;
        out.x = v.y;
        out.y = -v_x;
        return out;
    }
    static CrossSV(s, v, out) {
        const v_x = v.x;
        out.x = -s * v.y;
        out.y = s * v_x;
        return out;
    }
    static CrossOneV(v, out) {
        const v_x = v.x;
        out.x = -v.y;
        out.y = v_x;
        return out;
    }
    static AddVV(a, b, out) { out.x = a.x + b.x; out.y = a.y + b.y; return out; }
    static SubVV(a, b, out) { out.x = a.x - b.x; out.y = a.y - b.y; return out; }
    static MulSV(s, v, out) { out.x = v.x * s; out.y = v.y * s; return out; }
    static MulVS(v, s, out) { out.x = v.x * s; out.y = v.y * s; return out; }
    static AddVMulSV(a, s, b, out) { out.x = a.x + (s * b.x); out.y = a.y + (s * b.y); return out; }
    static SubVMulSV(a, s, b, out) { out.x = a.x - (s * b.x); out.y = a.y - (s * b.y); return out; }
    static AddVCrossSV(a, s, v, out) {
        const v_x = v.x;
        out.x = a.x - (s * v.y);
        out.y = a.y + (s * v_x);
        return out;
    }
    static MidVV(a, b, out) { out.x = (a.x + b.x) * 0.5; out.y = (a.y + b.y) * 0.5; return out; }
    static ExtVV(a, b, out) { out.x = (b.x - a.x) * 0.5; out.y = (b.y - a.y) * 0.5; return out; }
    static IsEqualToV(a, b) {
        return a.x === b.x && a.y === b.y;
    }
    static DistanceVV(a, b) {
        const c_x = a.x - b.x;
        const c_y = a.y - b.y;
        return Math.sqrt(c_x * c_x + c_y * c_y);
    }
    static DistanceSquaredVV(a, b) {
        const c_x = a.x - b.x;
        const c_y = a.y - b.y;
        return (c_x * c_x + c_y * c_y);
    }
    static NegV(v, out) { out.x = -v.x; out.y = -v.y; return out; }
}
b2Vec2.ZERO = new b2Vec2(0, 0);
b2Vec2.UNITX = new b2Vec2(1, 0);
b2Vec2.UNITY = new b2Vec2(0, 1);
b2Vec2.s_t0 = new b2Vec2();
b2Vec2.s_t1 = new b2Vec2();
b2Vec2.s_t2 = new b2Vec2();
b2Vec2.s_t3 = new b2Vec2();
export const b2Vec2_zero = new b2Vec2(0, 0);
/// A 2D column vector with 3 elements.
export class b2Vec3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    Clone() {
        return new b2Vec3(this.x, this.y, this.z);
    }
    SetZero() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        return this;
    }
    SetXYZ(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }
    Copy(other) {
        this.x = other.x;
        this.y = other.y;
        this.z = other.z;
        return this;
    }
    SelfNeg() {
        this.x = (-this.x);
        this.y = (-this.y);
        this.z = (-this.z);
        return this;
    }
    SelfAdd(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }
    SelfAddXYZ(x, y, z) {
        this.x += x;
        this.y += y;
        this.z += z;
        return this;
    }
    SelfSub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }
    SelfSubXYZ(x, y, z) {
        this.x -= x;
        this.y -= y;
        this.z -= z;
        return this;
    }
    SelfMul(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }
    static DotV3V3(a, b) {
        return a.x * b.x + a.y * b.y + a.z * b.z;
    }
    static CrossV3V3(a, b, out) {
        const a_x = a.x, a_y = a.y, a_z = a.z;
        const b_x = b.x, b_y = b.y, b_z = b.z;
        out.x = a_y * b_z - a_z * b_y;
        out.y = a_z * b_x - a_x * b_z;
        out.z = a_x * b_y - a_y * b_x;
        return out;
    }
}
b2Vec3.ZERO = new b2Vec3(0, 0, 0);
b2Vec3.s_t0 = new b2Vec3();
/// A 2-by-2 matrix. Stored in column-major order.
export class b2Mat22 {
    constructor() {
        this.ex = new b2Vec2(1, 0);
        this.ey = new b2Vec2(0, 1);
    }
    Clone() {
        return new b2Mat22().Copy(this);
    }
    static FromVV(c1, c2) {
        return new b2Mat22().SetVV(c1, c2);
    }
    static FromSSSS(r1c1, r1c2, r2c1, r2c2) {
        return new b2Mat22().SetSSSS(r1c1, r1c2, r2c1, r2c2);
    }
    static FromAngle(radians) {
        return new b2Mat22().SetAngle(radians);
    }
    SetSSSS(r1c1, r1c2, r2c1, r2c2) {
        this.ex.Set(r1c1, r2c1);
        this.ey.Set(r1c2, r2c2);
        return this;
    }
    SetVV(c1, c2) {
        this.ex.Copy(c1);
        this.ey.Copy(c2);
        return this;
    }
    SetAngle(radians) {
        const c = Math.cos(radians);
        const s = Math.sin(radians);
        this.ex.Set(c, s);
        this.ey.Set(-s, c);
        return this;
    }
    Copy(other) {
        this.ex.Copy(other.ex);
        this.ey.Copy(other.ey);
        return this;
    }
    SetIdentity() {
        this.ex.Set(1, 0);
        this.ey.Set(0, 1);
        return this;
    }
    SetZero() {
        this.ex.SetZero();
        this.ey.SetZero();
        return this;
    }
    GetAngle() {
        return Math.atan2(this.ex.y, this.ex.x);
    }
    GetInverse(out) {
        const a = this.ex.x;
        const b = this.ey.x;
        const c = this.ex.y;
        const d = this.ey.y;
        let det = a * d - b * c;
        if (det !== 0) {
            det = 1 / det;
        }
        out.ex.x = det * d;
        out.ey.x = (-det * b);
        out.ex.y = (-det * c);
        out.ey.y = det * a;
        return out;
    }
    Solve(b_x, b_y, out) {
        const a11 = this.ex.x, a12 = this.ey.x;
        const a21 = this.ex.y, a22 = this.ey.y;
        let det = a11 * a22 - a12 * a21;
        if (det !== 0) {
            det = 1 / det;
        }
        out.x = det * (a22 * b_x - a12 * b_y);
        out.y = det * (a11 * b_y - a21 * b_x);
        return out;
    }
    SelfAbs() {
        this.ex.SelfAbs();
        this.ey.SelfAbs();
        return this;
    }
    SelfInv() {
        this.GetInverse(this);
        return this;
    }
    SelfAddM(M) {
        this.ex.SelfAdd(M.ex);
        this.ey.SelfAdd(M.ey);
        return this;
    }
    SelfSubM(M) {
        this.ex.SelfSub(M.ex);
        this.ey.SelfSub(M.ey);
        return this;
    }
    static AbsM(M, out) {
        const M_ex = M.ex, M_ey = M.ey;
        out.ex.x = b2Abs(M_ex.x);
        out.ex.y = b2Abs(M_ex.y);
        out.ey.x = b2Abs(M_ey.x);
        out.ey.y = b2Abs(M_ey.y);
        return out;
    }
    static MulMV(M, v, out) {
        const M_ex = M.ex, M_ey = M.ey;
        const v_x = v.x, v_y = v.y;
        out.x = M_ex.x * v_x + M_ey.x * v_y;
        out.y = M_ex.y * v_x + M_ey.y * v_y;
        return out;
    }
    static MulTMV(M, v, out) {
        const M_ex = M.ex, M_ey = M.ey;
        const v_x = v.x, v_y = v.y;
        out.x = M_ex.x * v_x + M_ex.y * v_y;
        out.y = M_ey.x * v_x + M_ey.y * v_y;
        return out;
    }
    static AddMM(A, B, out) {
        const A_ex = A.ex, A_ey = A.ey;
        const B_ex = B.ex, B_ey = B.ey;
        out.ex.x = A_ex.x + B_ex.x;
        out.ex.y = A_ex.y + B_ex.y;
        out.ey.x = A_ey.x + B_ey.x;
        out.ey.y = A_ey.y + B_ey.y;
        return out;
    }
    static MulMM(A, B, out) {
        const A_ex_x = A.ex.x, A_ex_y = A.ex.y;
        const A_ey_x = A.ey.x, A_ey_y = A.ey.y;
        const B_ex_x = B.ex.x, B_ex_y = B.ex.y;
        const B_ey_x = B.ey.x, B_ey_y = B.ey.y;
        out.ex.x = A_ex_x * B_ex_x + A_ey_x * B_ex_y;
        out.ex.y = A_ex_y * B_ex_x + A_ey_y * B_ex_y;
        out.ey.x = A_ex_x * B_ey_x + A_ey_x * B_ey_y;
        out.ey.y = A_ex_y * B_ey_x + A_ey_y * B_ey_y;
        return out;
    }
    static MulTMM(A, B, out) {
        const A_ex_x = A.ex.x, A_ex_y = A.ex.y;
        const A_ey_x = A.ey.x, A_ey_y = A.ey.y;
        const B_ex_x = B.ex.x, B_ex_y = B.ex.y;
        const B_ey_x = B.ey.x, B_ey_y = B.ey.y;
        out.ex.x = A_ex_x * B_ex_x + A_ex_y * B_ex_y;
        out.ex.y = A_ey_x * B_ex_x + A_ey_y * B_ex_y;
        out.ey.x = A_ex_x * B_ey_x + A_ex_y * B_ey_y;
        out.ey.y = A_ey_x * B_ey_x + A_ey_y * B_ey_y;
        return out;
    }
}
b2Mat22.IDENTITY = new b2Mat22();
/// A 3-by-3 matrix. Stored in column-major order.
export class b2Mat33 {
    constructor() {
        this.ex = new b2Vec3(1, 0, 0);
        this.ey = new b2Vec3(0, 1, 0);
        this.ez = new b2Vec3(0, 0, 1);
    }
    Clone() {
        return new b2Mat33().Copy(this);
    }
    SetVVV(c1, c2, c3) {
        this.ex.Copy(c1);
        this.ey.Copy(c2);
        this.ez.Copy(c3);
        return this;
    }
    Copy(other) {
        this.ex.Copy(other.ex);
        this.ey.Copy(other.ey);
        this.ez.Copy(other.ez);
        return this;
    }
    SetIdentity() {
        this.ex.SetXYZ(1, 0, 0);
        this.ey.SetXYZ(0, 1, 0);
        this.ez.SetXYZ(0, 0, 1);
        return this;
    }
    SetZero() {
        this.ex.SetZero();
        this.ey.SetZero();
        this.ez.SetZero();
        return this;
    }
    SelfAddM(M) {
        this.ex.SelfAdd(M.ex);
        this.ey.SelfAdd(M.ey);
        this.ez.SelfAdd(M.ez);
        return this;
    }
    Solve33(b_x, b_y, b_z, out) {
        const a11 = this.ex.x, a21 = this.ex.y, a31 = this.ex.z;
        const a12 = this.ey.x, a22 = this.ey.y, a32 = this.ey.z;
        const a13 = this.ez.x, a23 = this.ez.y, a33 = this.ez.z;
        let det = a11 * (a22 * a33 - a32 * a23) + a21 * (a32 * a13 - a12 * a33) + a31 * (a12 * a23 - a22 * a13);
        if (det !== 0) {
            det = 1 / det;
        }
        out.x = det * (b_x * (a22 * a33 - a32 * a23) + b_y * (a32 * a13 - a12 * a33) + b_z * (a12 * a23 - a22 * a13));
        out.y = det * (a11 * (b_y * a33 - b_z * a23) + a21 * (b_z * a13 - b_x * a33) + a31 * (b_x * a23 - b_y * a13));
        out.z = det * (a11 * (a22 * b_z - a32 * b_y) + a21 * (a32 * b_x - a12 * b_z) + a31 * (a12 * b_y - a22 * b_x));
        return out;
    }
    Solve22(b_x, b_y, out) {
        const a11 = this.ex.x, a12 = this.ey.x;
        const a21 = this.ex.y, a22 = this.ey.y;
        let det = a11 * a22 - a12 * a21;
        if (det !== 0) {
            det = 1 / det;
        }
        out.x = det * (a22 * b_x - a12 * b_y);
        out.y = det * (a11 * b_y - a21 * b_x);
        return out;
    }
    GetInverse22(M) {
        const a = this.ex.x, b = this.ey.x, c = this.ex.y, d = this.ey.y;
        let det = a * d - b * c;
        if (det !== 0) {
            det = 1 / det;
        }
        M.ex.x = det * d;
        M.ey.x = -det * b;
        M.ex.z = 0;
        M.ex.y = -det * c;
        M.ey.y = det * a;
        M.ey.z = 0;
        M.ez.x = 0;
        M.ez.y = 0;
        M.ez.z = 0;
    }
    GetSymInverse33(M) {
        let det = b2Vec3.DotV3V3(this.ex, b2Vec3.CrossV3V3(this.ey, this.ez, b2Vec3.s_t0));
        if (det !== 0) {
            det = 1 / det;
        }
        const a11 = this.ex.x, a12 = this.ey.x, a13 = this.ez.x;
        const a22 = this.ey.y, a23 = this.ez.y;
        const a33 = this.ez.z;
        M.ex.x = det * (a22 * a33 - a23 * a23);
        M.ex.y = det * (a13 * a23 - a12 * a33);
        M.ex.z = det * (a12 * a23 - a13 * a22);
        M.ey.x = M.ex.y;
        M.ey.y = det * (a11 * a33 - a13 * a13);
        M.ey.z = det * (a13 * a12 - a11 * a23);
        M.ez.x = M.ex.z;
        M.ez.y = M.ey.z;
        M.ez.z = det * (a11 * a22 - a12 * a12);
    }
    static MulM33V3(A, v, out) {
        const v_x = v.x, v_y = v.y, v_z = v.z;
        out.x = A.ex.x * v_x + A.ey.x * v_y + A.ez.x * v_z;
        out.y = A.ex.y * v_x + A.ey.y * v_y + A.ez.y * v_z;
        out.z = A.ex.z * v_x + A.ey.z * v_y + A.ez.z * v_z;
        return out;
    }
    static MulM33XYZ(A, x, y, z, out) {
        out.x = A.ex.x * x + A.ey.x * y + A.ez.x * z;
        out.y = A.ex.y * x + A.ey.y * y + A.ez.y * z;
        out.z = A.ex.z * x + A.ey.z * y + A.ez.z * z;
        return out;
    }
    static MulM33V2(A, v, out) {
        const v_x = v.x, v_y = v.y;
        out.x = A.ex.x * v_x + A.ey.x * v_y;
        out.y = A.ex.y * v_x + A.ey.y * v_y;
        return out;
    }
    static MulM33XY(A, x, y, out) {
        out.x = A.ex.x * x + A.ey.x * y;
        out.y = A.ex.y * x + A.ey.y * y;
        return out;
    }
}
b2Mat33.IDENTITY = new b2Mat33();
/// Rotation
export class b2Rot {
    constructor(angle = 0) {
        this.s = 0;
        this.c = 1;
        if (angle) {
            this.s = Math.sin(angle);
            this.c = Math.cos(angle);
        }
    }
    Clone() {
        return new b2Rot().Copy(this);
    }
    Copy(other) {
        this.s = other.s;
        this.c = other.c;
        return this;
    }
    SetAngle(angle) {
        this.s = Math.sin(angle);
        this.c = Math.cos(angle);
        return this;
    }
    SetIdentity() {
        this.s = 0;
        this.c = 1;
        return this;
    }
    GetAngle() {
        return Math.atan2(this.s, this.c);
    }
    GetXAxis(out) {
        out.x = this.c;
        out.y = this.s;
        return out;
    }
    GetYAxis(out) {
        out.x = -this.s;
        out.y = this.c;
        return out;
    }
    static MulRR(q, r, out) {
        // [qc -qs] * [rc -rs] = [qc*rc-qs*rs -qc*rs-qs*rc]
        // [qs  qc]   [rs  rc]   [qs*rc+qc*rs -qs*rs+qc*rc]
        // s = qs * rc + qc * rs
        // c = qc * rc - qs * rs
        const q_c = q.c, q_s = q.s;
        const r_c = r.c, r_s = r.s;
        out.s = q_s * r_c + q_c * r_s;
        out.c = q_c * r_c - q_s * r_s;
        return out;
    }
    static MulTRR(q, r, out) {
        // [ qc qs] * [rc -rs] = [qc*rc+qs*rs -qc*rs+qs*rc]
        // [-qs qc]   [rs  rc]   [-qs*rc+qc*rs qs*rs+qc*rc]
        // s = qc * rs - qs * rc
        // c = qc * rc + qs * rs
        const q_c = q.c, q_s = q.s;
        const r_c = r.c, r_s = r.s;
        out.s = q_c * r_s - q_s * r_c;
        out.c = q_c * r_c + q_s * r_s;
        return out;
    }
    static MulRV(q, v, out) {
        const q_c = q.c, q_s = q.s;
        const v_x = v.x, v_y = v.y;
        out.x = q_c * v_x - q_s * v_y;
        out.y = q_s * v_x + q_c * v_y;
        return out;
    }
    static MulTRV(q, v, out) {
        const q_c = q.c, q_s = q.s;
        const v_x = v.x, v_y = v.y;
        out.x = q_c * v_x + q_s * v_y;
        out.y = -q_s * v_x + q_c * v_y;
        return out;
    }
}
b2Rot.IDENTITY = new b2Rot();
/// A transform contains translation and rotation. It is used to represent
/// the position and orientation of rigid frames.
export class b2Transform {
    constructor() {
        this.p = new b2Vec2();
        this.q = new b2Rot();
    }
    Clone() {
        return new b2Transform().Copy(this);
    }
    Copy(other) {
        this.p.Copy(other.p);
        this.q.Copy(other.q);
        return this;
    }
    SetIdentity() {
        this.p.SetZero();
        this.q.SetIdentity();
        return this;
    }
    SetPositionRotation(position, q) {
        this.p.Copy(position);
        this.q.Copy(q);
        return this;
    }
    SetPositionAngle(pos, a) {
        this.p.Copy(pos);
        this.q.SetAngle(a);
        return this;
    }
    SetPosition(position) {
        this.p.Copy(position);
        return this;
    }
    SetPositionXY(x, y) {
        this.p.Set(x, y);
        return this;
    }
    SetRotation(rotation) {
        this.q.Copy(rotation);
        return this;
    }
    SetRotationAngle(radians) {
        this.q.SetAngle(radians);
        return this;
    }
    GetPosition() {
        return this.p;
    }
    GetRotation() {
        return this.q;
    }
    GetRotationAngle() {
        return this.q.GetAngle();
    }
    GetAngle() {
        return this.q.GetAngle();
    }
    static MulXV(T, v, out) {
        // float32 x = (T.q.c * v.x - T.q.s * v.y) + T.p.x;
        // float32 y = (T.q.s * v.x + T.q.c * v.y) + T.p.y;
        // return b2Vec2(x, y);
        const T_q_c = T.q.c, T_q_s = T.q.s;
        const v_x = v.x, v_y = v.y;
        out.x = (T_q_c * v_x - T_q_s * v_y) + T.p.x;
        out.y = (T_q_s * v_x + T_q_c * v_y) + T.p.y;
        return out;
    }
    static MulTXV(T, v, out) {
        // float32 px = v.x - T.p.x;
        // float32 py = v.y - T.p.y;
        // float32 x = (T.q.c * px + T.q.s * py);
        // float32 y = (-T.q.s * px + T.q.c * py);
        // return b2Vec2(x, y);
        const T_q_c = T.q.c, T_q_s = T.q.s;
        const p_x = v.x - T.p.x;
        const p_y = v.y - T.p.y;
        out.x = (T_q_c * p_x + T_q_s * p_y);
        out.y = (-T_q_s * p_x + T_q_c * p_y);
        return out;
    }
    static MulXX(A, B, out) {
        b2Rot.MulRR(A.q, B.q, out.q);
        b2Vec2.AddVV(b2Rot.MulRV(A.q, B.p, out.p), A.p, out.p);
        return out;
    }
    static MulTXX(A, B, out) {
        b2Rot.MulTRR(A.q, B.q, out.q);
        b2Rot.MulTRV(A.q, b2Vec2.SubVV(B.p, A.p, out.p), out.p);
        return out;
    }
}
b2Transform.IDENTITY = new b2Transform();
/// This describes the motion of a body/shape for TOI computation.
/// Shapes are defined with respect to the body origin, which may
/// no coincide with the center of mass. However, to support dynamics
/// we must interpolate the center of mass position.
export class b2Sweep {
    constructor() {
        this.localCenter = new b2Vec2();
        this.c0 = new b2Vec2();
        this.c = new b2Vec2();
        this.a0 = 0;
        this.a = 0;
        this.alpha0 = 0;
    }
    Clone() {
        return new b2Sweep().Copy(this);
    }
    Copy(other) {
        this.localCenter.Copy(other.localCenter);
        this.c0.Copy(other.c0);
        this.c.Copy(other.c);
        this.a0 = other.a0;
        this.a = other.a;
        this.alpha0 = other.alpha0;
        return this;
    }
    GetTransform(xf, beta) {
        const one_minus_beta = (1 - beta);
        xf.p.x = one_minus_beta * this.c0.x + beta * this.c.x;
        xf.p.y = one_minus_beta * this.c0.y + beta * this.c.y;
        const angle = one_minus_beta * this.a0 + beta * this.a;
        xf.q.SetAngle(angle);
        xf.p.SelfSub(b2Rot.MulRV(xf.q, this.localCenter, b2Vec2.s_t0));
        return xf;
    }
    Advance(alpha) {
        // DEBUG: b2Assert(this.alpha0 < 1);
        const beta = (alpha - this.alpha0) / (1 - this.alpha0);
        const one_minus_beta = (1 - beta);
        this.c0.x = one_minus_beta * this.c0.x + beta * this.c.x;
        this.c0.y = one_minus_beta * this.c0.y + beta * this.c.y;
        this.a0 = one_minus_beta * this.a0 + beta * this.a;
        this.alpha0 = alpha;
    }
    Normalize() {
        const d = b2_two_pi * Math.floor(this.a0 / b2_two_pi);
        this.a0 -= d;
        this.a -= d;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYjJNYXRoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vQm94MkQvQ29tbW9uL2IyTWF0aC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7OztFQWdCRTtBQUVGLGtEQUFrRDtBQUNsRCxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsTUFBTSxjQUFjLENBQUM7QUFFOUQsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFXLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDbEQsTUFBTSxDQUFDLE1BQU0sY0FBYyxHQUFXLEdBQUcsR0FBRyxLQUFLLENBQUM7QUFDbEQsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFXLENBQUMsR0FBRyxLQUFLLENBQUM7QUFFM0MsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFFOUIsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDOUIsTUFBTSxDQUFDLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFFOUIsTUFBTSxVQUFVLE9BQU8sQ0FBQyxDQUFTLEVBQUUsRUFBVSxFQUFFLEVBQVU7SUFDdkQsT0FBTyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ25ELENBQUM7QUFFRCxNQUFNLFVBQVUsTUFBTSxDQUFJLENBQU0sRUFBRSxDQUFNO0lBQ3RDLDBCQUEwQjtJQUMxQixNQUFNLEdBQUcsR0FBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDcEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FB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Q0FBQztJQUV6RyxNQUFNLENBQUMsS0FBSyxDQUFlLENBQVMsRUFBRSxDQUFLLEVBQUUsR0FBTSxJQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3pHLE1BQU0sQ0FBQyxLQUFLLENBQWUsQ0FBSyxFQUFFLENBQVMsRUFBRSxHQUFNLElBQU8sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFekcsTUFBTSxDQUFDLFNBQVMsQ0FBZSxDQUFLLEVBQUUsQ0FBUyxFQUFFLENBQUssRUFBRSxHQUFNLElBQU8sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDcEksTUFBTSxDQUFDLFNBQVMsQ0FBZSxDQUFLLEVBQUUsQ0FBUyxFQUFFLENBQUssRUFBRSxHQUFNLElBQU8sR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFcEksTUFBTSxDQUFDLFdBQVcsQ0FBZSxDQUFLLEVBQUUsQ0FBUyxFQUFFLENBQUssRUFBRSxHQUFNO1FBQ3JFLE1BQU0sR0FBRyxHQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4QixHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDeEIsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRU0sTUFBTSxDQUFDLEtBQUssQ0FBZSxDQUFLLEVBQUUsQ0FBSyxFQUFFLEdBQU0sSUFBTyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztJQUV6SCxNQUFNLENBQUMsS0FBSyxDQUFlLENBQUssRUFBRSxDQUFLLEVBQUUsR0FBTSxJQUFPLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRXpILE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBSyxFQUFFLENBQUs7UUFDbkMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7SUFFTSxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUssRUFBRSxDQUFLO1FBQ25DLE1BQU0sR0FBRyxHQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixNQUFNLEdBQUcsR0FBVyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFTSxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBSyxFQUFFLENBQUs7UUFDMUMsTUFBTSxHQUFHLEdBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlCLE1BQU0sR0FBRyxHQUFXLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5QixPQUFPLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxJQUFJLENBQWUsQ0FBSyxFQUFFLEdBQU0sSUFBTyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDOztBQS9SdkUsV0FBSSxHQUFxQixJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDMUMsWUFBSyxHQUFxQixJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDM0MsWUFBSyxHQUFxQixJQUFJLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFFM0MsV0FBSSxHQUFXLElBQUksTUFB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LENBQUMsQ0FBQztRQUMzQixHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7UUFDM0IsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRU0sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFVLEVBQUUsQ0FBVSxFQUFFLEdBQVk7UUFDdEQsTUFBTSxNQUFNLEdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sTUFBTSxHQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN2RCxNQUFNLE1BQU0sR0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxNQUFNLEdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxNQUFNLEdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3ZELEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUM3QyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDN0MsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsTUFBTSxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQzdDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sR0FBRyxNQUFNLEdBQUcsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUM3QyxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFTSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQVUsRUFB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QUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDaEgsSUFBSSxHQUFHLEtBQUssQ0FBQyxFQUFFO1lBQ2IsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDZjtRQUNELEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUM5RyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDOUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQzlHLE9BQU8sR0FB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SSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdkQsTUFBTSxHQUFHLEdBQVcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFOUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFFdkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFDdkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7UUFFdkMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVNLE1BQU0sQ0FBQyxRQUFRLENBQWdCLENBQVUsRUFBRSxD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RSxHQUFHLEdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUM5QixHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQztRQUM5QixPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBSyxDQUFlLENBQVEsRUFBRSxDQUFLLEVBQUUsR0FBTTtRQUN2RCxNQUFNLEdBQUcsR0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLE1BQU0sR0FBRyxHQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxHQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDM0MsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDOUIsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDOUIsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRU0sTUFBTSxDQUFDLE1BQU0sQ0FBZSxDQUFRLEVBQUUsQ0FBSyxFQUFFLEdBQU07UUFDeEQsTUFBTSxHQUFHLEdBQVcsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMzQyxNQUFNLEdBQUcsR0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzNDLEdBQUcsQ0FBQyxDQUFDLEdBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDO1FBQy9CLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7UUFDL0IsT0FBTyxHQUFHLENBQUM7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