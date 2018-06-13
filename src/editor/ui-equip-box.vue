
<template>
	<ui-draggable class="ui-dialog ui-equip-box" :zIndex="zIndex" :position="position">
		<div v-if="minimum" @mousedown.left="requireOrder($event)" class="header" :style="header_style">
			Equip box
			<div class="header-buttons">
				<button @click="minimum=!minimum"
						class="header-button">
							<span class="ui-icon ui-icon-plus"></span>
						</button>
			</div>
		</div>
		<div v-else @mousedown.left="requireOrder($event)" class="header btn-group" :style="header_style">
			<div class="header" style="text-align: left;">
				Equip box
				<div class="header-buttons">
					<button @click="minimum=!minimum"
							class="header-button"
							>
								<span class="ui-icon ui-icon-minus"></span>
							</button>
				</div>
			</div>

			<div>
				<div v-once style="display: inline-flex; width: 100%;">
					<select v-model="selected_category" style="flex: 1;">
						<option v-for="cat in categoryList" :value="cat.value">{{cat.key}}</option>
					</select>
					<input ref="input_search" type="search" v-model="search_text" @keydown.enter="searchNextText" list="search_param" />
					<datalist id="search_param">
						<option value="劍">item Name</option>
						<option value="01302000">item ID</option>
						<option value="<attr>:/<regexp>/"></option>
						<option value="$style:/21158/">face, hair</option>
						<option value="$foreign:/true/">external resource</option>
						<option :value="'__v:/'+DATA_TAG_VERSION+'/'">current version</option>
					</datalist>
					<div style="position: relative; display: inline-block;">
						<button v-ui:show.mouseenter="200" v-ui:hide.mouseleave="200" v-ui:ref="'setting'" style="padding: 0;">
							<span class="ui-icon ui-icon-gear"></span>
						</button>
						<div v-ui:hide v-ui:show.mouseenter="200" v-ui:hide.mouseleave="200" v-ui:ref="'setting'" ref="setting"
							 style="position: absolute; left: 0; top: 0; background: #e9e9e9; border: 1px solid #ddd; width: 12em; text-align:left; padding: 0.25em 0.5em;">
							<div><label><input type="checkbox" v-model="onlyShowSearchResult" />Only show result of search</label></div>
							<div><label><input type="checkbox" v-model="displayMode" />display: {{displayMode ? "plain":"list"}}</label></div>
						</div>
					</div>
				</div>
			</div>

			<div class="button-area" style="background: lightgray;">
				<ui-button-group type="checkbox" :buttons="filter_buttons" :active.sync="filters" class="filters">
					<template slot-scope="{text, value}">
						<img :src="`images/toolstrip_${value}.png`" :alt="text" />
					</template>
				</ui-button-group>

				<ui-button-group v-if="_is_category_face()" type="radio" :buttons="face_color_buttons" :active.sync="face_color" class="face_color">
					<template slot-scope="{text, value}">
						<span :value="value" :title="`${value}. ${text}色臉型`" :style="{background: '#'+value}">{{text}}</span>
					</template>
				</ui-button-group>

				<template v-if="_is_category_hair()">
					<ui-button-group type="radio" :buttons="hair_color_buttons" :active.sync="hair_color" class="hair_color">
						<template slot-scope="{text, value}">
							<span :value="value" :title="`${value}. ${text}色髮型 (${value})`" :style="{background: '#'+value}">{{text}}</span>
						</template>
					</ui-button-group>
					<table class="hair_color" style="font-family: monospace; text-shadow: 0 0 5px white; border-spacing: 1px;">
						<tr>
							<td :style="getHairMixColor1CSS()"><span style="width: 3em; display: inline-block;">{{String(100-hair_mix2)}}%</span></td>
							<td style="width: 100%;"><input type="range" min="0" max="100" step="1" v-model.number="hair_mix2" style="width: 100%;" /></td>
							<td :style="getHairMixColor2CSS()"><span style="width: 3em; display: inline-block;">{{String(hair_mix2)}}%</span></td>
						</tr>
					</table>
					<ui-button-group type="radio" :buttons="hair_color_buttons" :active.sync="hair_color2" class="hair_color">
						<template slot-scope="{text, value}">
							<span :value="value" :title="`${value}. ${text}色髮型 (${value})`" :style="{background: '#'+value}">{{text}}</span>
						</template>
					</ui-button-group>
				</template>
			</div>

			<div v-if="__count_of_item_in_page > 0" class="header pagination top">
				<template v-for="i in __count_of_page">
					<a v-if="page == (i-1)" :title="i - 1" class="active">{{i}}</a>
					<a v-else @click.prevent="change_page(i - 1)" :title="i - 1" href="#">{{i}}</a>
				</template>
			</div>
		</div>

		<div ref="content" @mousedown.left="requireOrder($event)" :style="content_style" class="content">
			<template v-if="__count_of_item_in_page > 0">
				<template v-if="displayMode==false">
					<ul class="item-list" style="width: calc(6*48px);">
						<template v-for="i in __count_of_item_in_page">
							<li :key="__get_item_id(i - 1)"
								:id="'item' + __get_item_id(i - 1)"
								@click.left="clickItem($event,i-1)"
								@mousemove="hoverItem($event,i-1)"
								@mouseleave="mouseleaveItem($event,i-1)"
								class="list-item"
								>
								<table @contextmenu.prevent class="item-detail">
									<tr>
										<td rowspan="2" class="item-icon-outer-frame">
											<div @mousedown.right="copyImageUrl($event, __get_item_id(i - 1))" class="item-icon-frame">
												<img :src="__get_item_icon_url(i - 1)" @error="__face_or_hair_img_onerror(i - 1)" />
											</div>
										</td>
										<td @mousedown.right="copyInnerText($event)">
											<div class="item-name" :style="__get_item(i - 1).$foreign?'color: red':''">{{__get_item_name(i - 1)}}</div>
										</td>
									</tr>
									<tr>
										<td @mousedown.right="copyInnerText($event)" class="item-id">{{__get_item_id(i - 1)}}</td>
									</tr>
								</table>
							</li>
						</template>
					</ul>
				</template>
				<template v-else>
					<div class="item-list-sm" :style="{width: `calc(${column_count + 1}*48px)`}">
						<template v-for="i in __count_of_item_in_page">
							<div @contextmenu.prevent :key="__get_item_id(i - 1)"
								 :id="'item' + __get_item_id(i - 1)"
								 @click.left="clickItem($event,i-1)"
								 @mousemove="hoverItem($event,i-1)"
								 @mouseleave="mouseleaveItem($event,i-1)"
								 class="list-item-sm"
								 >
								<table class="item-detail">
									<tr>
										<td class="item-icon-outer-frame">
											<div @mousedown.right="copyText($event, __get_item_name(i - 1))"
												 @mousedown.middle.prevent="copyText($event, __get_item_id(i - 1))"
												 class="item-icon-frame-sm"
												 >
												<img :src="__get_item_icon_url(i - 1)" @error="__face_or_hair_img_onerror(i - 1)" />
											</div>
										</td>
									</tr>
								</table>
							</div>
						</template>
					</div>
				</template>
			</template>
			<template v-else>
				<div v-pre style="cursor: default;">
					No search item
				</div>
			</template>
		</div>

		<div v-if="!minimum" @mousedown.left="requireOrder($event)" class="footer" :style="header_style">
			<div v-if="!minimum" style="text-align: center;">
				<div v-if="__count_of_item_in_page > 0" class="pagination bottom">
					<template v-for="i in __count_of_page">
						<a v-if="page == (i-1)" :title="i - 1" class="active">{{i}}</a>
						<a v-else @click.prevent="change_page(i - 1)" :title="i - 1" href="#">{{i}}</a>
					</template>
				</div>

				<!--<div style="background: lightgray;">
					<p>selected_category: {{selected_category}}</p>
					<p>search_item: {{search_item}}</p>
					<p>filters: {{filters}}</p>
					<p>face_color: {{face_color}}</p>
					<p>hair_color: {{hair_color}}</p>
				</div>-->
			</div>
		</div>
	</ui-draggable>
</template>

<script>
	import Vuex from 'vuex';

	import UIDraggable from "../components/ui-draggable.vue";
	import UIDialog from "../components/ui-dialog.vue";
	import UIButtonGroup from '../components/ui-button-group.vue';

	import { ItemCategoryInfo, ResourceManager, ItemAttrNormalize, CharacterRenderConfig } from '../../public/resource.js';

	function emSize(socpe) {
		let scopeTest = document.createElement("div");
		scopeTest.style.position = "fixed";
		scopeTest.style.left = "0";
		scopeTest.style.top = "0";
		scopeTest.style.height = "1em";
		scopeTest.style.width = "1em";
		socpe.appendChild(scopeTest);
		let scopeVal = scopeTest.clientHeight;
		document.body.remove(scopeTest);
		return scopeVal;
	};

	let filter_buttons = [
		{ text: "Cash", value: "cash", style: {} },
		{ text: "Standard", value: "standard", style: {} },
		{ text: "Female", value: "female", style: {} },
		{ text: "Male", value: "male", style: {} },
		{ text: "Universal", value: "neutral", style: {} },
		{ text: "Unlimited", value: "unlimited", style: {} },
		{ text: "Beginner", value: "beginner", style: {} },
		{ text: "Warrior", value: "warrior", style: {} },
		{ text: "Magician", value: "magician", style: {} },
		{ text: "Bowman", value: "bowman", style: {} },
		{ text: "Thief", value: "thief", style: {} },
		{ text: "Pirate", value: "pirate", style: {} },
	];

	const face_color_buttons = [
		{ text: "黑", value: "0", style: { background: "#333333" } },
		{ text: "藍", value: "1", style: { background: "#0000ff" } },
		{ text: "紅", value: "2", style: { background: "#ff0000" } },
		{ text: "綠", value: "3", style: { background: "#00ff00" } },
		{ text: "棕", value: "4", style: { background: "#804040" } },
		{ text: "青", value: "5", style: { background: "#00ffc0" } },
		{ text: "紫", value: "6", style: { background: "#8000ff" } },
		{ text: "粉", value: "7", style: { background: "#ff00ff" } },
		{ text: "銀", value: "8", style: { background: "#C0C0C0" } },
	];

	const hair_color_buttons = [
		{ text: "黑", value: "0", style: { background: "#333333" } },
		{ text: "紅", value: "1", style: { background: "#ff0000" } },
		{ text: "橙", value: "2", style: { background: "#ff8040" } },
		{ text: "黃", value: "3", style: { background: "#ffff00" } },
		{ text: "綠", value: "4", style: { background: "#00ff00" } },
		{ text: "藍", value: "5", style: { background: "#0000ff" } },
		{ text: "紫", value: "6", style: { background: "#8000ff" } },
		{ text: "棕", value: "7", style: { background: "#804040" } },
	];

	const face_color_buttons_en = [
		{ text: "Black", value: "0", style: { background: "#111111" } },
		{ text: "Blue", value: "1", style: { background: "#0000ff" } },
		{ text: "Red", value: "2", style: { background: "#ff0000" } },
		{ text: "Green", value: "3", style: { background: "#00ff00" } },
		{ text: "Hazel", value: "4", style: { background: "#804040" } },
		{ text: "Sapphire", value: "5", style: { background: "#00ffc0" } },
		{ text: "Violet", value: "6", style: { background: "#8000ff" } },
		{ text: "Amethyst", value: "7", style: { background: "#ff00ff" } },
		{ text: "White", value: "8", style: { background: "#C0C0C0" } },
	];

	class ItemFilter {
		static cash(item) {
			//return item.cash == 1;
			return item.cash > 0;
		}
		static standard(item) {
			//return item.cash != 1;
			return item.cash == null || item.cash == 0;
		}

		static female(item) {
			return item.gender == 1;
		}
		static male(item) {
			return item.gender == 0;
		}
		static neutral(item) {
			return item.gender == 2;
		}

		static unlimited(item) {
			return item.reqJob == 0 || item.reqJob == null;
		}
		static beginner(item) {
			return item.reqJob == -1;
		}
		static warrior(item) {
			return item.reqJob > 0 && item.reqJob & 1;
		}
		static magician(item) {
			return item.reqJob > 0 && item.reqJob & 2;
		}
		static bowman(item) {
			return item.reqJob > 0 && item.reqJob & 4;
		}
		static thief(item) {
			return item.reqJob > 0 && item.reqJob & 8;
		}
		static pirate(item) {
			return item.reqJob > 0 && item.reqJob & 16;
		}
	}
	ItemFilter.list = [];
	for (let i = 0; i < filter_buttons.length; ++i) {
		let fn = ItemFilter[filter_buttons[i].value];
		ItemFilter.list[i] = fn;
	}

	const config = new (class {
		constructor() {
			this.pageSize = 100;
		}
		calcPage(index) {
			return Math.trunc(index / this.pageSize);
		}
	});

	export default {
		data: function () {
			return {
				//config: config,
				search_text: "",
				search_next: -1,

				column_count: 5,

				loaded_equip_list: [],	// origin list (no filter)
				loaded_category: null,
				equip_list: [],			// view list (final result)
				search_equip_result: [],// only search result

				selected_category: "0000",
				filters: [],
				face_color: 0,
				hair_color: 0,
				hair_color2: 0,
				hair_mix2: 0,

				page: 0,

				face_names: null,
				hair_names: null,

				onlyShowSearchResult: true,
				displayMode: true,
			};
		},
		computed: {
			DATA_TAG_VERSION: () => window.DATA_TAG + window.DATA_VERSION,
			categoryList: () => ItemCategoryInfo._categoryList,
			filter_buttons: () => filter_buttons,
			face_color_buttons: () => face_color_buttons,
			hair_color_buttons: () => hair_color_buttons,
			__count_of_item_in_page: function () {
				const start = this.page * config.pageSize;
				const end = Math.min(start + config.pageSize, this.equip_list.length);
				const count = end - start;

				return Math.min(Math.max(0, count), this.equip_list.length);//return 0 < count < this.equip_list.length
			},
			__count_of_page: function () {
				return Math.ceil(this.equip_list.length / config.pageSize);
			},
		},
		methods: {
			getHairMixColor1CSS() {
				return Object.assign({ "clip-path": "polygon(50% 0%, 0% 20%, 0% 90%, 100% 90%, 100% 20%)" }, hair_color_buttons[this.hair_color].style);
			},
			getHairMixColor2CSS() {
				return Object.assign({ "clip-path": "polygon(0% 10%, 0% 80%, 50% 100%, 100% 80%, 100% 10%)" }, this.hair_color2 != null ? hair_color_buttons[this.hair_color2].style : {});
			},
			copyImageUrl: function (e, id) {
				let img = e.currentTarget.querySelector("img");
				if (img) {
					if (img.src.startsWith("data:image/")) {
						const prefix = this.selected_category;
						const cateinfo = ItemCategoryInfo.get(prefix);
						const path = cateinfo.path;
						let url = `${window.location.origin}/images/Character/${path != "" ? (path + "/" + id) : id}.img/`;

						if (path == "") {
							return;
						}
						if (path == "Face") {
							url += "blink/0/face";
						}
						else if (path == "Hair") {
							url += "stand1/0/hairOverHead";
						}
						else {
							url += "info/iconRaw";
						}
						copyToClipboard(url);
					}
					else {
						copyToClipboard(img.src);
					}
				}
			},
			copyInnerText: function (e) {
				let el = e.currentTarget;
				let text = el.innerText;
				copyToClipboard(text);

				SelectText(el);
			},
			copyText: function (e, text) {
				copyToClipboard(text);
			},
			search_equip: async function (search_text) {
				this.clearSearch();

				if (!search_text || search_text == "") {
					this.search_equip_result = [];
					if (this.onlyShowSearchResult) {
						await this.loadList();
					}
					return;
				}
				else {
					await this.loadList();

					let old_search_equip_result = this.search_equip_result;
					this.search_equip_result = [];

					try {
						let rr = search_text.match(/^(.+):\/(.+)\/$/);

						if (rr) {
							try {
								let attr = rr[1];

								if (attr == "$style" && Number.isSafeInteger(Number(rr[2]))) {
									let si = rr[2];
									if (this._is_category_hair()) {
										let black = CharacterRenderConfig.getColorHairID(String(si), 0);

										this.search_equip_result = this.equip_list.filter(function (item, index) {
											let b1 = item.id == null || CharacterRenderConfig.getColorHairID(item.id, 0);
											if (b1 && b1.indexOf(black) != -1) {
												item.$page = config.calcPage(index);
												return true;
											}
										});
									}
									else if (this._is_category_face()) {
										let black = CharacterRenderConfig.getColorFaceID(String(si), 0);

										this.search_equip_result = this.equip_list.filter(function (item, index) {
											let b1 = item.id == null || CharacterRenderConfig.getColorFaceID(item.id, 0);
											if (b1 && b1.indexOf(black) != -1) {
												item.$page = config.calcPage(index);
												return true;
											}
										});
									}
								}
								if (this.search_equip_result.length == 0) {
									let regexp = RegExp(rr[2]);
									this.search_equip_result = this.equip_list.filter(function (item, index) {
										if (item[attr] != null && regexp.test(item[attr])) {
											item.$page = config.calcPage(index);
											return true;
										}
									});

									if (this.search_equip_result &&
										this.search_equip_result[0] &&
										this.search_equip_result[0][attr] &&
										this.search_equip_result[0][attr].localeCompare
									) {//check attr is can compare
										this.search_equip_result.sort(function (a, b) {
											let sa = a[attr], sb = b[attr];
											return sa.localeCompare(sb);
										});
									}
								}
							}
							catch (ex) {
								this.search_equip_result = [];
								return;
							}
						}
						else {
							this.search_equip_result = this.equip_list.filter(function (item, index) {
								if (item.id && item.id.indexOf(search_text) >= 0 ||
									item.name && (
										item.name.indexOf(search_text) >= 0 ||
										item.name.toLowerCase().indexOf(search_text.toLowerCase()) >= 0
									)
								) {
									item.$page = config.calcPage(index);
									return true;
								}
							});
							this.search_equip_result.sort(function (a, b) {
								if (a.name && b.name) {
									return a.name.localeCompare(b.name);
								}
								return 0;
							});
						}
					}
					catch (ex) {
						this.search_equip_result = old_search_equip_result;
					}
					old_search_equip_result = null;

					if (this.search_equip_result.length) {
						this.searchNextText();
					}
					else {
						console.log("no search: " + search_text);
					}
				}

				if (this.onlyShowSearchResult) {
					this.page = 0;
					this.equip_list = this.search_equip_result;
				}
			},
			searchNextText: function (text) {
				if (this.onlyShowSearchResult) {
					return;
				}
				//if (e.keyCode == 13) {}

				let next = (this.search_next + 1) % this.search_equip_result.length;

				let item = this.search_equip_result[next];

				if (item) {
					const page = item.$page;

					this.change_page(page);

					this.$nextTick(function () {
						window.location.hash = "item" + item.id;

						this.$refs.input_search.focus();

						//console.log({
						//	id: item.id,
						//	name: item.name,
						//	page: page,
						//});
					});
					this.search_next = next;
				}
			},
			clearSearch: function () {
				this.search_next = -1;
				window.location.hash = "";
			},
			change_page: function (page) {
				if (this.page != page) {
					this.$refs.content.scrollTop = 0;
				}
				this.page = page;
				this.clearSearch();
				//console.log("change page: " + page);
			},
			__get_category_slot: function () {
				const cateinfo = ItemCategoryInfo.get(this.selected_category);
				if (cateinfo) {
					return cateinfo.slot;
				}
				return null;
			},
			_is_category_face: function () {
				const slot = this.__get_category_slot();
				return slot == "face";
			},
			_is_category_hair: function () {
				const slot = this.__get_category_slot();
				return slot == "hair";
			},
			__get_color: function () {
				if (this._is_category_face()) {
					return this.face_color;
				}
				else if (this._is_category_hair()) {
					return this.hair_color;
				}
				return "";
			},
			loadList: async function () {
				if (this.selected_category == null) {
					return;
				}
				this.clearSearch();

				const prefix = this.selected_category;
				const cateinfo = ItemCategoryInfo.get(prefix);
				const listPath = cateinfo.listPath || cateinfo.path || cateinfo.slot;

				const coloredPath = listPath + this.__get_color();

				let equip_list = [];

				if (coloredPath != this.loaded_category || this.loaded_equip_list.length == 0) {
					equip_list = JSON.parse(await $get(`/equips/${coloredPath}.json`));
					if (!equip_list || !equip_list.length) {
						alert("? " + coloredPath);
						return;
					}

					await concat_external_resource(coloredPath, equip_list);

					if (cateinfo.slot == "weapon") {
						let cash_weapon = JSON.parse(await $get(`/equips/0170.json`));

						let wt = prefix.slice(2, 4);
						let va = cash_weapon.filter(a => {
							return a.__t.indexOf(wt) >= 0;
						});
						equip_list = equip_list.concat(va);
					}

					equip_list.forEach(ItemAttrNormalize[listPath] || ItemAttrNormalize._equip);
					//
					this.loaded_equip_list = equip_list;
					this.loaded_category = coloredPath;
				}
				else {
					equip_list = [...this.loaded_equip_list];
				}
				//this.equip_list = equip_list;

				if (equip_list.length > 0) {
					let fnFilter = this.__get_filter();
					if (fnFilter) {
						equip_list = equip_list.filter(fnFilter);
					}
				}
				else {
					debugger;
				}
				this.equip_list = equip_list;// for using this.__count_of_page

				if (equip_list.length > 0) {
					const count_of_page = this.__count_of_page;

					if (count_of_page > 0) {
						if (this.page >= count_of_page) {
							this.page = count_of_page - 1;
						}
					}
					else {
						this.page = 0;
					}

					equip_list.sort((a, b) => a.id - b.id);
				}
				else {
					debugger;
				}
				this.equip_list = equip_list;
			},
			__get_filter: function () {
				if (!this.filters.length) {
					return null;
				}
				const list = ItemFilter.list;
				const fnFilters = this.filters.map(function (i) {
					return (a) => !list[i](a);
				});

				if (fnFilters.length) {
					return function (item) {
						return fnFilters.every(function (fn) {
							return fn(item);
						});
						//for (let i = 0; i < fnFilters.length; ++i) {
						//	if (fnFilters[i](item)) {
						//		return false;
						//	}
						//}
						//return true;
					};
				}
				//else {
				//	return () => true;
				//}
			},
			//__get_face_color_filter: function () {
			//},
			//__get_hair_color_filter: function () {
			//},
			__get_item: function (index) {
				const first = this.page * config.pageSize;

				return this.equip_list[first + index];
			},
			__get_item_id: function (index) {
				let item = this.__get_item(index);
				return item.id;
			},
			__get_item_name: function (index) {
				let item = this.__get_item(index);
				return item.name || "[null]";
			},
			__get_item_name_ex: function (index) {
				let item = this.__get_item(index);
				return item._name || "[null]";
			},
			__get_item_icon_url: function (index) {
				let item = this.__get_item(index);
				return item.icon && item.icon[""] ? item.icon[""] : "/images/warning.png";
			},
			__face_or_hair_img_onerror: async function (index) {
				let item = this.__get_item(index);
				if (!item) {
					alert("error: this.__get_item(index)\nindex=" + index);
					debugger;
					return;
				}

				if (item.icon && item.icon[""]) {
					let src = item.icon[""];

					if (src.startsWith("/images/")) {
						let sp = src.split("/");
						let place = sp.splice(sp.length - 1, 1);

						sp[1] = "ls";

						let ls = JSON.parse(await $get(sp.join("/")));

						let next = ls.indexOf(place) + 1;
						if (next < ls.length) {
							place = ls[next];
							sp[1] = "images";
							item.icon[""] = sp.join("/") + "/" + place;
							debugger
							return;
						}
					}
				}
				item.icon[""] = "/images/warning.png";
			},
			clickItem: function (e, num) {
				if (this.selected_category == "0170") {
					let item = this.__get_item(num);
					console.groupCollapsed("沒有設定職業，無法使用點裝武器");
					console.log("click cash weapon: [%s] %s %o", item.id, item.name, item);
					console.groupEnd();
				}
				else {
					let item = this.__get_item(num);

					this.$emit("clickItem", {
						event: e,
						id: item.id,
						category: this.selected_category,
						equip: item,
					});

					console.log("Use equip: [%s] %s %o", item.id, item.name, item);
				}
			},
			hoverItem: function (e, num) {
				let item = this.__get_item(num);

				this.$emit("hoverItem", {
					event: e,
					id: item.id,
					category: this.selected_category,
					equip: item,
				});
			},
			mouseleaveItem: function (e, num) {
				let item = this.__get_item(num);

				this.$emit("mouseleaveItem", {
					event: e,
					id: item.id,
					category: this.selected_category,
					equip: item,
				});
			},
			selected_category_onchange: function (value) {
				if (value == "0002") {
					this.face_color = Number(window.chara.renderer.faceColor);
				}
				else if (value == "0003" || value == "0004") {
					this.hair_color = Number(window.chara.renderer.hairColor);
					if (window.chara.renderer.slots.hairColor2 && window.chara.renderer.slots.hairMix2) {
						this.hair_color2 = Number(window.chara.renderer.slots.hairColor2);
						this.hair_mix2 = Math.trunc(Number(window.chara.renderer.slots.hairMix2) * 100);
					}
				}

				this.search_equip(this.search_text);
			},
		},
		watch: {
			search_text: function (val, oldVal) {
				this.search_equip(val);
			},
			onlyShowSearchResult: async function (val) {
				if (val) {
					this.search_equip(this.search_text);
				}
				else if (this.search_text) {
					await this.loadList();
				}
			},
			selected_category: function (value) {
				this.selected_category_onchange(value);
			},
			filters: async function () {
				//console.log(JSON.stringify(this.filters));
				await this.loadList();
			},
			face_color: async function () {
				//console.log("face: " + /*btn.text + ": " +*/ btn.value);
				this.$emit("faceColor", {
					color: this.face_color
				});
				await this.loadList();
			},
			hair_color: async function () {
				//console.log("hair: " + /*btn.text + ": " +*/ btn.value);
				this.$emit("hairColor", {
					color: this.hair_color
				});
				await this.loadList();
			},
			hair_color2: async function () {
				//console.log("hair: " + /*btn.text + ": " +*/ btn.value);
				this.$emit("hairColor2", {
					color: this.hair_color2,
					mix: this.hair_mix2 / 100
				});
			},
			hair_mix2: async function () {
				//console.log("hair: " + /*btn.text + ": " +*/ btn.value);
				this.$emit("hairMix2", {
					color: this.hair_color2,
					mix: this.hair_mix2 / 100
				});
			},
		},
		mounted: function () {
			this.selected_category = "0000";
			this.selected_category_onchange(this.selected_category);
		},
		directives: {
			focus: {
				inserted: function (el) {
					el.focus();
				}
			}
		},
		components: {
			"ui-draggable": UIDraggable,
			"ui-button-group": UIButtonGroup,
		},
		mixins: [UIDialog]
	};
</script>

<style>
	.ui-equip-box .header {
		text-align: left;
	}
	.ui-equip-box .header.btn-group, .ui-equip-box .header .pagination {
		text-align: center;
	}

	.ui-equip-box .pagination {
		overflow: auto;
	}

	.ui-equip-box .item-list {
		list-style: none;
		margin: auto;
		padding: 1px;
	}
	.ui-equip-box .item-list-sm {
		margin: auto;
		padding: 1px;
		line-height: 0;
		text-align: center;
	}
	.ui-equip-box .item-detail {
		width: 100%;
		border-spacing: 1px;
	}
	.ui-equip-box .list-item, .ui-equip-box .list-item-sm {
		border: 1px solid black;
		border-bottom: none;
		background: linear-gradient(to bottom, rgba(240,249,255,0.9) 0%,rgba(203,235,255,0.9) 30%,rgba(201,234,255,0.9) 50%,rgba(203,235,255,0.9) 70%,rgba(203,235,255,0.9) 70%,rgba(203,235,255,0.9) 75%,rgba(240,249,255,0.9) 100%);
	}
	.ui-equip-box .list-item-sm {
		display: inline-block;
		border: none;
		outline: 1px solid black;
		box-shadow: inset 1px 1px 0 lightblue;
	}
	.ui-equip-box .list-item:target, .ui-equip-box .list-item-sm:target {
		box-shadow: inset 0 0 0 1px red;
		outline: 1px solid red;
		position: relative;
	}
	.ui-equip-box .list-item:last-child {
		border-bottom: 1px solid black;
	}
	.ui-equip-box .list-item:hover, .ui-equip-box .list-item-sm:hover {
		background: aliceblue;
	}
	.ui-equip-box .list-item:active, .ui-equip-box .list-item-sm:active {
		background: lightgray;
	}

	.ui-equip-box .item-name {
		user-select: text;
		width: 12em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.ui-equip-box .list-item:target .item-name {
		color: red;
		font-weight: bold;
	}

	.ui-equip-box .item-id {
		user-select: text;
	}

	.ui-equip-box .item-icon-outer-frame {
		position: relative;
		width: 48px;
		height: 48px;
		user-select: none;
	}

	.ui-equip-box .item-icon-frame > img, .ui-equip-box .item-icon-frame-sm > img {
		max-width: 48px;
		max-height: 48px;
		display: block;
		margin: auto;
	}


	.ui-equip-box .filters button:hover {
		border: 1px solid blue;
		border-radius: 3px;
		background: rgba(240, 249, 255, 0.9);
	}
	.ui-equip-box .filters button:hover, .face_color button:hover, .hair_color button:hover {
		filter: contrast(150%) brightness(110%);
	}
	.ui-equip-box .filters button.active {
		border-radius: 3px;
		background-color: hsl(203, 0%, 70%);
	}
	.ui-equip-box .filters button.active img {
		filter: grayscale(100%) brightness(90%) contrast(150%);
	}
	.ui-equip-box .filters button.active:hover {
		border: 1px solid blue;
		background: rgba(240, 249, 255, 0.9);
	}
	.ui-equip-box .filters button.active:hover {
		filter: contrast(150%) grayscale(100%) brightness(110%);
	}

	.ui-equip-box .face_color, hair_color {
		border: 1px solid transparent;
		text-shadow: 0 0 5px white, 0 0 10px white, 0 0 1px black;
	}
	.ui-equip-box .face_color button.active, .hair_color button.active {
		border: 1px solid white;
		box-shadow: 0 0 0.5em 0 blue, 0 0 1em 0 yellow;
		color: white;
		text-shadow: 0 0 0.1em black, 0 0 0.5em black;
		z-index: 1;
	}

	.ui-equip-box .button-area > * {
		padding-top: 1px;
	}

	.ui-equip-box .button-area {
		user-select: none;
	}

	.ui-equip-box .button-area button {
		text-align: center;
		cursor: pointer;
		border: 1px solid transparent;
		text-shadow: 0 0 5px white, 0 0 10px white, 0 0 1px black;
		font-family: 微軟正黑體;
		font-weight: bold;
		font-size: 1em;
	}

	.ui-equip-box .button-area button > img {
		display: block;
		margin: auto;
	}
</style>
