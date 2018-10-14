
class CharacterBaseStat {
	constructor() {
		this.hp = 8855;
		this.mp = 5246;
		this.mhp = 28855;
		this.mmp = 25246;
		this.exp = 55;

		this.str = 123;
		this.luk = 4;
		this.dex = 999;
		this.int = 4;
	}
}

class CharacterTemporaryStat {
}


class CharacterStat extends CharacterBaseStat {
	constructor(sceneChara) {
		super();

		this._$sceneChara = sceneChara;

		/** @type {number} */
		this.level = 150;

		/** @type {number} */
		this.exp = 55;

		/** @type {number} */
		this.job = 3;

		/** @type {number} */
		this.spec_job = 3;

		/** @type {() => void} */
		this.onJobChange = null;


		/** @type {number} - abilityPoint */
		this.ap = 0;

		/** @type {number} - skill point */
		this.sp = [0, 0, 0, 0, 0];

		/** @type {number} - hyper skill point */
		this.hyper_sp = [0, 0];


		///** @type {number} - 最大屬性攻擊 */
		//this.currentMaxBaseDamage = 10000;

		///** @type {number} - 最小屬性攻擊 */
		//this.currentMinBaseDamage = 1000;

		/** @type {number} - 爆擊率 0~100 */
		this.critRate = 50;

		/** @type {number} - 爆擊傷害 0~100 */
		this.critDamage = 80;

		///** @type {number} - 最大爆擊傷害 0~100 */
		//this.maxCritDamage = 80;

		///** @type {number} - 最小爆擊傷害 0~100 */
		//this.minCritDamage = 40;
	}

	gainExp(exp) {
		this.exp += exp;
		console.log("gain exp: ", exp);
	}

	levelUp() {
		this.level += 1;
		console.log("level up");
	}

	levelUpTo(level) {
		for (let i = this.level + 1; i <= level; ++i) {
			this.levelUp();
		}
	}

	/** @param {number} value */
	setJob(value) {
		this._job = value;

		if (this.onJobChange) {
			this.onJobChange();
		}
	}

	get jobName() {
		throw new Error("未完成");
	}

	_getTotalAttack() {
		return window.DEFAULT_TOTAL_ATTACK || 100;
	}

	/** @returns {number} - 最大屬性攻擊 */
	getCurrentMaxBaseDamage() {
		//return this.currentMaxBaseDamage;
		return 1.30 * (4 * this.dex + this.str) * (this._getTotalAttack() / 100);
	}
	/** @returns {number} - 最小屬性攻擊 */
	getCurrentMinBaseDamage() {
		//return this.currentMinBaseDamage;
		return 1.30 * (this.dex + this.str) * (this._getTotalAttack() / 100);
	}
	/** @returns {number} - 爆擊率 0~100 */
	getCritRate() {
		return this.critRate;
	}
	/** @returns {number} - 爆擊傷害 0~100 */
	getCritDamage() {
		return this.critDamage;
	}
	///** @returns {number} - 最大爆擊傷害 0~100 */
	//getMaxCritDamage() {
	//	return this._$maxCritDamage;
	//}
	///** @returns {number} - 最小爆擊傷害 0~100 */
	//getMinCritDamage() {
	//	return this._$minCritDamage;
	//}

	getHpPercentS() {
		return (this.hp * 100 / this.mhp).toFixed(0);
	}
	getMpPercentS() {
		return (this.mp * 100 / this.mmp).toFixed(0);
	}
	getExpPercentS() {
		return (this.exp * 100 / this.getNextExp()).toFixed(2);
	}
	getNextExp() {
		return 100;
	}
}
CharacterStat.all_exp = LoadEXP();

class $ExportData_Equip {
	constructor() {
		/** @type {string} */
		this.name = "";
		
		/** @type {string} */
		this.itemId = 0;

		this.opacity = 1;
		this.hue = 0;
		this.sat = 100;
		this.bri = 100;
		this.contrast = 100;
	}

	/**
	 * @param {Partial<$ExportData_Equip>} data - $ExportData_Equip like
	 */
	assign(data) {
		this.name = getPropertyFromData(data, "name", "");
		
		this.itemId = getPropertyFromData(data, "itemId", 0);

		this.opacity = getPropertyFromData(data, "opacity", 1);
		this.hue = getPropertyFromData(data, "hue", 0);
		this.sat = getPropertyFromData(data, "sat", 100);
		this.bri = getPropertyFromData(data, "bri", 100);
		this.contrast = getPropertyFromData(data, "contrast", 100);

		/**
		 * @template T
		 * @param {Partial<$ExportData_Equip>} data - $ExportData_Equip like
		 * @param {string} prop
		 * @param {T} defaultValue
		 * @returns {T}
		 */
		function getPropertyFromData(data, prop, defaultValue) {
			if (prop in data) {
				return data[prop];
			}
			else {
				return defaultValue;
			}
		}
	}

	/**
	 * @param {string} itemId
	 * @param {Partial<$ExportData_Equip>} [option=] - $ExportData_Equip like
	 */
	static create(itemId, option) {
		//let { opacity, hue, sat, bri, contrast } = option;
		let item = new $ExportData_Equip();
		if (typeof option == "object") {
			item.assign(option);
		}
		item.itemId = itemId;
		return item;
	}
	/**
	 * @param {Partial<$ExportData_Equip>} option - $ExportData_Equip like
	 */
	static from(option) {
		//let { opacity, hue, sat, bri, contrast } = option;
		let item = new $ExportData_Equip();
		if (typeof option == "object") {
			item.assign(option);
		}
		return item;
	}
}

//?? packet
class $RemotePlayerData {
	constructor() {
		/** @type {string} */
		this.id = undefined;


		/** @type {string} */
		this.mapId = "000000000";

		///** @type {string} */
		//this.spawnPoint = null;
		

		/** @type {string} */
		this.name = "";


		/** @type {string} */
		this.ear = "human";
		
		/** @type {$ExportData_Equip} */
		this.body = null;

		/** @type {$ExportData_Equip} */
		this.head = null;

		/** @type {$ExportData_Equip} */
		this.face = null;

		/** @type {$ExportData_Equip} */
		this.hair = null;

		/** @type {{Equip:$ExportData_Equip[],Cash:$ExportData_Equip[]}} */
		this.equipSlots = {
			Equip: [],
			Cash: [],
		};

		/** @type {[$ExportData_Equip[],$ExportData_Equip[],$ExportData_Equip[],$ExportData_Equip[],$ExportData_Equip[]]} */
		this.items = [
			[], [], [], [], [],
		];

		/** @type {boolean} */
		this.flipX = false;

		/** @type {{x:number, y:number}} */
		this.position = {
			x: 0,
			y: 0,
		};
		
		
		/** @type {string} */
		this.chatBalloonStyle = 0;
		
		/** @type {string} */
		this.labelStyle = 0;
		
		/** @type {string} */
		this.damageSkin = "default";
	}

	/**
	 * @param {Partial<$RemotePlayerData>} obj
	 * @returns {$RemotePlayerData}
	 */
	static from(obj) {
		let data = new $RemotePlayerData();
		
		data.id = obj.id;
		
		data.mapId = obj.mapId;

		
		data.name = obj.name;

		
		data.ear = obj.ear;
		
		data.body = obj.body;
		
		data.head = obj.head;
		
		data.face = obj.face;
		
		data.hair = obj.hair;

		throw new Error("Not completely");

		/** @type {{Equip:$ExportData_Equip[],Cash:$ExportData_Equip[]}} */
		data.equipSlots = {
			Equip: [],
			Cash: [],
		};

		/** @type {[$ExportData_Equip[],$ExportData_Equip[],$ExportData_Equip[],$ExportData_Equip[],$ExportData_Equip[]]} */
		data.items = [
			[], [], [], [], [],
		];
		
		data.flipX = obj.flipX;

		data.position.x = obj.position.x;
		data.position.y = obj.position.y;

		
		data.chatBalloonStyle = obj.chatBalloonStyle;
		
		data.labelStyle = obj.ilabelStyled;
		
		data.damageSkin = obj.damageSkin;

		return data;
	}

	/**
	 * @param {number} presetId
	 */
	$usePreset(presetId) {
		this["$usePreset_" + (presetId % 4 + 1)]();
	}

	$usePreset_1() {
		this.body = $ExportData_Equip.create("00002000");
		
		this.head = $ExportData_Equip.create("00012012");
		
		this.face = $ExportData_Equip.create("00026509");
		
		this.hair = $ExportData_Equip.create("00034873");
		
		this.equipSlots.Equip[5] = $ExportData_Equip.create("01051429");
		this.equipSlots.Equip[7] = $ExportData_Equip.create("01072392");
	}

	$usePreset_2() {
		this.body = $ExportData_Equip.create("00002000");

		this.head = $ExportData_Equip.create("00012000");

		this.face = $ExportData_Equip.create("00025346");

		this.hair = $ExportData_Equip.create("00044591");

		this.equipSlots.Equip[5] = $ExportData_Equip.create("01051469");
		this.equipSlots.Equip[7] = $ExportData_Equip.create("01072392");
	}

	$usePreset_3() {
		this.body = $ExportData_Equip.create("00002012");

		this.head = $ExportData_Equip.create("00012012");

		this.face = $ExportData_Equip.create("00026539");

		this.hair = $ExportData_Equip.create("00044833");

		this.equipSlots.Equip[1] = $ExportData_Equip.create("01012083");
		this.equipSlots.Equip[5] = $ExportData_Equip.create("01051437");
		this.equipSlots.Equip[7] = $ExportData_Equip.create("01071078");
	}

	$usePreset_4() {
		this.body = $ExportData_Equip.create("00002000");

		this.head = $ExportData_Equip.create("00012000");

		this.face = $ExportData_Equip.create("00024163");

		this.hair = $ExportData_Equip.create("00044847");

		this.equipSlots.Equip[1] = $ExportData_Equip.create("01012083");
		this.equipSlots.Equip[5] = $ExportData_Equip.create("01051529");
		this.equipSlots.Equip[7] = $ExportData_Equip.create("01071110");
	}
}

//?? packet
class $PlayerData extends $RemotePlayerData {
	constructor() {
		super();

		/** @type {CharacterStat} */
		this.stat = new CharacterStat();
	}

	/**
	 * @param {Partial<$PlayerData>} obj
	 * @returns {$PlayerData}
	 */
	static from(obj) {
		let data = $RemotePlayerData.from(obj);

		data.stat = CharacterStat.from(obj.stat);

		return data;
	}

	getRemoteData() {
		return {
			id: this.id,
			mapId: this.mapId,
			skin: this.skin,
			mercEars: this.mercEars,
			illiumEars: this.illiumEars,
			highFloraEars: this.highFloraEars,
			name: this.name,

			//selectedItems: this.selectedItems,
			
			items: this.equipSlots,
			equipSlots: this.equipSlots,
			ear: this.ear,
			body: this.body,
			head: this.head,
			face: this.face,
			hair: this.hair,

			flipX: this.flipX,
			position: this.position,
			chatBalloonStyle: this.chatBalloonStyle,
			labelStyle: this.labelStyle,
			damageSkin: this.damageSkin,
		};
	}
}

//class _$ExportData_CharacterEquipSlots {
//	constructor() {
//		/** @type {Equip} */
//		this.Face = null;
//
//		/** @type {Equip} */
//		this.Hair = null;
//
//		/** @type {Equip} */
//		this.Cape = null;
//
//		/** @type {Equip} */
//		this.Glove = null;
//
//		/** @type {Equip} */
//		this.Hat = null;
//
//		/** @type {Equip} */
//		this.Overall = null;
//
//		/** @type {Equip} */
//		this.Shoes = null;
//
//		/** @type {Equip} */
//		this.Top = null;
//
//		/** @type {Equip} */
//		this.Bottom = null;
//
//		/** @type {Equip} */
//		this.Shield = null;
//
//		/** @type {Equip} */
//		this.Chair = null;
//
//		/** @type {Equip} - TamingMob */
//		this.Mount = null;
//	}
//}
//
////?? packet
//class _$ExportData_PlayerData {
//	constructor() {
//		/** @type {string} */
//		this.id = undefined;
//
//
//		/** @type {string} */
//		this.mapId = "000000000";
//
//		///** @type {string} */
//		//this.spawnPoint = null;
//
//
//		/** @type {number} */
//		this.skin = 2000;
//
//		/** @type {boolean} */
//		this.mercEars = false;
//
//		/** @type {boolean} */
//		this.illiumEars = false;
//
//		/** @type {boolean} */
//		this.highFloraEars = false;
//
//		/** @type {string} */
//		this.name = "";
//
//		/** @type {$ExportData_CharacterEquipSlots} */
//		this.selectedItems = null;
//
//		/** @type {boolean} */
//		this.flipX = false;
//
//		/** @type {{x:number, y:number}} */
//		this.position = {
//			x: 0,
//			y: 0,
//		};
//
//
//		/** @type {string} */
//		this.chatBalloonStyle = 0;
//
//		/** @type {string} */
//		this.labelStyle = 0;
//
//		/** @type {string} */
//		this.damageSkin = "default";
//	}
//}

function LoadEXP() {
	let exp = [];
    exp[1] = 15;
    exp[2] = 34;
    exp[3] = 57;
    exp[4] = 92;
    exp[5] = 135;
    exp[6] = 372;
    exp[7] = 560;
    exp[8] = 840;
    exp[9] = 1242;
	for (let i = 10; i < 200; i++) {
        if (i >= 10 && i < 15
                || i >= 30 && i < 35
                || i >= 60 && i < 65
                || i >= 100 && i < 105) {
            exp[i] = exp[i - 1];
            continue;
        }
        exp[i] = Math.trunc(exp[i - 1] * (i < 40 ? 1.2 : i < 75 ? 1.08 : i < 160 ? 1.07 : i < 200 ? 1.06 : 1));
    } //ExtremeDevilz SUCKS
    for (let i = 200; i < 250; i++) {
        if (i % 10 == 0) {
            exp[i] = exp[i - 1] * 2;
            if (i != 200) {
				exp[i] = Math.trunc(exp[i] * (i == 210 ? 1.06 : i == 220 ? 1.04 : i == 230 ? 1.02 : i == 240 ? 1.01 : 1));
            }
            continue;
        }
		exp[i] = Math.trunc(exp[i - 1] * (i < 210 ? 1.2 : i < 220 ? 1.06 : i < 230 ? 1.04 : i < 240 ? 1.02 : i < 250 ? 1.01 : 1));
    }
	exp[250] = 0;
	return exp;
}

module.exports = {
	CharacterStat,
	$RemotePlayerData, $PlayerData, $ExportData_Equip
};
