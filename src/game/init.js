﻿

import { } from '../../public/javascripts/resource.js';

import { IGraph } from "./IRenderer.js";
import { engine } from './Engine.js';
import { Vec2, Rectangle } from './math.js';
import DebugDraw from './Physics/DebugDraw.js';

export class GlobalVar {
	constructor() {
		let isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		if (isMobile) {
			this.is_mobile = true;
		}

		if (isMobile) {
			this.m_is_run = false;
		}
		else {
			this.m_is_run = true;
		}

		{
			this.MAX_FPS = 60;
			this.FRAME_ELAPSED = 1000 / 60;
			this.CANVAS_SCALE = 32;
		}

		{
			if (process.env.NODE_ENV === 'production') {
				this.m_editor_mode = false;

				this.m_display_foothold = false;

				this.m_display_physics_debug = false;
			}
			else {
				this.m_editor_mode = false;

				this.m_display_foothold = false;

				this.m_display_physics_debug = true;
			}
			this.m_display_debug_info = false;

			this.m_debugDraw = new DebugDraw(/*renderer_ctx2d*/);

			this.m_display_selected_object = false;
			this.m_selected_object = null;
			this.m_hover_object = null;
		}

		{
			this.m_viewRect = new Rectangle(0, -768 / 2, 1366, 768);

			if (process.env.NODE_ENV === 'production') {
				this.m_is_rendering_map = true;
			}
			else {
				this.m_is_rendering_map = true;
			}

			if (process.env.NODE_ENV === 'production') {
				this.m_display_back = true;
				this.m_display_front = true;
				this.m_display_mapobj = true;
				this.m_display_maptile = true;
				this.m_display_particle_system = true;

				this.m_display_skeletal_anim = true;
			}
			else {
				this.m_display_back = false;
				this.m_display_front = false;
				this.m_display_mapobj = false;
				this.m_display_maptile = false;
				this.m_display_particle_system = false;

				this.m_display_skeletal_anim = false;
			}

			this.m_display_portal = true;

			if (process.env.NODE_ENV === 'production') {
				this.m_display_name_label = true;
			}
			else {
				this.m_display_name_label = false;
			}

			this.m_display_player = true;
			this.m_display_other_player = true;
			this.m_display_life = true;
			this.m_display_npc = true;//??
			this.m_display_mob = true;//??

			//this.m_display_skill;
			//this.m_display_mob_skill;
			//this.m_display_mob_effect = true;
			//this.m_display_mob_etc = true;
		}
		
		{
			this.NameLabel_default_style = "214";

			this.ChatBalloon_default_style = "212";
			this.ChatBalloon_display_duration = 5000;
		}
		
		{
			this.input_keyDown = {};
			this.input_keyUp = {};

			this.mouse_move = 0;
			this.mouse_x = 0;
			this.mouse_y = 0;
			this.mouse_dl = 0;
			this.mouse_ul = 0;
			this.mouse_dm = 0;
			this.mouse_um = 0;
			this.mouse_dr = 0;
			this.mouse_ur = 0;
		}

		{
			let SceneObjectMgr = {};

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
					obj.$objectid = lo.length;

					lo[obj.$objectid] = obj;

					lo.length++;
				}
				else {
					throw new TypeError("layer");
				}
			}
			SceneObjectMgr.destroy = function (obj) {
				const layer = obj.$layer;
				const uid = obj.$objectid;
				const lo = SceneObjectMgr.layeredObjects[layer];

				obj.destroy();

				delete lo[uid];
			}

			this.SceneObjectMgr = SceneObjectMgr;
		}
	}
}

export const $gv = new GlobalVar();

window.$gv = $gv;
