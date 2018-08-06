
<template>
</template>

<script>
	import Vue from "vue";
	import Vuex from "vuex";

	var store = new Vuex.Store({
		state: {
			root: {},
			loadingTasks: [],
		},
		mutations: {
			_beforeLoad: function (state, payload) {
				if (payload && payload.task) {
					state.loadingTasks.push(payload.task);
				}
			},
			_onload: function (state, payload) {
				let i = state.loadingTasks.indexOf(payload.task);
				if (i >= 0) {
					state.loadingTasks.splice(i, 1);
				}
				
				const dp = payload.path.split("/");
				if (dp) {
					let i = 0, d = state.root;
					for (; i < dp.length - 1; ++i) {
						let p = dp[i];
						d = Vue.set(d, p, d[p] || {});
					}
					
					//Vue.set(d, dp[i], payload.data);
					
					let value = payload.data;
					
					let origin_value = d[dp[i]];
					if (origin_value && typeof origin_value == "object") {
						for (let key in value) {
							Vue.set(origin_value, key, value[key] || origin_value[key]);
						}
					}
					else if (typeof value != "undefined") {
						Vue.set(d, dp[i], payload.data);
					}
				}
			},
		},
		actions: {
			waitAllLoaded: async function (context, payload) {
				await Promise.all(context.state.loadingTasks);
				context.state.loadingTasks = [];
			},
			loadData: async function (context, payload) {
				let task = $get.data(payload.path);

				context.commit("_beforeLoad", { task: task });

				let data = await task;

				context.commit("_onload", {
					path: payload.path,
					task: task,
					data: data,
				});
				
				return data;
			},
		}
	});

	//Folder
	let Gui = {
		template: "<div :data-p='p' @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @mousemove='mousemove($event)' @click='click($event)'><slot/></div>",
		store: store,
		props: ["p"],
		//data: function () {
		//	return {
		//	};
		//},
		computed: {
			path: function () {
				let ds = this._getPathArray();
				return "/" + ds.join("/");
			},
			_path: function () {
				let ds = this._getPathArray();
				return "/" + ds.join("/");
			},
		},
		methods: {
			_getPathArray: function () {
				let ds = [];
				for (let parent = this.$parent; parent; parent = parent.$parent) {
					const path = parent.path;
					if (path) {
						ds.unshift(path);
						break;
					}
				}
				if (this.p && this.p != ".") {
					ds.push(this.p);
				}
				return ds;
			},
			getGuiParent: function () {
				let parent;
				for (parent = this.$parent; parent; parent = parent.$parent) {
					if (parent.p != null || parent.m_data != null) {
						return parent;
					}
				}
			},
			__getData: function () {
				const dp = this.path.split("/");
				let data = this.$store.state.root[""];
				let objs = [];

				for (let k in dp) {
					const p = dp[k];
					objs[k] = data;
					if (p in data) {
						data = data[p];
						if (!data) {
							debugger
							return undefined;
						}
					}
				}
				return data;
			},
			_getData: function (parent, prop) {
				let parent_data = parent.getData();

				return prop.split("/").reduce((obj, p) => {
					if (obj != null && p) {
						if (p == ".") {
							return parent._getData(parent.getGuiParent(), parent.p);
						}
						else if (p == "..") {
							const pp = parent.getGuiParent();
							return pp._getData(pp.getGuiParent(), pp.p);
						}
						else {
							return obj[p];
						}
					}
				}, parent_data);
				return undefined;
			},
			getData: function () {
				//return this._getData(this.getGuiParent(), this.p) || {};
				return this.__getData() || {};
			},
			mouseenter: function ($event) {
				this.$emit("mouseenter", $event);
			},
			mouseleave: function ($event) {
				this.$emit("mouseleave", $event);
			},
			mousedown: function ($event) {
				this.$emit("mousedown", $event);
			},
			mouseup: function ($event) {
				this.$emit("mouseup", $event);
			},
			mousemove: function ($event) {
				this.$emit("mouseup", $event);
			},
			click: function ($event) {
				this.$emit("click", $event);
			},
		},
	};

	let GuiRoot = Vue.extend({
		mixins: [Gui, {
			template: "<div :data-p='p' @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @mousemove='mousemove($event)' @click='click($event)'><slot v-if='m_data' /></div>",
			data: function () {
				return {
					_$promise: null,
					m_data: null,
				};
			},
			methods: {
				getData: function () {
					return this.m_data;
				}
			},
			created: function () {
				this._$promise = this.$store.dispatch("loadData", {
					path: this.path,
				});
				this._$promise.then(data => {
					this.m_data = data;
				});
			}
		}]
	});

	let GuiView = Vue.extend({
		name: "gui-view",// v-if='!collapsed'
		template: "<table class='view' ><tr><td :title='`(object)`+propName' :rowspan='entries.length+1'><div class='view-s'><button @click='collapsed=!collapsed'><span v-if='collapsed'>-</span><span v-else>+</span></button><span style='padding: 0 4px;'>{{propName}}</span></div></td><td></td></tr><tr v-if='collapsed' v-for='(d, i) in entries'><template v-if='d[0]==``'><td title='(image)'>(image)</td><td><img :src='d[1]'/></td></template><td v-else-if='typeof d[1] == `object`'><gui-view :p='encodeURI(d[0])' /></td><template v-else><td title='(property)'>{{d[0]}}</td><td :title='`(${typeof d[1]})`'>{{d[1]}}</td></template></tr></table>",
		data: function () {
			return {
				collapsed: false,
			}
		},
		methods: {
		},
		computed: {
			propName: function () {
				return decodeURI(this.p);
			},
			entries: function () {
				return Object.entries(this.getData());
			}
		},
		mixins: [Gui],
	});
	
	let _GuiTexture = {
		template: "<div :data-p='p' :style='style_frame'><div :style='style'><img :data-src='img_path' :src='img' :style='img_style' /><slot /></div></div>",
		data: function () {
			return {
			}
		},
		computed: {
			img_path: function () {
				return $get.imageUrl(this._path);
			},
			data_path: function () {
				return "data" + this._path;
			},
			style_frame: function () {
				let s = {
					zIndex: this.z,//??
				};
				const x = -this.origin.x, y = -this.origin.y;
				s.marginLeft = x + "px";
				s.marginTop = y + "px";
				return s;
			},
			style: function () {
				const x = -this.origin.x, y = -this.origin.y;
				let s = {
					position: "relative",
				};
				return s;
			},
			img_style: function () {
				return {
					display: "inline-block",
					width: this.width + "px",
					height: this.height + "px",
				};
			},
			texture: function () {
				return this.getData();
			},
			img: function () {
				let data = this.texture;
				return data[""] ? $get.imageUrl(data[""]) : "/warning.png";
			},
			width: function () {
				let data = this.texture;
				return data.__w ? data.__w : 0;
			},
			height: function () {
				let data = this.texture;
				return data.__h ? data.__h : 0;
			},
			origin: function () {
				let data = this.texture;
				return data.origin ? data.origin : { x: 0, y: 0 };
			},
			z: function () {
				let data = this.texture;
				return data.z ? data.z : 0;
			}
		},
	};
	let GuiTexture = Vue.extend({
		mixins: [Gui, _GuiTexture]
	});
	let GuiTextureS = Vue.extend({
		mixins: [Gui, _GuiTexture, {
			template: "<div :data-src='img_path' @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @mousemove='mousemove($event)' @click='click($event)' :style='img_style'><slot /></div>",
			computed: {
				img_style: function () {
					const x = -this.origin.x, y = -this.origin.y;
					return {
						background: `url(${this.img}) no-repeat`,
						position: "absolute",
						left: x + "px",
						top: y + "px",
						width: this.width + "px",
						height: this.height + "px",
					};
				},
			},
		}]
	});
	let GuiBackground = Vue.extend({
		mixins: [GuiTexture, {
			template: "<div :data-src='img_path' @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @mousemove='mousemove($event)' @click='click($event)' :style='{ background:`url(${img}) no-repeat` }'><slot /></div>",
		}]
	});
	let GuiExtendBg = Vue.extend({
		mixins: [GuiTexture, {
			template: "<div :data-src='img_path' @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @mousemove='mousemove($event)' @click='click($event)' :style='{ background:`url(${img})` }'><slot /></div>",
		}]
	});
	let GuiInput = Vue.extend({
		mixins: [GuiTexture, {
			template: "<div :style='{ background:`url(${img})` }'><input :data-src='img_path' style='border: none; outline: none; background: transparent;' /><slot /></div>",
		}]
	});

	let GuiFrame = Vue.extend({
		mixins: [GuiTexture, {
			template: "<div :data-p='p' :style='style_frame'><div :style='style'><slot :path='img_path' :img='img' :width='width' :height='height' /></div></div>",
		}]
	});
	let GuiFrameS = Vue.extend({
		mixins: [GuiTextureS, {
			template: "<div :data-src='img_path' @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @mousemove='mousemove($event)' @click='click($event)' :style='img_style'><slot /></div>",
			computed: {
				img_style: function () {
					const x = -this.origin.x, y = -this.origin.y;
					return {
						position: "absolute",
						left: x + "px",
						top: y + "px",
						width: this.width + "px",
						height: this.height + "px",
					};
				},
			},
		}]
	});

	let GuiButton = Vue.extend({
		mixins: [Gui, {
			template: "<div @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @mousemove='mousemove($event)' @click='click($event)' :data-p='p'><gui-texture :p='bp' style='display: inline-block;'></gui-texture></div>",
			props: {
				enabled: {
					type: Boolean,
					default: true,
				}
			},
			data: function () {
				return {
					m_state: "normal",
					aniFrame: 0,
					stateMap: {
						normal: "normal",
						pressed: "pressed",
						disabled: "disabled",
						mouseOver: "mouseOver"
					},
				}
			},
			computed: {
				state: {
					get: function () {
						return this.m_state;
					},
					set: function (value) {
						if (this.enabled) {
							let newImg = this.stateMap[value];
							if (newImg) {
								this.m_state = value;
							}
						}
						else {
							this.m_state = "disabled";
						}
					}
				},
				bp: function () {
					if (this.enabled) {
						return this.stateMap[this.m_state] + "/" + this.aniFrame;
					}
					else {
						return this.stateMap.disabled + "/" + this.aniFrame;
					}
				}
			},
			methods: {
				mouseenter: function ($event) {
					this.state = "mouseOver";
					this.$emit("mouseenter", $event);
				},
				mouseleave: function ($event) {
					this.state = "normal";
					this.$emit("mouseleave", $event);
				},
				mousedown: function ($event) {
					this.state = "pressed";
					this.$emit("mousedown", $event);
				},
				mouseup: function ($event) {
					this.state = "mouseOver";
					this.$emit("mouseup", $event);
				},
				click: function ($event) {
					this.$emit("click", $event);
				},
			},
			watch: {
				"disabled": function (value) {
					if (value) {
					}
					else {
					}
				}
			},
			components: {
				"gui-texture": GuiTexture,
			}
		}]
	});

	let GuiButtonS = Vue.extend({
		mixins: [GuiButton, {
			template: "<gui-texture-s :p='bp' @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @click='click($event)'></gui-texture-s>",
			components: {
				"gui-texture-s": GuiTextureS,
			}
		}]
	});

	let Center = {
		template: '<div class="c2 center_frame"><div class="c3 center"><slot/></div></div>'
	}
	let CenterHr = {
		template: '<div class="c2 center_frame_hr"><div class="c3 center_hr"><slot/></div></div>'
	}

	export default {
		store: store,
		components: {
			"gui": Gui,
			"gui-root": GuiRoot,
			//"gui-view": GuiView,
			//"gui-path": GuiPath,
			"gui-texture": GuiTexture,
			"gui-texture-s": GuiTextureS,
			"gui-background": GuiBackground,
			"gui-extend-bg": GuiExtendBg,
			"gui-frame": GuiFrame,
			"gui-frame-s": GuiFrameS,
			"gui-button": GuiButton,
			"gui-button-s": GuiButtonS,
			"gui-input": GuiInput,
			"center": Center,
			"center-hr": CenterHr,
		}
	};

</script>

