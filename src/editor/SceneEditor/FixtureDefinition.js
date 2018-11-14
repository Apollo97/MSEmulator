
export class FixtureDef {
	constructor() {
		/** @type {string} */
		this.name = null;
	}

	/**
	 * @param {FixtureDef} other
	 */
	copy(other) {
		this.name = other.name;
	}

	clone() {
		let def = new FixtureDef();

		def.copy(this);

		return def;
	}
}
