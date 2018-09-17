
<template>
	<div class="UICharacterRenderer" style="display: inline-block;">
		<div style="display: inline-block; vertical-align: top;">
			<table style="border-collapse: collapse; border-spacing: 0px;">
				<tr>
					<td>
						<template v-if="!chara.pause && chara.speed">	
							<button @click="chara.pause=!chara.pause" title="pause animation">
								<img src="images/player_pause.png" alt="pause" />
							</button>
						</template>
						<template v-else="">
							<button @click="chara.pause=!chara.pause" title="play animation">
								<img src="images/player_play.png" alt="play" />
							</button>
						</template>
					</td>
					<td title="animation speed">
						<input-number v-model.number="chara.speed" min="0" max="5" step="0.01" fixed="2" />
					</td>
					<td>
						<button v-if="sceneChara.enablePhysics" @click="sceneChara.enablePhysics=false, oninput()">分離物理</button>
						<button v-else @click="sceneChara.enablePhysics=true, oninput()">聯結物理</button>
					</td>
					<td>
						<button @click="isShowDebug=!isShowDebug">細節</button>
					</td>
				</tr>
				<tr>
					<th>表情</th>
					<td>
						<select v-model="chara.emotion" @input="oninput" title="表情">
							<option v-if="!emotions.length" disabled value="">請選擇</option>
							<option v-else v-for="item in emotions">{{item}}</option>
						</select>
					</td>
					<td>
						<select v-model.number="chara.emotion_frame" @wheel.prevent="onwheel($event, 'emotion', chara.emotion_frame_count-1)" title="表情影格">
							<option v-if="!emotions.length" disabled> ---- </option>
							<option v-else v-for="frame in chara.emotion_frame_count" :value="frame - 1">{{frame - 1}}</option>
						</select>
					</td>
					<td>
						<input-number v-model.number="chara.blinkRate" min="0" max="1" step="0.1" title="blink" fixed="4" />
					</td>
				</tr>
				<tr title="分離物理後可設定角色的動作">
					<th>動作</th>
					<td>
						<select :disabled="sceneChara.enablePhysics" v-model="chara.action" @input="oninput" title="動作">
							<option v-if="!actions.length" disabled value="">請選擇</option>
							<option v-else v-for="item in actions">{{item}}</option>
						</select>
					</td>
					<td>
						<select :disabled="sceneChara.enablePhysics" v-model.number="chara.action_frame" @wheel.prevent="onwheel($event, 'action', chara.action_frame_count-1)" title="動作影格">
							<option v-if="!actions.length" disabled> ---- </option>
							<option v-else v-for="frame in chara.action_frame_count" :value="frame - 1">{{frame - 1}}</option>
						</select>
					</td>
					<td v-if="chara.slots.tamingMob">
						<select :disabled="sceneChara.enablePhysics" v-model="chara._ride_action" @input="oninput" title="騎寵動作">
							<option v-if="!actions.length" disabled value="">騎寵動作</option>
							<option v-else v-for="item in actions">{{item}}</option>
						</select>
					</td>
				</tr>
				<tr title="分離物理後可設定角色的位置">
					<th>位置</th>
					<td colspan="3">
						<div>
							<input-number :disabled="sceneChara.enablePhysics" v-model.number="chara.x" min="-99999" max="99999" title="X" />
							<input-number :disabled="sceneChara.enablePhysics" v-model.number="chara.y" min="-99999" max="99999" title="Y" />
							<input-number :disabled="sceneChara.enablePhysics" v-model.number="sceneChara.$layer" min="0" max="7" title="Z" />
						</div>
					</td>
				</tr>
				<tr title="分離物理後可設定角色的旋轉和方向">
					<td colspan="4">
						<label>旋轉：
							<input-number :disabled="sceneChara.enablePhysics" v-model.number="chara_angle" min="-180" max="180" step="10" />°
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
						<label class="chara_ear"><input type="radio" name="chara_ear" v-model="chara.ear" value="human" checked @input="oninput" />人類</label>
					</td>
					<td>
						<label class="chara_ear"><input type="radio" name="chara_ear" v-model="chara.ear" value="elf" @input="oninput" />妖精</label>
					</td>
					<td>
						<!---->
					</td>
				</tr>
				<tr>
					<td>
						<label class="chara_ear"><input type="radio" name="chara_ear" v-model="chara.ear" value="lef" @input="oninput" />木雷普</label>
					</td>
					<td>
						<label class="chara_ear"><input type="radio" name="chara_ear" v-model="chara.ear" value="highlef" @input="oninput" />亥雷普</label>
					</td>
					<td>
						<!---->
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
			<table>
				<tr>
					<th>max value</th>
					<td><input type="range" step="100" min="100" max="1000" v-model="max_value" /></td>
					<td><input-number step="100" min="100" max="1000" v-model="max_value" /></td>
				</tr>
			</table>
			<hr />
			<table class="tb-equip-filter">
				<template v-for="(equip,index) in chara.slots._ordered_slot">
					<template v-if="equip">
						<tr :class="isShowEquipImageFilter[index] ? 'open':''" @click="showEquipImageFilter($event, index, equip)">
							<!--<td style="width:1em;">
								<span>{{getEquipCategoryName(equip)}}</span>
							</td>-->
							<td style="height: 32px">
								<img style="max-width: 32px; width: auto; height: 32px;" :src="getIconUrl(equip)" class="equip-icon" />
							</td>
							<td style="width:50%;">
								<div>{{equip._raw.name||equip.name}}</div>
							</td>
							<td style="width:50%;">
								<div>{{equip.id}}</div>
							</td>
						</tr>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @click="click_scrollIntoView($event)">
								<td>opacity</td>
								<td style="width:50%;">
									<input type="range" v-model.number="equip.opacity" min="0.01" max="1" step="0.01" @input="oninput" />
								</td>
								<td style="width:50%;">
									<input-number v-model.number="equip.opacity" min="0.01" max="1" step="0.01" @input="oninput" />
								</td>
								<td><input @click="equip.opacity=1; oninput();" type="button" value="×" class="btn" /></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @click="click_scrollIntoView($event)">
								<td>hue</td>
								<td style="width:50%;">
									<input type="range" v-model.number="equip.filter.hue" min="0" max="359" @input="oninput" />
								</td>
								<td style="width:50%;">
									<input-number v-model.number="equip.filter.hue" min="0" max="359" @input="oninput" />
								</td>
								<td><input @click="equip.filter.hue=0; oninput();" type="button" value="×" class="btn" /></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @click="click_scrollIntoView($event)">
								<td>sat</td>
								<td style="width:50%;">
									<input type="range" v-model.number="equip.filter.sat" min="0" :max="max_value" @input="oninput" />
								</td>
								<td style="width:50%;">
									<input-number v-model.number="equip.filter.sat" min="0" :max="max_value" @input="oninput" />
								</td>
								<td><input @click="equip.filter.sat=100; oninput();" type="button" value="×" class="btn" /></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @click="click_scrollIntoView($event)">
								<td>bri</td>
								<td style="width:50%;">
									<input type="range" v-model.number="equip.filter.bri" min="0" :max="max_value" @input="oninput" />
								</td>
								<td style="width:50%;">
									<input-number v-model.number="equip.filter.bri" min="0" :max="max_value" @input="oninput" />
								</td>
								<td><input @click="equip.filter.bri=100; oninput();" type="button" value="×" class="btn" /></td>
							</tr>
						</transition>
						<transition name="fade">
							<tr v-show="isShowEquipImageFilter[index]" @click="click_scrollIntoView($event)">
								<td>contrast</td>
								<td style="width:50%;">
									<input type="range" v-model.number="equip.filter.contrast" min="0" :max="max_value" @input="oninput" />
								</td>
								<td style="width:50%;">
									<input-number v-model.number="equip.filter.contrast" min="0" :max="max_value" @input="oninput" />
								</td>
								<td><input @click="equip.filter.contrast=100; oninput();" type="button" value="×" class="btn" /></td>
							</tr>
						</transition>
					</template>
				</template>
			</table>
		</div>
	</div>
</template>

<script>
	import { ItemCategoryInfo } from "../../public/javascripts/resource.js";

	export default {
		props: ["sceneChara"],
		data: function () {
			return {
				isShowDebug: false,
				isShowEquipImageFilter: [],
				max_value: 100,
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
			isEquip: function (id) {
				return ItemCategoryInfo.isEquip(id);
			},
			getEquipCategoryName: function (equip) {
				return ItemCategoryInfo.get(equip.id).categoryName;
			},
			getIconUrl(equip) {
				return $get.imageUrl(equip.getIconUrl());
			},
			showEquipImageFilter: function (event, index) {
				let old_status = Boolean(this.isShowEquipImageFilter[index]);
				if (!old_status) {
					//close all
					//for (let i = 0; i < this.isShowEquipImageFilter.length; ++i) {
					//	this.isShowEquipImageFilter[i] = false;
					//}
					
					this.$set(this.isShowEquipImageFilter, index, true);
					
					event.target.scrollIntoView({ behavior: "instant", block: "start", inline: "start" });
				}
				else {
					this.$set(this.isShowEquipImageFilter, index, false);
				}
			},
			click_scrollIntoView: function (event) {
				if (event.target.tagName.toLowerCase() != "input") {
					event.target.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
				}
			},
			oninput: async function () {
				const crr = this.sceneChara.renderer;
				await crr.__synchronize(0);
				this.$forceUpdate();
			},
			onwheel: function (event, type, max) {
				let amount = Math.sign(-event.deltaY);
				let oldVal = this.chara[type + "_frame"];
				if (amount) {
					let newVal = oldVal + amount;
					if (newVal >= 0 && newVal <= max) {
						this.chara[type + "_frame"] = newVal;
					}
				}
				
				this.oninput();
			},
		},
	}

</script>

<style scoped>
	.UICharacterRenderer td > * {
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
		display: table-row;
	}
	.open {
		color: red;
	}
	.tb-equip-filter {
		border-spacing: 0px;
		border-collapse: collapse;
		width: 100%;
	}
</style>
