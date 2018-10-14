

import Vue from "vue";
import Vuex from "vuex";

import { InitAll } from "./init.js";
import { app } from "./index.js";
import { Game } from "./game/main.js";


const server_list = {
	"server1": "https://maplestory-chat-emulator.herokuapp.com/",
	"localhost": (() => { let url = new URL("", window.location.origin); url.port = 8787; return url.href; })(),
	"offline": null,
};

function runGame() {
	const game = app.game;

	game.$load();

	game.run();
}

export default new Vuex.Store({
	state: {
		view: "ui-select-server",
		serverList: server_list,
		isLogin: false,
	},
	/*getters: {
		bbb: function (state, getters) {
		}
	},*/
	mutations: {
		_selectServer: function (state, payload) {
			switch (payload.serverName) {
				case "server1":
				case "localhost":
					state.view = "ui-login";
					break;
				case "offline":
				default:
					state.view = "ui-app";
					console.log("offline_runGame");
					runGame();
					break;
			}
		},
		client_runGame: function (state, payload) {
			state.view = "ui-app";
			console.log("client_runGame");
			runGame();
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
			if (!app.game) {
				await InitAll();
				
				let game = app.game = new Game();

				let serverUrl = context.state.serverList[payload.serverName];
				
				if (serverUrl) {
					try {
						await game._$startClient(serverUrl);
					}
					catch (ex) {
						console.error(ex);

						let { offlineAttempts = 1 } = payload;

						if (offlineAttempts > 0) {
							console.log("start offline");

							return await context.dispatch('selectServer', {
								serverName: "offline",
								offlineAttempts: (offlineAttempts - 1),
							});
						}
						else {
							alert("can't start offline");
						}
					}
				}
			}
			context.commit("_selectServer", {
				serverName: payload.serverName,
			});
		},
		login: async function (context, payload) {
			const game = app.game;
			const client = app.client;

			if (game && client) {
				let result = await client.login(payload.account, payload.password);

				if (result) {
					context.state.isLogin = true;

					context.commit("client_runGame", {
					});

					return true;
				}
				else {
					alert("password");
				}
			}
			else {
				alert("no select server");
			}

			return false;
		},
		logout: function (context, payload) {
			context.state.isLogin = true;
		},
		/*selectChannel: function (context, payload) {
		},*/
	}
});



