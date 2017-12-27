
import Vue from "vue";
import Vuex from "vuex";

import { InitAll } from "./init.js";
import { } from "./game/init.js";

import MainUI from "./main-ui.vue";
import Editor from "./editor/editor.vue";//ref -> vuex
import { Game } from "./game/main.js";

class App {
	constructor() {
		/** @type {Vue} */
		this.vue = null;

		//this.engine = engine;
		
		this.game = null;
	}

	async start() {

		this.store = Editor.store;

		//this.vue = new Vue({
		//	el: '#vue',
		//	render: h => h(MainUI);
		//});
		let AppUI = Vue.extend(MainUI);
		this.vue = new AppUI({ el: "#vue" });
		
		await InitAll();
		
		this.game = new Game();
		
		this.game.run();
	}
	
	/**
	 * @returns {Promise}
	 */	
	updateScreen() {
		return this.game.forceUpdateScreen();
	}
}

const app = new App();

window.app = app;

export default app;
