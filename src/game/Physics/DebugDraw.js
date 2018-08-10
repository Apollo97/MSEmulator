/*
* Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
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

import {
	b2_pi,
	b2Vec2, b2Rot, b2DegToRad, b2Transform, b2AABB,
	b2Color, b2Draw, b2DrawFlags,
	b2Body, b2Fixture,
	b2Joint,
} from "./Physics.js";
import { Rectangle } from "../math.js";


function setFlags(flags, bit, flag) {
	return flag ? (flags | bit):(flags & ~bit);
}

class DebugDraw extends b2Draw {
	/**
	 * This class implements debug drawing callbacks that are
	 * invoked inside b2World::Step.
	 * @export
	 * @constructor
	 * @extends {b2Draw}
	 * @param {CanvasRenderingContext2D} ctx
	 */
	constructor(ctx) {
		super(...arguments);

		/**
		 * @type {CanvasRenderingContext2D}
		 */
		this.m_ctx = ctx;

		/**
		 * @type {number}
		 */
		this.axis_length = 1;

		/**
		 * @type {b2Rot}
		 */
		this.viewRotation = new b2Rot(b2DegToRad(0));
		/**
		 * @type {number}
		 */
		this.viewZoom = 1;
		
		this.flag_drawShape = true;
		this.flag_drawJoint = true;
		this.flag_drawAabb = false;
		this.flag_drawCenterOfMass = true;
		this.flag_drawController = true;
		this.flag_drawParticle = true;
	}

	/**
	 * @type {number}
	 */
	get canvasScale() {
		return $gv.CANVAS_SCALE;
	}
	set canvasScale(value) {
		$gv.CANVAS_SCALE = value;
	}

	/**
	 * @type {Rectangle}
	 */
	get viewRect() {
		return $gv.m_viewRect;
	}

	set flag_drawAll(flag) { this.m_drawFlags = flag ? b2DrawFlags.e_all : b2DrawFlags.e_none;  }
	set flag_drawShape(flag) { this.m_drawFlags = setFlags(this.m_drawFlags, b2DrawFlags.e_shapeBit, flag); }
	set flag_drawJoint(flag) { this.m_drawFlags = setFlags(this.m_drawFlags, b2DrawFlags.e_jointBit, flag); }
	set flag_drawAabb(flag) { this.m_drawFlags = setFlags(this.m_drawFlags, b2DrawFlags.e_aabbBit, flag); }
	set flag_drawPair(flag) { this.m_drawFlags = setFlags(this.m_drawFlags, b2DrawFlags.e_pairBit, flag); }
	set flag_drawCenterOfMass(flag) { this.m_drawFlags = setFlags(this.m_drawFlags, b2DrawFlags.e_centerOfMassBit, flag); }
	set flag_drawParticle(flag) { this.m_drawFlags = setFlags(this.m_drawFlags, b2DrawFlags.e_particleBit, flag); }
	set flag_drawController(flag) { this.m_drawFlags = setFlags(this.m_drawFlags, b2DrawFlags.e_controllerBit, flag); }
	
	get flag_drawAll() { this.m_drawFlags; }
	get flag_drawShape() { return this.m_drawFlags & b2DrawFlags.e_shapeBit; }
	get flag_drawJoint() { return this.m_drawFlags & b2DrawFlags.e_jointBit; }
	get flag_drawAabb() { return this.m_drawFlags & b2DrawFlags.e_aabbBit; }
	get flag_drawPair() { return this.m_drawFlags & b2DrawFlags.e_pairBit; }
	get flag_drawCenterOfMass() { return this.m_drawFlags & b2DrawFlags.e_centerOfMassBit; }
	get flag_drawParticle() { return this.m_drawFlags & b2DrawFlags.e_particleBit; }
	get flag_drawController() { return this.m_drawFlags & b2DrawFlags.e_controllerBit; }

	get flagNames() {
		return [
			"flag_drawAll",
			"flag_drawShape",
			"flag_drawJoint",
			"flag_drawAabb",
			"flag_drawPair",
			"flag_drawCenterOfMass",
			"flag_drawParticle",
			"flag_drawController",
		];
	}
}


/**
 * @export
 * @return {void}
 * @param {b2Transform} xf
 */
DebugDraw.prototype.PushTransform = function (xf)
{
	let ctx = this.m_ctx;
	ctx.save();
	//ctx.translate(xf.p.x, xf.p.y);
	//ctx.rotate(xf.q.GetAngle());
	ctx.transform(xf.q.c, xf.q.s, -xf.q.s, xf.q.c, xf.p.x, xf.p.y);
}

/**
 * @export
 * @return {void}
 * @param {b2Transform} xf
 */
DebugDraw.prototype.PopTransform = function (xf)
{
	let ctx = this.m_ctx;
	ctx.restore();
}

/**
 * @export
 * @return {void}
 * @param {b2Vec2[]} vertices
 * @param {number} vertexCount
 * @param {b2Color} color
 */
DebugDraw.prototype.DrawPolygon = function (vertices, vertexCount, color)
{
	if (!vertexCount) return;

	let ctx = this.m_ctx;

	ctx.beginPath();
	ctx.moveTo(vertices[0].x, vertices[0].y);
	for (let i = 1; i < vertexCount; i++)
	{
		ctx.lineTo(vertices[i].x, vertices[i].y);
	}
	ctx.closePath();
	ctx.strokeStyle = color.MakeStyleString(1);
	ctx.stroke();
};

/**
 * @export
 * @return {void}
 * @param {b2Vec2} vertices
 * @param {number} vertexCount
 * @param {b2Color} color
 */
DebugDraw.prototype.DrawSolidPolygon = function (vertices, vertexCount, color)
{
	if (!vertexCount) return;

	let ctx = this.m_ctx;

	ctx.beginPath();
	ctx.moveTo(vertices[0].x, vertices[0].y);
	for (let i = 1; i < vertexCount; i++)
	{
		ctx.lineTo(vertices[i].x, vertices[i].y);
	}
	ctx.closePath();
	ctx.fillStyle = color.MakeStyleString(0.5);
	ctx.fill();
	ctx.strokeStyle = color.MakeStyleString(1);
	ctx.stroke();
};

/**
 * @export
 * @return {void}
 * @param {b2Vec2} center
 * @param {number} radius
 * @param {b2Color} color
 */
DebugDraw.prototype.DrawCircle = function (center, radius, color)
{
	if (!radius) return;

	let ctx = this.m_ctx;

	ctx.beginPath();
	ctx.arc(center.x, center.y, radius, 0, b2_pi * 2, true);
	ctx.strokeStyle = color.MakeStyleString(1);
	ctx.stroke();
};

/**
 * @export
 * @return {void}
 * @param {b2Vec2} center
 * @param {number} radius
 * @param {b2Vec2} axis
 * @param {b2Color} color
 */
DebugDraw.prototype.DrawSolidCircle = function (center, radius, axis, color)
{
	if (!radius) return;

	let ctx = this.m_ctx;

	let cx = center.x;
	let cy = center.y;
	ctx.beginPath();
	ctx.arc(cx, cy, radius, 0, b2_pi * 2, true);
	ctx.moveTo(cx, cy);
	ctx.lineTo((cx + axis.x * radius), (cy + axis.y * radius));
	ctx.fillStyle = color.MakeStyleString(0.5);
	ctx.fill();
	ctx.strokeStyle = color.MakeStyleString(1);
	ctx.stroke();
};

/**
 * @export
 * @return {void}
 * @param {b2Vec2} centers
 * @param {number} radius
 * @param {b2Color} colors
 * @param {number} count
 */
DebugDraw.prototype.DrawParticles = function (centers, radius, colors, count) {
	const ctx = this.m_ctx;
	if (ctx) {
		if (colors !== null) {
			for (let i = 0; i < count; ++i) {
				let center = centers[i];
				/** @type {b2Color} */let color = colors[i];
				ctx.fillStyle = color.MakeStyleString(0.5);
				ctx.fillRect(center.x - radius, center.y - radius, 2 * radius, 2 * radius);
				///ctx.beginPath(); ctx.arc(center.x, center.y, radius, 0, box2d.b2_pi * 2, true); ctx.fill();
			}
		}
		else {
			ctx.fillStyle = "rgba(255,255,255,0.5)";
			ctx.beginPath();
			for (let i = 0; i < count; ++i) {
				let center = centers[i];
				ctx.rect(center.x - radius, center.y - radius, 2 * radius, 2 * radius);
				///ctx.beginPath(); ctx.arc(center.x, center.y, radius, 0, box2d.b2_pi * 2, true); ctx.fill();
			}
			ctx.fill();
		}
	}
}

/**
 * @export
 * @return {void}
 * @param {b2Vec2} p1
 * @param {b2Vec2} p2
 * @param {b2Color} color
 */
DebugDraw.prototype.DrawSegment = function (p1, p2, color)
{
	let ctx = this.m_ctx;

	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.strokeStyle = color.MakeStyleString(1);
	ctx.stroke();
};

/**
 * @export
 * @return {void}
 * @param {b2Transform} xf
 */
DebugDraw.prototype.DrawTransform = function (xf)
{
	if (this.axis_length == 0) {
		return;
	}
	// viewport -> canvas
	let cs = this.canvasScale;
	if (!this.viewRect.collide4f2(xf.p.x * cs, xf.p.y * cs, this.axis_length * cs, this.axis_length * cs)) {
		return;
	}

	let ctx = this.m_ctx;

	this.PushTransform(xf);

	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(this.axis_length, 0);
	ctx.strokeStyle = b2Color.RED.MakeStyleString(1);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(0, this.axis_length);
	ctx.strokeStyle = b2Color.GREEN.MakeStyleString(1);
	ctx.stroke();

	this.PopTransform(xf);
};

/**
 * @export
 * @return {void}
 * @param {b2Vec2} p
 * @param {number} size
 * @param {b2Color} color
 */
DebugDraw.prototype.DrawPoint = function (p, size, color)
{
	let ctx = this.m_ctx;

	ctx.fillStyle = color.MakeStyleString();
	size /= this.viewZoom;
	size /= this.canvasScale;
	let hsize = size / 2;
	ctx.fillRect(p.x - hsize, p.y - hsize, size, size);
}

/**
 * @export
 * @param {number} x
 * @param {number} y
 * @param {string} format
 * @param {...string|number} var_args
 */
DebugDraw.prototype.DrawString = function (x, y, format, var_args)
{
	let ctx = this.m_ctx;
	const font = ctx.font;

	let args = Array.prototype.slice.call(arguments);
	let string = goog.string.format.apply(null, args.slice(2));

	ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.font = '18pt helvetica';//'9pt lucida console';
		let color = DebugDraw.prototype.DrawString.s_color;
		ctx.fillStyle = color.MakeStyleString();
		ctx.fillText(string, x, y);
	ctx.restore();

	ctx.font = font;
}
DebugDraw.prototype.DrawString.s_color = new b2Color(0.9, 0.6, 0.6);

/**
 * @export
 * @param {number} x
 * @param {number} y
 * @param {string} format
 * @param {...string|number} var_args
 */
DebugDraw.prototype.DrawStringWorld = function (x, y, format, var_args)
{
	let p = DebugDraw.prototype.DrawStringWorld.s_p.Set(x, y);

	// world -> viewport
	let vt = this.viewCenter;
	b2Vec2.SubVV(p, vt, p);
	let vr = this.viewRotation;
	b2Rot.MulTRV(vr, p, p);
	let vs = this.viewZoom;
	b2Vec2.MulSV(vs, p, p);

	// viewport -> canvas
	let cs = this.canvasScale;
	b2Vec2.MulSV(cs, p, p);
	p.y *= -1;
	let cc = DebugDraw.prototype.DrawStringWorld.s_cc.Set(0.5 * this.m_canvas.width, 0.5 * this.m_canvas.height);
	b2Vec2.AddVV(p, cc, p);

	let ctx = this.m_ctx;
	const font = ctx.font;

	let args = Array.prototype.slice.call(arguments);
	let string = goog.string.format.apply(null, args.slice(2));

	ctx.save();
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.font = '18pt helvetica';//'9pt lucida console';
		let color = DebugDraw.prototype.DrawStringWorld.s_color;
		ctx.fillStyle = color.MakeStyleString();
		ctx.fillText(string, p.x, p.y);
	ctx.restore();

	ctx.font = font;
}
DebugDraw.prototype.DrawStringWorld.s_p = new b2Vec2();
DebugDraw.prototype.DrawStringWorld.s_cc = new b2Vec2();
DebugDraw.prototype.DrawStringWorld.s_color = new b2Color(0.5, 0.9, 0.5);

/**
 * @export
 * @return {void}
 * @param {b2AABB} aabb
 * @param {b2Color} color
 */
DebugDraw.prototype.DrawAABB = function (aabb, color)
{
	let ctx = this.m_ctx;

	ctx.strokeStyle = color.MakeStyleString();
	let x = aabb.lowerBound.x;
	let y = aabb.lowerBound.y;
	let w = aabb.upperBound.x - aabb.lowerBound.x;
	let h = aabb.upperBound.y - aabb.lowerBound.y;
	ctx.strokeRect(x, y, w, h);
}

export default DebugDraw;
