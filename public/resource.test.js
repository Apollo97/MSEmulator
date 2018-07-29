
import { } from "./resource.js";

let should_result = [
	"pack: %o", "enabled: %o", "base: %o",
	"next0: %o", "next1: %o", "next2: %o",
	
	"pack: %o", "enabled: %o", "base: %o",
	"next0: %o", "next1: %o", "next2: %o",
];
let result_log = [];
window.$result_log = [];

function log(fmt, ...args) {
	result_log.push(fmt);
	window.$result_log.push([fmt, ...args]);
	console.log(fmt, ...args);
}

async function test() {
	console.log("start");

	let promise_pack = $get.pack("/UI/Basic.img/VScr9").then(a => log("pack: %o", a) || a);

	let promise_enabled = $get.pack("/UI/Basic.img/VScr9/enabled").then(a => log("enabled: %o", a) || a);

	let promise_base = $get.pack("/UI/Basic.img/VScr9/enabled/base").then(a => log("base: %o", a) || a);

	let promise_next0 = $get.pack("/UI/Basic.img/VScr9/enabled/next0").then(a => log("next0: %o", a) || a);

	let promise_next1 = $get.pack("/UI/Basic.img/VScr9/enabled/next1").then(a => log("next1: %o", a) || a);

	let promise_next2 = $get.pack("/UI/Basic.img/VScr9/enabled/next2").then(a => log("next2: %o", a) || a);


	let promise_pack2 = $get.pack("/UI/Basic.img/VScr9").then(a => log("pack: %o", a) || a);

	let promise_enabled2 = $get.pack("/UI/Basic.img/VScr9/enabled").then(a => log("enabled: %o", a) || a);

	let promise_base2 = $get.pack("/UI/Basic.img/VScr9/enabled/base").then(a => log("base: %o", a) || a);

	let promise_next02 = $get.pack("/UI/Basic.img/VScr9/enabled/next0").then(a => log("next0: %o", a) || a);

	let promise_next12 = $get.pack("/UI/Basic.img/VScr9/enabled/next1").then(a => log("next1: %o", a) || a);

	let promise_next22 = $get.pack("/UI/Basic.img/VScr9/enabled/next2").then(a => log("next2: %o", a) || a);

	
	Promise.all([
		promise_pack, promise_enabled, promise_base,
		promise_next0, promise_next1, promise_next2,
		
		promise_pack2, promise_enabled2, promise_base2,
		promise_next02, promise_next12, promise_next22,
	])
	.then(results => {
		console.log("results: %o", results);
		let f = false;
		for (let key in result_log) {
			if (result_log[key] != should_result[key]) {
				console.log("%o %o", should_result[key], result_log[key]);
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





