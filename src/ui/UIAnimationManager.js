
import { AnimationBase } from "../game/Animation";


export class UIAnimation extends AnimationBase {
	get image_src() {
		return this.texture.texture.src;
	}
}

export class UIAnimationManager {
	constructor() {
		/** @type {Set<UIAnimation>} - 不重複, distinct */
		this.animations = new Set();
	}

	/**
	 * @param {UIAnimation} uiAnima
	 */
	add(uiAnima) {
		this.animations.add(uiAnima);
	}

	/**
	 * @param {UIAnimation} uiAnima
	 */
	remove(uiAnima) {
		this.animations.delete(uiAnima);
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.animations.forEach((uiAnima) => {
			if (!uiAnima.isEnd() || uiAnima.is_loop) {
				this.animations.delete(uiAnima);
			}
			else {
				uiAnima.update(stamp);
			}
		});
	}
}
