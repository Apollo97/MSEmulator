
import { CharacterMoveElem } from "../../Client/PMovePath";
import { SceneCharacter } from "../../game/SceneCharacter";

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

export class $Packet_CharacterMove {
	constructor() {
		/** @type {string} */
		this.id = undefined;

		/** @type {CharacterMoveElem[]} */
		this.path = [];

		/** @type {number} - time stamp */
		this.stamp = (new Date().getTime());
	}

	/**
	 * @param {SceneCharacter} chara
	 */
	capture(chara) {
		const phy = chara.$physics;
		const body = phy.body;
		const crr = chara.renderer;

		/** @type {CharacterMoveElem} */
		let elem;

		if (crr._$old_action != crr._action) {
			elem = new CharacterMoveElem();

			elem.action = crr._action;
			//elem.action_frame = crr._action_frame;
		}

		if (crr._$old_emotion != crr._emotion) {
			elem = elem || new CharacterMoveElem();

			elem.emotion = crr._emotion;
			//elem.emotion_frame = crr._emotion_frame;
		}
		
		const isAwake = body.IsAwake();
		if (isAwake) {
			elem = elem || new CharacterMoveElem();

			let pos = phy.getPosition();
			let vel = body.GetLinearVelocity();

			elem.isAwake = isAwake;

			elem.x = pos.x;
			elem.y = pos.y;
			elem.vx = vel.x;
			elem.vy = vel.y;
			//elem.fx = force.x;
			//elem.fy = force.y;

			elem.pState = phy.state;

			elem.elapsed = (new Date().getTime()) - this.stamp;
		}

		if (elem) {
			this.path.push(elem);
		}
	}
}

class $CharacterMoveItemElem {
	constructor() {
		/** @type {number} */
		this.from = null;

		/** @type {number} */
		this.to = null;

		/** @type {string} - equip id */
		this.item = null;
	}
}
class $Packet_CharacterMoveItem {
	constructor() {
		/** @type {$CharacterMoveItemElem} */
		this.elem = [];
	}
}

class $Packet_CharacterSkill {
	constructor() {
		/** @type {string} */
		this.skillId = null;
	}
}
