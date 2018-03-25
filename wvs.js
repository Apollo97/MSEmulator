
let repl = require('repl');
//let app = require('express')();
let http = require('http').Server(/*app*/);
let io = require('socket.io')(http);

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

class CharaData {
	constructor() {
		/** @type {string} */
		this.id = null;

		/** @type {string} number */
		this.mapId = null;

		/** @type {string} */
		this.equips_code = null;
	}

	getRemoteData() {
		return {
			id: this.id,
			mapId: this.mapId,
			equips_code: this.equips_code,
		};
	}
}

class ClientState {
	constructor() {
		/** @type {string} number */
		this.account = null;

		/** @type {number} number */
		this.world = null;

		/** @type {number} number */
		this.channel = null;

		/** @type {CharaData} number */
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

	socket.on("chat", function (msg) {
		console.log(`user[${id}]: ${msg}`);
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
		const $$aa = ["c,00002012,00012012,00026539|00026539,00044833,01012083,01051437,01071078", "c,00002000,00012000,00024163|00024163,00044847,01012083,01051529,01071110"];

		if (!state.chara) {
			state.chara = new CharaData();
		}

		state.chara.id = id;
		state.chara.equips_code = $$aa[client_number % $$aa.length];
		state.chara.mapId = repl_context.mapId || "000000000";

		fnAck({
			charaData: state.chara,
			remoteCharacters: enumEnterRemoteCharaData($clients),
		});

		socket.broadcast.emit("enterRemoteChara", [state.chara.getRemoteData()]);
	});
	socket.on("charaMove", function (packet, fnAck) {
		let data = {
			id, id,
			path: packet,
		};
		
		socket.broadcast.emit("remoteCharaMove", data);
	});
	socket.on("charaAnim", function (packet, fnAck) {
		let data = {
			id, id,
			anim: packet,
		};

		socket.broadcast.emit("remoteCharaAnim", data);
	});
	
	function enumEnterRemoteCharaData(clients) {
		let characters = [];
		for (let i in clients) {
			/** @type {SocketIO.Socket} */
			const client = clients[i];

			if (socket != client) {
				/** @type {CharaData} */
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

