
import { IRenderer } from '../IRenderer.js';
import { Sprite } from '../Sprite.js';


export class ChatBalloon {
	constructor() {
		this._raw = null;
	}

	/**
	 * @param {any} style
	 */
	async load(style) {
		const _d_path = [this.constructor._base_path, style].join("/");
		const _i_path = _d_path;
		
		Object.defineProperty(this, "_raw", {
			value: await $get.data(_d_path),
		});

		this.nw = new Sprite(this._raw.nw);

		this.n = new Sprite(this._raw.n);

		this.ne = new Sprite(this._raw.ne);

		this.w = new Sprite(this._raw.w);

		this.c = new Sprite(this._raw.c);

		this.e = new Sprite(this._raw.e);

		this.sw = new Sprite(this._raw.sw);

		this.s = new Sprite(this._raw.s);

		this.se = new Sprite(this._raw.se);

		this.arrow = new Sprite(this._raw.arrow);

		//this._pat_c = ctx.createPattern(this.c, "repeat");

		ChatBalloon.cache[style] = this;
	}

	/*
	1 12345 12345 1 : 5
	2 12345 12345 12345
	3 12345 12345 12345
	4 12345 12345 12345
	5 12345 12345 12345
	6 xxx12 34512 34
	 */

	/**
	 * @param {IRenderer} renderer
	 * @param {string} text - length = chat.value.length + " : ".length + name.length = 70 + 3 + name.length
	 * @param {number} x - chat balloon arrow bottom pos.x
	 * @param {number} y - chat balloon arrow bottom pos.y
	 */
	draw(renderer, text, x, y) {
		let lines = [];
		for (let i = 0; i < text.length; i += 12) {
			let line = text.slice(i, i + 12);
			lines.push(line);
		}
		if (!lines.length) {
			return;
		}

		const LINE_HEIGHT = this.c.height;// = fontSize(12) + PADDING_TOP(2)
		const ctx = renderer.ctx;
		const PADDING_LEFT = 0, PADDING_TOP = 0, PADDING_RIGHT = 0, PADDING_BOTTOM = 0;

		ctx.font = "12px 微軟正黑體";//新細明體
		ctx.textAlign = "center";
		ctx.textBaseline = "top";//alphabetic

		const _tw = lines.map(line => ctx.measureText(line).width + PADDING_LEFT + PADDING_RIGHT).sort((a, b) => b - a)[0];
		const tw = Math.ceil(_tw / this.n.width) * this.n.width;
		const hw = tw / 2;
		const th = lines.length * LINE_HEIGHT + PADDING_TOP + PADDING_BOTTOM;

		x = Math.trunc((x - hw));
		y = Math.trunc((y - th) - this.arrow.height);

		this.nw.draw2(x, y);
		this.n._drawPattern(x, y, tw, this.n.height);
		this.ne.draw2(x + tw, y);

		const xw = this.w.width - this.w.x;

		this.w._drawPattern(x + xw, y, this.w.width, th);
		this.c._drawPattern(x + xw, y, tw, th);
		this.e._drawPattern(x + xw + tw, y, this.e.width, th);

		const arrow_hw = this.arrow.width / 2;
		const hw_arrow_hw = hw - arrow_hw;

		this.sw.draw2(x, y + th);
		this.s._drawPattern(x, y + th, hw_arrow_hw, this.s.height);
		this.s._drawPattern(x + hw + arrow_hw, y + th, hw_arrow_hw, this.s.height);
		this.se.draw2(x + tw, y + th);

		this.arrow.draw2i(x - arrow_hw + hw, y + th);
		
		for (let i = 0, cy = y; i < lines.length; ++i, cy += LINE_HEIGHT) {
			let line = lines[i];

			//if (this.constructor.DEBUG) {
			//	ctx.beginPath();
			//	ctx.strokeStyle = "red";
			//	ctx.strokeRect(x + PADDING_LEFT, cy + PADDING_TOP, tw, LINE_HEIGHT);
			//}
		
			ctx.fillStyle = "black";
			ctx.fillText(line, x + hw + PADDING_LEFT, cy + PADDING_TOP);
		}
	}

	static get _base_path() {
		return "/UI/ChatBalloon";
	}

	//static get DEBUG() {
	//	return false;
	//}
}

/** @type {{[style:number]:ChatBalloon}} */
ChatBalloon.cache = {};

window.$images_ChatBalloon = ChatBalloon.cache;
