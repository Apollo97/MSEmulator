
import { Vec2 } from "../math.js";


export class ActionAnimationFrameData {
	constructor() {
		/** @type {number} */
		this.delay = 0;

		/** @type {Vec2} */
		this.move = null;

		/** @type {string} */
		this.action = 0;

		/** @type {number} */
		this.frame = 0;
	}

	/**
	 * from loaded raw data
	 * @param {ActionAnimationFrameData} raw
	 * @param {string} action
	 * @param {number} frame
	 */
	_load(raw, action, frame) {
		this._raw = raw;

		/** @type {number} */
		this.delay = raw.delay;

		/** @type {Vec2} */
		if (raw.move) {
			this.move = new Vec2(raw.move.x, raw.move.y);
		}
		else {
			this.move = new Vec2(0, 0);
		}

		/** @type {string} */
		this.action = raw.action || action;

		/** @type {number} */
		this.frame = raw.frame || frame;
	}
}

export class ActionAnimation {
	constructor(raw) {
		/** @returns {ActionAnimationFrameData[]} */
		this.frames = null;

		/** @type {string} */
		this._action = null;

		/** @type {number} */
		this.time = 0;

		/** @type {number} */
		this.frame = 0;

		/** @type {number} this.delay = delay < 0 ? -delay:0; if (this.delay == 0) launch attack */
		this.delay = 0;

		/** @type {boolean} */
		this.loop = false;

		/** @type {boolean} */
		this._is_end = false;
	}

	/**
	 * from loaded data
	 * @param {string} action
	 */
	_load(action) {
		this._action = action;
		this.frames = ActionAnimation.Adef[action];
	}

	/**
	 * from loaded data
	 * @param {string} action
	 */
	reload(action) {
		this.reset();
		this._load(action);
	}

	reset() {
		this.time = 0;
		this.frame = 0;
		this._is_end = false;
	}

	/**
	 * update action delay, target.action, target.action_frame, target.tx, target.ty
	 * @param {number} stamp
	 * @param {CharacterRenderer} target
	 */
	update(stamp, target) {
		if (!this.frames) {
			return;
		}
		const fdat = this.fdat;
		let delay = 0;

		if (!fdat) {
			return;
		}

		this.time = this.time + stamp;

		if (fdat.delay < 0) {
			fdat.delay = -fdat.delay;
		}

		if (fdat.delay > 0) {
			delay = fdat.delay;
			this.delay = 0;
		}
		else {
			delay = -fdat.delay;
			this.delay = delay;
		}

		if (this.time > delay) {
			this.frame = ++this.frame;
			this.time = 0;
		}

		//translate target position
		if (fdat.move) {
			target.tx = -fdat.move.x * target.front;
			target.ty = fdat.move.y;//Y 軸相反
		}
		else {
			target.tx = 0;
			target.ty = 0;
		}
		if (this.isEnd()) {
			target.tx = 0;
			target.ty = 0;
		}
		
		// 改變 action & action_frame 會造成迴圈: this.reload(this._action)
		if (!target._ride_action) {
			target._action = fdat.action;
		}
		target._action_frame = fdat.frame;

		if (!this.frames || this.fdat == null) {
			this._is_end = true;
		}
		else if (!this.loop) {
			this._is_end = false;
		}
		if (this.frames.length <= 1) {
			this._is_end = true;
		}
	}

	isEnd() {
		return this._is_end;
	}

	getTotalTime() {
		return this.frames.reduce((total, frame) => total + frame.delay, 0);
	}

	/**
	 * frame data
	 * @returns {ActionAnimationFrameData}
	 */
	get fdat() {
		return this.frames[this.frame];
	}

	static async Init() {
		/** @type {{[action:string]:ActionAnimationFrameData[]}} */
		let raw = await $get.data(ActionAnimation._base_path);

		let aadef = Object.assign({}, raw);
		
		delete aadef['info'];

		for (let actName in aadef) {
			let aa = aadef[actName];
			aadef[actName] = Object.values(aa).map((_fdef, frame) => {
				let fdef = new ActionAnimationFrameData();
				fdef._load(_fdef, actName, frame);
				return fdef;
			});
		}

		//action definition
		ActionAnimation.Adef = aadef;

		window.CharacterActionAnimationDefinition = aadef;
	}

	static get _base_path() {
		return "/Character/00002000";
	}
}
/**
 * action definition
 * @type {{[action:string]:ActionAnimationFrameData[]}}
 */
ActionAnimation.Adef = null;

