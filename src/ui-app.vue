
<template>
	<div style="position: absolute; width: 100%; height: 100%; top: 0px; left: 0px; user-select: none;">
		<transition name="fade" style="position: absolute;">
			<div v-if="is_editor_mode" class="scene-editor;">
				<editor ref="editor" @hoverItem="showItemTip(...arguments);"
						@mouseleaveItem="hideItemTip(...arguments);">
				</editor>
			</div>
		</transition>

		<transition name="fade" style="position: absolute;">
			<status-bar ref="statusBar"
						v-if="!is_editor_mode"
						:chara="chara"
						></status-bar>
		</transition>

		<transition name="fade" style="position: absolute;">
			<ui-window-equip v-if="isShowUIEquipWnd"
							 :chara="chara"
							 @hoverItem="showItemTip(...arguments);"
							 @mouseleaveItem="hideItemTip(...arguments);"
							 >
			</ui-window-equip>
		</transition>
		
		<transition name="fade" style="position: absolute;">
			<ui-window-item v-if="isShowUIItemWnd"
							:chara="chara"
							@hoverItem="showItemTip(...arguments);"
							@mouseleaveItem="hideItemTip(...arguments);"
							>
			</ui-window-item>
		</transition>

		<div @contextmenu.prevent class="gui" style="z-index: 100; position: absolute; width: 0; height: 0;">
			<ui-tool-tip v-if="isShowEquipTip" :isShow="isShowEquipTip"
							:equip="equip"
							:chara="chara"
							:state="ItemTip_state"></ui-tool-tip>
		</div>
	</div>
</template>

<script>
	import Vue from "vue";
	import Vuex from "vuex";
	
	import StatusBar from "./ui/StatusBar.vue";
	import UIWindowEquip from "./ui/UIWindow/Equip.vue";
	import UIWindowItem from "./ui/UIWindow/Item.vue";

	import ItemTip from "./ui/UIToolTip/ItemTip.vue";

	import Editor from "./editor/editor.vue";

	import { ItemCategoryInfo, ResourceManager, ItemAttrNormalize } from '../public/javascripts/resource.js';


	function findDirective(vnode, name, argument) {
		return vnode.data.directives.filter(function (binding) {
			return binding.name == name && binding.arg == argument;
		});
	}

	function ui_directives(el, binding, vnode) {
		let vm = vnode.context;
		const modifiers = Object.keys(binding.modifiers);
		
		if (modifiers.length) {
			modifiers.forEach(function (event) {
				$(el).off(event);
				$(el).on(event, function () {
					let refBinding = findDirective(vnode, "ui", "ref");
					if (refBinding[0]) {
						let target = vm.$refs[refBinding[0].value];
						
						$(target).stop()[binding.arg](binding.value);
					}
				});
			});
		}
		else if (binding.arg != "ref") {
			vm.$nextTick(function () {
				let refBinding = findDirective(vnode, "ui", "ref");
				if (refBinding[0]) {
					let target = vm.$refs[refBinding[0].value];
					$(target).stop()[binding.arg](binding.value);
				}
			});
		}
	}
	function ui_directives_unbind(el, binding, vnode) {
		const modifiers = Object.keys(binding.modifiers);

		if (modifiers.length) {
			modifiers.forEach(function (event) {
				$(el).off(event);
			})
		}
	}
	Vue.directive("ui", {
		bind: ui_directives,
		componentUpdated: ui_directives,
		unbind: ui_directives_unbind
	});

	Vue.directive("declare", {
		bind: function (el, binding, vnode) {
			let vm = vnode.context;

			for (let i in binding.modifiers) {
				Vue.set(vm[binding.arg], i, binding.value);
				//vm.$set(vm[binding.arg], i, binding.value);
			}
		},
	});

	//event: input
	Vue.component("input-number", {
		template: "<input :value='value' :step='step' :min='min' :max='max' @input='update($event.target.value)' @wheel.stop.prevent='wheel' type='number' />",
		props: ["value", "step", "min", "max", "fixed"],
		computed: {
			_$value: function () {
				return this.value === "" ? 0 : Number(this.value);
			},
			_$step: function () {
				return this.step != null ? Number(this.step) : 1;
			},
			_$min: function () {
				const { min = -Infinity } = this;
				return Number(min);
			},
			_$max: function () {
				const { max = Infinity } = this;
				return Number(max);
			},
		},
		methods: {
			_$toFixed(val) {
				const fixed = Number(this.fixed);
				if (Number.isSafeInteger(fixed)) {
					return val.toFixed(fixed);
				}
				return val;
			},
			update: function (val) {
				if (val === "") {
					return;
				}
				
				val = Math.max(this._$min, Math.min(val, this._$max));
				
				this.$emit('input', this._$toFixed(val));
				this.$parent.$forceUpdate();
			},
			wheel: function (event) {
				if (event.target.value === "") {
					return;
				}
				
				const step = this._$step;
				let val = Number(event.target.value);
				if (event.deltaY < 0) {
					val += step;
				}
				else if (event.deltaY > 0) {
					val -= step;
				}
				this.update(val);
			},
		},
	});

	//event: input
	Vue.component("input-select", {
		template: "<select ref='input' :value='value' @input='update($event.target.value)' @wheel.stop.prevent='wheel'><slot></slot></select>",
		props: ["value"],
		methods: {
			update: function (val) {
				this.$emit('input', val);
				this.$parent.$forceUpdate();
			},
			wheel: function (event) {
				const values = [...this.$el.children].map(a=>a.value);
				const length = values.length;
				
				let index = values.indexOf(event.target.value);
				if (event.deltaY < 0) {
					index -= 1;
				}
				else if (event.deltaY > 0) {
					index += 1;
				}
				index = index >= 0 ? (index % length) : (length - 1);
				this.update(values[index]);
			},
		},
	});

	export default {
		store: Editor.store,
		data: function () {
			return {
				$gv: window.$gv,

				equip: null,
				isShowEquipTip: true,
				isShowUIEquipWnd: false,
				isShowUIItemWnd: false,
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
								at: `left+${event.clientX + 1} top+${event.clientY + 1}`,
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
			"ui-tool-tip": ItemTip,
			"status-bar": StatusBar,
			"ui-window-equip": UIWindowEquip,
			"ui-window-item": UIWindowItem,
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
