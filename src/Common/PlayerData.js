
class CharacterStat {
	constructor() {
		this.hp = 8855;
		this.mp = 5246;
		this.mhp = 28855;
		this.mmp = 25246;
		this.exp = 50;

		this.level = 150;
		this.str = 123;
		this.luk = 4;
		this.dex = 999;
		this.int = 4;
		this._job = 3;
		this._spec_job = 3;

		/** @type {number} - 最大屬性攻擊 */
		this.currentMaxBaseDamage = 10000;

		/** @type {number} - 最小屬性攻擊 */
		this.currentMinBaseDamage = 1000;

		/** @type {number} - 爆擊率 0~100 */
		this.critRate = 50;

		/** @type {number} - 最大爆擊傷害 0~100 */
		this.maxCritDamage = 80;

		/** @type {number} - 最小爆擊傷害 0~100 */
		this.minCritDamage = 40;
	}

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

class $RemotePlayerData {
	constructor() {
		/** @type {string} */
		this.id = undefined;

		/** @type {string} */
		this.equips_code = null;
	}
}
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
