<usage>
	<div class="vscr-viewport">
		<div ref="tElem" class="vscr-container">
			content
		</div>
		<scroll-bar :target="$ref.tElem"></scroll-bar>
	</div>
</usage>

<template>
	<div class="vscr-scrollbar" @mousewheel="_onmousewheel">
		<button class="vscr-decrement"></button>
		<button class="vscr-increment"></button>
		<div ref="track" class="vscr-track" @mousedown="_onmousemove" @mousemove="_onmousemove">
			<div :style="thumbStyle">
				<button class="vscr-thumb"></button>
			</div>
		</div>
	</div>
</template>

<script>
	const button_height = 12;
	const thumb_height = 26;

	export default {
		props: ["target", "step"],
		data: function () {
			return {
				thumbStyle: {
					position: "absolute",
					left: 0,
					top: "0",
				},
				_mouse_y: 0,//??: _
				_onscroll_target: null,
				_track_mouse_listener: null,
			};
		},
		computed: {
			maxHeight: function () {
				return this.$refs.track.offsetHeight;
			},
			thumbY: {
				get: function () {
					return parseFloat(this.thumbStyle.top);
				},
				set: function (val) {
					val = Math.max(val, 0);
					val = Math.min(val, this.maxHeight - thumb_height);
					
					this.thumbStyle.top = val + "px";

					this.$emit("scroll", val);
				},
			},
		},
		methods: {
			_getMousePosY: function (event) {
				let isTrack = event.target.classList.contains("track");
				if (isTrack) {
					return event.offsetY;
				}
				let pt = this.target.getBoundingClientRect().top;
				return -pt + event.clientY - thumb_height * 0.5;
			},
			_calcThumbY: function (top) {
				let y = top - (thumb_height / 2);
				
				if (this.step) {
					const tElem = this.target;
					let oh = tElem.offsetHeight;
					let h = this.maxHeight;
					let d = Math.trunc(tElem.scrollHeight / h) * h;
					let top = y / oh * d;

					top = Math.trunc(top / this.step) * this.step;

					y = top / d * oh;
				}

				this.thumbY = y;
				this._scrollTo(y);
			},
			_onmousemove: function (event) {//drag
				if (event.buttons == 1) {
					let y = this._getMousePosY(event);

					this._calcThumbY(y);

					this._set_tracking_mousemove();
				}
			},
			_set_tracking_mousemove: function () {
				if (this._track_mouse_listener) {
					return;
				}
				this._track_mouse_listener = (function (event) {
					if (event.buttons == 1) {
						this._onmousemove(event);
					}
					else {
						window.removeEventListener("mousemove", this._track_mouse_listener);
						this._track_mouse_listener = null;
					}
				}).bind(this);
				window.addEventListener("mousemove", this._track_mouse_listener);
			},
			_onmousewheel: function (event) {
				let roll;
				if (this.step) {
					event.preventDefault();
					roll = Math.sign(event.deltaY) * this.step;
				}
				else {
					roll = event.deltaY;
				}
				//this.thumbY += roll;//this.thumbY += ??
				this._scroll(roll);
				this._onscroll();
			},
			_scroll: function (addY) {
				const tElem = this.target;
				y = tElem.scrollTop + addY;
				tElem.scrollTo(0, y);
			},
			_scrollTo: function (thumbY) {
				const tElem = this.target;
				let oh = tElem.offsetHeight;
				let h = this.maxHeight;
				let d = Math.trunc(tElem.scrollHeight / h) * h;
				tElem.scrollTo(0, thumbY / oh * d);
			},
			_onscroll: function (event) {
				const tElem = this.target;
				let oh = tElem.offsetHeight;
				let h = this.maxHeight;
				let d = Math.trunc(tElem.scrollHeight / h) * h;
				let top = tElem.scrollTop;
				let t = top / d * oh;
				this.thumbY = t;
			},
			_bindScrollEvent: function () {
				const tElem = this.target;
				if (tElem) {
					if (this._onscroll_target) {
						tElem.removeEventListener("scroll", this._onscroll_target);
					}
					if (this.step) {
						this._onscroll_target = this._onmousewheel.bind(this);
						tElem.addEventListener("mousewheel", this._onscroll_target);
					}
					else {
						this._onscroll_target = this._onscroll.bind(this);
						tElem.addEventListener("scroll", this._onscroll_target);
					}
				}
			},
		},
		mounted: function () {
			this._bindScrollEvent();
		},
		beforeDestroy: function () {
			const tElem = this.target;
			tElem.removeEventListener("scroll", this._onscroll_target);
			if (this._track_mouse_listener) {
				window.removeEventListener("mousemove", this._track_mouse_listener);
			}
		},
		watch: {
			target: function (newVal) {
				this._bindScrollEvent();
			},
		},
		//componeents: {
		//}
	};
</script>

<style scoped>
	.vscr-viewport {
		position: absolute;
		left: 0;
		top: 0;
		width: 24em;
		height: 20em;
		overflow: hidden;
	}

	.vscr-container {
		width: 100%;
		height: 100%;
		overflow-y: scroll;
		box-sizing: content-box;
		padding-right: 11px;
		position: absolute;
	}

	.vscr-scrollbar {
		position: absolute;
		right: 0;
		top: 0;
		width: 11px;
		height: 100%;
	}

	.vscr-track {
		position: absolute;
		left: 0;
		top: 12px;
		width: 11px;
		height: calc(100% - 24px);
		background: url(/images/UI/Basic.img/VScr9/enabled/base);
	}

		.vscr-track:window-inactive {
			background: url(/images/UI/Basic.img/VScr9/disabled/base);
		}

	.vscr-thumb {
		outline: none;
		border: none;
		padding: 0;
		width: 11px;
		height: 26px;
		background: url(/images/UI/Basic.img/VScr9/enabled/thumb0) no-repeat;
	}

		.vscr-thumb:hover {
			background: url(/images/UI/Basic.img/VScr9/enabled/thumb1) no-repeat;
		}

		.vscr-thumb:active {
			background: url(/images/UI/Basic.img/VScr9/enabled/thumb2) no-repeat;
		}

	.vscr-decrement {
		outline: none;
		border: none;
		padding: 0;
		position: absolute;
		left: 0;
		top: 0;
		width: 11px;
		height: 12px;
		background: url(/images/UI/Basic.img/VScr9/enabled/prev0);
	}

		.vscr-decrement:hover {
			background: url(/images/UI/Basic.img/VScr9/enabled/prev1);
		}

		.vscr-decrement:active {
			background: url(/images/UI/Basic.img/VScr9/enabled/prev2);
		}

		.vscr-decrement:window-inactive {
			background: url(/images/UI/Basic.img/VScr9/disabled/prev);
		}

	.vscr-increment {
		outline: none;
		border: none;
		padding: 0;
		position: absolute;
		left: 0;
		bottom: 0;
		width: 11px;
		height: 12px;
		background: url(/images/UI/Basic.img/VScr9/enabled/next0);
	}

		.vscr-increment:hover {
			background: url(/images/UI/Basic.img/VScr9/enabled/next1);
		}

		.vscr-increment:active {
			background: url(/images/UI/Basic.img/VScr9/enabled/next2);
		}

		.vscr-increment:window-inactive {
			background: url(/images/UI/Basic.img/VScr9/disabled/next);
		}
</style>
