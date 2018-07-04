
import { Animation } from "../Animation.js"
import { IRenderer } from "../IRenderer.js";

/**
 * @interface
 */
export class Drawable {
	constructor() {
		/** @type {number} = 0~1 */
		this.opacity = 1;
	}

	destroy() {
	}

	isEnd() {
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		throw new Error();
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		throw new Error();
	}
}

export class Layer {
	constructor() {
		/** @type {Drawable[]} */
		this.objects = [];

		this.opacity = 1;
	}
	
	add(obj) {
		this.objects.push(obj);
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.objects = this.objects.filter(function (obj) {
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
	 */
	render(renderer) {
		if (this.opacity > 0) {
			const opacity = this.opacity;

			renderer.pushGlobalAlpha();

			this.objects.forEach(function (obj) {
				renderer.globalAlpha = obj.opacity * opacity;

				obj.render(renderer);
			});

			renderer.popGlobalAlpha();
		}
	}
}

