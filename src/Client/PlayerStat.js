
import { PlayerStatBase } from "../Common/PlayerData.js";


export class PlayerStat extends PlayerStatBase {
	constructor() {
		super();
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

