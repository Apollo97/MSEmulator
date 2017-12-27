
<template>
	<ui-draggable :zIndex="zIndex" :position="position">
		<div v-if="is_show" class="header frame" @mousedown.left="requireOrder($event)">
			<div class="frame-warp">
				<table class="frame-inner">
					<tr>
						<td class="nw"></td>
						<td class="n"></td>
						<td class="ne"></td>
					</tr>
					<tr>
						<td class="w"></td>
						<td class="c"></td>
						<td class="e"></td>
					</tr>
					<tr>
						<td class="sw"></td>
						<td class="s"></td>
						<td class="se"></td>
					</tr>
				</table>
			</div>
			<div ref="content" class="header content">
				<div v-for="(value, index) in [...html].reverse()" v-html="value" :class="'z'+(html.length-index)"></div><!---->
				<slot></slot>
			</div>
		</div>
	</ui-draggable>
</template>
<script>
	import UIDraggable from "../../components/ui-draggable.vue";
	import UIDialog from "../../components/ui-dialog.vue";
	
	export default {
		mixins: [UIDialog],
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
	
	.nw {
		width: 13px;
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/nw) no-repeat;
	}
	.n {
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/n) repeat;
	}
	.ne {
		width: 13px;
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/ne) no-repeat;
	}
	
	.w {
		width: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/w) repeat;
	}
	.c {
		background: url(/images/UI/UIToolTip.img/Item/Frame2/c) repeat;
	}
	.e {
		width: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/e) repeat;
	}
	
	.sw {
		width: 13px;
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/sw) no-repeat;
	}
	.s {
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/s) repeat;
	}
	.se {
		width: 13px;
		height: 13px;
		background: url(/images/UI/UIToolTip.img/Item/Frame2/se) no-repeat;
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
