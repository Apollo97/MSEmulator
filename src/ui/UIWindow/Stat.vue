
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

						<div v-if="chara" class="stat-text-outer">
							<div style="margin-top: 27px;"></div><!-- padding -->
							<input type="text" v-model="chara.name" class="stat-text" />
							<input type="text" v-model="chara.職業" class="stat-text" />
							<input type="text" v-model="chara.公會" class="stat-text" />
							<input type="number" v-model.number="chara.人氣度" min="0" class="stat-text" />
							<input type="number" v-model.number="chara.屬性攻擊力" min="0" class="stat-text" />
							<input type="number" v-model.number="chara.HP" min="50" class="stat-text" />
							<input type="number" v-model.number="chara.MP" min="50" class="stat-text" />

							<div style="margin-top: 24px;"></div><!-- padding -->
							<input type="number" v-model.number="chara.AP" min="0" class="stat-text" style="width: 40%;" />
							<div style="margin-top: 8px;"></div><!-- padding -->

							<input type="number" v-model.number="chara.STP" min="0" class="stat-text" />
							<input type="number" v-model.number="chara.DEX" min="0" class="stat-text" />
							<input type="number" v-model.number="chara.INT" min="0" class="stat-text" />
							<input type="number" v-model.number="chara.LUK" min="0" class="stat-text" />
						</div>

						<template>
							<gui-button-s :enabled="chara.AP" p="BtHpUp"></gui-button-s>
							<gui-button-s :enabled="chara.AP" p="BtMpUp"></gui-button-s>
							<gui-button-s :enabled="chara.AP" p="BtStrUp"></gui-button-s>
							<gui-button-s :enabled="chara.AP" p="BtDexUp"></gui-button-s>
							<gui-button-s :enabled="chara.AP" p="BtIntUp"></gui-button-s>
							<gui-button-s :enabled="chara.AP" p="BtLukUp"></gui-button-s>

							<gui-button-s :enabled="chara.AP" :p="'BtAuto' + autoDistType"></gui-button-s>
						</template>

						<template v-if="isShowHyperStat">
							<gui-button-s p="BtHyperStatOpen" @click="isShowHyperStat=!isShowHyperStat"></gui-button-s>
						</template>
						<template v-else>
							<gui-button-s p="BtHyperStatClose" @click="isShowHyperStat=!isShowHyperStat"></gui-button-s>
						</template>
					</gui>

					<template v-if="isShowDetail">
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
		},
		methods: {
			showDetail: function (event) {
				//this.wndStyle["width"] = (this.guiData.main.backgrnd.__w + this.guiData.detail3.backgrnd.__w) + "px";
				//this.wndStyle["height"] = Math.max(this.guiData.main.backgrnd.__h, this.guiData.detail3.backgrnd.__h) + "px";
				this.isShowDetail = true;
				this.$emit("showDetail", event);
			},
			hideDetail: function (event) {
				//this.wndStyle["width"] = this.guiData.main.backgrnd.__w + "px";
				//this.wndStyle["height"] = this.guiData.main.backgrnd.__h + "px";
				this.isShowDetail = false;
				this.$emit("hideDetail", event);
			},
		},
		mounted: async function () {
			this.guiData = await this.$refs.gui_root._$promise;

			this.wndStyle["width"] = this.guiData.main.backgrnd.__w + "px";
			this.wndStyle["height"] = this.guiData.main.backgrnd.__h + "px";

			//this.hideDetail(false);
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
		position: absolute;
		left: 100%;
		top: 0;
	}

	.stat-text-outer {
		font-size: 12px;
		position: relative;
		padding-left: 70px;
		padding-right: 12px;
		margin-top: -150%;
	}

	.stat-text {
		font-size: 12px;
		padding: 0;
		padding-top: 4px;
		border: none;
		background: none;
		outline: none;
		margin: 0;
	}
</style>