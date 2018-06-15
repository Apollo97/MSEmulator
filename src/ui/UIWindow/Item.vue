<template>
	<window-base>
		<template v-if="raw" slot="content">
			<div :style="wndStyle">
				<!--begin back-->
				<template>
					<div v-if="isCollapsed">
						<img :style="{left: -raw.backgrnd.origin.x+'px', top: -raw.backgrnd.origin.y+'px'}" src="/images/UI/UIWindow2.img/Item/backgrnd" />
						<img :style="{position: 'absolute', left: -raw.backgrnd2.origin.x+'px', top: -raw.backgrnd2.origin.y+'px'}" src="/images/UI/UIWindow2.img/Item/backgrnd2" />
						<img :style="{position: 'absolute', left: -raw.backgrnd3.origin.x+'px', top: -raw.backgrnd3.origin.y+'px'}" src="/images/UI/UIWindow2.img/Item/backgrnd3" />
						<div :style="{position: 'absolute', left: -raw.backgrnd.origin.x+'px', top: -raw.backgrnd.origin.y+'px', width: raw.backgrnd.__w+'px', height: raw.backgrnd.__h+'px'}" class="header"></div><!--draggable capsule-->
						<div :style="{position: 'absolute', left: -raw.backgrnd2.origin.x+'px', top: -raw.backgrnd2.origin.y+'px', width: raw.backgrnd2.__w+'px', height: raw.backgrnd2.__h+'px'}"></div><!--not drag-->
					</div>
					<div v-else>
						<img :style="{left: -raw.FullBackgrnd.origin.x+'px', top: -raw.FullBackgrnd.origin.y+'px'}" src="/images/UI/UIWindow2.img/Item/FullBackgrnd" />
						<img :style="{position: 'absolute', left: -raw.FullBackgrnd2.origin.x+'px', top: -raw.FullBackgrnd2.origin.y+'px'}" src="/images/UI/UIWindow2.img/Item/FullBackgrnd2" />
						<img :style="{position: 'absolute', left: -raw.FullBackgrnd3.origin.x+'px', top: -raw.FullBackgrnd3.origin.y+'px'}" src="/images/UI/UIWindow2.img/Item/FullBackgrnd3" />
						<div :style="{position: 'absolute', left: -raw.FullBackgrnd.origin.x+'px', top: -raw.FullBackgrnd.origin.y+'px', width: raw.FullBackgrnd.__w+'px', height: raw.FullBackgrnd.__h+'px'}" class="header"></div><!--draggable capsule-->
						<div :style="{position: 'absolute', left: -raw.FullBackgrnd2.origin.x+'px', top: -raw.FullBackgrnd2.origin.y+'px', width: raw.FullBackgrnd2.__w+'px', height: raw.FullBackgrnd2.__h+'px'}"></div><!--not drag-->
					</div>
				</template>
				<!--end back-->
				<!--begin tabs-->
				<div>
					<template v-if="typeList.indexOf(sType)>=0">
						<img :style="{position: 'absolute', left: -raw.Tab.enabled[typeList.indexOf(sType)].origin.x+'px', top: -raw.Tab.enabled[typeList.indexOf(sType)].origin.y+'px'}" :src="'/images/UI/UIWindow2.img/Item/Tab/enabled/'+typeList.indexOf(sType)" />
					</template>
					<template v-for="(tab, idx) in raw.Tab.disabled">
						<template v-if="typeList[idx]!=sType">
							<img @click="sType=typeList[idx]" :style="{position: 'absolute', left: -tab.origin.x+'px', top: -tab.origin.y+'px'}" :src="'/images/UI/UIWindow2.img/Item/Tab/disabled/'+idx" class="ui-clickable" />
						</template>
					</template>
				</div>
				<!--end tabs-->

				<div class="slots-viewport" :style="pageStyle">
					<!-- viewport: 4 * 24 -->
					<div ref="slots_panel" class="slots-container">
						<!--begin itemSlot-->
						<div>
							<template v-for="i in 128">
								<div :style="getSlotStyle(i-1)" @dragover="allowDrop($event, i-1)" @drop="drop($event, i-1)">
									<span class="wnd-item-slot-num">{{(i-1)}}</span>
								</div>
							</template>
						</div>
						<!--end itemSlot-->
						<!--begin itemList-->
						<div v-if="chara && chara.items" :style="slotsPanelStyle">
							<template v-for="itemSlot in chara.items[sType].filter(a=>!!a)">
								<template v-if="itemSlot.data">
									<ui-slot-item :itemSlot="itemSlot"
												  :slots="slots"
												  @pickItem="onPickItem"
												  @useItem="onUseItem"
												  @hoverItem="onHoverItem"
												  @mouseleaveItem="onMouseleaveItem"
												  @showMenu="showMenu">
									</ui-slot-item>
								</template>
							</template>
						</div>
						<!--end itemList-->
					</div>
					<ui-v-scrollbar :target="$refs.slots_panel" :step="scrollStep"></ui-v-scrollbar>
				</div>
			</div>
		</template>
		<template slot="footer" v-if="is_show_menu">
			<div @mouseout.self="closeMenu($event)"
				 @contextmenu.prevent=""
				 :style="menu_style" class="slot-menu"
				 >
				<img src="/images/UI/CashShop.img/CSLockerNew/Normal/backgrnd" />
				<button class="Bt BtRebate" disabled></button>
				<button class="Bt BtDelete" @click="removeItem"></button>
			</div>
		</template>
	</window-base>
</template>

<script>
	import { ItemCategoryInfo } from "../../../public/resource.js";
	import { ItemBase, ItemSlot } from "../../game/Item.js";
	import WindowBase from "./WindowBase.vue";
	import UISlotItem from "../UISlotItem.vue";
	import UIVScrollbar from "../Basic/VScrollbar.vue";


	const VSCROLLBAR_WIDTH = 11;

	const SLOT_START_POS_X = 10;
	const SLOT_START_POS_Y = 50;

	const SLOT_SIZE_WIDTH = 32;
	const SLOT_SIZE_HEIGHT = 32;

	const SLOT_BORDER_WIDTH = 4;
	const SLOT_BORDER_HEIGHT = 4;

	const PAGE_WIDTH = SLOT_SIZE_WIDTH * 4 + SLOT_BORDER_WIDTH * 3;
	const PAGE_HEIGHT = SLOT_SIZE_HEIGHT * 6 + SLOT_BORDER_HEIGHT * 5;

	const SLOTS_PANEL_HEIGHT = SLOT_SIZE_HEIGHT * 32 + SLOT_BORDER_HEIGHT * 31;

	export default {
		name: "item-slot",
		props: {
			"chara": {//this.chara === this.$store.state.chara
				required: true,
			},
		},
		data: function () {
			return {
				raw: null,
				isCollapsed: true,
				sType: 0,
				typeList: [0, 1, 2, 3, 4],
				typeNameList: ["裝備", "消耗", "其他", "裝飾", "特殊"],
				wndStyle: {
					width: 0,
					height: 0,
				},
				pageStyle: {
					position: "absolute",
					left: SLOT_START_POS_X + "px",
					top: SLOT_START_POS_Y + "px",
					width: (PAGE_WIDTH + VSCROLLBAR_WIDTH + 2) + "px",
					height: PAGE_HEIGHT + "px",
				},
				slotsPanelStyle: {
					width: PAGE_WIDTH + "px",
					height: SLOTS_PANEL_HEIGHT + "px",
				},
				scrollStep: SLOT_SIZE_HEIGHT + SLOT_BORDER_HEIGHT,
				is_show_menu: false,
				menu_style: {
					position: "fixed",
					left: "0px",
					top: "0px",
				},
				current_slotItem: null,
			};
		},
		computed: {
			slots: function () {
				return this.chara.items[this.sType];
			},
		},
		methods: {
			async loadData() {
				this.raw = JSON.parse(await $get.data("/UI/UIWindow2.img/Item"));

				if (this.isCollapsed) {
					this.wndStyle["width"] = this.raw.backgrnd.__w + "px";
					this.wndStyle["height"] = this.raw.backgrnd.__h + "px";
				}
				else {
					this.wndStyle["width"] = this.raw.FullBackgrnd.__w + "px";
					this.wndStyle["height"] = this.raw.FullBackgrnd.__h + "px";
				}
			},
			/**
			 * @param {MouseEvent} event
			 * @param {ItemSlot} itemSlot
			 */
			showMenu: function (event, itemSlot) {
				this.current_slotItem = itemSlot;

				this.menu_style.left = event.clientX + "px";
				this.menu_style.top = (event.clientY - 18) + "px";

				this.is_show_menu = true;

				let handler = this.closeMenu.bind(this);

				window.addEventListener("click", handler, {
					once: true,
					passive: true,
					capture: true
				});
			},
			closeMenu: function (event) {
				this.is_show_menu = false;
				//this.current_slotItem = null;
			},
			removeItem: function () {
				this.chara.removeItem(this.sType, this.current_slotItem.slot);
			},
			allowDrop: function (ev, slot) {
				return UISlotItem.methods.allowDrop.call(this, ev, slot);
			},
			drop: function (ev, toSlot) {
				return UISlotItem.methods.drop.call(this, ev, toSlot);
			},
			/**
			 * @param {number} itemIndex
			 */
			getSlotStyle: function (itemIndex) {
				return UISlotItem.methods.getSlotStyle.call(this, itemIndex);
			},
			onPickItem: function () {
				//TODO: mouse pickItem
				return this.$emit('pickItem', ...arguments);
			},
			/**
			 * 未完成
			 * @param {{ event: MouseEvent, itemSlot: ItemSlot }} _ref
			 */
			onUseItem: function (_ref) {
				let event = _ref.event;
				let itemSlot = _ref.itemSlot;

				const itemId = itemSlot.data.id;

				if (ItemCategoryInfo.isCashWeapon(itemId) == 170) {
					//TODO: 沒有設定職業，無法使用點裝武器
					let itemInfo = itemSlot.data._raw.info;
					console.groupCollapsed("沒有設定職業，無法使用點裝武器");
					console.log("click cash weapon: [%s] %s %o", itemInfo.id, itemInfo.name, itemInfo);
					console.groupEnd();
				}
				else {
					//if (this.chara.renderer.unuse(itemId)) {//???
						this.chara.useItem(itemId);
					//}
					return this.$emit('useItem', { event, itemSlot });
				}
			},
			onHoverItem: function () {
				return this.$emit('hoverItem', ...arguments);
			},
			onMouseleaveItem: function () {
				return this.$emit('mouseleaveItem', ...arguments);
			},
		},
		mounted: function () {
			this.loadData();
		},
		components: {
			"window-base": WindowBase,
			"ui-slot-item": UISlotItem,
			"ui-v-scrollbar": UIVScrollbar,
		}
	}
</script>

<style scoped>
	.wnd-item-slot-num {
		color: gray;
	}

	.slots-viewport {
		position: absolute;
		left: 0;
		top: 0;
		overflow: hidden;
	}

	.slots-container {
		width: 100%;
		height: 100%;
		overflow-y: scroll;
		box-sizing: content-box;
		padding-right: 11px;
		position: absolute;
	}

	.slot-menu {
		width: 80px;
		height: 48px;
	}

	.Bt {
		outline: none;
		border: none;
	}

	.BtRebate {
		position: absolute;
		left: 11px;
		top: 8px;
		width: 61px;
		height: 16px;
		background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtRebate/normal/0);
	}

		.BtRebate:hover {
			background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtRebate/mouseOver/0);
		}

		.BtRebate:active {
			background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtRebate/pressed/0);
		}

		.BtRebate:disabled {
			background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtRebate/disabled/0);
		}

	.BtDelete {
		position: absolute;
		left: 11px;
		top: 24px;
		width: 61px;
		height: 16px;
		background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtDelete/normal/0);
	}

		.BtDelete:hover {
			background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtDelete/mouseOver/0);
		}

		.BtDelete:active {
			background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtDelete/pressed/0);
		}

		.BtDelete:disabled {
			background: url(/images/UI/CashShop.img/CSLockerNew/Normal/BtDelete/disabled/0);
		}
</style>
