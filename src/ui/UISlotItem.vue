<template>
	<div draggable="true"
		 :style="getSlotStyle(itemSlot.slot)"
		 @dragstart="drag($event, itemSlot)"
		 @dragover="allowDrop($event, itemSlot.slot)"
		 @drop="drop($event, itemSlot.slot)"
		 @mousedown="onPickItem($event, itemSlot)"
		 @dblclick="onUseItem($event, itemSlot)"
		 @mousemove="onHoverItem($event, itemSlot.data._raw.info)"
		 @mouseleave="onMouseleaveItem($event, itemSlot.data._raw.info)"
		 >
		<img :src="getItemIconUrl(itemSlot)" :style="getItemIconStyle(itemSlot)" />
		<span class="wnd-item-sn">{{itemSlot.SN}}</span>
	</div>
</template>

<script>
	import { ItemCategoryInfo } from "../../public/resource.js";
	import { ItemBase, ItemSlot } from "../game/Item.js";


	const SLOT_START_POS_X = 10;
	const SLOT_START_POS_Y = 50;

	const SLOT_SIZE_WIDTH = 32;
	const SLOT_SIZE_HEIGHT = 32;

	const SLOT_BORDER_WIDTH = 4;
	const SLOT_BORDER_HEIGHT = 4;


	export default {
		props: {
			"itemSlot": {
				required: true,
			},
			"slots": {
				required: true,
			},
		},
		methods: {
			drag(ev, itemSlot) {
				ev.dataTransfer.setData("text/x-item", JSON.stringify(itemSlot));
			},
			allowDrop(ev, slot) {
				if ([...ev.dataTransfer.types].includes("text/x-item")) {
					ev.preventDefault();//allow drop
				}
			},
			drop(ev, toSlot) {
				ev.preventDefault();//allow drop

				let _itemSlot = ItemSlot.parse(ev.dataTransfer.getData("text/x-item"));
				let itemSlot = this.slots[_itemSlot.slot];
				let dragSlot = itemSlot.slot;
			
				{//TODO: this.chara.moveItemToSlot(dragSlot, toSlot);
					let targetSlot = this.slots[toSlot];
					if (targetSlot) {
						targetSlot.slot = dragSlot;
					}
					itemSlot.slot = toSlot;

					this.$set(this.slots, itemSlot.slot, itemSlot);
					if (targetSlot) {
						this.$set(this.slots, targetSlot.slot, targetSlot);
					}
					else {
						this.slots[dragSlot] = null;
					}
				}
			},
			onPickItem(event, itemSlot) {
				this.onMouseleaveItem(event, itemSlot.data._raw.info);
				this.$emit('pickItem', {
					event: event,
					itemSlot: itemSlot,
				});
			},
			onUseItem(event, itemSlot) {
				this.onMouseleaveItem(event, itemSlot.data._raw.info);
				this.$emit('useItem', {
					event: event,
					itemSlot: itemSlot,
				});
			},
			onHoverItem(event, equipInfo) {
				if (event.buttons) {
					this.onMouseleaveItem(event, equipInfo);
				}
				else {
					this.$emit('hoverItem', {
						event: event,
						equip: equipInfo,
					});
				}
			},
			onMouseleaveItem(event, equipInfo) {
				this.$emit('mouseleaveItem', {
					event: event,
					equip: equipInfo,
				});
			},
			getSlotStyle: /** @param {number} itemIndex */function (itemIndex) {
				let x = Math.trunc(itemIndex % 4);
				let y = Math.trunc(itemIndex / 4);
				return {
					//border: "1px solid #F89",//debug
					position: "absolute",
					left: SLOT_START_POS_X + (SLOT_BORDER_WIDTH + SLOT_SIZE_WIDTH) * x + "px",
					top: SLOT_START_POS_Y + (SLOT_BORDER_HEIGHT + SLOT_SIZE_HEIGHT) * y + "px",
					width: SLOT_SIZE_WIDTH + "px",
					height: SLOT_SIZE_HEIGHT + "px",
				};
			},
			getItemIconUrl: /** @param {ItemSlot} itemSlot */function (itemSlot) {
				/** @type {ItemBase} */
				let itemData = itemSlot.data;

				return ItemCategoryInfo.getIconUrl(itemData.id);
			},
			getItemIconStyle: /** @param {ItemSlot} itemSlot */function (itemSlot) {
				/** @type {ItemBase} */
				let itemData = itemSlot.data;
				let size = itemData._raw.info.icon;

				return {
					position: "absolute",
					left: ((SLOT_SIZE_WIDTH - size.__w) / 2) + "px",
					top: ((SLOT_SIZE_HEIGHT - size.__h) / 2) + "px",
				};
			},
		},
	};
</script>

<style scope>
	.wnd-item-sn {
		display: none;
		position: absolute;
		right: 0;
		bottom: 0;
		color: #133;
	}
</style>
