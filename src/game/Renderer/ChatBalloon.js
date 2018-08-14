
import { IRenderer } from '../IRenderer.js';
import { Sprite } from '../Sprite.js';


export class ChatBalloon {
	constructor() {
		this._raw = null;
		this.style = null;
	}

	/**
	 * @param {any} style
	 */
	async load(style) {
		if (style == null) {
			throw new TypeError();
		}
		if (ChatBalloon.cache[style]) {
			let cb = ChatBalloon.cache[style];
			Object.assign(this, cb);
		}
		else {
			const path = [this._base_path, style].join("/");

			this.style = style;
			
			let promise = $get.data(path);
			ChatBalloon.cache[style] = this;
			this.$promise = promise;
			
			Object.defineProperty(this, "_raw", {
				value: await promise,
			});
			delete this.$promise;

			this.color = (this._raw.clr == -1 || !this._raw.clr) ? ("white") : ("#" + (this._raw.clr >>> 0).toString(16));

			this.nw = new Sprite(this._raw.nw);
			//this.nw._url = path + "/nw";

			this.n = new Sprite(this._raw.n);
			//this.n._url = path + "/n";

			this.ne = new Sprite(this._raw.ne);
			//this.ne._url = path + "/ne";

			this.w = new Sprite(this._raw.w);
			//this.w._url = path + "/w";

			this.c = new Sprite(this._raw.c);
			//this.c._url = path + "/c";

			this.e = new Sprite(this._raw.e);
			//this.e._url = path + "/e";

			this.sw = new Sprite(this._raw.sw);
			//this.sw._url = path + "/sw";

			this.s = new Sprite(this._raw.s);
			//this.s._url = path + "/s";

			this.se = new Sprite(this._raw.se);
			//this.se._url = path + "/se";

			this.arrow = new Sprite(this._raw.arrow);
			//this.arrow._url = path + "/arrow";

			//this._pat_c = ctx.createPattern(this.c, "repeat");
		}
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
		let lines = text.match(/(.{1,12})/g);
		if (!lines.length) {
			return;
		}

		const ctx = renderer.ctx;
		const LINE_HEIGHT = this.c.height;// = fontSize(12) + PADDING_TOP(2)
		const PADDING_LEFT = 0, PADDING_TOP = 0, PADDING_RIGHT = 0, PADDING_BOTTOM = 0;

		ctx.fillStyle = this.color;
		ctx.font = "12px 微軟正黑體";//新細明體
		ctx.textAlign = "center";
		ctx.textBaseline = "hanging";//top
		
		const min_width = this.n.width * 3;
		let _tw = Math.max.apply(null, lines.map(line => ctx.measureText(line).width + PADDING_LEFT + PADDING_RIGHT));
		if (_tw < min_width) {
			_tw = min_width;
		}
		const hw = Math.trunc((_tw / 2) / this.n.width) * this.n.width;
		const tw = hw * 2;
		const th = lines.length * LINE_HEIGHT + PADDING_TOP + PADDING_BOTTOM;
	
		x = (x - hw);
		y = (y - th) - this.arrow.height;

		{//top
			this.nw.draw2(x, y);
			this.n._drawPattern(x, y, tw, this.n.height);
			this.ne.draw2(x + tw, y);
		}
		{//center
			const xw = this.w.width - this.w.x;

			this.w._drawPattern(x + xw, y, this.w.width, th);
			this.c._drawPattern(x + xw, y, tw, th);
			this.e._drawPattern(x + xw + tw, y, this.e.width, th);
		}
		{//bottom
			const r_adj = this.arrow.width & 1;
			const arrow_hw = Math.trunc(this.arrow.width / 2);
			const hw_arrow_hw = hw - arrow_hw;
		
			this.sw.draw2(x, y + th);
			this.s._drawPattern(x, y + th, hw_arrow_hw, this.s.height);//clip
			this.s._drawPattern(x + hw + arrow_hw + r_adj, y + th, hw_arrow_hw - r_adj, this.s.height);//clip
			this.se.draw2(x + tw, y + th);

			this.arrow.draw2(x - arrow_hw + hw, y + th);
		}

		for (let i = 0, cy = y; i < lines.length; ++i, cy += LINE_HEIGHT) {
			let line = lines[i];

			//if (this.constructor.DEBUG) {
			//	ctx.beginPath();
			//	ctx.strokeStyle = "red";
			//	ctx.strokeRect(x + PADDING_LEFT, cy + PADDING_TOP, tw, LINE_HEIGHT);
			//}
			//ctx.fillStyle = "black";

			ctx.fillText(line, x + hw + PADDING_LEFT, cy + PADDING_TOP);
		}
	}

	get _base_path() {
		return "/UI/ChatBalloon";
	}

	//static get DEBUG() {
	//	return false;
	//}
}

/** @type {{[style:number]:ChatBalloon}} */
ChatBalloon.cache = window.$images_ChatBalloon || {};

window.$images_ChatBalloon = ChatBalloon.cache;

if (module.hot) {
	Object.values(ChatBalloon.cache).forEach(a => {
		a.__proto__ = ChatBalloon.prototype;
		//a.load(a.style);
	});
	module.hot.accept();
}
