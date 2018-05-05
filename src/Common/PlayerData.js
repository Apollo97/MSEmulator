
class PlayerStatBase {
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
		/** @type {PlayerStat} */
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
	PlayerStatBase,
	$RemotePlayerData, $PlayerData,
};
