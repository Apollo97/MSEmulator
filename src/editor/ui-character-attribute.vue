
<template>
	<div class="UIEditCharacterAttribute" style="display: inline-block;">
		<div style="display: inline-block; vertical-align: top;">
			<table style="border-collapse: collapse; border-spacing: 0px;">
				<tr>
					<td>
						<template v-if="chara.speed">	
							<button @click="pauseAnimation" title="pause animation">
								<img src="/images/player_pause.png" alt="pause" />
							</button>
						</template>
						<template v-else="">
							<button @click="pauseAnimation" title="play animation">
								<img src="/images/player_play.png" alt="play" />
							</button>
						</template>
					</td>
					<td title="animation speed">
						<input type="number" v-model.number="chara.speed" min="0" max="5" step="0.01" />
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
				<tr title="禁用物理後可設定角色的位置">
					<th>位置</th>
					<td colspan="3" style="display: flex; position: absolute;">
						<input :disabled="sceneChara.enablePhysics" type="number" v-model.number="chara.x" min="-9999" max="9999" />
						<input :disabled="sceneChara.enablePhysics" type="number" v-model.number="chara.y" min="-9999" max="9999" />
						<input :disabled="sceneChara.enablePhysics" type="number" v-model.number="sceneChara.$layer" min="0" max="7" />
					</td>
				</tr>
				<tr title="禁用物理後可設定角色的旋轉和方向">
					<td colspan="4">
						<label>旋轉：
							<input :disabled="sceneChara.enablePhysics" type="number" v-model.number="chara_angle" min="-180" max="180" step="10" />°
						</label>
						<label>方向：
							<select :disabled="sceneChara.enablePhysics" v-model.number="chara.front">
								<option value="1">右</option>
								<option value="-1">左</option>
							</select>
						</label>
					</td>
				</tr>
				<tr>
					<th rowspan="2">耳朵</th>
					<td>
						<label class="chara_ear">人類<input type="radio" name="chara_ear" v-model="chara.ear" value="human" checked /></label>
					</td>
					<td>
						<label class="chara_ear">妖精<input type="radio" name="chara_ear" v-model="chara.ear" value="elf" /></label>
					</td>
					<td>
						<label class="chara_ear">木雷普<input type="radio" name="chara_ear" v-model="chara.ear" value="lef" /></label>
					</td>
				</tr>
				<tr>
					<td>
						<label class="chara_ear">亥雷普<input type="radio" name="chara_ear" v-model="chara.ear" value="highlef" /></label>
					</td>
				</tr>
				<!--<tr>
					<td></td>
					<td></td>
					<td></td>
				</tr>-->
			</table>
		</div>
		<div v-if="isShowDebug" style="width: 100%; display: inline-block; user-select: text;">
			<hr />
			<table style="border-spacing: 0px; border-collapse: collapse; width: 100%;">
				<template v-for="(equip,index) in chara.slots._ordered_slot">
					<template v-if="equip">
						<tr @mouseover="isShowEquipImageFilter[index]=true;" @mouseleave="isShowEquipImageFilter[index]=false;">
							<td>
								{{getEquipCategoryName(equip)}}
							</td>
							<td style="width: 32px; height: 32px;">
								<img :src="equip.getIconUrl()" class="equip-icon" />
							</td>
							<td>
								<div>{{equip.name}}</div>
								<div>{{equip.id}}</div>
							</td>
							<td>
							</td>
						</tr>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @mouseover="isShowEquipImageFilter[index]=true;" @mouseleave="isShowEquipImageFilter[index]=false;">
								<td></td>
								<td>opacity</td>
								<td>
									<input type="range" v-model.number="equip.opacity" min="0.01" max="1" step="0.01" />
								</td>
								<td>
									<input type="number" v-model.number="equip.opacity" min="0.01" max="1" step="0.01" />
								</td>
								<td><button @click="equip.opacity=1;" class="btn">×</button></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @mouseover="isShowEquipImageFilter[index]=true;" @mouseleave="isShowEquipImageFilter[index]=false;">
								<td></td>
								<td>hue</td>
								<td>
									<input type="range" v-model.number="equip.filter.hue" min="0" max="359" />
								</td>
								<td>
									<input type="number" v-model.number="equip.filter.hue" min="0" max="359" />
								</td>
								<td><button @click="equip.filter.hue=0;" class="btn">×</button></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @mouseover="isShowEquipImageFilter[index]=true;" @mouseleave="isShowEquipImageFilter[index]=false;">
								<td></td>
								<td>sat</td>
								<td>
									<input type="range" v-model.number="equip.filter.sat" min="0" max="999" />
								</td>
								<td>
									<input type="number" v-model.number="equip.filter.sat" min="0" max="999" />
								</td>
								<td><button @click="equip.filter.sat=100;" class="btn">×</button></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @mouseover="isShowEquipImageFilter[index]=true;" @mouseleave="isShowEquipImageFilter[index]=false;">
								<td></td>
								<td>bri</td>
								<td>
									<input type="range" v-model.number="equip.filter.bri" min="0" max="999" />
								</td>
								<td>
									<input type="number" v-model.number="equip.filter.bri" min="0" max="999" />
								</td>
								<td><button @click="equip.filter.bri=100;" class="btn">×</button></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @mouseover="isShowEquipImageFilter[index]=true;" @mouseleave="isShowEquipImageFilter[index]=false;">
								<td></td>
								<td>contrast</td>
								<td>
									<input type="range" v-model.number="equip.filter.contrast" min="0" max="999" />
								</td>
								<td>
									<input type="number" v-model.number="equip.filter.contrast" min="0" max="999" />
								</td>
								<td><button @click="equip.filter.contrast=100;" class="btn">×</button></td>
							</tr>
						</transition>
					</template>
				</template>
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
				isShowEquipImageFilter: [],
			}
		},
		computed: {
			actions: () => character_action_list,
			emotions: () => character_emotion_list,
			chara: function () {
				return this.sceneChara.renderer;
			},
			chara_angle: {
				get: function () {
					return Math.round(Math.degrees(this.sceneChara.renderer.angle));
				},
				set: function (deg) {
					this.sceneChara.renderer.angle = Math.radians(deg);
				}
			},
		},
		methods: {
			pauseAnimation: function () {
				this.chara.speed = this.chara.speed ? 0 : 1;//this.pause ? 0 : 1;
			},
			isEquip: function (id) {
				return ItemCategoryInfo.isEquip(id);
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
		user-select: none;
	}
	.chara_ear {
		width: 100%;
		display: block;
	}
	.equip-icon {
		margin: auto;
		max-width: 32px;
		max-height: 32px;
		width: auto !important;
		height: auto !important;
	}
</style>
