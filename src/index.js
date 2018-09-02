
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
	]);
	const { } = modules_2[0];
	const { Game } = modules_2[1];

	const MainUI = modules_2[2].default;
	const Editor = modules_2[3].default;
	
	return {
		Vue, Game, MainUI, Editor
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
		const { Vue, Game, MainUI, Editor } = await load_module();

		this.store = Editor.store;

		//this.vue = new Vue({
		//	el: '#vue',
		//	render: h => h(MainUI);
		//});
		let AppUI = Vue.extend(MainUI);
		this.vue = new AppUI({ el: elem });
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
