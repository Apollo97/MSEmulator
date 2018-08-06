<template>
	<window-base>
		<template slot="content">
			<div :style="wndStyle">
				<gui-root ref="gui_root" p="UI/UIWindow2/Item">
					<!--begin back-->
					<template>
						<div v-if="isCollapsed">
							<gui-texture-s p="backgrnd"></gui-texture-s>
							<gui-texture-s p="backgrnd2"></gui-texture-s>
							<gui-texture-s p="backgrnd3"></gui-texture-s>
							<gui-frame-s p="backgrnd" class="header"></gui-frame-s><!--draggable capsule-->
							<gui-frame-s p="backgrnd2"></gui-frame-s><!--not drag-->
						</div>
						<div v-else>
							<gui-texture-s p="FullBackgrnd"></gui-texture-s>
							<gui-texture-s p="FullBackgrnd2"></gui-texture-s>
							<gui-texture-s p="FullBackgrnd3"></gui-texture-s>
							<gui-frame-s p="FullBackgrnd" class="header"></gui-frame-s><!--draggable capsule-->
							<gui-frame-s p="FullBackgrnd2"></gui-frame-s><!--not drag-->
						</div>
					</template>
					<!--end back-->
					<!--begin tabs-->
					<template v-if="guiData">
						<template v-if="typeList.indexOf(sType)>=0">
							<gui-texture-s :p="'Tab/enabled/'+typeList.indexOf(sType)"></gui-texture-s>
						</template>
						<template v-for="(tab, idx) in guiData.Tab.disabled">
							<template v-if="typeList[idx]!=sType">
								<gui-texture-s :p="'Tab/disabled/'+idx" @click="sType=typeList[idx]" class="ui-clickable"></gui-texture-s>
							</template>
						</template>
					</template>
					<!--end tabs-->
				</gui-root>

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
			<gui-root p="UI/CashShop/CSLockerNew/Normal">
				<div @mouseout.self="closeMenu($event)"
					 @contextmenu.prevent=""
					 :style="menu_style" class="slot-menu"
					 >
					<gui-texture p="backgrnd"></gui-texture>
					<gui-button-s p="BtRebate" class="Bt BtRebate" :enabled="false"></gui-button-s>
					<gui-button-s p="BtDelete" class="Bt BtDelete" @click="removeItem"></gui-button-s>
				</div>
			</gui-root>
		</template>
	</window-base>
</template>

<script>
	import { ItemCategoryInfo } from "../../../public/resource.js";
	import { ItemBase, ItemSlot } from "../../game/Item.js";
	import WindowBase from "./WindowBase.vue";
	import BasicComponent from "../BasicComponent.vue";
	import UISlotItem from "../Basic/UISlotItem.vue";
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
				guiData: null,
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
		mounted: async function () {
			this.guiData = await this.$refs.gui_root._$promise;

			if (this.isCollapsed) {
				this.wndStyle["width"] = this.guiData.backgrnd.__w + "px";
				this.wndStyle["height"] = this.guiData.backgrnd.__h + "px";
			}
			else {
				this.wndStyle["width"] = this.guiData.FullBackgrnd.__w + "px";
				this.wndStyle["height"] = this.guiData.FullBackgrnd.__h + "px";
			}
		},
		components: {
			"window-base": WindowBase,
			"ui-slot-item": UISlotItem,
			"ui-v-scrollbar": UIVScrollbar,
		},
		mixins: [BasicComponent]
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
		left: 0px;
		top: 0px;
		width: 61px;
		height: 16px;
	}

	.BtDelete {
		position: absolute;
		left: 0px;
		top: 0px;
		width: 61px;
		height: 16px;
	}
</style>
