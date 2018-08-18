
import { Animation } from "../Animation.js"
import { IRenderer } from "../IRenderer.js";
import { RenderingOption } from "./RenderingOption";

/**
 * @interface
 */
export class LayerObject {
	constructor() {
		/** @type {number} = 0~1 */
		this.opacity = 1;
	}

	destroy() {
	}

	isEnd() {
		console.error("Not implement");
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		throw new Error();
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {RenderingOption} option
	 */
	render(renderer, option) {
		throw new Error();
	}
}

/**
 * @implements {LayerObject}
 */
export class Layer {
	constructor() {
		/** @type {LayerObject[]} */
		this.objects = [];
		
		this.rendering_option = new RenderingOption();
	}
	
	add(obj) {
		this.objects.push(obj);
	}
	
	clear() {
		this.objects.length = 0;
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.objects = this.objects.filter(function (obj) {
			if (!obj.isEnd || !obj.destroy) {
				console.error("%o: %o", obj.constructor ? obj.constructor.name : (typeof obj), obj);
				return false;
			}
			if (obj.isEnd()) {
				obj.destroy();
				return false;
			}
			else {
				obj.update(stamp);
			}
			return true;
		});
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {RenderingOption} option
	 */
	render(renderer, option) {
		const opt = this.rendering_option.mul(option);
		
		if (opt.opacity > 0) {
			renderer.pushGlobalAlpha();

			this.objects.forEach(function (obj) {
				obj.render(renderer, opt);
			});

			renderer.popGlobalAlpha();
		}
	}
}

