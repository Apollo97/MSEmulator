
import io from "socket.io-client";

import { GameStateManager } from "../game/GameState.js";

import { SceneMap } from "../game/Map.js";
import { SceneCharacter, SceneRemoteCharacter } from "../game/SceneCharacter.js";

import { CharacterMoveElem, MobMoveElem } from "../Common/PMovePath.js";//debug
import { $RequestPacket_SelectChara, $ResponsePacket_SelectChara,
		 $Packet_RemoteChat,
		 $Packet_CharacterMove,
		} from "../Common/Packet";//debug

import { $PlayerData, $RemotePlayerData } from "../Common/PlayerData.js";

import { app as gApp } from "../index.js";//debug

class $Socket {
	/**
	 * socket.emit(eventName[, ...args])
	 * return server answer
	 * @param {string} eventName
	 * @param {any} data
	 * @returns {Promise<any>}
	 */
	emit(eventName, data) {
	}
	on(eventName, callback) {
	}
	once(eventName, data) {
	}
}

export class Client {
	constructor() {
		/** @type {$Socket} */
		this.socket = null;

		/** @type {{[id:string]:SceneCharacter}} */
		this.charaMap = {};
	}

	/**
	 * @param {string} charaId
	 * @param {function(SceneCharacter)} cbfunc
	 */
	_findChara(charaId, cbfunc) {
		if (process.env.NODE_ENV !== 'production') {
			if (typeof cbfunc != 'function') {
				throw new TypeError();
			}
		}
		/** @type {SceneCharacter} */
		let chara = this.charaMap[charaId];

		if (chara) {
			cbfunc.call(this, chara);
		}
		//else {
		//	alert(`chara['${charaId}'] not exist`);
		//}
	}
	/**
	 * _addRemoteCharaPacketListener(eventName, fnAck(...))
	 * @param {string} eventName
	 * @param {function(...any, function(...any):void)} listener
	 */
	_addRemoteCharaPacketListener(eventName, listener) {
		this.socket.on(eventName, (...args) => {
			/** @type {string} */
			let charaId = args[0].id;

			/** @type {SceneCharacter} */
			let chara = this.charaMap[charaId];

			if (chara) {
				listener.call(this, chara, ...args);//listener(chara, packet[, ...packet], fnAck)
			}
			//else {
			//	alert(`chara['${charaId}'] not exist`);
			//}
		});
	}
	
	/**
	 * @type {string} server_href
	 * @returns {Promise<$Socket>}
	 */
	async connect(server_href) {
		try {
			return await new Promise((resolve, reject) => {
				let socket;

				socket = io(server_href, {
					reconnection: true,
					reconnectionDelay: 1000,//1second
					reconnectionAttempts: 30,//5minute
				});

				socket.on("connect_error", error => {
					socket.disconnect();
					reject(error);
				});
				socket.on("disconnect", () => {
					//window.location.reload();
				});
				socket.on("connect", () => {
					this.socket = socket;

					window.$io = this.socket;

					const emit = socket.$emit = socket.emit;

					socket.emit = function (eventName, data) {
						//let cbfunc = arguments[arguments.length - 1];
						//if (typeof cbfunc == 'function') {
						//	emit(eventName, data, cbfunc);
						//}
						//else {
						return new Promise(function (resolve, reject) {
							emit.call(socket, eventName, data, function (...args) {
								resolve.apply(this, args);
							});
						});
						//}
					};

					resolve(socket);
				});
			});
		}
		catch (ex) {
			throw ex;
		}
	}

	/** @type {SceneMap} */
	get $scene_map() {
		return window.scene_map;
	}

	/**
	 * @param {string} account
	 * @param {string} password
	 */
	async login(account, password) {
		let result = await this.socket.emit("login", {
			account: account,
			password: password,
		});
		if (result) {
			console.info("login");
		}
		else {
			console.info("login failed");
		}
		return result;
	}
	/**
	 * @param {number} world
	 * @param {number} channel
	 */
	async selectWorld(world, channel) {
		let result = await this.socket.emit("selectWorld", {
			world: 0,
			channel: 0,
		});
		if (result) {
			console.info("selectWorld");
		}
		else {
			console.info("selectWorld failed");
		}
	}
	/**
	 * @param {any} charID
	 */
	async selectChara(charID) {
		/** @type {$RequestPacket_SelectChara} */
		let req = new $RequestPacket_SelectChara();
		
		/** @type {$Packet_SelectChara} */
		let ackPacket = await this.socket.emit("selectChara", {
			id: charID,
		});
		const charaData = ackPacket.charaData;
		const remoteCharacters = ackPacket.remoteCharacters;

		if (charaData) {
			try {
				await this.$scene_map.load(charaData.mapId);
				
				let task1 = this._CreateMyCharacter(charaData);
				let task2 = this.onEnterRemoteChara(remoteCharacters);
				
				await Promise.all([task1, task2]);

				this.chara.$state = charaData;

				this.chara.$state.mapId = await this.socket.emit("enterMap", {
					mapId: charaData.mapId,
				});
			}
			catch (ex) {
				console.error(ex);
			}
		}
		else {
			alert("selectChara: chara not exist");
		}
	}

	/**
	 * online mode
	 * @param {$PlayerData} charaData
	 */
	async _CreateMyCharacter(charaData) {
		/** @type {SceneCharacter} */
		let chara = await gApp.store.dispatch('_createChara', {
			emplace: {
				id: charaData.id,
				//code: charaData.selectedItems ? Object.values(charaData.selectedItems).map(v => String(v.itemId).padStart(8, "0")) : charaData.equips_code,
				//fromData: new Error("未完成: _CreateMyCharacter(charaData:$PlayerData)"),
				data: charaData,
			}
		});
		this.chara = chara;

		chara._$data = chara._$data || {
			guildId: "",//guildId == guildName
			partyId: "",//partyId == partyName
		}
	}

	/**
	 * offline mode
	 * @static
	 * @param {$PlayerData} charaData
	 */
	static async _CreateMyCharacter(charaData) {//??
		/** @type {SceneCharacter} */
		let chara = await gApp.store.dispatch('_createChara', {
			emplace: {
				id: charaData.id,
				//code: charaData.selectedItems ? Object.values(charaData.selectedItems).map(v => String(v.itemId).padStart(8, "0")) : charaData.equips_code,
				//fromData: new Error("未完成: _CreateMyCharacter(charaData:$PlayerData)"),
				data: charaData,
			}
		});
		chara = chara;
	
		chara._$data = chara._$data || {
			guildId: "",//guildId == guildName
			partyId: "",//partyId == partyName
		}

		if (scene_map) {
			scene_map.addChara(chara, {
				randomSpawn: true,
			});
		}
		else {
			debugger;
		}
	
		return chara;
	}

	/**
	 * @param {$RemotePlayerData[]} packet - characters
	 * @returns {Promise<void>}
	 */
	onEnterRemoteChara(packet) {
		const characters = packet;

		let tasks = characters.map(charaData => {
			return gApp.store.dispatch('_createChara', {
				remote_chara: {
					id: charaData.id,
					//code: charaData.selectedItems ? Object.values(charaData.selectedItems).map(v => String(v.itemId).padStart(8, "0")) : charaData.equips_code,
					//fromData: new Error("未完成: onEnterRemoteChara(packet:$PlayerData[])"),
					data: charaData,
				}
			}).then((...args) => {
				try {
					const world = this.$scene_map.controller;

					/** @type {SceneRemoteCharacter} */
					let chara = args[0];

					this.charaMap[chara.id] = chara;
				}
				catch (ex) {
					alert(err.message);
					console.error(err);
				}
			});
		});
		return Promise.all(tasks);
	}

	/**
	 * @param {{ id: string }} packet
	 */
	onLeaveRemoteChara(packet) {
		const remoteId = packet.id;

		gApp.store.dispatch('deleteCharacter', {
			id: remoteId,
			leave: true,
		}).then(() => {
			console.log("onLeaveRemoteChara[%o]", remoteId);
		}, (reason) => {
			console.log("onLeaveRemoteChara[%o]: %o", remoteId, reason);
		});
		delete this.charaMap[packet.id];
	}

	/**
	 * @param {MobMoveElem} packet
	 */
	onMobMove(packet) {
		/** @type {SceneMap} */
		let scene_map = window.scene_map;

		if (!this.chara) {
			console.warn("");
			return;
		}

		/*if (this.chara.$objectid == packet.controllerOwner) {
		}
		else */if (true) {
			const elements = packet.elements;
			scene_map.lifeMgr.entities.forEach(life => {
				const elem = elements[life.$objectid];
				if (life.spawn.type == "m" && elem) {
					/** @type {MapMob} *///SceneMob
					const mob = life;
					mob.$controllerOwner = packet.controllerOwner;
					mob.$move(elem);
				}
			});
		}
		else {
			let arr = new Int32Array(packet.elements);
			let elements = {};

			for (let i = 0; i < arr.length; i += 3) {
				elements[arr[i]] = {
					x: arr[i + 1] / $gv.CANVAS_SCALE,
					y: arr[i + 2] / $gv.CANVAS_SCALE,
				};
			}

			scene_map.lifeMgr.entities.forEach(life => {
				const elem = elements[life.$objectid];
				if (life.spawn.type == "m" && elem) {
					/** @type {MapMob} *///SceneMob
					const mob = life;
					mob.$controllerOwner = packet.controllerOwner;
					mob.$move(elem);
				}
			});
		}
	}

	/**
	 * @param {SceneCharacter} chara
	 * @param {$Packet_RemoteChat} packet
	 * @param {function(...any):void} fnAck
	 */
	onRemoteChat(chara, packet, fnAck) {
		chara.chatCtrl.style = packet.style;
		chara.chatCtrl.enter(packet.text);
		app.vue.$refs.statusBar.pushChatHistory(packet.type, packet.style, packet.text);
	}
	/**
	 * @param {SceneCharacter} chara
	 * @param {$Packet_CharacterMove} packet
	 * @param {function(...any):void} fnAck
	 */
	onRemoteCharaMove(chara, packet, fnAck) {
		chara.$move(packet);
	}
	/**
	 * @param {SceneCharacter} chara
	 * @param {$Packet_RemoteCharaAnim} packet
	 * @param {function(...any):void} fnAck
	 */
	onRemoteCharaAnim(chara, packet, fnAck) {
		chara.$anim(packet);
	}

	/**
	 * @param {SceneCharacter} chara
	 * @param {} packet
	 * @param {function(...any):void} fnAck
	 */
	onRemoteCharaSkill(chara, packet, fnAck) {
		chara.invokeSkill(packet.skillId);
	}

	/**
	 * @param {SceneCharacter} chara
	 * @param {} packet
	 * @param {function(...any):void} fnAck
	 */
	onRemoteAvatarModified(chara, packet, fnAck) {
		let item = chara.renderer.use(packet.itemId);
		item.set
	}

	async $test() {
		this.socket.on("enterRemoteChara", this.onEnterRemoteChara.bind(this));
		this.socket.on("leaveRemoteChara", this.onLeaveRemoteChara.bind(this));

		this.socket.on("mobMove", this.onMobMove.bind(this));

		this._addRemoteCharaPacketListener("remoteChat", this.onRemoteChat);
		this._addRemoteCharaPacketListener("remoteCharaMove", this.onRemoteCharaMove);
		this._addRemoteCharaPacketListener("remoteCharaAnim", this.onRemoteCharaAnim);
		this._addRemoteCharaPacketListener("remoteCharaSkill", this.onRemoteCharaSkill);
		this._addRemoteCharaPacketListener("remoteAvatarModified", this.onRemoteAvatarModified);

		await this.selectWorld(0, 0);

		await this.selectChara(0);
	}
}



