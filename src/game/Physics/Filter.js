
import { b2Filter } from "../../Box2D/build/Box2D/Box2D/Dynamics/b2Fixture";


/** @type {{[name:string]:b2Filter}} */
let filter_preset = {};

let next_category = 1;

export class FilterHelper extends b2Filter {
	/**
	 * @param {string} categoryName
	 */
	ignore(categoryName) {
		let preset = filter_preset["s_" + categoryName];
		if (process.env.NODE_ENV !== 'production') {
			if (!preset) {
				let msg = "not found filter preset: " + categoryName;
				console.error(msg);
				alert(msg);
				return;
			}
		}
		this.maskBits = (this.maskBits & ~preset.categoryBits) >>> 0;

		preset.maskBits = (preset.maskBits & ~this.categoryBits) >>> 0;
	}

	/**
	 * @param {string} categoryName
	 */
	addCategory(categoryName) {
		let preset = filter_preset["s_" + categoryName];
		if (process.env.NODE_ENV !== 'production') {
			if (!preset) {
				let msg = "not found filter preset: " + categoryName;
				console.error(msg);
				alert(msg);
				return;
			}
		}
		this.categoryBits = this.categoryBits | preset.categoryBits;
	}

	/**
	 * @param {string} categoryName
	 * @param {string} debugName - 
	 */
	static get(categoryName, debugName) {
		let preset = filter_preset["s_" + categoryName];
		if (process.env.NODE_ENV !== 'production') {
			if (!preset) {
				let msg = "not found filter preset: " + categoryName;
				console.error(msg);
				alert(msg);
				return;
			}
		}
		if (debugName) {
			let debugCategory = filter_preset["s_" + debugName];
			console.warn("filter: " + debugName + "%o", debugCategory);
		}
		return preset;
	}

	/**
	 * @param {string} categoryName
	 */
	static registerCategory(categoryName) {
		if (process.env.NODE_ENV !== 'production') {
			if (filter_preset["s_" + categoryName]) {
				let msg = "exist filter preset: " + categoryName;
				console.error(msg);
				alert(msg);
				return;
			}
			if (next_category > 0x80000000) {
				let msg = "no empty filter preset";
				console.error(msg);
				alert(msg);
				return;
			}
		}
		let preset = filter_preset["s_" + categoryName] = new FilterHelper();

		preset.groupIndex = 0;
		preset.categoryBits = next_category;
		preset.maskBits = 0xFFFFFFFF;//all

		preset.name = categoryName;

		next_category = next_category << 1;

		return preset;
	}
}

let s_default, s_foot, s_foothold, s_body;

(function () {
	s_default = FilterHelper.registerCategory("default");//1

	s_foot = FilterHelper.registerCategory("foot");//2

	s_foothold = FilterHelper.registerCategory("foothold");//3
	
	s_body = FilterHelper.registerCategory("body");//4

	s_foothold.ignore("foot");
	s_foothold.ignore("foothold");

	if (!(s_default.categoryBits == 0b1 && s_default.maskBits == 0b11111111111111111111111111111111)) {
		debugger;
	}

	if (!(s_foot.categoryBits == 0b10 && s_foot.maskBits == 0b11111111111111111111111111111011)) {
		debugger;
	}

	if (!(s_foothold.categoryBits == 0b100 && s_foothold.maskBits == 0b11111111111111111111111111111001)) {
		debugger;
	}
})();

FilterHelper.registerCategory("bullet");

FilterHelper.registerCategory("mob_bullet");

FilterHelper.registerCategory("map_obj");

