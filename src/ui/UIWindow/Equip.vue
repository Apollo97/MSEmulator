
<template>
	<window-base>
		<template slot="content">
			<div :style="wndStyle">
				<gui-root ref="gui_root" p="/UI/UIWindow4/Equip">
					<gui-texture-s p="backgrnd"></gui-texture-s>
					<gui-texture-s p="backgrnd2"></gui-texture-s>
					<gui-texture-s p="tabbar"></gui-texture-s>
					<gui-frame-s p="backgrnd" class="header"></gui-frame-s><!--draggable capsule-->
					<gui-frame-s p="backgrnd2"></gui-frame-s><!--not drag-->

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

						<template v-if="sType">
							<gui-texture-s :p="sType+'/backgrnd'"></gui-texture-s>
							<template v-for="(obj, slot) in guiData[sType].Slots">
								<div :title="slot" @click="alert(slot)">
									<gui-texture-s :p="sType+'/Slots/'+slot"></gui-texture-s>
									<img v-if="slotMap[sType]" :style="{position: 'absolute', left: (getCharaEquipIconPos(slotMap[sType][slot]).x-obj.origin.x)+'px', top: (getCharaEquipIconPos(slotMap[sType][slot]).y-obj.origin.y)+'px'}"
										:src="getCharaEquipIconUrl(slotMap[sType][slot])"
										/>
								</div>
							</template>
						</template>
					</template>
					
					<select v-model="sType" style="position: absolute; left: 1em; bottom: 1.5em;">
						<option v-for="stype in typeList" :value="stype">
							{{stype}}
						</option>
					</select>
				</gui-root>
			</div>
		</template>
	</window-base>
</template>

<script>
	import { ItemCategoryInfo } from "../../Common/ItemCategoryInfo.js";
	import WindowBase from "./WindowBase.vue";
	import BasicComponent from "../BasicComponent.vue";

	/** @type {{[jobId:string]:string}} */
	let job_special_tab_map = {
	};

	/** @type {{[jobId:string]:string}} */
	let job_special_tab = [
		"Dragon", "Mechanic", "Coordinate", "Haku"
	];

	/** @type {{[jobId:string]:string}} */
	let job_special_cash_tab = [
		"Zero_Cash", "Angel_Cash"
	];

	let slot_map = {
		Equip: {
			1: "cap",
			2: "accessoryFace",
			3: "accessoryEyes",
			4: "accessoryEars",
			5: "coat",
			5: "longcoat",
			6: "pants",
			7: "shoes",
			8: "glove",
			9: "cape",
			10: "shield",
			11: "weapon",
		},
		Cash: {
		},
	};
	Object.keys(slot_map.Equip).forEach(slot => {
		slot_map.Cash[slot + 100] = slot_map.Equip[slot];
	});
	window.$WND_EQUIP_SLOT_MAP = slot_map;

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
				sType: "Equip",

				wndStyle: {
					width: 0,
					height: 0,
				},
			};
		},
		methods: {
			alert: function (msg) {
				debugger;
				//window.alert(msg);
			},
			getCharaEquipIconPos: function(slot) {
				if (this.chara && this.chara.renderer) {
					let equip = this.chara.renderer.slots[slot];
					if (equip && equip._raw && equip._raw.info && equip._raw.info.icon && equip._raw.info.icon.origin) {
						const sw = this.slot_imgWidth;
						const sh = this.slot_imgHeight;
						let pos = equip._raw.info.icon.origin;
						let size = equip._raw.info.icon;
						let result = { x: (sw - size.__w) / 2, y: (sh - size.__h) / 2 };
						return result;
					}
				}
				return { x: 0, y: 0 };
			},
			getCharaEquipIconUrl: function(slot) {
				if (this.chara && this.chara.renderer) {
					let equip = this.chara.renderer.slots[slot];
					if (equip) {
						return $get.imageUrl(equip.getIconUrl());
					}
				}
				return "";
			},
		},
		computed: {
			slotMap: {
				get: function() {
					return slot_map;
				},
				set: function (value) {
					debugger;
					slot_map = value;
				},
			},
		},
		mounted: async function () {
			this.guiData = await this.$refs.gui_root._$promise;

			this.typeList.length = 0;
			if (this.guiData) {
				for (let i in this.guiData) {
					switch (i) {
						case "Zero_Cash":
							break;
						case "Angel_Cash":
							break;
						case "totem":
							break;
						case "backgrnd":
						case "backgrnd2":
						case "tabbar":
						case "Tab":
							break;
						default:
							this.typeList.push(i);
							break;
					}
				}
			}
			
			this.slot_imgWidth = this.guiData.Equip.Slots[1].__w;
			this.slot_imgHeight = this.guiData.Equip.Slots[1].__h;

			this.wndStyle["width"] = this.guiData.backgrnd.__w + "px";
			this.wndStyle["height"] = this.guiData.backgrnd.__h + "px";
		},
		components: {
			"window-base": WindowBase,
		},
		mixins: [BasicComponent]
	};
/*
cap = 1
accessoryFace	= 2
accessoryEyes	= 3
accessoryEars	= 4
coat = 5
longcoat = 5
pants = 6
shoes		= 7
glove		= 8
shield		= 10
cape		= 9
weapon		= 11
*/
</script>
