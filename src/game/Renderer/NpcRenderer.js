
import { LifeRenderer } from './LifeRenderer.js';

window.NpcAnimationSpeed = 1;

//Npc: 9090004 => ad-tv

export class NpcRenderer extends LifeRenderer {
	constructor() {
		super();
	}
	
	/**
	 * @param {string} id
	 */
	static async loadDescription(id) {
		if (!NpcRenderer._desc[id]) {
			let base = NpcRenderer._get_desc_base_path();
			let url = [base, Number(id)].join("/");
			let desc = await $get.data(url);
			NpcRenderer._desc[id] = desc;
			return desc;
		}
		return NpcRenderer._desc[id];
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		stamp *= window.NpcAnimationSpeed;
		super.update(stamp);
	}

	static get _animations() {
		return ['"stand"'/*, "`condition${$index}`"*/];
	}
	
	static _get_desc_base_path() {
		return '/String/Npc.img';
	}

	static get _base_path() {
		return "/Npc";
	}
};
NpcRenderer._desc = {};
