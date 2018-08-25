
<template>
	<ui-draggable class="ui-dialog" :zIndex="zIndex" :position="position" @update:position="updateDialogPosition">
		<div ref="header" class="header" @mousedown.left="requireOrder($event)" :style="header_style">
			<div @contextmenu.self.prevent="minimum=!minimum" class="header">
				<slot name="header"></slot>
				<div class="header-buttons">
					<button v-if="minimum"
							@click="minimum=false"
							class="header-button">
								<span class="ui-icon ui-icon-plus"></span>
							</button>
					<button v-else
							@click="minimum=true; onCollapsed()"
							class="header-button">
								<span class="ui-icon ui-icon-minus"></span>
							</button>
				</div>
			</div>
		</div>
		<div ref="content" @mousedown.left="requireOrder($event)" :style="content_style" class="content">
			<slot name="content"></slot>
			<slot></slot>
		</div>
		<div ref="footer" v-if="!minimum" @mousedown.left="requireOrder($event)" class="footer">
			<slot name="footer"></slot>
		</div>
	</ui-draggable>
</template>

<script>
	import UIDraggable from "./ui-draggable.vue";

	let px_regx = /(^-?(\d+|(\d*.\d+))px$)|(^auto$)/;
	//.match(/(^[+-]?\d+\.\d+?)|(^[+-]?\d+)|(^[+-]?\.\d+)/)

	let zIndices = [];

	export default {
		//render: function (createElement) {
		//	return createElement("div", [render2.apply(this, arguments), render.apply(this, arguments)]);
		//},
		
		props: {
			//"min-width": {
			//	default: "",
			//},
			//"min-height": {
			//	default: "",
			//},
			width: {//max-width
				default: "",//auto
				//validator: function (value) {
				//	return value == "" || px_regx.test(value) || Number.isSafeInteger(value);
				//}
			},
			height: {//max-height
				default: "",//auto
				//validator: function (value) {
				//	return value == "" || px_regx.test(value) || Number.isSafeInteger(value);
				//}
			},
			position: {
				required: false
			}
		},

		data: function () {
			return {
				content_style: {
				},
				header_style: {
				},
				minimum: false,
				zIndex: 1,
		//		_option: {}
			};
		},

		computed: {
		},

		// directives: {
		//     'dialog': {
		//         bind: function () {
		//         }
		//     }
		// }

		methods: {
			updateDialogPosition: function (event) {
				this.$emit('update:position', event);
			},
			onCollapsed: function () {
				let contents = this.$children[0].$children;
				for (let i = 0; i < contents.length; ++i) {
					contents[i].$emit("onCollapsed");
				}
			},
			compute_width: function () {
				return this.width;
			},
			compute_height: function () {
				return this.height;
			},
			//myUpdate: function (val) {
			//	//return;
			//	$(this.$el).dialog({
			//		title: val
			//	});
			//},
			show: function () {
				let el = $(this.$el);
				el.show.apply(el, arguments);
			},
			hide: function () {
				let el = $(this.$el);
				el.hide.apply(el, arguments);
			},
			//_resize_content: function (this_elem) {
			//	let header = $(this.$refs.header);
			//	let content = $(this.$refs.content);
			//	let footer = $(this.$refs.footer);
			//
			//	let hh = header.outerHeight();
			//	//let ch = content.outerHeight();
			//	let fh = footer.outerHeight();
			//
			//	content.height($(this_elem).height() - hh - fh);
			//},
			requireOrder: function () {
				const index = zIndices.indexOf(this);

				if (index >= 0) {
					let removed = zIndices.splice(index, 1);//remove
					if (removed[0] != this) {
						debugger;
					}
					zIndices.push(this);

					for (let i = 0; i < zIndices.length; ++i) {
						zIndices[i].__set_z_index(i + 1);
					}
				}
			},
			__set_z_index: function (z) {
				this.zIndex = z;
			},
			reset_content_style: function () {
				let style = {};
				let el_content = this.$refs.content;
				if (el_content) {
					let width = this.compute_width();
					if (this.minimum) {
						style["height"] = "0px";
						style["min-height"] = "0px";
						style["max-height"] = "0px";
					}
					else {
						let height = this.compute_height();
						
						//if (el_content.style.width != "auto") {
						//	style["max-width"] = typeof width == "number" ? (parseFloat(width) + "px"):width;
						//}
						//if (el_content.style.height != "auto") {
							style["max-height"] = typeof height == "number" ? (parseFloat(height) + "px"):height;
						//}
					}
					style["width"] = typeof width == "number" ? (parseFloat(width) + "px") : width;
					style["max-width"] = typeof width == "number" ? (parseFloat(width) + "px") : width;
					//style["min-width"] = this["min-width"];
					//style["min-height"] = this["min-height"];
				}
				this.content_style = style;
				this.header_style["width"] = this.content_style["width"];
				this.header_style["max-width"] = this.content_style["max-width"];
			}
		},
		
		watch: {
			width: function () {
				//alert("UIDialog.width is not implement");
				this.reset_content_style();
			},
			height: function () {
				//alert("UIDialog.height is not implement");
				this.reset_content_style();
			},
			minimum: function () {
				this.reset_content_style();
			}
		},

		mounted: function () {
			zIndices.push(this);

			this.zIndex = zIndices.length;
			
			this.reset_content_style();
		},

		updated: function () {
		},

		//   watch: {
		//   }

		components: {
			"ui-draggable": UIDraggable
		}
	}
	
	//export default {
	//	//render: function (createElement) {
	//	//	return createElement("div", [render2.apply(this, arguments), render.apply(this, arguments)]);
	//	//},
	//
	//	props: {
	//		title: {
	//			type: String,
	//			default: "",
	//			required: false
	//		},
	//		position: {
	//			type: Object,
	//			required: false
	//		},
	//		option: {
	//			type: Object,
	//			required: false
	//		},
	//	},
	//
	//	//data: function () {
	//	//	return {
	//	//		_option: {}
	//	//	};
	//	//},
	//
	//	// directives: {
	//	//     'dialog': {
	//	//         bind: function () {
	//	//         }
	//	//     }
	//	// }
	//
	//	methods: {
	//		//myUpdate: function (val) {
	//		//	//return;
	//		//	$(this.$el).dialog({
	//		//		title: val
	//		//	});
	//		//},
	//		show: function () {
	//			let el = $(this.$el);
	//			el.show.apply(el, arguments);
	//		},
	//		hide: function () {
	//			let el = $(this.$el);
	//			el.hide.apply(el, arguments);
	//		},
	//		extends_option: function (option) {
	//			option = Object.assign({}, this.option, option);
	//			let pos = {};
	//			for (let i in this.position) {
	//				pos[i] = this.position[i];
	//			}
	//			option.title = this.title;
	//			option.position = pos;
	//			return option;
	//		},
	//		//_resize_content: function (this_elem) {
	//		//	var header = $(this.$refs.header);
	//		//	var content = $(this.$refs.content);
	//		//	var footer = $(this.$refs.footer);
	//		//
	//		//	var hh = header.outerHeight();
	//		//	//var ch = content.outerHeight();
	//		//	var fh = footer.outerHeight();
	//		//
	//		//	content.height($(this_elem).height() - hh - fh);
	//		//},
	//	},
	//
	//	mounted: function () {
	//		let vm = this;
	//		//width, height
	//		//maxWidth, maxHeight
	//		//minWidth, minHeight
	//		$(this.$el).dialog(this.extends_option({
	//			//resizeStop: function (event, ui) {
	//			//	//originalPosition: Object
	//			//	//originalSize: Object
	//			//	//position: Object
	//			//	//size: Object
	//			//	vm._resize_content(this);//this_elem
	//			//	//this.$emit("resizeStop", this.size);
	//			//	//this.$emit('update:active', selected);
	//			//}
	//		}));
	//	},
	//
	//	updated: function () {
	//		$(this.$el).dialog(this.extends_option());
	//	},
	//
	//	//   watch: {
	//	//     title: function (val) {
	//	//       $(this.$el).dialog({
	//	//         title: val
	//	//       });
	//	//     }
	//	//   }
	//}
</script>

<style>
	.ui-dialog {
		border-radius: 4px;
	}

	.ui-dialog > * {
		/*padding: 0.5em 1em;*/
		/*display: inline-block;*/
		/*width: 100%;*/
	}

	.ui-dialog > .header {
		/*cursor: default;*/
		padding: 0.25em 0.5em;
		user-select: none;
		background: #e9e9e9;
		border: 1px solid #dddddd;
		/*border-top-left-radius: 4px;*/
		/*border-top-right-radius: 4px;*/
		text-align: left;
		box-sizing: border-box;
	}
	
	.ui-dialog > .header .header-buttons {
		display: inline;
		right: 0.5em;
		margin-right: 1px;
		position: absolute;
	}
	.ui-dialog > .header .header-buttons > * {
		padding: 0;
		border: none;
		background: transparent;
	}
	.ui-dialog > .header .header-buttons > .header-button {
	}
	.ui-dialog > .header .header-buttons > .header-button:hover {
		background: lightgray;
	}
	.ui-dialog > .header .header-buttons > .header-button:active {
		background: lightblue;
	}

	.ui-dialog > .content {
		position: relative;
		background: white;
		border-left: 1px solid #dddddd;
		border-right: 1px solid #dddddd;
		min-width: 16em;
		min-height: 10em;
		/*width: auto;*/
		/*height: auto;*/
		overflow: auto;
		box-sizing: border-box;
	}

	.ui-dialog > .footer {
		padding: 0.1em 0.25em;
		user-select: none;
		background: #e9e9e9;
		border: 1px solid #dddddd;
		/*border-bottom-left-radius: 4px;*/
		/*border-bottom-right-radius: 4px;*/
		box-sizing: border-box;
	}
</style>
