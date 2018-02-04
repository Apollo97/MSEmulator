
<template>
	<div class="UIEditCharacterAttribute" style="display: inline-block;">
		<div style="display: inline-block; vertical-align: top;">
			<table>
				<tr>
					<td></td>
					<td>
						<template v-if="chara.speed">
							<button @click="pauseAnimation" title="pause animation" class="btn">
								<img src="/images/player_pause.png" alt="pause" />
							</button>
						</template>
						<template v-else>
							<button @click="pauseAnimation" title="play animation" class="btn">
								<img src="/images/player_play.png" alt="play" />
							</button>
						</template>
					</td>
					<td>
						<button v-if="sceneChara.enablePhysics" @click="sceneChara.enablePhysics=false">禁用物理</button>
						<button v-else @click="sceneChara.enablePhysics=true">啟用物理</button>
					</td>
					<td>
						<button @click="isShowDebug=!isShowDebug">細節</button>
					</td>
				</tr>
				<tr>
					<th>動作</th>
					<td>
						<select v-model="chara.action" @clicl="update_frame_list('action')">
							<option v-if="!actions.length" disabled value="">請選擇</option>
							<option v-else v-for="item in actions">{{item}}</option>
						</select>
					</td>
					<td>
						<select v-model.number="chara.action_frame">
							<option v-if="!actions.length" disabled> ---- </option>
							<option v-else v-for="frame in chara.action_frame_count" :value="frame - 1">{{frame - 1}}</option>
						</select>
					</td>
				</tr>
				<tr>
					<th>表情</th>
					<td>
						<select v-model="chara.emotion">
							<option v-if="!emotions.length" disabled value="">請選擇</option>
							<option v-else v-for="item in emotions">{{item}}</option>
						</select>
					</td>
					<td>
						<select v-model.number="chara.emotion_frame" @clicl="update_frame_list('emotion')">
							<option v-if="!emotions.length" disabled> ---- </option>
							<option v-else v-for="frame in chara.emotion_frame_count" :value="frame - 1">{{frame - 1}}</option>
						</select>
					</td>
				</tr>
				<tr>
					<th>位置</th>
					<td><input type="number" v-model.number="chara.x" min="-9999" max="9999" style="width: 5em;" /></td>
					<td><input type="number" v-model.number="chara.y" min="-9999" max="9999" style="width: 5em;" /></td>
					<td><input type="number" v-model.number="sceneChara.$layer" min="0" max="7" style="width: 5em;" /></td>
				</tr>
				<tr>
					<th rowspan="2">耳朵</th>
					<td>
						<label class="chara_ear">人類<input type="radio" name="chara_ear" v-model="chara.ear" value="human" checked /></label>
					</td>
					<td>
						<label class="chara_ear">妖精<input type="radio" name="chara_ear" v-model="chara.ear" value="elfEar" /></label>
					</td>
					<td>
						<label class="chara_ear">木雷普<input type="radio" name="chara_ear" v-model="chara.ear" value="lefEar" /></label>
					</td>
				</tr>
				<tr>
					<td>
						<label class="chara_ear">亥雷普<input type="radio" name="chara_ear" v-model="chara.ear" value="highlefEar" /></label>
					</td>
				</tr>
				<!--<tr>
		<td></td>
		<td></td>
		<td></td>
	</tr>-->
			</table>
		</div>
		<div v-if="isShowDebug" style="display: inline-block; user-select: text;">
			<table>
				<tr v-for="equip in chara.slots._ordered_slot" v-if="equip">
					<td>
						{{getEquipCategoryName(equip)}}
					</td>
					<td style="max-width: 32px;">
						<img :src="getEquipIcon(equip)" style="max-width: 32px;" />
					</td>
					<td>
						<div>{{equip.name}}</div>
						<div>{{equip.id}}</div>
					</td>
					<td>
						<input type="range" value="0" min="0" max="360" @change="equip.setFilter(Number($event.target.value), 100, 100)" style="width: 8em;" />
					</td>
				</tr>
			</table>
		</div>
	</div>
</template>

<script>
	import { ItemCategoryInfo } from "../../public/resource.js";

	export default {
		props: ["sceneChara"],
		data: function () {
			return {
				isShowDebug: false,
			}
		},
		computed: {
			actions: () => character_action_list,
			emotions: () => character_emotion_list,
			chara: function () {
				return this.sceneChara.renderer;
			},
		},
		methods: {
			pauseAnimation: function () {
				this.chara.speed = this.chara.speed ? 0 : 1;//this.pause ? 0 : 1;
			},
			isEquip: function (id) {
				return ItemCategoryInfo.isEquip(id);
			},
			getEquipIcon(equip) {
				const type = ItemCategoryInfo.get(equip.id).slot;
				switch (type) {
					case "head":
						return "/images/" + equip._url + "stand1/0/head";
					case "body":
						return "/images/" + equip._url + "stand1/0/body";
					case "hair":
						return "/images/" + equip._url + "stand1/0/hair";
					case "face":
						return "/images/" + equip._url + "blink/0/face";
					default:
						return "/images/" + equip._url + "info/iconRaw";
				}
			},
			getEquipCategoryName: function (equip) {
				return ItemCategoryInfo.get(equip.id).categoryName;
			},
		},
	}

</script>

<style scoped>
	.UIEditCharacterAttribute td > * {
		width: 100%;
	}
	
	.btn {
		margin: auto;
		padding: 0;
	}
	.chara_ear {
		width: 100%;
		display: block;
	}
</style>
