﻿
import { PlayerStat, $RemotePlayerData, $PlayerData } from "../../Client/PlayerStat";

export class $RequestPacket_SelectChara {
	constructor() {
		/** @type {string} */
		this.charaId = undefined;
	}
}
export class $ResponsePacket_SelectChara {
	constructor() {
		/** @type {$PlayerData} */
		this.charaData = null;

		/** @type {$RemotePlayerData[]} */
		this.remoteCharacters = null;
	}
}