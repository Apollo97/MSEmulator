
import { ItemCategoryInfo } from "../../public/javascripts/resource.js";

import { IRenderer } from "./IRenderer.js";

import { SceneObject } from "./SceneObject.js";
import { CharacterRenderer } from "./Renderer/CharacterRenderer.js";
import { ChatBalloon } from "./Renderer/ChatBalloon.js";
import { PPlayer, PPlayerState } from "./Physics/PPlayer.js";

import { $createItem, ItemEquip, ItemSlot, ItemBase } from "./Item.js";
import { SceneSkill } from "./Skill.js";

import { CharacterStat } from "../Common/PlayerData.js";
import { CharacterMoveElem } from "../Client/PMovePath.js";

import { AttackInfo, DamagePair } from "../Common/AttackInfo.js";

import { KeySlot, CommandSlot, ActionSlot, SkillSlot } from "../ui/Basic/KeySlot.js";
import { InputKey } from "./InputKey.js";

import { SceneMap } from "./Map.js";
import { damageNumberLayer } from "./Renderer/DamageNumber.js";
import { Chair } from "./Renderer/Chair.js";
import { sceneRenderer, SceneRenderer } from "./Renderer/SceneRenderer.js";


// SceneCharacter的更新流程
//
// chatCtrl.update (順序無關)
//
// <...controller>
// control
// activeSkills.forEach(skill => skill.update)
// chara._handleAttack
// chara._player_control => { inputKey.forEach(key => key ? activeSkills.forEach(skill => skill.control)); ... }
// chara._applyState
//
// <renderer>
// set chara.renderer.position
// chara.renderer.update


window.$addItem_repeatEquip = false;


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
		const $displayDuration = this.displayDuration;

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
			const style = chara.chatBalloonStyle || $gv.ChatBalloon_default_style;

			/** @type {ChatBalloon} */
			let cb = ChatBalloon.cache[style];
			if (!cb) {
				cb = new ChatBalloon();
				await cb.load(style);
			}

			const $colon = this.colon;
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
	get colon() {
		return " : ";
	}
	get $maxLength() {
		return 70;
	}
	get displayDuration() {
		return $gv.ChatBalloon_display_duration;
	}
}


const keyboard_map = [
	{
		ArrowUp: new KeySlot("Action", new ActionSlot("up")),
		ArrowLeft: new KeySlot("Action", new ActionSlot("left")),
		ArrowDown: new KeySlot("Action", new ActionSlot("down")),
		ArrowRight: new KeySlot("Action", new ActionSlot("right")),
		z: new KeySlot("Action", new ActionSlot("jump")),
		//z: new KeySlot("Skill", new SkillSlot("23001002")),
		x: new KeySlot("Action", new ActionSlot("attack")),
		c: new KeySlot("Skill", new SkillSlot("1001005")),
		v: new KeySlot("Skill", new SkillSlot("64120000")),
		b: new KeySlot("Skill", new SkillSlot("23121000")),//152001001
	},
	{//editor mode
		w: new KeySlot("Action", new ActionSlot("up")),
		a: new KeySlot("Action", new ActionSlot("left")),
		s: new KeySlot("Action", new ActionSlot("down")),
		d: new KeySlot("Action", new ActionSlot("right")),
		q: new KeySlot("Action", new ActionSlot("jump")),
		f: new KeySlot("Skill", new SkillSlot("23001002")),//debug
		x: new KeySlot("Action", new ActionSlot("attack")),
		c: new KeySlot("Skill", new SkillSlot("1001005")),
		v: new KeySlot("Skill", new SkillSlot("64120000")),
		b: new KeySlot("Skill", new SkillSlot("23121000")),//152001001
	}
];


class PlayerJob {
	constructor() {
		/** @type {InputKey} */
		this.inputKey = new InputKey();
	}
	
	/**
	 * @param {BaseSceneCharacter} owner
	 * @param {number} stamp
	 * @param {InputKey} inputKey
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 */
	update(owner, stamp, inputKey, keyDown, keyUp) {
		let r = this._update_command_skill(owner, stamp, inputKey, keyDown, keyUp);
		if (r) {
			return true;
		}
		else {
			return this._update(owner, stamp, inputKey, keyDown, keyUp);
		}
	}
	
	/**
	 * @param {BaseSceneCharacter} owner
	 * @param {number} stamp
	 * @param {InputKey} inputKey
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 */
	_update(owner, stamp, inputKey, keyDown, keyUp) {
		return false;
	}
	
	/**
	 * @param {BaseSceneCharacter} owner
	 * @param {number} stamp
	 * @param {InputKey} inputKey
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 * @returns {boolean} is match
	 */
	_update_command_skill(owner, stamp, inputKey, keyDown, keyUp) {
		const frontKey = owner.$physics.state.front > 0 ? "right" : "left";
		
		//this.inputKey.update(stamp, ikey);
		
		if (this.inputKey.match([["down"], [frontKey]], -1) ||
			this.inputKey.match([["down"], ["down", frontKey], [frontKey]], -1)
		) {
			if (inputKey.attack == 1) {
				console.log("invoke skill: 波動拳");
				return true;
			}
		}
		return false;
	}
}

class PlayerJob_2300 extends PlayerJob {
	/**
	 * @param {BaseSceneCharacter} owner
	 * @param {number} stamp
	 * @param {InputKey} inputKey
	 * @param {number} keyDown - keyDown tick counter
	 * @param {number} keyUp - is keyUp
	 */
	_update(owner, stamp, inputKey, keyDown, keyUp) {
		if (inputKey.jump == 1) {
			const skill_id = "23001002";
			let skill = owner.activeSkills.get(skill_id);
			let preloadSkill;

			preloadSkill = skill || SceneSkill.preload(skill_id);
			
			if (!preloadSkill.$promise && preloadSkill.test(owner)) {
				owner.invokeSkill(skill_id);
			}

			//if (keyDown && can_use_skill) {
			//}
			//if (skill) {
			//	skill.control(ikey, keyDown, keyUp);
			//}
		}
	}
}

export class BaseSceneCharacter extends SceneObject {
	constructor() {
		super();

		///** @type {PPlayer} */
		//this.$physics = null;//new PPlayer();

		/** @type {CharacterRenderer} */
		this.renderer = null;
		this.$layer = 5;

		/** @type {string} */
		this.name = null;

		this.stat = new CharacterStat();
		
		// begin PlayerData
		//TODO: move player data to PlayerData
		
		/** @type {string} */
		this.chatBalloonStyle = 0;
		
		/** @type {string} */
		this.labelStyle = 0;
		
		/** @type {string} */
		this.damageSkin = "default";
		
		// end PlayerData

		/** @type {PlayerJob} */
		this.jobController = new PlayerJob_2300();

		/** @type {Map<string,SceneSkill>} */
		this.activeSkills = new Map();
		
		/** @type {Map<string,SceneSkill>} */
		this.skillControllers = new Map();
		
		/** @type {Chair} */
		this.chair = null;
		
		/** @type {ChatController} */
		this.chatCtrl = new ChatController();
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
	 * @param {BaseSceneCharacter|null} target - 被 chara 攻擊
	 * @param {number} damage - 傷害
	 */
	damage(target, damage) {
		console.log("Player(" + this.$objectid + ") 被 " + target.$objectid + " 攻擊，減少 " + damage + " HP");
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
	 * @param {CharacterMoveElem} moveElem
	 */
	$move(moveElem) {
		this.$physics.moveTo(moveElem);
	}

	/**
	 * @param {number} equipId
	 * @param {number} from
	 * @param {number} to
	 */
	$moveItem(equipId, from, to) {
	}
	
	/**
	 * @param {string} chairId
	 */
	sitChair(chairId) {
		if (!this.chair) {
			this.chair = new Chair();
			this.chair.init(this);
			this.chair.load(chairId).then(() => {
				this.chair.addToScene(sceneRenderer);
				{// Chair#update
					const bodyRelMove = this.chair.bodyRelMove;
					if (bodyRelMove) {
						//this.renderer.tx = bodyRelMove.x;
						//this.renderer.ty = bodyRelMove.y;
						this.renderer.x += bodyRelMove.x;
						this.renderer.y += bodyRelMove.y;
					}
					
					if (this.chair._raw.info.sitAction) {
						this.renderer.action = this.chair._raw.info.sitAction;
					}
					else {
						this.renderer.action = "sit";
					}
					if (this.chair._raw.info.sitEmotion) {
						this.renderer.emotion = window.character_emotion_list[this.chair._raw.info.sitEmotion];
					}
				}
				
				this.enablePhysics = false;
				this.$physics.body.SetAwake(false);
				this.$physics.foot_walk.SetAwake(false);
			});
		}
		else {
			console.log("already sit");
		}
	}
	noSit() {
		if (window.$io) {
			console.error("TODO: emit noSit");
		}

		this.enablePhysics = true;
		this.$physics.body.SetAwake(true);
		this.$physics.foot_walk.SetAwake(true);
		
		{// Chair#update
			//this.renderer.tx = 0;
			//this.renderer.ty = 0;
			const bodyRelMove = this.chair.bodyRelMove;
			if (bodyRelMove) {
				this.renderer.x -= bodyRelMove.x;
				this.renderer.y -= bodyRelMove.y;
			}

			this.renderer.action = "stand1";
			this.renderer.emotion = "blink";
		}
		
		this.chair = null;//TODO: remove chair
	}

	/**
	 * @param {string} skillId
	 * @returns {SceneSkill|Promise<SceneSkill>}
	 */
	invokeSkill(skillId) {
		if (window.$io) {
			return this.__invokeSkill_client(skillId);
		}
		else {
			let skill = this.__invokeSkill_offline(skillId);
			return skill;
		}
	}
	/**
	 * @param {string} skillId
	 * @returns {Promise<SceneSkill>}
	 */
	async __invokeSkill_client(skillId) {
		let isValid;
		try {
			isValid = await window.$io.emit("skill", {
				skillId: skillId
			});
		}
		catch (ex) {
			console.error(ex);
		}
		if (isValid) {
			return this.__invokeSkill_offline(skillId);
		}
	}
	/**
	 * @param {string} skillId
	 * @returns {SceneSkill}
	 */
	__invokeSkill_offline(skillId) {
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
		const renderer = this.renderer;

		this.chatCtrl.update(stamp);

		this._handleSkill(stamp);

		this._player_control();

		if ($gv.m_editor_mode) {
			if (renderer.speed > 0 && this.$physics && this.enablePhysics) {
				this._applyState({
					front: this.$physics.state.front,
				});
			}
		}
		else if (this.$physics) {
			this._applyState(this.$physics.state);
		}

		if (this.$physics) {
			if (renderer && this.enablePhysics) {
				const pos = this.$physics.getPosition();
				const px = Math.trunc(pos.x * $gv.CANVAS_SCALE + 0.5);
				const py = Math.trunc(pos.y * $gv.CANVAS_SCALE + 0.5);

				//position
				renderer.x = px;
				renderer.y = py;
				
				//rotate
				if (this.$physics.body.GetAngle() || this.$physics.body.GetAngularVelocity()) {
					renderer.angle = this.$physics.body.GetAngle();
				}
				else {
					renderer.angle = 0;
				}

				//layer
				this.$layer = this.$physics.getLayer();
			}
		}

		renderer.update(stamp);
	}

	/**
	 * @param {IRenderer} renderer
	 */
	_$drawName(renderer) {
		const name = this.id;
		this.__drawName(renderer, name, this.labelStyle || $gv.NameLabel_default_style);
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
		const renderer = this.renderer;
		const pState = this.$physics.state;

		// renderer: apply default action
		if (!pState.invokeSkill) {
			const { front, jump, walk, prone, fly, ladder } = player_state;
			const enablePhysics = this.enablePhysics;

			if (front != null) {
				renderer.front = front;
			}

			if (ladder) {
				if (enablePhysics && this.$physics.ladder) {
					if (this.$physics.ladder.isLadder()) {
						renderer.action = "ladder";
					}
					else {
						renderer.action = "rope";
					}

					if (pState.ladder_move_dir) {
						if (this.renderer.actani.isEnd()) {
							this.renderer.actani.reset();
							renderer.actani.loop = false;
						}
					}
					else {
						renderer.actani._is_end = true;
					}
				}
			}
			else if (jump) {
				renderer.action = "jump";
				renderer.actani.loop = false;
			}
			else if (walk) {
				renderer.action = "walk1";
				renderer.actani.loop = true;
			}
			else if (prone) {
				renderer.action = "prone";
				renderer.actani.loop = false;
			}
			else if (fly) {
				renderer.action = "fly";
				renderer.actani.loop = true;
			}
			else {
				renderer.action = "stand1";
				renderer.actani.loop = true;
			}

			//TODO: keyboard: emotion key
			for (let i = 0; i <= 9; ++i) {
				if ($gv.input_keyDown[i]) {
					let a = [
						"blink", "hit", "smile",
						"troubled", "cry", "angry",
						"bewildered", "stunned", "vomit",
						"oops"
					];
					let e = a[i % a.length];
					renderer.emotion = e;
				}
			}
		}
	}
	
	/**
	 * route
	 * 結算攻擊傷害
	 */
	_handleSkill(stamp) {
		/** @type {AttackInfo[]} */
		let attackInfoList = [];
		
		this.activeSkills.forEach(skill => {
			if (skill) {
				if (skill.isEnd()) {
					this.activeSkills.delete(skill.skillId);
				}
				else {
					skill.update(stamp, this);
				}
				//clear all attack
				let allAttack = skill.attackInfo.shiftAllAttack();
				if (allAttack.length) {
					let attackInfo = new AttackInfo();
					attackInfo.allAttack = allAttack;
					attackInfoList.push(attackInfo);
				}
			}
			else {
				debugger;
			}
		});
		
		if (attackInfoList.length) {
			if (window.$io) {
				this.__handleAttack_client(attackInfoList);
			}
			else {
				this.__handleAttack_offline(attackInfoList);
			}
		}
	}
	/**
	 * 結算攻擊傷害
	 * @param {AttackInfo[]} attackInfoList
	 */
	async __handleAttack_client(attackInfoList) {
		let isValid = await window.$io.emit("attack", {
			//TODO: online mode: packet_attack
			attack: attackInfoList
		});
		
		if (isValid) {
			//TODO: online mode: attack ??
			this.__handleAttack_offline(attackInfoList);//show attack
		}
	}
	/**
	 * 結算攻擊傷害
	 * @param {AttackInfo[]} attackInfoList
	 */
	__handleAttack_offline(attackInfoList) {
		for (let attackInfo of attackInfoList) {
			for (let i = 0; i < attackInfo.allAttack.length; ++i) {
				const attack = attackInfo.allAttack[i];

				const targetObject = attack.getTargetObject();

				for (let j = 0; j < attack.allDamage.length; ++j) {
					let damVar = this.stat.getCurrentMaxBaseDamage() - this.stat.getCurrentMinBaseDamage();
					let realDamage = this.stat.getCurrentMinBaseDamage() + Math.random() * damVar;
					let damage = attack.allDamage[j] = new DamagePair();
					let style;

					if (Math.trunc(Math.random() * 100) < this.stat.critRate) {
						realDamage = realDamage * (1 + this.stat.critDamage / 100);
						damage.critical = true;
					}
					
					realDamage = Math.trunc(realDamage);
					damage.realDamage = realDamage;

					targetObject.damage(this, realDamage);

					if (damage.critical) {
						style = "NoCri";
					}
					else {
						style = "NoRed";
					}

					//TODO: ?? target position
					damageNumberLayer.addDamagePair(this.damageSkin || "default", style, damage, targetObject.x + (attack.allDamage.length > 1 ? (25 - (1 - j & 1) * 25) : 0), targetObject.y, j * 100);
				}
				//
				targetObject.knockback(this, 16, 16);
			}
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

		//this.addItem("01005177", 1);
		//this.addItem("01053322", 1);
		//this.addItem("01073284", 1);

		this.stat.onJobChange = this._onJobChange.bind(this);
	}

	_onJobChange() {
		//TODO: register buf, debuf, autofire skill
		const newJob = this.stat.job;

		console.log("Player(" + this.$objectid + ") change job: " + newJob);
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		super._applyState(player_state);

		if (window.$io) {//??
		//	this.$recMove();
		}
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
		let ikey = this.$physics.ikey;

		let can_use_skill = this.activeSkills.size == 0;//TODO: 以查表法檢查不同技能是否可以同時使用

		for (let keyName in key_map) {
			/** @type {KeySlot} */
			const keySlot = key_map[keyName];
			if (!keySlot) {
				debugger;
				continue;
			}
			const keyDown = $gv.input_keyDown[keyName];
			const keyUp = $gv.input_keyUp[keyName];

			switch (keySlot.type) {
				case "Command"://open or close UI, ...
					break;
				case "Action":
					{
						/** @type {ActionSlot} */
						const ck = keySlot.data;

						if (keyDown) {
							if (this.chair) {
								if (ck.action == "left" ||
									ck.action == "right" ||
									ck.action == "jump"
								) {
									this.noSit();
								}
							}
							else {
								ikey[ck.action] = keyDown;
							}
						}
						else {
							delete ikey[ck.action];
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
		}
		if (!this.chair) {
			//TODO: stamp
			const stamp = 0;
			if (this.jobController.update(this, stamp, ikey)) {
			}
			else {
				for (let keyName in key_map) {
					/** @type {KeySlot} */
					const keySlot = key_map[keyName];
					if (!keySlot) {
						debugger;
						continue;
					}
					const keyDown = $gv.input_keyDown[keyName];
					const keyUp = $gv.input_keyUp[keyName];

					if (keySlot.type == "Skill") {
						/** @type {SkillSlot} */
						const ks = keySlot.data;
						const skill_id = ks.skill_id;
						let skill = this.activeSkills.get(skill_id);
						if (keyDown && can_use_skill) {
							this.invokeSkill(skill_id);
							
							//skill.control(ikey, keyDown, keyUp);//?? await == nextTick
						}
						else if (skill) {
							skill.control(ikey, keyDown, keyUp);
						}
					}
				}
			}
		}

		this.$physics.control();//apply action control
	}

	/**
	 * route addItem
	 * @param {string} itemId
	 * @param {number} amount
	 */
	addItem(itemId, amount) {
		if (window.$io) {
			//TODO: online mode: addItem
			console.warn("未完成: __addItem_client");
			//this.__addItem_client(itemId, amount);
		}
		//else {
			this.__addItem_offline(itemId, amount);
		//}
	}
	/**
	 * @param {string} itemId
	 * @param {number} amount
	 */
	async __addItem_client(itemId, amount) {
		//TODO: online mode: addItem
		console.warn("未完成: __addItem_client");
		
		let result = await window.$io.emit("addItem", {
			type: type,
			slot: slot,
		});
	}
	/**
	 * @param {string} itemId
	 * @param {number} amount
	 */
	__addItem_offline(itemId, amount) {
		/** @type {Partial<ItemEquip>} */
		let props = {//test attr
			incDEXr: Math.trunc(Math.random() * 3),
			timeLimited: Date(),
		};

		$createItem(itemId, props).then(item => {
			this._addItem(item, amount);
		}, function (err) {
			console.warn(err);
		});
	}

	/**
	 * @template T
	 * @param {T extends ItemBase ? T : never} itemData
	 * @param {number} amount
	 */
	_addItem(itemData, amount) {
		let SN = 123;
		let itemId = itemData.id;
		let slotType = itemData.getSlot();
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
	removeItem(type, slot) {
		if (window.$io) {
			//TODO: online mode: removeItem
			console.warn("未完成: removeItem");
		}
		//if (window.$io) {//TODO: online mode: removeItem
		//	console.warn("未完成: removeItem");
		//	
		//	window.$io.emit("removeItem", {
		//		type: type,
		//		slot: slot,
		//	}).then(results => {
		//		if (result) {
		//			this._removeItem(type, slot);
		//		}
		//		return result;
		//	}, err => {
		//		console.error(err);
		//	});
		//}
		//else {
			return this._removeItem(type, slot);
		//}
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
	 * route
	 * @param {number} itemId
	 */
	useItem(itemId, category, itemInfo) {
		if (window.$io) {
			this.__useItem_client(itemId);
		}
		else {
			this.__useItem_offline(itemId);
		}
	}
	/**
	 * @param {number} itemId
	 * @returns {Promise<{}>}
	 */
	__useItem_client(itemId) {
		return window.$io.emit("useItem", {
			itemId: itemId
		}).then(results => {
			if (results) {
				this.__useItem_offline(itemId);
			}
			return results;
		}, err => {
			console.log();
			console.error("can't use item: %o\nerror: %o", id, err);
		});
	}
	/**
	 * @param {number} itemId
	 */
	__useItem_offline(itemId) {
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
			if (ItemCategoryInfo.isChair(itemId)) {
				this.sitChair(itemId);
			}
			else {
				update_renderer.call(this);
			}
		}
		else {
			if ($gv.m_editor_mode) {
				this.addItem(itemId, 1);
				if (ItemCategoryInfo.isChair(itemId)) {
					this.sitChair(itemId);
				}
				else {
					update_renderer.call(this);
				}
			}
			else {
				console.log("無法使用不存在的道具。you can try add item editor mode");
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

	/**
	 * after step, before rendering
	 * @param {number} stamp
	 */
	update(stamp) {
		super.update(stamp);
	}
	
	/** @returns {boolean} */
	isNeedUpdate() {
		return this.$physics.isNeedUpdate();
	}

	_$makeMoveElement() {
		let elem = new CharacterMoveElem();

		this.$physics.$setAsOutputData(elem);

		return elem;
	}

	$emitMovePacket() {
		if (this.isNeedUpdate()) {
			let moveElem = this._$makeMoveElement();

			if (moveElem) {
				window.$io.emit("charaMove", moveElem);
			}
		}
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

		/** @type {CharacterRenderer} */
		this.renderer = new CharacterRenderer();

		/** @type {PPlayer} */
		this.$physics = scene.controller.$createRemotePlayer(this, this.renderer);
	}

	/**
	 * is remote player
	 */
	get $remote() {
		return true;
	}

	/**
	 * 'character physics state' to 'character renderer state'
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		if (!this.activeSkills.size) {//if not skill's skill
			super._applyState(player_state);
		}
	}

	/**
	 * @override
	 */
	_player_control() {
		//this._remote_control();
	}

	/**
	 * @param {string} skillId
	 * @returns {void}
	 */
	invokeSkill(skillId) {
		let skill = this.__invokeSkill_offline(skillId);

		//TODO: emit event: controllSkill
		//TODO: on event: sremoteControllSkill
		//skill.control(inputKey, keyDown, keyUp);
	}
}

