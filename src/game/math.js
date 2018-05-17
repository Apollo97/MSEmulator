
export class Vec2 {
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	constructor(x, y) {
		if (arguments.length > 1) {
			this.x = x;
			this.y = y;
		}
		else if (arguments.length == 1 && x != null) {
			this.x = x.x | 0;
			this.y = x.y | 0;
		}
		else {
			this.x = 0;
			this.y = 0;
		}
	}
	static get() {
		return new Vec2(...arguments);
	}
	static get empty() {
		return new Vec2(0, 0);
	}
	/**
	 * @returns {Vec2}
	 */
	clone() {
		return new this.constructor(this.x, this.y);
	}

	/**
	 * @param {...Vec2} v2
	 * @returns {Vec2}
	 */
	add(v2) {
		let x = this.x, y = this.y;
		for (let v of arguments) {
			if (v == null)
				continue;
			x = x + v.x;
			y = y + v.y;
		}
		return new Vec2(x, y);
	}
	/**
	 * @param {...Vec2} v2
	 * @returns {Vec2}
	 */
	sub(v2) {
		let x = this.x, y = this.y;
		for (let v of arguments) {
			if (v == null)
				continue;
			x = x - v.x;
			y = y - v.y;
		}
		return new Vec2(x, y);
	}

	/** @param {Vec2} v */
	plus(v) {
		return new Vec2(this.x + v.x, this.y + v.y);
	}
	/** @param {Vec2} v */
	minus(v) {
		return new Vec2(this.x - v.x, this.y - v.y);
	}

	/**
	 * @param {number} x
	 * @param {number} y
	 */
	plus2(v) {
		return new Vec2(this.x + x, this.y + y);
	}
	/**
	 * @param {number} x
	 * @param {number} y
	 */
	minus2(v) {
		return new Vec2(this.x - x, this.y - y);
	}

	/**
	 * @param {number} floatVar
	 */
	mul(floatVar) {
		return new Vec2(this.x * floatVar, this.y * floatVar);
	}

	/**
	 * @param {number} s
	 */
	scale(s) {
		return new Vec2(this.x * s, this.y * s);
	}

	rotate(ang) {
		let x = Math.cos(ang) * this.x - Math.sin(ang) * this.y;
		let y = Math.sin(ang) * this.x + Math.cos(ang) * this.y;
		return new Vec2(x, y);
	}

	normalize() {
		let r = Math.sqrt(this.x * this.x + this.y * this.y);
		return new Vec2(this.x / r, this.y / r);
	}

	length() {
		return Math.sqrt(x ** 2 + y ** 2);
	}

	/**
	 * @param {Vec2} p2
	 */
	distance_sq(p2) {
		let lx = this.x - p2.x;
		let ly = this.y - p2.y;
		return lx * lx + ly * ly;
	}

	/**
	 * @param {Vec2} p2
	 */
	distance(p2) {
		let lx = this.x - p2.x;
		let ly = this.y - p2.y;
		return Math.sqrt(lx * lx + ly * ly);
	}
}

export class Rectangle {
	/**
	 * Rectangle(left: number, top: number, width: number, height: number)
	 * Rectangle(position: Vec2, size: Vec2)
	 * Rectangle(rect: Rectangle)
	 * Rectangle() => Rectangle(0, 0, 0, 0)
	 */
	constructor() {
		if (arguments.length == 4) {
			/** @type {number} */
			this.left = arguments[0];//x
			/** @type {number} */
			this.top = arguments[1];//y
			/** @type {number} */
			this.width = arguments[2];//w
			/** @type {number} */
			this.height = arguments[3];//h
		}
		else if (arguments.length == 2) {
			/** @type {number} */
			this.left = arguments[0].x;
			/** @type {number} */
			this.top = arguments[0].y;
			/** @type {number} */
			this.width = arguments[1].x;
			/** @type {number} */
			this.height = arguments[1].y;
		}
		else if (arguments[0] instanceof Rectangle) {
			const r = arguments[0];
			/** @type {number} */
			this.left = r.left;
			/** @type {number} */
			this.top = r.top;
			/** @type {number} */
			this.width = r.width;
			/** @type {number} */
			this.height = r.height;
		}
		else {
			/** @type {number} */
			this.left = 0;
			/** @type {number} */
			this.top = 0;
			/** @type {number} */
			this.width = 0;
			/** @type {number} */
			this.height = 0;
		}
	}
	
	clone() {
		return new Rectangle(this);
	}

	get x() { return this.left; }
	set x(value) { this.left = value; }

	get y() { return this.top; }
	set y(value) { this.top = value; }

	get right() { return this.left + this.width; }
	set right(value) { this.width = value - this.left; }

	get bottom() { return this.top + this.height; }
	set bottom(value) { this.height = value - this.top; }

	get size() {
		return new Vec2(this.width, this.height);
	}
	set size(value) {
		this.width = value.width || value.x;
		this.height = value.height || value.y;
	}

	get center() {
		return new Vec2(this.left + this.width * 0.5, this.top + this.height * 2 / 3);
	}
	set center(value) {
		let w2 = this.width * 0.5;
		let h23 = this.height * 2 / 3;

		this.left = value.x - w2;
		this.top = value.y - h23;
	}
	setCenter(cx, cy) {
		let w2 = this.width * 0.5;
		let h23 = this.height * 2 / 3;

		this.left = cx - w2;
		this.top = cy - h23;
	}
	
	collide(other) {
		return (this.left < other.right && this.right > other.left && this.top < other.bottom && this.bottom > other.top);
	}
	
	collide4f(left, right, top, bottom) {
		return (this.left < right && this.right > left && this.top < bottom && this.bottom > top);
	}
	collide4f2(x, y, hwidth, hheight) {
		const left = x - hwidth;
		const top = y - hheight;
		const right = x + hwidth;
		const bottom = y + hheight;
		return (this.left < right && this.right > left && this.top < bottom && this.bottom > top);
	}
	collide2f2x(x, hwidth) {
		const left = x - hwidth;
		const right = x + hwidth;
		return (this.left < right && this.right > left);
	}
	collide2f2y(y, hheight) {
		const top = y - hheight;
		const bottom = y + hheight;
		return (this.top < bottom && this.bottom > top);
	}
	
	static parse(left, top, right, bottom) {
		return new Rectangle(left, top, right - left, bottom - top);
	}
}

export class Randomizer {
	static nextInt(r) {
		return Math.trunc(Math.random() * 100 % r);
	}
	static randInt(min, max) {
		return Math.trunc(min + Math.random() * 100 % (max - min + 1));
	}
	static nextBoolean() {
		return !(Math.trunc(Math.random() * 100) & 1);
	}
}

export function clamp(value, min, max) {
	return Math.max(min, Math.min(value, max));
}

