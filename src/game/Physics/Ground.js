﻿
import {
	b2_linearSlop,
	b2Vec2,
	b2BodyType, b2BodyDef, b2FixtureDef,
	b2PolygonShape, b2EdgeShape,
	b2Contact, b2Manifold, b2ContactImpulse, b2WorldManifold
} from "./Physics.js";

import { Vec2, Rectangle } from "../math.js";

import { World, GRAVITY } from "./World.js";
import { Foothold } from "./Foothold.js";

import { PPlayer } from "./PPlayer.js";

window.CREATE_SOLID_FOOTHOLD = false;
window.USE_GHOST_VERTEX = false;

export class Ground {
	constructor() {
		/** @type {b2Body[]} */
		this.bodies = null;

		/** @type {Foothold[]} */
		this.footholds = null;
		
		/** @type {Rectangle[]} */
		this.rectChains = null;

		this.init();
	}

	init() {
		this.footholds = [];
		this.bodies = [];
	}

	/**
	 * @param {object} data
	 * @param {World} world
	 */
	async load(map_raw_data, world) {
		if (!("foothold" in map_raw_data)) {
			return;
		}

		for (let layerIndex in map_raw_data.foothold) {
			let groups = map_raw_data.foothold[layerIndex];

			//foothold[5] maybe is Bounding-Box(loop line)

			for (let groupIndex in groups) {
				let segment = groups[groupIndex];
				for (let k in segment) {
					const index = k - 1;

					let fh = new Foothold(segment[k], index, layerIndex, groupIndex);

					this.footholds[index] = fh;
				}
			}
		}
		
		let chain = 0, rectChains = this.rectChains = [];
		for (let i = 0; i < this.footholds.length; ++i) {
			const foothold = this.footholds[i];
			let circular = 0;
			
			if (foothold.chain == null) {
				let left, top, right, bottom;
				
				left = foothold.x1;
				top = foothold.y1;
				right = foothold.x2;
				bottom = foothold.y2;
				
				foothold.chain = chain;
				
				for (let fh = foothold; fh != null; fh = this.footholds[fh.prev]) {
					fh.chain = chain;
					left = Math.min(left, fh.x1, fh.x2);
					top = Math.min(top, fh.y1, fh.y2);
					right = Math.max(right, fh.x1, fh.x2);
					bottom = Math.max(bottom, fh.y1, fh.y2);
					
					if (fh == foothold) {
						if (circular++ > 0) {
							break;
						}
					}
				}
				if (circular == 0) {
					for (let fh = foothold; fh != null; fh = this.footholds[fh.next]) {
						fh.chain = chain;
						left = Math.min(left, fh.x1, fh.x2);
						top = Math.min(top, fh.y1, fh.y2);
						right = Math.max(right, fh.x1, fh.x2);
						bottom = Math.max(bottom, fh.y1, fh.y2);
					}
				}
				rectChains[chain] = Rectangle.parse(left, top, right, bottom);
				
				chain++;
			}
		}

		{
			let bdef = new b2BodyDef();
			let fdef = new b2FixtureDef();
			let shape;

			fdef.filter.loadPreset("foothold");

			if (window.CREATE_SOLID_FOOTHOLD) {
				shape = new b2PolygonShape();
			}
			else {
				shape = new b2EdgeShape();
			}

			bdef.type = b2BodyType.b2_kinematicBody;//b2_staticBody//b2_kinematicBody//b2_dynamicBody
			bdef.linearDamping = 1;
			bdef.gravityScale = 0;
			bdef.userData = this;
			//bdef.bullet = true;

			fdef.shape = shape;
			fdef.density = 1;
			//fdef.filter = world.getFilterDefine("ground");
			fdef.friction = 1;
			fdef.restitution = 0;

			for (let i = 0; i < this.footholds.length; ++i) {
				const fh = this.footholds[i];
				//if (fh.is_wall) {
				//	this._create_wall(fh);
				//	continue;
				//}
				let x1, y1, x2, y2;
				
				x1 = fh.x1 / $gv.CANVAS_SCALE;
				y1 = fh.y1 / $gv.CANVAS_SCALE;
				x2 = fh.x2 / $gv.CANVAS_SCALE;
				y2 = fh.y2 / $gv.CANVAS_SCALE;

				const cx = (x2 + x1) * 0.5;
				const cy = (y2 + y1) * 0.5;
				bdef.position.Set(cx, cy);
				
				let hlen;
				const dx = x2 - x1;
				const dy = y2 - y1;
				if (dy == 0) {
					bdef.angle = dx < 0 ? Math.PI : 0;
					hlen = dx * 0.5;
				}
				else if (dx == 0) {
					bdef.angle = dy < 0 ? (-Math.PI * 0.5) : (Math.PI * 0.5);
					hlen = dy * 0.5;
				}
				else {
					bdef.angle = Math.atan2(dy, dx);
					hlen = (Math.sqrt(dy ** 2 + dx ** 2)) * 0.5;
				}

				let body = world.CreateBody(bdef);
				body.$type = "ground";

				if (window.CREATE_SOLID_FOOTHOLD) {
					const hheight = 1.5 / $gv.CANVAS_SCALE;
					shape.SetAsBox(hlen, hheight, new b2Vec2(0, 0.75 / $gv.CANVAS_SCALE), 0);
				}
				else {
					shape.m_vertex1.Set(-hlen, 0)
					shape.m_vertex2.Set(hlen, 0);

					if (window.USE_GHOST_VERTEX) {
						if (fh.prev != null) {
							const prev = this.footholds[fh.prev];
							shape.m_vertex0.Set(prev.x1 / $gv.CANVAS_SCALE, prev.y1 / $gv.CANVAS_SCALE);
							shape.m_hasVertex0 = true;
						}
						if (fh.next != null) {
							const next = this.footholds[fh.next];
							shape.m_vertex3.Set(next.x2 / $gv.CANVAS_SCALE, next.y2 / $gv.CANVAS_SCALE);
							shape.m_hasVertex3 = true;
						}
					}
				}

				fdef.userData = fh;

				let fixture = body.CreateFixture(fdef);

				fixture.beginContact = this.beginContact_bodyBase_oneway;
				fixture.endContact = this.endContact_bodyBase_oneway;
				fixture.preSolve = this.preSolveGround_bodyBase_oneway;//preSolveGround_t2

				fh.body = body;

				this.bodies.push(body);
			}
		}
	}

	/**
	 * @returns { left: number, right: number }
	 */
	_compute_left_right_border() {
		let left = null, right = null;
		for (let i = 0; i < this.footholds.length; ++i) {
			let fh = this.footholds[i];
			//if (fh.layer == 5) {
				let x1, x2;
				
				if (fh.x1 < fh.x2) {
					x1 = fh.x1;
					x2 = fh.x2;
				}
				else {
					x1 = fh.x2;
					x2 = fh.x1;
				}
				
				if (left == null || x1 < left) {
					left = x1;
				}
				if (right == null || x2 > right) {
					right = x2;
				}
				//if (left != null) {
				//	left = Math.min(left, fh.x1, fh.x2);
				//}
				//else {
				//	left = Math.min(fh.x1, fh.x2);
				//}
				//else {
				//	right = Math.max(fh.x1, fh.x2);
				//}
			//}
		}
		return { left, right };
	}
	
	preSolveGround_t2(contact, oldManifold, fa, fb) {
		const platformBody = fa.GetBody();//=>this.body
		const otherBody = fb.GetBody();

		/** @type {Foothold} */
		const fh = fa.GetUserData();

		/** @type {PPlayer} */
		const player = fb.GetUserData();
		if (!player) {
			return;
		}

		if (!player.state.jump) {
			player._foothold = fh;
		}
		else if (player._foothold != fh) {
			contact.SetEnabled(false);
			return;
		}

		let numPoints = contact.GetManifold().pointCount;
		let worldManifold = new b2WorldManifold();
		contact.GetWorldManifold(worldManifold);

		for (let i = 0; i < numPoints; ++i) {
			const pp = player.getPosition();
			const mp = worldManifold.points[i];
			const relpos = new b2Vec2(pp.x - mp.x, pp.y - mp.y);

			//fixed-rotation
			//let relpos = player.body.GetLocalPoint(worldManifold.points[i], new b2Vec2(0, 0));
			if (relpos.y < 0) {
				contact.SetEnabled(false);
				return;
			}
		}
	}
	
	beginContact_bodyBase_oneway(contact, fa, fb) {
		if (fb.$type == "pl_fcenter" || fb.$type == "player") {
			debugger;
		}
		let numPoints, worldManifold;
		const platformBody = fa.GetBody();//=>this.body
		const playerBody = fb.GetBody();

		/** @type {Foothold} */
		const fh = fa.GetUserData();
		if (fh.is_wall && fb.$type == "pl_ft_walk") {
			contact.SetFriction(0);
			return;
		}
		
		/** @type {PPlayer} */
		const player = fb.GetUserData();
		if (!player || !player.body || player.body.$type != "player") {
			return;
		}
		
		if (!contact.IsTouching()) {
			console.log("J: " + player.state.jump);
		}

		const $fh = player.$foothold;

		if (player.state.dropDown && player.leave_$fh != null) {
			//HACK: ?? foothold edge
			if (player.leave_$fh == player.$foothold && player.$foothold != fh) {
				contact.SetEnabled(false);
				return;
			}
			//if (playerBody.$type == "pl_ft_walk") {
				if (playerBody.$type == "pl_ft_walk" &&// player.leave_$fh &&
					player.leave_$fh.id != fh.id &&
					player.leave_$fh.chain != fh.chain &&
					(player.leave_$fh.prev == null || player.leave_$fh.prev != fh.id) &&
					(player.leave_$fh.next == null || player.leave_$fh.next != fh.id)
				) {
					numPoints = contact.GetManifold().pointCount;
					worldManifold = new b2WorldManifold();
					contact.GetWorldManifold(worldManifold);

					for (let i = 0; i < numPoints; ++i) {
						const foot = player.foot_walk.GetPosition();
						const cpoint = worldManifold.points[i];
						if (cpoint.y > foot.y) {
							player.leave_$fh = null;
							player.state.dropDown = false;
							//break;
						}
					}
				}
				else {
					contact.SetEnabled(false);
					return;
				}
			//}
			//else {
			//	contact.SetEnabled(false);
			//	return;
			//}
		}
		else {
			player.state.dropDown = false;
		}

		if (player.leave_$fh && player.leave_$fh == fh) {
			contact.SetEnabled(false);
			return;
		}

		if (numPoints == null) {
			numPoints = contact.GetManifold().pointCount;
			worldManifold = new b2WorldManifold();
			contact.GetWorldManifold(worldManifold);
		}

		//check if contact points are moving into platform
		for (let i = 0; i < numPoints; ++i) {
			const cpoint = worldManifold.points[i];
			const pointVelPlatform = platformBody.GetLinearVelocityFromWorldPoint(cpoint, new b2Vec2());
			const pointVelOther = playerBody.GetLinearVelocityFromWorldPoint(cpoint, new b2Vec2());
			const point = new b2Vec2(pointVelOther.x - pointVelPlatform.x, pointVelOther.y - pointVelPlatform.y);
			const relativeVel = platformBody.GetLocalVector(point, new b2Vec2());

			{
				let ppw = player.foot_walk.GetPosition();
				//if (ppw.y > cpoint.y) {//TODO: ??
				//	continue;
				//}
				let dist = b2Vec2.SubVV(ppw, cpoint, new b2Vec2()).Length();

				player._$footCFDist = dist;
				player._$footCFSub = Math.abs(dist - player.chara_profile.foot_width);

				if (player.$foothold && player.$foothold != fh) {
					if (player._$footCFSub > (b2_linearSlop * 2)) {
						player.leave_$fh = fh;
						continue;
					}
				}
			}

			if (relativeVel.y > 1) {//if moving down faster than 1 m/s, handle as before
				//player._foothold = fh;
				if (playerBody.$type == "pl_ft_walk") {
					if (player._which_foothold_contact(fh, cpoint)) {
						normal_contact(cpoint);
						return;
					}
					break;
				}
				normal_contact(cpoint);
				return;//nothing: not target, normal contact ground
			}
			else if (relativeVel.y > -1) { //if moving slower than 1 m/s
				//borderline case, moving only slightly out of platform
				const relativePoint = platformBody.GetLocalPoint(cpoint, new b2Vec2());
				const platformFaceY = b2_linearSlop;
				if (relativePoint.y <= platformFaceY) {
					if (playerBody.$type == "pl_ft_walk") {
						//player._foothold = fh;
						if (player._which_foothold_contact(fh, cpoint)) {
							if (player.$foothold && player.$foothold.id != fh.id) {
							}
							normal_contact(cpoint);
							return;//contact point is less than 5cm inside front face of platfrom
						}
						break;
					}
					normal_contact(cpoint);
					return;//nothing: not target, normal contact ground
				}
			}
		}

		//no points are moving into platform, contact should not be solid
		contact.SetEnabled(false);

		/** @param {b2Vec2} cpoint */
		function normal_contact(cpoint) {
			let ccc = $fh && (
				(fh == player._foothold && (fh.y1 < $fh.y1 || fh.y2 < $fh.y2)) ||
				(fh != player._foothold && (fh.y1 > $fh.y1 || fh.y2 > $fh.y2))
			);
			if (ccc && $fh != fh && (!player._$fallEdge || player._$fallEdge != $fh)) {
				if (fh.chain != $fh.chain &&
					(!$fh.prev || $fh.y1 != fh.y2) &&
					(!$fh.next || $fh.y2 != fh.y1)
				) {
					player.leave_$fh = fh;
					contact.SetEnabled(false);
					return;
				}
			}
			if (player._$fallEdge && player._$fallEdge == fh) {
				contact.SetEnabled(false);
				return;
			}
			{
				if ((fh.prev == null && player.state.front < 0 && (cpoint.x * $gv.CANVAS_SCALE) < fh.x1) ||
					(fh.next == null && player.state.front > 0 && (cpoint.x * $gv.CANVAS_SCALE) > fh.x2)) {
					player.state.jump = true;

					player._$fallEdge = fh;

					player._foothold = null;
					player._foot_at = null;
					//
					player.$foothold = null;

					contact.SetEnabled(false);
					return;
				}
			}
			{
				//player._$fallEdge = null;//HACK: ??

				if (fh._is_horizontal_floor && !player.state.dropDown) {//防止反彈
					playerBody.ApplyForceToCenter(GRAVITY);
				}
			}
		}
	}
	endContact_bodyBase_oneway(contact, fa, fb) {
		/** @type {PPlayer} */
		const player = fb.GetUserData();
		if (!player) {
			return;
		}

		/** @type {Foothold} */
		const fh = fa.GetUserData();
		
		if (fh == player._$fallEdge) {
			player._$fallEdge = null;
		}
		else if (fh == player._foothold) {
			player._foothold = null;
			player._foot_at = null;
		}
		//else if (fh.id == player._foothold.id) {
		//	player._foothold = null;
		//	player._foot_at = null;
		//}

		if (player.$foothold && fh == player.$foothold) {
			player.prev_$fh = player.$foothold;
			player.$foothold = null;
		}
		if (player.leave_$fh && player.leave_$fh == fh) {
			player.leave_$fh = null;
		}
	}
	preSolveGround_bodyBase_oneway(contact, oldManifold, fa, fb) {
		let that = fa.GetBody().GetUserData();
		that.beginContact_bodyBase_oneway(contact, fa, fb);
		
		//if (contact.IsEnabled() && contact.IsTouching()) {
		//}
	}

	/**
	 * @param {World} world
	 */
	unload(world) {
		for (let i = 0; i < this.bodies.length; ++i) {
			world.DestroyBody(this.bodies[i]);
		}
		this.init();
	}

	/**
	 * @param {object} data
	 */
	addFoothold(data) {
		this.footholds.push(new Foothold(data));
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	$drawDebugInfo(renderer) {
		if ($gv.m_display_foothold) {
			const ctx = renderer.ctx;

			ctx.lineJoin = "round";
			ctx.lineCap = "round";
			for (let i = 0; i < this.footholds.length; ++i) {
				let fh = this.footholds[i];
				if (fh == null) {//line end
					continue;
				}
				if (fh.$showDebugInfo) {
					fh.$drawDebugInfo(renderer);
				}
			}
		}
	}
	$showDebugInfo(layer, group, isShow, isHide) {
		if (isShow == null) {
			isShow = true;
		}
		if (isHide == null) {
			isHide = false;
		}
		for (let fh of this.footholds) {
			if (fh.layer == layer && fh.group == group) {
				fh.$showDebugInfo = isShow;
			}
			else {
				fh.$showDebugInfo = isHide;
			}
		}
	}
	$showDebugInfoByLayer(layer, isShow, isHide) {
		if (isShow == null) {
			isShow = true;
		}
		if (isHide == null) {
			isHide = false;
		}
		for (let fh of this.footholds) {
			if (fh.layer == layer) {
				fh.$showDebugInfo = isShow;
			}
			else {
				fh.$showDebugInfo = isHide;
			}
		}
	}
	//static $showDebugInfoByGroup() {
	//}
	$hideAllDebugInfo() {
		for (let fh of this.footholds) {
			fh.$showDebugInfo = false;
		}
	}
}

Ground.Foothold = Foothold;

