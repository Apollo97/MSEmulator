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

/**
 * Test settings. Some can be controlled in the GUI.
 * @export
 * @constructor
 */
function Settings() {
	this.viewCenter = new b2Vec2(0, 20);
	this.viewRotation = new b2Rot(b2DegToRad(0));
}

/**
 * @export
 * @type {number}
 */
Settings.prototype.canvasScale = 32;
delete Settings.prototype.canvasScale;
Object.defineProperty(Settings.prototype, "canvasScale", {
	get: function () {
		return $gv.CANVAS_SCALE;
	},
	set: function (value) {
		$gv.CANVAS_SCALE = value;
	}
});
/**
 * @export
 * @type {number}
 */
Settings.prototype.viewZoom = 1;
/**
 * @export
 * @type {b2Vec2}
 */
Settings.prototype.viewCenter = null;
/**
 * @export
 * @type {b2Rot}
 */
Settings.prototype.viewRotation = null;
/**
 * @export
 * @type {boolean}
 */
Settings.prototype.drawShapes = true;
/**
 * @export
 * @type {boolean}
 */
Settings.prototype.drawJoints = true;
/**
 * @export
 * @type {boolean}
 */
Settings.prototype.drawAABBs = false;
/**
 * @export
 * @type {boolean}
 */
Settings.prototype.drawCOMs = true;
/**
 * @export
 * @type {boolean}
 */
Settings.prototype.drawControllers = true;


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

		this.m_ctx = ctx;

		let settings = this.m_settings = new Settings();

		let flags = b2DrawFlags.e_none;
		if (settings.drawShapes) { flags |= b2DrawFlags.e_shapeBit; }
		if (settings.drawJoints) { flags |= b2DrawFlags.e_jointBit; }
		if (settings.drawAABBs) { flags |= b2DrawFlags.e_aabbBit; }
		if (settings.drawCOMs) { flags |= b2DrawFlags.e_centerOfMassBit; }
		if (settings.drawControllers) { flags |= b2DrawFlags.e_controllerBit; }
		this.SetFlags(flags);
	}
}

/**
 * @export
 * @type {CanvasRenderingContext2D}
 */
DebugDraw.prototype.m_ctx = null;
/**
 * @export
 * @type {Testbed.Settings}
 */
DebugDraw.prototype.m_settings = null;


/**
 * @export
 * @return {void}
 * @param {b2Transform} xf
 */
DebugDraw.prototype.PushTransform = function (xf)
{
	let ctx = this.m_ctx;
	ctx.save();
	ctx.translate(xf.p.x, xf.p.y);
	ctx.rotate(xf.q.GetAngle());
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
	let ctx = this.m_ctx;

	this.PushTransform(xf);

	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(1, 0);
	ctx.strokeStyle = b2Color.RED.MakeStyleString(1);
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(0, 1);
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
	size /= this.m_settings.viewZoom;
	size /= this.m_settings.canvasScale;
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
	let vt = this.m_settings.viewCenter;
	b2Vec2.SubVV(p, vt, p);
	let vr = this.m_settings.viewRotation;
	b2Rot.MulTRV(vr, p, p);
	let vs = this.m_settings.viewZoom;
	b2Vec2.MulSV(vs, p, p);

	// viewport -> canvas
	let cs = this.m_settings.canvasScale;
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
