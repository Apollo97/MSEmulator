
<template>
	<window-base ref="window">
		<template slot="content">
			<gui-root ref="gui_root" p="/UI/UIWindow2/Skill/main">
				<gui-texture-s p="backgrnd"></gui-texture-s>
				<gui-texture-s p="backgrnd2"></gui-texture-s>
				<gui-texture-s p="backgrnd3"></gui-texture-s>
				<gui-frame-s p="backgrnd" class="header"></gui-frame-s><!--draggable capsule-->
				<gui-frame-s p="backgrnd2"></gui-frame-s><!--not drag-->
				<gui-frame-s p="backgrnd3"></gui-frame-s><!--not drag-->
				<template v-if="guiData">
					<!--begin tabs-->
					<template v-for="(tab, idx) in guiData.Tab.disabled">
						<template v-if="typeList[idx]!=sType">
							<gui-texture-s @click="sType=typeList[idx]" :p="'Tab/disabled/'+idx" class="ui-clickable"></gui-texture-s>
						</template>
					</template>
					<template v-if="typeList.indexOf(sType)>=0">
						<gui-texture-s :p="'Tab/enabled/'+typeList.indexOf(sType)"></gui-texture-s>
					</template>
					<!--end tabs-->
				</template>
			</gui-root>
		</template>
	</window-base>
</template>

<script>
	import { ItemCategoryInfo } from "../../Common/ItemCategoryInfo.js";
	import WindowBase from "./WindowBase.vue";
	import BasicComponent from "../BasicComponent.vue";

	export default {
		name: "equip-slot",
		props: {
			"chara": {
				required: true,
			},
		},
		data: function () {
			return {
				guiData: null,

				typeList: [],
				sType: "0",
			};
		},
		computed: {
		},
		methods: {
		},
		mounted: async function () {
			this.guiData = await this.$refs.gui_root._$promise;

			this.typeList = Object.keys(this.guiData.Tab.enabled);

			this.$refs.window.style.width = CSS.px(this.guiData.backgrnd.__w);
			this.$refs.window.style.height = CSS.px(this.guiData.backgrnd.__h);
		},
		components: {
			"window-base": WindowBase,
		},
		mixins: [BasicComponent]
	};
</script>

<style scoped>
</style>