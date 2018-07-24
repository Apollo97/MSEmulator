

export class CursorPicker {
	constructor() {
		/** @type {string} */
		this.type = null;
		/** @type {any} */
		this.data = null;
	}
}


export class CursorAnimationFrame {
	constructor() {
		/** @type {string} */
		this.url = null;
		/** @type {number} */
		this.x = 0;
		/** @type {number} */
		this.y = 0;
		/** @type {number} - time in millisecond */
		this.delay = 0;
	}
}

export class CursorAnimationData {
	constructor() {
		/** @type {CursorAnimationFrame[]} */
		this.frames = [];

		/** @type {number} - time in millisecond */
		this.duration = 0;
	}
	/**
	 * @param {string} url
	 * @returns {Promise<number>} - index
	 */
	async addFrameFromUrl(url) {
		let raw = await $get.data(url);
		return this.addFrame("/images" + url, raw.origin.x, raw.origin.y, raw.delay);
	}
	/**
	 * @param {string} url
	 * @param {number} x
	 * @param {number} y
	 * @param {number} delay
	 * @returns {number} - index
	 */
	addFrame(url, x, y, delay) {
		if (!url) {
			throw new TypeError();
		}
		const i = this.frames.length;
		let frame = new CursorAnimationFrame();

		frame.url = url;
		frame.x = x | 0;
		frame.y = y | 0;
		frame.delay = delay | 0;

		this.frames.push(frame);

		this.duration += frame.delay; 

		return i;
	}
	async load(url) {
		let raw = await $get.data(url);

		for (let i = 0, frame = raw[i]; frame; ++i, frame = raw[i]) {
			let img = {};

			this.addFrame(
				["/images", url, i].join("/"),
				frame.origin.x,
				frame.origin.y,
				frame.delay
			);
		}
	}
}


export class Cursor  {
	constructor(/*raw, url*/) {
		///** @type {Animation} */
		//this.ani = null;
	}
	//async createAnimation(url) {
	//	let raw = await $get.data(url);
	//	this.ani = new Animation(raw, url);
	//	await this.ani.load();
	//}

	/**
	 * @param {CursorAnimationData} data
	 * @param {string} selector
	 * @param {string} keyword
	 */
	static createToCSS(data, selector, keyword) {
		const id = "Cursor" + Math.trunc(Math.random() * 0xFFFFFFFF).toString(16);

		const { frames, duration } = data;

		let cssText = `${selector}:hover {\n`;

		cssText += `cursor: url(${frames[0].url}) ${frames[0].x} ${frames[0].y}, ${keyword};\n`;

		if (duration) {
			cssText += `animation-name: ${id}_keyframes;\n`;
			cssText += `animation-duration: ${duration}ms;\n`;
			cssText += `animation-iteration-count: infinite;\n`;
			cssText += "}\n";

			let tt = 0;
			{
				cssText += `@keyframes ${id}_keyframes {\n`;

				for (let i = 0; i < frames.length; ++i) {
					const frame = frames[i];

					let start = Math.trunc((tt / duration) * 100);

					cssText += `${start}% { cursor: url(${frames[i].url}) ${frames[i].x} ${frames[i].y}, ${keyword}; }\n`;

					tt += frame.delay;
				}
				//cssText += `100% { cursor: url(${frames[0].url}) ${frames[0].x} ${frames[0].y}; }\n`;

				cssText += "}\n";
			}
		}
		else {
			cssText += "}";
		}
		
		var x = document.createElement("STYLE");
		var t = document.createTextNode(cssText);
		x.id = id;
		x.appendChild(t);
		document.head.appendChild(x);

		return x;
	}
}
