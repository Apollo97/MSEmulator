
import { IRenderer } from '../IRenderer.js';
import { Sprite } from '../Sprite.js';
import { PanelRenderer } from './PanelRenderer.js';


export class NameLabel extends PanelRenderer {
	constructor() {
		super();
		
		/** @type {string} */
		this.style = null;
		
		/** @type {string} */
		this.color = null;
		
		/** @type {Sprite} */
		this.w = null;
		
		/** @type {Sprite} */
		this.c = null;
		
		/** @type {Sprite} */
		this.e = null;
	}
	
	async load(style) {
		if (style == null) {
			throw new TypeError();
		}
		const path = [this._base_path, style].join("/");
		
		this.style = style;
		
		let promise = this._load(path);
		NameLabel.cache[style] = this;
		this.$promise = promise;
		
		await promise;
		
		this._load_center();
		this._load_color("white");
		
		delete this.$promise;
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {string} text
	 * @param {number} x
	 * @param {number} y
	 */
	draw(renderer, text, x, y) {
		const ctx = renderer.ctx;
		
		ctx.fillStyle = this.color;
		ctx.font = "12px 微軟正黑體";//新細明體
		ctx.textAlign = "center";
		ctx.textBaseline = "hanging";//top
		
		let height = this.c.height;
		let width = ctx.measureText(text).width;
		width = Math.max(this.c.width * 2, width);
		
		const hw = width / 2;
		
		const cx = x - hw;
		const cy = y + Math.min(this.w.y, this.e.y);
		
		this.w.draw2(cx, cy);
		this.c._drawPattern(cx, cy, width - this.e.x, height);
		this.e.draw2(cx + width, cy);
		
		ctx.fillText(text, x, cy);
	}
	
	get _base_path() {
		return "/UI/NameTag";
	}
	
	/**
	 * @param {string} NameLabel
	 * @returns {Promise<NameLabel>}
	 */
	static get(labelStyle) {
		let label = NameLabel.cache[labelStyle];
		if (!label) {
			label = new NameLabel();
			label.load(labelStyle);
		}
		return label;
	}
}

/** @type {{[style:number]:NameLabel}} */
NameLabel.cache = window.$images_NameLabel || {};

window.$images_NameLabel = NameLabel.cache;

if (module.hot) {
	Object.values(NameLabel.cache).forEach(a => {
		a.__proto__ = NameLabel.prototype;
		//a.load(a.style);
	});
	module.hot.accept();
}
