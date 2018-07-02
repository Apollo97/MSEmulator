
import { ItemCategoryInfo } from '../../public/resource.js';

import { IRenderer } from './IRenderer.js';

import { SceneObject } from "./SceneObject.js";
import { CharacterRenderer, ChatBalloon } from "./Renderer/CharacterRenderer.js";
import { PPlayer, PPlayerState } from "./Physics/PPlayer.js";

import { $createItem, ItemEquip, ItemSlot, ItemBase } from "./Item.js";
import { SceneSkill } from "./Skill.js";

import { CharacterStat } from "../Common/PlayerData.js";
import { CharacterMoveElem } from "../Client/PMovePath.js";
import { $Packet_CharacterMove } from "../Common/Packet";
import { AttackInfo, DamagePair } from "../Common/AttackInfo.js";

import { KeySlot, CommandSlot, ActionSlot, SkillSlot } from '../ui/Basic/KeySlot.js';

import { SceneMap } from './Map.js';


// SceneCharacter的更新流程
//
// chatCtrl.update (順序無關)
//
// <...controller>
// activeSkills.forEach(skill => skill.update)
// chara._handleAttack
// chara._player_control => { inputKey.forEach(key => key ? activeSkills.forEach(skill => skill.control)); ... }
// chara._applyState
//
// <renderer>
// set chara.renderer.position
// chara.renderer.update


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

	/** @type {" : "} */
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


const keyboard_map = [
	{
		ArrowUp: new KeySlot("Action", new ActionSlot("up")),
		ArrowLeft: new KeySlot("Action", new ActionSlot("left")),
		ArrowDown: new KeySlot("Action", new ActionSlot("down")),
		ArrowRight: new KeySlot("Action", new ActionSlot("right")),
		//z: new KeySlot("Action", new ActionSlot("jump")),
		z: new KeySlot("Skill", new SkillSlot("23001002")),//二段跳取代跳躍鍵
		x: new KeySlot("Skill", new SkillSlot("1001005")),
		c: new KeySlot("Skill", new SkillSlot("64120000")),
		v: new KeySlot("Skill", new SkillSlot("23121000")),//152001001
	},
	{//editor mode
		w: new KeySlot("Action", new ActionSlot("up")),
		a: new KeySlot("Action", new ActionSlot("left")),
		s: new KeySlot("Action", new ActionSlot("down")),
		d: new KeySlot("Action", new ActionSlot("right")),
		q: new KeySlot("Action", new ActionSlot("jump")),
		x: new KeySlot("Skill", new SkillSlot("1001005")),
		c: new KeySlot("Skill", new SkillSlot("64120000")),
		v: new KeySlot("Skill", new SkillSlot("23121000")),//152001001
	}
];


export class BaseSceneCharacter extends SceneObject {
	constructor() {
		super();

		/** @type {PPlayer} */
		this.$physics = null;//new PPlayer();

		/** @type {CharacterRenderer} */
		this.renderer = null;

		this.$layer = 5;

		/** @type {string} */
		this.name = null;

		this.stat = new CharacterStat();

		/** @type {Map<string,SceneSkill>} */
		this.activeSkills = new Map();

		/** @type {ChatController} */
		this.chatCtrl = new ChatController();

		/** @type {{move:$Packet_CharacterMove}} */
		this.$inPacket = {};
		this.$inPacket.move = null;

		/** @type {{move:$Packet_CharacterMove}} */
		this.$outPacket = {};
		this.$outPacket.move = null;
	}

	/**
	 * @alias name
	 * @type {string}
	 */
	get id() {
		return this.name;
	}
	set id(value) {
		this.name = value;
	}

	/**
	 * @alias name
	 * @type {string}
	 */
	get $objectid() {
		return this.name;
	}
	set $objectid(value) {
		this.name = value;
	}

	/**
	 * @param {BaseSceneCharacter|null} chara - 被 chara 攻擊
	 * @param {number} damage - 傷害
	 */
	damage(chara, damage) {
		console.log("Player(" + this.$objectid + ") 被 " + chara.$objectid + " 攻擊，減少 " + damage + " HP");
	}

	/**
	 * @param {BaseSceneCharacter|null} chara - 被 chara 攻擊
	 * @param {number} moveX - unit is pixel
	 * @param {number} moveY - unit is pixel
	 */
	knockback(chara, moveX, moveY) {
		this.$physics.knockback(moveX, moveY, 1000);
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
	 * @returns {SceneSkill]
	 */
	invokeSkill(skillId) {
		let skill = new SceneSkill();
		skill.load(skillId, this);
		this.activeSkills.set(skillId, skill);
		return skill;
	}

	/**
	 * after step, before rendering
	 * @param {number} stamp
	 */
	update(stamp) {
		this.chatCtrl.update(stamp);

		this.activeSkills.forEach(skill => {
			if (skill) {
				if (skill.isEnd()) {
					this.activeSkills.delete(skill.skillId);
				}
				else {
					skill.update(stamp, this);
				}
				//TODO: 結算攻擊傷害，skill.attackInfo
				this._handleAttack();
			}
			else {
				debugger;
			}
		});

		this._player_control();

		if ($gv.m_editor_mode) {
			if (this.renderer.speed > 0 && this.$physics && this.enablePhysics) {
				this._applyState({
					//front: this.renderer.front,
				});
			}
		}
		else if (this.$physics) {
			this._applyState(this.$physics.state);
		}

		if (this.$physics) {
			if (this.renderer && this.enablePhysics) {
				const pos = this.$physics.getPosition();
				const px = Math.trunc(pos.x * $gv.CANVAS_SCALE + 0.5);
				const py = Math.trunc(pos.y * $gv.CANVAS_SCALE + 0.5);

				this.renderer.x = px;
				this.renderer.y = py;

				this.$layer = this.$physics.getLayer();
			}
		}

		this.renderer.update(stamp);
	}

	/**
	 * @param {IRenderer} renderer
	 */
	_$drawName(renderer) {
		const name = this.id;
		this.__drawName(renderer, name);
	}
	/**
	 * @param {IRenderer} renderer
	 */
	_$drawChatBalloon(renderer) {
		this.chatCtrl.draw(renderer, this);//this.chatText || "123451234512345123451234512345123451234512345123451234512345123451234512345123451234", 84
	}

	/**
	 * @virtual
	 */
	_player_control() {
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		const charaRenderer = this.renderer;

		// renderer: apply default action
		if (!this.$physics.state.invokeSkill) {
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

	/**
	 * 結算攻擊傷害
	 */
	_handleAttack() {
		if (window.$io) {
			throw new Error("未完成");

			let attackInfoList = [];

			this.activeSkills.forEach(skill => {
				attackInfoList.push(skill.attackInfo);
			});

			window.$io
				.emit("attack", {
					//TODO: online mode: packet_attack
					attack: attackInfoList
				})
				.then(result => {
					if (result) {
						//TODO: online mode: attack ??
					}
				});
		}
		else {
			this.activeSkills.forEach(skill => {
				const attackInfo = skill.attackInfo;

				for (let i = 0; i < attackInfo.allAttack.length; ++i) {
					const attack = attackInfo.allAttack[i];

					const targetObject = attack.getTargetObject();

					for (let j = 0; j < attack.allDamage.length; ++j) {
						let damVar = this.stat.getCurrentMaxBaseDamage() - this.stat.getCurrentMinBaseDamage();
						let damage = this.stat.getCurrentMinBaseDamage() + Math.random() * damVar;

						if (Math.trunc(Math.random() * 100) < this.stat.critRate) {
							damage = damage * (1 + this.stat.critDamage / 100);
						}
						
						damage = Math.trunc(damage);

						targetObject.damage(this, damage);
					}
					//
					targetObject.knockback(this, 16, 16);
				}
			});
		}
	}
}

/**
 * client player
 */
export class SceneCharacter extends BaseSceneCharacter {
	/**
	 * @param {SceneMap} scene
	 */
	constructor(scene) {
		super();

		/** @type {CharacterRenderer} */
		this.renderer = new CharacterRenderer();

		/** @type {PPlayer} */
		this.$physics = scene.controller.$createPlayer(this, this.renderer);//new PPlayer();

		this.$layer = 5;

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

		this.stat.onJobChange(this._onJobChange.bind(this));
	}

	_onJobChange() {
		//TODO: register buf, debuf, autofire skill
		//TODO: 二段跳取代跳躍鍵
		const newJob = this.stat.job;

		console.log("Player(" + this.$objectid + ") change job: " + newJob);
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		super._applyState(player_state);

		this.$recMove();
	}

	/**
	 * @override
	 */
	_player_control() {
		if (!this.$physics) {
			return;
		}
		//if (!this.$physics.state.jump && this.$$jump_state) {
		//	delete this.$$jump_state;
		//}
		const key_map = keyboard_map[$gv.m_editor_mode ? 1 : 0];
		/** @type {{[key:string]:number}} */
		let ikey = {};

		let can_use_skill = this.activeSkills.size == 0;//TODO: 以查表法檢查不同技能是否可以同時使用

		for (let keyName in key_map) {
			/** @type {KeySlot} */
			const keySlot = key_map[keyName];
			if (!keySlot) {
				continue;
			}
			const keyDown = $gv.input_keyDown[keyName];
			const keyUp = $gv.input_keyUp[keyName];

			switch (keySlot.type) {
				case "Command"://open or close UI, ...
					break;
				case "Action":
					if (keyDown) {
						/** @type {ActionSlot} */
						const ck = keySlot.data;
						ikey[ck.action] = keyDown;
					}
					break;
				case "Skill":
					{
						/** @type {SkillSlot} */
						const sk = keySlot.data;
						const skill_id = sk.skill_id;
						let skill = this.activeSkills.get(skill_id);
						if (keyDown && can_use_skill) {
							skill = this.invokeSkill(sk.skill_id);
						}
						if ((keyDown || keyUp) && skill) {
							skill.control(ikey, keyDown, keyUp);
						}
					}
					break;
				case "Item":
					if (keyDown) {
						/** @type {ItemSlot} */
						const itemSlot = keySlot.data;
						this.useItem(itemSlot.data.id);
					}
					break;
			}
		};

		this.$physics.control(ikey);//apply action control
	}

	/**
	 * @param {string} itemId
	 * @param {number} amount
	 */
	addItem(itemId, amount) {
		if (window.$io) {//TODO: online mode: addItem
			throw new Error("未完成");
		}
		else {
			/** @type {Partial<ItemEquip>} */
			let props = {//test attr
				incDEXr: Math.trunc(Math.random() * 3),
				timeLimited: Date(),
			};

			$createItem(itemId, props).then(item => {
				this._addItem(item, amount);
			});
		}
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
		if (window.$io) {//TODO: online mode: removeItem
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

	/**
	 * @param {number} from
	 * @param {number} to
	 */
	moveItemToSlot(from, to) {
		//TODO: ("./ui/Basic/UISlotItem.vue").methods.drop
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
			const args = arguments;
			let existItem = this.findItem(itemId).itemSlot;

			if (existItem) {
				if (!$gv.m_editor_mode) {
					console.log(`消耗道具：${itemId}。未完成`);
					this._consume(itemId, 1);
				}
				else {
					console.log(`使用道具：${itemId}。`);
				}
				update_renderer.call(this);
			}
			else {
				if ($gv.m_editor_mode) {
					this.addItem(itemId, 1);
					update_renderer.call(this);
				}
				else {
					console.log("無法使用不存在的道具。");
				}
			}

			function update_renderer() {
				//TODO: implement job
				if (process.env.NODE_ENV !== 'production') {
					const category = args[1], equipInfo = args[2];
					this.renderer.use(itemId, category, equipInfo);
				}
				else {
					this.renderer.use(itemId);
				}
			}
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
}

/**
 * remote player
 */
export class SceneRemoteCharacter extends BaseSceneCharacter {
	/**
	 * @param {SceneMap} scene
	 */
	constructor(scene) {
		super();

		if (process.env.NODE_ENV !== 'production') {
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

		/** @type {CharacterRenderer} */
		this.renderer = new CharacterRenderer();

		/** @type {PPlayer} */
		this.$physics = scene.controller.$createPlayer(this, this.renderer);
	}

	get $remote() {
		return true;
	}

	/**
	 * @override
	 */
	_player_control() {
		this._remote_control();
	}
}

