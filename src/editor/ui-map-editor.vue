
<template>
	<div>
		<template v-for="(obj, index) in objs">
			<div>
				<div class="info sticky">
					<span>[{{index}}]</span>
					<span @contextmenu.prevent="copyToClipboard($event,obj._url)" @click="scrollIntoView($event,obj)" class="text">{{obj._url}}</span>
				</div>
				<div class="view">
					<div v-if="displayMode!=2" class="info">
						<table class="table">
							<tr>
								<td>type(sign)</td>
								<td><input-number v-model.number="obj.type" type="number" class="input" /></td>
							</tr>
							<tr>
								<td>x</td>
								<td><input-number v-model.number="obj.x" type="number" class="input" /></td>
							</tr>
							<tr>
								<td>y</td>
								<td><input-number v-model.number="obj.y" type="number" class="input" /></td>
							</tr>
							<tr>
								<td>z</td>
								<td><input-number v-model.number="obj.z" type="number" class="input" /></td>
							</tr>
							<tr>
								<td>zM</td>
								<td><input-number v-model.number="obj.zM" type="number" class="input" /></td>
							</tr>
							<tr>
								<td>flip</td>
								<td><input-number v-model.number="obj.f" type="number" min="0" max="1" class="input" /></td>
							</tr>
							<template v-if="obj.typeb!=null">
								<tr>
									<td>typeb</td>
									<td>
										<!--<input-number v-model.number="obj.typeb" min="0" max="7" type="number" class="input" />-->
										<input-select v-model.number="obj.typeb" class="input">
											<option value="0" title="">default</option>
											<option value="1" title="horizontal fill">repeat-x</option>
											<option value="2" title="vertical fill">repeat-y</option>
											<option value="3" title="fill">fill</option>
											<option value="4" title="horizontal roll">roll-x</option>
											<option value="5" title="vertical roll">roll-y</option>
											<option value="6" title="horizontal fill roll">fill roll-x</option>
											<option value="7" title="vertical fill roll">fill roll-y</option>
										</input-select>
									</td>
								</tr>
								<tr>
									<td>a</td>
									<td><input-number v-model.number="obj.a" min="0" max="255" type="number" class="input" /></td>
								</tr>
								<tr v-if="isShowRX(obj.typeb)">
									<td>rx</td>
									<td><input-number v-model.number="obj.rx" type="number" class="input" title="橫向滾動速度" /></td>
								</tr>
								<tr v-if="isShowRY(obj.typeb)">
									<td>ry</td>
									<td><input-number v-model.number="obj.ry" type="number" class="input" title="縱向滾動速度" /></td>
								</tr>
								<tr v-if="isShowCX(obj.typeb)">
									<td>cx</td>
									<td><input-number v-model.number="obj.cx" type="number" min="0" class="input" title="橫向間隔" /></td>
								</tr>
								<tr v-if="isShowCY(obj.typeb)">
									<td>cy</td>
									<td><input-number v-model.number="obj.cy" type="number" min="0" class="input" title="縱向間隔" /></td>
								</tr>
							</template>
						</table>
					</div>
					<div v-else class="info">
						<div>{{obj.constructor.name}}</div>
						<div>
							<table class="tb">
								<tr v-for="(val, key) in obj._raw">
									<td>{{key}}</td>
									<td>{{val}}</td>
								</tr>
							</table>
						</div>
					</div>
					<div v-if="obj.textures.length && obj.textures[obj.frame].texture" class="imgbox">
						<div class="info">
							<template v-if="obj.textures[obj.frame]._url.length > 300">
								<a>...</a>
							</template>
							<template v-else>
								<a :href="obj.textures[obj.frame]._url">
									{{obj._texture_base_path}}<span v-if="obj.constructor.name!='MapBackBase'" class="red-text">/{{obj.frame}}</span>
								</a>
							</template>
						</div>
						<div><img :src="obj.textures[obj.frame].texture.src" class="img"></img></div>
					</div>
					<div v-if="displayMode==1" class="info">
						<table v-if="obj.textures.length && obj.textures[obj.frame].texture" class="table">
							<tr>
								<td>frame</td>
								<td><input-number v-model.number="obj.frame" :min="0" :max="obj.textures.length-1" @input="fupdate" type="number" class="input-sm" /> / {{obj.textures.length-1}}</td>
							</tr>
							<tr>
								<td>center:</td>
								<td>
									<div class="input-xy">
										<input-number v-model.number="obj.textures[obj.frame].x" type="number" />
										<input-number v-model.number="obj.textures[obj.frame].y" type="number" />
									</div>
								</td>
							</tr>
							<tr>
								<td>size:</td>
								<td>{{obj.textures[obj.frame]._raw.__h}} * {{obj.textures[obj.frame]._raw.__h}}</td>
							</tr>
							<tr>
								<td>opacity</td>
								<td>
									<div class="input-xy">
										<input-number v-model.number="obj.textures[obj.frame].a0" type="number" class="input" />
										<input-number v-model.number="obj.textures[obj.frame].a1" type="number" class="input" />
									</div>
								</td>
							</tr>
							<tr>
								<td>delay</td>
								<td><input-number v-model.number="obj.textures[obj.frame].delay" type="number" class="input" /></td>
							</tr>
							<tr>
								<td>move</td>
								<td>
									<!--<input-number v-model.number="obj.textures[obj.frame].movetype" min="0" max="3" type="number" class="input" />-->
									<input-select v-model.number="obj.textures[obj.frame].movetype" class="input">
										<option value="0" title="">static</option>
										<option value="1" title="">橫向移動</option>
										<option value="2" title="">縱向移動</option>
										<option value="3" title="">旋轉</option>
									</input-select>
								</td>
							</tr>
							<tr v-if="obj.textures[obj.frame].movetype==1">
								<td>moveW</td>
								<td><input-number v-model.number="obj.textures[obj.frame].movew" type="number" class="input" title="移動寬" /></td>
							</tr>
							<tr v-else-if="obj.textures[obj.frame].movetype==2">
								<td>moveH</td>
								<td><input-number v-model.number="obj.textures[obj.frame].moveh" type="number" class="input" title="移動高" /></td>
							</tr>
							<tr v-if="obj.textures[obj.frame].movetype==3">
								<td>moveR</td>
								<td><input-number v-model.number="obj.textures[obj.frame].mover" type="number" class="input" title="旋轉週期(ms/π)" /></td>
							</tr>
							<tr v-else-if="obj.textures[obj.frame].movetype!=0">
								<td>moveP</td>
								<td><input-number v-model.number="obj.textures[obj.frame].movep" type="number" class="input" title="移動週期" /></td>
							</tr>
							<tr>
								<td></td>
								<td></td>
							</tr>
						</table>
					</div>
					<div v-if="displayMode==2 || obj.constructor.name.endsWith('SkeletalAnim')" class="info">
						<table class="tb">
							<tr v-for="(val, key) in obj._raw">
								<td>{{key}}</td>
								<td>{{val}}</td>
							</tr>
						</table>
					</div>
				</div>
			</div>
			<hr />
		</template>
	</div>
</template>

<script>

export default {
	props: ["objs", "displayMode"],
	//props: {
	//	objs: {
	//		type: MapObjectBase,
	//		required: true
	//	},
	//}
	methods: {
		isShowRX: function (typeb) {
			return typeb == 4 || typeb == 5;
		},
		isShowRY: function (typeb) {
			return typeb == 5 || typeb == 7;
		},
		isShowCX: function (typeb) {
			return typeb == 1 || typeb == 3 || typeb == 4 || typeb == 6 || typeb == 7;
		},
		isShowCY: function (typeb) {
			return typeb == 2 || typeb == 3 || typeb == 5 || typeb == 6 || typeb == 7;
		},
		scrollIntoView: function(event, obj) {
			let center = obj.aabb.center;
			m_viewRect.setCenter(center.x, center.y);
			obj.$select();
			
			event.currentTarget.scrollIntoView();
		},
		fupdate: function () {
			this.$forceUpdate();
		},
		copyToClipboard: function (event, text) {
			//window.copyToClipboard(text);
			window.SelectText(event.currentTarget);
		},
	},
}

</script>

<style scoped>

.sticky {
	position: sticky;
	left: 0;
	top: 0;
}

.info {
	background: #f5f5f5;
}

.view {
	display: flex;
}
.view > div {
	flex: 100;
}

.imgbox {
	flex: 80;
}

.table {
	border-collapse: collapse;
	border-spacing: 0;
}

.input {
	width: 5em;
}

.input-xy {
	width: 8em;
}
.input-xy > * {
	width: 4em;
}

.img {
	max-width: 25vh;
	max-height: 25vh;
	border-bottom: 1px solid red;
	border-left: 1px solid green;
}

.text {
	user-select: text;
}

.red-text {
	color: red;
}

.tb, .tb td {
	border: 1px solid black;
	border-collapse: collapse;
	border-spacing: 0;
	user-select: text;
}

</style>
