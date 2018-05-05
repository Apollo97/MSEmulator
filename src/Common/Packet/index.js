
let LoginPacket = require("./LoginPacket.js");
let ChatPacket = require("./ChatPacket.js");
let CharacterPacket = require("./CharacterPacket.js");

let ex = Object.assign({},
	LoginPacket,
	ChatPacket,
	CharacterPacket
);

module.exports = ex;
