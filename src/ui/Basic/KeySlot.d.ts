
import { ItemSlot } from "../../game/Item";


//TODO: SkillSlot.js 未完成
declare class SkillSlot {
	skill_id: string;
}


interface KeySlotMap {
	Command: CommandSlot,
	Action: ActionSlot,
	Item: ItemSlot,
	Skill: SkillSlot,
}

declare class KeySlot<K extends keyof KeySlotMap> {
	type: K;
	data: KeySlotMap[K];

	constructor(type: K, data: KeySlotMap[K]);
}

/**
 * open/close ui, command...
 */
declare class CommandSlot extends KeySlotData {
	command: string;
	constructor(command: string);
}

/**
 * charaction action key
 */
declare class ActionSlot extends KeySlotData {
	action: string;
	constructor(action: string);
}
