
<template>
	<component :is="tag">
		<slot v-for="(item, index) in items" :item="item" :index="index"></slot>
	</component>
</template>

<script>
	export default {
		props: {
			items: {
				required: true,
				type: Array,
			},
			options: {
				default: function () {
					return {
						//handle: "p",
						cancel: ".ui-no-interactions",
						axis: "y",
					};
				},
			},
			tag: {
				default: "ul"
			},
		},
		//render: function (createElement) {
		//	let es = [];
		//	let render = this.render;
		//	if (render && this.order) {
		//		for (let i = 0; i < this.order.length; ++i) {
		//			this.i = i;
		//			es.push(render.apply(this, arguments));
		//		}
		//	}
		//	return createElement("ul", es);
		//},
		methods: {
			getValue: function () {
				let order = $(this.$el).sortable("toArray");
				if (order.length != this.items.length) {
					throw new Error("Can't get value before update.");
				}
				
				let item_map = {};
				for (let i = 0; i < this.items.length; ++i) {
					const item = this.items[i];
					item_map[item.id] = item;
				}
				
				let new_list = [];
				
				for (let i = 0; i < order.length; ++i) {
					new_list[i] = item_map[order[i]];
				}
				
				this.$emit('update:items', new_list);	//output value by async
				this.$emit('input', new_list);			//output value by event
			}
		},
		mounted: function () {
			const $$el = $(this.$el);
			const options = Object.assign({
				update: this.getValue.bind(this)
			}, this.options);
			$$el.sortable(options);
			$$el.disableSelection();
		},
		beforeUpdate: function () {
			this.$nextTick(function () {//replace item from vue-component(<slot>) to jquery-ui-component($(this.$el))
				if (!this.items) {
					return;
				}
				let $$el = $(this.$el);
				let el = [];
				for (let i = 0; i < this.items.length; ++i) {
					const item = this.items[i];
					const id = item.id;
					let em = el[i] = $("#" + id);
					em.remove();
				}
				for (let i = 0; i < el.length; ++i) {
					$$el.append(el);
				}
				$$el.sortable();
			});
		},
		updated: function () {
			$(this.$el).sortable();//make sortable
		},
		watch: {
			items: function (newValue) {
				//$(this.$el).sortable();//make sortable
			}
		},
	}
</script>

<style>

</style>
