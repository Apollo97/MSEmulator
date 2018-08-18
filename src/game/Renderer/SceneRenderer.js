
import { LayerObject, Layer } from "./Layer.js"
import { RenderingOption } from "./RenderingOption";


/**
 * @implements {LayerObject}
 */
class SceneRenderer {
	constructor() {
		/** @type {Layer[]} */
		this.layers = [];
		
		/** @type {RenderingOption} */
		this.rendering_option = new RenderingOption();
	}
	
	/**
	 * @param {number} amount
	 */
	addLayerBack(amount) {
		for (let i = 0; i < amount; ++i) {
			this.layers.push(new Layer()); 
		}
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		for (let layer of this.layers) {
			layer.update(stamp);
		}
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {number} layerIndex
	 */
	renderLayer(renderer, layerIndex) {
		const layer = this.layers[layerIndex];
		layer.render(renderer, this.rendering_option);
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	_renderAll(renderer) {
		for (let layer of this.layers) {
			layer.render(renderer, this.rendering_option);
		}
	}
}

export const sceneRenderer = new SceneRenderer();

window.$sceneRenderer = sceneRenderer;

