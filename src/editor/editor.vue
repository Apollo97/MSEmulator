
<template>
	<div @contextmenu.self.prevent="" class="dialog-group Editor">

		<!-- begin menu -->
		<ui-dialog :title="wnds.menu.name" ref="menu">
			<template slot="header">
				Menu
			</template>
			<template>
				<details open>
					<summary>bgm</summary>
					<div ref="bgm_outer"></div>
				</details>
				<details open>
					<summary>window</summary>
					<div>
						<div v-for="(wnd, key) in wnds" v-if="!wnd.name.startsWith('$')" :key="key">
							<label>
								<input type="checkbox" v-model="wnd.visable" @click="$refs[key]?$refs[key].requireOrder($event):undefined" checked /> {{wnd.name}}
							</label>
						</div>
					</div>
				</details>
			</template>
			<template>
				<details>
					<summary>scene</summary>
					<div>
						<div>
							<label>
								Map <input @keydown.enter="gv.scene_map.load($event.target.value.padStart(9, '0'))" />
							</label>
						</div>
						<div>
							<fieldset>
								<legend>map</legend>
								<label><input type="checkbox" v-model="gv.m_is_rendering_map" />Map</label>
								<label><input type="checkbox" v-model="gv.m_display_back" />back</label>
								<label><input type="checkbox" v-model="gv.m_display_front" />front</label>
								<label><input type="checkbox" v-model="gv.m_display_mapobj" />object</label>
								<label><input type="checkbox" v-model="gv.m_display_maptile" />tile</label>
								<label><input type="checkbox" v-model="gv.m_display_portal" />portal</label>
							</fieldset>
							<fieldset>
								<legend>map</legend>
								<label><input type="checkbox" v-model="gv.m_display_particle_system" />particle system</label>
								<label><input type="checkbox" v-model="gv.m_display_skeletal_anim" />skeletal animation</label>
							</fieldset>
							<fieldset>
								<legend>life</legend>
								<label><input type="checkbox" v-model="gv.m_display_life" />life</label>
								<label><input type="checkbox" v-model="gv.m_display_player" />player</label>
								<label><input type="checkbox" v-model="gv.m_display_other_player" />other player</label>
							</fieldset>
							<fieldset>
								<legend>character</legend>
								<div><label><input type="checkbox" v-model="gv.m_display_name_label" />顯示名牌</label></div>
								<div><label>名牌<input type="number" min="0" v-model="gv.NameLabel_default_style" /></label></div>
								<div><label>聊天<input type="number" min="0" v-model.number="gv.ChatBalloon_default_style" /></label></div>
								<div><label>聊天顯示時間<input type="number" min="0" v-model.number="gv.ChatBalloon_display_duration" />毫秒</label></div>
							</fieldset>
						</div>
					</div>
				</details>
				<details>
					<summary>editor</summary>
					<div>
						<label><input type="checkbox" v-model="gv.m_display_foothold" /> foothold</label>
						<label><input type="checkbox" v-model="gv.m_display_selected_object" /> selected object</label>
					</div>
				</details>
				<details>
					<summary>debug</summary>
					<div>
						<div><label><input type="checkbox" v-model="gv.m_display_debug_info" /> debug info</label></div>

						<div><label><input type="checkbox" v-model="gv.m_display_physics_debug" /> physics debug</label></div>

						<div v-for="(flagName,key) in gv.m_debugDraw.flagNames" :key="key">
							<label><input type="checkbox" v-model.number="gv.m_debugDraw[flagName]" /> {{flagName.slice(5)}}</label>
						</div>
						<div>
							<label>axis length <input type="number" v-model="gv.m_debugDraw.axis_length" step="0.1" /></label>
						</div>
					</div>
				</details>
			</template>
		</ui-dialog>
		<!-- end menu -->
		<!-------------------------------------------------------------------------->
		<!-- begin character_list -->
		<transition name="fade">
			<ui-dialog :title="wnds.character_list.name" ref="character_list" v-show="wnds.character_list.visable">
				<template slot="header">
					Characters
					<template v-if="progressMaximum">
						[loading: {{progressValue}} / {{progressMaximum}}]
					</template>
				</template>
				<template slot="content">
					<div style="width: 100%; height: 100%;">
						<div :style="{filter: 'blur(' + (progressMaximum?3:0) + 'px)', display: 'table', width: '100%', height: '100%'}">
							<div style="display: table-row; height: 0;">
								<span>{{charaList.length}} characters</span>
								<div class="chara-ls-btn-group">
									<button @click="addNewChara" class="chara-ls-btn" title="Add new"><img src="images/toolstrip_character.png" alt="Add new" /></button>
									<button @click="addCloneChara(chara)" class="chara-ls-btn ui-no-interactions" title="Add clone"><img src="images/toolstrip_duplicate.png" alt="Clone" /></button>
									<button @click="deleteCharacter(chara)" class="chara-ls-btn ui-no-interactions" title="Delete"><span class="ui-icon ui-icon-trash" alt="Delete"></span></button>
									<button @click="loadCharacters" class="chara-ls-btn" title="Load"><span class="ui-icon ui-icon-folder-open" alt="📂"></span></button>
									<button @click="saveCharacters" class="chara-ls-btn" title="Save all"><img src="images/toolstrip_save_all.png" alt="Save all" /></button>
								</div>
							</div>
							<div style="display: table-row; width: 100%; height: 100%;">
								<ui-sortable tag="table" :items="charaList" @input="oninput_sort" class="ui-character-list">
									<template slot-scope="{item, index}">
										<tr :id="item.id"
											:class="[(selected == item.id ? 'active':''), item.id].join(' ')"
											:title="item.id" :key="item.id"
											keyName="title"
											@mousedown.left="selectChara(item.id)"
											@contextmenu.prevent="openCharacterDLMenu($event, item.id)">
											<td title="順序" style="text-align: center;">
												<div v-if="index">
													<span class="chara-ls-btn ui-no-interactions" @click="moveCharacterOrder(item, index - 1)">▲</span>
												</div>
												<div>{{index}}</div>
												<div v-if="index!=(charaList.length-1)">
													<span class="chara-ls-btn ui-no-interactions" @click="moveCharacterOrder(item, index + 1)">▼</span>
												</div>
											</td>
											<td>
												<div>
													<div class="ui-no-interactions">
														<input v-if="item.renderer.pause" type="text" v-model="item.id" placeholder="名字" style="width: 90%;" />
														<span v-else title="暫停後可改名">{{item.id}}</span>
													</div>
												</div>
											</td>
											<td style="position: relative; text-align: center;">
												<ui-character :chara="item.renderer"></ui-character>
											</td>
										</tr>
									</template>
								</ui-sortable>
							</div>
						</div>
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
		<!-- end character_list -->
		<!-------------------------------------------------------------------------->
		<!-- begin character_renderer -->
		<transition name="fade">
			<ui-dialog :title="wnds.character_renderer.name" ref="character_renderer" v-show="wnds.character_renderer.visable">
				<template slot="header">
					Character renderer
				</template>
				<template slot="content">
					<div v-if="chara!=null">
						<ui-character-renderer :sceneChara="chara"></ui-character-renderer>
					</div>
				</template>
			</ui-dialog>
		</transition>
		<!-- end character_renderer -->
		<!-------------------------------------------------------------------------->
		<!-- begin spawnpoint -->
		<transition name="fade">
			<ui-dialog :title="wnds.spawnpoint.name" ref="spawnpoint" v-show="wnds.spawnpoint.visable">
				<template slot="header">
					Spawn point
				</template>
				<template slot="content">
					<ui-mob-list @resize="$refs.spawnpoint.reset_content_style()"></ui-mob-list>
				</template>
			</ui-dialog>
		</transition>
		<!-- end spawnpoint -->
		<!-------------------------------------------------------------------------->
		<!-- begin equip_box -->
		<ui-dialog :title="wnds.equip_box.name" ref="equip_box" v-show="wnds.equip_box.visable">
			<template slot="header">
				Equip box
			</template>
			<template slot="content">
				<ui-equip-box @clickItem="clickItem"
							  @hoverItem="hoverItem"
							  @mouseleaveItem="mouseleaveItem"
							  @faceColor="faceColor"
							  @hairColor="hairColor"
							  @hairColor2="hairColor2"
							  @hairMix2="hairMix2">
				</ui-equip-box>
			</template>
		</ui-dialog>
		<!-- end equip_box -->
		<!-------------------------------------------------------------------------->
		<!-- begin mapEditor -->
		<transition name="fade">
			<ui-dialog :title="wnds.debug_window.name" ref="debug_window" v-if="scene_map()" v-show="wnds.debug_window.visable">
				<template slot="header">
					<button @click="fupdate">⟳</button>
					mode
					<input-number v-model="displayMode" type="number" min="0" max="2" style="width: 1.8em;"></input-number>
					<input-select v-model="mapEditorMode">
						<option value="background">background</option>
						<option value="frontground">frontground</option>
						<option value="layeredObject">layered object</option>
						<option value="layeredTile">layered tile</option>
					</input-select>
					<template v-if="scene_map()[mapEditorMode][selectedLayer] && mapEditorMode.startsWith('layered')">
						<label>
							layer <input-select v-model="selectedLayer">
								<option v-for="(layer,key) in scene_map()[mapEditorMode].length" :key="key">{{layer - 1}}</option>
							</input-select>
						</label>
						<span>{{scene_map()[mapEditorMode][selectedLayer].length}} objs</span>
					</template>
					<template>
						<div class="header">
							<input v-model="wnd_debug_style.background" type="color" title="window background color" />

							<template v-if="mapEditorMode=='background'">
								<button @click="appendMapElement('MapBack',0)">add MapBack</button>
								<button @click="appendMapElement('MaMapBackAnimationpBack',0)">add MapBackAnimation</button>
								<button @click="appendMapElement('MapBackSkeletalAnim',0)">add MapBackSkeletalAnim</button>
							</template>
							<template v-else-if="mapEditorMode=='frontground'">
								<button @click="appendMapElement('MapBack',1)">add MapBack</button>
								<button @click="appendMapElement('MapBackAnimationpBack',1)">add MapBackAnimation</button>
								<button @click="appendMapElement('MapBackSkeletalAnim',1)">add MapBackSkeletalAnim</button>
							</template>

							<template v-else-if="mapEditorMode=='layeredObject'">
								<button @click="appendMapElement('MapObject',selectedLayer)">add MapObject</button>
								<button @click="appendMapElement('MapObjectSkeletalAnim',selectedLayer)">add MapObjectSkeletalAnim</button>
							</template>

							<template v-else-if="mapEditorMode=='layeredTile'">
								<button @click="appendMapElement('MapTile',selectedLayer)">add MapTile</button>
							</template>

							<template v-else-if="mapEditorMode=='particle'">
								<button @click="appendMapElement('MapParticle',0)">add MapParticle</button>
							</template>

							<template v-else-if="mapEditorMode=='portal'">
								<button @click="appendMapElement('MapPortal',0)">add MapPortal</button>
							</template>

							<button>duplicate</button>
							<button>remove</button>
						</div>
					</template>
				</template>
				<template slot="content" v-if="scene_map()[mapEditorMode].length!=null">
					<div :style="wnd_debug_style">
						<template v-if="mapEditorMode.startsWith('layered')">
							<ui-map-editor ref="mapEditor" :objs="scene_map()[mapEditorMode][selectedLayer]" :displayMode="displayMode"></ui-map-editor>
						</template>
						<template v-else>
							<ui-map-editor ref="mapEditor" :objs="scene_map()[mapEditorMode]" :displayMode="displayMode"></ui-map-editor>
						</template>
					</div>
				</template>
			</ui-dialog>
		</transition>
		<!-- end mapEditor -->
		<!-------------------------------------------------------------------------->
		<!-- begin spriteViewer -->
		<transition name="fade">
			<ui-dialog title="SpriteViewer" ref="spriteViewer" v-show="true||workInProgress" :options="{width:'25em',height:'18em',hasHeader:true}">
				<template slot="header">
					Map Sprite Viewer
				</template>
				<template slot="content">
					<ui-map-sprite-viewer></ui-map-sprite-viewer>
				</template>
			</ui-dialog>
		</transition>
		<!-- end spriteViewer -->
		<!-------------------------------------------------------------------------->
		<!-- begin box2dEditor -->
		<transition name="fade">
			<ui-dialog title="ShapeEditor" ref="box2dEditor" v-show="workInProgress" :options="{width:'25em',height:'18em',hasHeader:true}">
				<template slot="header">
					Shape Editor
				</template>
				<template slot="content">
					<box2d-shape-editor :shape="sceneEditor.selectedShape"></box2d-shape-editor>
				</template>
			</ui-dialog>
		</transition>
		<!-- end box2dEditor -->
		<!-------------------------------------------------------------------------->
		<!-- begin UIShapeList -->
		<transition name="fade">
			<ui-dialog title="ShapeList" ref="uiShapeList" v-show="workInProgress" :options="{width:'13em',height:'18em',hasHeader:true}">
				<template slot="header">
					Shape List
				</template>
				<template slot="content">
					<ui-shape-list :editor="sceneEditor"></ui-shape-list>
				</template>
			</ui-dialog>
		</transition>
		<!-- end UIShapeList -->
		<!-------------------------------------------------------------------------->
		<!-- begin UIFixtureList -->
		<transition name="fade">
			<ui-dialog title="FixtureList" ref="uiFixtureList" v-show="workInProgress" :options="{width:'13em',height:'18em',hasHeader:true}">
				<template slot="header">
					Fixture List
				</template>
				<template slot="content">
					<ui-fixture-list :editor="sceneEditor"></ui-fixture-list>
				</template>
			</ui-dialog>
		</transition>
		<!-- end UIFixtureList -->
		<!-------------------------------------------------------------------------->
		<!-- begin UIBodyList -->
		<transition name="fade">
			<ui-dialog title="BodyList" ref="uiBodyList" v-show="workInProgress" :options="{width:'13em',height:'18em',hasHeader:true}">
				<template slot="header">
					Body List
				</template>
				<template slot="content">
					<ui-body-list :editor="sceneEditor"></ui-body-list>
				</template>
			</ui-dialog>
		</transition>
		<!-- end UIBodyList -->
		<!-------------------------------------------------------------------------->
		<!-- begin constex menu -->
		<transition name="fade">
			<ui-menu :show="is_show_chara_dl_menu" ref="chara_dl_menu" @close="closeCharacterDLMenu" style="position: absolute; width: 8em; z-index: 99999;">
				<template v-if="chara">
					<a @click="_save_as_png">Save as PNG</a>
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
		<!-- end constex menu -->
	</div>
</template>

<script>
	import Vuex from 'vuex';

	import InputNumber from "../components/input-number.vue";
	import InputSelect from "../components/input-select.vue";
	
	import UIDialog from '../components/ui-dialog.vue';
	import UISortable from '../components/ui-sortable.vue';
	import UITrigger from '../components/ui-trigger.vue';
	import UIMenu from '../components/ui-menu.vue';

	import UIEquipBox from './ui-equip-box.vue';
	import UICharacter from './ui-character.vue';
	import UICharacterSVG from './ui-character-svg.vue';
	import UICharacterRenderer from './ui-character-renderer.vue';

	import UIMobList from "./ui-mob-list.vue";
	import UIMapEditor from "./ui-map-editor.vue";
	import UIMapSpriteViewer from "./ui-map-sprite-viewer.vue";

	import Box2dShapeEditor from "./SceneEditor/box2d-shape-editor.vue";
	import UIShapeList from "./SceneEditor/shape-list.vue";
	import UIFixtureList from "./SceneEditor/fixture-list.vue";
	import UIBodyList from "./SceneEditor/body-list.vue";
	import { ShapeDef } from "./SceneEditor/ShapeDefinition.js";
	import { FixtureDef } from "./SceneEditor/FixtureDefinition.js";
	import { BodyDef } from "./SceneEditor/BodyDefinition.js";

	//import { GameStateManager } from '../game/GameState.js';
	
	import { ItemCategoryInfo } from "../Common/ItemCategoryInfo.js";
	import { BaseSceneCharacter, SceneCharacter, SceneRemoteCharacter } from '../game/SceneCharacter.js';

	import { engine } from '../game/Engine.js';

	class SceneEditor {
		constructor() {
			/** @type {BodyDef[]} */
			this.bodies = [];

			/** @type {FixtureDef[]} */
			this.fixtures = [];

			/** @type {ShapeDef[]} */
			this.shapes = [];

			/** @type {JointDef[]} */
			this.joints = [];


			/** @type {BodyDef} */
			this._selectedBody = null;

			/** @type {FixtureDef} */
			this._selectedFixture = null;

			/** @type {ShapeDef} */
			this._selectedShape = null;

			/** @type {JointDef} */
			this._selectedJoint = null;


			/** @type {string} */
			this._selectedBodyName = null;

			/** @type {string} */
			this._selectedFixtureName = null;

			/** @type {string} */
			this._selectedShapeName = null;

			/** @type {string} */
			this._selectedJointName = null;
		}

		get selectedBody() {
			return this._selectedBody;
		}
		get selectedFixture() {
			return this._selectedFixture;
		}
		get selectedShape() {
			return this._selectedShape;
		}
		get selectedJoint() {
			return this._selectedJoint;
		}

		set selectedBodyName(bodyName) {
			this.selectBody(bodyName);
		}
		set selectedFixtureName(fixtureName) {
			this.selectFixture(fixtureName)
		}
		set selectedShapeName(shapeName) {
			this.selectShape(shapeName);
		}
		set selectedJointName(jointName) {
			this.selectJoint(jointName);
		}

		get selectedBodyName() {
			return this._selectedBodyName;
		}
		get selectedFixtureName() {
			return this._selectedFixtureName;
		}
		get selectedShapeName() {
			return this._selectedShapeName;
		}
		get selectedJointName() {
			return this._selectedJointName;
		}

		/**
		 * @param {string} bodyName
		 */
		selectBody(bodyName) {
			this._selectedBodyName = bodyName;
			this._selectedBody = this.bodies.find(function (value) {
				if (value.name == bodyName) {
					return true;
				}
			});
		}

		/**
		 * @param {string} fixtureName
		 */
		selectFixture(fixtureName) {
			this._selectedFixtureName = fixtureName;
			this._selectedFixture = this.fixtures.find(function (value) {
				if (value.name == fixtureName) {
					return true;
				}
			});
		}

		/**
		 * @param {string} shapeName
		 */
		selectShape(shapeName) {
			this._selectedShapeName = shapeName;
			this._selectedShape = this.shapes.find(function (value) {
				if (value.name == shapeName) {
					return true;
				}
			});
		}

		/**
		 * @param {string} jointName
		 */
		selectJoint(jointName) {
			this._selectedJointName = jointName;
			this._selectedJoint = this.joints.find(function (value) {
				if (value.name == jointName) {
					return true;
				}
			});
		}

		/**
		 * @param {string} bodyName
		 */
		getBodyByName(bodyName) {
			return this.bodies.find(function (value) {
				if (value.name == bodyName) {
					return true;
				}
			});
		}

		/**
		 * @param {string} fixtureName
		 */
		getFixtureByName(fixtureName) {
			return this.fixtures.find(function (value) {
				if (value.name == fixtureName) {
					return true;
				}
			});
		}

		/**
		 * @param {string} shapeName
		 */
		getShapeByName(shapeName) {
			return this.shapes.find(function (value) {
				if (value.name == shapeName) {
					return true;
				}
			});
		}

		/**
		 * @param {string} jointName
		 */
		getJointByName(jointName) {
			return this.joints.find(function (value) {
				if (value.name == jointName) {
					return true;
				}
			});
		}
	}

	class EditorState {
		constructor() {
			/** @type {BaseSceneCharacter[]} chara */
			this.charaList = [];

			/** @type {BaseSceneCharacter} chara */
			this.chara = null;

			/** @type {string} id */
			this.selected = null;

			this._last_id = 0;

			this.progressValue = 0;
			this.progressMaximum = 0;

			this.sceneEditor = new SceneEditor();
		}
	}

	let editorState = new EditorState();
	if (module.hot) {
		Object.assign(editorState, window.$hot$editor_store);
	}
	const store = new Vuex.Store({
		//strict: process.env.NODE_ENV !== 'production',
		state: editorState,
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
			moveCharaOrder: function (context, payload) {
				const state = context.state;
				
				if (state.charaList.length <= 1) {
					return;
				}
				const { id = payload.name, moveTo } = payload;//id === name
				
				let move_chara;
				for (let i = 0; i < state.charaList.length; ++i) {
					const chara = state.charaList[i];
					if (chara.id == id) {
						if (chara.$remote) {
							return false;
						}
						else {
							move_chara = state.charaList.splice(i, 1)[0];
							break;
						}
					}
				}
				if (move_chara) {
					state.charaList.splice(moveTo, 0, move_chara);
					return true;
				}
				else {
					throw new Error("");
				}
			},
			deleteCharacter: function (context, payload) {
				const state = context.state;
				
				//no delete default character
				if (state.charaList.length <= 1) {
					return;
				}
				const { id = payload.name } = payload;//id === name
				
				let delete_chara;
				for (let i = 0; i < state.charaList.length; ++i) {
					const chara = state.charaList[i];
					if (chara.id == id) {
						if (chara.$remote && !payload.leave) {
							return false;
						}
						else {
							delete_chara = state.charaList.splice(i, 1)[0];
							break;
						}
					}
				}
				if (delete_chara) {
					if (delete_chara.$physics) {
						delete_chara.$physics._destroy();
					}

					//??
					if (!delete_chara.$remote) {
						delete_chara.$physics = null;
						delete_chara.renderer = null;
					}
					
					if (state.charaList.length) {
						context.dispatch('selectChara', {
							id: state.charaList[state.charaList.length - 1].id,
							moveCharaPosition: false,
						});
					}
					return true;
				}
				else {
					throw new Error("");
				}
			},
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
				debugger;
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
					/** @type {SceneCharacter} */
					const selected_chara = state.charaList[index];
					if (selected_chara.$remote) {
						return;
					}

					try {
						const oldSelectChara = state.chara;
						if (oldSelectChara) {
							oldSelectChara.enablePhysics = false;
						}

						selected_chara.enablePhysics = true;

						if (payload.moveCharaPosition) {
							if (selected_chara.$physics) {
								const x = selected_chara.renderer.x / $gv.CANVAS_SCALE;
								const y = selected_chara.renderer.y / $gv.CANVAS_SCALE;
								selected_chara.$physics.setPosition(x, y, true);
							}
						}
					}
					catch (ex) {
						console.error(ex);
						debugger;
					}

					window.chara = state.chara = selected_chara;
					//
					state.selected = id;

					return id;
				}
			},
			_addChara: async function (context, payload) {//add exist
				const state = context.state;

				if (payload && payload.chara instanceof BaseSceneCharacter) {
					const chara = payload.chara;

					await chara.renderer.__synchronize();

					state.charaList.push(chara);
					if (chara.$physics.__ob__) {
						throw new Error("should not reactivity");
					}

					context.dispatch('selectChara', {
						id: chara.id,
						moveCharaPosition: false,
					});

					context.commit("increaseProgress", { amount: 1 });

					return chara;
				}
				debugger;
			},
			_createChara: async function (context, payload) {
				const scene_map = window.scene_map;
				try {
					if (scene_map && scene_map.$promise) {
						await scene_map.$promise;
					}
				}
				catch (ex) {
					throw ex;
				}
				
				if (window.$io && payload && payload.remote_chara) {
					//alert("dont use _createChara in online mode");
					//return;
					payload.emplace = payload.remote_chara;
				}
				const state = context.state;

				context.commit("increaseId");
				const id = context.getters.lastId;

				/** @type {SceneCharacter} */
				let chara;

				//const handler = {
				//	defineProperty(target, key, descriptor) {
				//		if (key == "$physics") {
				//			debugger;
				//		}
				//		return Reflect.defineProperty(...arguments);
				//	},
				//	set(target, key, descriptor) {
				//		if (key == "$physics") {
				//			debugger;
				//		}
				//		return Reflect.set(...arguments);
				//	},
				//	ownKeys(target, key, descriptor) {
				//		if (key == "$physics") {
				//			debugger;
				//		}
				//		return Reflect.ownKeys(...arguments);
				//	},
				//};
				if (payload && payload.remote_chara) {
					chara = new SceneRemoteCharacter(window.scene_map);
					//chara = new Proxy(new SceneRemoteCharacter(window.scene_map), handler);
				}
				else {
					chara = new SceneCharacter(window.scene_map);
					//chara = new Proxy(new SceneCharacter(window.scene_map), handler);
				}
				chara.id = id;

				//step 1: load base data
				await chara.renderer.load();
				context.commit("increaseProgress", { amount: 1 });

				//step 2: load equip...
				if (payload) {
					if (payload.chara instanceof BaseSceneCharacter) {//clone
						chara.renderer._parse(payload.chara.renderer._stringify(false));

						chara.renderer.x = payload.chara.renderer.x;
						chara.renderer.y = payload.chara.renderer.y;
					}
					else if (payload.emplace) {
						chara.id = payload.emplace.id;
						if (payload.emplace.code) {
							console.warn("emplace.code is deprecated");
							chara.renderer._parse(payload.emplace.code);
						}
						if (payload.emplace.data) {
							if (payload.emplace.data.equips_code) {
								console.warn("emplace.data.equips_code is deprecated");
								chara.renderer._parse(payload.emplace.data.equips_code);
							}
							else {
								chara.set(payload.emplace.data);
							}
						}
					}
				}
				else {
					chara.renderer._setup_test();
				}

				/** @type {typeof chara} */
				let result = await context.dispatch('_addChara', {
					chara: chara,
				});
				
				return result;
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
	if (module.hot) {
		window.$hot$editor_store = store;
	}

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
				displayMode: 2,
				selectedLayer: 0,
				wnd_debug_style: { background: "#ffffff" },

				wnds: {
					menu: { name: "$menu", visable: true },
					character_list: { name: "Characters", visable: true },
					character_renderer: { name: "Character renderer", visable: true },
					equip_box: { name: "Equip box", visable: true },
					spawnpoint: { name: "Spawn point", visable: true },
					debug_window: { name: "Map editor (Debug)", visable: true, },
				},

				workInProgress: false,

				_elem_bgm: document.getElementById("bgm"),

				gv: $gv,
			}
		},
		computed: Object.assign(
			Vuex.mapState({
				charaList: "charaList",	// chara[]
				selected: "selected",	// charaId
				chara: "chara",			// current chara
				progressValue: "progressValue",
				progressMaximum: "progressMaximum",
				sceneEditor: "sceneEditor",
			}),
			{
			}
		),
		methods: {
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
					id: id,
					moveCharaPosition: true,
				});
			},
			addNewChara: async function () {
				console.log("create new character");
				await this.$store.dispatch('createChara');
				if (scene_map) {
					scene_map.addChara(chara, {
						position: {
							x: ($gv.m_viewRect.x + window.innerWidth / 2) / $gv.CANVAS_SCALE,
							y: ($gv.m_viewRect.y + window.innerHeight / 2) / $gv.CANVAS_SCALE,
						},
					});
				}
			},
			addCloneChara: function (chara) {
				console.log("clone character: " + chara.id);
				this.$store.dispatch('createChara', {
					chara: chara
				});
			},
			moveCharacterOrder: function (chara, moveTo) {
				this.$store.dispatch('moveCharaOrder', {
					id: chara.id,
					moveTo: moveTo,
				});
			},
			deleteCharacter: function (chara) {
				console.log("delete character: " + chara.id);
				this.$store.dispatch('deleteCharacter', {
					id: chara.id,
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
			$hairMixColor2: function ({ color, mix }) {
				const vm = this;

				this.$store.commit("increaseProgressMax", { amount: 1 });

				this.chara.renderer.slots.hairColor2 = color;
				Promise.all([this.chara.renderer.slots.hair.$promise_hair2, this.chara.renderer.slots.hair.$promise_hair3]).then(async function (hair2, hair3) {
					await vm.chara.renderer.__synchronize(0);
					vm.chara.renderer.slots.hairMix2 = mix;
					app.updateScreen();

					vm.$store.commit("increaseProgress", { amount: 1 });
				}).catch(function (reason) {
					vm.$store.commit("increaseProgress", { amount: 1 });
				})
			},
			hairColor2: function (params) {
				this.$hairMixColor2(params);
			},
			hairMix2: function (params) {
				this.$hairMixColor2(params);
			},

			clickItem: function (payload) {
				let { id, category, equip } = payload;

				if (this.chara) {
					if (!ItemCategoryInfo.isEquip(id) || !this.chara.renderer.unuse(id)) {
						this.$store.commit("increaseProgressMax", { amount: 2 });
						try {
							this.chara.useItem(id, category, equip);
						}
						catch (ex) {
							this.$store.commit("increaseProgressMax", { amount: -2 });
							debugger;
							throw ex;
						}
						this.$store.commit("increaseProgress", { amount: 1 });
						try {
							//TODO: synchronize chair
							this.chara.renderer.__synchronize(0).then(() => {
								this.$store.commit("increaseProgress", { amount: 1 });
								app.updateScreen();
							});
						}
						catch (ex) {
							this.$store.commit("increaseProgress", { amount: 1 });//force exit
							app.updateScreen();
							debugger;
							throw ex;
						}
					}
				}
				//this.$emit("hoverItem", payload);
			},
			hoverItem: function (payload) {
				this.$emit("hoverItem", payload);
			},
			mouseleaveItem: function (payload) {
				this.$emit("mouseleaveItem", payload);
			},

			openCharacterDLMenu: function (e, id) {
				this.$store.dispatch("selectChara", {
					id: id,
					moveCharaPosition: false,
				}).then(() => {
					this.is_show_chara_dl_menu = true;

					this.$nextTick(() => {
						this.$refs.chara_dl_menu.setPosition({
							my: "left top",
							of: e,
							//collision: "fit",
						});
					});

					//console.log("openCharacterDLMenu");
				});
			},
			closeCharacterDLMenu: function () {
				this.is_show_chara_dl_menu = false;
				//console.log("closeCharacterDLMenu");
			},
			copyCharaCode: function () {
				let code = this.chara.renderer._stringify(false);
				copyToClipboard(code);
			},
			_save_as_png: function () {
				this.chara.renderer._save_as_png(engine, this.chara.id);
			},
			appendMapElement(elemType, layer) {
				const data = {};
				//const modeMap = {
				//	background: "background",
				//	frontground: "frontground",
				//	layeredObject: "",
				//	layeredTile: "",

				//	MapObject, MapObjectSkeletalAnim,
				//	MapParticle,
				//	MapTile,
				//	MapBack, MapBackAnimation, MapBackSkeletalAnim,
				//	MapPortal,
				//};
				scene_map.appendMapElement(elemType, data, layer);
				
				this.fupdate();
			},
			fupdate: function () {
				this.dirty++;

				this.$refs.mapEditor.fupdate();
			},
		},
		mounted: async function () {
			{
				const elem = document.getElementById("bgm") || this._elem_bgm;
				this._elem_bgm = elem;
				this.$refs.bgm_outer.appendChild(elem);
			}
			
			//set dialog position and size
			{
				const scr_rat_x = $gv.is_mobile ? 0 : (window.innerWidth / 1366);
				const scr_rat_y = $gv.is_mobile ? 0 : (window.innerHeight / 768);
				
				this.$refs.menu.setStyle({
					left: _to_css_px(0),
					top: _to_css_px(0),
					width: _to_css_px(310),
					height: _to_css_px(360),
					minWidth: _to_css_px(310),
				});
				
				this.$refs.character_list.setStyle({
					left: _to_css_px(350 * scr_rat_x),
					top: _to_css_px(0 * scr_rat_y),
					width: CSS.em(16.1),
					height: CSS.vh(34),
					minWidth: CSS.em(16.1),
				});
				
				this.$refs.character_renderer.setStyle({
					left: _to_css_px(900 * scr_rat_x),
					top: _to_css_px(0 * scr_rat_y),
					width: CSS.em(19),
					height: CSS.vh(30),
					minWidth: CSS.em(19),
				});
				
				this.$refs.equip_box.setStyle({
					left: _to_css_px(0 * scr_rat_x),
					top: _to_css_px(50 * scr_rat_y),
					width: CSS.em(20),
					height: _to_css_px(400),
					minWidth: CSS.em(20),
				});
				
				this.$refs.spawnpoint.setStyle({
					left: _to_css_px(350 * scr_rat_x),
					top: _to_css_px(0 * scr_rat_y),
					width: _to_css_px(600),
					height: CSS.vh(26),
					minWidth: _to_css_px(400),
				});
				this.wnds.spawnpoint.visable = false;
				
				this.$refs.debug_window.setStyle({
					left: _to_css_px(0 * scr_rat_x),
					top: _to_css_px(100 * scr_rat_y),
					width: CSS.vw(40),
					height: CSS.vh(70),
					minWidth: CSS.em(16),
				});
				this.wnds.debug_window.visable = false;
				
				function _to_css_px(val) {
					return CSS.px(Math.trunc(val));
				}
			}
		},
		beforeDestroy: function () {
			const elem = document.getElementById("bgm") || this._elem_bgm;
			this._elem_bgm = elem;
			document.getElementById("hidden_components").appendChild(elem);
		},
		components: {
			"input-number": InputNumber,
			"input-select": InputSelect,
			
			"ui-dialog": UIDialog,
			"ui-sortable": UISortable,
			"ui-trigger": UITrigger,
			"ui-menu": UIMenu,

			"ui-character": UICharacter,
			"ui-character-svg": UICharacterSVG,
			"ui-character-renderer": UICharacterRenderer,
			"ui-equip-box": UIEquipBox,

			"ui-mob-list": UIMobList,
			"ui-map-editor": UIMapEditor,

			"ui-map-sprite-viewer": UIMapSpriteViewer,

			"box2d-shape-editor": Box2dShapeEditor,
			"ui-shape-list": UIShapeList,
			"ui-fixture-list": UIFixtureList,
			"ui-body-list": UIBodyList,
		}
	}

	if (module.hot) {
		module.hot.accept();
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

	.ui-character-list {
		list-style: none;
		padding: 0;
		overflow: auto;
		width: 100%;
		margin: 0;
		position: relative;
		border-collapse: collapse;
		border-spacing: 0;
	}

	/*li.active {
		background-color: lightcyan;
	}*/
	.ui-character-list .active {
		background: linear-gradient(to bottom, #ffec64 5%, #ffab23 100%);
		background-color: #ffec64;
	}

	.ui-character-list li {
		width: 100%;
	}

	.ui-character-list table {
		width: 100%;
		border-collapse: collapse;
		border-spacing: 0;
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
		float: right;
	}
	.chara-ls-btn {
		display: inline-flex;
		padding: 0;
		background: none;
		border: 1px solid transparent;
		text-align: center;
	}
	.chara-ls-btn:hover {
		border: 1px solid gray;
		box-shadow: inset 0 0 4px 0px darkgrey;
		background: linear-gradient(to bottom, #eee1 0%,#ccca 100%);
		border-radius: 5px;
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
