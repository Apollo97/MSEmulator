
import { ItemCategoryInfo } from '../../public/resource.js';

import { IRenderer } from './IRenderer.js';

import { SceneObject } from "./SceneObject.js";
import { CharacterRenderer, ChatBalloon } from "./Renderer/CharacterRenderer.js";
import { PPlayer, PPlayerState } from "./Physics/PPlayer.js";

import { $createItem, ItemEquip, ItemSlot, ItemBase } from "./Item.js";
import { SkillAnimation } from "./Skill.js";

import { CharacterMoveElem } from "../Client/PMovePath.js";
import { PlayerStat } from "../Client/PlayerStat.js";
import { $Packet_CharacterMove } from "../Common/Packet";


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

window.$addItem_repeatEquip = false;

window.$Character_ChatBalloon_DisplayDuration = 5000;
window.$Character_ChatBalloon_Style = 0;

class ChatController {
	constructor() {
		/** @type {number} */
		this.style = 0;

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
	 */
	async draw(renderer, chara) {
		if (this._isDisplay) {
			const style = this.style || window.$Character_ChatBalloon_Style;

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

		/** @type {string} */
		this.id = null;

		this.stat = new PlayerStat();
		
		this.skill = null;//not complete

		/** @type {ChatController} */
		this.chatCtrl = new ChatController();

		/** @type {{move:$Packet_CharacterMove}} */
		this.$inPacket = {};
		this.$inPacket.move = null;

		/** @type {{move:$Packet_CharacterMove}} */
		this.$outPacket = {};
		this.$outPacket.move = null;
	}

	/** @type {string} */
	get name() {
		return this.id;
	}
	set name(value) {
		this.id = value;
	}

	/**
	 * @param {$Packet_CharacterMove} move
	 */
	$move(_move) {
		let move = _move || this.$inPacket.move;
		this.$inPacket.move = move;
	}

	_remote_control() {
		let move = this.$inPacket.move;

		if (move && move.path && move.path.length) {
			const crr = this.renderer;
			let elem = move.path.shift();

			if (elem.isAwake) {
				this.$physics.moveTo(elem);
				this.$physics.state = elem.pState;//??

				crr.front = elem.pState.front;
			}
		
			if (elem.action) {
				crr.action = elem.action;
				//crr.action_frame = elem.action_frame;
			}
			if (elem.emotion) {
				crr.emotion = elem.emotion;
				//crr.emotion_frame = elem.emotion_frame;
			}
		}
	}

	/**
	 * @param {number} itemSN
	 * @param {number} from
	 * @param {number} to
	 */
	$moveItem(equipId, from, to) {
	}

	/**
	 * @param {string} skillId
	 */
	_invokeSkill(skillId) {
		let skill = new SkillAnimation();
		skill.load(skillId, this);
		this.skill = skill;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.chatCtrl.update(stamp);

		if ($gv.m_editor_mode) {
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
				const px = Math.trunc(pos.x * $gv.CANVAS_SCALE + 0.5);
				const py = Math.trunc(pos.y * $gv.CANVAS_SCALE + 0.5);

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
		const ctx = renderer.ctx;
		const name = this.id;
		const crr = this.renderer;

		ctx.font = "12px 微軟正黑體";//新細明體
		ctx.textBaseline = "middle";
		ctx.textAlign = "start";

		const r = 2, h = 12;
		const w = ctx.measureText(name).width + 3;
		const x = Math.trunc(crr.x/* + crr.tx*/) - w * 0.5;//TODO: crr.tx and crr.ty ??
		const y = Math.trunc(crr.y/* + crr.ty*/);

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
		this.chatCtrl.draw(renderer, this);//this.chatText || "123451234512345123451234512345123451234512345123451234512345123451234512345123451234", 84
	}

	_player_control() {
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		const charaRenderer = this.renderer;

		if (!this.skill) {
			const { front, jump, walk, prone, fly } = player_state;

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
				if ($gv.input_keyDown[i]) {
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

			charaRenderer.actani.loop = true;
		}
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

		/** @type {ItemSlot[][]} - item inventory */
		this.items = new Array(5);
		for (let i = 0; i < 5; ++i) {
			this.items[i] = new Array(128);
			for (let j = 0; j < 128; ++j) {
				this.items[i][j] = new ItemSlot(j, null, null, 0);
			}
		}

		this.addItem("01005177", 1);
		this.addItem("01053322", 1);
		this.addItem("01073284", 1);
	}

	/**
	 * @param {string} itemId
	 * @param {number} amount
	 */
	addItem(itemId, amount) {
		/** @type {Partial<ItemEquip>} */
		let props = {//test attr
			incDEXr: Math.trunc(Math.random() * 3),
			timeLimited: Date(),
		};

		$createItem(itemId, props).then(item => {
			this._addItem(item, amount);
		});
	}

	/**
	 * @param {T extends ItemBase ? T : never} itemData
	 * @param {number} amount
	 */
	_addItem(itemData, amount) {
		let SN = 123;
		let itemId = itemData.id;
		let slotType;
		switch (itemId[0]) {
			case '0':
				slotType = 0;
				break;
			default:
				console.info(`~give ${this.id}: ${itemId} * ${amount}`);
				return false;
		}
		for (let i = 0; i < this.items[slotType].length; ++i) {
			if (this.items[slotType][i].isEmpty()) {
				if (window.$addItem_repeatEquip) {
					this.items[slotType][i].assign(i, SN, itemData, slotType ? amount : 1);
					console.info(`give ${this.id}: ${itemId} * ${amount}`);
					return true;
				}
				else {
					if (slotType == 0) {
						this.items[slotType][i].assign(i, SN, itemData, 1);
						amount--;
						if (amount == 0) {
							console.info(`repeat give ${this.id}: ${itemId}`);
							return true;
						}
					}
					else {
						this.items[slotType][i].assign(i, SN, itemData, amount);
						console.info(`give ${this.id}: ${itemId} * ${amount}`);
						return true;
					}
				}
			}
		}
		return false;//item inventory was full
	}
	
	/**
	 * @param {number} type - item type
	 * @param {number} slot
	 */
	async removeItem(type, slot) {
		if (window.$io) {
			throw new Error("未完成");

			let result = await window.$io.emit("removeItem", {
				type: type,
				slot: slot,
			});
			if (result) {
				this._removeItem(type, slot);
			}
			return result;
		}
		else {
			return this._removeItem(type, slot);
		}
	}

	/**
	 * @param {number} type - item type
	 * @param {number} slot
	 */
	_removeItem(type, slot) {
		this.items[type][slot]._clear();
	}

	_player_control() {
		if (!this.$physics.state.jump && this.$$jump_state) {
			delete this.$$jump_state;
		}
		if (this.$physics) {
			let ikey = {};
			for (let i in $gv.input_keyDown) {
				const k = keyboard_map[$gv.m_editor_mode ? 1 : 0][i];
				if (k) {
					ikey[k] = $gv.input_keyDown[i];
				}
			}
			if (this.skill == null) {
				if (ikey.skill_1) {
					this.invokeSkill("1001005");
				}
				else if (ikey.skill_2) {
					this.invokeSkill("64120000");
				}
				else if (ikey.skill_3) {
					this.invokeSkill("23121000");//152001001
				}
			}
			if (this.$physics.state.jump &&
			    ikey.jump && (!this.$ikey || !this.$ikey.jump) &&
			    !this.$$jump_state
			) {
				this.invokeSkill("23001002");
				this.$$jump_state = true;
			}
			if (this.skill) {
				if (!ikey.skill_3 && this.skill.skillId == "23121000") {
					this.skill.nextState();
				}
				else {
					ikey.up = 0;
					ikey.left = 0;
					ikey.down = 0;
					ikey.right = 0;
					ikey.jump = 0;
				}
			}
			this.$ikey = ikey;
			this.$physics.control(ikey);//basic control
		}
	}

	/**
	 * @param {string} skillId
	 * @returns {Promise<boolean>}
	 */
	async invokeSkill(skillId) {
		if (window.$io) {
			let result = await window.$io.emit("skill", {
				skillId: skillId,
			});
			if (result) {
				this._invokeSkill(skillId);
			}
			return result;
		}
		else {
			this._invokeSkill(skillId);
			return true;
		}
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		super._applyState(player_state);

		this.$recMove();
	}

	
	$emit(socket) {
		if (this.$outPacket.move) {
			socket.emit("charaMove", this.$outPacket.move);
			this.$outPacket.move = null;
		}
		else {
			let charaMove = new $Packet_CharacterMove();

			charaMove.capture(this);

			socket.emit("charaMove", charaMove);
		}

		this.$outPacket.move = null;
	}
	
	$recMove() {
		let move = this.$outPacket.move || new $Packet_CharacterMove();
		move.capture(this);
		this.$outPacket.move = move;
	}

	/**
	 * @param {number} from
	 * @param {number} to
	 */
	moveItemToSlot(from, to) {
		//TODO: ("./ui/UISlotItem.vue").methods.drop
		debugger;
	}

	///**
	// * @param {any} id
	// */
	//$getItem(id) {
	//	this.itemSlot
	//}

	/**
	 * @param {number} itemId
	 */
	findItem(itemId) {
		for (let i = 0; i < this.items.length; ++i) {
			for (let j = 0; j < this.items[i].length; ++j) {
				let itemSlot = this.items[i][j];

				if (itemSlot && itemSlot.data && (itemSlot.data.id == itemId)) {
					return {
						typeName: ItemCategoryInfo.typeName[i],
						itemSlot: itemSlot,
					};
				}
			}
		}
		return {
			typeName: null,
			itemSlot: null,
		};
	}

	/**
	 * @param {number} itemId
	 */
	useItem(itemId) {
		if (window.$io) {
			window.$io.emit("useItem", {
				itemId: itemId
			});
		}
		else {
			let existItem = this.findItem(itemId).itemSlot;

			if (!existItem) {
				this.addItem(itemId, 1);
			}

			this.renderer.use(itemId);
		}
	}

	/**
	 * @param {string} text
	 * @returns {Promise<boolean>}
	 */
	async say(text) {
		if (window.$io) {
			let result = await window.$io.emit("chat", {
				$style: this.chatCtrl.style,
				text: text,
			});
			if (result) {
				this.chatCtrl.enter(text);
			}
			return result;//boolean
		}
		else {
			this.chatCtrl.enter(text);
			return true;
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
					console.error("can not set SceneRemoteCharacter.$physics = null;");
					alert("can not set SceneRemoteCharacter.$physics = null;");
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
					console.error("can not set SceneRemoteCharacter.renderer = null;");
					alert("can not set SceneRemoteCharacter.renderer = null;");
				}
				this.$$renderer = value;
			},
		});
	}

	get $remote() {
		return true;
	}

	_player_control() {
		this._remote_control();
	}

	/**
	 * @param {string} skillId
	 * @returns {Promise<boolean>}
	 */
	async invokeSkill(skillId) {
		this._invokeSkill(skillId);
		return true;
	}
}

