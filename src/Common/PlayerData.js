
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

//?? packet
class $RemotePlayerData {
	constructor() {
		/** @type {string} */
		this.id = undefined;

		/** @type {string} */
		this.equips_code = null;
		
		
		/** @type {string} */
		this.chatBalloonStyle = 0;
		
		/** @type {string} */
		this.labelStyle = 0;
		
		/** @type {string} */
		this.damageSkin = "default";
	}
}
//?? packet
class $PlayerData extends $RemotePlayerData {
	constructor() {
		super();
		/** @type {CharacterStat} */
		this.stat = undefined;
	}

	getRemoteData() {
		return {
			id: this.id,
			mapId: this.mapId,
			equips_code: this.equips_code,
		};
	}
}

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
	$RemotePlayerData, $PlayerData,
};
