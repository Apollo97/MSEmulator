

import { } from '../../public/resource.js';

import { IGraph } from "./IRenderer.js";
import { engine } from './Engine.js';
import { Vec2, Rectangle } from './math.js';


window.m_is_run = true;

(function () {
	window.MAX_FPS = 60;
	window.FRAME_ELAPSED = 1000 / 60;
	window.CANVAS_SCALE = 32;

	window.m_display_physics_debug = false;
	window.m_display_debug_info = false;
})();

(function () {
	window.input_keyDown = {};
	window.input_keyUp = {};

	window.mouse_move = 0;
	window.mouse_x = 0;
	window.mouse_y = 0;
	window.mouse_dl = 0;
	window.mouse_ul = 0;
	window.mouse_dm = 0;
	window.mouse_um = 0;
	window.mouse_dr = 0;
	window.mouse_ur = 0;
})();

(function () {
	window.m_viewRect = new Rectangle(0, -768 / 2, 1366, 768);

	window.m_is_rendering_map = true;

	window.m_display_back = true;
	window.m_display_front = true;
	window.m_display_mapobj = true;
	window.m_display_maptile = true;
	window.m_display_particle_system = true;

	window.m_display_skeletal_anim = true;

	window.m_display_portal = true;

	window.m_display_player = true;
	window.m_display_life = true;

	//window.m_display_skill;
	//window.m_display_mob_skill;
	//window.m_display_mob_effect = true;
	//window.m_display_mob_etc = true;
})();

(function () {
	window.m_editor_mode = true;

	window.m_display_foothold = false;

	window.m_display_selected_object = false;
	window.m_selected_object = null;
	window.m_hover_object = null;
})();


(function () {
	window.SceneObjectMgr = {};

	SceneObjectMgr.layeredObjects = [];
	for (let i = 0; i < 12; ++i) {
		let lo = SceneObjectMgr.layeredObjects[i] = {};
		Object.defineProperty(lo, "length", {
			enumerable: false,
			writable: true,
			value: 0,
		});
	}

	SceneObjectMgr.Update = function (stamp) {
		for (let layer = 0; layer < SceneObjectMgr.layeredObjects.length; ++layer) {
			const lo = SceneObjectMgr.layeredObjects[layer];
			for (let uid in lo) {
				let obj = lo[uid];
				obj.update(stamp);
			}
		}
	}
	SceneObjectMgr.RenderLayer = function (engine, layer) {
		const lo = SceneObjectMgr.layeredObjects[layer];
		for (let uid in lo) {
			let obj = lo[uid];
			obj.render(engine);
		}
	}

	SceneObjectMgr.addToScene = function (layer, obj) {
		if (Number.isSafeInteger(layer) && layer in SceneObjectMgr.layeredObjects) {
			const lo = SceneObjectMgr.layeredObjects[layer];
		
			obj.$layer = layer;
			obj.$uid = lo.length;
		
			lo[obj.$uid] = obj;
		
			lo.length++;
		}
		else {
			throw new TypeError("layer");
		}
	}
	SceneObjectMgr.destroy = function (obj) {
		const layer = obj.$layer;
		const uid = obj.$uid;
		const lo = SceneObjectMgr.layeredObjects[layer];
	
		obj.destroy();
	
		delete lo[uid];
	}
})();
