
import Vue from "vue";
import Vuex from "vuex";

import { } from "./game/init.js";
import { InitAll } from "./init.js";

import MainUI from "./main-ui.vue";
import Editor from "./editor/editor.vue";//ref -> vuex
import { Game } from "./game/main.js";

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
