
import { IRenderer } from './IRenderer.js';

import { SceneObject } from "./SceneObject.js";
import { CharacterRenderer, ChatBalloon } from "./Renderer/CharacterRenderer.js";
import { PPlayer, PPlayerState } from "./Physics/PPlayer.js";

import { SkillAnimation } from "./Skill.js";

import { CharaMoveElem } from "../Client/PMovePath.js";
import { PlayerStat } from "../Client/PlayerStat.js";


class TimeElapsed {
	constructor() {
		/** @type {Date} */
		this._date = new Date();
	}
	reset() {
		this._date = new Date();
	}
	get elapsed() {
		const elapsed = (new Date()).getMilliseconds() - this._date.getMilliseconds();
		return elapsed;
	}
}

window.$Character_ChatBalloon_DisplayDuration = 5000;
window.$Character_ChatBalloon_Style = 0;

class ChatController {
	constructor() {
		/** @type {string} */
		this.text = "";

		/** @type {string} */
		this.$outputText = null;

		/** @type {number} */
		this.elapsed = 0;

		/** @type {boolean} */
		this._isDisplay = false;
	}

	/**
	 * @param {string} text
	 */
	enter(text) {
		this.text = String(text);
		this.$outputText = null;
		this.isDisplay = true;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		const $displayDuration = this.constructor.displayDuration;

		if (this.elapsed > $displayDuration) {
			this.isDisplay = false;
		}
		else {
			this.elapsed += stamp;
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {BaseSceneCharacter} chara
	 * @param {number} style
	 */
	async draw(renderer, chara, style = 0) {
		if (this._isDisplay) {
			/** @type {ChatBalloon} */
			let cb = ChatBalloon.cache[style];
			if (!cb) {
				cb = new ChatBalloon();
				await cb.load(style);
			}

			const $colon = this.constructor.colon;
			const crr = chara.renderer;
			const boundBox = crr._boundBox;

			if (!this.$outputText) {
				this.$outputText = chara.id + $colon + this.text;
			}
			cb.draw(renderer, this.$outputText, crr.x, crr.y - boundBox.height);
		}
	}

	get isDisplay() {
		return this._isDisplay;
	}
	set isDisplay(value) {
		this._isDisplay = !!value;
		this.elapsed = 0;
	}

	static get colon() {
		return " : ";
	}
	static get $maxLength() {
		return 70;
	}
	static get displayDuration() {
		return window.$Character_ChatBalloon_DisplayDuration;
	}
}


/**
 * @type {{[x:string]:string}[]}
 */
const keyboard_map = [{
	ArrowUp: "up",
	ArrowLeft: "left",
	ArrowDown: "down",
	ArrowRight: "right",
	z: "jump",
	x: "skill_1",
	c: "skill_2",
	v: "skill_3",
},
{
	w: "up",
	a: "left",
	s: "down",
	d: "right",
	q: "jump",
	x: "skill_1",
	c: "skill_2",
	v: "skill_3",
	}];

export class BaseSceneCharacter extends SceneObject {
	constructor() {
		super();

		/** @type {PPlayer} */
		this.$physics = null;//new PPlayer();

		/** @type {CharacterRenderer} */
		this.renderer = null;

		this.$layer = 5;

		this.stat = new PlayerStat();

		/** @type {string} */
		this.id = null;

		/** @type {ChatController} */
		this.chatCtrl = new ChatController();
	}

	/** @type {string} */
	get name() {
		return this.id;
	}
	set name(value) {
		this.id = value;
	}
	
	$recMove(socket) {
		let body = this.$physics.body;
		let vel = body.GetLinearVelocity();
		let pos = this.$physics.getPosition();

		/** @type {CharaMoveElem[]} */
		let elems = [];
		elems[0] = {
			x: pos.x,
			y: pos.y,
			vx: vel.x,
			vy: vel.y,
			pState: this.$physics.state,
		};

		socket.emit("charaMove", elems);
		socket.emit("charaAnim", {
			action: this.renderer.action,
			//action_frame: this.renderer.action_frame,
			emotion: this.renderer.emotion,
			//emotion_frame: this.renderer.emotion_frame,
		});
	}

	/**
	 * @param {CharaMoveElem[]} elems
	 */
	$move(elems) {
		let elem = elems[0];
		let body = this.$physics.body;

		this.$physics.setPosition(elem.x, elem.y);

		let vel = body.GetLinearVelocity();

		vel.x = elem.vx;
		vel.y = elem.vy;
		body.SetLinearVelocity(vel);

		this.$physics.state = elem.pState;
		this.renderer.front = elem.pState.front;//force update any appMode
	}

	$anim(anim) {
		const cr = this.renderer;
		cr.action = anim.action;
		//cr.action_frame = anim.action_frame;

		cr.emotion = anim.emotion;
		//cr.emotion_frame = anim.emotion_frame;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.chatCtrl.update(stamp);

		if (m_editor_mode) {
			if (this.renderer.speed > 0 && this.$physics && !this.$physics.disable) {
				this._applyState({
					//front: this.renderer.front,
				});
			}
		}
		else if (this.$physics) {
			this._applyState(this.$physics.state);
		}

		if (this.$physics) {
			if (this.renderer && !this.$physics.disable) {
				const pos = this.$physics.getPosition();
				const px = Math.trunc(pos.x * CANVAS_SCALE + 0.5);
				const py = Math.trunc(pos.y * CANVAS_SCALE + 0.5);

				this.renderer.x = px;
				this.renderer.y = py;

				this.$layer = this.$physics.getLayer();
			}
		}
		
		if (this.skill) {
			if (this.skill.isEnd()) {
				this.skill = null;
			}
			else {
				this.skill.update(stamp, this);
			}
		}

		this._player_control();

		this.renderer.update(stamp);
	}

	/**
	 * @param {IRenderer} renderer
	 */
	_$drawName(renderer) {
		const name = this.id;
		const crr = chara.renderer;
		const ctx = renderer.ctx;

		ctx.font = "12px 微軟正黑體";//新細明體
		ctx.textBaseline = "middle";
		const r = 2, h = 12;
		const w = ctx.measureText(name).width + 3;
		const x = Math.trunc(crr.x + crr.tx) - w * 0.5;
		const y = Math.trunc(crr.y + crr.ty);

		const left = x + r;
		const _left = x;
		const top = y;
		const _top = y + r;
		const _right = x + w;
		const right = _right + r;
		const bottom = y + r + h + r;
		const _bottom = y + r + h;

		ctx.fillStyle = "rgba(0,0,0,0.7)";
		ctx.strokeStyle = "rgba(0,0,0,0.7)";
		ctx.beginPath();
		{
			ctx.moveTo(left, top);

			ctx.lineTo(_right, top);
			ctx.arcTo(right, top, right, _top, r);

			ctx.lineTo(right, _bottom);
			ctx.arcTo(right, bottom, _right, bottom, r);

			ctx.lineTo(left, bottom);
			ctx.arcTo(_left, bottom, _left, _bottom, r);

			ctx.lineTo(_left, _top);
			ctx.arcTo(_left, top, left, top, r);
		}
		ctx.fill();

		if (0) {//inner
			ctx.fillStyle = "yellow";
			ctx.strokeStyle = "yellow";
			ctx.beginPath();
			{
				ctx.moveTo(left, _top);

				ctx.lineTo(_right, _top);

				ctx.lineTo(_right, _bottom);

				ctx.lineTo(left, _bottom);

				ctx.closePath();
			}
			ctx.stroke();
		}
		ctx.fillStyle = "white";
		ctx.strokeStyle = "white";
		ctx.fillText(name, left, (top + bottom) * 0.5);
	}
	/**
	 * @param {IRenderer} renderer
	 */
	_$drawChatBalloon(renderer) {
		this.chatCtrl.draw(renderer, this, window.$Character_ChatBalloon_Style);//this.chatText || "123451234512345123451234512345123451234512345123451234512345123451234512345123451234", 84
	}

	_player_control() {
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
	}
}

export class SceneCharacter extends BaseSceneCharacter {
	constructor(...args) {
		super(...args);

		/** @type {PPlayer} */
		this.$physics = null;//new PPlayer();

		/** @type {CharacterRenderer} */
		this.renderer = new CharacterRenderer();

		this.$layer = 5;

		this.stat = new PlayerStat();

		/** @type {string} */
		this.id = null;
	}

	_player_control() {
		if (this.$physics) {
			let ikey = {};
			for (let i in input_keys) {
				const k = keyboard_map[m_editor_mode ? 1 : 0][i];
				if (k) {
					ikey[k] = input_keys[i];
				}
			}
			if (this.skill == null) {
				if (ikey.skill_1) {
					let skill = new SkillAnimation();
					skill.owner = this;
					skill.load("1001005");
					this.skill = skill;
				}
				else if (ikey.skill_2) {
					let skill = new SkillAnimation();
					skill.owner = this;
					skill.load("64120000");
					this.skill = skill;
				}
				else if (ikey.skill_3) {
					let skill = new SkillAnimation();
					skill.owner = this;
					skill.load("152001001");
					this.skill = skill;
				}
			}
			if (this.skill) {
				ikey.up = 0;
				ikey.left = 0;
				ikey.down = 0;
				ikey.right = 0;
			}
			this.$physics.control(ikey);
		}
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		const { front, jump, walk, prone, fly } = player_state;
		const charaRenderer = this.renderer;

		if (front != null) {
			charaRenderer.front = front;
		}

		if (jump) {
			charaRenderer.action = "jump";
		}
		else if (walk) {
			charaRenderer.action = "walk1";
		}
		else if (prone) {
			charaRenderer.action = "prone";
		}
		else if (fly) {
			charaRenderer.action = "fly";
		}
		else {
			charaRenderer.action = "stand1";
		}

		for (let i = 0; i <= 9; ++i) {
			if (input_keys[i]) {
				let a = [
					"blink", "hit", "smile",
					"troubled", "cry", "angry",
					"bewildered", "stunned", "vomit",
					"oops"
				];
				let e = a[i % a.length];
				charaRenderer.emotion = e;
			}
		}
	}
}

export class SceneRemoteCharacter extends BaseSceneCharacter {
	constructor(...args) {
		super(...args);

		/** @type {PPlayer} */
		this.$$physics = null;

		/** @type {CharacterRenderer} */
		this.$$renderer = new CharacterRenderer();

		delete this.$physics;
		Object.defineProperty(this, "$physics", {
			enumerable: true,
			configurable: false,
			get: function () {
				return this.$$physics;
			},
			set: function (value) {
				if (value == null) {
					alert("can not set SceneRemoteCharacter.$physics = null;");
					console.error("can not set SceneRemoteCharacter.$physics = null;");
				}
				this.$$physics = value;
			},
		});

		delete this.renderer;
		Object.defineProperty(this, "renderer", {
			enumerable: true,
			configurable: false,
			get: function () {
				return this.$$renderer;
			},
			set: function (value) {
				if (value == null) {
					alert("can not set SceneRemoteCharacter.renderer = null;");
					console.error("can not set SceneRemoteCharacter.renderer = null;");
				}
				this.$$renderer = value;
			},
		});
	}

	_player_control() {
		//nothing
	}
}

