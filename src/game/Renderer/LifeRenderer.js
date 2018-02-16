
import { Sprite } from "../Sprite.js";
import { Animation } from "../Animation.js";


export class LifeRenderer /*extends SceneObject*/ {
	constructor() {
		//super();

		/** @type {string} */
		this._url = "";
		
		/** @type {string} */
		this.id = null;

		/** @type {Object.<string, Animation>} */
		this.actions = {};

		/** @type {string} */
		this._action = "stand";//static default
		
		this._raw = null;
	}
	
	get name() {
		return this.constructor._desc[this.id].name;
	}
	
	getDefaultAction() {
		if (this.actions.stand) {
			return "stand";
		}
		else if(this.actions.fly) {
			return "fly";
		}
		alert("default must is 'stand' or 'fly'");
		return new Error("default must is 'stand' or 'fly'");
	}
	
	/** @type {string} */
	get action() {
		return this._action;
	}
	set action(act) {
		this._action = act;
		if (this.actions[act]) {
			this.actions[act].reset();
		}
	}

	///**
	// * @param {string} act
	// */
	//setAction(act) {
	//	throw new Error("Not implement");
	//}
	
	/**
	 * @param {string} id
	 */
	async load(id) {
		let tasks = [];
		let that = this;
		this.id = id;//"8880140";//"8880141";//"8880150";//"8880151";
		this._url = [this.constructor._base_path, this.id + ".img/"].join("/");
		
		if (!this.constructor._desc[id]) {
			let task = this.constructor.loadDescription(id);
			tasks.push(task);
		}

		let task = $get.data(this._url).then(async function (raw) {
			that._raw = JSON.parse(raw);
			if (that._raw) {
				await that._construct_actions();
				
				that._action = that.getDefaultAction();//set default action; is fly mob ?
			}
			else {
				debugger;
			}
		});
		tasks.push(task);

		return Promise.all(tasks);
	}
	async _construct_actions() {
		var tasks = [];

		for (var i = 0; i < this.constructor._animations.length; ++i) {
			var t = this.constructor._animations[i];

			for (var $index = 1; ; ++$index) {
				let action;
				var name = eval(t);

				if (!(name in this._raw)) {
					break;
				}

				action = new Animation(this._raw[name], this._url + name);
				action.is_loop = false;
				
				tasks.push(action.load());
				
				this.actions[name] = action;

				if (!name.endsWith($index)) {
					break;
				}
			}
		}

		await Promise.all(tasks);
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this.actions[this.action]) {
			const ani = this.actions[this.action];
			
			ani.update(stamp);
				
			if (ani.isEnd()) {
				this.action = this.getDefaultAction();//default loop action: stand
				this.actions[this.action].update(stamp);
			}
		}
	}

	/**
	 * paint
	 * @param {Engine} engine
	 * @param {number} x
	 * @param {number} y
	 * @param {number} angle
	 * @param {boolean} flip
	 */
	draw(engine, x, y, angle, flip) {
		if (this.actions[this.action]) {
			/** @type {Animation} */
			const act = this.actions[this.action];
			act.draw(engine, x, y, angle, flip);
		}
	}
	paint(engine) {
		debugger;
		alert("Not Implement");
		render(engine);
	}
	
	/**
	 * @param {string} id
	 */
	static async loadDescription(id) {
		alert("Not Implement");
	}

	static get _animations() {
		throw new Error("Not implement");
	}
	
	static _get_desc_base_path() {
		throw new Error("Not implement");
	}

	static get _base_path() {
		throw new Error("Not implement");
	}
}
