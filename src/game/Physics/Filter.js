
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
				return filter_preset.s_default;
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

	static get next_category() {
		return filter_preset;
	}
	static get filter_preset() {
		return filter_preset;
	}
}

const filter_table = [
/*                 default    body    foothold    foot    bullet    pvp_bullet    mob    mob_bullet    map_obj */
/* default */    [ 1,         1,      1,          1,      1,        1,            1,     1,            1,     ],
/* body */       [ 1,         0,      0,          0,      0,        1,            1,     1,            1,     ],
/* foothold */   [ 1,         0,      0,          1,      0,        0,            0,     0,            1,     ],
/* foot */       [ 1,         0,      1,          0,      0,        0,            0,     0,            0,     ],
/* bullet */     [ 1,         0,      0,          0,      0,        0,            1,     0,            0,     ],
/* pvp_bullet */ [ 1,         1,      0,          0,      0,        0,            1,     0,            0,     ],
/* mob */        [ 1,         1,      0,          0,      1,        1,            0,     0,            0,     ],
/* mob_bullet */ [ 1,         1,      0,          0,      0,        0,            0,     0,            0,     ],
/* portal */     [ 1,         1,      0,          0,      0,        0,            0,     0,            0,     ],
/* map_obj */    [ 1,         1,      0,          0,      0,        0,            0,     0,            0,     ],
/* map_border */ [ 1,         1,      0,          1,      0,        0,            1,     0,            0,     ],
/*  */
];

let filter_list = [
	FilterHelper.registerCategory("default"),
	FilterHelper.registerCategory("body"),
	FilterHelper.registerCategory("foothold"),
	FilterHelper.registerCategory("foot"),
	FilterHelper.registerCategory("bullet"),
	FilterHelper.registerCategory("pvp_bullet"),
	FilterHelper.registerCategory("mob"),
	FilterHelper.registerCategory("mob_bullet"),
	FilterHelper.registerCategory("portal"),
	FilterHelper.registerCategory("map_obj"),
	FilterHelper.registerCategory("map_border"),
];

for (let i = 0; i < filter_table.length; ++i) {
	for (let j = 0; j < filter_table[i].length; ++j) {
		if (!filter_table[i][j]) {
			filter_list[i].maskBits = (filter_list[i].maskBits & ~(1 << j)) >>> 0;//uint32
		}
	}
}

(function () {
	const s_default = filter_list[0];
	if (!(s_default.categoryBits == 0b1 && s_default.maskBits == 0b11111111111111111111111111111111)) {
		debugger;
	}

	const s_foothold = filter_list[2];
	if (!(s_foothold.categoryBits == 0b100 && s_foothold.maskBits == 0b11111111111111111111111100001001)) {
		debugger;
	}

	const s_foot = filter_list[3];
	if (!(s_foot.categoryBits == 0b1000 && s_foot.maskBits == 0b11111111111111111111111000000101)) {
		debugger;
	}
})();

