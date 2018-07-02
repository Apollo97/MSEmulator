
import { KeySlotData } from "./KeySlotData";
import { ItemSlot } from "../../game/Item";


export class KeySlot {
	/**
	 * @param {"Command"|"Action"|"Item"|"Skill"} type
	 * @param {KeySlotData} data
	 */
	constructor(type, data) {
		if (process.env.NODE_ENV !== 'production') {
			if ((type + "Slot") != data.constructor.name) {
				debugger;
			}
		}
		this.type = type;
		this.data = data;
	}
}


/**
 * open/close ui, command...
 */
export class CommandSlot extends KeySlotData {
	/**
	 * @param {string} command
	 */
	constructor(command) {
		super();
		this.command = command;
	}
}

/**
 * charaction action key
 */
export class ActionSlot extends KeySlotData {
	/**
	 * @param {string} action
	 */
	constructor(action) {
		super();
		this.action = action;
	}
}


//TODO: SkillSlot.js 未完成
export class SkillSlot extends KeySlotData {
	/**
	 * @param {string} skill_id
	 */
	constructor(skill_id) {
		super();
		this.skill_id = skill_id;
	}
}



