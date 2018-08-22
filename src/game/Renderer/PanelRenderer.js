
import { IRenderer } from '../IRenderer.js';
import { Sprite } from '../Sprite.js';


export class PanelRenderer {
	constructor() {
		this._raw = null;
	}
	
	/**
	 * @param {string} url
	 */
	async _load(url) {
		Object.defineProperty(this, "_raw", {
			value: await $get.data(url),
		});
	}
	
	_load_top() {
		this.nw = new Sprite(this._raw.nw);
		//this.nw._url = url + "/nw";

		this.n = new Sprite(this._raw.n);
		//this.n._url = url + "/n";

		this.ne = new Sprite(this._raw.ne);
		//this.ne._url = url + "/ne";
	}
	
	_load_center() {
		this.w = new Sprite(this._raw.w);
		//this.w._url = url + "/w";

		this.c = new Sprite(this._raw.c);
		//this.c._url = url + "/c";

		this.e = new Sprite(this._raw.e);
		//this.e._url = url + "/e";
	}
	
	_load_bottom() {
		this.sw = new Sprite(this._raw.sw);
		//this.sw._url = url + "/sw";

		this.s = new Sprite(this._raw.s);
		//this.s._url = url + "/s";

		this.se = new Sprite(this._raw.se);
		//this.se._url = url + "/se";
	}
	
	_load_arrow() {
		this.arrow = new Sprite(this._raw.arrow);
		//this.arrow._url = url + "/arrow";
	}
	
	/**
	 * @param {string} defCol
	 */
	_load_color(defCol) {
		const argb = Number("clr" in this._raw ? this._raw.clr : defCol);
		const rgba = (((argb & 0xFF000000) >>> 24) | ((argb & 0x00FFFFFF) << 8)) >>> 0;
		const str_rgba = rgba.toString(16).padStart(8, "0");
		this.color = (this._raw.clr == -1 || !this._raw.clr) ? ("white") : ("#" + str_rgba);
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {number} cx
	 * @param {number} bottom
	 * @param {number} hwidth
	 * @param {number} height
	 */
	_draw_top(renderer, cx, bottom, hwidth, height) {
		const tw = hwidth * 2;
		this.nw.draw2(cx, bottom);
		this.n._drawPatterncx(x, bottom, tw, this.n.height);
		this.ne.draw2(cx + tw, bottom);
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {number} cx
	 * @param {number} bottom
	 * @param {number} hwidth
	 * @param {number} height
	 */
	_draw_center(renderer, cx, bottom, hwidth, height) {
		const tw = hwidth * 2;
		const xw = this.w.width - this.w.x;

		this.w._drawPattern(cx + xw, bottom, this.w.width, height);
		this.c._drawPattern(cx + xw, bottom, tw, height);
		this.e._drawPattern(cx + xw + tw, bottom, this.e.width, height);
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {number} cx
	 * @param {number} bottom
	 * @param {number} hwidth
	 * @param {number} height
	 */
	_draw_bottom(renderer, cx, bottom, hwidth, height) {
		const tw = hwidth * 2;
		this.sw.draw2(cx, bottom + height);
		this.s._drawPattern(cx, bottom + height, hwidth, this.s.height);
		this.se.draw2(cx + tw, bottom + height);
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {number} cx
	 * @param {number} bottom
	 * @param {number} hwidth
	 * @param {number} height
	 */
	_draw_bottom_and_arrow(renderer, cx, bottom, hwidth, height) {
		const tw = hwidth * 2;
		const r_adj = this.arrow.width & 1;
		const arrow_hw = Math.trunc(this.arrow.width / 2);
		const hw_arrow_hw = hwidth - arrow_hw;
	
		this.sw.draw2(cx, bottom + height);
		this.s._drawPattern(cx, bottom + height, hw_arrow_hw, this.s.height);
		this.s._drawPattern(cx + hwidth + arrow_hw + r_adj, bottom + height, hw_arrow_hw - r_adj, this.s.height);
		this.se.draw2(cx + tw, bottom + height);

		this.arrow.draw2(cx - arrow_hw + hwidth, bottom + height);
	}
}
