
import box2d from "../../../public/box2d-html5.js";

import { Randomizer } from "../math.js";

import { Animation } from "../Animation.js";
import { SceneObject } from "../SceneObject.js";

export class MobSkillBallDefinition {
	constructor() {
		this.createDelay = 0;
		this.collisionDelay = 0;
		this.duration = 0;
		
		this.moveSpeed = 0;
		this.angle = 0;
		
		this.flip = false;
		this.x = 0;
		this.y = 0;
		this._speed_x = 0;//uint: px/second
		this._speed_y = 0;//uint: px/second
	}
}

export class MobSkillBallBase extends SceneObject {
	/**
	 * @param {MobSkillBallDefinition} ballDef
	 * @param {{[string]:Animation} animations
	 */
	constructor(ballDef, animations) {
		super();
		
		ballDef = Object.assign(new this._BallDefinition(), ballDef);
		
		this.createDelay = ballDef.createDelay;
		this.collisionDelay = ballDef.collisionDelay;
		this.duration = ballDef.duration;
		
		this.moveSpeed = ballDef.moveSpeed;
		this.angle = ballDef.angle * Math.PI / 180;//deg to rad
		
		this.x = ballDef.x;
		this.y = ballDef.y;
		
		if (this.moveSpeed) {
			this._speed_x = Math.cos(this.angle + Math.PI) * this.moveSpeed;//uint: px/second
			this._speed_y = Math.sin(this.angle + Math.PI) * this.moveSpeed;//uint: px/second
		}
		else {
			this._speed_x = 0;//uint: px/second
			this._speed_y = 0;//uint: px/second
		}
		
		this.state = this.E_BEFORE_CREATE;
	}
	
	get E_BEFORE_CREATE() { return 0; }
	get E_CREATED() { return 1; }
	get E_BEGIN_COLLISION() { return 2; }
	get E_ENG_COLLISION() { return 3; }
	
	/** @param {PWorld} pWorld */
	create(pWorld) {
		this.state = this.E_CREATED;
		if (this.collisionDelay > 0) {
			this.enablePhysics = false;
		}
	}
	
	begin_collision() {
		this.enablePhysics = true;
		this.state = this.E_BEGIN_COLLISION;
	}
	
	end_collision() {
		this.enablePhysics = false;
		this.state = this.E_ENG_COLLISION;
	}
	
	/**
	 * debug
	 * @param {PWorld} pWorld
	 */
	update(stamp, pWorld) {
		if (this.state == this.E_BEFORE_CREATE) {
			this.createDelay -= stamp;
			if (this.createDelay <= 0) {
				this.create();
			}
		}
		else {
			if (this.state == this.E_CREATED) {
				this.collisionDelay -= stamp;
				if (this.collisionDelay <= 0) {
					this.begin_collision();
				}
			}
			else if (this.state == this.E_BEGIN_COLLISION) {
				if (this.duration > 0) {
					this.duration -= stamp;
					if (this.duration) {
						this.end_collision();
					}
				}
			}
			if (!window.$stop) {//debug
				this.x += this._speed_x * stamp / 1000;//debug
				this.y += this._speed_y * stamp / 1000;//debug
			}
			this.renderer.update(stamp);
		}
	}
	
	/**
	 * @param {IRenderer} engine
	 */
	render(engine) {
		if (this.state != this.E_BEFORE_CREATE) {
			const flip = this.flip;
			this.renderer.draw(engine, this.x, this.y, this.angle, flip);
		}
	}
	
	get _BallDefinition() {
		throw new Error("Not implement");
	}
}

export class MobSkillBase {
	constructor(_raw, _url) {
		this._raw = _raw;
		this._url = _url;
		
		this.level = null;
		
		this.animations = {};
	}
	
	/** @param {number} level */
	async load(level) {
		this.level = level;
		
		if (!this._raw && !this._url) {
			this._url = [this._base_path, level].join("/");
			
			this._raw = JSON.parse(await ajax_get("/assets/" + this._url));
		}
		
		for (let name of this._anima_name_list) {
			//name = "ball0";
			let anima = new Animation(this._raw[name], [this._url, name].join("/"));
			anima.is_loop = true;
			anima.load();
			this.animations[name] = anima;
		}
	}
	
	/** @returns {void} */
	invoke() {
		throw new Error("Not implement");
	}
	
	/** @returns {string[]} */
	get _anima_name_list() {
		throw new Error("Not implement");
	}
	
	/** @returns {string} */
	get _base_path() {
		throw new Error("Not implement");
	}
}

