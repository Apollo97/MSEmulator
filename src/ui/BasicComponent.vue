
<template>
</template>

<script>

	import Vue from "vue";
	import Vuex from "vuex";

	Vue.config.productionTip = false;

	Vue.use(Vuex);

	//global var
	var store = new Vuex.Store({
		state: {
			root: {},
			d: 0,
			loadingTasks: [],
		},
		mutations: {
			_load: function (state, payload) {
				const dp = payload.path.split("/");
				if (dp) {
					let i = 0, d = state.root;
					for (; i < dp.length - 1; ++i) {
						let p = dp[i];
						d = Vue.set(d, p, {});
					}
					Vue.set(d, dp[i], payload.data);
					//resolve(data);
				}
			},
			_waitTask: function (state, payload) {
				if (payload && payload.task) {
					state.loadingTasks.push(payload.task);
				}
			},
			_doneTask: function (state, payload) {
				if (payload && payload.task) {
					let i = state.loadingTasks.indexOf(payload.task);
					if (i >= 0) {
						state.loadingTasks.splice(i, 1);
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
				//return new Promise(async function (resolve, reject) {
					const path = payload.path.endsWith(".img") ? (payload.path + "/") : payload.path;
					const task = $get.pack(path);

					context.commit("_waitTask", { task: task });
					const data = JSON.parse(await task);
					context.commit("_doneTask", { task: task });

					context.commit("_load", {
						path: payload.path,
						data: data,
					});
				//});

				return context.dispatch("_get_data", payload);
			},
			_get_data: function (context, payload) {
				const dp = payload.path.split("/");
				let data = context.state.root;
				for (let p of dp) {
					if (p in data) {
						data = data[p];
						if (!data) {
							debugger
							return {};
						}
					}
					else {
						return {};
					}
				}
				return data;
			},
		},
	});

	//Folder
	let Dir = {
		template: "<div :data-p='p'><slot/></div>",
		store: store,
		props: ["p"],
		computed: {
			path: function () {
				let ds = [];
				for (let parent = this.$parent; parent; parent = parent.$parent) {
					const path = parent.path;
					if (path) {
						ds.unshift(path);
						break;
					}
				}
				ds.push(this.p);

				try {
					return decodeURI(new URL(ds.join("/"), window.location).pathname);
				}
				catch (ex) {
					debugger
					return new URL(ds.join("/"), window.location).pathname;
				}
			},
			_path: function () {
				let ds = [];
				for (let parent = this.$parent; parent; parent = parent.$parent) {
					const path = parent.path;
					if (path) {
						ds.unshift(path);
						break;
					}
				}
				ds.push(this.p);

				return new URL(ds.join("/"), window.location).pathname;
			},
		},
		methods: {
			getData: function () {
				const dp = this.path.split("/");
				let data = this.$store.state.root;
				for (let p of dp) {
					if (p in data) {
						data = data[p];
						if (!data) {
							debugger
							return {};
						}
					}
					else {
						return {};
					}
				}
				return data;
			},
		},
	};

	let DirRoot = Vue.extend({
		mixins: [Dir, {
			created: async function () {
				const vm = this;
				let data = this.getData();
				if (!Object.keys(data).length) {
					data = await this.$store.dispatch("loadData", {
						path: this.path,
					});
					vm.$nextTick(function () {
						vm.$forceUpdate();
					})
				}
			}
		}]
	});

	let DirView = Vue.extend({
		name: "dir-view",// v-if='!collapsed'
		template: "<table class='view' ><tr><td :title='`(object)`+propName' :rowspan='entries.length+1'><div class='view-s'><button @click='collapsed=!collapsed'><span v-if='collapsed'>-</span><span v-else>+</span></button><span style='padding: 0 4px;'>{{propName}}</span></div></td><td></td></tr><tr v-if='collapsed' v-for='(d, i) in entries'><template v-if='d[0]==``'><td title='(image)'>(image)</td><td><img :src='d[1]'/></td></template><td v-else-if='typeof d[1] == `object`'><dir-view :p='encodeURI(d[0])' /></td><template v-else><td title='(property)'>{{d[0]}}</td><td :title='`(${typeof d[1]})`'>{{d[1]}}</td></template></tr></table>",
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
		mixins: [Dir],
	});
	
	let _DirTexture = {
		template: "<div :data-p='p' :style='style_frame'><div :style='style'><img :data-src='img_path' :src='img' :style='img_style' /><slot /></div></div>",
		props: ["p"],
		data: function () {
			return {
			}
		},
		computed: {
			img_path: function () {
				return "/images" + this._path;
			},
			data_path: function () {
				return "/data" + this._path;
			},
			style_frame: function () {
				let s = {
					zIndex: this.z,
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
				return data[""] ? data[""] : "/images/warning.png";
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
	let DirTexture = Vue.extend({
		mixins: [Dir, _DirTexture]
	});
	let DirExtendBg = Vue.extend({
		mixins: [DirTexture, {
			template: "<div :data-src='img_path' :style='{ background:`url(${img})` }'><slot /></div>",
		}]
	});
	let DirInput = Vue.extend({
		mixins: [DirTexture, {
			template: "<div :style='{ background:`url(${img})` }'><input :data-src='img_path' style='border: none; outline: none; background: transparent;' /><slot /></div>",
		}]
	});

	let DirFrame = Vue.extend({
		mixins: [DirTexture, {
			template: "<div :data-p='p' :style='style_frame'><div :style='style'><slot :path='img_path' :img='img' :width='width' :height='height' /></div></div>",
		}]
	});

	let DirButton = Vue.extend({
		mixins: [Dir, {
			template: "<div @mouseenter='mouseenter($event)' @mouseleave='mouseleave($event)' @mousedown='mousedown($event)' @mouseup='mouseup($event)' @click='click($event)' :data-p='p'><dir-texture :p='bp' style='display: inline-block;'></dir-texture></div>",
			props: [
				"disabled"
			],
			data: function () {
				return {
					state: "normal",
					aniFrame: 0,
				}
			},
			computed: {
				bp: function () {
					return this.state + "/" + this.aniFrame;
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
				"dir-texture": DirTexture,
			}
		}]
	});
	DirButton.states = ["normal", "pressed", "disabled", "mouseOver"];

	let Center = {
		template: '<div class="c2 center_frame"><div class="c3 center"><slot/></div></div>'
	}
	let CenterHr = {
		template: '<div class="c2 center_frame_hr"><div class="c3 center_hr"><slot/></div></div>'
	}

	export default {
		store: store,
		components: {
			"dir": Dir,
			"dir-root": DirRoot,
			//"dir-view": DirView,
			//"dir-path": DirPath,
			"dir-texture": DirTexture,
			"dir-extend-bg": DirExtendBg,
			"dir-frame": DirFrame,
			"dir-button": DirButton,
			"dir-input": DirInput,
			"center": Center,
			"centerHr": CenterHr,
		}
	};

</script>

