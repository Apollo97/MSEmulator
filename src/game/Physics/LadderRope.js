
import {
	b2_linearSlop,
	b2Vec2,
	b2BodyType, b2BodyDef, b2FixtureDef,
	b2PolygonShape, b2EdgeShape,
	b2Body,
	b2Contact, b2Manifold, b2ContactImpulse, b2WorldManifold
} from "./Physics.js";

import { World } from "./World";
import { PPlayer } from "./PPlayer.js";
import { FilterHelper } from "./Filter.js";


export class MapLadderRope {
	constructor(raw) {
		/** @type {number} - is ladder ? 1 : 0 */
		this.l = null;

		/** @type {number} */
		this.uf = null;

		/** @type {number} */
		this.x = null;

		/** @type {number} */
		this.y1 = null;

		/** @type {number} */
		this.y2 = null;

		/** @type {number} - ?? */
		this.page = null;

		/** @type {number} - select obj from layeredObject[layer] where obj.piece == piece */
		this.piece = null;

		Object.assign(this, raw);
	}

	isLadder() {
		return !!this.l;
	}
}


export class LadderRope extends MapLadderRope {
	constructor(raw) {
		super(raw);

		/** @type {b2Body} */
		this.body = null;
	}

	calcHeight() {
		return (this.y2 - this.y1);
	}
	calcHalfHeight() {
		return (this.y2 - this.y1) * 0.5;
	}
	calcWidth() {
		return (this.isLadder() ? 16 : 4);
	}
	calcHalfWidth() {
		return (this.isLadder() ? 16 : 4) * 0.5;
	}
	calcLength() {
		return (this.y2 - this.y1) / $gv.CANVAS_SCALE;
	}

	/**
	 * @param {World} world
	 */
	_create(world) {
		let bdef = new b2BodyDef();
		let fdef = new b2FixtureDef();
		let shape = new b2PolygonShape();

		const x = this.x / $gv.CANVAS_SCALE;
		const y1 = this.y1 / $gv.CANVAS_SCALE;
		const y2 = this.y2 / $gv.CANVAS_SCALE;
		const hwidth = this.calcHalfWidth() / $gv.CANVAS_SCALE;
		const hheight = (y2 - y1) * 0.5;

		bdef.type = b2BodyType.b2_kinematicBody;//可移動
		bdef.position.Set(x, y1);

		bdef.angle = 0;
		bdef.gravityScale = 0;
		//bdef.allowSleep = true;
		//bdef.bullet = true;
		bdef.fixedRotation = true;
		bdef.userData = this;

		this.body = world.CreateBody(bdef);

		shape.SetAsBox(hwidth, hheight + 0.5, new b2Vec2(0, hheight - 0.5), 0);

		fdef.shape = shape;
		fdef.filter.Copy(FilterHelper.get("ladder"));

		fdef.isSensor = true;
		fdef.userData = this;

		let fixture = this.body.CreateFixture(fdef);

		fixture.beginContact = this.beginContact.bind(this);
		fixture.endContact = this.endContact.bind(this);

		return this;
	}

	/**
	 * @param {b2Contact} contact
	 * @param {b2Fixture} fa
	 * @param {b2Fixture} fb
	 */
	beginContact(contact, fa, fb) {
		/** @type {PPlayer} */
		const targetPlayer = fb.m_userData;
		if (!targetPlayer) {
			return;
		}

		if (!targetPlayer.state.ladder) {// is not use ladder
			const foot = targetPlayer.foot_walk.GetPosition();
			const relativePoint = this.body.GetLocalPoint(foot, new b2Vec2());

			targetPlayer.contactLadder(this, relativePoint);
		}
	}

	/**
	 * @param {b2Contact} contact
	 * @param {b2Fixture} fa
	 * @param {b2Fixture} fb
	 */
	endContact(contact, fa, fb) {
		/** @type {PPlayer} */
		const targetPlayer = fb.m_userData;
		if (!targetPlayer) {
			return;
		}

		targetPlayer.leaveLadder();
	}
}


export class MapLadderRopeLoader {
	/**
	 * @param {{[prop:string]:any}} map_raw_data
	 * @param {World} world
	 * @returns {LadderRope[]}
	 */
	static load(map_raw_data, world) {
		/** @type {LadderRope[]} */
		let ladderRopes = [];

		for (let i in map_raw_data.ladderRope) {
			let raw = map_raw_data.ladderRope[i];
			let idx = parseInt(i, 10) - 1;
			if (idx >= 0 && Number.isSafeInteger(idx)) {
			}
			else {
				//TODO: ?? ladderRope
				debugger;
			}
			let ladderRope = new LadderRope(raw);
			ladderRope._$index = i;
			ladderRope._create(world);
			ladderRopes.push(ladderRope);
		};

		return ladderRopes;
	}
}

