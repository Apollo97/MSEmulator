
<template>
	<div @mousedown="mousedown($event)"
		 @touchstart="onTouch"
		 @touchmove="onTouch"
		 @touchend="onTouch"
		 class="ui-draggable">
		<slot></slot>
	</div>
</template>

<script>
	//var cs = getComputedStyle(event.currentTarget, null);
	
	//not effective in ui
	//this func no work, mouse event from window
	function reset_mouse() {
		$gv.mouse_move = 0;
		$gv.mouse_x = 0;
		$gv.mouse_y = 0;
		$gv.mouse_dl = 0;
		$gv.mouse_ul = 0;
		$gv.mouse_dm = 0;
		$gv.mouse_um = 0;
		$gv.mouse_dr = 0;
		$gv.mouse_ur = 0;
	}

	function _calc_origin_pos(el) {
		let left = el.style.left;
		let top = el.style.top;
		let x, y;

		el.style.left = "0px";
		x = el.offsetLeft;
		el.style.left = left;

		el.style.top = "0px";
		y = el.offsetTop;
		el.style.top = top;

		return {
			x, y
		}
	}

	export default {
		props: {
			handle: {
				type: String,
				default: "header",
				description: "class only"
			},
			zIndex: {
				type: Number,
				default: 0,
			},
			position: {
				default: function () {
					return {
						x: 0,
						y: 0,
					};
				},
				required: false
			}
		},
		data: function () {
			return {
				mouse_x0: 0,
				mouse_y0: 0,
				origin_x: 0,
				origin_y: 0,
				old_width: 0,
				old_height: 0,
				//elem_handle: null,
				handle_mousemove: null,
				handle_mouseup: null,
			}
		},
		//computed: {
		//	handleClassName: function () {
		//		return this.handle || "header";
		//	},
		//},
		methods: {
			mousemove: function () {
				reset_mouse();
				if (event.which == 1) {
					let el = this.$el;//event.currentTarget

					let x = event.clientX - this.mouse_x0;
					let y = event.clientY - this.mouse_y0;

					el.style.left = Math.max(x, 0) + "px";
					el.style.top = Math.max(y, 0) + "px";

					let pw = el.parentElement.offsetWidth;
					let ph = el.parentElement.offsetHeight;

					let ox = el.offsetLeft;
					let oy = el.offsetTop;
					let ow = this.old_width;//el.offsetWidth;
					let oh = this.old_height;//el.offsetHeight;

					if (ox < 0) {
						el.style.left = "0px";
					}
					if (ox + ow >= pw) {
						el.style.left = (pw - ow) + "px";
					}

					// parent 高度不足時對齊上邊
					if (oy >= 0) {
						if (oh < ph) {
							if (oy + oh >= ph) {
								el.style.top = (ph - oh) + "px";
							}
						}
						else {
							el.style.top = (-this.origin_y) + "px";
						}
					}
					if (oy < 0) {
						el.style.top = "0px";
					}

					//el.style.minWidth = ow + "px";
					//el.style.minHeight = oh + "px";



					//if (el.style.width != "auto") {
					//	el.style.width = ow = "px";
					//}
					//if (el.style.height != "auto") {
					//	el.style.height = oh = "px";
					//}
				}
				else {
					this.mouseup();
				}
			},
			mousedown: function (event) {
				reset_mouse();
				//if (event.target != this.elem_handle) {
				//	return;
				//}
				if (!event.target.classList.contains(this.handle)) {
					return;
				}
				event.target.focus();

				let rp = this.get_relative_position();

				//calc click-position of parent
				this.mouse_x0 = event.clientX - rp.x;
				this.mouse_y0 = event.clientY - rp.y;
				if (event.which == 1) {
					let el = this.$el;
					this.old_width = el.offsetWidth;
					this.old_height = el.offsetHeight;
				}

				let vm = this;

				this.handle_mousemove = function (event) {
					vm.mousemove(event);
				};
				this.handle_mouseup = function () {
					vm.mouseup();
				};

				window.addEventListener("mousemove", vm.handle_mousemove);
				window.addEventListener("mouseup", vm.handle_mouseup);
			},
			mouseup: function () {
				reset_mouse();
				window.removeEventListener("mousemove", this.handle_mousemove);
				window.removeEventListener("mouseup", this.handle_mouseup);
				this.$emit("update:position", this.get_relative_position());
			},
			get_relative_position: function () {
				return {
					x: this.$el.offsetLeft,
					y: this.$el.offsetTop
				}
			},
			onTouch: function (evt) {
				const tt = evt.target.tagName.toLowerCase();
				if (tt == "input" || tt == "select" || tt == "button" || tt == "summary") {
					return;
				}
				
				//evt.preventDefault();
				
				if (evt.touches.length > 1 || (evt.type == "touchend" && evt.touches.length > 0)) {
					return;
				}
				let newEvt = document.createEvent("MouseEvents");
				let type = null;
				let touch = null;
				
				switch (evt.type) {
					case "touchstart": 
						type = "mousedown";
						touch = evt.changedTouches[0];
						break;
					case "touchmove":
						type = "mousemove";
						touch = evt.changedTouches[0];
						break;
					case "touchend":
						type = "mouseup";
						touch = evt.changedTouches[0];
						break;
				}
				
				newEvt.initMouseEvent(type, true, true, evt.target.ownerDocument.defaultView, 0,
				touch.screenX, touch.screenY, touch.clientX, touch.clientY,
				evt.ctrlKey, evt.altKey, evt.shiftKey, evt.metaKey, 0, null);
				
				evt.target.dispatchEvent(newEvt);
			}
		},
		mounted: function () {
			let el = this.$el;
			let x, y;

			x = this.position.x;
			y = this.position.y;

			if (this.position.x || this.position.y) {
				this.$el.style.left = x + "px";
				this.$el.style.top = y + "px";
				this.origin_x = x;
				this.origin_y = y;
			}
			else {
				let ori_pos = _calc_origin_pos(el);

				this.origin_x = ori_pos.x;
				this.origin_y = ori_pos.y;
			}
			//this.elem_handle = el.querySelector(this.handle);
		},
		watch: {
			zIndex: function (val) {
				this.$el.style.zIndex = val;
			},
			"position.x": function (val) {
				this.$el.style.left = val + "px";
			},
			"position.y": function (val) {
				this.$el.style.top = val + "px";
			},
		},
	};
</script>

<style>
	.ui-draggable {
		position: absolute;
		display: inline-block;
		user-select: none;
	}
</style>

