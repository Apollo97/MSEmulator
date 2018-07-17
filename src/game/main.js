
import { } from './init.js';
import { Vec2, Rectangle } from './math.js';
import { IGraph, IRenderer } from './IRenderer.js';
import { engine, Graph } from './Engine.js';
import { Animation } from './Animation.js';

import { GameStateManager } from './GameState.js';
import { SceneMap } from './Map.js';
//import { SceneCharacter } from './SceneCharacter.js';

import { EffectManager } from "./Skill.js";
import { } from "./MobSkill/238.FairyDust.js";

import { damageNumberLayer } from "./Renderer/DamageNumber.js";

import { Cursor, CursorAnimationData } from "./Cursor.js";

import { Client } from "../Client/Client.js";


import { SceneCharacter } from "./SceneCharacter.js";//debug
import gApp from "../app.js";//debug


window.SCREEN_PRINTLN = function (getText, getValue) {
	if (arguments.length == 2) {
		window._SCREEN_PRINTLN.push({ getText, getValue });
	}
	else if (arguments.length == 1) {
		window._SCREEN_PRINTLN.push(arguments[0]);
	}
}
window._SCREEN_PRINTLN = [];

var animationRequestID = null;

window.addEventListener("popstate", function (e) {
	GameStateManager.PopState(e.state);
});


///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

function createCursor_clickable() {
	let data = new CursorAnimationData();

	let task1 = data.addFrameFromUrl("/UI/Basic.img/Cursor/0/0").then(function (i) {
		data.frames[i].delay = 200;
	});

	let task2 = data.addFrameFromUrl("/UI/Basic.img/Cursor/12/0").then(function (i) {
		data.frames[i].delay = 200;
	});

	return Promise.all([task1, task2]).then(function () {
		data.duration = 400;

		Cursor.createToCSS(data, ".ui-clickable", "pointer");
	});
}

createCursor_clickable();

///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////


/**
 * @param {KeyboardEvent} e
 */
window.onkeydown = function (e) {
	if (e.target != document.body) {
		return;
	}
	let k = e.key;

	if (k != null && !$gv.input_keyDown[k]) {
		$gv.input_keyDown[k] != null ? (++$gv.input_keyDown[k]) : ($gv.input_keyDown[k] = 1);
	}

	if (e.code == 'Space') {
		$("#m_is_run").click();
	}
	if (e.code == "F2") {
		$gv.m_editor_mode = !$gv.m_editor_mode;

		app.vue.editor_mode = $gv.m_editor_mode;

		app.vue.$refs.statusBar.myUpdate();
	}
}

window.onkeyup = function (e) {
	if (e.target != document.body) {
		return;
	}
	let k = e.key;

	if (k != null && $gv.input_keyDown[k]) {
		$gv.input_keyDown[k] = 0;
		$gv.input_keyUp[k] = 1;
	}
}

Object.defineProperty(window, "$m_is_run", {
	get: function () {
		return $("#m_is_run").attr("checked");
	}, 
	set: function (value) {
		$("#m_is_run").attr("checked", !value);
		$("#m_is_run").click();
	}
});

/**
 * @param {MouseEvent} e
 */
window.onmousedown = function (e) {
	if ($gv.m_editor_mode) {
		if (!e.target.classList.contains("Editor")) {
			return;
		}
	}
	if (e.which == 1) {
		$gv.mouse_dl = 1;
		$gv.mouse_ul = 0;
	}
	else if (e.which == 2) {
		$gv.mouse_dm = 1;
		$gv.mouse_um = 0;
	}
	else if (e.which == 3) {
		$gv.mouse_dr = 1;
		$gv.mouse_ur = 0;
	}
	$gv.mouse_x = e.pageX;
	$gv.mouse_y = e.pageY;
}

/**
 * @param {MouseEvent} e
 */
window.onmouseup = function (e) {
	if ($gv.m_editor_mode) {
		if (!e.target.classList.contains("Editor")) {
			return;
		}
	}
	if (e.which == 1) {
		$gv.mouse_dl = 0;
		$gv.mouse_ul = 1;
	}
	else if (e.which == 2) {
		$gv.mouse_dm = 0;
		$gv.mouse_um = 1;
	}
	else if (e.which == 3) {
		$gv.mouse_dr = 0;
		$gv.mouse_ur = 1;
	}
	$gv.mouse_x = e.pageX;
	$gv.mouse_y = e.pageY;
}

/**
 * @param {MouseEvent} e
 */
window.onmousemove = function (e) {
	if ($gv.m_editor_mode) {
		if (!e.target.classList.contains("Editor")) {
			return;
		}
	}
	$gv.mouse_x = e.pageX;
	$gv.mouse_y = e.pageY;
	$gv.mouse_move = 1;
}

///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////


export class Game {
	constructor() {
		this.timer = 0;
		this.timer_ = 0;
		this._dTimer = 0;
		this.fps_arr = [];
		this.frame_s_arr = [];
		
		//this.chara = null;
		
		/** @type {SceneMap} */
		this.scene_map = new SceneMap();

		window.scene_map = this.scene_map;
		$gv.scene_map = window;

		scene_map.onload = function () {
			GameStateManager.PushState(this, window.chara);
		}
		
		this._loop = this._loop.bind(this);
		
		document.getElementById("m_is_run").onchange = (function (e) {
			this.m_is_run = e.target.checked ? true : false;
			if (this.m_is_run) {
				animationRequestID = requestAnimationFrame(this._loop);
				document.getElementById("Screenshot").innerHTML = "";
			}
		}).bind(this);

		this._$moveViewportSpeed = 10;//debug
	}
	
	moveViewport(inBound) {
		const scene_map = this.scene_map;

		const speed = $gv.input_keyDown['z'] ? (this._$moveViewportSpeed * 10) : this._$moveViewportSpeed;

		//$gv.m_viewRect = scene_map.viewArea(new Vec2($gv.m_viewRect.left, $gv.m_viewRect.top));

		if ($gv.input_keyDown['ArrowLeft'] > 0) {
			$gv.m_viewRect.left -= speed;
		}
		if ($gv.input_keyDown['ArrowRight'] > 0) {
			$gv.m_viewRect.left += speed;
		}
		if ($gv.input_keyDown['ArrowUp'] > 0) {
			$gv.m_viewRect.top -= speed;
		}
		if ($gv.input_keyDown['ArrowDown'] > 0) {
			$gv.m_viewRect.top += speed;
		}

		let { left, top, right, bottom } = scene_map.mapBound;

		if (inBound) {
			if ($gv.m_viewRect.left < left) {
				$gv.m_viewRect.left = left;
			}
			if ($gv.m_viewRect.right > right) {
				$gv.m_viewRect.left = right - $gv.m_viewRect.width;
			}
			if ($gv.m_viewRect.top < top) {
				$gv.m_viewRect.top = top;
			}
			if ($gv.m_viewRect.bottom > bottom) {
				$gv.m_viewRect.top = bottom - $gv.m_viewRect.height;
			}
		}
	}
	
	async _$startClient() {
		if (scene_map) {
			if (window.io != null) {
				let client = new Client();
				gApp.client = client;
				client.$test();
			}
			else {
				let params = _parseUrlParameter();

				let map_id = params["map"] || "000000000";//450003000
				let chara_code = params["chara"] || "c,00002012,00012012,00026509|00026509,00034873|00034873,01051429,01072392";

				GameStateManager.PopState({
					map_id: map_id,
					chara: chara_code,
				});
			}
		}
	}

	/** @type {boolean} */
	get _isMapReady() {
		const scene_map = this.scene_map;
		return scene_map && scene_map.isLoaded();
	}
	
	async run() {
		console.log("begin render");
		this._loop(0);//start render
	}
	
	async forceUpdateScreen() {
		const chara = this.chara;
		
		chara.renderer.__forceUpdate(0);
		
		if (this.m_is_run) {
			await chara.renderer.waitLoaded();
			chara.renderer.__require_update = true;//update once
			return;
		}
		await chara.renderer.waitLoaded();
		await chara.renderer._waitFrameTexturesLoaded();
		await IGraph.waitAllLoaded();
		
		document.getElementById("Screenshot").innerHTML = "";
		
		chara.renderer.__require_update = true;//update once
		
		this._loop(0);
	}

	/**
	 * @param {number} stamp
	 */
	_calcFPS(stamp) {
		try {
			if ((this.timer - this.timer_) >= 1000) {
				if (this.fps_arr.length) {
					let sum = this.fps_arr.reduce(function (a, b) { return a + b; });
					let avg = sum / this.fps_arr.length;

					document.getElementById("FPS").innerHTML = avg.toFixed(2);
				}
				if (this.frame_s_arr.length) {
					let sum = this.frame_s_arr.reduce(function (a, b) { return a + b; });
					let avg = sum / this.frame_s_arr.length;

					document.getElementById("frame").innerHTML = avg.toFixed(2);
				}

				this.frame_s_arr = [];
				this.fps_arr = [];

				this.timer_ = this.timer;
			}
			else if (stamp > 0 && Number.isFinite(stamp)) {
				this.fps_arr.push(1000 / stamp);
				this.frame_s_arr.push(stamp);
			}
		}
		catch (ex) {
			debugger;
			document.getElementById("FPS").innerHTML = "-";
			document.getElementById("frame").innerHTML = "-";
			this.fps_arr = [];
			this.frame_s_arr = [];
		}
	}

	_requestNextFrame() {
		if (this.m_is_run) {
			animationRequestID = requestAnimationFrame(this._loop);
		}
		else {
			//async
			setTimeout(function () {
				let elem = new Image();
				elem.src = engine._canvas.toDataURL();
				engine.ctx.clearRect(0, 0, engine.ctx.width, engine.ctx.height);
				document.getElementById("Screenshot").appendChild(elem);
			}, 0);
		}
	}

	/**
	 * @param {number} stamp
	 */
	_updateScene(stamp) {
		/** @type {SceneCharacter} */
		const chara = this.chara;

		/** @type {SceneCharacter[]} */
		const charaList = this.charaList;

		{
			if (this._isMapReady) {
				scene_map.update(stamp);//include world.update
			}

			// before world.update ??
			for (let i = 0; i < charaList.length; ++i) {
				charaList[i].update(stamp);
			}

			$gv.SceneObjectMgr.Update(stamp);

			EffectManager.Update(stamp);
		}
		{
			const client = gApp.client;//not offline character

			if (client && client.chara) {
				/** @type {SceneCharacter} */
				const ch = client.chara;
				
				ch.$emit(window.$io);

				ch.$recMove();
			}
		}

		damageNumberLayer.update(stamp);
	}
	
	_renderScene() {
		/** @type {SceneCharacter} */
		const chara = this.chara;

		/** @type {SceneCharacter[]} */
		const charaList = this.charaList;

		engine.beginScene();
		{
			engine.loadIdentity();
			engine.clearDrawScreen();
			
			$gv.m_viewRect.size = engine.screen_size;
			if (!$gv.m_editor_mode) {
				if (chara && chara.renderer) {
					$gv.m_viewRect.setCenter(chara.renderer.x, chara.renderer.y);
				}
				else if (scene_map.controller.player) {
					const pos = scene_map.controller.player.getPosition();
					const px = Math.trunc(pos.x * $gv.CANVAS_SCALE + 0.5);
					const py = Math.trunc(pos.y * $gv.CANVAS_SCALE + 0.5);
					$gv.m_viewRect.setCenter(px, py);
				}
			}
			
			if ($gv.m_is_rendering_map && this._isMapReady) {
				if ($gv.m_editor_mode) {
					this.moveViewport(false);
				}
				
				scene_map.beginRender(engine);
				{					
					scene_map.renderBackground(engine);
					//if ($gv.m_display_life && scene_map._raw.info.mirror_Bottom) {
					//	engine.ctx.setTransform(1, 0, 0, 1, 0, 0);
					//	engine.ctx.translate(Math.trunc(-$gv.m_viewRect.x), Math.trunc(-$gv.m_viewRect.y));
					//	engine.ctx.scale(1, -1);
					//	for (let i = 0; i < scene_map.layeredObject.length; ++i) {
					//		scene_map.renderLife(engine, i);
					//	}
					//}
					for (let i = 0; i < scene_map.layeredObject.length; ++i) {
						scene_map.renderLayeredObject(engine, i);
						scene_map.renderLayeredTile(engine, i);
						
						scene_map.applyCamera(engine);
						{
							if ($gv.m_display_other_player) {
								for (let chara_index = 0; chara_index < charaList.length; ++chara_index) {
									if (charaList[chara_index] == chara) {
										continue;
									}
									else if (charaList[chara_index].$layer == i) {
										charaList[chara_index].render(engine);
									}
								}
							}

							scene_map.renderLife(engine, i);

							if ($gv.m_display_player && chara) {
								if ((chara.$layer == null || chara.$layer == i) && chara.renderer) {
									chara.render(engine);
								}
							}
							
							$gv.SceneObjectMgr.RenderLayer(engine, i);
						}
					}
					scene_map.applyCamera(engine);
					{
						for (let i = scene_map.layeredObject.length; i < 12; ++i) {
							$gv.SceneObjectMgr.RenderLayer(engine, i);
						}
					}
				}
				scene_map.endRender(engine);
			}
			else {
				scene_map.applyCamera(engine);
				for (let i = 0; i < charaList.length; ++i) {
					charaList[i].render(engine);
				}
			}

			damageNumberLayer.render(engine);

			for (let i = 0; i < charaList.length; ++i) {
				charaList[i]._$drawName(engine);
			}
			for (let i = 0; i < charaList.length; ++i) {
				charaList[i]._$drawChatBalloon(engine);
			}
			
			if ($gv.m_is_rendering_map && this._isMapReady) {
				scene_map.beginRender(engine);
				{
					scene_map.applyCamera(engine);
					{
						scene_map.renderPortal(engine);
					}
					
					scene_map.renderFrontground(engine);
				}
				scene_map.endRender(engine);
				
				scene_map.renderParticle(engine);

				scene_map.applyCamera(engine);
				{
					EffectManager.Render(engine);

					if ($gv.m_display_debug_info) {
						/** @type {CanvasRenderingContext2D} */
						const ctx = engine.ctx;
						{
							ctx.beginPath();

							ctx.fillStyle = "white";
							ctx.fillRect(0, 0, 96, 50);

							ctx.fillStyle = "black";
							ctx.fillText("map origin", 5, 14, 96);

							ctx.fillText("view-x: " + $gv.m_viewRect.x.toFixed(0), 5, 30, 96);

							ctx.fillText("view-y: " + $gv.m_viewRect.y.toFixed(0), 5, 46, 96);
						}
					}

					scene_map.controller.render(engine);
				}
				engine.loadIdentity();
			}
			
			if ($gv.m_display_debug_info) {
				this._render_debug_info();
			}
		}
		engine.endScene();
	}

	_render_debug_info() {
		if (this._isMapReady && scene_map.controller && scene_map.controller.player) {
			/** @type {CanvasRenderingContext2D} */
			const ctx = engine.ctx;

			const ta = ctx.textAlign, tb = ctx.textBaseline, lw = ctx.lineWidth;
			ctx.textBaseline = "top";
			ctx.lineWidth = 2.5;
			ctx.strokeStyle = "#000";
			let x = 400, y = 5;
			for (let line of window._SCREEN_PRINTLN) {
				const val = line.getValue();
				const text = line.getText();

				ctx.fillStyle = "#FFF";
				{
					ctx.textAlign = "right";
					ctx.strokeText(text, x - 2, y);
					ctx.fillText(text, x - 2, y);

					ctx.textAlign = "center";
					ctx.strokeText(":", x, y);
					ctx.fillText(":", x, y);

					ctx.textAlign = "left";
					ctx.strokeText(val, x + 2, y);
					ctx.fillText(val, x + 2, y);
				}

				if ("_val" in line) {
					let _val;
					if (line._val != val) {
						_val = line._val;//display new value
						line.__val = line._val;
						line._val = val;
					}
					else {
						_val = line.__val;//display old value
					}
					if (_val != val) {
						ctx.fillStyle = "#0FF";
					}

					ctx.fillStyle = "#FFF";
					{
						ctx.textAlign = "right";
						ctx.strokeText(text, x - 2 + 200, y);
						ctx.fillText(text, x - 2 + 200, y);

						ctx.textAlign = "center";
						ctx.strokeText(":", x + 200, y);
						ctx.fillText(":", x + 200, y);

						ctx.textAlign = "left";
						ctx.strokeText(_val, x + 2 + 200, y);
						ctx.fillText(_val, x + 2 + 200, y);
					}
				}
				else {
					line.__val = val;
					line._val = val;
				}

				y += 16;
			}
			ctx.textAlign = ta;
			ctx.textBaseline = tb;
			ctx.lineWidth = lw;
		}
	}
	
	/**
	 * @param {DOMHighResTimeStamp} timeStamp
	 */
	_loop(timeStamp) {
		const scene_map = this.scene_map;
		let stamp = timeStamp - this.timer;
		
		this.timer = timeStamp;

		this._requestNextFrame();

		this._calcFPS(stamp);
	
		this._updateScene(stamp);

		this._renderScene();
		
		for (let i in $gv.input_keyDown) {
			if ($gv.input_keyDown[i] > 0) {
				++$gv.input_keyDown[i];
			}
		}
		for (let i in $gv.input_keyUp) {
			$gv.input_keyUp[i] = 0;
		}
	}
	
	get chara() {
		return window.chara;
	}
	//set chara(value) {
	//	window.chara = value;
	//}

	get charaList() {
		return gApp.store.state.charaList;
	}
	
	get m_is_run() {
		return window.m_is_run;
	}
	set m_is_run(value) {
		window.m_is_run = value;
	}
}


///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

function _parseUrlParameter() {
	let sPageURL = decodeURIComponent(window.location.search.substring(1));
	let sURLVariables = sPageURL.split("&");
	let params = {};

	for (let i = 0; i < sURLVariables.length; ++i) {
		let sParameter = sURLVariables[i].split("=");

		params[sParameter[0]] = sParameter[1];
	}

	return params;
};

