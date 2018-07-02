
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

const symbol_job = Symbol("job");
const symbol_onJobChange = Symbol("onJobChange");

class CharacterStat extends CharacterBaseStat {
	constructor(sceneChara) {
		super();

		this._$sceneChara = sceneChara;

		this.level = 150;

		//this._job = 3;
		//this._spec_job = 3;

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

	/** @type {number} */
	get job() {
		return this[symbolStatJob];
	}
	set job(value) {
		this[symbolStatJob] = value;

		const onJobChange = this[symbol_onJobChange];

		if (_onJobChange) {
			_onJobChange()
		}
	}

	/** @param {function():void} cbfunc */
	onJobChange(cbfunc) {
		this[symbol_onJobChange] = cbfunc;
	}

	_getTotalAttack() {
		return 100;
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

//?? packet
class $RemotePlayerData {
	constructor() {
		/** @type {string} */
		this.id = undefined;

		/** @type {string} */
		this.equips_code = null;
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

module.exports = {
	CharacterStat,
	$RemotePlayerData, $PlayerData,
};
