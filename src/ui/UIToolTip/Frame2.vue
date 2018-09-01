
<template>
	<ui-draggable :zIndex="zIndex" :position="position">
		<gui-root ref="gui_root" p="/UI/UIToolTip/Item/Frame2">
			<div v-if="is_show" class="header frame" @mousedown.left="requireOrder($event)">
				<div v-if="guiData" class="frame-warp">
					<table class="frame-inner">
						<tr>
							<td :style="_getImgStyle('nw',true,true,false)"></td>
							<td :style="_getImgStyle('n',false,true,true)"></td>
							<td :style="_getImgStyle('ne',true,true,false)"></td>
						</tr>
						<tr>
							<td :style="_getImgStyle('w',true,false,true)"></td>
							<td :style="_getImgStyle('c',false,false,true)"></td>
							<td :style="_getImgStyle('e',true,false,true)"></td>
						</tr>
						<tr>
							<td :style="_getImgStyle('sw',true,true,false)"></td>
							<td :style="_getImgStyle('s',false,true,true)"></td>
							<td :style="_getImgStyle('se',true,true,false)"></td>
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
				guiData: null,
				zIndex: 0,
			};
		},
		methods: {
			__set_z_index: function (z) {
				this.zIndex = z;
			},
			_getImgStyle: function (p, h, v, repeat) {
				let path, img, data = this.guiData, s = {};
				if (data && (img = data[p]) && (path = img[""])) {
					if (h) {
						s.width = img.__w + "px";
					}
					if (v) {
						s.height = img.__h + "px";
					}
					let src = $get.imageUrl(path);
					s.background = `url(${src}) ${repeat ? "repeat" : "no-repeat"}`;
					return s;
				}
				return s;
			},
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
		mounted: async function () {
			this.hide();
			this.guiData = await this.$refs.gui_root._$promise;
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
