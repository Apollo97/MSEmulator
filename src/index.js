/*
import Vue from "vue";
import Vuex from "vuex";

import { InitAll } from "./init.js";
import { } from "./game/init.js";
import { Game } from "./game/main.js";

import MainUI from "./main-ui.vue";
import Editor from "./editor/editor.vue";//ref -> vuex
*/

async function load_module() {
	const modules = await Promise.all([
		import("vue"),
		import("vuex"),
		import("./init.js"),
		import("./game/init.js"),
		import("./game/main.js"),
		import("./main-ui.vue"),
		import("./editor/editor.vue")
	]);
	const Vue = modules[0].default;
	const Vuex = modules[1].default;

	const { InitAll } = modules[2];
	const { } = modules[3];
	const { Game } = modules[4];

	const MainUI = modules[5].default;
	const Editor = modules[6].default;

	return {
		Vue, Vuex, InitAll, Game, MainUI, Editor
	};
}


export class App {
	constructor() {
		/** @type {Vue} */
		this.vue = null;

		//this.engine = engine;

		this.game = null;
	}

	/**
	 * @param {HTMLElement} elem
	 */
	async start(elem) {
		const { Vue, Vuex, InitAll, Game, MainUI, Editor } = await load_module();

		this.store = Editor.store;

		//this.vue = new Vue({
		//	el: '#vue',
		//	render: h => h(MainUI);
		//});
		let AppUI = Vue.extend(MainUI);
		this.vue = new AppUI({ el: elem });

		await InitAll();

		this.game = new Game();

		this.game._$startClient();

		this.game.run();

		document.getElementById("loading").style.display = "none";
	}

	/**
	 * @returns {Promise}
	 */
	updateScreen() {
		return this.game.forceUpdateScreen();
	}
}


///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////


export const app = new App();

window.app = app;

app.start("#vue");


///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////


////https://github.com/glenjamin/webpack-hot-middleware/blob/master/example/client.js
//if (module.hot) {
//	module.hot.accept();
//	module.hot.dispose(() => {
//		window.location.reload();
//	});
//}
