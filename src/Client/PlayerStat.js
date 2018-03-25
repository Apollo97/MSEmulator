
export class PlayerStat {
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

