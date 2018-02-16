
<template>
	<div v-if="chara != null" class="frame">
		<div class="center">
			<template v-for="ft in frag_list">
				<img :src="get_ft_src(ft)"
					 :class="ft.classList"
					 :style="get_ft_style(ft)" />
			</template>
		</div>
	</div>
</template>

<script>
	import Vue from 'vue';

	//class ItemCharacter {
	//	constructor() {
	//		this.type = "";
	//	}
	//
	//	static Type = {
	//		map: "map",
	//		character: "character"
	//	}
	//}

	/*
	<ui-dialog title="Characters">
		<ui-sortable :items="charas" @input="ch">
			<template scope="{item}">
				<li :id="item.id">
					<ui-character :chara="item"></ui-character>
				</li>
			</template>
		</ui-sortable>
	</ui-dialog>
	*/

	/*
	chara = {
		id: <unique>
		html: <element>
	}
	*/


	/*
		mounted: function () {
		},

		updated: function () {
		},

		methods: {
		}

		//directives: {
		//	'resource': function(el, binding) {
		//	}
		//}
		//render: function (createElement) {
		//	return createElement(
		//		"div", {
		//		},
		//		//this.$slots.default
		//	)
		//},
	*/

	export default {
		props: ['chara'],
		computed: {
			frag_list: {
				get: function () {
					const chara = this.chara;
					let arr = [];

					chara.__forceUpdate();

					for (let i in this.chara.__frag_list) {
						let ft = this.chara.__frag_list[i];
						if (ft.texture) {
							arr.push(ft);
							if (ft.graph2 && ft.graph2.texture) arr.push(ft.graph2);
							if (ft.graph3 && ft.graph3.texture) arr.push(ft.graph3);
						}
					}
					return arr;
				},
				set: function (newVal) {
				}
			}
		},
		methods: {
			get_ft_src: function (ft) {
				return ft.texture.src;
			},
			get_ft_style: function (ft) {
				let style = {
					left: ft.relative.x + 'px',
					top: ft.relative.y + 'px',
					opacity: ft.opacity,
					width: ft.width + 'px',
					height: ft.height + 'px',
					filter: ft.filter.toString(),
				};

				return style;
			},
		//	getInnerHTML: function () {
		//		return this.getInner().innerHTML;
		//	},
		//	getInner: function () {
		//		let chara = this.chara;
		//
		//		//force update
		//		chara.update(0);
		//		chara.__update_frag_list();
		//
		//		let elem = chara._toHTML();
		//		if (!elem) {
		//			debugger
		//		}
		//		return elem;
		//	}
		},
		//beforeUpdate: function () {
		//	let vm = this;
		//
		//	this.$nextTick(function () {
		//		vm.$el.appendChild(vm.getInner());
		//	});
		//}
	};
</script>

<style scoped>
	div.frame {
		display: inline-block;
		position: relative;
		width: 64px;
		height: 96px;

		user-select: none;
		background-position: 0px 0px, 10px 10px;
		background-size: 20px 20px;
		background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee 100%),linear-gradient(45deg, #eee 25%, white 25%, white 75%, #eee 75%, #eee 100%);
	}
	div.center {
		position: absolute;
		left: 32px;
		top: 96px;
	}
	img {
		position: absolute;
	}
</style>
