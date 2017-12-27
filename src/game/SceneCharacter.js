
import { SceneObject } from "./SceneObject.js";
import { CharacterRenderer } from "./Renderer/CharacterRenderer.js";
import { PPlayer, PPlayerState } from "./Physics/PPlayer.js";

import { SkillAnimation } from "./Skill.js";


/**
 * @type {{[x:string]:string}[]}
 */
const keyboard_map = [{
	ArrowUp: "up",
	ArrowLeft: "left",
	ArrowDown: "down",
	ArrowRight: "right",
	z: "jump",
	x: "skill_1",
	c: "skill_2",
	v: "skill_3",
},
{
	w: "up",
	a: "left",
	s: "down",
	d: "right",
	q: "jump",
	x: "skill_1",
	c: "skill_2",
	v: "skill_3",
}];

export class SceneCharacter extends SceneObject {
	constructor() {
		super();

		/** @type {PPlayer} */
		this.$physics = null;//new PPlayer();

		/** @type {CharacterRenderer} */
		this.renderer = new CharacterRenderer();

		this.$layer = 5;
	}
	
	update(stamp) {
		if (m_editor_mode) {
			if (this.renderer.speed > 0 && this.$physics && !this.$physics.disable) {
				this._applyState({
					//front: this.renderer.front,
				});
			}
		}
		else if (this.$physics) {
			this._applyState(this.$physics.state);
		}

		if (this.$physics) {
			if (this.renderer && !this.$physics.disable) {
				const pos = this.$physics.getPosition();
				const px = Math.trunc(pos.x * CANVAS_SCALE + 0.5);
				const py = Math.trunc(pos.y * CANVAS_SCALE + 0.5);

				this.renderer.x = px;
				this.renderer.y = py;

				this.$layer = this.$physics.getLayer();
			}
		}
		
		if (this.skill) {
			if (this.skill.isEnd()) {
				this.skill = null;
			}
			else {
				this.skill.update(stamp, this);
			}
		}
		
		if (this.$physics) {
			let ikey = {};
			for (let i in input_keys) {
				const k = keyboard_map[m_editor_mode ? 1 : 0][i];
				if (k) {
					ikey[k] = input_keys[i];
				}
			}
			if (this.skill == null) {
				if (ikey.skill_1) {
					let skill = new SkillAnimation();
					skill.owner = this;
					skill.load("1001005");
					this.skill = skill;
				}
				else if (ikey.skill_2) {
					let skill = new SkillAnimation();
					skill.owner = this;
					skill.load("64120000");
					this.skill = skill;
				}
				else if (ikey.skill_3) {
					let skill = new SkillAnimation();
					skill.owner = this;
					skill.load("152001001");
					this.skill = skill;
				}
			}
			if (this.skill) {
				ikey.up = 0;
				ikey.left = 0;
				ikey.down = 0;
				ikey.right = 0;
			}
			this.$physics.control(ikey);
		}

		this.renderer.update(stamp);
	}

	/**
	 * @param {PPlayerState} player_state
	 */
	_applyState(player_state) {
		const { front, jump, walk, prone, fly } = player_state;
		const charaRenderer = this.renderer;

		if (front != null) {
			charaRenderer.front = front;
		}

		if (jump) {
			charaRenderer.action = "jump";
		}
		else if (walk) {
			charaRenderer.action = "walk1";
		}
		else if (prone) {
			charaRenderer.action = "prone";
		}
		else if (fly) {
			charaRenderer.action = "fly";
		}
		else {
			charaRenderer.action = "stand1";
		}

		for (let i = 0; i <= 9; ++i) {
			if (input_keys[i]) {
				let a = [
					"blink", "hit", "smile",
					"troubled", "cry", "angry",
					"bewildered", "stunned", "vomit",
					"oops"
				];
				let e = a[i % a.length];
				charaRenderer.emotion = e;
			}
		}
	}
}
