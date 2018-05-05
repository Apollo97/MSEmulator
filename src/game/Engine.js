
import { Engine } from "./Canvas2DRenderer.js";
//import { Engine } from "./WebGLRenderer.js";

export const engine = new Engine();

window.$engine = engine;

/**
 * @type {IGraph}
 */
export const Graph = engine.Graph;


engine.init("glcanvas");

if (SSAnim) {
	if (engine.ctx) {
		SSAnim.SetRenderingContext(engine.ctx);
	}
}
