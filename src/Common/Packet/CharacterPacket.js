
import { CharacterMoveElem } from "../../Client/PMovePath";

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
	capture(chara) {
		const phy = chara.$physics;
		const body = phy.body;
		let elem = new CharacterMoveElem();

		{
			const crr = chara.renderer;

			elem.action = crr.action;
			//elem.action_frame = crr.action_frame;
			elem.emotion = crr.emotion;
			//elem.emotion_frame = crr.emotion_frame;
		}

		elem.isAwake = body.IsAwake();
		if (elem.isAwake) {

			let pos = phy.getPosition();
			let vel = body.GetLinearVelocity();

			elem.x = pos.x;
			elem.y = pos.y;
			elem.vx = vel.x;
			elem.vy = vel.y;
			//elem.fx = force.x;
			//elem.fy = force.y;

			elem.pState = phy.state;

			elem.elapsed = (new Date().getTime()) - this.stamp;
		}

		this.path.push(elem);
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
