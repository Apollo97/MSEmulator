
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
								<img :style="{position: 'absolute', left: -obj.origin.x+'px', top: -obj.origin.y+'px'}" :src="'/images/UI/UIWindow4.img/Equip/'+sType+'/Slots/'+slot" />
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
	import WindowBase from "./WindowBase.vue";

	export default {
		name: "equip-slot",
		props: {
			"chara": {
				required: false
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
				//window.alert(msg);
			},
			loadData: async function () {
				this.raw = JSON.parse(await ajax_get("/assets/UI/UIWindow4.img/Equip"));
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
		},
		mounted: function () {
			this.loadData();
		},
		components: {
			"window-base": WindowBase,
		}
		//mixins: [],
	};
</script>
