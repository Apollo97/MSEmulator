
<template>
	<ui-draggable class="ui-dialog" :zIndex="zIndex" :position="position" @update:position="updateDialogPosition">
		<div ref="header" @mousedown.left="requireOrder($event)" :style="content_style" class="header">
			<slot name="header"></slot>
			<slot name="content"></slot>
			<slot></slot>
		</div>
		<div ref="footer" @mousedown.left="requireOrder($event)" class="footer">
			<slot name="footer"></slot>
		</div>
	</ui-draggable>
</template>

<script>
	import UIDraggable from "../../components/ui-draggable.vue";
	import UIDialog from "../../components/ui-dialog.vue";

	export default {
		components: {
			"ui-draggable": UIDraggable,
			"ui-dialog": UIDialog,
		},
		mixins: [UIDialog]
	};

</script>

<style scoped>
	.ui-dialog {
		border: 0;
		border-radius: 11px;
		background: #f0f0ef;
	}
	.header {
		padding: 0;
		border: 0;
		border-radius: 11px;
	}
	.content {
		padding: 0;
		border: 0;
	}
	.footer {
		padding: 0;
		border: 0;
	}
</style>
