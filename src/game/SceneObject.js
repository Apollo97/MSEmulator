
export class SceneObject {
	constructor() {
		this.$uid = null;	//null if not in scene
		this.$layer = null;	//maybe override
		this.$physics = null;
		this.renderer = null;
	}
	
	/** create physics, load resource, ... */
	create() {
	}
	/** destroy physics, ... */
	destroy() {
	}
	
	set enablePhysics(value) {
		if (this.$physics) {
			this.$physics.disable = !value;
		}
	}
	get enablePhysics() {
		if (this.$physics) {
			return !this.$physics.disable;
		}
		return false;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
	}

	/**
	 * @param {IRenderer} renderer
	 */
	render(renderer) {
		this.renderer.render(renderer);
	}

	_applyState() {
		throw new Error("Not implement");
	}

	EnablePhysics(value) {
		debugger
		this.$physics.disable = value;
	}
}


