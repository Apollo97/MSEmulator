
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
		
		/** @type {Game} */
		this.game = null;
		
		this.store = null;
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
