
const CLIENT_VERSION = "181005a";

const GAME_DATA_VERSION = (function () {
	try {
		return require("../public/version.json");//realtime read data
	}
	catch (ex) {
		return "STATIC";//game data from json file
	}
})();
const GAME_SERVER_VERSION = "0.0.3a";

let PORT;
if (process.env.NODE_ENV === 'production') {
	PORT = process.env.PORT || 8787;
}
else {
	PORT = 8787;
}

//let app = require('express')();
let http = require('http').Server(/*app*/);
let SocketIO = require('socket.io');
let { $PlayerData } = require("../src/Common/PlayerData.js");
//let { AttackInfo } = require("./src/Common/AttackInfo.js");



let io = SocketIO(http);


/** @type {Map<string,Client>} */
let $clients = new Map();
let client_number = 0;


/** @type {{[mapId:string]:{[objectId:number]:{}}}} */
const sceneObjectData = {
};


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
	mapId: {
		enumerable: true,
		writable: true,
		value: "100020000"
	},
});

class Client {
	/**
	 * @param {string} id
	 * @param {SocketIO.Socket} socket
	 */
	constructor(id, socket) {
		/** @type {SocketIO.Socket} */
		this.socket = socket;
		
		this.id = id;

		/** @type {string} */
		this.account = null;

		/** @type {number} number */
		this.world = null;

		/** @type {number} number */
		this.channel = null;

		/** @type {$PlayerData} */
		this.chara = null;

		this.on("login", this.onLogin);
		this.on("selectWorld", this.onSelectWorld);
		this.on("selectChara", this.onSelectChara);

		this.on("chat", this.onChat);
		this.on("charaMove", this.onCharaMove);
		this.on("charaAnim", this.onCharaAnim);

		this.on("useItem", this.onUseItem);

		this.on("skill", this.onSkill);
		this.on("attack", this.onAttack);

		this.on("mobMove", this.onMobMove);
	}
	
	_onCharaLeave() {
		if (this.chara) {
			this.socket.broadcast.emit("leaveRemoteChara", {
				id: this.id,
			});
		}
	}

	/**
	 * @param {string|symbol} event
	 * @param {(packet: {}, fnAck: (...args) => void) => void} listener
	 */
	on(event, listener) {
		if (process.env.NODE_ENV === 'production') {
			this.socket.on(event, listener.bind(this));
		}
		else {
			this.socket.on(event, (packet, fnAck) => {
				let date = new Date();
				//console.log(`${date.toUTCString()} [${this.id}]: ${event}`/*, JSON.stringify(packet)*/);
				return listener.call(this, packet, fnAck);
			});
		}
	}

	onLogin(packet, fnAck) {
		this.account = packet.account;
		fnAck(true);
	}

	onSelectWorld(packet, fnAck) {
		this.world = packet.world;
		this.channel = packet.channel;
		fnAck(true);//charaList
	}

	onSelectChara(packet, fnAck) {
		const mapId = repl_context.mapId || "100020000";//"000000000"
		const $$aa = [
			"c,00002012,00012012,00026509|00026509,00034873|00034873,01051429,01072392"
			, "c,00002000,00012000,00025346|00025346,00044591,01051469,01072392"
			, "c,00002012,00012012,00026539|00026539,00044833,01012083,01051437,01071078"
			, "c,00002000,00012000,00024163|00024163,00044847,01012083,01051529,01071110"
		];

		if (!this.chara) {
			this.chara = new $PlayerData();
		}

		this.chara.id = this.id;//id == name
		this.chara.equips_code = $$aa[client_number % $$aa.length];
		this.chara.mapId = mapId;

		if (this.chara.guildId) {
			this.socket.join(this.chara.guildId);//guildId == guildName
		}
		if (this.chara.partyId) {
			this.socket.join(this.chara.partyId);//partyId == partyName
		}

		fnAck({
			charaData: this.chara,
			remoteCharacters: this.enumEnterRemoteCharaData($clients),
		});

		{
			let mobMovePacket = {
				elements: sceneObjectData[this.chara.mapId] || {},
			};

			this.socket.emit("mobMove", mobMovePacket);
		}

		this.socket.broadcast.emit("enterRemoteChara", [this.chara.getRemoteData()]);
	}

	onChat(packet, fnAck) {
		console.log(`user[${id}]: ${packet.text}`);
		packet.id = this.id;

		fnAck(true);
		this.socket.broadcast.emit("remoteChat", packet);
	}

	onCharaMove(packet, fnAck) {
		/** @type {$Packet_CharacterMove} */
		let data = packet;

		data.id = this.id;

		//update position
		this.chara.position.x = data.x;
		this.chara.position.y = data.y;

		this.socket.broadcast.emit("remoteCharaMove", data);
	}

	//TODO: ??
	onCharaAnim(packet, fnAck) {
		console.log("onCharaAnim: %o", packet);
	}

	onUseItem(packet, fnAck) {
		let data = packet;

		if (data.itemId[0] == "0") {//equip
			data.id = this.id;

			fnAck(true);

			this.socket.broadcast.emit("remoteAvatarModified", data);
		}
		else {
			fnAck(false);
		}
	}

	onSkill(packet, fnAck) {
		let data = packet;

		data.id = this.id;
		//data.skillId

		fnAck(true);

		this.socket.broadcast.emit("remoteCharaSkill", data);
	}

	onAttack(packet, fnAck) {
		let data = packet;

		///** @type {AttackInfo[]} */
		//const attack = data.attack;

		data.id = this.id;

		fnAck(true);

		this.socket.broadcast.emit("remoteCharaAttack", data);
	}

	onMobMove(packet, fnAck) {
		const { mapId } = this.chara;

		const mobs = packet.elements;

		if (!sceneObjectData[mapId]) {
			sceneObjectData[mapId] = {};
		}
		Object.assign(sceneObjectData[mapId], mobs);

		this.socket.broadcast.emit("mobMove", packet);
	};

	/**
	 * @param {Map<string,Client>} clients
	 */
	enumEnterRemoteCharaData(clients) {
		let characters = [];

		clients.forEach((client, remoteId) => {
			if (this != client) {
				/** @type {$PlayerData} */
				let chara = client.chara;

				if (chara) {//is connect ot game server
					let data = chara.getRemoteData();
					characters.push(data);
				}
			}
		});

		return characters;
	}
}

io.on("connection", function (socket) {
	const id = "chara_" + (++client_number);

	console.log(`user[${id}] connected`);

	const client = new Client(id, socket);
	$clients.set(id, client);

	socket.on("disconnect", function () {
		console.log(`user[${id}] disconnected`);

		client._onCharaLeave();

		$clients.delete(id);

		if (!$clients.size) {
			client_number = 0;
		}
	});

	socket.on("version", function (packet, fnAck) {
		fnAck({
			gameServerVersion: GAME_SERVER_VERSION,
		});
	});
});

http.listen(PORT, function () {
	console.log("listening on ?:" + PORT);
});

