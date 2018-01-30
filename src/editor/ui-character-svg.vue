
<template>
	<div v-if="chara != null" class="ui-character-frame">
		<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink"
				x="0" y="0" width="64" height="96"
				>
			<g transform="translate(32, 96)">
				<template v-for="ft in frag_list">
					<image :class="ft.classList"
						   :x="ft.relative.x"
						   :y="ft.relative.y"
						   :width="ft.width"
						   :height="ft.height"
						   :opacity="ft.opacity"
						   :xlink:href="get_ft_src(ft)"
						   >
					</image>
				</template>
			</g>
		</svg>
		<transition name="fade">
			<div v-if="is_loading" class="ui-character-center">
				<div class="ui-character-text">
					loading...
				</div>
			</div>
		</transition>
		<transition name="fade">
			<div v-if="is_processing" class="ui-character-center">
				<div class="ui-character-text">
					process...
				</div>
			</div>
		</transition>
	</div>
</template>

<script>
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
		data: function () {
			return {
				is_loading: false,
				is_processing: false,
			}
		},
		methods: {
			get_ft_src: function (ft) {
				return ft.texture.src;
			},
			get_ft_style: function (ft) {
				return {
					left: ft.relative.x + 'px',
					top: ft.relative.y + 'px',
					opacity: ft.opacity,
					width: ft.width + 'px',
					height: ft.height + 'px'
				};
			},
			fake: function () {
				let vm = this;
				vm.is_processing = true;
				setTimeout(function () {
					vm.is_processing = false;
				}, 1000);
			},
			download2: function () {
				let svg = this.$el.innerHTML;
				//let url = "data:image/svg+xml;base64," + btoa(svg);
				let url = "data:image/svg+xml;utf8," + (svg);
				//let url = "data:text/html;charset=utf-8," + encodeURIComponent(svg);

				debugger;

				window.open(url);

				//let el = $("<a>svg</a>");
				//el[0].href = url;
				//el.trigger("click");
			},
		},
		update: function () {
			this.$el.style.cursor = "not-allowed";
			this.is_loading = true;
		},
		updated: function () {
			this.$el.style.cursor = "default";
			this.is_loading = false;
		}
	};
</script>

<style>
	.ui-character-frame {
		display: inline-block;
		position: relative;
		width: 64px;
		height: 96px;

		user-select: none;
		background-position: 0px 0px, 10px 10px;
		background-size: 20px 20px;
		background-image: linear-gradient(45deg, #eee 25%, transparent 25%, transparent 75%, #eee 75%, #eee 100%),linear-gradient(45deg, #eee 25%, white 25%, white 75%, #eee 75%, #eee 100%);
	}

	.ui-character-center {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.2);
		overflow: hidden;
		text-align: center;
	}
	.ui-character-text {
		text-align: center;
		position: absolute;
		top: calc(50% - 0.5em);
		font-weight: bold;
		color: white;
		text-shadow: 0 0 1px black, 0 0 2px black, 0 0 5px black;
	}
</style>
