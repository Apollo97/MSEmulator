
<template>
	<table v-if="spriteData!=null" class="fill">
		<tr>
			<td>
				<label><input type="checkbox" v-model.boolean="onlyShowLoaded" /> 只顯示已載入的項目</label>
			</td>
		</tr>
		<tr>
			<td style="height: 0px;">
				<template v-if="!onlyShowLoaded">
					<button :disabled="isLoadingPackage||spriteType==null||spritePackage==null||(spriteData[spriteType]&&spriteData[spriteType][spritePackage])" @click="loadPackage(spritePackage)">load</button>
				</template>
				<select :disabled="isLoadingPackage" v-model="spriteType" @change="refresh">
					<option value="Obj">Obj</option>
					<option value="Tile">Tile</option>
					<option value="Back">Back</option>
				</select>
				<template v-if="packageList">
					<select :disabled="isLoadingPackage" v-model="spritePackage">
						<template v-for="packName in packageList">
							<option :value="packName">{{packName}}</option>
						</template>
					</select>

					<template v-if="spriteType=='Back'&&spriteData.Back[spritePackage]&&Object.keys(spriteData.Back[spritePackage]).length">
						<select :disabled="isLoadingPackage" v-model="backType">
							<option v-if="Object.keys(spriteData.Back[spritePackage].back).length" value="back">back</option>
							<option v-if="Object.keys(spriteData.Back[spritePackage].ani).length" value="ani">ani</option>
						</select>
					</template>

					<template v-if="spriteType=='Tile'">

					</template>

					<template v-if="spriteType=='Obj'&&spriteData.Obj[spritePackage]&&Object.keys(spriteData.Obj[spritePackage]).length">
						<select :disabled="isLoadingPackage" v-model="obj_l0" @change="obj_l1=null">
							<template v-for="l0 in makeList(spriteData.Obj[spritePackage])">
								<option :value="l0">{{l0}}</option>
							</template>
						</select>
						<template v-if="spriteData.Obj[spritePackage][obj_l0]">
							<select :disabled="isLoadingPackage" v-model="obj_l1" @change="obj_l2=null">
								<template v-for="l1 in makeList(spriteData.Obj[spritePackage][obj_l0])">
									<option :value="l1">{{l1}}</option>
								</template>
							</select>
						</template>
					</template>
				</template>
			</td>
		</tr>
		<tr v-if="spriteType=='Obj'&&spriteData.Obj">
			<td class="fill">
				<template v-if="spriteData.Obj[spritePackage]">
					<template v-if="spriteData.Obj[spritePackage][obj_l0]">
						<template v-if="spriteData.Obj[spritePackage][obj_l0][obj_l1]">
							<template v-for="l2 in makeList(spriteData.Obj[spritePackage][obj_l0][obj_l1])">
								<div @click="_onClick($event,['Obj',spritePackage,obj_l0,obj_l1,l2]);showPreview($event, spriteData.Obj[spritePackage][obj_l0][obj_l1][l2][0])"
										@mouseover="showPreview($event, spriteData.Obj[spritePackage][obj_l0][obj_l1][l2][0])"
										@mouseout="hidePreview"
										class="icon-frame center-text">
									<div>
										<span>{{l2}}</span>
									</div>
									<div v-if="spriteData.Obj[spritePackage][obj_l0][obj_l1][l2][0]">
										<img :src="getImgSrc(spriteData.Obj[spritePackage][obj_l0][obj_l1][l2][0][''])" class="small-icon" :alt="l2" />
									</div>
									<div v-else>
										(no image)
									</div>
								</div>
							</template>
						</template>
					</template>
				</template>
			</td>
		</tr>
		<tr v-else-if="spriteType=='Tile'&&spriteData.Tile">
			<td class="fill">
				<template v-if="spriteData.Tile[spritePackage]">
					<template v-for="tileName in makeList(spriteData.Tile[spritePackage])">
						<div class="hover-border-green">
							<div>
								<span>{{tileName}}</span>
							</div>
							<template v-for="u in makeList(spriteData.Tile[spritePackage][tileName])">
								<div @click="_onClick($event,['Tile',spritePackage,tileName,u]);showPreview($event, spriteData.Tile[spritePackage][tileName][u])"
									 @mouseover="showPreview($event, spriteData.Tile[spritePackage][tileName][u])"
									 @mouseout="hidePreview"
									 class="icon-frame center-text">
									<div>
										<span>{{u}}</span>
									</div>
									<div>
										<img :src="getImgSrc(spriteData.Tile[spritePackage][tileName][u][''])" class="small-icon" />
									</div>
								</div>
							</template>
						</div>
					</template>
				</template>
			</td>
		</tr>
		<tr v-else-if="spriteType=='Back'&&spriteData.Back">
			<td class="fill">
				<template v-if="spriteData.Back[spritePackage]">
					<template v-if="backType=='ani'">
						<template v-for="no in makeList(spriteData.Back[spritePackage][backType])">
							<div @click="_onClick($event,['Back',spritePackage,backType,no]);showPreview($event, spriteData.Back[spritePackage][backType][no])"
									@mouseover="showPreview($event, spriteData.Back[spritePackage][backType][no][0])"
									@mouseout="hidePreview"
									class="icon-frame center-text">
								<div>
									<span>{{no}}</span>
								</div>
								<div>
									<img :src="getImgSrc(spriteData.Back[spritePackage][backType][no][0][''])" class="small-icon" />
								</div>
							</div>
						</template>
					</template>
					<template v-else-if="backType=='spine'">
						[spine]
					</template>
					<template v-else>
						<template v-for="no in makeList(spriteData.Back[spritePackage][backType])">
							<div @click="_onClick($event,['Back',spritePackage,backType,no]);showPreview($event, spriteData.Back[spritePackage][backType][no])"
									@mouseover="showPreview($event, spriteData.Back[spritePackage][backType][no])"
									@mouseout="hidePreview"
									class="icon-frame center-text">
								<div>
									<span>{{no}}</span>
								</div>
								<div>
									<img :src="getImgSrc(spriteData.Back[spritePackage][backType][no][''])" class="small-icon" />
								</div>
							</div>
						</template>
					</template>
				</template>
			</td>
		</tr>
		<tr v-else-if="0">
			<template>
				<td>
					{{}}
				</td>
			</template>
		</tr>
		<tr v-else-if="0">
			<td>
				{{[spriteType, spritePackage].join("/")}}
			</td>
		</tr>
		<tr v-else class="fill">
			<td class="fill"></td>
		</tr>
	</table>
	<div v-else>
		loading map sprite data
	</div>
</template>

<script>
	export default {
		props: {
			tileInfo: {
				default: "",
			},
		},
		data: function () {
			return {
				spriteData: null,
				spriteType: null,

				spritePackage: null,

				backType: null,

				tile_u: null,
				tile_no: null,

				//obj_oS: null,// => spritePackage
				obj_l0: null,
				obj_l1: null,
				obj_l2: null,

				isLoadingPackage: false,

				onlyShowLoaded: true,
			};
		},
		computed: {
			packageList: function () {
				const packages = this.spriteData[this.spriteType];
				if (packages) {
					let list = this.makeList(packages);
					if (this.onlyShowLoaded) {
						list = list.filter((name) => {
							return packages[name] && packages[name].__ob__ && Object.keys(packages[name]).length;
						});
					}
					return list;
				}
			},
		},
		methods: {
			getImgSrc: function (path) {
				return $get.imageUrl(path);
			},
			makeList: function (obj) {
				if (!obj) {
					return [];
				}

				return Object.keys(obj).sort(new Intl.Collator(navigator.language, {
					numeric: true,
				}).compare);
			},
			refresh: function () {
				//$ResourceManager.archive[""].Map.Tile.allblackTile == $map_sprite.Tile.allblackTile;//true

				this.$set(this.spriteData, "Obj", $ResourceManager.archive[""].Map.Obj);
				this.$set(this.spriteData, "Tile", $ResourceManager.archive[""].Map.Tile);
				this.$set(this.spriteData, "Back", $ResourceManager.archive[""].Map.Back);
			},
			loadPackage: async function () {
				const pack = this.spriteData[this.spriteType][this.spritePackage];
				if (!pack) {
					this.isLoadingPackage = true;
					{
						await $get.data(["/Map", this.spriteType, this.spritePackage].join("/"));

						this.refresh();
					}
					this.isLoadingPackage = false;
				}
			},
			//isLoaded: function () {
			//},
			_onClick: async function (evt, path) {
				//const paths = [this.spriteType, this.spritePackage];

				const editor_selected_object = window.m_selected_object;

				this.isLoadingPackage = true;
				{
					//if (editor_selected_object.isMapObject) {
					//	editor_selected_object._load_texture_by_path(oS, l0, l1, l2);
					//}
					//else if (editor_selected_object.isMapTile) {
					//	editor_selected_object._load_texture_by_path(tS, u, no);
					//}
					await editor_selected_object._load_texture_by_path(...path.slice(1));
				}
				this.isLoadingPackage = false;

				this.$emit("click", evt, path);
			},
			showPreview: async function (event, imgData) {
				const smallTip = this.$root.$refs.smallTip;
				const target = event.target;
				const src = this.getImgSrc(imgData[""]);

				const [maxWidth, maxHeight] = [
					Math.max((window.innerWidth - event.pageX), window.innerWidth >>> 1),
					Math.max((window.innerHeight - event.pageY), window.innerHeight >>> 1),
				];
				const [sScaleX, sScaleY] = [
					imgData.__w > maxWidth ? (maxWidth / imgData.__w * 100) : 100,
					imgData.__h > maxHeight ? (maxHeight / imgData.__h * 100) : 100,
				];
				const sScale = Math.min(sScaleX, sScaleY).toFixed(0);

				smallTip.setContentHtml(`<div style="text-align: center;"><div>[${sScale}%]</div><img src="${src}" style="max-width: ${maxWidth}px; max-height: ${maxHeight}px;" /></div>`);
				smallTip.$position({
					my: "left top",
					at: "right top",
					of: target,
					collision: "flip fit",
				});
				smallTip.show();
			},
			hidePreview: function () {
				const smallTip = this.$root.$refs.smallTip;
				smallTip.hide();
			},
		},
		mounted: async function () {
			this.isLoadingPackage = true;
			{
				this.spriteData = await $get.data("/Map");
			}
			this.isLoadingPackage = false;
		},
		beforeDestroy: function () {
			const smallTip = this.$root.$refs.smallTip;
			smallTip.hide();
			this.isLoadingPackage = false;
		},
	};
</script>

<style scoped>
	.fill {
		width: 100%;
		height: 100%;
	}

	.hover-border-blue {
		border: 1px solid transparent;
	}

		.hover-border-blue:hover {
			border: 1px solid blue;
		}

	.hover-border-green {
		border: 1px solid transparent;
	}
		.hover-border-green:hover {
			border: 1px solid green;
		}

	.hover-border-red {
		border: 1px solid transparent;
	}
		.hover-border-red:hover {
			border: 1px solid red;
		}

	.icon-frame {
		display: inline-block;
		margin: 1px;
		padding: 1px;
		border: 1px solid black;
	}
		.icon-frame:hover {
			border: 1px solid red;
			box-shadow: 0 0 10px 0 red;
		}

	.small-icon {
		width: auto;
		height: auto;
		max-width: 48px;
		max-height: 48px;
	}
	/*.icon-frame .small-icon:hover {
		max-width: unset;
		max-height: unset;
	}*/

	.center-text {
		text-align: center;
	}
</style>
