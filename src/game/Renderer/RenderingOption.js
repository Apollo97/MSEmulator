
import { IRenderer } from "../IRenderer.js";


export class RenderingOption {
	/**
	 * @param {Partial<RenderingOption>} [option]
	 */
	constructor(option) {
		if (option) {
			this.opacity = option.opacity || 1;
		}
		else {
			this.opacity = 1;
		}
	}
	clone() {
		return new RenderingOption(this);
	}
	/**
	 * multiply property, return new RenderingOption
	 * @param {RenderingOption} other
	 * @returns {RenderingOption}
	 */
	mul(other) {
		if (other) {
			return new RenderingOption({
				opacity: this.opacity * other.opacity,
			});
		}
		else {
			return this.clone();
		}
	}
	/**
	 * multiply property
	 * @param {RenderingOption} other
	 * @returns {void}
	 */
	selfMultiply(other) {
		if (other) {
			this.opacity * other.opacity;
		}
	}
}

