
import { } from "./resource_180727a.js";

let _log_result = [
	"pack: %o",
	"enabled: %o",
	"base: %o",
	"pack: %o",
	"enabled: %o",
	"base: %o",
];
let result_log = [];

function log(fmt, ...args) {
	result_log.push(fmt);
	console.log(fmt, ...args);
}

async function test() {
	console.log("start");

	let promise_pack = $get.pack("/UI/Basic.img/VScr9").then(a => log("pack: %o", a) || a);

	let promise_enabled = $get.pack("/UI/Basic.img/VScr9/enabled").then(a => log("enabled: %o", a) || a);

	let promise_base = $get.pack("/UI/Basic.img/VScr9/enabled/base").then(a => log("base: %o", a) || a);

	let promise_pack2 = $get.pack("/UI/Basic.img/VScr9").then(a => log("pack: %o", a) || a);

	let promise_enabled2 = $get.pack("/UI/Basic.img/VScr9/enabled").then(a => log("enabled: %o", a) || a);

	let promise_base2 = $get.pack("/UI/Basic.img/VScr9/enabled/base").then(a => log("base: %o", a) || a);

	Promise.all([promise_pack, promise_enabled, promise_base, promise_pack2, promise_enabled2, promise_base2]).then(results => {
		console.log("results: %o", results);
		let f = false;
		for (let key in result_log) {
			if (result_log[key] != _log_result[key]) {
				console.log("F: " + result_log[key]);
				f = true;
			}
		}
		if (!f) {
			console.log("T");
		}
		console.log("end");
	});
}

test();





