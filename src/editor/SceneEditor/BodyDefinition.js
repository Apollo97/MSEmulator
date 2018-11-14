
import {
	b2BodyType,
} from "../../game/Physics/Physics.js";


export const bodyTypeMap = {
	static: b2BodyType.b2_staticBody,
	kinematic: b2BodyType.b2_kinematicBody,
	dynamic: b2BodyType.b2_dynamicBody,
};

export const b2BodyTypeToName = {
	[b2BodyType.b2_staticBody]: "static",
	[b2BodyType.b2_kinematicBody]: "kinematic",
	[b2BodyType.b2_dynamicBody]: "dynamic",
};

export class BodyDef {
	constructor() {
		/** @type {string} */
		this.name = null;

		/** @type {"static"|"kinematic"|"dynamic"} */
		this.type = null;
	}

	/**
	 * @param {BodyDef} other
	 */
	copy(other) {
		this.name = other.name;

		this.type = other.type;
	}

	clone() {
		let def = new FixtureeDef();

		def.copy(this);

		return def;
	}
}
