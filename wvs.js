
let repl = require('repl');
//let app = require('express')();
let http = require('http').Server(/*app*/);
let io = require('socket.io')(http);
let { $PlayerData } = require("./src/Common/PlayerData.js");

let repl_context = repl.start({ prompt: '> ' }).context;

let $clients = {};
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
		value: "450004000"
	},
});

class ClientState {
	constructor() {
		/** @type {string} number */
		this.account = null;

		/** @type {number} number */
		this.world = null;

		/** @type {number} number */
		this.channel = null;

		/** @type {$PlayerData} number */
		this.chara = null;
	}
}

let client_number = 0;

io.on("connection", function (socket) {
	const id = "chara_" + (++client_number);

	let state = new ClientState();
	socket.clientState = state;

	$clients[id] = socket;

	console.log(`user[${id}] connected`);

	socket.on("disconnect", function () {
		console.log(`user[${id}] disconnected`);

		$clients[id] = null;
		delete $clients[id];
	});

	socket.on("chat", function (packet, fnAck) {
		console.log(`user[${id}]: ${packet.text}`);
		packet.id = id;

		fnAck(true);
		socket.broadcast.emit("remoteChat", packet);
	});

	socket.on("login", function (packet, fnAck) {
		state.account = packet.account;
		fnAck(true);
	});
	socket.on("selectWorld", function (packet, fnAck) {
		state.world = packet.world;
		state.channel = packet.channel;
		fnAck(true);//charaList
	});
	socket.on("selectChara", function (packet, fnAck) {
		const $$aa = [
			"c,00002012,00012012,00026509|00026509,00034873|00034873,01051429,01072392"
			, "c,00002000,00012000,00025346|00025346,00044591,01051469,01072392"
			, "c,00002012,00012012,00026539|00026539,00044833,01012083,01051437,01071078"
			, "c,00002000,00012000,00024163|00024163,00044847,01012083,01051529,01071110"
		];

		if (!state.chara) {
			state.chara = new $PlayerData();
		}

		state.chara.id = id;//id == name
		state.chara.equips_code = $$aa[client_number % $$aa.length];
		state.chara.mapId = repl_context.mapId || "000000000";

		if (state.chara.guildId) {
			socket.join(state.chara.guildId);//guildId == guildName
		}
		if (state.chara.partyId) {
			socket.join(state.chara.partyId);//partyId == partyName
		}

		fnAck({
			charaData: state.chara,
			remoteCharacters: enumEnterRemoteCharaData($clients),
		});

		socket.broadcast.emit("enterRemoteChara", [state.chara.getRemoteData()]);
	});
	socket.on("charaMove", function (packet, fnAck) {
		/** @type {$Packet_CharacterMove} */
		let data = packet;

		data.id = id;
		
		socket.broadcast.emit("remoteCharaMove", data);
	});
	socket.on("charaAnim", function (packet, fnAck) {
		console.log(JSON.stringify(packet));
	});
	socket.on("skill", function (packet, fnAck) {
		let data = packet;

		data.id = id;
		//data.skillId

		fnAck(true);

		socket.broadcast.emit("remoteCharaSkill", data);
	});
	socket.on("useItem", function (packet, fnAck) {
		let data = packet;

		if (data.itemId[0] == "0") {//equip
			data.id = id;

			fnAck(true);

			socket.broadcast.emit("remoteAvatarModified", data);
		}
		else {
			fnAck(false);
		}
	});
	
	function enumEnterRemoteCharaData(clients) {
		let characters = [];
		for (let i in clients) {
			/** @type {SocketIO.Socket} */
			const client = clients[i];

			if (socket != client) {
				/** @type {$PlayerData} */
				let chara = client.clientState.chara;

				if (chara) {
					characters.push(chara.getRemoteData());
				}
			}
		}
		return characters;
	}
});

http.listen(8787, function () {
	console.log("listening on *:8787");
});

