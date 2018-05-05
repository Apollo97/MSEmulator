
<template>
	<window-base>
		<template slot="content">
			<div style="position: relative;" class="header">
				<template v-if="raw">
					<img src="/images/UI/UIWindow4.img/Equip/backgrnd" />
					<img :style="{position: 'absolute', left: -raw.backgrnd2.origin.x+'px', top: -raw.backgrnd2.origin.y+'px'}" src="/images/UI/UIWindow4.img/Equip/backgrnd2" />
					<img :style="{position: 'absolute', left: -raw.tabbar.origin.x+'px', top: -raw.tabbar.origin.y+'px'}" src="/images/UI/UIWindow4.img/Equip/tabbar" />
					<div :style="{position: 'absolute', left: 0, top: 0, width: raw.backgrnd.__w+'px', height: raw.backgrnd.__h+'px'}"></div><!--not drag-->
					<div :style="{position: 'absolute', left: 0, top: 0, width: raw.backgrnd.__w+'px', height: '20px'}" class="header"></div><!--draggable capsule-->

					<template v-if="typeList.indexOf(sType)>=0">
						<img :style="{position: 'absolute', left: -raw.Tab.enabled[typeList.indexOf(sType)].origin.x+'px', top: -raw.Tab.enabled[typeList.indexOf(sType)].origin.y+'px'}" :src="'/images/UI/UIWindow4.img/Equip/Tab/enabled/'+typeList.indexOf(sType)" />
					</template>
					<template v-for="(tab, idx) in raw.Tab.disabled">
						<template v-if="typeList[idx]!=sType">
							<img @click="sType=typeList[idx]" :style="{position: 'absolute', left: -tab.origin.x+'px', top: -tab.origin.y+'px', cursor: 'pointer'}" :src="'/images/UI/UIWindow4.img/Equip/Tab/disabled/'+idx" />
						</template>
					</template>

					<template v-if="sType">
						<img :style="{position: 'absolute', left: -raw[sType].backgrnd.origin.x+'px', top: -raw[sType].backgrnd.origin.y+'px'}" :src="'/images/UI/UIWindow4.img/Equip/'+sType+'/backgrnd'" />
						<div :style="{position: 'absolute', left: -raw[sType].backgrnd.origin.x+'px', top: -raw[sType].backgrnd.origin.y+'px', width: raw[sType].backgrnd.__w+'px', height: raw[sType].backgrnd.__h+'px'}"></div><!--not drag-->
						<template v-for="(obj, slot) in raw[sType].Slots">
							<div :title="slot" @click="alert(slot)">
								<img :style="{position: 'absolute', left: -obj.origin.x+'px', top: -obj.origin.y+'px'}"
									 :src="'/images/UI/UIWindow4.img/Equip/'+sType+'/Slots/'+slot"
									 />
								<img :style="{position: 'absolute', left: (getCharaEquipIconPos(slotMap[sType][slot]).x-obj.origin.x)+'px', top: (getCharaEquipIconPos(slotMap[sType][slot]).y-obj.origin.y)+'px'}"
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
			</div>
		</template>
	</window-base>
</template>

<script>
	import { ItemCategoryInfo } from "../../../public/resource.js";
	import WindowBase from "./WindowBase.vue";

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
				raw: null,
				sType: "Equip",
			};
		},
		methods: {
			alert: function (msg) {
				debugger;
				//window.alert(msg);
			},
			loadData: async function () {
				this.raw = JSON.parse(await $get.data("/UI/UIWindow4.img/Equip"));
				this.slot_imgWidth = this.raw.Equip.Slots[1].__w;
				this.slot_imgHeight = this.raw.Equip.Slots[1].__h;
			},
			getCharaEquipIconPos: function(slot) {
				if (this.chara && this.chara.renderer) {
					let equip = this.chara.renderer.slots[slot];
					if (equip && equip._raw && equip._raw.info && equip._raw.info.icon && equip._raw.info.icon.origin) {
						const sw = this.slot_imgWidth;
						const sh = this.slot_imgHeight;
						let pos = equip._raw.info.icon.origin;
						let size = equip._raw.info.icon;
						let result={ x: (sw - size.__w) / 2, y: (sh - size.__h) / 2 };
						return result;
					}
				}
				return { x: 0, y: 0 };
			},
			getCharaEquipIconUrl: function(slot) {
				if (this.chara && this.chara.renderer) {
					let equip = this.chara.renderer.slots[slot];
					if (equip) {
						return equip.getIconUrl();
					}
				}
				return "";
			},
		},
		computed: {
			typeList: function () {
				let list = [];
				if (this.raw) {
					for (let i in this.raw) {
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
								list.push(i);
								break;
						}
					}
				}
				return list;
			},
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
		mounted: function () {
			this.loadData();
		},
		components: {
			"window-base": WindowBase,
		}
		//mixins: [],
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
