
<template>
	<div style="position: absolute; left: 0; top: 0;">
		<div :style="{'position': 'relative', 'width': system.resolution.x+'px', 'height': system.resolution.y+'px', 'line-height': 0}">
			<gui-root p="UI/StatusBar3">
				<!-- begin bottomUI -->
				<gui p="mainBar">
					<div style="position: absolute; bottom: 0; width: 100%;">
						<!-- begin EXPBar -->
						<gui ref="expBar" p="EXPBar" style="position: absolute; bottom: 0;">
							<gui :p="String(system.resolution.x)">
								<gui-texture p="layer:back" style="position: relative; top: 0;"></gui-texture>
								<gui-frame p="layer:gauge" style="position: absolute; top: 0;">
									<template slot-scope="{img, path}">
										<img :data-src="path" :src='img' :style="{display: 'inline-block', 'clip-path': `polygon(0% 0%, ${stat.getExpPercentS()}% 0%, ${stat.getExpPercentS()}% 100%, 0% 100%)`}" />
										<div :style="{ position:'absolute', height:'100%', top:'0', left:stat.getExpPercentS()+'%' }">
											<gui-texture p="../../layer:effect" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></gui-texture>
										</div>
									</template>
								</gui-frame>
								<gui-texture p="layer:cover" style="position: absolute; top: 0;"></gui-texture>
							</gui>
						</gui>
						<!-- end EXPBar -->
						<!-- begin status -->
						<gui ref="status" p="status" style="position: relative; display: inline-block; padding-bottom: 10px;">
							<gui-texture p="backgrnd" style="position: absolute;"></gui-texture>

							<!--<gui-texture p="gauge/hp/layer:0" :style="{position:'absolute', width:Math.trunc(stat.hp*100/stat.mhp)+'%'}"></gui-texture>-->
							<gui-frame p="gauge/hp/layer:0" style="position: absolute;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="{display: 'inline-block', 'clip-path': `polygon(0% 0%, ${stat.getHpPercentS()}% 0%, ${stat.getHpPercentS()}% 100%, 0% 100%)`}" />
									<div style="position: absolute; margin: auto; bottom: 2px;">
										<table class="table">
											<tr>
												<td style="width: 50%;">
													<div style="float: right; display: inline-flex;">
														<gui-texture v-for="(i, k) in String(stat.hp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></gui-texture>
													</div>
												</td>
												<td width="1">
													<gui-texture p="../../number/%5c" style=""></gui-texture>
												</td>
												<td style="width: 50%;">
													<div style="display: inline-flex;">
														<gui-texture v-for="(i, k) in String(stat.mhp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></gui-texture>
													</div>
												</td>
											</tr>
										</table>
									</div>
								</template>
							</gui-frame>

							<gui-frame p="gauge/mp/layer:0" style="position: absolute;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="{display: 'inline-block', 'clip-path': `polygon(0% 0%, ${stat.getMpPercentS()}% 0%, ${stat.getMpPercentS()}% 100%, 0% 100%)`}" />
									<div style="position: absolute; margin: auto; bottom: 2px;">
										<table class="table">
											<tr>
												<td style="width: 50%;">
													<div style="float: right; display: inline-flex;">
														<gui-texture v-for="(i, k) in String(stat.mp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></gui-texture>
													</div>
												</td>
												<td width="1">
													<gui-texture p="../../number/%5c" style=""></gui-texture>
												</td>
												<td style="width: 50%;">
													<div style="display: inline-flex;">
														<gui-texture v-for="(i, k) in String(stat.mmp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></gui-texture>
													</div>
												</td>
											</tr>
										</table>
									</div>
								</template>
							</gui-frame>

							<gui-texture p="layer:cover" style="position: relative;"></gui-texture>

							<gui-texture p="layer:Lv" style="position: absolute; top: 0;">
								<div style="display: inline-flex;">
									<gui-texture v-for="(i, k) in String(stat.level)" :p="`../lvNumber/${i}`" :key="k" style="flex: 1;"></gui-texture>
								</div>
								<div class="text-fff-334" style="z-index: 20; margin-left: 19px; display:inline-block; transform: translateY(-2px);">
									{{chara ? chara.id:""}}
								</div>
							</gui-texture>
						</gui>
						<!-- end status -->
						<!-- begin menu -->
						<gui v-if="ui.quickSlotFold" ref="menu" p="menu" style="position: relative; display: inline-block; padding-bottom: 10px;">
							<gui-button p="button:Menu" @click="trigger_editor_mode()" style="position: relative;"></gui-button>
							<gui-button p="button:Setting" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></gui-button>
							<gui-button p="button:Community" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></gui-button>
							<gui-button p="button:Character" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></gui-button>
							<gui-button p="button:Event" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></gui-button>
							<gui-button p="button:CashShop" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></gui-button>
						</gui>
						<!-- end menu -->
						<!-- begin quickSlot -->
						<gui p="quickSlot" :style="{ position:'absolute', bottom:0, 'padding-bottom':'13px', right:(ui.quickSlotFold?'-208px':'3px') }">
							<gui-frame p="backgrnd" style="position: relative; left: 0; top: 0;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="ui.quickSlotFold?{'clip-path': `polygon(0% 0%, ${350}px 0%, ${350}px 100%, 0% 100%)`}:{}" />
								</template>
							</gui-frame>

							<gui-frame p="layer:cover" style="position: absolute; left: 0; top: 0;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="ui.quickSlotFold?{'clip-path': `polygon(0% 0%, ${350}px 0%, ${350}px 100%, 0% 100%)`}:{}" />
								</template>
							</gui-frame>

							<template v-if="ui.quickSlotFold">
								<gui-button p="button:Extend" @click="ui.quickSlotFold=false" style="position: absolute; left: 0; top: 0;"></gui-button>
							</template>
							<template v-else>
								<gui-button p="button:Fold" @click="ui.quickSlotFold=true" style="position: absolute; left: 0; top: 0;"></gui-button>
							</template>
						</gui>
						<!-- end quickSlot -->
					</div>
				</gui>
				<gui p="chat" style="position: absolute; left: 0; bottom: 0; padding-bottom: 13px;">
					<div style="position: relative;">
						<gui :p="'ingame/view/'+ui.chat.size" style="position: relative; width: 100%; height: 100%;">
							<!-- begin char bg -->
							<gui-frame p="top">
								<template slot-scope="{img, path, width, height}">
									<img :data-src="path" :src='img' :style="{width:width+'px', height:height+'px'}" />

									<div :style="{position: 'absolute', left: 0, top: 0, width:width+'px', height:height+'px'}">
										<!-- begin size button -->
										<gui p="../..">
											<template v-if="ui.chat.size=='max'">
												<gui-button p="drag" style="position: absolute; left: 3px; top: 3px;"></gui-button>
												<gui-button p="btMin" @click="ui.chat.size='min'" style="position: absolute; right: 3px; top: 3px;"></gui-button>
											</template>
										</gui>
										<!-- end size button -->
									</div>
								</template>
							</gui-frame>
							<table v-if="ui.chat.size=='max'" class="table" style="width: 100%;">
								<tr style="height: 100%; line-height: 0;">
									<td>
										<gui-extend-bg p="center" style="height: 100%;">
											<!-- begin char text -->
											<table class="table" style="width: calc(100% - 16px);">
												<tr v-for="ch in ui.chat.history">
													<td>
														<div class="chat-text">{{ch.text}}</div>
													</td>
												</tr>
												<tr v-for="i in ui.chat.maxHistory - ui.chat.history.length">
													<td>
														<div class="chat-text"></div>
													</td>
												</tr>
											</table>
											<!-- end char text -->
										</gui-extend-bg>
									</td>
								</tr>
							</table>
							<gui-frame p="bottom">
								<template slot-scope="{img, path, width, height}">
									<img :data-src="path" :src='img' :style="{width:width+'px', height:height+'px'}" />

									<div :style="{position: 'absolute', left: 0, top: 0, width:width+'px', height:height+'px'}">
										<!-- begin size button -->
										<template v-if="ui.chat.size!='max'">
											<gui-button p="../../btMax" @click="ui.chat.size='max'" style="position: absolute; right: 3px; bottom: 8px;"></gui-button>
										</template>
										<!-- end size button -->
									</div>
								</template>
							</gui-frame>
							<div v-if="ui.chat.size!='max' && ui.chat.history.length > 0" style="position: absolute; left: 0; top: 8px;">
								<gui-button p="ingame/view/drag" style="display: block; position: relative; left: 3px; top: 3px;"></gui-button>
								<div class="chat-text">{{ui.chat.history[ui.chat.history.length - 1].text}}</div>
							</div>
							<!-- end char bg -->
						</gui>
					</div>
					<div v-if="ui.chat.displayInput" style="position:relative;">
						<gui-texture p="ingame/input/layer:backgrnd"></gui-texture>
						<!-- begin target button -->
						<div style="position: absolute; top: 0; width: 0px; margin-left: 4px; margin-top: 5px;">
							<gui-button p="common/chatTarget/all"></gui-button>
						</div>
						<!-- end target text -->
						<!-- begin chat input -->
						<gui-frame p="ingame/input/layer:chatEnter" style="position: absolute; top: 0; display: inline-block; font-family: monospace;">
							<template slot-scope="{img, path, width, height}">
								<div :data-src="img" :style="{ width:`${width}px`, height:`${height}px`, background:`url(${img})` }">
									<input type="text" v-model="ui.chat.inputText" @keydown.enter="enterChatText(ui.chat.inputText.slice(0, 70))" style="width: 100%; padding: 2px; padding-left: 5px; border: none; outline: none; color: white; background: transparent;" />
								</div>
							</template>
						</gui-frame>
						<!-- end chat input -->
					</div>
				</gui>
				<!-- end bottomUI -->
			</gui-root>
		</div>
	</div>
</template>

<script>
	//import Vue from "vue";
	//import Vuex from "vuex";
	import BasicComponent from "./BasicComponent.vue";

	import { CharacterStat } from "../Common/PlayerData.js";
	//import { SceneCharacter } from "../game/SceneCharacter";

	//Vue.config.productionTip = false;

	//Vue.use(Vuex);

	class PlayerTalk {
		constructor(type, style, text) {
			this.type = type;
			this.style = style;
			this.text = text;
		}
	}

	export default {
		props: [
			"chara"
		],
		data: function () {
			return {
				system: {
					resolution: {
						x: 1366,
						y: 768
					},
					optionMenu: {
						resolution: {
							"1366 x 768": {
								x: 1366,
								y: 768
							},
							"1024 x 720": {
								x: 1366,
								y: 768
							},
							"800 x 600": {
								x: 1366,
								y: 768
							}
						},
					},
					_$window_resize: null,
				},
				ui: {
					quickSlotFold: true,
					chat: {
						displayInput: true,

						inputText: "",
						size: "max",
						maxHistory: 10,

						/** @type {PlayerTalk[]} */
						history: [],

						/** @type {string[]} */
						inputHistory: [],
					},
				}
			};
		},
		computed: {
			stat: {
				get: function () {
					if (this.chara && this.chara.stat) {
						return this.chara.stat;
					}
					else {
						return new CharacterStat();//dummy
					}
				},
				set: function () {
					this.$forceUpdate();
				}
			}
		},
		methods: {
			trigger_editor_mode: function () {
				$gv.m_editor_mode = !$gv.m_editor_mode;

				app.vue.editor_mode = $gv.m_editor_mode;
			},
			enterChatText: async function (inputText) {
				/** @type {SceneCharacter} */
				const chara = this.chara;

				let result = await chara.say(inputText);
				if (result) {
					this.pushChatHistory(0, chara.chatCtrl.style, chara.id + ' : ' + inputText);
	
					this.ui.chat.inputText = '';
				}
			},
			pushChatHistory: function (type, style, text) {
				this.ui.chat.history.push(new PlayerTalk(type, style, text));

				if (this.ui.chat.history.length > this.ui.chat.maxHistory) {
					this.ui.chat.history.shift();
				}
			},
			_window_onresize: function (event) {
				//const width = window.innerWidth;
				const height = window.innerHeight;

				//resolution from this.system.optionMenu.resolution
				//expBar = EXPBar[system.resolution.x]

				//this.system.resolution.x = width;
				this.system.resolution.y = height;

				this.updatePosition();
			},
			updatePosition: function () {
				if (this.$refs.status) {
					//$(this.$refs.status.$el).draggable({ containment: "parent", snap: true, cancel: ".draggable-cancel" });
					$(this.$refs.status.$el).position({ my: "center bottom", at: "center top+33", of: $(this.$refs.expBar.$el) });
				}

				if (this.$refs.menu) {
					//$(this.$refs.menu.$el).draggable({ containment: "parent", snap: true, cancel: ".draggable-cancel" });
					$(this.$refs.menu.$el).position({ my: "left bottom", at: "center+110 top+33", of: $(this.$refs.expBar.$el) })
				}
			},
			myUpdate: function () {
				this.$nextTick(async () => {
					//await this.$store.dispatch("waitAllLoaded");

					this.updatePosition();

					//$(this.$refs.dummy_expBar).draggable({ containment: "parent", snap: true, cancel: ".draggable-cancel" });
				});
			},
		},
		mounted: function () {
			window.$statusBar = this;
			this.system._$window_resize = this._window_onresize.bind(this);
			window.addEventListener("resize", this.system._$window_resize);

			this._window_onresize();
		},
		beforeDestroy: function () {
			window.removeEventListener("resize", this.system._$window_resize);
		},
		updated: function () {
			this.myUpdate();
		},
		mixins: [BasicComponent],
	};

</script>

<style scoped>
	
.c1 {
	background: rgba(255, 0, 0, 0.25);
}

.c2 {
	background: rgba(0, 255, 0, 0.25);
}

.c3 {
	background: rgba(0, 0, 255, 0.25);
}

.outline {
	outline: auto blue;
}

.block {
	width: calc(16em * 1.2);
	height: calc(9em * 1.2);
}

.block-sm {
	width: calc(16em * 0.6);
	height: calc(9em * 0.6);
}


.center_text_hr {
	text-align: center;
}

.center_frame {
	position: relative;
	width: 100%;
	height: 100%;
}

.center {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
}

.center_frame_hr {
	position: relative;
	width: 100%;
}

.center_hr {
	position: absolute;
	left: 50%;
	transform: translate(-50%, 0);
}

.text-fff-334 {
	font-size: 13px;
	color: white;
	text-shadow: 0 0 1px #334, -1px -1px #334, 1px -1px #334, -1px 1px #334, 1px 1px #334;
}

.table {
	border-collapse: collapse;
	border-spacing: 0px;
	padding: 0;
}
.table td {
	padding: 0;
}

.table.view {
	line-height: 16px;
	border-collapse: separate;
	border-spacing: 1px;
	padding: 1px;
}
.table.view td {
	padding: 1px;
}
.view-s {
	position: sticky;
	top: 0px;
}

.chat-text {
	line-height: initial;
	padding-bottom: 0.2em;
	padding-left: 4px;
	height: 1.2em;
	color: white;
	font-family: monospace;
}

</style>
