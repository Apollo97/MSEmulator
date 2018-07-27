
<template>
	<ui-draggable :zIndex="zIndex" :position="position">
		<gui-root p="UI/UIToolTip.img/Item/Frame2">
			<div v-if="is_show" class="header frame" @mousedown.left="requireOrder($event)">
				<div class="frame-warp">
					<table class="frame-inner">
						<tr>
							<td p="nw"></td>
							<td p="n"></td>
							<td p="ne"></td>
						</tr>
						<tr>
							<td p="w"></td>
							<td p="c"></td>
							<td p="e"></td>
						</tr>
						<tr>
							<td p="sw"></td>
							<td p="s"></td>
							<td p="se"></td>
						</tr>
					</table>
				</div>
				<div ref="content" class="header content">
					<div v-for="(value, index) in [...html].reverse()" v-html="value" :class="'z'+(html.length-index)"></div><!---->
					<slot></slot>
				</div>
			</div>
		</gui-root>
	</ui-draggable>
</template>

<script>
	import UIDraggable from "../../components/ui-draggable.vue";
	import UIDialog from "../../components/ui-dialog.vue";

	import BasicComponent from "../BasicComponent.vue";
	
	export default {
		mixins: [UIDialog, BasicComponent],
		data: function() {
			return {
				html: [],
				is_show: false,
			};
		},
		methods: {
			show: function (cbfunc) {
				this.is_show = true;
				if (cbfunc) {
					this.$nextTick(function () {
						cbfunc();
					});
				}
			},
			hide: function (cbfunc) {
				this.is_show = false;
				if (cbfunc) {
					this.$nextTick(function () {
						cbfunc();
					});
				}
			},
			$position: function (...args) {
				let cbfunc;
				if (args.length > 1) {
					cbfunc = args.pop();
				}
				$(this.$el).position(...args);
				if (cbfunc) {
					this.$nextTick(function () {
						cbfunc();
					});
				}
			},
			setPosition: function (...args) {
				let cbfunc;
				if (args.length > 1) {
					cbfunc = args.pop();
				}
				$(this.$el).position(...args);
				if (cbfunc) {
					this.$nextTick(function () {
						cbfunc();
					});
				}
			},
		},
		mounted: function () {
			this.hide();
		},
		components: {
			"ui-draggable": UIDraggable,
		}
	}
</script>

<usage>
	app.vue.$refs.smallTip.html = "<h1>Hello</h1>";
	app.vue.$refs.smallTip.show();
	
	$(app.vue.$refs.smallTip.$el).position({ my: "left top", at: "left+100 top+100", of: window });
		or
	app.vue.$refs.smallTip.$position({ my: "left top", at: "left+100 top+100", of: window });
</usage>

<style scoped>
	.frame {
		position: relative;
		display: inline-block;
	}
	
	.frame-warp {
		position: absolute;
		width: 100%;
		height: 100%;
		line-height: 0;
	}
	
	.frame-inner {
		border-collapse: collapse;
		border-spacing: 0;
		width: 100%;
		height: 100%;
	}
	.frame-inner tr, .frame-inner td {
		padding: 0;
	}
	
	.content {
		position: relative;
		padding: 7px;
		color: white;
	}
	
	.z1 {
		z-index: 1;
	}
	.z2 {
	    position: absolute;
		z-index: 2;
	}
</style>
