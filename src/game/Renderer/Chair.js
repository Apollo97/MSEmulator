
import { IRenderer } from "../IRenderer.js";
import { Animation } from "../Animation.js";
import { LayerObject, Layer } from "./Layer.js";
import { SceneRenderer } from "./SceneRenderer.js";
import { RenderingOption } from "./RenderingOption.js";

import { CharacterRenderer } from "./CharacterRenderer.js";
import { SceneCharacter } from "../SceneCharacter.js";
import { Vec2 } from "../math.js";
import { ItemCategoryInfo, ResourceManager } from "../../../public/javascripts/resource.js";


class _ChairInfo {
	constructor() {
		/** @param {{x:number,y:number}} */
		this.bodyRelMove = null;
		this.price = 1;
		this.slotMax = 1;
		this.recoveryHP = 100;
		this.recoveryMP = 60;
		this.sitEmotion = 10;
		this.tradeBlock = 1;
		this.invisibleWeapon = 1;
	}
}

class _ChairEffect extends Array {
	constructor() {
		this.z = -1;
		this.pos = 1;
		
		///** @type {_SpriteData} */
		//this[0..N] = null;
	}
}

class _ChairData {
	constructor() {
		/** @type {_ChairInfo} */
		this.info = null;
		/** @type {_ChairEffect} */
		this.effect = null;
		/** @type {_ChairEffect} */
		this.effect2 = null;
	}
}

/**
 * @implements {LayerObject}
 */
class ChairEffect extends Animation {
	constructor(raw) {
		super(raw);
		
		this.is_loop = true;
		
		this.z = raw.z;
		this.pos = raw.pos;

		/** @type {Vec2} */
		this._offset = null;
		
		/** @type {Chair} */
		this._host = null;
	}
	
	/**
	 * @param {Chair} host
	 * @param {Vec2} offset
	 */
	init(host, offset) {
		this._host = host;
		this._offset = offset;
	}
	
	/** @override */
	isEnd() {
		const player = this._host._player;
		return !player.chair;
	}
	
	/**
	 * @param {SceneRenderer} sceneRenderer
	 */
	_addToScene(sceneRenderer) {
		const player = this._host._player;
		let layerIndex = player.$layer + this.z;
		layerIndex = layerIndex >= 0 ? layerIndex : 0;
		const layer = sceneRenderer.layers[layerIndex];
		layer.add(this);
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {RenderingOption} option
	 */
	render(renderer, option) {
		const crr = this._host._player.renderer;
		const x = crr.x;
		const y = crr.y;
		const angle = crr.angle;
		const flip = crr.front > 0;
		
		//renderer.globalAlpha = this.opacity * option.opacity;
		renderer.globalAlpha = option.opacity;

		if (this._offset) {
			const offset = this._offset;
			this.draw(renderer, x + offset.x, y + offset.y, 0, flip);
		}
		else if (this.pos == 1) {
			const oy = -this.texture.height * 0.5;
			this.draw(renderer, x, y + oy, 0, flip);
		}
		else {
			this.draw(renderer, x, y, angle, flip);
		}
	}
}

export class Chair {
	constructor() {
		/** @type {_ChairData} */
		this._raw = null;
		
		/** @type {SceneCharacter} - owner */
		this._player = null;
		
		/** @type {Vec2} */
		this.bodyRelMove = null;
		
		/** @type {string} */
		this.id = null;
		
		/** @type {ChairEffect[]} */
		this.effects = [];
		
		this.$promise = null;
	}
	
	/**
	 * @param {SceneCharacter} player
	 */
	init(player) {
		Object.defineProperties(this, {
			_player: {
				value: player,
			},
		});
	}
	
	/**
	 * @param {string} id
	 */
	async load(id) {//"03010377"
		if (!id.startsWith("0301")) {
			throw new TypeError("Not chair");
		}
		this.id = id;
		
		this.$promise = ResourceManager.getItem(id);
		const raw = await this.$promise;
		delete this.$promise;

		delete this._raw;
		Object.defineProperties(this, {
			_raw: {
				configurable: false,
				writable: false,
				value: raw,
			},
		});

		let offset;

		if (this._raw.info.bodyRelMove) {
			this.bodyRelMove = new Vec2(this._raw.info.bodyRelMove.x, this._raw.info.bodyRelMove.y);
		}
		else if (raw.effect && raw.effect[0].origin.y < 0) {
			//let w = raw.effect[0].__w;
			let h = raw.effect[0].__h;
			offset = new Vec2(0, -h * 1.5);
		}
		if (raw.effect[0].origin.y == 0) {
			debugger;
		}
		
		for (let key in raw) {
			if (key.startsWith("effect")) {
				const eff = new ChairEffect(raw[key]);
				eff.init(this, offset);
				eff.load();//Animation#load => load texture
				this.effects.push(eff);
			}
		}
	}
	
	/**
	 * @param {SceneRenderer} sceneRenderer
	 */
	addToScene(sceneRenderer) {
		for (let eff of this.effects) {
			eff._addToScene(sceneRenderer);
		}
	}
	
	getIconUrl() {
		return this._raw.info.icon[""];
	}
	getIconRawUrl() {
		return this._raw.info.iconRaw[""];
	}
}
