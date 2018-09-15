
<template>
	<window-base>
		<template slot="content">
			<div :style="wndStyle">
				<gui-root ref="gui_root" p="/UI/UIWindow4/Stat">
					<gui p="main" class="stat-main">
						<gui-block p="backgrnd"></gui-block>
						<gui-texture-s p="backgrnd"></gui-texture-s>
						<gui-texture-s p="backgrnd2"></gui-texture-s>
						<gui-texture-s p="backgrnd3" class="point-ability-frame"></gui-texture-s>
						<gui-frame-s p="backgrnd" class="header"></gui-frame-s><!--draggable capsule-->
						<gui-frame-s p="backgrnd2"></gui-frame-s><!--not drag-->
						<gui-frame-s p="backgrnd3"></gui-frame-s><!--not drag-->

						<gui p="Disabled">
							<gui-texture-s p="STR"></gui-texture-s>
							<gui-texture-s p="DEX"></gui-texture-s>
							<gui-texture-s p="INT"></gui-texture-s>
							<gui-texture-s p="LUK"></gui-texture-s>
						</gui>

						<template v-if="isShowDetail">
							<gui-button-s p="BtDetailClose" @click="hideDetail($event)"></gui-button-s>
						</template>
						<template v-else>
							<gui-button-s p="BtDetailOpen" @click="showDetail($event)"></gui-button-s>
						</template>

						<template>
							<gui-button-s :disabled="abilityPoint" p="BtHpUp"></gui-button-s>
							<gui-button-s :disabled="abilityPoint" p="BtMpUp"></gui-button-s>
							<gui-button-s :disabled="abilityPoint" p="BtStrUp"></gui-button-s>
							<gui-button-s :disabled="abilityPoint" p="BtDexUp"></gui-button-s>
							<gui-button-s :disabled="abilityPoint" p="BtIntUp"></gui-button-s>
							<gui-button-s :disabled="abilityPoint" p="BtLukUp"></gui-button-s>

							<gui-button-s :disabled="abilityPoint" :p="'BtAuto' + autoDistType"></gui-button-s>
						</template>

						<template v-if="isShowHyperStat">
							<gui-button-s p="BtHyperStatOpen" @click="isShowHyperStat=!isShowHyperStat"></gui-button-s>
						</template>
						<template v-else>
							<gui-button-s p="BtHyperStatClose" @click="isShowHyperStat=!isShowHyperStat"></gui-button-s>
						</template>
					</gui>

					<div v-if="chara" style="font-size: 14px;">
						<span style="position: absolute; left: 70px; top: 27px;">{{chara.name}}</span>
					</div>

					<template v-if="isShowDetail & 0">
						<gui p="detail3" class="stat-detail3">
							<gui-block p="backgrnd"></gui-block>
							<gui-texture-s p="backgrnd"></gui-texture-s>
							<gui-texture-s p="backgrnd2"></gui-texture-s>
							<gui-texture-s p="backgrnd3"></gui-texture-s>
							<gui-texture-s p="backgrnd4"></gui-texture-s>
							<gui-frame-s p="backgrnd" class="header"></gui-frame-s><!--draggable capsule-->
							<gui-frame-s p="backgrnd2"></gui-frame-s><!--not drag-->
							<gui-frame-s p="backgrnd3"></gui-frame-s><!--not drag-->
							<gui-frame-s p="backgrnd4"></gui-frame-s><!--not drag-->
						</gui>

						<div v-if="chara">
							<!-- detail text -->
						</div>
					</template>
				</gui-root>
			</div>
		</template>
	</window-base>
</template>

<script>
	import { ItemCategoryInfo } from "../../../public/javascripts/resource.js";
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

				wndStyle: {
					width: 0,
					height: 0,
				},

				isShowDetail: false,
				isShowHyperStat: false,

				/** @type {"" | "1" | "2" | "_AB"} */
				autoDistType: "",
			};
		},
		computed: {
			abilityPoint: function () {
				return chara ? chara.stat ? chara.stat.abilityPoint : 10 : 10;
			},
		},
		methods: {
			showDetail: function (event) {
				this.isShowDetail = true;
				this.$emit("showDetail", event);
			},
			hideDetail: function (event) {
				this.isShowDetail = false;
				this.$emit("hideDetail", event);
			},
		},
		mounted: async function () {
			this.guiData = await this.$refs.gui_root._$promise;
			
			this.wndStyle["width"] = this.guiData.main.backgrnd.__w + "px";
			this.wndStyle["height"] = this.guiData.main.backgrnd.__h + "px";
		},
		components: {
			"window-base": WindowBase,
		},
		mixins: [BasicComponent]
	};
</script>

<style scoped>
	.stat-main {
	}
	.point-ability-frame {
	}

	.stat-detail3 {
	}
</style>