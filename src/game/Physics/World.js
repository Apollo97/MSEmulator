
import box2d from "box2d-html5";
import DebugDraw from "./DebugDraw.js";

import { ContactListener } from "./Physics.js";

import { Ground } from "./Ground.js";
import { PPlayer, PRemoteCharacter } from "./PPlayer.js";
import { PMob } from "./PMob.js";

import { CharacterAnimationBase } from "../Renderer/CharacterRenderer";


window.$box2d = box2d;

window.$gravityAcc = 2000;

window.$positionIterations = 3;//00;
window.$velocityIterations = 8;//00;

export const GRAVITY = new box2d.b2Vec2(0, window.$gravityAcc / $gv.CANVAS_SCALE);


export class World extends box2d.b2World {
	constructor() {
		super(GRAVITY);

		this.m_debugDraw = new DebugDraw(/*renderer_ctx2d*/);
		this.SetDebugDraw(this.m_debugDraw);

		this.SetContactListener(new ContactListener());

		if (!window.io) {
			this.player = null;
			this._player_rebirth();
			this.player.setPosition(0, 0, true);
		}

		this.ground = new Ground();
		
		/** @type {box2d.b2Body} */
		this.mapBound_body = null;
		
		this.stop = false;
		
		this.$_mouseJoint = null;
	}

	/**
	 * after load map
	 */
	async load(map_raw_data) {
		await this.ground.load(map_raw_data, this);
	}
	unload() {
		if (this.IsLocked()) {
			console.error("world is locked, world can not unload");
			debugger;
			return;
			//not do this there: this.doAfterStep(this.unload.bind(this));
		}
		this.ground.unload(this);
		this.DestroyBody(this.mapBound_body);
	}
	
	/**
	 * @param {MapMob} mapMob
	 */
	createMob(mapMob) {
		let mob = new PMob(mapMob);
		mob._create(this);
		return mob;
	}
	destroyMob(mapMob) {
		//if (this != mapMob.$physics) {
		//	debugger;
		//	return false;
		//}
		
		mapMob.$physics._destroy(this);
		mapMob.$physics = null;
		
		return true;
	}
	
	createNpc(mapNpc) {
		return null;
	}
	destroyNpc(mapNpc) {
		return false;
	}
	
	createPortal(portal) {
		let bdef = new box2d.b2BodyDef();
		let fdef = new box2d.b2FixtureDef();
		let shape;

		bdef.userData = portal;
		bdef.type = box2d.b2BodyType.b2_staticBody;//b2_staticBody//b2_kinematicBody//box2d.b2_dynamicBody
		bdef.position.Set(
			portal.x / $gv.CANVAS_SCALE,
			portal.y / $gv.CANVAS_SCALE);

		let body = this.CreateBody(bdef);
		body.$type = "portal";
		
		const rect = portal.compute_rectangle(0);
		const width = rect.width / 2 / $gv.CANVAS_SCALE * 0.4;
		const height = rect.height / 2 / $gv.CANVAS_SCALE * 0.2;
		
		shape = new box2d.b2PolygonShape();
		
		if (window.MAP_PORTAL_FULL_SIZE) {
			shape.SetAsOrientedBox(
				rect.width / 2 / $gv.CANVAS_SCALE,
				rect.height / 2 / $gv.CANVAS_SCALE,
				new box2d.b2Vec2(-portal.textures[0].x / $gv.CANVAS_SCALE, -portal.textures[0].y / $gv.CANVAS_SCALE),
				0);
		}
		else {
			shape.SetAsOrientedBox(width, height,
				new box2d.b2Vec2(0, -height),
				0);
		}
		
		fdef.isSensor = true;
		fdef.shape = shape;
		fdef.userData = portal;
		fdef.$type = "portal";

		let fixture = body.CreateFixture(fdef);
		
		portal.body = body;
		
		return body;
	}
	
	/**
	 * @param {Rectangle} rect
	 */
	_createMapBound(rect) {
		let { left, top, right, bottom } = rect;
		
		left /= $gv.CANVAS_SCALE;
		right /= $gv.CANVAS_SCALE;
		top /= $gv.CANVAS_SCALE;
		bottom /= $gv.CANVAS_SCALE;
		
		let bdef = new box2d.b2BodyDef();
		//bdef.type = box2d.b2BodyType.b2_dynamicBody;
		let bb = this.CreateBody(bdef);
		let shape = new box2d.b2EdgeShape();
		
		shape.SetAsEdge(new box2d.b2Vec2(left, top), new box2d.b2Vec2(right, top));
		bb.CreateFixture2(shape, 1.0);
		
		shape.SetAsEdge(new box2d.b2Vec2(left, bottom), new box2d.b2Vec2(right, bottom));
		bb.CreateFixture2(shape, 1.0);
		
		shape.SetAsEdge(new box2d.b2Vec2(left, top), new box2d.b2Vec2(left, bottom));
		bb.CreateFixture2(shape, 1.0);
		
		shape.SetAsEdge(new box2d.b2Vec2(right, top), new box2d.b2Vec2(right, bottom));
		bb.CreateFixture2(shape, 1.0);

		if (this.player) {
			this.player.setPosition((right + left) * 0.5, (bottom + top) * 0.5, true);
		}

		this.mapBound_body = bb;
	}

	_player_rebirth() {
		window.$player = this.player = new PPlayer(window.chara ? window.chara.renderer:null);
		this.player._create(this);
		
		delete this.player.renderer;
		Object.defineProperty(this.player, "renderer", {
			get: function () {
				return window.chara ? window.chara.renderer : null;
			}
		});
	}

	/**
	 * @param {CharacterAnimationBase} renderer
	 */
	$createPlayer(renderer) {
		let player = new PPlayer();

		player._create(this);

		//init ?
		player.renderer = renderer;

		return player;
	}
	/**
	 * @param {CharacterAnimationBase} renderer
	 */
	$createRemotePlayer(renderer) {
		let player = new PRemoteCharacter();

		player._create(this);

		//init ?
		player.renderer = renderer;

		return player;
	}
	
	doAfterStep(func) {
		setTimeout(func);
	}
	
	/**
	 * @param {box2d.b2Vec2} p
	 */
	$_mouseDown(p) {
		if (this.$_mouseJoint != null) {
			return;
		}

		// Make a small box.
		let aabb = new box2d.b2AABB();
		let d = new box2d.b2Vec2();
		d.Set(0.001, 0.001);
		box2d.b2SubVV(p, d, aabb.lowerBound);
		box2d.b2AddVV(p, d, aabb.upperBound);

		let that = this;
		let hit_fixture = null;

		// Query the world for overlapping shapes.
		this.QueryAABB(function (fixture) {
			let body = fixture.GetBody();
			//if (body.GetType() == box2d.b2BodyType.b2_dynamicBody) {
				let inside = fixture.TestPoint(p);
				if (inside) {
					hit_fixture = fixture;

					// We are done, terminate the query.
					return false;
				}
			//}

			// Continue the query.
			return true;
		}, aabb);

		if (hit_fixture) {
			let body = hit_fixture.GetBody();
			let md = new box2d.b2MouseJointDef();
			md.bodyA = this.ground.bodies[0];
			md.bodyB = body;
			md.target.Copy(p);
			md.maxForce = 1000 * body.GetMass();
			this.$_mouseJoint = this.CreateJoint(md);
			body.SetAwake(true);
		}
	}
	
	/**
	 * @param {box2d.b2Vec2} p
	 */
	$_mouseUp(p) {
		if (this.$_mouseJoint) {
			this.DestroyJoint(this.$_mouseJoint);
			this.$_mouseJoint = null;
		}
	}
	
	/**
	 * @param {box2d.b2Vec2} p
	 */
	$_mouseMove(p) {
		if (this.$_mouseJoint) {
			this.$_mouseJoint.SetTarget(p);
		}
	}
	
	$_onMouseEvent() {
		const x = ($gv.m_viewRect.left + $gv.mouse_x) / $gv.CANVAS_SCALE;
		const y = ($gv.m_viewRect.top + $gv.mouse_y) / $gv.CANVAS_SCALE;
		const p = new box2d.b2Vec2(x, y);
		
		if ($gv.mouse_dl) {
			this.$_mouseDown(p);
		}
		if ($gv.mouse_ul) {
			$gv.mouse_ul = 0;
			this.$_mouseUp(p);
		}
		if ($gv.mouse_move) {
			$gv.mouse_move = 0;
			this.$_mouseMove(p);
		}
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this.stop) {
			return;
		}
		
		this.$_onMouseEvent();
		
		for (let body = this.GetBodyList(); body; body = body.m_next) {
			body.Step();
		}

		super.Step(1 / $gv.MAX_FPS, window.$velocityIterations, window.$positionIterations);
		for (let body = this.GetBodyList(); body; body = body.m_next) {
			body.PostStep();
		}
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		/** @type {CanvasRenderingContext2D} */
		const ctx = renderer.ctx;

		if ($gv.m_display_physics_debug) {
			const settings = this.m_debugDraw.m_settings;
			this.m_debugDraw.m_ctx = ctx;

			const w = ctx.canvas.width;
			const h = ctx.canvas.height;

			ctx.save();
			
			ctx.scale(settings.canvasScale, settings.canvasScale);
			ctx.lineWidth /= settings.canvasScale;

			// apply camera
			ctx.scale(settings.viewZoom, settings.viewZoom);
			ctx.lineWidth /= settings.viewZoom;

			this.DrawDebugData();

			if (this.player && this.player.body) {
				const pos = this.player.getPosition();
				ctx.fillStyle = "red";
				ctx.fillRect(pos.x, pos.y, 1, 1);
			}

			ctx.restore();
		}
		
		if ($gv.m_display_foothold) {
			ctx.save();
			this.ground.$drawDebugInfo(renderer);
			if (this.player && this.player._foothold) {
				this.player._foothold.$drawDebugInfo2(renderer, "#FF0");
			}
			if (this.player && this.player.$foothold) {
				this.player.$foothold.$drawDebugInfo2(renderer, "#F00");
			}
			ctx.restore();
		}
	}
}

