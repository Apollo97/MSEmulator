
<template>
	<div style="position: absolute; width: 100%; height: 100%; top: 0px; left: 0px; user-select: none;">
		<transition name="fade" style="position: absolute; z-index: 0;">
			<keep-alive>
				<!-- editor and statusBar need init/reset window position, size -->
				<editor ref="editor"
					v-if="is_editor_mode" class="scene-editor;"
					@hoverItem="showItemTip(...arguments);"
					@mouseleaveItem="hideItemTip(...arguments);">
				</editor>
			</keep-alive>
		</transition>

		<transition name="fade" style="position: absolute; z-index: 0;">
			<keep-alive>
				<!-- editor and statusBar need init/reset window position, size -->
				<status-bar ref="statusBar"
						v-if="!is_editor_mode"
						:chara="chara">
				</status-bar>
			</keep-alive>
		</transition>

		<!-- begin game ui -->

		<transition name="fade" style="position: absolute;">
			<keep-alive>
				<ui-window-equip v-if="isShowUIEquipWnd"
								 :chara="chara"
								 @hoverItem="showItemTip(...arguments);"
								 @mouseleaveItem="hideItemTip(...arguments);">
				</ui-window-equip>
			</keep-alive>
		</transition>

		<transition name="fade" style="position: absolute;">
			<keep-alive>
				<ui-window-item v-if="isShowUIItemWnd"
								:chara="chara"
								@hoverItem="showItemTip(...arguments);"
								@mouseleaveItem="hideItemTip(...arguments);">
				</ui-window-item>
			</keep-alive>
		</transition>

		<transition name="fade" style="position: absolute;">
			<keep-alive>
				<ui-window-stat v-if="isShowUIStatWnd"
								 :chara="chara">
				</ui-window-stat>
			</keep-alive>
		</transition>

		<transition name="fade" style="position: absolute;">
			<keep-alive>
				<ui-window-skill v-if="isShowUISkillWnd"
								 :chara="chara">
				</ui-window-skill>
			</keep-alive>
		</transition>

		<div @contextmenu.prevent class="gui" style="z-index: 100; position: absolute; width: 0; height: 0;">
			<ui-tool-tip v-if="isShowEquipTip" :isShow="isShowEquipTip"
						 :equip="equip"
						 :chara="chara"
						 :state="ItemTip_state">
			</ui-tool-tip>
		</div>

		<!-- end game ui -->
	</div>
</template>

<script>
	import Vue from "vue";
	import Vuex from "vuex";

	import Editor from "./editor/editor.vue";

	import { ItemCategoryInfo, ResourceManager, ItemAttrNormalize } from '../public/javascripts/resource.js';


	export default {
		store: Editor.store,
		data: function () {
			return {
				$gv: window.$gv,

				equip: null,
				isShowEquipTip: true,
				isShowUIEquipWnd: false,
				isShowUIItemWnd: false,
				isShowUISkillWnd: false,
				isShowUIStatWnd: false,
				m_is_always_show_tip: false,

				ItemTip_state: {
					display: false,
					position: null,/** @type {Object} */
				},

				//ui: {
				//},

				onkeydown: null,
				
				is_show_all_mode: true,
			};
		},
		computed: {
			chara: {
				get: function () {
					return this.$store.state.chara;
				},
				set: function () {
					this.$forceUpdate();
				}
			},
			is_editor_mode: {
				get: function () {
					return $gv.m_editor_mode;
				},
				set: function (value) {
					$gv.m_editor_mode = value;
				},
			},
		},
		methods: {
			showItemTip: function (_ref) {
				if (_ref) {
					let { event, /*id, category,*/ equip } = _ref;
					//let is_equip = id == null || ItemCategoryInfo.isEquip(id);

					//this.isShowEquipTip = is_equip;

					//if (is_equip) {
						this.equip = equip;
						this.ItemTip_state.display = true;
						if (!this.m_is_always_show_tip) {
							this.ItemTip_state.position = {
								my: "left top",
								at: `left+${Math.trunc(event.clientX + 1)} top+${Math.trunc(event.clientY + 1)}`,
								of: document.body,
								collision: "fit",
								using: function (pos) {
									let topOffset = $(this).stop().animate(pos, 300, "easeOutExpo").offset().top;
									if (topOffset < 0) {
										debugger
										$(this).css("top", pos.top - topOffset);
									}
								}
							};
						}
						else {
							this.ItemTip_state.position = null;
						}
					//}
				}
				else {
					this.ItemTip_state.display = true;
					if (this.m_is_always_show_tip) {
						this.ItemTip_state.position = null;
					}
				}
			},
			hideItemTip: function (equip) {
				if (!this.m_is_always_show_tip) {
					//if (equip) {
					//	this.equip = equip;
					//}
					this.ItemTip_state.display = false;
				}
			},
			_onkeydown: function (event) {
				switch (event.key) {
					case "e":
						this.isShowUIEquipWnd = !this.isShowUIEquipWnd;
						break;
					case "i":
						this.isShowUIItemWnd = !this.isShowUIItemWnd;
						break;
					case "k":
						this.isShowUISkillWnd = !this.isShowUISkillWnd;
						break;
					case "s":
						this.isShowUIStatWnd = !this.isShowUIStatWnd;
						break;
				}
			}
		},
		watch: {
			is_editor_mode: function (value) {
				if (!value && this.$refs.statusBar) {
					this.$refs.statusBar.$forceUpdate();
					if (this.$refs.statusBar.updated) {
						this.$refs.statusBar.updated();
					}
				}
			},
		},
		mounted: function () {
			let vm = this;

			this.onkeydown = function (event) {
				if (event.target.tagName != "INPUT") {
					vm._onkeydown(event);
				}
			}
			window.addEventListener("keydown", this.onkeydown);

			document.getElementById("m_is_always_show_tip").addEventListener("change", function (e) {
				e = e ? e : event;
				vm.m_is_always_show_tip = e.target.checked ? true : false;

				if (vm.m_is_always_show_tip) {
					vm.showItemTip();
				}
				else {
					vm.hideItemTip();
				}
			});
			if (vm.m_is_always_show_tip) {
				vm.showItemTip();
			}
			else {
				vm.hideItemTip();
			}
			
			this.is_show_all_mode = false;
		},
		beforeDestroy: function () {
			window.removeEventListener("keydown", this.onkeydown);
		},
		components: {
			"editor": Editor,
			"ui-tool-tip": () => import("./ui/UIToolTip/ItemTip.vue"),
			"status-bar": () => import("./ui/StatusBar.vue"),
			"ui-window-equip": () => import("./ui/UIWindow/Equip.vue"),
			"ui-window-item": () => import("./ui/UIWindow/Item.vue"),
			"ui-window-stat": () => import("./ui/UIWindow/Stat.vue"),
			"ui-window-skill": () => import("./ui/UIWindow/Skill.vue"),
		}
	};
</script>

<style>
	.fade-enter-active, .fade-leave-active {
		transition: opacity .25s;
	}
	.fade-enter, .fade-leave-to /* .fade-leave-active in below version 2.1.8 */ {
		opacity: 0;
	}

	.fade400-enter-active, .fade400-leave-active {
		transition: opacity .5s;
	}
	.fade400-enter, .fade400-leave-to /* .fade400-leave-active in below version 2.1.8 */ {
		opacity: 0;
	}

	.app-menu {
		z-index: 1;
		position: absolute;
	}
	.scene-editor {
		z-index: 0;
	}
</style>
