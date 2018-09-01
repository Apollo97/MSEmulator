
<template>
	<ui-resizable ref="window" class="ui-dialog" @mousedown="requireOrder($event)">
		<div ref="content" class="content" @mousedown="requireOrder($event)">
			<div ref="header" class="header" @mousedown="requireOrder($event)">
				<div @contextmenu.self.prevent="minimum=!minimum" class="header">
					<slot name="header"></slot>
					<div class="header-buttons">
						<button v-if="minimum"
								@click="onCollapsed(false)"
								class="header-button">
									<span class="ui-icon ui-icon-plus"></span>
								</button>
						<button v-else
								@click="onCollapsed(true)"
								class="header-button">
									<span class="ui-icon ui-icon-minus"></span>
								</button>
					</div>
				</div>
			</div>
			<div :style="{ display: minimum ? 'none' : 'block' }">
				<slot name="content"></slot>
				<slot></slot>
			</div>
		</div>
	</ui-resizable>
</template>

<script>
	import UIDraggable from "./ui-draggable.vue";
	import UIResizable from "./ui-resizable.vue";

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
		//		_option: {}
				
				zIndex: 0,
				
				_$width: 0,
				_$height: 0,
			};
		},

		computed: {
			style: function () {
				return this.$refs.window.style;
			},
			/*zIndex: {
				get: function () {
					return this.style.zIndex;
				},
				set: function (value) {
					this.style.zIndex = value;
				}
			}*/
		},

		//directives: {
		//	'dialog': {
		//			bind: function () {
		//		}
		//	}
		//}

		methods: {
			setStyle: function (style) {
				this.$refs.window.setStyle(style);
			},
			updateDialogPosition: function (event) {
				this.$emit('update:position', event);
			},
			onCollapsed: function (value) {
				this.minimum = value;
				
				if (value) {
					//save size
					this._$width = this.$refs.window.style.width + "";
					this._$height = this.$refs.window.style.height + "";
					
					let { width, height} = this.$refs.header.getBoundingClientRect();;
					
					//const outerBorder = 1 + 1;//left + right
					const ResizeHolder = 5 + 5;//left + right
					//const innerBorder = 1 + 1;//left + right
					const bbb = /*outerBorder + */ResizeHolder/* + innerBorder*/;
					
					this.$refs.window.style.width = (width + bbb) + "px";
					this.$refs.window.style.height = (height + bbb) + "px";
				}
				else {
					//restore size
					this.$refs.window.style.width = this._$width;
					this.$refs.window.style.height = this._$height;
				}
				
				//let contents = this.$children[0].$children;
				//for (let i = 0; i < contents.length; ++i) {
				//	contents[i].$emit("onCollapsed");
				//}
			},
			/*compute_width: function () {
				return this.width;
			},
			compute_height: function () {
				return this.height;
			},*/
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
				this.$refs.window.style.zIndex = z;
			},
			/*reset_content_style: function () {
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
			}*/
		},
		
		watch: {
			/*width: function () {
				//alert("UIDialog.width is not implement");
				this.reset_content_style();
			},
			height: function () {
				//alert("UIDialog.height is not implement");
				this.reset_content_style();
			},*/
			minimum: function () {
				//this.reset_content_style();
			}
		},

		mounted: function () {
			zIndices.push(this);

			this.__set_z_index(zIndices.length);
			
			//this.reset_content_style();
		},

		updated: function () {
		},

		//   watch: {
		//   }

		components: {
			"ui-draggable": UIDraggable,
			"ui-resizable": UIResizable,
		},
		
		//mixins: [
		//	UIResizable,
		//]
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
	//	//watch: {
	//	//	title: function (val) {
	//	//		$(this.$el).dialog({
	//	//			title: val
	//	//		});
	//	//	}
	//	//}
	//}
</script>

<style scoped>
	.ui-dialog {
		border-radius: 4px;
	}

	.header {
		user-select: none;
		background: #e9e9e9;
		text-align: left;
		box-sizing: border-box;
		padding: 0.1em;
	}

	.header .header-buttons {
		display: inline;
		right: 0.5em;
		margin-right: 1px;
		position: absolute;
	}
	.header .header-buttons > * {
		padding: 0;
		border: none;
		background: transparent;
	}
	.header .header-buttons > .header-button {
	}
	.header .header-buttons > .header-button:hover {
		background: lightgray;
	}
	.header .header-buttons > .header-button:active {
		background: lightblue;
	}

	.content {
		position: relative;
		background: white;
		border-left: 1px solid #dddddd;
		border-right: 1px solid #dddddd;
		/*min-width: 16em;*/
		/*min-height: 10em;*/
		/*width: auto;*/
		/*height: auto;*/
		width: 100%;
		height: 100%;
		overflow: auto;
		box-sizing: border-box;
	}

	.footer {
		padding: 0.1em 0.25em;
		user-select: none;
		background: #e9e9e9;
		border: 1px solid #dddddd;
		/*border-bottom-left-radius: 4px;*/
		/*border-bottom-right-radius: 4px;*/
		box-sizing: border-box;
	}
</style>
