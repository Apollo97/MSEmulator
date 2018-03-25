
import { GameStateManager } from "../game/GameState.js";

import { SceneMap } from "../game/Map.js";
import { SceneCharacter } from "../game/SceneCharacter.js";

import { CharaMoveElem } from "../Client/PMovePath";//debug

import gApp from "../app.js";//debug

//(function (window) {
//	let elemSc = document.getElementById("io");
//	function conn_io() {
//		return new Promise(function (resolve, reject) {
//			if (!elemSc) {
//				elemSc = document.createElement("SCRIPT");
//				elemSc.id = "io";
//				elemSc.src = "//localhost:8787/socket.io/socket.io.js";
//				elemSc.onload = function () {
//					resolve(true);
//				};
//				document.body.append(elemSc);
//			}
//			else {
//				resolve(true);
//			}
//		});
//	};
//	conn_io().then(function () {
//		let socket = io("//localhost:8787");
//		socket.emit("chat", "hello");
//		socket.on("gWvs", function (msg) {
//			console.log("gWvs: " + msg);
//		});
//	});
//
//	window.$io = socket;
//})(window);

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

class $CharacterData {
	constructor() {
		this.id = "";
		this.equips_code = "";
	}
}
class $RemoteCharacterData {
	constructor() {
		/** @type {string} */
		this.id = null;

		/** @type {string} */
		this.equips_code = null;
	}
}
class $Packet_SelectChara {
	constructor() {
		/** @type {$CharacterData} */
		this.charaData = null;

		/** @type {$RemoteCharacterData[]} */
		this.remoteCharacters = null;
	}
}
class $Packet_RemoteCharaMove {
	constructor() {
		/** @type {string} */
		this.id = null;

		/** @type {CharaMoveElem[]} */
		this.path = null;
	}
}

class RemoteCharaAnim {
	constructor() {
		/** @type {string} */
		this.action = null;

		/** @type {number} */
		this.action_frame = null;

		/** @type {string} */
		this.emotion = animnull;

		/** @type {number} */
		this.emotion_frame = null;
	}
}

class $Packet_RemoteCharaAnim {
	constructor() {
		/** @type {string} */
		this.id = null;

		/** @type {RemoteCharaAnim[]} */
		this.anim = null;
	}
}

export class Client {
	constructor() {
		/** @type {$Socket} */
		this.socket = this._conn();
		window.$io = this.socket;

		/** @type {{[id:string]:SceneCharacter}} */
		this.charaMap = [];
	}

	/** @returns {$Socket} */
	_conn() {
		let socket;

		if (window.io != null) {
			socket = io("//localhost:8787");

			const emit = socket.emit;

			socket.emit = function (eventName, data) {
				//let cbfunc = arguments[arguments.length - 1];
				//if (typeof cbfunc == 'function') {
				//	emit(eventName, data, cbfunc);
				//}
				//else {
				return new Promise(function (resolve, reject) {
					emit.call(socket, eventName, data, function () {
						resolve.apply(this, arguments);
					});
				});
				//}
			};
		}
		else {
			socket = {
				emit() {
					return true;
				},
				on() {
					return true;
				},
				once() {
					return true;
				},
			};
		}

		return socket;
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
			account: "aaa",
			password: "aaa",
		});
		if (result) {
			console.info("login");
		}
		else {
			console.info("login failed");
		}
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
		/** @type {$Packet_SelectChara} */
		let ackPacket = await this.socket.emit("selectChara", {
			id: 123,
		});
		const charaData = ackPacket.charaData;
		const remoteCharacters = ackPacket.remoteCharacters;

		if (charaData) {
			try {
				let chara = await gApp.store.dispatch('_createChara', {
					emplace: {
						id: charaData.id,
						code: charaData.equips_code,
					}
				});
				this.chara = chara;
				this.chara.$physics = this.$scene_map.controller.$createPlayer();

				this.$scene_map.load(charaData.mapId);
				
				this.onEnterRemoteChara(remoteCharacters);
			}
			catch (ex) {
				alert(err.message);
				console.error(err);
			}
		}
		else {
			alert("selectChara: chara not exist");
		}
	}
	/**
	 * @param {$RemoteCharacterData[]} packet - characters
	 */
	onEnterRemoteChara(packet) {
		const that = this;
		const characters = packet;

		for (let charaData of characters) {
			gApp.store.dispatch('_createChara', {
				remote_chara: {
					id: charaData.id,
					code: charaData.equips_code,
				}
			}).then(function (arg0) {
				try {
					const scene = that.$scene_map.controller;

					/** @type {SceneCharacter} */
					let chara = arg0;

					chara.$physics = scene.$createPlayer();

					that.charaMap[chara.id] = chara;
				}
				catch (ex) {
					alert(err.message);
					console.error(err);
				}
			});
		}
	}
	/**
	 * @param {$Packet_RemoteCharaMove} packet
	 */
	onRemoteCharaMove(packet, fnAck) {
		/** @type {string} */
		let charaId = packet.id;

		/** @type {SceneCharacter} */
		let chara = this.charaMap[charaId];

		if (chara) {
			/** @type {CharaMoveElem[]} */
			let elems = packet.path;

			chara.$move(elems);
		}
		//else {
		//	alert(`chara['${charaId}'] not exist`);
		//}
	}
	/**
	 * @param {$Packet_RemoteCharaAnim} packet
	 */
	onRemoteCharaAnim(packet) {
		/** @type {string} */
		let charaId = packet.id;

		/** @type {SceneCharacter} */
		let chara = this.charaMap[charaId];

		if (chara) {
			chara.$anim(packet.anim);
		}
	}
	async $test() {
		this.socket.on("enterRemoteChara", this.onEnterRemoteChara.bind(this));
		this.socket.on("remoteCharaMove", this.onRemoteCharaMove.bind(this));
		this.socket.on("remoteCharaAnim", this.onRemoteCharaAnim.bind(this));

		await this.login("aaa", "aaa");

		await this.selectWorld(0, 0);

		await this.selectChara(0);
	}
}



