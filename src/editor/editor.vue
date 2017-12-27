
<template>
	<div @contextmenu.self.prevent="" class="dialog-group Editor">
		
		<ui-dialog :position="wnds.menu.pos" width="302px">
			<template slot="header">
				Menu
			</template>
			<details open>
				<summary>bgm</summary>
				<div>
					<audio id="bgm" controls loop> autoplay</audio>
				</div>
			</details>
			<details open>
				<summary>window</summary>
				<p>
					<div v-for="(wnd, key) in wnds" v-if="!wnd.name.startsWith('$')">
						<label>
							<input type="checkbox" v-model="wnd.visable" @click="$refs[key]?$refs[key].requireOrder($event):undefined" checked /> {{wnd.name}}
						</label>
					</div>
				</p>
			</details>
			<details>
				<summary>scene</summary>
				<p>
					<div>
						<label>
							Map <input @keydown.enter="window().scene_map.load($event.target.value.padLeft(9, '0'))" />
						</label>
					</div>
					<div>
						<label><input type="checkbox" @click="window().m_is_rendering_map = !window().m_is_rendering_map" checked /> Map</label>
						<label><input type="checkbox" @click="window().m_display_back = !window().m_display_back" checked /> back</label>
						<label><input type="checkbox" @click="window().m_display_front = !window().m_display_front" checked /> front</label>
						<label><input type="checkbox" @click="window().m_display_mapobj = !window().m_display_mapobj" checked /> mapobj</label>
						<label><input type="checkbox" @click="window().m_display_maptile = !window().m_display_maptile" checked /> tile</label>
						<label><input type="checkbox" @click="window().m_display_skeletal_anim = !window().m_display_skeletal_anim" checked /> spine</label>
					</div>
				</p>
			</details>
			<details>
				<summary>editor</summary>
				<p>
					<label><input type="checkbox" @click="window().m_display_foothold = !window().m_display_foothold" checked /> foothold</label>
					<label><input type="checkbox" @click="window().m_display_selected_object = !window().m_display_selected_object" checked /> selected object</label>
				</p>
			</details>
			<details>
				<summary>debug</summary>
				<p>
					<label><input type="checkbox" @click="window().m_display_physics_debug = !window().m_display_physics_debug" checked /> physics debug</label>
					<label><input type="checkbox" @click="window().m_display_debug_info = !window().m_display_debug_info" /> debug info</label>
				</p>
			</details>
		</ui-dialog>

		<transition name="fade">
			<ui-dialog ref="character_list" v-show="wnds.character_list.visable" :position="wnds.character_list.pos" width="16.1em" height="50vh">
				<template slot="header">
					Characters
					<template v-if="progressMaximum">
						[loading: {{progressValue}} / {{progressMaximum}}]
					</template>
				</template>
				<template slot="content">
					<div :style="{filter: 'blur(' + (progressMaximum?3:0) + 'px)'}">
						<div>
							<span>{{charaList.length}} characters</span>
							<div class="chara-ls-btn-group">
								<button @click="addNewChara" class="chara-ls-btn" title="Add new"><img src="/images/toolstrip_character.png" alt="Add new" /></button>
								<button @click="addCloneChara" class="chara-ls-btn" title="Add clone"><img src="/images/toolstrip_duplicate.png" alt="Add clone" /></button>
								<button @click="loadCharacters" class="chara-ls-btn" title="Load"><span class="ui-icon ui-icon-folder-open"></span></button>
								<button @click="saveCharacters" class="chara-ls-btn" title="Save all"><img src="/images/toolstrip_save_all.png" alt="Save all" /></button>
							</div>
						</div>
						<ui-sortable :items="charaList" @input="oninput_sort" class="ui-character-list">
							<template slot-scope="{item, index}">
								<li :id="item.id" @mousedown.left="selectChara(item.id)" :class="[(selected == item.id ? 'active':''), item.id].join(' ')" :title="item.id" :key="item.id">
									<table style="width:100%;">
										<tr @contextmenu.prevent="openCharacterDLMenu($event, item.id);">
											<td>{{index}}</td>
											<td>{{item.id}}</td>
											<td style="position: relative;">
												<ui-character :chara="item.renderer"></ui-character>
											</td>
										</tr>
									</table>
								</li>
							</template>
						</ui-sortable>
					</div>
					<div v-if="progressMaximum" class="loading">
						<div>
							<progress :value="progressValue" :max="progressMaximum"></progress>
							<div>loading [{{progressValue}} / {{progressMaximum}}]</div>
						</div>
					</div>
				</template>
			</ui-dialog>
		</transition>
			
		<transition name="fade">
			<ui-dialog ref="character_list" v-show="wnds.character_attribute.visable" :position="wnds.character_attribute.pos" width="18.25em" height="50vh">
				<template slot="header">
					Character attribute
				</template>
				<template slot="content">
					<div v-if="chara!=null">
						<ui-character-attribute :sceneChara="chara"></ui-character-attribute>
					</div>
				</template>
			</ui-dialog>
		</transition>
		
		<transition name="fade">
			<ui-dialog ref="spawnpoint" v-show="wnds.spawnpoint.visable" :position.sync="wnds.spawnpoint.pos" height="50vh">
				<template slot="header">
					Spawn point
				</template>
				<template slot="content">
					<ui-mob-list @resize="$refs.spawnpoint.reset_content_style()"></ui-mob-list>
				</template>
			</ui-dialog>
		</transition>
			
		<transition name="fade">
			<ui-equip-box ref="equip_box"
						  v-show="wnds.equip_box.visable"
						  :position="wnds.equip_box.pos"
						  width="20em"
						  :height="400"
						  @clickItem="clickItem"
						  @hoverItem="hoverItem"
						  @mouseleaveItem="mouseleaveItem"
						  @faceColor="faceColor"
						  @hairColor="hairColor"
						  >
			</ui-equip-box>
		</transition>
		
		<transition name="fade">
			<template v-if="mapEditorMode.startsWith('layered')">
				<ui-dialog v-show="wnds.debug_window.visable" :position="wnds.debug_window.pos" width="40vw" height="70vh">
					<template slot="header">
						<select v-model="mapEditorMode">
							<option value="background">background</option>
							<option value="frontground">frontground</option>
							<option value="layeredObject">layered object</option>
							<option value="layeredTile">layered tile</option>
						</select>
						mode <input v-model="displayMode" type="number" min="0" max="2" style="width: 1.8em;">
						<button @click="dirty++">{{dirty}}</button>
					</template>
					<template slot="content">
						<div v-if="scene_map() && scene_map()[mapEditorMode].length" :style="wnd_debug_style">
							<div style="background: white;">
								<input v-model="wnd_debug_style.background" type="color" />
								<label>layer <select v-model="selectedLayer">
										<option v-for="layer in scene_map()[mapEditorMode].length">{{layer - 1}}</option>
									</select>
								</label>
								<span>{{scene_map()[mapEditorMode][selectedLayer].length}} objs</span>
							</div>
							<hr />
							<ui-map-editor :objs="scene_map()[mapEditorMode][selectedLayer]" :displayMode="displayMode"></ui-map-editor>
						</div>
					</template>
				</ui-dialog>
			</template>
			<template v-else>
				<ui-dialog v-show="wnds.debug_window.visable" :position="wnds.debug_window.pos" width="40vw" height="70vh">
					<template slot="header">
						<select v-model="mapEditorMode">
							<option value="background">background</option>
							<option value="frontground">frontground</option>
							<option value="layeredObject">layered object</option>
							<option value="layeredTile">layered tile</option>
						</select>
						tex info <input v-model="displayMode" type="number" min="0" max="2" style="width: 1.8em;">
						<button @click="dirty--">{{dirty}}</button>
					</template>
					<template slot="content">
						<div v-if="scene_map() && scene_map()[mapEditorMode].length" :style="wnd_debug_style">
							<div style="background: white;">
								<input v-model="wnd_debug_style.background" type="color" />
							</div>
							<hr />
							<ui-map-editor :objs="scene_map()[mapEditorMode]" :displayMode="displayMode"></ui-map-editor>
						</div>
					</template>
				</ui-dialog>
			</template>
		</transition>
			
		<transition name="fade">
			<ui-menu :show="is_show_chara_dl_menu" ref="chara_dl_menu" @close="closeCharacterDLMenu" style="position: absolute; width: 8em; z-index: 99999;">
				<template v-if="chara">
					<a @click="chara.renderer._save_as_svg()">Save as SVG</a>
					<template v-if="progressMaximum == 0 || progressValue >= progressMaximum">
						<a :href="chara.renderer._outlink()">Outlink</a>
					</template>
					<template v-else>
						<div title="loading...">Outlink</div>
					</template>
					<a @click="copyCharaCode">Copy code</a>
				</template>
				<template v-else>
					<a class="disable">Save as SVG</a>
					<a class="disable" href="javascript:void(0)">Outlink</a>
					<a class="disable">Copy code</a>
				</template>
			</ui-menu>
		</transition>
	</div>
</template>

<script>
	import Vuex from 'vuex';

	import UIDraggable from '../components/ui-draggable.vue';
	import UIDialog from '../components/ui-dialog.vue';
	import UISortable from '../components/ui-sortable.vue';
	import UITrigger from '../components/ui-trigger.vue';
	import UIMenu from '../components/ui-menu.vue';

	import UIEquipBox from './ui-equip-box.vue';
	import UICharacter from './ui-character.vue';
	import UICharacterSVG from './ui-character-svg.vue';
	import UICharacterAttribute from './ui-character-attribute.vue';
	
	import UIMobList from "./ui-mob-list.vue";
	import UIMapEditor from "./ui-map-editor.vue";

	//import { GameStateManager } from '../game/GameState.js';

	import { ItemCategoryInfo } from '../../public/resource.js';
	import { SceneCharacter } from '../game/SceneCharacter.js';

	const store = new Vuex.Store({
		//strict: process.env.NODE_ENV !== 'production',
		state: {
			charaList: [],
			chara: null,/** @type {SceneCharacter} chara */
			selected: null,/** @type {string} id */
			_last_id: 0,
			
			progressValue: 0,
			progressMaximum: 0,
		},
		getters: {
			lastId: function (state, getters) {
				return "chara_" + state._last_id;
			}
		},
		mutations: {
			clear: function (state) {
				state.charaList = [];
			},
			increaseId(state) {
				state._last_id += 1;
			},
			increaseProgress: function (state, payload) {
				state.progressValue += payload.amount;
				if (state.progressValue >= state.progressMaximum) {
					state.progressValue = 0;
					state.progressMaximum = 0;
				}
			},
			increaseProgressMax: function (state, payload) {
				state.progressMaximum += payload.amount;
			},
			//decreaseProgress: function (state, payload) {
			//},
		},
		actions: {
			isIdExist: function (context, payload) {
				const state = context.state;
				if (payload && payload.id) {
					const id = payload.id;
					for (let i = 0; i < state.charaList.length; ++i) {
						let chara = state.charaList[i];
						if (chara.id == id) {
							return true;
						}
					}
				}
				return false;
			},
			sortCharaById: function (context, payload) {
				const state = context.state;
				state.charaList = state.charaList.sort((a, b) => {
					const na = get_n(a.id);
					const nb = get_n(b.id);

					return na - nb;

					function get_n(id) {
						if (!a) return 0;
						let n = Number(id).split("_")[1];
						return n | 0;
					}
				});
			},
			selectChara: function (context, payload) {
				const state = context.state;
				const id = payload.id;
				
				let index = -1;
				for (let i = 0; i < state.charaList.length; ++i) {
					const chara = state.charaList[i];
					if (chara.id == id) {
						index = i;
						break;
					}
				}
				if (index >= 0) {
					state.selected = id;

					const selected_chara = state.charaList[index];

					if (state.chara) {
						delete state.chara.$physics;
					}

					delete selected_chara.$physics;
					selected_chara.$physics = scene_map.controller.player;

					window.chara = state.chara = selected_chara;
					
					return id;
				}
			},
			_addChara: async function (context, payload) {//add exist
				const state = context.state;

				if (payload && payload.chara instanceof SceneCharacter) {
					const chara = payload.chara;

					await chara.renderer.__synchronize();
					
					state.charaList.push(chara);

					context.dispatch('selectChara', {
						id: chara.id,
					});
					
					context.commit("increaseProgress", { amount: 1 });

					return chara;
				}
				debugger;
			},
			_createChara: async function (context, payload) {
				const state = context.state;
				
				context.commit("increaseId");
				const id = context.getters.lastId;
				
				let chara = new SceneCharacter();
				chara.id = id;

				//step 1: load base data
				await chara.renderer.load();
				context.commit("increaseProgress", { amount: 1 });

				//step 2: load equip...
				if (payload) {
					if (payload.chara instanceof SceneCharacter) {//clone
						chara.renderer._parse(payload.chara.renderer._stringify(false));

						chara.renderer.x = payload.chara.renderer.x;
						chara.renderer.y = payload.chara.renderer.y;
					}
					else if (payload.emplace) {
						chara.id = payload.emplace.id;
						chara.renderer._parse(payload.emplace.code);
					}
				}
				else {
					chara.renderer._setup_test();
				}

				return await context.dispatch('_addChara', {
					chara: chara,
				});
			},
			createChara: async function (context, payload) {
				context.commit("increaseProgressMax", { amount: 2 });
				return await context.dispatch('_createChara', payload);
			},
			//replaceCharacter: async function (context) {
			//},
			loadCharacters: async function (context) {
				const state = context.state;
				let list =  JSON.parse(window.localStorage.getItem("chara_list"));
				if (!list) {
					return;
				}
				
				//clear
				context.commit("clear");
				
				context.commit("increaseProgressMax", { amount: list.length * 2 });
				
				for (let index = 0; index < list.length; ++index) {
					const savedChara = list[index];
					
					let isIdExist = await context.dispatch('isIdExist', {
						id: savedChara.id,
					});
					
					if (isIdExist) {
						//console.log("replace character[" + index + "]: " + savedChara.id);
						console.log("character: " + savedChara.id + "is exist");
					}
					else {
						console.log("load character[" + index + "]: " + savedChara.id);
						await context.dispatch('_createChara', {
							emplace: {
								id: savedChara.id,
								code: savedChara.code,
								//index: index,
							}
						});
					}
				}
			},
			saveCharacters: function (context) {
				const state = context.state;
				let ls_charaList = [];

				state.charaList.forEach(function (chara, index) {
					const id = chara.id;
					const code = chara.renderer._stringify(false);

					ls_charaList[index] = {
						id: id,
						code: code,
					};
				})

				window.localStorage.setItem("chara_list", JSON.stringify(ls_charaList));
			},
		}
	});

	export default {
		store,
		data: function () {
			let scr_rat_x = window.innerWidth / 1366;
			let scr_rat_y = window.innerHeight / 768;
		
			return {
				dirty: 0,
				
				//chara: {},
				//windowOrder: [1, 2, 3],
				is_show_chara_dl_menu: false,
				
				mapEditorMode: "layeredObject",
				displayMode: 0,
				selectedLayer: 0,
				wnd_debug_style: { background: "#ffffff", padding: "0 0.5em" },
				
				wnds: {
					menu: { name: "$menu", visable: true, pos: { x: 0, y: 0 } },
					character_list: { name: "Characters", visable: true, pos: { x: 900 * scr_rat_x, y: 220 * scr_rat_y } },
					character_attribute: { name: "Character attribute", visable: true, pos: { x: 900 * scr_rat_x, y: 0 * scr_rat_y } },
					equip_box: { name: "Equip box", visable: true, pos: { x: 0 * scr_rat_x, y: 50 * scr_rat_y } },
					spawnpoint: { name: "Spawn point", visable: false, pos: { x: 350 * scr_rat_x, y: 0 * scr_rat_y } },
					debug_window: {
						name: "Map editor (Debug)",
						visable: false,
						pos: { x: 0 * scr_rat_x, y: 100 * scr_rat_y },
					},
				},
			}
		},
		computed: Vuex.mapState({
			charaList: "charaList",	// chara[]
			selected: "selected",	// charaId
			chara: "chara",			// current chara
			progressValue: "progressValue",
			progressMaximum: "progressMaximum",
		}),
		methods: {
			window: function () {
				return window;
			},
			scene_map: function () {
				return window.scene_map;
			},
			loadCharacters: function () {
				console.log("load character");				
				this.$store.dispatch('loadCharacters');
			},
			saveCharacters: function () {
				console.log("save characters");
				alert("save characters");
				this.$store.dispatch('saveCharacters');
			},
			selectChara: function (id) {
				console.log("select character: " + id);
				this.$store.dispatch("selectChara", {
					id: id
				});
			},
			addNewChara: function () {
				console.log("create new character");
				this.$store.dispatch('createChara');
			},
			addCloneChara: function () {
				if (!this.chara) {
					return;
				}
				console.log("clone character: " + this.chara.id);
				this.$store.dispatch('createChara', {
					chara: this.chara
				});
			},
			oninput_sort: function (value) {
				this.$store.state.charaList = value;
			},

			faceColor: async function ({ color }) {
				if (this.chara) {
					if (this.chara && color != null) {
						this.$store.commit("increaseProgressMax", { amount: 2 });
						this.chara.renderer.faceColor = color;
						this.$store.commit("increaseProgress", { amount: 1 });
						await this.chara.renderer.__synchronize(0);
						this.$store.commit("increaseProgress", { amount: 1 });
						app.updateScreen();
					}
				}
			},
			hairColor: async function ({ color }) {
				if (this.chara) {
					if (this.chara && color != null) {
						this.$store.commit("increaseProgressMax", { amount: 2 });
						this.chara.renderer.hairColor = color;
						this.$store.commit("increaseProgress", { amount: 1 });
						await this.chara.renderer.__synchronize(0);
						this.$store.commit("increaseProgress", { amount: 1 });
						app.updateScreen();
					}
				}
			},

			clickItem: async function (payload) {
				let { id, category, equip } = payload;

				if (this.chara) {
					if (!this.chara.renderer.unuse(id)) {
						this.$store.commit("increaseProgressMax", { amount: 2 });
						try {
							this.chara.renderer.use(id, category, equip);
						}
						catch (ex) {
							this.$store.commit("increaseProgressMax", { amount: -2 });
							debugger;
							throw ex;
						}
						this.$store.commit("increaseProgress", { amount: 1 });
						try {
							await this.chara.renderer.__synchronize(0);
						}
						catch (ex) {
							this.$store.commit("increaseProgress", { amount: 1 });//force exit
							app.updateScreen();
							debugger;
							throw ex;
						}
						this.$store.commit("increaseProgress", { amount: 1 });
						app.updateScreen();
					}
				}
				this.$emit("hoverItem", payload);
			},
			hoverItem: function (payload) {
				this.$emit("hoverItem", payload);
			},
			mouseleaveItem: function (payload) {
				this.$emit("mouseleaveItem", payload);
			},

			openCharacterDLMenu: function (e, id) {
				let vm = this;
				vm.$store.dispatch("selectChara", {
					id: id
				}).then(function () {
					vm.is_show_chara_dl_menu = true;

					vm.$nextTick(function () {
						vm.$refs.chara_dl_menu.setPosition({
							my: "left top",
							of: e,
							//collision: "fit",
						});
					});

					//console.log("openCharacterDLMenu");
				});
			},
			closeCharacterDLMenu: function () {
				let vm = this;
				vm.is_show_chara_dl_menu = false;
				//console.log("closeCharacterDLMenu");
			},
			copyCharaCode: function () {
				let code = this.chara.renderer._stringify(false);
				copyToClipboard(code);
			},
		},
		components: {
			"ui-draggable": UIDraggable,
			"ui-dialog": UIDialog,
			"ui-sortable": UISortable,
			"ui-trigger": UITrigger,
			"ui-menu": UIMenu,

			"ui-character": UICharacter,
			"ui-character-svg": UICharacterSVG,
			"ui-character-attribute": UICharacterAttribute,
			"ui-equip-box": UIEquipBox,
			
			"ui-mob-list": UIMobList,
			"ui-map-editor": UIMapEditor,
		}
	}
</script>

<style scoped>
	.dialog-group {
		position: fixed;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.ui-dialog .ui-equip-box-dialog.ui-dialog-content {
		padding: 0;
		width: 100% !important;
	}

	/*li.active {
		background-color: lightcyan;
	}
	*/
	.ui-character-list .active {
		background: linear-gradient(to bottom, #ffec64 5%, #ffab23 100%);
		background-color: #ffec64;
	}

	.ui-character-list {
		list-style: none;
		padding: 0;
	}

	.ui-character-list > li {
		width: 16em;
	}

	.ui-character-list table {
		width: 100%;
		/*border-collapse: collapse;*/
	}
	
	.ui-character-list td:nth-child(1) {
		/*border: 1px solid black;*/
		width: 20%;
	}

	.ui-character-list td:nth-child(2) {
		/*border: 1px solid black;*/
		width: 50%;
	}

	/*
	.ui-character-list td:first-child {
	}
	*/

	/*.ui-character-list td:last-child {
		float: right;
	}*/
	
	.chara-ls-btn-group {
		display: inline;
		float: right;
	}
	.chara-ls-btn {
	    display: inline-flex;
		width: 20px;
		height: 20px;
		padding: 0;
	}
	.chara-ls-btn > * {
		margin: auto;
		padding: 0;
	}
	
	.loading {
		position: absolute;
		top:0;
		left:0;
		width: 100%;
		height: 100%;
		background: rgba(100, 100, 100, 0.5);
		text-shadow: 1px 1px 0 white, 0 0 1px white;
		
		display:flex;
		align-items:center;
		justify-content:center;
	}

	/*
		http://www.oxxostudio.tw/articles/201408/sticky-ball.html
	*/
</style>
