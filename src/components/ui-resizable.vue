
<template>
	<div :style="style"
		 @touchstart="onTouch"
		 @touchmove="onTouch"
		 @touchend="onTouch"
		 >
		<table class="fill frame" ref="frame">
			<tr>
				<td :style="resizableStyle_border_nw" class="resizable-border color_nw" @mousedown="resizable_mousedown('nw', $event)" @mouseup="resizable_mouseup('nw', $event)"></td>
				<td :style="resizableStyle_border_n"  class="resizable-border color_n" @mousedown="resizable_mousedown('n', $event)" @mouseup="resizable_mouseup('n', $event)"></td>
				<td :style="resizableStyle_border_ne" class="resizable-border color_ne" @mousedown="resizable_mousedown('ne', $event)" @mouseup="resizable_mouseup('ne', $event)"></td>
			</tr>
			<tr>
				<td :style="resizableStyle_border_w" class="resizable-border color_w" @mousedown="resizable_mousedown('w', $event)" @mouseup="resizable_mouseup('w', $event)"></td>
				<td class="fill" @mousedown="resizable_mousedown('move', $event)" @mouseup="resizable_mouseup('move', $event)">
					<div ref="content" class="fill content">
						<slot></slot>
					</div>
				</td>
				<td :style="resizableStyle_border_e" class="resizable-border color_e" @mousedown="resizable_mousedown('e', $event)" @mouseup="resizable_mouseup('e', $event)"></td>
			</tr>
			<tr>
				<td :style="resizableStyle_border_sw" class="resizable-border color_sw" @mousedown="resizable_mousedown('sw', $event)" @mouseup="resizable_mouseup('sw', $event)"></td>
				<td :style="resizableStyle_border_s"  class="resizable-border color_s" @mousedown="resizable_mousedown('s', $event)" @mouseup="resizable_mouseup('s', $event)"></td>
				<td :style="resizableStyle_border_se" class="resizable-border color_se" @mousedown="resizable_mousedown('se', $event)" @mouseup="resizable_mouseup('se', $event)"></td>
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

		window.removeEventListener("mousemove", resizable_mouseMove, { passive: true });
		window.removeEventListener("mouseup", resizable_mouseUp, { passive: true });
	}

	if (module.hot) {
		//remove old listener
		window.removeEventListener("mousemove", resizable_mouseMove, { passive: true });
		window.removeEventListener("mouseup", resizable_mouseUp, { passive: true });
	}

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
					return Object.assign({}, default_options);
				}
			},
			resizable_borderWidth: {
				type: Number,
				default: 5,//unit is px
			},
		},
		data: function () {
			return {
				style: {
					position: "absolute",
					boxSizing: "border-box",
					//outline: "1px solid blue",
					//border: "1px solid gray",
					//borderRadius: CSS.px(5),
					left: this.options.left || CSS.em(Math.trunc(Math.random() * 5)),
					top: this.options.top || CSS.em(Math.trunc(Math.random() * 5)),
					width: this.options.width || CSS.em(5 + Math.trunc(Math.random() * 10)),
					height: this.options.height || CSS.em(5 + Math.trunc(Math.random() * 10)),
					zIndex: this.options.zIndex || 0,
				},
				m_movable: true,
				m_resizable: true,

				_$resizable_borderWidth: 5,//unit is px
				
				_$options: Object.assign({}, default_options),
			};
		},
		computed: {
			resizableStyle_border_nw: function () {
				return {
					cursor: "nw-resize",
					width: CSS.px(this.$data._$resizable_borderWidth),
					height: CSS.px(this.$data._$resizable_borderWidth),
					borderRadius: CSS.px(this.$data._$resizable_borderWidth) + " 0 0 0",
				};
			},
			resizableStyle_border_n: function () {
				return {
					cursor: "n-resize",
					height: CSS.px(this.$data._$resizable_borderWidth),
					/*borderBottom: "1px solid gray",*/
				};
			},
			resizableStyle_border_ne: function () {
				return {
					cursor: "ne-resize",
					width: CSS.px(this.$data._$resizable_borderWidth),
					height: CSS.px(this.$data._$resizable_borderWidth),
					borderRadius: "0 " + CSS.px(this.$data._$resizable_borderWidth) + " 0 0",
				};
			},
			resizableStyle_border_w: function () {
				return {
					cursor: "w-resize",
					width: CSS.px(this.$data._$resizable_borderWidth),
					height: "100%",
					display: "block",
					/*borderRight: "1px solid gray",*/
				};
			},
			resizableStyle_border_e: function () {
				return {
					cursor: "e-resize",
					width: CSS.px(this.$data._$resizable_borderWidth),
					height: "100%",
					display: "block",
					/*borderLeft: "1px solid gray",*/
				};
			},
			resizableStyle_border_sw: function () {
				return {
					cursor: "sw-resize",
					width: CSS.px(this.$data._$resizable_borderWidth),
					height: CSS.px(this.$data._$resizable_borderWidth),
					borderRadius: "0 0 0 " + CSS.px(this.$data._$resizable_borderWidth),
				};
			},
			resizableStyle_border_s: function () {
				return {
					cursor: "s-resize",
					height: CSS.px(this.$data._$resizable_borderWidth),
					/*borderTop: "1px solid gray",*/
				};
			},
			resizableStyle_border_se: function () {
				return {
					cursor: "se-resize",
					width: CSS.px(this.$data._$resizable_borderWidth),
					height: CSS.px(this.$data._$resizable_borderWidth),
					borderRadius: "0 0 " + CSS.px(this.$data._$resizable_borderWidth) + " 0",
				};
			},
		},
		watch: {
			options: function () {
				this.$data._$options = Object.assign({}, this.options, default_options);
			},
			resizable_borderWidth: function () {
				this.$data._$resizable_borderWidth = this.resizable_borderWidth;
			}
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
			show: function () {
				this.$set(this.style, "visibility", "visible");
			},
			hide: function () {
				this.$set(this.style, "visibility", "hidden");
			},
			isMovable: function () {
				return this.$data._$options.movable && this.m_movable;
			},
			isResizable: function () {
				return this.$data._$options.resizable && this.m_resizable;
			},
			resizable_mousedown: function (orientation, evt) {
				if (evt.buttons == 1) {
					if (!resizable_target) {
						const tt = evt.target.tagName;
						if (tt == "INPUT" || tt == "SELECT" || tt == "BUTTON" || tt == "SUMMARY") {
							return;
						}
						//if (this.movableHandle instanceof Array) this.movableHandle.reduce((acc, v) => acc || evt.target.classList.contains(v), false)
						if (orientation == "move") {
							//if (evt.target.className.indexOf) {
							//	console.log(evt, evt.target.className);
							//	debugger;
							//}
							if (!this.isMovable() || evt.target.className.indexOf("header") < 0) {
								return;
							}
						}
						if (orientation != "move" && !this.isResizable()) {
							return;
						}
						//debugger;
						//console.log("o: " + orientation + ", down");
						{
							resizable_target = this;
							window.addEventListener("mousemove", resizable_mouseMove, { passive: true });
							window.addEventListener("mouseup", resizable_mouseUp, { passive: true });
						}
						resizable_current_target = evt.currentTarget;
						resizable_orientation = orientation;
						let el = evt.currentTarget;
						let rect = el.getBoundingClientRect();
						resizable_local_left = rect.left - evt.pageX;
						resizable_local_top = rect.top - evt.pageY;
						resizable_local_right = rect.right - evt.pageX;
						resizable_local_bottom = rect.bottom - evt.pageY;
					}
				}
			},
			resizable_mouseup: function (orientation, evt) {
				if (resizable_target == this) {
					resizable_target = null;
					//console.log("o: " + orientation + ", up this");
				}
				else {
					resizable_target = null;
					//console.log("o: " + orientation + ", up ??");
				}
			},
			resizable_onresize: function (orientation, evt) {
				//console.log("o: " + orientation + ", x:" + evt.pageX);
				{
					const rect_content = this.$refs.content.getBoundingClientRect();
					const [content_width, content_height] = [
						rect_content.width + this.$data._$resizable_borderWidth * 2,
						rect_content.height + this.$data._$resizable_borderWidth * 2
					];
					
					let rect = this.$el.getBoundingClientRect();

					/**
					 * double pageX, pageY;
					 * https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/pageX#Browser_compatibility
					 */
					const [mouseX, mouseY] = [Math.trunc(evt.pageX), Math.trunc(evt.pageY)];
					
					let left = (mouseX + resizable_local_left);
					let top = (mouseY + resizable_local_top);
					
					let right = (mouseX + resizable_local_right);
					let bottom = (mouseY + resizable_local_bottom);
					let width = Math.max(right - rect.left, content_width);
					let height = Math.max(bottom - rect.top, content_height);
					
					let d_left = left - rect.left;
					let d_top = top - rect.top;
					
					let width1, height1;
					if (this.style.boxSizing == "border-box") {
						width1 = Math.max(rect.right - left, content_width);
						height1 = Math.max(rect.bottom - top, content_height);
					}
					else/* if (this.style.boxSizing == "content-box")*/ {//default
						const style = this.$el.computedStyleMap();
						
						const borderLeftWidth = style.get("border-left-width").value;
						const borderRightWidth = style.get("border-right-width").value;
						const borderTopWidth = style.get("border-top-width").value;
						const borderBottomWidth = style.get("border-bottom-width").value;

						//TODO: calc unit
						const bw = borderLeftWidth + borderRightWidth;
						const bh = borderTopWidth + borderBottomWidth;
						
						width1 = Math.max(rect.right - left - bw, content_width);
						height1 = Math.max(rect.bottom - top - bh, content_height);
					}

					const resize_threshold = 1;
					
					switch (orientation) {
						case "nw":
							if (this.style.width.value != width1) {
								this.style.left = _to_css_px(left);
								this.style.width = _to_css_px(width1);
							}
							if (this.style.height.value != height1) {
								this.style.top = _to_css_px(top);
								this.style.height = _to_css_px(height1);
							}
							break;
						case "w":
							if (this.style.width.value != width1) {
								this.style.left = _to_css_px(left);
								this.style.width = _to_css_px(width1);
							}
							break;
						case "n":
							if (this.style.height.value != height1) {
								this.style.top = _to_css_px(top);
								this.style.height = _to_css_px(height1);
							}
							break;
							
						case "ne":
							if (this.style.height.value != height1) {
								this.style.top = _to_css_px(top);
								this.style.height = _to_css_px(height1);
							}
							this.style.width = _to_css_px(width);
							break;
						case "sw":
							if (this.style.width.value != width1) {
								this.style.left = _to_css_px(left);
								this.style.width = _to_css_px(width1);
							}
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
							this.style.left = _to_css_px(left - this.$data._$resizable_borderWidth);
							this.style.top = _to_css_px(top - this.$data._$resizable_borderWidth);
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

					//parentElement.style => "position: relative; top: 0; left: 0;"
					this.style.left.value -= bound.left;
					this.style.top.value -= bound.top;
				}
				
				this.$emit("resizable", {
					event: evt,
					orientation: orientation,
				});
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

			this.$data._$resizable_borderWidth = this.resizable_borderWidth;
			
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

	.resizable-border {
		padding: 0;
		background: hsla(208, 100%, 80%, 0.5);
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
