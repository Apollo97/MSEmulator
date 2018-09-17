
import { AnimationBase } from "../game/Animation";


export class UIAnimation extends AnimationBase {
	/**
	 * @param {any} raw
	 * @param {string} [url]
	 */
	constructor(raw, url) {
		super(raw, url);

		this.is_loop = true;

		/** @type {(anima: UIAnimation, stamp: number) => void} */
		this.onupdate = null;
	}

	get image_src() {
		return this.texture.texture.src;
	}
}

export class UIAnimationManager {
	constructor() {
		/** @type {Map<any,UIAnimation>} */
		this._animations = new Map();
	}

	/**
	 * @param {any} key
	 * @param {UIAnimation} uiAnima
	 */
	add(key, uiAnima) {
		this._animations.set(key, uiAnima);
	}

	/**
	 * @param {any} key
	 */
	remove(key) {
		this._animations.delete(key);
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this._animations.forEach((uiAnima) => {
			if (uiAnima.is_loop || !uiAnima.isEnd()) {
				uiAnima.update(stamp);
				if (process.env.NODE_ENV !== 'production') {
					if (!uiAnima.onupdate) {
						debugger;
					}
				}
				uiAnima.onupdate(uiAnima, stamp);
			}
			else {
				this._animations.delete(uiAnima);
			}
		});
	}
}

export const uiAnimationManager = new UIAnimationManager();
