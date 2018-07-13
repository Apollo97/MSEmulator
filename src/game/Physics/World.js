
import {
	b2Vec2, b2AABB,
	b2World,
	b2Body,
	b2BodyType, b2BodyDef, b2FixtureDef,
	b2EdgeShape, b2PolygonShape, b2CircleShape,
	b2MouseJointDef,
	b2ContactListener,
	b2ParticleSystemDef, b2ParticleSystem, b2ParticleFlag, b2ParticleGroupDef
} from "./Physics.js";

import DebugDraw from "./DebugDraw";

import { Ground } from "./Ground.js";
import { LadderRope, MapLadderRopeLoader } from "./LadderRope.js";
import { PPlayer, PRemoteCharacter } from "./PPlayer.js";
import { PMob } from "./PMob.js";

import { CharacterAnimationBase } from "../Renderer/CharacterRenderer";

import { IRenderer } from "../IRenderer.js";
import { FilterHelper } from "./Filter.js";


window.$gravityAcc = 2000;

window.$positionIterations = 3;
window.$velocityIterations = 8;
window.$particleIterations = 1;

window.$particleRadius = 10;//unit is pixel

export const GRAVITY = new b2Vec2(0, window.$gravityAcc / $gv.CANVAS_SCALE);


class ContactListener extends b2ContactListener {
	/** @param {b2Contact} contact */
	BeginContact(contact) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa.beginContact.call(fa.m_userData, contact, fa, fb);
		fb.beginContact.call(fb.m_userData, contact, fb, fa);
	}
	/** @param {b2Contact} contact */
	EndContact(contact) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa.endContact.call(fa.m_userData, contact, fa, fb);
		fb.endContact.call(fb.m_userData, contact, fb, fa);
	}
	/**
	 * @param {b2Contact} contact
	 * @param {b2Manifold} oldManifold
	 */
	PreSolve(contact, oldManifold) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa.preSolve.call(fa.m_userData, contact, oldManifold, fa, fb);
		fb.preSolve.call(fb.m_userData, contact, oldManifold, fb, fa);
	}
	/**
	 * @param {b2Contact} contact
	 * @param {b2ContactImpulse} impulse
	 */
	PostSolve(contact, impulse) {
		let fa = contact.GetFixtureA();
		let fb = contact.GetFixtureB();
		fa.postSolve.call(fa.m_userData, contact, impulse, fa, fb);
		fb.postSolve.call(fb.m_userData, contact, impulse, fb, fa);
	}
}

export class World extends b2World {
	constructor() {
		super(GRAVITY);

		this.m_debugDraw = new DebugDraw(/*renderer_ctx2d*/);
		this.SetDebugDraw(this.m_debugDraw);

		this.SetContactListener(new ContactListener());

		//if (!window.io) {
		//	this.player = null;
		//	this._player_rebirth();
		//	this.player.setPosition(0, 0, true);
		//}

		this.ground = new Ground();

		/** @type {LadderRope[]} */
		this.ladderRope = [];
		
		/** @type {b2Body} */
		this.mapBound_body = null;
		
		this.stop = false;
		
		this.$_mouseJoint = null;

		/** @type {(function():void)[]} */
		this._onceAfterStep = [];

		/** @type {b2Body[]} */
		this._destryBodyList = [];

		this._DestroyBody = this.DestroyBody;

		/**
		 * @param {b2Body} b
		 */
		this.DestroyBody = b => {
			if (this.m_locked) {
				this._destryBodyList.push(b);
			}
			else {
				this._DestroyBody(b);
			}
		}

		this.draw_foothold_path_count = 1;
	}

	$test_b2ParticleSystem() {
		const particleType = b2ParticleFlag.b2_elasticParticle;//b2_waterParticle;
		const particleSystemDef = new b2ParticleSystemDef();
		
		/** @type {b2ParticleSystem} */
		this.m_particleSystem = this.CreateParticleSystem(particleSystemDef);
		
		this.m_particleSystem.SetGravityScale(0);
		this.m_particleSystem.SetRadius(10 / $gv.CANVAS_SCALE);
		this.m_particleSystem.SetDamping(0.2);
		{
			const shape = new b2CircleShape();
			shape.m_p.Set(0, 2);
			shape.m_radius = 3;
			const pd = new b2ParticleGroupDef();
			pd.flags = particleType;
			pd.shape = shape;
			const group = this.m_particleSystem.CreateParticleGroup(pd);
			if (pd.flags & b2ParticleFlag.b2_colorMixingParticle) {
				this.ColorParticleGroup(group, 0);
			}
		}
		window.m_particleSystem = this.m_particleSystem;
		
		this.$vbo_ps = null;
	}

	/**
	 * after load map
	 */
	async load(map_raw_data) {
		this.ground.load(map_raw_data, this);
		this.ladderRope = MapLadderRopeLoader.load(map_raw_data, this);
	}
	unload() {
		if (this.IsLocked()) {
			debugger;
			console.error("world is locked, world can not unload");
		}
		else {
			this.ground.unload(this);
			this.ladderRope.length = 0;
			this.DestroyBody(this.mapBound_body);
		}
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
		let bdef = new b2BodyDef();
		let fdef = new b2FixtureDef();
		let shape;

		fdef.filter.Copy(FilterHelper.get("foothold", "portal"));

		bdef.userData = portal;
		bdef.type = b2BodyType.b2_staticBody;//b2_staticBody//b2_kinematicBody//b2_dynamicBody
		bdef.position.Set(
			portal.x / $gv.CANVAS_SCALE,
			portal.y / $gv.CANVAS_SCALE);

		let body = this.CreateBody(bdef);
		body.$type = "portal";
		
		const rect = portal.compute_rectangle(0);
		const width = rect.width / 2 / $gv.CANVAS_SCALE * 0.4;
		const height = rect.height / 2 / $gv.CANVAS_SCALE * 0.2;
		
		shape = new b2PolygonShape();
		
		if (window.MAP_PORTAL_FULL_SIZE) {
			shape.SetAsBox(
				rect.width / 2 / $gv.CANVAS_SCALE,
				rect.height / 2 / $gv.CANVAS_SCALE,
				new b2Vec2(-portal.textures[0].x / $gv.CANVAS_SCALE, -portal.textures[0].y / $gv.CANVAS_SCALE),
				0);
		}
		else {
			shape.SetAsBox(
				width,
				height,
				new b2Vec2(0, -height),
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
		
		let bdef = new b2BodyDef();
		//bdef.type = b2BodyType.b2_dynamicBody;
		let fdef = new b2FixtureDef();
		let shape = new b2EdgeShape();

		fdef.$type = "MapBorder";
		fdef.shape = shape;
		fdef.filter.Copy(FilterHelper.get("default", "map_border"));

		let bb = this.CreateBody(bdef);
		bb.$type = "MapBorder";
		
		shape.m_vertex1.Set(left, top);
		shape.m_vertex2.Set(right, top);
		bb.CreateFixture(fdef);
		
		shape.m_vertex1.Set(left, bottom);
		shape.m_vertex2.Set(right, bottom);
		bb.CreateFixture(fdef);
		
		shape.m_vertex1.Set(left, top);
		shape.m_vertex2.Set(left, bottom);
		bb.CreateFixture(fdef);

		shape.m_vertex1.Set(right, top);
		shape.m_vertex2.Set(right, bottom);
		bb.CreateFixture(fdef);
		
		if (this.player) {
			this.player.setPosition((right + left) * 0.5, (bottom + top) * 0.5, true);
		}

		this.mapBound_body = bb;
	}

	//_player_rebirth() {
	//	window.$player = this.player = new PPlayer(window.chara ? window.chara.renderer:null);
	//	this.player._create(this);
	//
	//	delete this.player.renderer;
	//	Object.defineProperty(this.player, "renderer", {
	//		get: function () {
	//			return window.chara ? window.chara.renderer : null;
	//		}
	//	});
	//}

	/**
	 * @param {SceneObject} sceneObject
	 * @param {CharacterAnimationBase} renderer
	 */
	$createPlayer(sceneObject, renderer) {
		if (!sceneObject || !renderer) {
			debugger;
			alert("$createPlayer(sceneObject, renderer)");
		}
		let player = new PPlayer();

		player._create(this);

		//init ?
		player.chara = sceneObject;
		player.renderer = renderer;//??

		this.player = player;

		return player;
	}
	/**
	 * @param {SceneObject} sceneObject
	 * @param {CharacterAnimationBase} renderer
	 */
	$createRemotePlayer(sceneObject, renderer) {
		if (!sceneObject || !renderer) {
			debugger;
			alert("$createRemotePlayer(sceneObject, renderer)");
		}
		let player = new PRemoteCharacter();

		player._create(this);

		//init ?
		player.renderer = renderer;

		return player;
	}

	/**
	 * do once AfterStep
	 * @param {function():void} func
	 */
	doAfterStep(func) {
		this._onceAfterStep.push(func);
	}
	
	/**
	 * @param {b2Vec2} p
	 */
	$_mouseDown(p) {
		if (this.$_mouseJoint != null) {
			return;
		}

		// Make a small box.
		let aabb = new b2AABB();
		let d = new b2Vec2();
		d.Set(0.001, 0.001);
		b2Vec2.SubVV(p, d, aabb.lowerBound);
		b2Vec2.AddVV(p, d, aabb.upperBound);

		let that = this;
		let hit_fixture = null;

		// Query the world for overlapping shapes.
		this.QueryAABB(function (fixture) {
			let body = fixture.GetBody();
			//if (body.GetType() == b2BodyType.b2_dynamicBody) {
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
			let md = new b2MouseJointDef();
			md.bodyA = this.ground.bodies[0];
			md.bodyB = body;
			md.target.Copy(p);
			md.maxForce = 1000 * body.GetMass();
			this.$_mouseJoint = this.CreateJoint(md);
			body.SetAwake(true);
		}
	}
	
	/**
	 * @param {b2Vec2} p
	 */
	$_mouseUp(p) {
		if (this.$_mouseJoint) {
			this.DestroyJoint(this.$_mouseJoint);
			this.$_mouseJoint = null;
		}
	}
	
	/**
	 * @param {b2Vec2} p
	 */
	$_mouseMove(p) {
		if (this.$_mouseJoint) {
			this.$_mouseJoint.SetTarget(p);
		}
	}
	
	$_onMouseEvent() {
		const x = ($gv.m_viewRect.left + $gv.mouse_x) / $gv.CANVAS_SCALE;
		const y = ($gv.m_viewRect.top + $gv.mouse_y) / $gv.CANVAS_SCALE;
		const p = new b2Vec2(x, y);
		
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
			body.Step(stamp);
		}

		super.Step(1 / $gv.MAX_FPS, window.$velocityIterations, window.$positionIterations, window.$particleIterations);
		for (let body = this.GetBodyList(); body; body = body.m_next) {
			body.AfterStep(stamp);
		}
		if (this._onceAfterStep) {
			this._onceAfterStep.forEach(f => f());
			this._onceAfterStep.length = 0;
		}
		if (this._destryBodyList) {
			this._destryBodyList.forEach(b => this._DestroyBody(b));
			this._destryBodyList.length = 0;
		}
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		/** @type {CanvasRenderingContext2D} */
		const ctx = renderer.ctx;

		/** @type {PPlayer} */
		const player = window.chara ? window.chara.$physics : this.player;

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

			if (player && player.body) {
				const pos = player.getPosition();
				ctx.fillStyle = "red";
				ctx.fillRect(pos.x, pos.y, 1, 1);
			}

			ctx.restore();
		}

		if ($gv.m_display_particleSystem) {
			if (renderer.gl) {
				/** @type {WebGLRenderingContext} */
				const gl = this.gl;

				if (!this.$vbo_ps) {
					let vbo = gl.createBuffer();

					gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

					const count = this.m_particleSystem.GetParticleCount();
					const buf = this.m_particleSystem.GetPositionBuffer();

					let vertices = new Float32Array(count * 2);

					for (let i = 0; i < count; i += 2) {
						vertices[i + 0] = buf[i].x;
						vertices[i + 1] = buf[i].y;
					}

					gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

					this.$vbo_ps = vbo;
				}
				else {
					const count = this.m_particleSystem.GetParticleCount();
					const buf = this.m_particleSystem.GetPositionBuffer();

					let vertices = new Float32Array(count * 2);

					for (let i = 0; i < count; i += 2) {
						vertices[i + 0] = buf[i].x;
						vertices[i + 1] = buf[i].y;
					}

					gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
				}

				for (let group = this.m_particleSystem.m_groupList; group; group = group.m_next) {
					let particleCount = group.GetParticleCount();
					let instanceOffset = group.GetBufferIndex();
					gl.drawArrays(gl.POINTS, instanceOffset, particleCount);
				}
			}
			else if (ctx) {
				if ($gv.func) {
					$gv.func.call(this, ctx, renderer);
					//$gv.func = function (ctx) {
					//	ctx = ctx || $engine.ctx;
					//	const vertices = this.m_particleSystem.m_positionBuffer.data;
					//	const colorBuffer = this.m_particleSystem.m_colorBuffer.data;
					//	const weightBuffer = this.m_particleSystem.m_weightBuffer;
					//
					//	let minWeight = Math.min.apply(this, weightBuffer.slice(0, 128));
					//	let maxWeight = Math.max.apply(this, weightBuffer.slice(0, 128)) - minWeight;
					//
					//	if (vertices.length > 2) {
					//		let length = vertices.length / 2;
					//
					//		ctx.fillStyle = "#0747";
					//
					//		for (let i = 0; i < length - 2; i += 1) {
					//			ctx.beginPath();
					//			ctx.moveTo(vertices[i + 0].x * $gv.CANVAS_SCALE, vertices[i + 0].y * $gv.CANVAS_SCALE);
					//			ctx.lineTo(vertices[i + 1].x * $gv.CANVAS_SCALE, vertices[i + 1].y * $gv.CANVAS_SCALE);
					//			ctx.lineTo(vertices[i + 2].x * $gv.CANVAS_SCALE, vertices[i + 2].y * $gv.CANVAS_SCALE);
					//			ctx.fillStyle = `hsla(87deg,${(weightBuffer[i] / maxWeight * 100).toFixed(0)}%,${(weightBuffer[i] / maxWeight * 50).toFixed(0)}%,${(weightBuffer[i] / maxWeight / 2).toFixed(2)})`
					//			//ctx.fillStyle = colorBuffer[i].MakeStyleString();
					//			ctx.fill();
					//		}
					//	}
					//}
				}
				else {
					const vertices = this.m_particleSystem.m_positionBuffer.data;
					const colorBuffer = this.m_particleSystem.m_colorBuffer.data;
					const weightBuffer = this.m_particleSystem.m_weightBuffer.data;

					renderer.pushMatrix();

					const r = window.$particleRadius;
					const r2 = r * 2;

					if (!this.$particle_grd) {
						let grd = ctx.createRadialGradient(r, r, 0, r, r, r2);
						grd.addColorStop(0, "#0744");
						grd.addColorStop(1, "#07440");
						this.$particle_grd = grd;
					}

					for (let group = this.m_particleSystem.m_groupList; group; group = group.m_next) {
						for (let i = group.m_firstIndex; i < group.m_lastIndex; ++i) {
							let x1 = vertices[i].x * $gv.CANVAS_SCALE - r;
							let y1 = vertices[i].y * $gv.CANVAS_SCALE - r;

							renderer.setTransform(1, 0, 0, 1, $gv.m_viewRect.left + x1, $gv.m_viewRect.top + y1);

							ctx.beginPath();

							//texture

							//ctx.arc(0, 0, r2, 0, 2 * Math.PI);
							//ctx.fillStyle = this.$particle_grd;
							//ctx.fill();

							ctx.fillStyle = this.$particle_grd;
							ctx.fillRect(r, r, r2 * 2, r2 * 2);

							//center
							//ctx.fillStyle = "red";
							//ctx.fillRect(0, 0, 1, 1);

							//border
							//ctx.strokeRect(-r, -r, r2, r2);
						}
					}
					renderer.popMatrix();
				}
			}
		}
		
		if ($gv.m_display_foothold) {
			ctx.save();
			this.ground.$drawDebugInfo(renderer);
			if (player && player._foothold) {
				player._foothold.$drawDebugInfo2(renderer, "#FF0");
			}

			let $foothold, $ladderRope;
			if (player) {
				$foothold = player.$foothold;
				$ladderRope = player.ladder;
			}
			if ($foothold && this.draw_foothold_path_count) {
				$foothold.$drawDebugInfo2(renderer, "#F00");

				//draw path
				let count = this.draw_foothold_path_count;
				ctx.lineWidth = 2.5;
				ctx.strokeStyle = "#00FE";
				if (player.state.front > 0) {
					$foothold = this.ground.footholds[$foothold.next];
					for (; $foothold; $foothold = this.ground.footholds[$foothold.next]) {
						$foothold._drawLine(ctx);
						if ((--count) <= 0) {
							break;
						}
					}
				}
				else if (player.state.front < 0) {
					$foothold = this.ground.footholds[$foothold.prev];
					for (; $foothold; $foothold = this.ground.footholds[$foothold.prev]) {
						$foothold._drawLine(ctx);
						if ((--count) <= 0) {
							break;
						}
					}
				}
			}
			this.ladderRope.forEach(lr => {
				const width = lr.calcWidth();
				ctx.beginPath();
				ctx.rect(lr.x - width * 0.5, lr.y1, width, lr.y2 - lr.y1);
				ctx.fillStyle = lr == $ladderRope ? "#E117":"#EB17";
				ctx.fill();
			});

			ctx.restore();
		}
	}
}


/**
 * https://github.com/google/LiquidFunPaint/blob/develop/src/com/google/fpl/liquidfunpaint/ParticleRenderer.java#L43
 * Renderer to draw particle water, objects, and wall. It draws particles as
 * fluid (or objects) by following three steps:
 * 1) Draws particles to a texture
 * 2) Blurs it out
 * 3) Applies threshold.
 */

