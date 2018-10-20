
<template>
	<div @mousedown="mousedown($event)"
		 @mouseup="mouseup($event)"
		 @touchstart="onTouch"
		 @touchmove="onTouch"
		 @touchend="onTouch"
		 :style="style"
		 class="gui-window"
		 >
		<!--<div ref="content" :class="{ 'dialog-content': true, 'hide': minimum }">-->
		<div ref="content">
			<slot name="header"></slot>
			<slot name="content"></slot>
			<slot></slot>
			<slot name="footer"></slot>
		</div>
	</div>
</template>

<script>
	import UIResizable from "../../components/ui-resizable.vue";
	import UIDialog from "../../components/ui-dialog.vue";

	console.log("resizable");

	export default {
		data: function () {
			return {
			};
		},
		methods: {
			mousedown: function (event) {
				this.requireOrder(event);
				this.resizable_mousedown("move", event);
			},
			mouseup: function (event) {
				this.resizable_mouseup("move", event);
			},
			__set_z_index: function (z) {
				this.style.zIndex = z;
			},
			log: function (...args) {
				console.log(...args);
			},
		},
		//mounted: function content() {
		//},
		components: {
			"ui-resizable": UIResizable,
			//"ui-dialog": UIDialog,
		},
		mixins: [UIDialog, UIResizable]
	};

</script>

<style scoped>
	.ui-dialog {
		border: 0;
		border-radius: 11px;
		background: transparent;
	}
	.header {
		padding: 0;
		border: 0;
		border-radius: 11px;
		background: transparent;
	}
	.content {
		padding: 0;
		border: 0;
		background: transparent;
	}
	.footer {
		padding: 0;
		border: 0;
		height: 0;
		background: transparent;
	}
</style>
