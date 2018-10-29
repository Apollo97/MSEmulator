
<template>
	<div @mousedown="mousedown($event)"
		 @mouseup="mouseup($event)"
		 @touchstart="onTouch"
		 @touchmove="onTouch"
		 @touchend="onTouch"
		 :style="style"
		 >
		<div ref="content">
			<slot name="header"></slot>
			<slot name="content"></slot>
			<slot></slot>
			<slot name="footer"></slot>
		</div>
	</div>
</template>

<script>
	import UIResizable from "./ui-resizable.vue";
	import UIDialog from "./ui-dialog.vue";

	export default {
		props: {
			borderWidth: {
				default: 5,
			},
		},
		data: function () {
			return {
			};
		},
		watch: {
			borderWidth: function (newValue) {
				this.resizable_borderWidth = newValue;
			},
		},
		methods: {
			mousedown: function (event) {
				this.requireOrder(event);
				this.resizable_mousedown("move", event);

				this.$emit("mousedown", event);
			},
			mouseup: function (event) {
				this.resizable_mouseup("move", event);

				this.$emit("mouseup", event);
			},
			__set_z_index: function (z) {
				this.style.zIndex = z;
			},
		},
		mounted: function () {
			this.resizable_borderWidth = this.borderWidth;
		},
		//components: {
		//},
		mixins: [UIDialog, UIResizable]
	};

</script>

<style scoped>
</style>
