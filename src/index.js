
window.CLIENT_VERSION = "181014a";

async function load_module() {
	const modules_1 = await Promise.all([
		import("vue"),
	]);
	const Vue = modules_1[0].default;
	
	const modules_2 = await Promise.all([
		import("./game/init.js"),
		import("./game/main.js"),
		import("./main-ui.vue"),
		import("./editor/editor.vue"),
		import("./Client/Client.js"),
	]);
	const { } = modules_2[0];
	const { Game } = modules_2[1];

	const MainUI = modules_2[2].default;
	const Editor = modules_2[3].default;

	const { Client } = modules_2[4];
	
	return {
		Vue, Game, MainUI, Editor, Client
	};
}

export class App {
	constructor() {
		//this.engine = engine;
	}

	/**
	 * @param {HTMLElement} elem
	 */
	async start(elem) {
		const { Vue, Game, MainUI, Editor, Client } = await load_module();

		this.store = Editor.store;

		//this.vue = new Vue({
		//	el: '#vue',
		//	render: h => h(MainUI);
		//});
		let AppUI = Vue.extend(MainUI);
		//
		this.vue = new AppUI({ el: elem });
		
		/** @type {Game} */
		this.game = null;

		/** @type {Client} */
		this.client = null;
	}

	/**
	 * @returns {Promise<void>}
	 */
	updateScreen() {
		return this.game.forceUpdateScreen();
	}
}

export const app = new App();

app.start("#vue");

window.app = app;
