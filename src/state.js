﻿

import Vue from "vue";
import Vuex from "vuex";

import { InitAll } from "./init.js";


const server_list = {
	"server1": "https://maplestory-chat-emulator.herokuapp.com/",
	"localhost": (() => { let url = new URL("", window.location.origin); url.port = 8787; return url.href; })(),
	"offline": null,
};

export default new Vuex.Store({
	state: {
		view: "ui-login",
		serverList: server_list,
	},
	/*getters: {
		bbb: function (state, getters) {
		}
	},*/
	mutations: {
		_selectServer: function (state, payload) {
			state.view = "ui-app";
		},
	},
	actions: {
		/*login: function (context, payload) {
			context.dispatch('selectServer', {
			});
			context.dispatch('selectChannel', {
			});
			context.commit("_selectServer", {
			});
			context.commit("_selectChannel", {
			});
		},*/
		selectServer: async function (context, payload) {
			let modules = await Promise.all([
				import("./index.js"),
				import("./game/main.js"),
			]);
			const app = modules[0].app;
			const Game = modules[1].Game;
			
			if (!app.game) {
				await InitAll();
				
				/** @type {Game} */
				let game = app.game = new Game();
				
				if (payload.server) {
					game._$startClient(payload.server);
				}
				else {
					game._$start_offline();
				}
				
				game.run();
			}
			context.commit("_selectServer", {
			});
		},
		/*selectChannel: function (context, payload) {
		},*/
	}
});



