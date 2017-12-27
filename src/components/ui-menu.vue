
<template>
	<div class="menu-frame"><!--outer element keep jquery-ui position-->
		<transition name="menu">
			<div v-if="show" class="menu">
				<slot></slot>
			</div>
		</transition>
	</div>
</template>

<script>
	import CorePosition from "./CorePosition.js"
	//function animation_show() {
	//	return {
	//		effect: "fade",
	//		easing: "swing",
	//		duration: 400,
	//		//complete: function () { },
	//		//queue: function () { },
	//	};
	//}
	//let CoreShow = {
	//	props: {
	//		show: {
	//			default: true
	//		},
	//		"opt-show": {
	//			default: function () {
	//				return animation_show();
	//			}
	//		},
	//		"opt-hide": {
	//			default: function () {
	//				return animation_show();
	//			}
	//		},
	//	},
	//	watch: {
	//		"show": function (val) {
	//			if (val) {
	//				$(this.$el).show(this.optShow);
	//			}
	//			else {
	//				$(this.$el).hide(this.optHide);
	//			}
	//		},
	//	},
	//};

	export default {
		mixins: [CorePosition],
		props: {
			show: true
		},
		data: function () {
			return {
				_cp_onclick: null
			};
		},
		methods: {
		},
		watch: {
			"show": function (val) {
				if (val) {
					if (!this._cp_onclick) {
						this._cp_onclick = (function () {
							this.$emit("close");
						}).bind(this);
						$(window).on("mousedown", this._cp_onclick);
					}
				}
				else {
					$(window).off("mousedown", this._cp_onclick);
					this._cp_onclick = null;
				}
			},
		},
		//mounted: function () {
		//}
	};
</script>

<style>
	.menu-frame {
		user-select: none;
		position: absolute;
		overflow: hidden;
	}

	.menu {
		list-style: none;
		margin: 0;
		padding: 0em 0em;
		background: #f0f9ff;
		border: 1px solid darkgray;
		box-shadow: 0.2em 0.2em 0.2em darkgray;
	}
	.menu > *:not(hr) {
		display: block;
		padding: 0.25em 1em 0.25em 1em;
		background: #f0f9ff;
		cursor: pointer;
	}
	.menu > *.disable {
		cursor: not-allowed;
		color: darkgray;
	}
	.menu > *:not(.disable):not(hr):hover {
		background: linear-gradient(to bottom, #4096ee 0%,#4096ee 100%);
		box-shadow: inset 0 0 1px #1e69de;
	}
	.menu > *:not(.disable):not(hr):active {
		background: linear-gradient(to bottom, #6db3f2 0%,#54a3ee 50%,#3690f0 51%,#1e69de 100%);
		box-shadow: inset 0 0 1px #1e69de;
	}
	.menu > hr {
		margin: 0.2em 0;
	}

	.menu-enter-active {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		width: 100%;
		height: 5em;
		transition: .3s;
	}
	.menu-enter {
		opacity: 0;
		height: 0;
		width: 0;
	}
	.menu-leave-active {
		transition: .4s;
	}
	.menu-leave-to {
		opacity: 0;
	}
</style>
