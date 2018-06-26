
<template>
	<div style="position: absolute; left: 0; top: 0;">
		<div style="position: relative; width: 1366px; height: 768px; line-height: 0; overflow: hidden;">
			<dir-root p="UI/StatusBar3.img">
				<!-- begin bottomUI -->
				<dir p="mainBar">
					<div style="position: absolute; bottom: 0; width: 100%;">
						<!-- begin EXPBar -->
						<dir ref="expBar" p="EXPBar" style="position: absolute; bottom: 0;">
							<dir :p="String(system.resolution.x)">
								<dir-texture p="layer:back" style="position: relative; top: 0;"></dir-texture>
								<dir-frame p="layer:gauge" style="position: absolute; top: 0;">
									<template slot-scope="{img, path}">
										<img :data-src="path" :src='img' :style="{display: 'inline-block', 'clip-path': `polygon(0% 0%, ${stat.getExpPercentS()}% 0%, ${stat.getExpPercentS()}% 100%, 0% 100%)`}" />
										<div :style="{ position:'absolute', height:'100%', top:'0', left:stat.getExpPercentS()+'%' }">
											<dir-texture p="../../layer:effect" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></dir-texture>
										</div>
									</template>
								</dir-frame>
								<dir-texture p="layer:cover" style="position: absolute; top: 0;"></dir-texture>
							</dir>
						</dir>
						<!-- end EXPBar -->
						<!-- begin status -->
						<dir ref="status" p="status" style="position: relative; display: inline-block; padding-bottom: 10px;">
							<dir-texture p="backgrnd" style="position: absolute;"></dir-texture>

							<!--<dir-texture p="gauge/hp/layer:0" :style="{position:'absolute', width:Math.trunc(stat.hp*100/stat.mhp)+'%'}"></dir-texture>-->
							<dir-frame p="gauge/hp/layer:0" style="position: absolute;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="{display: 'inline-block', 'clip-path': `polygon(0% 0%, ${stat.getHpPercentS()}% 0%, ${stat.getHpPercentS()}% 100%, 0% 100%)`}" />
									<div style="position: absolute; margin: auto; bottom: 2px;">
										<table class="table">
											<tr>
												<td style="width: 50%;">
													<div style="float: right; display: inline-flex;">
														<dir-texture v-for="(i, k) in String(stat.hp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></dir-texture>
													</div>
												</td>
												<td width="1">
													<dir-texture p="../../number/%5c" style=""></dir-texture>
												</td>
												<td style="width: 50%;">
													<div style="display: inline-flex;">
														<dir-texture v-for="(i, k) in String(stat.mhp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></dir-texture>
													</div>
												</td>
											</tr>
										</table>
									</div>
								</template>
							</dir-frame>

							<dir-frame p="gauge/mp/layer:0" style="position: absolute;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="{display: 'inline-block', 'clip-path': `polygon(0% 0%, ${stat.getMpPercentS()}% 0%, ${stat.getMpPercentS()}% 100%, 0% 100%)`}" />
									<div style="position: absolute; margin: auto; bottom: 2px;">
										<table class="table">
											<tr>
												<td style="width: 50%;">
													<div style="float: right; display: inline-flex;">
														<dir-texture v-for="(i, k) in String(stat.mp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></dir-texture>
													</div>
												</td>
												<td width="1">
													<dir-texture p="../../number/%5c" style=""></dir-texture>
												</td>
												<td style="width: 50%;">
													<div style="display: inline-flex;">
														<dir-texture v-for="(i, k) in String(stat.mmp)" :p="`../../number/${i}`" :key="k" style="flex: 1;"></dir-texture>
													</div>
												</td>
											</tr>
										</table>
									</div>
								</template>
							</dir-frame>

							<dir-texture p="layer:cover" style="position: relative;"></dir-texture>

							<dir-texture p="layer:Lv" style="position: absolute; top: 0;">
								<div style="display: inline-flex;">
									<dir-texture v-for="(i, k) in String(stat.level)" :p="`../lvNumber/${i}`" :key="k" style="flex: 1;"></dir-texture>
								</div>
								<div class="text-fff-334" style="z-index: 20; margin-left: 19px; display:inline-block; transform: translateY(-2px);">
									{{chara ? chara.id:""}}
								</div>
							</dir-texture>
						</dir>
						<!-- end status -->
						<!-- begin menu -->
						<dir v-if="ui.quickSlotFold" ref="menu" p="menu" style="position: relative; display: inline-block; padding-bottom: 10px;">
							<dir-button p="button:Menu" @click="trigger_editor_mode()" style="position: relative;"></dir-button>
							<dir-button p="button:Setting" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></dir-button>
							<dir-button p="button:Community" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></dir-button>
							<dir-button p="button:Character" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></dir-button>
							<dir-button p="button:Event" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></dir-button>
							<dir-button p="button:CashShop" @click="trigger_editor_mode()" style="position: absolute; top: 0;"></dir-button>
						</dir>
						<!-- end menu -->
						<!-- begin quickSlot -->
						<dir p="quickSlot" :style="{ position:'absolute', bottom:0, 'padding-bottom':'13px', right:(ui.quickSlotFold?'-208px':'3px') }">
							<dir-frame p="backgrnd" style="position: relative; left: 0; top: 0;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="ui.quickSlotFold?{'clip-path': `polygon(0% 0%, ${350}px 0%, ${350}px 100%, 0% 100%)`}:{}" />
								</template>
							</dir-frame>

							<dir-frame p="layer:cover" style="position: absolute; left: 0; top: 0;">
								<template slot-scope="{img, path}">
									<img :data-src="path" :src='img' :style="ui.quickSlotFold?{'clip-path': `polygon(0% 0%, ${350}px 0%, ${350}px 100%, 0% 100%)`}:{}" />
								</template>
							</dir-frame>

							<template v-if="ui.quickSlotFold">
								<dir-button p="button:Extend" @click="ui.quickSlotFold=false" style="position: absolute; left: 0; top: 0;"></dir-button>
							</template>
							<template v-else>
								<dir-button p="button:Fold" @click="ui.quickSlotFold=true" style="position: absolute; left: 0; top: 0;"></dir-button>
							</template>
						</dir>
						<!-- end quickSlot -->
					</div>
				</dir>
				<dir p="chat" style="position: absolute; left: 0; bottom: 0; padding-bottom: 13px;">
					<div style="position: relative;">
						<dir :p="ui.chat.size" style="position: absolute; width: 100%; height: 100%;">
							<table class="table" style="position: absolute; left: 0; top: 0; height: 100%;">
								<tr style="line-height: 0;">
									<td>
										<dir-texture p="top"></dir-texture>
									</td>
								</tr>
								<tr style="height: 100%; line-height: 0;">
									<td>
										<dir-extend-bg p="center" style="height: 100%;"></dir-extend-bg>
									</td>
								</tr>
								<tr style="line-height: 0;">
									<td>
										<dir-texture p="bottom"></dir-texture>
									</td>
								</tr>
							</table>
						</dir>
						<table class="table" style="position: relative; top: -5px;">
							<template v-if="ui.chat.size!='min'">
								<tr v-for="ch in ui.chat.history" style="height: 1.2em; color: white; font-family: monospace;">
									<td style="padding-left: 4px; padding-bottom: 0.2em;">
										<div style="position: absolute;">{{ch}}</div>
									</td>
								</tr>
								<tr v-for="i in ui.chat.maxHistory - ui.chat.history.length" style="height: 1.2em; color: white; font-family: monospace;">
									<td style="padding-left: 4px; padding-bottom: 0.2em;">
										<div style="position: absolute;"></div>
									</td>
								</tr>
							</template>
							<tr>
								<td style="width: 0; padding-right: 3px;">
									<dir-button p="common/chatTarget/all" style="display: inline-block; margin-left: 5px;"></dir-button>
								</td>
								<td style="width: 0; padding-right: 4px;">
									<dir-frame :p="ui.chat.size+'/chatEnter'" style="display: inline-block; font-family: monospace;">
										<template slot-scope="{img, path, width}">
											<div v-if="ui.chat.size!='min'" :data-src="path" :style="{ width:`${width}px`, background:`url(${img})` }">
												<input type="text" v-model="ui.chat.inputText" @keydown.enter="enterChatText(ui.chat.inputText.slice(0, 70))" style="width: 100%; padding: 2px; padding-left: 5px; border: none; outline: none; color: white; background: transparent;" />
											</div>
											<div v-else :data-src="path" :style="{ width:`${width}px`, color: 'white' }">
												<div v-if="ui.chat.history.length" style="position: absolute;">{{ui.chat.history[ui.chat.history.length-1]}}</div>
											</div>
										</template>
									</dir-frame>
								</td>
								<td v-if="ui.chat.size=='min'" style="width: 0; padding-right: 2px;">
									<dir-button p="common/chatOpen" @click="ui.chat.size='max'" style="display: inline-block; position: relative; padding-left: 21px;"></dir-button>
								</td>
								<template v-else>
									<td style="width: 0; padding-right: 5px;">
										<dir-button p="common/chatClose" @click="ui.chat.size='min'" style="display: inline-block;"></dir-button>
									</td>
									<td style="width: 0; padding-right: 5px;">
										<dir-button p="common/BtChat" style="display: inline-block;"></dir-button>
									</td>
								</template>
							</tr>
							<template>
							</template>
						</table>
					</div>
				</dir>
				<!-- end bottomUI -->
			</dir-root>
		</div>
	</div>
</template>

<script>
	//import Vue from "vue";
	//import Vuex from "vuex";
	import BasicComponent from "./BasicComponent.vue";

	import { CharacterStat } from "../Common/PlayerData.js";

	//Vue.config.productionTip = false;

	//Vue.use(Vuex);

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
					}
				},
				ui: {
					quickSlotFold: true,
					chat: {
						inputText: "",
						size: "min",
						maxHistory: 10,
						history: [],
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
				m_editor_mode = !m_editor_mode;

				app.vue.editor_mode = m_editor_mode;
			},
			enterChatText: async function (inputText) {
				let result = await this.chara.say(inputText);
				if (result) {
					this.pushChatHistory(this.chara.id + ' : ' + inputText);
	
					this.ui.chat.inputText = '';
				}
			},
			pushChatHistory(type, style, text) {
				this.ui.chat.history.push(text);

				if (this.ui.chat.history.length > this.ui.chat.maxHistory) {
					this.ui.chat.history.shift();
				}
			}
		},
		mounted: function () {
			window.$statusBar = this;
		},
		updated: async function () {
			let vm = this;
			
			vm.$nextTick(async function () {
				await this.$store.dispatch("waitAllLoaded");

				if (vm.$refs.status) {
					//$(vm.$refs.status.$el).draggable({ containment: "parent", snap: true, cancel: ".draggable-cancel" });
					$(vm.$refs.status.$el).position({ my: "center bottom", at: "center top+33", of: $(vm.$refs.expBar.$el) });
				}

				if (vm.$refs.menu) {
					//$(vm.$refs.menu.$el).draggable({ containment: "parent", snap: true, cancel: ".draggable-cancel" });
					$(vm.$refs.menu.$el).position({ my: "left bottom", at: "center+110 top+33", of: $(vm.$refs.expBar.$el) })
				}

				//$(vm.$refs.dummy_expBar).draggable({ containment: "parent", snap: true, cancel: ".draggable-cancel" });
			});
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

</style>
