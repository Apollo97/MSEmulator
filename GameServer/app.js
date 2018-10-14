
const CLIENT_VERSION = "181014a";

const GAME_DATA_VERSION = (function () {
	try {
		return require("../public/version.json");//realtime read data
	}
	catch (ex) {
		return "STATIC";//game data from json file
	}
})();
const GAME_SERVER_VERSION = "0.0.4.0";

let PORT;
if (process.env.NODE_ENV === "production") {
	PORT = process.env.PORT || 8787;
}
else {
	PORT = 8787;
}

//let express = require('express');
const http = require("http");
const SocketIO = require("socket.io");
const fs = require("fs");
const path = require("path");

const { PPlayerState } = require("../src/game/Physics/PPlayerState.js");

const { $PlayerData, $RemotePlayerData, $ExportData_Equip } = require("../src/Common/PlayerData.js");
const { BaseMoveElem, CharacterMoveElem, MobMoveElem } = require("../src/Common/PMovePath.js");
//const { AttackInfo } = require("./src/Common/AttackInfo.js");

const { ItemCategoryInfo, EquipSlotsMap } = require("../src/Common/ItemCategoryInfo.js");


//let app = express();
let server = new http.Server(/*app*/);
let io = SocketIO(server);

const $DATA_PATH = "../public/data";

/**
 * @param {string} filename
 */
function $getData(filename) {
	return new Promise(function (resolve, reject) {
		fs.readFile(path.join(__dirname, $DATA_PATH, filename), function (err, data) {
			if (err) {
				return reject(err);
			}
			try {
				let obj = JSON.parse(data);
				resolve(obj);
			}
			catch (ex) {
				reject(ex);
			}
		});
	});
}
/**
 * @param {string} filename
 */
function $getDataSync(filename) {
	return require(path.join(__dirname, $DATA_PATH, filename));
}


class SceneObjectState extends PPlayerState {
}


class World {
	getChannel() {
	}
}


class Channel {
	getField() {
	}
}


class Field {
	constructor() {
		/** @type {string} */
		this.mapId = null;

		/** @type {{}} */
		this.data = null;

		/** @type {{[sceneObjectId:number]:SceneObjectState}} */
		this.sceneObject = [];

		/** @type {{[id:string]:Client}} */
		this.clients = null;
	}

	/**
	 * @param {Client} client
	 */
	join(client) {
		if (client.field) {
			client.field.leave(client);
		}
		else {
			console.error(new TypeError("chara.field"));
		}

		this.leave(client);
		
		client.socket.join(this.mapId);

		this.clients[client.chara.id] = client;
	}

	/**
	 * @param {Client} client
	 */
	leave(client) {
		delete this.clients[client.chara.id];
		client.field = null;
	}

	/**
	 * @param {string} id
	 * @returns {Character}
	 */
	getChara(id) {
		return this.clients[id].chara;
	}

	/**
	 * @param {string} mapId
	 */
	load(mapId) {
		this.mapId = mapId;

		if (typeof mapId != "string") {
			throw new TypeError("mapId");
		}
		//this.data = $getDataSync(path.join("Map", "Map", "Map" + mapId[0], mapId));
	}

	/**
	 * @param {string} mapId
	 * @returns {Field}
	 */
	static getInstance(mapId) {
		/** @type {Field} */
		let field = Field.instance[mapId];
		if (!field) {
			field = new Field();
			field.load(mapId);
		}
		return field;
	}
}
/** @type {{[mapId:string]Field}} */
Field.instance = {};


class AccountsData {
	constructor() {
		/** @type {string} */
		this.account = null;

		/** @type {string} */
		this.password = null;

		/** @type {{[charaId:string]:$PlayerData}} */
		this.characters = null;

		/** @type {Client} */
		this.client = null;

		this._init();
	}

	_init() {
		this.characters = {};
	}
}

class Character extends $PlayerData {
	constructor() {
		super();
	}
	/**
	 * @param {$PlayerData} data
	 * @returns {Character}
	 */
	static from(data) {
		let chara = new Character();
		Object.assign(chara, data);
		return chara;
	}
	///**
	// * @param {$PlayerData} data
	// */
	//constructor(data) {
	//	super();
	//	this.data = data;
	//}
}


/** @type {Map<string,AccountsData>} */
const accountsData = new Map();


/** @type {Map<string,Client>} */
const $clients = new Map();
let client_number = 0;


/** @type {{[mapId:string]:{[objectId:number]:{}}}} */
const sceneObjectState = {
};

let default_mapId = "100020000";//"000000000"


const chatLog = [];

const isWriteLog = false;


let repl_context = (function () {
	if (process.env.NODE_ENV !== "production") {
		let repl = require('repl');
		let repl_context = repl.start({ prompt: '> ' }).context;
		Object.defineProperties(repl_context, {
			io: {
				get: function () {
					return $clients;
				},
				set: function (value) {
					console.log("error: clients no getter.");
				},
				enumerable: true,
			},

			accountsData: {
				get: function () {
					return accountsData;
				},
			},
			clients: {
				get: function () {
					return $clients;
				},
			},
			client_number: {
				get: function () {
					return client_number;
				},
			},
			sceneObjectState: {
				get: function () {
					return sceneObjectState;
				},
			},

			chatLog: {
				get: function () {
					return chatLog;
				},
			},

			mapId: {
				enumerable: true,
				writable: true,
				set: function (val) {
					default_mapId = val;
				},
				get: function () {
					return default_mapId;
				},
			},
			isWriteLog: {
				enumerable: true,
				writable: true,
				set: function (val) {
					isWriteLog = val;
				},
				get: function () {
					return isWriteLog;
				},
			},
		});
		return repl_context;
	}
})();

class Client {
	/**
	 * @param {SocketIO.Socket} socket
	 */
	constructor(socket) {
		/** @type {SocketIO.Socket} */
		this.socket = socket;

		/** @type {AccountsData} */
		this.accountData = null;

		/** @type {number} number */
		this.world = null;

		/** @type {number} number */
		this.channel = null;

		this.addLoginListeners();

		this.addWorldListeners();

		this.addGameListeners();
	}

	addLoginListeners() {
		this.on("login", this.onLogin);
	}
	removeLoginListeners() {
		socket.removeAllListeners(["login"]);
	}

	addWorldListeners() {
		this.on("selectWorld", this.onSelectWorld);
		this.on("selectChara", this.onSelectChara);
	}
	removeWorldListeners() {
		socket.removeAllListeners(["selectWorld", "selectChara"]);
	}

	addGameListeners() {
		this.on("chat", this.onChat);

		this.on("enterMap", this.onEnterMap);
		this.on("charaMove", this.onCharaMove);
		this.on("charaAnim", this.onCharaAnim);

		this.on("useItem", this.onUseItem);

		this.on("skill", this.onSkill);
		this.on("attack", this.onAttack);

		this.on("mobMove", this.onMobMove);
	}
	removeGameListeners() {
		socket.removeAllListeners([
			"chat",
			"enterMap", "charaMove", "charaAnim",
			"useItem",
			"skill", "attack",
			"mobMove"
		]);
	}
	
	_onLogout() {
		const chara = this.chara;

		this.save();

		if (chara) {
			const charaId = chara.id;

			console.log(`chara[${charaId}] _onLogout`);

			this._onLeaveMap();

			this.socket.broadcast.emit("leaveRemoteChara", {
				id: chara.id,
			});
		}
		if (this.accountData) {
			this.accountData.client = null;
		}
	}

	_onLeaveMap() {
		const chara = this.chara;
		const charaId = this.chara.id;
		const sceneObjects = sceneObjectState[this.accountData.mapId];
		let nextOwnerId;

		console.log(`chara[${charaId}] _onLeaveMap`);

		$clients.forEach((client, remoteId) => {
			if (this != client) {
				nextOwnerId = client.id;
			}
		});

		for (let sceneObjectId in sceneObjects) {
			let sceneObject = sceneObjects[sceneObjectId];
			if (chara.id == sceneObject.controllerOwner) {
				sceneObject.controllerOwner = nextOwnerId;
			}
		}

		this._broadcastMobs();
	}

	/**
	 * @param {string|symbol} event
	 * @param {(packet: {}, fnAck: (...args) => void) => void} listener
	 */
	on(event, listener) {
		////if (process.env.NODE_ENV === 'production') {
		////	this.socket.on(event, listener.bind(this));
		////}
		////else {
		//if (needLogin) {
		//	this.socket.on(event, (packet, fnAck) => {
		//		if (this.isLogin) {
		//			writeLog(this.id, event, packet);
		//			try {
		//				return listener.call(this, packet, fnAck);
		//			}
		//			catch (ex) {
		//				console.error(event, ex);
		//			}
		//		}
		//		else {
		//			console.log(this.id, " ", event, " need login");
		//			writeLog(this.id, event, packet);
		//		}
		//	});
		//}
		//else {
		//	this.accountData.chara
		//	this.socket.on(event, (packet, fnAck) => {
		//		writeLog(this.id, event, packet);
		//		try {
		//			return listener.call(this, packet, fnAck);
		//		}
		//		catch (ex) {
		//			console.error(event, ex);
		//		}
		//	});
		//}
		////}
		
		this.socket.on(event, (packet, fnAck) => {
			const id = this.accountData ? this.chara ? this.chara.id : this.socket.id : this.socket.id;

			writeLog(id, event, packet);

			try {
				return listener.call(this, packet, fnAck);
			}
			catch (ex) {
				console.error(event, ex);
			}
		});

		function writeLog(receiver, event, packet) {
			if (isWriteLog) {
				let date = new Date();
				console.log(`${date.toUTCString()} [${receiver}]: ${event}`/*, packet*/);
			}
		}
	}

	onLogin(packet, fnAck) {
		if (this.accountData) {
			console.log("already login");
			return;
		}
		let accountData = accountsData.get(packet.account);

		if (accountData) {
			if (packet.password == accountData.password) {
				this.accountData = accountData;
			}
			else {
				console.log("login failed: ", packet);
				fnAck(false);
				return;
			}
		}
		else {//auto create account
			this.accountData = accountData = new AccountsData();
			accountData.account = packet.account;
			accountData.password = packet.password;

			accountsData.set(accountData.account, accountData);

			console.log("create account: ", packet);
		}
		if (accountData) {
			accountData.client = this;

			console.log("login success: ", packet);

			fnAck(true);
		}
		else {
			console.error("Unknow error: accountData");

			fnAck(false);
		}
	}

	onSelectWorld(packet, fnAck) {
		this.world = packet.world;
		this.channel = packet.channel;
		fnAck(true);//charaList
	}

	save() {
		if (this.accountData) {
			//accountsData.set(this.accountData.account, this.accountData);
			this.accountData.characters[this.chara.id] = this.chara;
		}
	}
	
	createCharacter() {
		const mapId = default_mapId || "100020000";//"000000000"
		//const $$aa = [
		//	"c,00002012,00012012,00026509|00026509,00034873|00034873,01051429,01072392"
		//	, "c,00002000,00012000,00025346|00025346,00044591,01051469,01072392"
		//	, "c,00002012,00012012,00026539|00026539,00044833,01012083,01051437,01071078"
		//	, "c,00002000,00012000,00024163|00024163,00044847,01012083,01051529,01071110"
		//];

		let charaData = new $PlayerData();


		const id = "chara_" + (++client_number);

		charaData.id = id;//id == name

		//charaData.equips_code = $$aa[client_number % $$aa.length];
		charaData.$usePreset(client_number);
		charaData.mapId = mapId;

		console.log(`create chara[${id}] enter`);

		this.accountData.characters[id] = charaData;

		return charaData;
	}

	onSelectChara(packet, fnAck) {
		//let charaData = this.accountData.characters[packet.id];
		let charaData = Object.values(this.accountData.characters)[0];

		if (!charaData) {
			charaData = this.createCharacter();
		}
		this.chara = Character.from(charaData);

		/** @type {Character} */
		let chara = this.chara;

		if (chara.guildId) {
			this.socket.join(chara.guildId);//guildId == guildName
		}
		if (chara.partyId) {
			this.socket.join(chara.partyId);//partyId == partyName
		}

		this.save();//this.accountData.characters[this.chara.id] = this.chara;

		fnAck({
			charaData: chara,
			remoteCharacters: this.enumEnterRemoteCharaData($clients),
		});

		this.socket.broadcast.emit("enterRemoteChara", [chara.getRemoteData()]);
		
		console.log(`chara[${chara.id}] enter`);
	}

	onEnterMap(packet, fnAck) {
		fnAck(true);
		this._controllerMobs();
		this._broadcastMobs();
	}

	onChat(packet, fnAck) {
		const chara = this.chara;
		{
			const logText = `chara[${chara.id}]: ${packet.text}`;

			console.log(logText);

			if (chatLog.length >= 100) {
				chatLog.shift();
			}

			chatLog.push(`<div>${logText}</div>`);
		}

		packet.id = chara.id;

		fnAck(true);
		this.socket.broadcast.emit("remoteChat", packet);
	}

	onCharaMove(packet, fnAck) {
		const chara = this.chara;

		/** @type {CharacterMoveElem} */
		let data = packet;

		data.id = chara.id;

		//update position
		chara.position.x = data.x;
		chara.position.y = data.y;

		this.socket.broadcast.emit("remoteCharaMove", data);
	}

	//TODO: ??
	onCharaAnim(packet, fnAck) {
		const chara = this.chara;

		console.log("onCharaAnim: %o", packet);
	}

	/**
	 * @param {{itemId:string}} packet
	 * @param {any} fnAck
	 */
	onUseItem(packet, fnAck) {
		const chara = this.chara;
		const charaId = this.chara.id;

		let data = $ExportData_Equip.from(packet);

		if (data.itemId[0] == "0") {//equip
			const slot = EquipSlotsMap.itemIdToSlot("Equip", packet.itemId);
			if (!chara.equipSlots) {
				console.error(new TypeError("chara.equipSlots"));
			}
			if (slot) {
				console.log(`chara[${charaId}].equipSlots.Equip[${slot}].id => ${packet.itemId}`);

				chara.equipSlots.Equip[slot] = data;
			}
			else {
				const nItemId = Number(data.itemId);

				if (ItemCategoryInfo.isBody(nItemId)) {
					console.log(`chara[${charaId}].body.id => ${packet.itemId}`);
					chara.body = data;
				}
				if (ItemCategoryInfo.isHead(nItemId)) {
					console.log(`chara[${charaId}].head.id => ${packet.itemId}`);
					chara.head = data;
				}
				else if (ItemCategoryInfo.isFace(nItemId)) {
					console.log(`chara[${charaId}].face.id => ${packet.itemId}`);
					chara.face = data;
				}
				else if (ItemCategoryInfo.isHair(nItemId)) {
					console.log(`chara[${charaId}].hair.id => ${packet.itemId}`);
					chara.hair = data;
				}
			}

			fnAck(true);

			let outputData = Object.assign({ id: chara.id }, data);

			this.socket.broadcast.emit("remoteAvatarModified", outputData);
		}
		else {
			fnAck(false);
		}
	}

	onSkill(packet, fnAck) {
		const chara = this.chara;

		let data = packet;

		data.id = chara.id;
		//data.skillId

		fnAck(true);

		this.socket.broadcast.emit("remoteCharaSkill", data);
	}

	onAttack(packet, fnAck) {
		const chara = this.chara;

		let data = packet;

		///** @type {AttackInfo[]} */
		//const attack = data.attack;

		data.id = chara.id;

		fnAck(true);

		this.socket.broadcast.emit("remoteCharaAttack", data);
	}

	onMobMove(packet, fnAck) {
		const chara = this.chara;

		const { mapId } = chara;

		/** @type {MobMoveElem[]} */
		const mobs = packet.elements;

		let sceneObjects = sceneObjectState[mapId];
		if (!sceneObjects) {
			sceneObjects = sceneObjectState[mapId] = {};
		}

		for (let sceneObjectId in mobs) {
			/** @type {$MobState} */
			let mobState = sceneObjects[sceneObjectId];
			if (!mobState) {
				mobState = sceneObjects[sceneObjectId] = {};//new PPlayerState();
			}

			let mobMove = mobs[sceneObjectId];

			updateMobState(mobState, mobMove);

			mobState.controllerOwner = packet.controllerOwner;
		}

		this.socket.broadcast.emit("mobMove", packet);
	};

	/**
	 * @param {Map<string,Client>} clients
	 */
	enumEnterRemoteCharaData(clients) {
		let characters = [];

		clients.forEach((client, remoteId) => {
			if (this != client) {
				const accountData = client.accountData;
				if (accountData) {//this.isLogin == true
					const chara = client.chara;

					if (chara) {//is connect ot game server
						let data = chara.getRemoteData();
						characters.push(data);
					}
				}
			}
		});

		return characters;
	}

	_controllerMobs() {
		const chara = this.chara;

		let sceneObjects = sceneObjectState[chara.mapId];

		for (let sceneObjectId in sceneObjects) {
			const sceneObject = sceneObjects[sceneObjectId];

			if (sceneObject.controllerOwner == null) {
				sceneObject.controllerOwner = chara.id;
			}
		}
	}

	_broadcastMobs() {
		const chara = this.chara;

		let sceneObjects = sceneObjectState[chara.mapId];
		/** @type {Map<string,{id:string,elements:{[sceneObject:string]:MobMoveElem}}>} */
		let mobMovePackets = new Map();

		for (let sceneObjectId in sceneObjects) {
			const sceneObject = sceneObjects[sceneObjectId];
			let controllerOwner = sceneObject.controllerOwner;

			if (controllerOwner != null) {
				let mobMovePacket = mobMovePackets.get(controllerOwner);
				if (!mobMovePacket) {
					mobMovePacket = {
						controllerOwner: controllerOwner,
						elements: {},
					};
					mobMovePackets.set(controllerOwner, mobMovePacket);
				}

				mobMovePacket.elements[sceneObjectId] = sceneObject;
			}
		}

		let i = 0;
		mobMovePackets.forEach(mobMovePacket => {
			this.socket.broadcast.emit("mobMove", mobMovePacket);
		});
	}
}

function updateMobState(mob, data) {

	//mob.isAwake = data.isAwake;

	if (data.pState) {
		if (!mob.pState) {
			mob.pState = {};
		}
		Object.assign(mob.pState, data.pState);
	}

	if (data.actionkey) {
		if (!mob.actionkey) {
			mob.actionkey = {};
		}
		Object.assign(mob.actionkey, data.actionkey);
	}

	if (data.x != null && data.y != null) {
		mob.x = data.x;
		mob.y = data.y;
	}

	if (data.vx != null && data.vy != null) {
		mob.vx = data.vx;
		mob.vy = data.vy;
	}
}

io.on("connection", function (socket) {
	const id = socket.id;

	console.log(`socket[${id}] connected`);
	
	const client = new Client(socket);
	$clients.set(id, client);

	socket.on("disconnect", function () {

		client._onLogout();

		$clients.delete(id);

		//if (!$clients.size) {
		//	client_number = 0;
		//}

		console.log(`socket[${id}] disconnected`);
	});

	socket.on("version", function (packet, fnAck) {
		fnAck({
			gameServerVersion: GAME_SERVER_VERSION,
		});
	});
});

const os = require("os");

server.on("request", onRequest);

/**
 * @param {http.IncomingMessage} request
 * @param {http.ServerResponse} response
 */
function onRequest(request, response) {
	switch (request.url) {
		case "/sys/info":
			response.setHeader("Content-Type", "application/json; charset=utf-8");
			response.setHeader("Access-Control-Allow-Origin", "*");
			response.setHeader("Cache-Control", "public, max-age=0");
			response.statusCode = 200;
			response.end(JSON.stringify({
				arch: os.arch(),
				cpus: os.cpus(),
				freemem: os.freemem(),
				homedir: os.homedir(),
				hostname: os.hostname(),
				loadavg: os.loadavg(),
				networkInterfaces: os.networkInterfaces(),
				platform: os.platform(),
				release: os.release(),
				tmpdir: os.tmpdir(),
				totalmem: os.totalmem(),
				type: os.type(),
				userInfo: os.userInfo(),
			}, null, "\t"));
			break;
		case "/chat/log":
			response.end(chatLog.join(""));
			break;
	}
}

server.listen(PORT, function () {
	console.log("listening on ?:" + PORT);
});

