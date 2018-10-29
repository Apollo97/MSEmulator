
<template>
	<window-base ref="window">
		<template slot="content">
			<gui-root ref="gui_root" p="/UI/UIToolTip/Item/Frame2">
				<div class="header frame">
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
		</template>
	</window-base>
</template>

<script>
	import WindowBase from "../UIWindow/WindowBase.vue";
	import BasicComponent from "../BasicComponent.vue";

	
	export default {
		data: function() {
			return {
				html: [],
				guiData: null,
				zIndex: 10000,
			};
		},
		methods: {
			__set_z_index: function (z) {
				//this.zIndex = z;
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
			show: function () {
				this.$refs.window.show();
			},
			hide: function () {
				this.$refs.window.hide();
			},
			$position: function (options) {
				//calculate position
				$(this.$el).position(options);//this.$refs.window.$el == this.$el//true

				const style = this.$refs.window.style;
				const attributeStyleMap = this.$refs.window.$el.attributeStyleMap;

				//save position
				style.left = attributeStyleMap.get("left");
				style.top = attributeStyleMap.get("top");
			},
			setPosition: function (left, top) {
				const style = this.$refs.window.style;
				style.left = left;
				style.top = top;
			},
			setContentHtml: function (...content) {
				this.html.splice(0);//remove all
				this.html.push(...content);

				this.$forceUpdate();
				
				const { width, height } = this.$refs.content.getBoundingClientRect();
				const style = this.$refs.window.style;

				style.width = CSS.px(width);
				style.height = CSS.px(height);
			},
		},
		mounted: async function () {
			this.hide();
			this.guiData = await this.$refs.gui_root._$promise;
		},
		components: {
			"window-base": WindowBase,
		},
		mixins: [BasicComponent]
	}
</script>

<usage>
	app.vue.$refs.smallTip.html.push("<h1>Hello</h1>");
	app.vue.$refs.smallTip.show();

	$(app.vue.$refs.smallTip.$el).setPosition(123, 456);
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
