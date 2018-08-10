
import { SceneMap } from "./Map.js";
import { SceneCharacter } from "./SceneCharacter.js";

import { Client } from "../Client/Client.js";//debug

import { app as gApp } from "../index.js";//debug


export class GameState {
	constructor(scene, chara) {
		/** @type {string} */
		this.map_id = scene.map_id;

		if (chara.renderer) {
			/** @type {string} */
			this.chara = chara.renderer._stringify(false);
			url += "&chara=" + this.chara;
		}
	}
}

export class GameStateManager {
	constructor() {
		throw new Error("");
	}

	/**
	 * @param {SceneMap} scene
	 * @param {SceneCharacter} chara
	 */
	static PushState(scene, chara) {
		if (!scene) {
			return;
		}
		let state = {};
		let url = "?map=" + scene.map_id;

		state.map_id = scene.map_id;

		if (chara && chara.renderer) {
			state.chara = chara.renderer._stringify(false);
			url += "&chara=" + state.chara;
		}

		history.pushState(state, scene._window_title, url);

		document.title = scene._window_title;
	}
	/**
	 * @param {string} map_id
	 * @param {string} chara_code
	 */
	static PushStateString(map_id, chara_code) {
		if (!map_id) {
			return;
		}
		let state = {};

		let url = "?map=" + map_id;
		state.map_id = map_id;

		if (chara_code) {
			state.chara = chara_code;
			url += "&chara=" + state.chara;
		}

		history.pushState(state, scene._window_title, url);

		document.title = scene._window_title;
	}
	static async PopState(state) {
		if (!state) {
			return;
		}
		
		if (state.chara && window.chara && window.chara.renderer) {
			let _old_c = window.chara.renderer._stringify(false);
			if (state.chara != _old_c) {
				window.chara.renderer._parse(state.chara);
			}
		}
		else {
			Client._CreateMyCharacter({
				id: "chara_1",
				equips_code: state.chara,
			});
			//await gApp.store.dispatch('_createChara', {
			//	emplace: {
			//		id: "chara_1",
			//		code: state.chara,
			//	}
			//});
		}

		if (scene_map && scene_map.map_id != state.map_id) {
			await scene_map.load(state.map_id);
		}
	}
}
