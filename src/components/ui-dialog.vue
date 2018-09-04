
<template>
	<ui-resizable ref="window" class="ui-dialog" @mousedown="requireOrder($event)">
		<div class="inner-frame" @mousedown="requireOrder($event)">
			<div ref="header" class="header" @mousedown="requireOrder($event)">
				<div @contextmenu.self.prevent="minimum=!minimum" class="header" style="overflow-x: hidden;">
					<div style="display: inline-block">
						<slot name="header"></slot>
					</div>
					<div class="header-buttons" style="display: inline-block">
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
			<div :style="{ display: (minimum ? 'none' : 'table-row'), height: '100%' }">
				<slot name="content"></slot>
				<slot></slot>
			</div>
		</div>
	</ui-resizable>
</template>

<script>
	import UIDraggable from "./ui-draggable.vue";
	import UIResizable from "./ui-resizable.vue";

	let zIndices = [];

	export default {
		props: {
			title: {
				type: String,
			},
			
			"min-width": {
				default: "",
			},
			"min-height": {
				default: "",
			},
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
		//}

		methods: {
			setStyle: function (style) {
				this.$refs.window.setStyle(style);
			},
			updateDialogPosition: function (event) {
				this.$emit('update:position', event);
			},
			onCollapsed: function (value) {
				this.$refs.window.m_resizable = this.minimum;//this.minimum => !value
				this.minimum = value;
				
				if (value) {
					//save size
					this._$width = this.$refs.window.style.width + "";
					this._$height = this.$refs.window.style.height + "";
					
					const { width, height} = this.$refs.header.getBoundingClientRect();
					
					//const outerBorder = 1 + 1;//left + right
					const ResizeHolder = 5 + 5;//left + right
					const innerBorder = 1 + 1;//?? left + right
					const bbb = /*outerBorder + */ResizeHolder + innerBorder;
					
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
			show: function (...args) {
				let el = $(this.$el);
				el.show.apply(el, args);
			},
			hide: function (...args) {
				let el = $(this.$el);
				el.hide.apply(el, args);
			},
			//_resize_content: function (this_elem) {
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
			}*/
			
			resetMinSize() {
				if (this.$refs.header && this.$refs.window) {
					const ResizeHolder = 5 + 5;//left + right
					const { width, height} = this.$refs.header.getBoundingClientRect();
					const [minWidth, minHeight] = [width + ResizeHolder, height + ResizeHolder];
					this.$refs.window.setMinSize(minWidth, minHeight);
					//this.$refs.window.setStyle({
					//	minWidth: minWidth,
					//	minHeight: minHeight,
					//});
				}
				else {
					console.log("ui-dialog not ui-resizable: ", this);
					//eval("de" + "bug" + "ger");
				}
			}
		},
		
		watch: {
			minimum: function () {
				//this.reset_content_style();
			}
		},

		mounted: function () {
			zIndices.push(this);

			const zIndex = zIndices.length;

			this.__set_z_index(zIndex);
			
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
</script>

<style scoped>
	.ui-dialog {
		border-radius: 4px;
	}

	.header {
		display: table-row;
		user-select: none;
		background: #e9e9e9;
		text-align: left;
		box-sizing: border-box;
		/*padding: 0.1em;*/
		position: relative;
		height: 0;/*make minimum height*/
		cursor: move;
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

	.inner-frame {
		display: table;
		background: white;
		width: 100%;
		height: 100%;
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
