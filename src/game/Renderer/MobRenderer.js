
import { LifeRenderer } from "./LifeRenderer.js";


window.MobAnimationSpeed = 1;

window.$mob_name = {};

/**
 * Mob basic infomation
 * Mob antion(animation) collection
 */
export class MobRenderer extends LifeRenderer {
	constructor() {
		super();

		//["info","stand","hit1","die1","skill1","skill2","skill3","skill4","skill5","attack1","attack2","attack3","attack4","attack5"]
	}

	static get __info() {
		return {
			"noFlip": 1,
			"level": 230,
			"maxHP": "??????",
			"maxMP": 100000,
			"speed": 0,
			"PADamage": 22000,
			"PDRate": 300,
			"MADamage": 24000,
			"MDRate": 30,
			"acc": 9999,
			"eva": 750,
			"pushed": 1000000000,
			"fs": 10,
			"summonType": 1,
			"category": 1,
			"elemAttr": "P2H2F2I2S2L2D2",
			"mobType": "3N",
			"firstAttack": 1,
			"hideHP": 1,
			"boss": 1,
			"hpTagColor": 1,
			"hpTagBgcolor": 5,
			"showNotRemoteDam": 1,
			"defaultHP": "측정불가",
			"defaultMP": "측정불가",
			"ignoreMoveImpact": 1
		}
	}
	
	/**
	 * @param {string} id
	 */
	static async loadDescription(id) {
		if (!MobRenderer._desc[id]) {
			let base = MobRenderer._get_desc_base_path();
			let url = [base, Number(id)].join("/");
			let desc = JSON.parse(await ajax_get("/assets/" + url));
			MobRenderer._desc[id] = desc;
			return desc;
		}
		return MobRenderer._desc[id];
	}
	
	/**
	 * @override
	 * @param {!string} id
	 */
	async load(id) {
		let result = await super.load.apply(this, arguments);
		return result;
	}

	isFlyMob() {
		return !!this._raw.flySpeed;
	}
	//get info() {
	//	return this._raw.info;
	//}
	
	_getFirstAttackName() {
		const firstAttack = this._raw.info.firstAttack;
		return "skill" + firstAttack;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		stamp *= window.MobAnimationSpeed;
		super.update(stamp);
	}
	
	static get _animations() {
		return ['"stand"', '"fly"', "`hit${$index}`", "`die${$index}`", "`skill${$index}`"/*, "`attack${$index}`"*/];
	}
	
	static _get_desc_base_path() {
		return 'String/Mob.img';
	}

	static get _base_path() {
		return "Mob";
	}
}
MobRenderer._desc = {};

