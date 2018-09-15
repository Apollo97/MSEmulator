
<template>
	<div :style="style"
		 @touchstart="onTouch"
		 @touchmove="onTouch"
		 @touchend="onTouch"
		 >
		<table class="fill frame" ref="frame">
			<tr>
				<td class="resize-border nw color_nw" @mousedown="resizable_mousedown('nw', $event)" @mouseup="resizable_mouseup('nw', $event)"></td>
				<td class="resize-border n color_n" @mousedown="resizable_mousedown('n', $event)" @mouseup="resizable_mouseup('n', $event)"></td>
				<td class="resize-border ne color_ne" @mousedown="resizable_mousedown('ne', $event)" @mouseup="resizable_mouseup('ne', $event)"></td>
			</tr>
			<tr>
				<td class="resize-border w color_w" @mousedown="resizable_mousedown('w', $event)" @mouseup="resizable_mouseup('w', $event)"></td>
				<td class="fill" @mousedown="resizable_mousedown('move', $event)" @mouseup="resizable_mouseup('move', $event)">
					<div ref="content" class="fill content">
						<slot></slot>
					</div>
				</td>
				<td class="resize-border e color_e" @mousedown="resizable_mousedown('e', $event)" @mouseup="resizable_mouseup('e', $event)"></td>
			</tr>
			<tr>
				<td class="resize-border sw color_sw" @mousedown="resizable_mousedown('sw', $event)" @mouseup="resizable_mouseup('sw', $event)"></td>
				<td class="resize-border s color_s" @mousedown="resizable_mousedown('s', $event)" @mouseup="resizable_mouseup('s', $event)"></td>
				<td class="resize-border se color_se" @mousedown="resizable_mousedown('se', $event)" @mouseup="resizable_mouseup('se', $event)"></td>
			</tr>
		</table>
	</div>
</template>

<script>
	let resizable_target = null;
	let resizable_current_target = null;
	let resizable_orientation = null;
	let resizable_local_left = 0;
	let resizable_local_top = 0;
	let resizable_local_right = 0;
	let resizable_local_bottom = 0;

	function resizable_mouseMove(ev) {
		if (!resizable_target) return;
		//document.body.style.cursor = resizable_orientation + "-resize";
		resizable_target.resizable_onresize(resizable_orientation, ev);
	}
	function resizable_mouseUp(ev) {
		//console.log("o: " + resizable_orientation + ", up gv");
		//if (!resizable_target) return;
		resizable_target = null;
		resizable_orientation = null;
	}

	window.addEventListener("mousemove", resizable_mouseMove, false);
	window.addEventListener("mouseup", resizable_mouseUp, false);

	function _to_css_px(value) {
		return CSS.px(Math.trunc(value));
	}

	const default_options = {
		/*movableHandle: {
			type: String,
			default: "header",
			description: "css selector"
		},
		resizableHandle: {
			type: String,
			default: "resize-border",
			description: "css selector"
		},*/
		/*movable: {
			type: Boolean,
			default: true,
		},
		resizable: {
			type: Boolean,
			default: true,
		},*/
		movable: true,
		resizable: true,
	};

	export default {
		props: {
			options: {
				default: function () {
					return default_options;
				}
			},
		},
		data: function () {
			return {
				style: {
					position: "absolute",
					boxSizing: "border-box",
					//outline: "1px solid blue",
					//border: "1px solid gray",
					borderRadius: CSS.px(5),
					left: CSS.em(5 + Math.trunc(Math.random() * 20)),
					top: CSS.em(5 + Math.trunc(Math.random() * 20)),
					width: CSS.em(20),
					height: CSS.em(20),
					zIndex: 0,
				},
				m_movable: true,
				m_resizable: true,
				
				_$options: Object.assign({}, default_options),
			};
		},
		watch: {
			options: function () {
				this.$data._$options = Object.assign({}, this.options, default_options);
			},
		},
		methods: {
			setStyle: function (style) {
				for (let [cssPropName, value] of Object.entries(style)) {
					this.$set(this.style, cssPropName, value);
				}
				
				this.$nextTick(() => {
					let rect = this.$el.getBoundingClientRect();
					this.style.left = _to_css_px(rect.left);
					this.style.top = _to_css_px(rect.top);
					this.style.width = _to_css_px(rect.width);
					this.style.height = _to_css_px(rect.height);
				});
			},
			setMinSize: function (width, height) {
				let minWidth, minHeight;
				if (this.style.minWidth instanceof CSSUnitValue) {
					if (width > this.style.minWidth.value) {
						minWidth = CSS.px(Math.trunc(width));
					}
					else {
						minWidth = this.style.minWidth;
					}
				}
				else if (!this.style.minWidth) {
					minWidth = CSS.px(Math.trunc(width));
				}
				if (this.style.minHeight instanceof CSSUnitValue) {
					if (height > this.style.minHeight.value) {
						minHeight = CSS.px(Math.trunc(height));
					}
					else {
						minHeight = this.style.minHeight;
					}
				}
				else if (!this.style.minHeight) {
					minHeight = CSS.px(Math.trunc(height));
				}
				this.setStyle({
					minWidth: minWidth,
					minHeight: minHeight,
				});
			},
			isMovable: function () {
				return this.$data._$options.movable && this.m_movable;
			},
			isResizable: function () {
				return this.$data._$options.resizable && this.m_resizable;
			},
			resizable_mousedown: function (orientation, ev) {
				if (ev.buttons == 1) {
					if (!resizable_target) {
						const tt = ev.target.tagName;
						if (tt == "INPUT" || tt == "SELECT" || tt == "BUTTON" || tt == "SUMMARY") {
							return;
						}
						//if (this.movableHandle instanceof Array) this.movableHandle.reduce((acc, v) => acc || ev.target.classList.contains(v), false)
						if (orientation == "move") {
							//if (ev.target.className.indexOf) {
							//	console.log(ev, ev.target.className);
							//	debugger;
							//}
							if (!this.isMovable() || ev.target.className.indexOf("header") < 0) {
								return;
							}
						}
						if (orientation != "move" && !this.isResizable()) {
							return;
						}
						//debugger;
						//console.log("o: " + orientation + ", down");
						resizable_target = this;
						resizable_current_target = ev.currentTarget;
						resizable_orientation = orientation;
						let el = ev.currentTarget;
						let rect = el.getBoundingClientRect();
						resizable_local_left = rect.left - ev.pageX;
						resizable_local_top = rect.top - ev.pageY;
						resizable_local_right = rect.right - ev.pageX;
						resizable_local_bottom = rect.bottom - ev.pageY;
					}
				}
			},
			resizable_mouseup: function (orientation, ev) {
				if (resizable_target == this) {
					resizable_target = null;
					//console.log("o: " + orientation + ", up this");
				}
				else {
					resizable_target = null;
					//console.log("o: " + orientation + ", up ??");
				}
			},
			resizable_onresize: function (orientation, ev) {
				//console.log("o: " + orientation + ", x:" + ev.pageX);
				
				/*//check old width
				if (this.style.minWidth && (this.style.minWidth instanceof CSSUnitValue)) {
					const width = this.style.width.value;
					const minWidth = this.style.minWidth.value;
					
					if (width >= minWidth && (
						orientation == "nw" || orientation == "ne" ||
						orientation == "w" || orientation == "e" ||
						orientation == "sw" || orientation == "se")
					) {
						return;
					}
				}
				
				//check old height
				if (this.style.minHeight && (this.style.minHeight instanceof CSSUnitValue)) {
					const height = this.style.height.value;
					const minHeight = this.style.minHeight.value;
					if (height >= minHeight && (
						orientation == "nw" || orientation == "n" || orientation == "ne" ||
						orientation == "sw" || orientation == "s" || orientation == "se")
					) {
						return;
					}
				}*/
				
				{
					let rect_content = this.$refs.content.getBoundingClientRect();
					
					let rect = this.$el.getBoundingClientRect();
					
					let left = (ev.pageX + resizable_local_left);
					let top = (ev.pageY + resizable_local_top);
					
					let right = (ev.pageX + resizable_local_right);
					let bottom = (ev.pageY + resizable_local_bottom);
					let width = (Math.max(right - rect.left, rect_content.width));
					let height = (Math.max(bottom - rect.top, rect_content.height));
					
					let d_left = left - rect.left;
					let d_top = top - rect.top;
					
					let width1, height1;
					if (this.style.boxSizing == "border-box") {
						width1 = (Math.max(rect.right - left, rect_content.width));
						height1 = (Math.max(rect.bottom - top, rect_content.height));
					}
					else/* if (this.style.boxSizing == "content-box")*/ {//default
						style = this.$el.computedStyleMap();
						
						//TODO: calc unit
						let bw = style.get("border-left-width").value + style.get("border-right-width").value;
						let bh = style.get("border-top-width").value + style.get("border-bottom-width").value;
						
						width1 = (Math.max(rect.right - left - bw, rect_content.width));
						height1 = (Math.max(rect.bottom - top - bh, rect_content.height));
					}
					
					switch (orientation) {
						case "nw":
							this.style.left = _to_css_px(left);
							this.style.top = _to_css_px(top);
							this.style.width = _to_css_px(width1);
							this.style.height = _to_css_px(height1);
							break;
						case "w":
							this.style.left = _to_css_px(left);
							this.style.width = _to_css_px(width1);
							break;
						case "n":
							this.style.top = _to_css_px(top);
							this.style.height = _to_css_px(height1);
							break;
							
						case "ne":
							this.style.top = _to_css_px(top);
							this.style.width = _to_css_px(width);
							this.style.height = _to_css_px(height1);
							break;
						case "sw":
							this.style.left = _to_css_px(left);
							this.style.width = _to_css_px(width1);
							this.style.height = _to_css_px(height);
							break;
							
						case "se":
							this.style.width = _to_css_px(width);
							this.style.height = _to_css_px(height);
							break;
						case "e":
							this.style.width = _to_css_px(width);
							break;
						case "s":
							this.style.height = _to_css_px(height);
							break;
							
						case "move":
							//TODO: pos - ResizeHolder
							this.style.left = _to_css_px(left - 5);
							this.style.top = _to_css_px(top - 5);
							break;
					}
				}
				
				//check new position and size
				{
					let left = this.style.left.value;
					let top = this.style.top.value;
					let width = this.style.width.value;
					let height = this.style.height.value;
					let right = left + width;
					let bottom = top + height;
					
					let bound = this.$el.parentElement.getBoundingClientRect();
					
					if (left < bound.left) {
						this.style.left = _to_css_px(bound.left);
					}
					else if (right > bound.right) {
						this.style.left = _to_css_px(bound.right - width);
					}
					if (top < bound.top) {
						this.style.top = _to_css_px(bound.top);
					}
					else if (bottom > bound.bottom) {
						this.style.top = _to_css_px(bound.bottom - height);
					}
				}
				
				/*this.$emit("resizable", {
					orientation: orientation,
				});*/
			},
			onTouch: function (evt) {
				const tt = evt.target.tagName;
				if (tt == "INPUT" || tt == "SELECT" || tt == "BUTTON" || tt == "SUMMARY") {
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
			},
		},
		mounted: function () {
			let rect;
			
			if (this.$refs.frame) {
				rect = this.$refs.frame.getBoundingClientRect();
			}
			else {
				rect = this.$el.getBoundingClientRect();
			}
			
			let width = rect.width;
			let height = rect.height;
			if (this.style.boxSizing != "border-box") {
				style = this.$el.computedStyleMap();
				
				//TODO: calc unit
				let bw = style.get("border-left-width").value + style.get("border-right-width").value;
				let bh = style.get("border-top-width").value + style.get("border-bottom-width").value;
				
				width -= bw;
				height -= bh;
			}
			
			//apply default style
			for (let i in this.style) {
				this.$el.style[i] = this.style[i];
			}
			
			this.style.width = _to_css_px(width);
			this.style.height = _to_css_px(height);
		},
		beforeDestroy: function () {
			resizable_target = null;
		},
	};
</script>

<style scoped>
	table.frame {
		border-collapse: collapse;
		border-spacing: 0;
		user-select: none;
		
		border-radius: 5px;
		box-shadow: black 0px 0px 0px 1px inset;
	}

	.fill {
		width: 100%;
		height: 100%;
	}

	.content {
		overflow: auto;
		box-shadow: 0 0 1px 0px black;
	}

	.resize-border {
		padding: 0;
		background: hsla(208, 100%, 80%, 0.5);
	}

	.resize-border.nw {
		cursor: nw-resize;
		width: 5px;
		height: 5px;
		border-radius: 5px 0 0 0;
	}
	.resize-border.n {
		cursor: n-resize;
		height: 5px;
		/*border-bottom: 1px solid gray;*/
	}
	.resize-border.ne {
		cursor: ne-resize;
		width: 5px;
		height: 5px;
		border-radius: 0 5px 0 0;
	}
	.resize-border.w {
		cursor: w-resize;
		width: 5px;
		height: 100%;
		display: block;
		/*border-right: 1px solid gray;*/
	}
	.resize-border.e {
		cursor: e-resize;
		width: 5px;
		height: 100%;
		display: block;
		/*border-left: 1px solid gray;*/
	}
	.resize-border.sw {
		cursor: sw-resize;
		width: 5px;
		height: 5px;
		border-radius: 0 0 0 5px;
	}
	.resize-border.s {
		cursor: s-resize;
		height: 5px;
		/*border-top: 1px solid gray;*/
	}
	.resize-border.se {
		cursor: se-resize;
		width: 5px;
		height: 5px;
		border-radius: 0 0 5px 0;
	}


	/*.color_nw {
		border-right: 1px solid gray;
		border-bottom: 1px solid gray;
		background: aliceblue;
	}
	.color_n {
		border-bottom: 1px solid gray;
		background: aliceblue;
	}
	.color_ne {
		border-left: 1px solid gray;
		border-bottom: 1px solid gray;
		background: aliceblue;
	}
	.color_w {
		border-right: 1px solid gray;
		background: aliceblue;
	}
	.color_e {
		border-left: 1px solid gray;
		background: aliceblue;
	}
	.color_sw {
		border-right: 1px solid gray;
		border-top: 1px solid gray;
		background: aliceblue;
	}
	.color_s {
		border-top: 1px solid gray;
		background: aliceblue;
	}
	.color_se {
		border-left: 1px solid gray;
		border-top: 1px solid gray;
		background: aliceblue;
	}*/
</style>
