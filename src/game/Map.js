
import { AddInitTask } from "../init.js";

import { Vec2, Rectangle } from "./math.js";
import { IGraph, IRenderer } from "./IRenderer.js";
import { engine, Graph } from "./Engine.js";

import { Sprite } from "./Sprite.js";
import { LifeRenderer } from "./Renderer/LifeRenderer.js";
import { MobRenderer } from "./Renderer/MobRenderer.js";
import { NpcRenderer } from "./Renderer/NpcRenderer.js";

import { ParticleGroup } from "./Renderer/ParticleSystem.js";

import { World } from "./Physics/World.js";
import { Ground } from "./Physics/Ground.js";
import { PMob } from "./Physics/PMob.js";
import { SceneObject } from "./SceneObject.js";


window.enable_skeletal_anim = true;

/**
 * map sprite data
 */
const map_sprite = {
	Back: {},
	Obj: {},
	Tile: {},
};

window.$map_sprite = map_sprite;

$gv.allQuest = {};

async function map_load_package(cat, pack) {
	if (!cat || !pack) {
		debugger;
	}
	if (!map_sprite[cat][pack]) {
		let url = `/Map/${cat}/${pack}`;
		
		map_sprite[cat][pack] = await $get.data(url);

		if (map_sprite[cat][pack] == null) {
			console.warn("Empty package: " + url);
		}
	}
	if (map_sprite[cat][pack]) {
		return map_sprite[cat][pack];
	}
	//throw new Error();
}


/**
 * Map texture
 */
class MapTexture extends Sprite {
	/**
	 * @param {!any} raw
	 * @param {!string} url
	 * @param {!MapTexture} texture0
	 */
	constructor(_raw, url, texture0) {
		super(_raw, url);
		//this.className = _path;

		texture0 = texture0 || MapTexture.raw_default;
		
		this.a0 = this._get(-1, "a0", Number);
		this.a1 = this._get(-1, "a1", Number);

		this.movetype = this._get(texture0.movetype, "moveType", Number);
		this.movew = this._get(texture0.movew, "moveW", Number);
		this.moveh = this._get(texture0.moveh, "moveH", Number);
		this.movep = this._get(texture0.movep, "moveP", Number);
		this.mover = this._get(texture0.mover, "moveR", Number);
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {boolean} f - flip
	 * @param {number} px - position.x:int
	 * @param {number} py - position.y:int
	 * @param {number} time - movement_animation:float
	 * @param {number} delta - graph_animation:float
	 * @param {maple_scene_label} border
	 */
	draw(renderer, f, px, py, time, delta) {
		let ratio = time / this.delay;
		let alpha = (0 <= this.a0 || 0 <= this.a1 ? ((0 > this.a0 ? 0 : this.a0) * (1.0 - ratio) + (0 > this.a1 ? 0 : this.a1) * ratio) : 255.0);
		let angle = 0;

		switch (this.movetype) {
			case 1: px = px + this.movew * Math.sin(0 == this.movep ? (delta / 1000.0) : (delta * 2.0 * Math.PI / this.movep)); break;
			case 2: py = py + this.moveh * Math.sin(0 == this.movep ? (delta / 1000.0) : (delta * 2.0 * Math.PI / this.movep)); break;
			case 3: if (0 != this.mover) angle = delta / this.mover; break;
		}
		
		let ctx = renderer.ctx;
		function axis(x, y, w, h, c1, c2) {
			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x + w, y);
			stroke(c1, c2);

			ctx.beginPath();
			ctx.moveTo(x, y);
			ctx.lineTo(x, y + h);
			stroke(c2, c1);
		}
		function stroke(c1, c2) {
			ctx.lineWidth = 3;
			ctx.strokeStyle = c1;
			ctx.stroke();
		}

		renderer.loadIdentity();
		renderer.translate(Math.trunc(-$gv.m_viewRect.x + 0.5), Math.trunc(-$gv.m_viewRect.y + 0.5));
		{
			renderer.globalAlpha = Math.max(0, Math.min(alpha / 255, 1));

			renderer._drawRotaGraph(this, px, py, angle, f);
		}
	}
}
MapTexture.raw_default = {
	a0: -1,
	a1: -1,
	movetype: 0,
	movew: 0,
	moveh: 0,
	movep: 0,
	mover: 0,
};

/**
 * Map clip-texture
 */
class MapTextureClip extends MapTexture {
	constructor(_raw, url) {
		super(_raw, url);

		/** @type {Rectangle} */
		this.clip = new Rectangle();//zero Rectangle
	}
}

class MapObjectBase {
	constructor(_raw) {
		if (_raw == null) {
			debugger;
			console.error(_raw);
		}
		this._raw = _raw;


		/** @type {MapTexture[]} */
		this.textures = [];

		/** @type {number} int */
		this.frame = 0;

		/** @type {number} time_in_ms:float */
		this.time = 0;

		/** @type {number} timeElapsed_in_ms:float */
		this.delta = 0;


		/** @type {{[questId:string]: number}} */
		this.quest = _raw.quest;

		for (let qid in _raw.quest) {
			if (!$gv.allQuest[qid]) {
				$gv.allQuest[qid] = new Set();
			}
			$gv.allQuest[qid].add(_raw.quest[qid]);
		}
		
		this._load_object_info();
		this._load_back_info();
		this._load_tile_info();

		this.aabb = null;
		this.display_aabb = false;
		this.aabb_color = null;
		
		if (process.env.NODE_ENV !== 'production') {
			this.__max_repeat_count = 1;
		}
	}
	
	_load_object_info() {
		/** @type{number} obj-type */
		this.type = this._get(0, "sign", Number);

		/** @type{number} x */
		this.x = this._get(0, "x", Number);

		/** @type{number} y */
		this.y = this._get(0, "y", Number);

		/** @type{number} z */
		this.z = this._get(0, "z", Number);

		/** @type{number} zM */
		this.zM = this._get(0, "zM", Number);

		/** @type{number} flip */
		this.f = this._get(0, "f", Number);
		
		/** @type{name} named object */
		this.name = this._raw.name;

		/** @type {string} */
		this._url = null;//data url //debug
	}
	_load_back_info() {
		/** @type {number} move type */
		this.typeb = this._get(0, "type", Number);
		if (this.typeb < 0 || this.typeb > 7) {
			alert("MapBackBase.typeb: " + this.typeb);
			console.warn("MapBackBase.typeb: " + this.typeb);
		}

		/** @type {number} a */
		this.a = this._get(0, "a", Number);

		/** @type {number} rx */
		this.rx = this._get(0, "rx", Number);

		/** @type {number} ry */
		this.ry = this._get(0, "ry", Number);

		/** @type {number} center y */
		this.cx = this._get(0, "cx", Number);

		/** @type {number} center y */
		this.cy = this._get(0, "cy", Number);
		
		/** @type {string} */
		this.backTags = this._raw.backTags;
	}
	_load_tile_info() {
		/** @type{number} flow */
		this.flow = this._get(0, "flow", Number);
		
		if (this.flow & 1 && !this.cx) {
			this.cx = 1000;
		}
		if (this.flow & 2 && !this.cy) {
			this.cy = 1000;
		}
	}
	
	/**
	 * @returns {Promise}
	 */
	load() {
		let texture0 = this._load_texture(0, null);
		this.textures[0] = texture0;

		for (let i = 1; i in this._texture_raw; ++i) {//not array
			this.textures[i] = this._load_texture(i, texture0);
		}
		this.__calc_aabb();
	}
	
	/**
	 * @virtual
	 * @param {number} i - texture index
	 * @param {MapTexture} texture0
	 */
	_load_texture() {
		//nothing
	}
	
	/**
	 * @virtual
	 */
	unload() {
		this.textures = [];
	}
	
	__calc_aabb() {
		if (this.textures.length >= 1) {
			let mover = 0;
			for (let i = 0; i < this.textures.length; ++i) {
				let texture = this.textures[i];
				mover = mover | texture.mover;
			}
			const aabb = this.compute_max_rectangle();
			if (mover) {
				const r = Math.round(Math.sqrt(aabb.width ** 2 + aabb.height ** 2));
				const hr = Math.round(r * 0.5);
				this.aabb = new Rectangle(this.x - hr, this.y - hr, r, r);
			}
			else {
				this.aabb = aabb;
			}
		}
	}

	/**
	 * @param {T} defaultValue
	 * @param {string} propertyName
	 * @param {function(any):T} constructor
	 * @returns {T}
	 * @template T
	 */
	_get(defaultValue, propertyName, converter) {
		if (propertyName in this._raw) {
			if (converter) {
				return converter(this._raw[propertyName]);
			}
			else {
				return this._raw[propertyName];
			}
		}
		return defaultValue;
	}

	update(stamp) {
		const fc = this.textures.length;

		if (fc > 1) {
			this.time = this.time + stamp;

			if (this.time > this.textures[this.frame].delay) {
				this.frame = ++this.frame;

				this.time = 0;

				if (this.frame >= fc) {
					this.frame = 0;
				}
			}
			//this.frame = Math.trunc(this.time / 1000) % fc;
		}

		this.delta += stamp;

		if ($gv.m_editor_mode && this.aabb) {
			this.$editor_mouse();
		}
	}
	_update_and_preload(stamp) {
		const fc = this.textures.length;
		
		if (fc > 1) {
			const texture = this.textures[this.frame];

			this.time = this.time + stamp;
			
			if (!texture.isLoaded()) {
				texture.__loadTexture();
			}

			if (this.time > texture.delay) {
				this.frame = ++this.frame;

				this.time = 0;

				if (this.frame >= fc) {
					this.frame = 0;

					delete this.update;
				}
			}

			const next_texture = this.textures[this.frame + 1];
			if (next_texture && !next_texture.isLoaded()) {
				next_texture.__loadTexture();
			}

			//this.frame = Math.trunc(this.time / 1000) % fc;
		}
		
		this.delta += stamp;
		
		if ($gv.m_editor_mode && this.aabb) {
			this.$editor_mouse();
		}
	}
	$editor_mouse() {
		const vrect = $gv.m_viewRect;
		const mcx = $gv.m_viewRect.left + $gv.mouse_x;
		const mcy = $gv.m_viewRect.top + $gv.mouse_y;
		if (this.typeb == 0 && this.aabb.collide4f2(mcx, mcy, 1, 1))
		{
			this.display_aabb = true;
			if ($gv.mouse_dl == 1 && (window.m_selected_object != this || window.m_selected_object == null)) {
				this.$select();
			}
			else if (window.m_hover_object == null) {
				window.m_hover_object = this;
				this.aabb_color = "rgba(0,255,0,0.25)";
			}
			else {
				this.aabb_color = "rgba(0,0,255,0.25)";
			}
		}
		else {
			this.$unselect();
		}
		if (window.m_selected_object == this) {
			this.display_aabb = true;
			this.aabb_color = "rgba(255,0,0,0.5)";
		}
	}
	$select() {
		if (window.m_selected_object) {
			window.m_selected_object.$unselect();//prev
		}
		window.m_selected_object = this;
		window.m_hover_object = null;
		$gv.mouse_dl = 0;
	}
	$unselect() {
		this.display_aabb = false;
	}
	$isRepeatX() {
		return this.typeb == 1 || this.typeb == 4;
	}
	$isRepeatY() {
		return this.typeb == 2 || this.typeb == 5;
	}
	
	compute_rectangle(index) {
		const texture = this.textures[index];
		if (texture) {
			const width = texture.width;
			const height = texture.height;

			return new Rectangle(this.x - (this.f ? -texture.x + width : texture.x), this.y - texture.y, width, height);
		}
	}
	compute_max_rectangle() {
		if (this.textures.length > 0) {
			let { left, top, right, bottom } = this.compute_rectangle(0);
				
			for (let j = 1; j < this.textures.length; ++j) {
				let rect = this.compute_rectangle(j);
				
				left = Math.min(left, rect.left);
				top = Math.min(top, rect.top);
				right = Math.max(right, rect.right);
				bottom = Math.max(bottom, rect.bottom);
			}
			return Rectangle.parse(left, top, right, bottom);
		}
		return null;
	}

	/**
	 * @virtual
	 * @param {IRenderer} renderer
	 * @param {number} index_of_texture
	 * @param {number} mx - move x
	 * @param {number} my - move x
	 * @param {Rectangle} viewRect
	 */
	__draw_texture(renderer, index_of_texture, mx, my, viewRect) {
		if (process.env.NODE_ENV !== 'production') {
			if ((--this.__max_repeat_count) <= 0) {
				return;
			}
		}
		
		if (this.typeb != 0 || (!this.aabb || this.aabb.collide(viewRect))) {
			let texture = this.textures[index_of_texture];

			if (index_of_texture && !texture.isLoaded()) {
				// find loaded texture
				for (let i = index_of_texture - 1; i >= 0; --i) {
					texture = this.textures[index_of_texture];
					if (texture.isLoaded()) {
						break;
					}
				}
			}
			
			texture.draw(renderer, this.f, this.x + mx, this.y + my, this.time, this.delta);//MapleSceneTexture#draw
		}
		
		if ($gv.m_display_selected_object && $gv.m_editor_mode && this.aabb && this.display_aabb) {
			const ctx = renderer.ctx;
			const x = Math.trunc((-viewRect.left + 0.5) + this.aabb.left);
			const y = Math.trunc((-viewRect.top + 0.5) + this.aabb.top);
			
			renderer.loadIdentity();

			renderer.globalAlpha = 1;
			
			ctx.beginPath();
			ctx.rect(x, y, this.aabb.width, this.aabb.height);
			ctx.fillStyle = this.aabb_color || "rgba(20,255,20,0.5)";//
			ctx.fill();
			
			ctx.lineWidth = 3;
			//ctx.lineCap = "round";

			ctx.setLineDash([3, 3]);
			ctx.lineDashOffset = 0;
			ctx.strokeStyle = "rgba(0,0,0,0.5)";
			ctx.stroke();

			ctx.setLineDash([3, 3]);
			ctx.lineDashOffset = 3;
			ctx.strokeStyle = "rgba(255,255,255,0.5)";
			ctx.stroke();

			ctx.setLineDash([]);
			ctx.lineWidth = 1;
		}
	}
	
	/**
	 * @protected
	 * @param {IRenderer} renderer
	 * @param {int} mx
	 * @param {int} my
	 * @param {Rectangle} viewRect
	 */
	__draw(renderer, mx, my, viewRect) {
		this.__draw_texture(renderer, this.frame, mx, my, viewRect);//MapleSceneTexture#draw
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {boolean} horizontal
	 * @param {boolean} vertical
	 * @param {number} mx - int
	 * @param {number} my - int
	 * @param {Rectangle} viewRect
	 */
	_draw(renderer, horizontal, vertical, mx, my, viewRect) {
		let texture = this.textures[this.frame];
		if (texture == null) {
			debugger;
			return;
		}

		// viewRect - canvas rectangle
		let { left, top, right, bottom } = viewRect;
		// image position
		let ix = this.x - (this.f ? -texture.x + texture.width : texture.x);
		let iy = this.y - texture.y;
		// tile size
		let tw = 0 == this.cx ? texture.width : this.cx;
		let th = 0 == this.cy ? texture.height : this.cy;
		// tile area
		let x1 = left - (tw + (left - mx - ix) % tw);
		let y1 = top - (th + (top - my - iy) % th);
		let x2 = right + (tw - (right - mx - ix) % tw);
		let y2 = bottom + (th - (bottom - my - iy) % th);
		
		if (process.env.NODE_ENV !== 'production') {
			this.__max_repeat_count = 1024;
		}

		if (horizontal)
			if (vertical)
				for (let yy = y1; yy < y2; yy = yy + th)
					for (let xx = x1; xx < x2; xx = xx + tw)
						this.__draw(renderer, xx - ix, yy - iy, viewRect);
			else
				for (let xx = x1; xx < x2; xx = xx + tw)
					this.__draw(renderer, xx - ix, my, viewRect);
		else if (vertical)
			for (let yy = y1; yy < y2; yy = yy + th)
				this.__draw(renderer, mx, yy - iy, viewRect);
		else
			this.__draw(renderer, mx, my, viewRect);
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {Vec2} center
	 * @param {Rectangle} viewRect
	 */
	draw(renderer, center, viewRect) {
		if (!this.textures.length) {
			return;
		}
		let mrx = (this.rx + 100) * center.x / 100;
		let mry = (this.ry + 100) * center.y / 100;

		switch (this.typeb) {
			case 0: this._draw(renderer, false, false, mrx, mry, viewRect); break;
			case 1: this._draw(renderer, true, false, mrx, mry, viewRect); break;
			case 2: this._draw(renderer, false, true, mrx, mry, viewRect); break;
			case 3: this._draw(renderer, true, true, mrx, mry, viewRect); break;
			case 4: this._draw(renderer, true, false, Math.trunc(this.delta / 200 * this.rx), mry, viewRect); break;
			case 5: this._draw(renderer, false, true, mrx, Math.trunc(this.delta / 200 * this.ry), viewRect); break;
			case 6: this._draw(renderer, true, true, Math.trunc(this.delta / 200 * this.rx), mry, viewRect); break;
			case 7: this._draw(renderer, true, true, mrx, Math.trunc(this.delta / 200 * this.ry), viewRect); break;
		}
	}
	
	/**
	 * @virtual
	 */
	get _texture_base_path() {
		throw new Error("Not implement");
	}
}

class MapObject extends MapObjectBase {
	constructor(_raw) {
		super(_raw);
		
		if (this._raw.cx != null && (!this._raw.ry || this._raw.ry == -100)) {
			if (this._raw.rx) {//!= null && != 0
				if (this._raw.cy != null) {
					this.typeb = 6;
				}
				else {
					this.typeb = 4;
				}
			}
			else {
				this.typeb = 1;
			}
		}
		if (this._raw.cy != null && (!this._raw.rx || this._raw.rx == -100)) {
			if (this._raw.ry) {//!= null && != 0
				if (this._raw.cx != null) {
					this.typeb = 7;
				}
				else {
					this.typeb = 5;
				}
			}
			else {
				this.typeb = 2;
			}
		}

		this.update = this._update_and_preload;
	}

	/**
	 * @override
	 * @param {number} i - texture index
	 * @param {MapTexture} texture0
	 * @returns {MapTexture}
	 */
	_load_texture(i, texture0) {
		const null_url = undefined;
		let path = ["/Map", "Obj", this._texture_base_path, i].join("/");

		let texture = new MapTexture(this._texture_raw[i], null_url, texture0);
		texture._url = path;

		return texture;
	}

	get _texture_base_path() {
		return [this._raw.oS, this._raw.l0, this._raw.l1, this._raw.l2].join("/");
	}

	/**
	 * raw data
	 * textures; info & data
	 */
	get _texture_raw() {
		try {
			return map_sprite.Obj[this._raw.oS][this._raw.l0][this._raw.l1][this._raw.l2];
		}
		catch (ex) {
			debugger;
		}
		return null;
	}
}

class MapParticle extends MapObject {
	constructor(_raw) {
		super(_raw);
		/** @type {ParticleGroup[]} */
		this.groups = [];
	}
	
	async load(particle_name) {
		let pg = new ParticleGroup();
		
		await pg.load(particle_name);

		let keys = Object.keys(this._raw)
			.map(i => {
				let n = parseInt(i, 10);
				if (Number.isSafeInteger(n)) {
					return n;
				}
				console.warn("MapParticle." + particle_name + ".id: " + i);
				return null;
			})
			.filter(i => i != null);
			
		for (let i of keys) {
			this.groups[i] = pg.clone();
			this.groups[i].x = this._raw[i].x;
			this.groups[i].y = this._raw[i].y;
			this.groups[i].evaluate();
		}
	}
	
	/** @param {number} stamp - time in millisecond */
	update(stamp) {
		for (let i = 0; i < this.groups.length; ++i) {
			const pg = this.groups[i];
			pg.update(stamp);
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {Vec2} center
	 * @param {Rectangle} viewRect
	 */
	draw(renderer, center, viewRect) {
		for (let i = 0; i < this.groups.length; ++i) {
			const pg = this.groups[i];
			let mx = (this.rx + 100) * center.x / 100;
			let my = (this.ry + 100) * center.y / 100;
			pg.render(renderer, viewRect, mx, my);
		}
	}

	/**
	 * @param {{particle:{[name:string]:{}}}} mapRawData
	 * @param {SceneMap} sceneMap
	 */
	static construct(mapRawData, sceneMap) {
		let tasks = [];
		let particleList = [];
		for (let particleName in mapRawData.particle) {
			let particleRaw = mapRawData.particle[particleName];
			let mpp = new MapParticle(particleRaw);
			tasks.push(mpp.load(particleName));
			particleList.push(mpp);
		}
		sceneMap.particleList = particleList;
		return tasks;
	}
}

class MapObjectSkeletalAnim extends MapObject {
	constructor(_raw, url) {
		super(_raw);
		/** @type {SSAnim} */
		this.ssanim = null;
		/** @type {string} */
		this._fname = null;
		
		///** @type{number} tags */
		//this._tags = this._get(0, "tags", String);
	}
	/** @type {string} */
	get _folder() {
		const raw = this._raw;
		//["Obj"	 ][obj.oS][obj.l0][obj.l1][obj.l2][0    ][""]
		return `/Map/Obj/${raw.oS}/${raw.l0}/${raw.l1}/${raw.l2}`;
	}
	async load() {
		if (SSAnim) {
			const raw = this._raw;
			let ssanim;
			
			ssanim = new SSAnim();
			
			try {
				await ssanim.load(this._folder);
				ssanim.update(0);//init pos data
			}
			catch (ex) {
				console.error(ex);
				return;
			}
			
			if (raw.spineRandomStart) {
				let t = ssanim.anim_length * Math.random();
				ssanim.setAnimTime(t);
			}
			
			const r = Math.round(Math.sqrt(ssanim.width ** 2 + ssanim.height ** 2));
			const hr = Math.round(r * 0.5);
			this.aabb = new Rectangle(this.x - hr, this.y - hr, r, r);
			
			this.ssanim = ssanim;
		}
		else {
			return null;
		}
	}
	unload() {
		if (this.ssanim) {
			this.ssanim.unload();
			this.ssanim = null;
		}
	}
	update(stamp) {
		this.delta += stamp;
		
		if (this.ssanim && window.enable_skeletal_anim) {
			this.ssanim.update(stamp);
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {Vec2} center
	 * @param {Rectangle} viewRect - ?? no use
	 */
	draw(renderer, center, viewRect) {
		if ($gv.m_display_skeletal_anim) {
			const x = Math.trunc((-$gv.m_viewRect.x + 0.5) + this.x);
			const y = Math.trunc((-$gv.m_viewRect.y + 0.5) + this.y);

			renderer.ctx.setTransform(1, 0, 0, -1, x, y);

			if (this.ssanim) {
				this.ssanim.render();
			}
			if (this.display_aabb) {
				const ctx = renderer.ctx;

				renderer.ctx.setTransform(1, 0, 0, 1, Math.trunc(-$gv.m_viewRect.x + 0.5), Math.trunc(-$gv.m_viewRect.y + 0.5));

				ctx.beginPath();
				ctx.rect(this.x - this.ssanim.width * 0.5, this.y - this.ssanim.height, this.ssanim.width, this.ssanim.height);
				ctx.fillStyle = "rgba(20,255,20,0.5)";
				ctx.fill();
			}
		}
	}
}

class MapTile extends MapObject {
	constructor(_raw, info) {
		super(_raw);
		this._info = info;
		this.update = this._update_and_preload;
	}
	load() {
		let texture = new MapTexture(this._texture_raw);

		this.textures[0] = texture;
		this.textures[0]._url = ["/Map", "Tile", this._info.tS, this._raw.u, this._raw.no].join("/");

		this.__calc_aabb();
	}

	/**
	 * raw data
	 * textures; info & data
	 */
	get _texture_raw() {
		try{
			return map_sprite.Tile[this._info.tS][this._raw.u][this._raw.no];
		}
		catch (ex) {
			debugger;
		}
		return null;
	}
	
	get _texture_base_path() {
		return [this._info.tS, this._raw.u, this._raw.no].join("/");
	}
}

/**
 * MapEditor: Map Portal
 * Map graph (struct): "Map/Map/Graph/"
 */
class MapPortal extends MapObject {
	constructor(_raw, mapRenderer) {
		super(_raw);//load x, y
		
		this.mapRenderer = mapRenderer;
		
		/** @type {number} - to mapId */
		this.tm = null;
		
		/** @type {string} - tn to pn */
		this.tn = null;

		/** @type {string} - pn to tn */
		this.pn = null;
		
		/** @type {string} */
		this.script = null;
		
		/** @type {boolean} */
		this.enable = null;
		
		/** @type {"portalStart"|"portalContinue"|"portalExit"} */
		this.state = null;

		/** @type {["portalStart","portalContinue","portalExit"]} */
		this.states = null;

		/** @type {number} */
		this.skin = null;

		this.update = this._update_and_preload;
	}
	
	//sync
	load() {
		this.tm = this._get("", "tm", String).padStart(9, "0");//??
		this.tn = this._get("", "tn", String);//??
		this.pn = this._get("", "pn", String);//pt_go01 => goto portal_01
		this.script = this._get(null, "script", String);
		
		this.enable = this.tm != "" && this.tm != "999999999";

		this._loadTexture();
	}
	unload() {
		if (this.body) {
			this.body.GetWorld().DestroyBody(this.body);
			this.body = null;
		}
	}
	
	getMap() {
		if (this.enable) {
			return this.tm;
		}
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {Vec2} center
	 * @param {Rectangle} viewRect
	 */
	draw(renderer, center, viewRect) {
		if (this.enable) {
			super.draw(renderer, center, viewRect);
		}
		else if (this.__display_mode) {
			super.draw(renderer, center, viewRect);
		}
	}

	_loadTexture() {
		///** @type {number} */
		//let type = this._raw.pt;
		//
		//let skins = this._loaded_portals[this.__display_mode][type];
		//
		//this.textures = skins.default || skins[0];

		//MapObject::type
		if (this.__display_mode == "game") {
			this.type = "p";//??
		}
		else {
			this.type = "q";//??
		}

		const _raw = MapPortal._portals_raw;

		this.textures.length = 0;//clear

		const type = MapPortal._type_map[this._raw.pt];
		
		if (this.__display_mode == "editor") {
			let texture = new MapTexture(_raw.editor[type]);
			texture._url = [this._texture_base_path, this.__display_mode, type].join("/");
			this.textures[0] = texture;
		}
		else if (_raw.game[type]) {
			let skin = this.skin != null ? this.skin : "default";
			if ("0" in _raw.game[type][skin]) {//is animation frames
				let textures = _raw.game[type][skin];
				for (let i in textures) {
					let texture = new MapTexture(textures[i]);
					texture._url = [this._texture_base_path, this.__display_mode, type, skin, i].join("/");
					this.textures.push(texture);
				}
			}
			else {
				//TODO: need default state
				this.states = Object.keys(_raw.game[type][skin]);
				this.state = this.states[1 % this.states.length];

				let textures = _raw.game[type][skin][this.state];
				for (let i in textures) {
					let texture = new MapTexture(textures[i]);
					texture._url = [this._texture_base_path, this.__display_mode, type, skin, this.state, i].join("/");
					this.textures.push(texture);
				}
			}
		}

		//reset
		this.delta = 0;
		this.time = 0;
		this.frame = 0;
	}

	get _texture_base_path() {
		return "/Map/MapHelper/portal";
	}
	get _getTexturePath() {
		if (this.__display_mode == "editor") {
			return ["/Map/MapHelper/portal", this.__display_mode].join("/");
		}
		else {
			return ["/Map/MapHelper/portal", this.__display_mode].join("/");
		}
	}
	
	/**
	 * @returns {"editor"|"game"}
	 */
	get __display_mode() {
		return $gv.m_editor_mode ? "editor" : "game";
	}

	///**
	// * @type {{editor:{[pt:number]:{[skin:number]:MapTexture}},game:{[pt:number]:{[skin:number]:MapTexture[],default:MapTexture[]}}}}
	// */
	//get _loaded_portals() {
	//	return MapPortal._portals;
	//}
	
	static async Init() {
		MapPortal._portals_raw = await $get.data("/Map/MapHelper/portal");

		MapPortal._type_map = Object.keys(MapPortal._portals_raw.editor);
	}
}
MapPortal._portals_raw = {};
MapPortal._type_map = {};
//MapPortal._portals = {};
MapPortal._script = {};

class MapPortalManager {
	constructor() {
		/** @type {MapPortal[]} */
		this.portals = null;

		this.__display_mode = this.__display_mode;
	}
	
	async load(map_raw_data, mapRenderer) {
		let portals = [];
		for (let i = 0; i in map_raw_data.portal; ++i) {
			let raw = map_raw_data.portal[i];
			let pt = new MapPortal(raw, mapRenderer);
			
			pt.load();//sync
			
			//if (pt.enable) {
				mapRenderer.controller.createPortal(pt);//inject body
			//}
			
			portals.push(pt);
		}
		this.portals = portals;
	}
	unload() {
		for (let i = 0; i < this.portals.length; ++i) {
			let ptl = this.portals[i];
			ptl.unload();
		}
	}
	
	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this.__display_mode != $gv.m_editor_mode) {
			this.__display_mode = $gv.m_editor_mode;

			for (let i = 0; i < this.portals.length; ++i) {
				let portal = this.portals[i];
				portal._loadTexture();
				portal.update(stamp);
			}
		}
		else {
			for (let i = 0; i < this.portals.length; ++i) {
				let portal = this.portals[i];
				portal.update(stamp);
			}
		}
	}
	/**
	 * @param {IRenderer} renderer
	 * @param {Vec2} center
	 * @param {Rectangle} viewRect
	 */
	draw(renderer, center, viewRect) {
		for (let i = 0; i < this.portals.length; ++i) {
			let portal = this.portals[i];
			portal.draw(renderer, center, viewRect);
		}
	}
}

//          [category][source]
//
//static back
//imgBack = [category][source][class ][number][""]
//imgBack = ["Back"  ][obj.bS]["bacK"][obj.no][""]
//
//animation back
//imgBack = [category][source][class ][number][frame][""]
//imgBack = ["Back"  ][obj.bS]["ani" ][obj.no][0    ][""]
//
//object
//imgObj  = [category][source][path_0][path_1][path_2][frame][""]
//imgObj  = ["Obj"	 ][obj.oS][obj.l0][obj.l1][obj.l2][0    ][""]

class MapBackBase extends MapObjectBase {
	constructor(_raw) {
		super(_raw);
	}
}

/**
 * @implements {IAsyncLoading}
 */
class MapBack extends MapBackBase {
	constructor(_raw) {
		super(_raw);
		this.update = this._update_and_preload;
	}

	load() {
		let path = ["/Map", "Back", this._texture_base_path].join("/");

		if (this._raw.bS) {
			const raw = this._texture_raw;
			if (raw) {
				this.textures[0] = new MapTexture(this._texture_raw);
				this.textures[0]._url = path;
			}
		}
		else {
			console.warn("MapBack path ?: " + path);
		}
	}
	
	get _texture_base_path() {
		return [this._raw.bS, "back", this._raw.no].join("/");
	}

	/**
	 * raw data
	 * texture; info & data
	 */
	get _texture_raw() {
		if (this._raw.bS && this._raw.no) {
			return map_sprite.Back[this._raw.bS]["back"][this._raw.no];
		}
		return null;
	}
}

/**
 * @implements {IAsyncLoading}
 */
class MapBackAnimation extends MapBackBase {
	constructor(_raw) {
		super(_raw);
		this.update = this._update_and_preload;
	}

	/**
	 * @override
	 * @param {number} i - texture index
	 * @param {MapTexture} texture0
	 * @returns {MapTexture}
	 */
	_load_texture(i, texture0) {
		let path = ["/Map", "Back", this._texture_base_path, i].join("/");

		let texture = new MapTexture(this._texture_raw[i]);
		texture._url = path;

		return texture;
	}
	
	get _texture_base_path() {
		return [this._raw.bS, "ani", this._raw.no].join("/");
	}

	/**
	 * raw data
	 * texture set; info & data
	 * not array
	 */
	get _texture_raw() {
		try {
			return map_sprite.Back[this._raw.bS]["ani"][this._raw.no];
		}
		catch (ex) {
			debugger;
		}
		return null;
	}
}

class MapBackSkeletalAnim extends MapBackBase {
	constructor(_raw) {
		super(_raw);
		/** @type {SSAnim} */
		this.ssanim = null;
	}
	/** @type {string} */
	get _folder() {
		const ob = this._raw;
		//["Back"  ][obj.bS]["ani" ][obj.no][0    ][""]
		return `/Map/Back/${ob.bS}/spine/${ob.no}`;
	}
	async load() {
		if (SSAnim) {
			let ssanim = new SSAnim();
			try {
				await ssanim.load(this._folder);
				ssanim.update(0);//init pos data
			}
			catch (ex) {
				console.error(ex);
				return;
			}
			this.ssanim = ssanim;
		}
		else {
			return null;
		}
	}
	unload() {
		if (this.ssanim) {
			this.ssanim.unload();
			this.ssanim = null;
		}
	}
	update(stamp) {
		if (this.ssanim && window.enable_skeletal_anim) {
			this.ssanim.update(stamp);
		}
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {Vec2} center
	 * @param {Rectangle} viewRect - ?? no use
	 */
	draw(renderer, center, viewRect) {
		if ($gv.m_display_skeletal_anim) {
			if (this.ssanim) {
				const x = Math.trunc((-$gv.m_viewRect.x + 0.5) + this.x);
				const y = Math.trunc((-$gv.m_viewRect.y + 0.5) + this.y);

				renderer.ctx.setTransform(1, 0, 0, -1, x, y);

				this.ssanim.render();
			}
		}
	}
}


export class LifeSpawnPoint {
	/**
	 * @param {object} raw
	 * @param {string} spawnId - spawn index
	 */
	constructor(raw, spawnId) {
		Object.assign(this, raw);
		
		this.spawnId = spawnId;
		
		/**
		 * millisecond elapsed after life spawn
		 * @type {number}
		 */
		this.time = 0;

		/**
		 * now count of life was spawn
		 * @type {number}
		 */
		this.count = 0;

		if (!(raw instanceof LifeSpawnPoint)) {
			this.fh = raw.fh - 1;
		}
	}
	increaseLife() {
		++this.count;
		this.time = 0;
	}
	decreaseLife() {
		--this.count;
		this.time = 0;
	}
	getTimeElapsedAfterLifeSpawn() {
		return this.time;
	}
	getNowCountOfLifeWasSpawn() {
		return this.count;
	}
	/**
	 * @returns {LifeSpawnPoint}
	 */
	clone() {
		return new this.constructor(this);
	}
}

/**
 * Mob / NPC controller
 */
export class MapLifeEntity extends SceneObject {
	/**
	 * @param {LifeSpawnPoint} lifeSpawnPoint
	 * @param {number} lifeId - life index
	 */
	constructor(lifeSpawnPoint, lifeId) {
		super();
		let a = {
			type: "m",
			id: 8643000,
			x: 720,
			y: -771,
			mobTime: 0,
			f: 0,
			hide: 0,
			fh: 41 - 1,
			cy: -761,
			rx0: 647,
			rx1: 720,
		};

		/** @type {LifeRenderer} LifeRenderer|MobRenderer|NpcRenderer */
		this.renderer = null;

		/** @type {boolean} */
		this.is_dead = false;

		/** @type {LifeSpawnPoint} */
		this.spawn = lifeSpawnPoint;

		/** @type {number} */
		this.x = lifeSpawnPoint.x;

		/** @type {number} */
		this.y = lifeSpawnPoint.cy;//lifeSpawnPoint.y
		
		this.z = 5;

		/** @type {number} */
		this.angle = 0;
		
		/** @type {number} */
		this.front = Number(lifeSpawnPoint.f) ? 1 : -1;

		/** @type {boolean} */
		this.opacity = Number(lifeSpawnPoint.hide) ? 0.5 : 1;
		
		this.lifeId = lifeId;

		///** @type {string} */
		//this.type = lifeSpawnPoint.type;

		///** @type {string} */
		//this.id = lifeSpawnPoint.id;

		///** @type {number} */
		//this.mobTime = lifeSpawnPoint.mobTime;

		/////** @type {number} */
		////this.cy = lifeSpawnPoint.cy;

		///** @type {number} */
		//this.rx0 = lifeSpawnPoint.rx0;

		///** @type {number} */
		//this.rx1 = lifeSpawnPoint.rx1;
	}

	//AfterStep
	//get x() {
	//	return this._x;
	//}
	//set x(x) {
	//	this._x = x;
	//}
	//get y() {
	//	return this._y;
	//}
	//set y(y) {
	//	this._y = y;
	//}

	/**
	 * @param {LifeSpawnPoint} lifeSpawnPoint
	 * @param {World} mapController
	 * @param {number} lifeId - life index
	 */
	static Create(lifeSpawnPoint, mapController, lifeId) {
		let life;

		if (lifeSpawnPoint.type == "m") {
			life = new MapMob(lifeSpawnPoint, lifeId);
		}
		else if (lifeSpawnPoint.type == "n") {
			life = new MapNpc(lifeSpawnPoint, lifeId);
			//return;
		}
		else {
			alert("map life type: " + lifeSpawnPoint.type);
			debugger;
			return;
		}

		if (life) {
			life.load(lifeSpawnPoint.id, mapController);
		}

		return life;
	}
	
	/**
	 * load life description
	 * @param {LifeSpawnPoint} lifeSpawnPoint - {id: string, type:"m"||"n"}
	 */
	static async loadLifeDesc(lifeSpawnPoint) {
		let desc, id = lifeSpawnPoint.id;
		
		switch (lifeSpawnPoint.type) {
			case "m":
				desc = MobRenderer.loadDescription(id);
				break;
			case "n":
				desc = NpcRenderer.loadDescription(id);
				break;
			default:
				alert("map life type: " + lifeSpawnPoint.type);
				debugger;
				return;
		}
		
		return desc;
	}

	/**
	 * create entity, load data
	 * @param {string} id -  npc or mob id
	 * @param {World} mapController - no use
	 */
	async load(id, mapController) {//??: rename to create
		if (this.renderer) {
			await this.renderer.load(id);
		}
		else {
			debugger;
			alert("Unknow type of life in map");
		}
	}
	
	_destroy(mapController) {
		throw new Error("Not implement");
	}

	/**
	 * set die animation
	 * @param {number} type
	 */
	die(type) {
		throw new Error("Not implement");
		this.is_dead = true;
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		this.renderer.update(stamp);
	}

	/**
	 * @param {IRenderer} renderer
	 */
	draw(renderer) {
		renderer.globalAlpha = Math.max(0, Math.min(this.opacity, 1));
		this.renderer.draw(renderer, this.x, this.y, this.angle, this.front < 0);
	}
}
class MapMob extends MapLifeEntity {
	/**
	 * @param {LifeSpawnPoint} lifeSpawnPoint
	 * @param {number} lifeId - life index
	 */
	constructor(lifeSpawnPoint, lifeId) {
		super(lifeSpawnPoint, lifeId);
		this.renderer = new MobRenderer();

		/** @type {PMob} */
		this.$physics = null;
		
		/** @type {{[x:string]: object}} - {[level]: skill} */
		this.skills = {};

		//TODO: load mob info
		this.hp = 100000;
	}
	/**
	 * @param {string} id mobId
	 * @param {World} mapController
	 */
	async load(id, mapController) {//??: rename to create
		await super.load(id);

		this.$physics = mapController.createMob(this);
		this.$physics._loadAction(this.renderer.actions);
		
		await this._load_skill_by_mob_id(id);

		// experiment
		try {
			this._load_skill_info();

			const firstAttack = this.renderer._raw.info.attack[this.renderer._raw.info.firstAttack].info;
			if (this.skill_map[firstAttack]) {
				const firstSkillInfo = this.skill_map[firstAttack].skill_list[0];

				this.invokeSkill(firstSkillInfo.skill, firstSkillInfo.level);
			}

		}
		catch (ex) {
			//not thing
		}
	}

	/**
	 * @override
	 * @param {SceneObject} chara - 被 chara 攻擊
	 * @param {number} damage - 傷害
	 */
	damage(chara, damage) {
		if (!this.is_dead) {
			this.hp -= damage;

			console.log(`Mob(${this.$objectid}) 被 ${chara.$objectid} 攻擊，減少 ${damage} HP，剩下 ${this.hp}`);
			
			if (this.hp <= 0) {
				this.die();
			}
		}
	}

	/**
	 * @virtual
	 * if (chara == null) ??
	 * @param {SceneObject|null} chara - 被 chara 攻擊
	 * @param {number} moveX - unit is pixel
	 * @param {number} moveY - unit is pixel
	 */
	knockback(chara, moveX, moveY) {
	}

	/**
	 * @param {PPlayerState} pState
	 */
	_applyState(pState) {
		//move stand jump hit1 die1

		if (pState.jump) {
			this.renderer.action = "jump";
		}
		else if (pState.walk) {
			this.renderer.action = "move";
		}
		else {
			this.renderer.action = "stand";
		}
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		if (this.$physics) {
			if (!this.is_dead) {
				this._applyState(this.$physics.state);
			}
			else {
				this.$physics.stop();
			}
		}
		this.renderer.update(stamp);
	}

	/**
	 * @override
	 * @param {IRenderer} renderer
	 */
	draw(renderer) {
		if ($gv.m_display_mob) {
			super.draw(renderer);
		}
	}
	
	/* skill need map to action */
	_load_skill_info() {
		const _raw = this.renderer._raw;
		let attack = _raw.info.attack;
		let skill = _raw.info.skill;
		
		attack[1].info == _raw.info.skill[0].info
		attack[1].info == _raw.skill1.info
		
		var skill_map = {};
		for (let i = 1, sname; (sname = "skill" + i) in _raw; ++i) {
			let s = _raw[sname];
			if (s.info) {
				skill_map[s.info] = {
					anim: sname,
					skill_list: [],
				};
			}
		}
		
		var skill_info = {};
		for (let i in _raw.info.skill) {
			let si = _raw.info.skill[i];
			skill_info[si.skill + "." + si.level] = si;
			if (skill_map[si.info]) {
				skill_info[si.skill + "." + si.level].$anim = skill_map[si.info].anim;
				skill_map[si.info].skill_list.push(si);
			}
		}
		
		this.skill_map = skill_map;
		this.skill_info = skill_info;
	}
	
	_load_skill_by_mob_id(mob_id) {
		let tasks = [];
		switch(mob_id) {
			case "8880140":
			case "8880141": {
					const FlowerTrap = require("./MobSkill/238.FlowerTrap.js").FlowerTrap;
					const FairyDust = require("./MobSkill/238.FairyDust.js").FairyDust;
					this.skills = {
						[1]: new FlowerTrap(),
						[2]: new FlowerTrap(),
						[3]: new FlowerTrap(),
						[4]: new FairyDust(null, null),
						[5]: { load() {}, invoke: function (level) { console.info("invoke LaserRain"); } },
						[6]: { load() {}, invoke: function (level) { console.info("invoke ForcedTelepor"); } },
						[7]: { load() {}, invoke: function (level) { console.info("invoke Dragon"); } },
						[8]: { load() {}, invoke: function (level) { console.info("invoke Rush"); } },
						[9]: { load() {}, invoke: function (level) { console.info("invoke WelcomeBarrage"); } },
						[10]: new FairyDust(null, null),
					};
					this.skill_map_action = [];
					for (let i = 1; i <= 10; ++i) {
						switch (i) {
							case 1:
							case 2:
							case 3:
								break;
							case 4:
							case 10:
								this.skill_map_action[i] = "skill1";
								break;
							case 5:
								break;
							case 6:
								this.skill_map_action[i] = "skill4";
								break;
							case 7:
								this.skill_map_action[i] = "skill2";
								break;
							case 8:
								break;
							case 9:
								break;
						}
					}
				}
				break;
		}
		for (let lev in this.skills) {
			const skill = this.skills[lev];
			tasks.push(skill.load(lev));
		}
		return Promise.all(tasks);
	}
	
	invokeSkill(skill_id, level) {
		const skill = this.skills[level];
		if (skill) {
			const anim = this.skill_map_action[level];
			if (anim) {
				this.renderer.action = anim;
			}
			
			skill.invoke(level);
		}
		else {
			console.warn({ "unknow skill": skill_id, "level": level });
		}
	}
	
	_destroy(mapController) {
		let lifeSpawnPoint = this.spawn;
		if (lifeSpawnPoint instanceof LifeSpawnPoint) {
			lifeSpawnPoint.decreaseLife();
		}
		mapController.destroyMob(this);
		this.renderer = null;
	}

	/**
	 * set die animation
	 * @param {number=1} type
	 */
	die(type = 1) {
		this.renderer.action = "die" + type;
		this.is_dead = true;
	}
}

class MapNpc extends MapLifeEntity {
	/**
	 * @param {LifeSpawnPoint} lifeSpawnPoint
	 * @param {number} lifeId - life index
	 */
	constructor(lifeSpawnPoint, lifeId) {
		super(lifeSpawnPoint, lifeId);
		this.renderer = new NpcRenderer();
	}

	/**
	 * @override
	 * @param {IRenderer} renderer
	 */
	draw(renderer) {
		if ($gv.m_display_npc) {
			super.draw(renderer);
		}
	}

	_destroy(mapController) {
		let lifeSpawnPoint = this.spawn;
		lifeSpawnPoint.decreaseLife();
		mapController.destroyNpc(this);
		this.renderer = null;
	}

	/**
	 * set die animation
	 * @param {number} type
	 */
	die(type) {
		//TODO: npc die ??
		this.is_dead = true;
	}
}

let MapLifeEntityCapacityRate = 1;

class MapLifeManager {
	/**
	 * @param {World} mapController
	 */
	constructor(mapController) {
		/** @type {object} */
		this._raw = null;

		/** @type {LifeSpawnPoint[]} */
		this.spawnPoints = [];

		/** @type {MapMob[]} */
		this.entities = [];

		/** @type {World} */
		this.mapController = mapController;
	}

	/**
	 * @async
	 * @param {{life:{[spawnId:number]:{}}}} mapRawData
	 * @returns {Promise<undefined[]>}
	 */
	load(mapRawData) {
		let tasks = [];
		this._raw = mapRawData.life;

		let keys = Object.keys(this._raw)
			.map(i => {
				let n = parseInt(i, 10);
				if (Number.isSafeInteger(n)) {
					return n;
				}
				console.warn("MapLife.spawnId: " + i);
				return null;
			})
			.filter(i => i != null);

		for (let spawnId of keys) {
			let d = new LifeSpawnPoint(this._raw[spawnId], spawnId);
			tasks.push(MapLifeEntity.loadLifeDesc(d));
			this.spawnPoints.push(d);
		}
		return Promise.all(tasks);
	}

	unload() {
		for (let i = 0; i < this.entities.length; ++i) {
			const entity = this.entities[i];
			if (entity.spawn.type == "m") {
				entity.$physics._destroy(this.mapController);
			}
		}
		this.spawnPoints = [];
		this.entities = [];
	}

	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		for (let i = 0; i < this.spawnPoints.length; ++i) {
			let lifeSpawnPoint = this.spawnPoints[i];

			lifeSpawnPoint.time += stamp;

			if (lifeSpawnPoint.time >= 1000 && lifeSpawnPoint.count < MapLifeEntityCapacityRate) {
				lifeSpawnPoint.increaseLife();
				this.spawn(lifeSpawnPoint);
			}
		}

		for (let i = 0; i < this.entities.length; ++i) {
			let entity = this.entities[i];
			if (entity) {
				if (entity.renderer.action && entity.renderer.action.startsWith("die")) {
					const act = entity.renderer.actions[entity.renderer.action];
					if (act && act.isEnd()) {
						this.destroyLife(entity);
						continue;
					}
				}
				entity.update(stamp);
			}
		}
	}

	/**
	 * spawn life(npc / mob) by spawner
	 * @param {LifeSpawnPoint} lifeSpawnPoint
	 */
	spawn(lifeSpawnPoint) {
		let lifeId = 0;

		for (; lifeId < this.entities.length; ++lifeId) {
			if (!this.entities[lifeId]) {
				break;
			}
		}
		let entity = MapLifeEntity.Create(lifeSpawnPoint, this.mapController, lifeId);
		
		if (lifeId < this.entities.length) {
			this.entities[lifeId] = entity;
		}
		else {
			this.entities.push(entity);
		}
	}
	
	/**
	 * directly spawn npc
	 * @param {string} npcID
	 * @param {number} x
	 * @param {number} y
	 */
	spawnNpc(npcID, x, y, flip=false, fh=0) {
		let lifeSpawnPoint = new LifeSpawnPoint({
			type: "n",
			x: x | 0, y: y | 0, cy: y | 0,
			id: npcID,
			fh: fh,
			is_dummy: true,
		});
		this.spawn(lifeSpawnPoint);
	}
	/**
	 * directly spawn mob
	 * @param {string} mobID
	 * @param {number} x
	 * @param {number} y
	 */
	spawnMob(mobID, x, y, flip=false, fh=0) {
		let lifeSpawnPoint = new LifeSpawnPoint({
			type: "m",
			x: x | 0, y: y | 0, cy: y | 0,
			id: mobID,
			fh: fh,
			is_dummy: true,
		});
		this.spawn(lifeSpawnPoint);
	}
	
	destroyLife(entity) {
		if (!(entity instanceof MapLifeEntity)) {
			alert("MapLifeManager.killLife: can't kill non life");
			console.error("MapLifeManager.killLife: can't kill non life");
		}
		entity._destroy(this.mapController);
		delete this.entities[entity.lifeId];
	}
	destroyAll() {
		this.entities.forEach(a => this.destroyLife(a))
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {Vec2} center
	 * @param {Rectangle} viewRect
	 * @param {number} whereLayer - where layer index
	 */
	draw(renderer, center, viewRect, whereLayer) {
		for (let i = 0; i < this.entities.length; ++i) {
			let entity = this.entities[i];
			if (entity && ((entity.z != null && entity.z == whereLayer) || whereLayer == null)) {
				entity.draw(renderer);
			}
		}
	}
}

/**
 * require Renderer
 * @implements {IAsyncLoading}
 */
export class SceneMap {
	constructor() {
		/** @type {number} */
		this.stamp = 0;

		/** @type {MapBack[]} */
		this.background = [];

		/** @type {MapBack[]} */
		this.frontground = [];

		/** @type {MapObject[]} */
		this.layeredObject = [];

		/** @type {MapTile[]} */
		this.layeredTile = [];
		
		/** @type {{[tag:string]:MapBackBase}} */
		this.backTags = {};
		
		/** @type {{[name:string]:MapObject}} */
		this.namedObject = {};

		/** @type {World} */
		this.controller = new World();

		/** @type {MapLifeManager} */
		this.lifeMgr = new MapLifeManager(this.controller);
		
		/** @type {MapPortalManager} */
		this.portalMgr = new MapPortalManager();
		
		/** @type {MapParticle[]} */
		this.particleList = null;

		/** @type {Rectangle} */
		this.mapBound = null;

		/** @type {{[questId:string]: number}} */
		this.quest = {};

		/** @type {string} */
		this._url = null;//data url //debug

		/** @type {Promise<any>[]} */
		this.$load_tasks = [];

		/** @type {Promise<any>} */
		this.$promise = null;

		this.$loading_status = "unload";
		
		/** @type {function():void} */
		this.onload = null;
		
		/** @type {(function():void)[]} */
		this._onload = [];
	}

	static async _Init() {
		let $_mapString = null;
		let $mapString = {};

		$_mapString = await $get.data("/String/Map");

		for (let i in $_mapString) {
			for (let j in $_mapString[i]) {
				$mapString[j] = $_mapString[i][j];
				$mapString[j].$region = i;
			}
		}

		SceneMap._map_names = $mapString;

		window.$MapNames = SceneMap._map_names;
	}
	static Init() {
		return Promise.all([
			this._Init(),
			MapPortal.Init(),
		]);
	}

	/**
	 * @param {{[questId:string]: number}} quest
	 */
	isActivated(quest) {
		if (quest) {
			for (let id in quest) {
				if (this.quest[id] != quest[id]) {
					return false;
				}
			}
		}
		return true;
	}
	
	get $map_sprite() {
		return window.$map_sprite;
	}

	/**
	 * load map from loaded data
	 * @param {{back:{[backId:string]:any}}} raw
	 */
	async _constructBack(raw) {
		if (!("back" in raw)) {
			debugger;
			return;
		}
		let loading_task_map = new Map();
		for (let i = 0; i in raw.back; ++i) {
			let ob = raw.back[i];
			const url = this._url + `back/${i}`;

			/** @type {MapBack|MapBackAnimation} */
			let back;

			if (ob.ani == 0) {
				back = new MapBack(ob);
			}
			else if (ob.ani == 1) {
				back = new MapBackAnimation(ob);
			}
			else if (ob.ani == 2) {//Spine skeletal animation
				back = new MapBackSkeletalAnim(ob);
			}
			else {
				throw new Error("ob.ani: " + ob.ani);
			}
			back._url = url;
			if (back.backTags != null) {
				this.backTags[back.backTags] = back;
			}

			if (ob.ani != 2) {
				// add loading task
				if (back._raw.bS) {
					let ps = "Back/" + back._raw.bS;
					if (!loading_task_map.has(ps)) {
						loading_task_map.set(ps, map_load_package("Back", back._raw.bS));
					}
				}
				else {
					console.warn("MapBack: map.back[" + i + "].bS = " + back._raw.bS);
				}
			}

			if (ob.front != 0) {
				this.frontground.push(back);
			}
			else {
				this.background.push(back);
			}
		}

		await Promise.all([...loading_task_map.values()]);

		for (let i = 0; i < this.frontground.length; ++i) {
			let back = this.frontground[i];
			back.load();
		}
		for (let i = 0; i < this.background.length; ++i) {
			let back = this.background[i];
			back.load();
		}
	}
	/**
	 * load map from loaded data
	 * @param {{[layer:number]:{objs:{},tiles:{},info:{}}}} mapRawData
	 */
	async _constructLayeredObject(mapRawData) {
		let loading_task_map = new Map();

		for (let i = 0, layer = mapRawData[i]; !objIsEmpty(layer); i++ , layer = mapRawData[i]) {//layer[1...8]
			let objs = this.__constructLayeredObject_obj(i, layer, loading_task_map);
			let tiles = this.__constructLayeredObject_tile(i, layer, loading_task_map);

			// ?? map:867116550 雷射在 tiles 前面
			tiles.sort((a, b) => { return a.z - b.z; });
			objs.sort((a, b) => { return a.z - b.z; });

			//this.layeredObject[i] = objs.concat(tiles);//(objs.concat(tiles)).sort(function (a, b) { return a.z - b.z; });
			
			this.layeredObject[i] = objs;
			this.layeredTile[i] = tiles;
		}

		//wait all texture package loaded
		await Promise.all([...loading_task_map.values()]);

		for (let i = 0; i < this.layeredObject.length; ++i) {
			const objs = this.layeredObject[i];
			for (let j = 0; j < objs.length; ++j) {
				/**
				 * @type {MapObject}
				 */
				let obj = objs[j];
				if (process.env.NODE_ENV !== 'production') {//is debug
					try {
						obj.load();
					}
					catch (ex) {
						console.error("load textures failed: " + new URL("xml2" + obj._url, window.location).href);
					}
				}
				else {
					obj.load();
				}
			}
		}
		for (let i = 0; i < this.layeredTile.length; ++i) {
			const tiles = this.layeredTile[i];
			for (let j = 0; j < tiles.length; ++j) {
				let tile = tiles[j];
				tile.load();
			}
		}
	}
	__constructLayeredObject_tile(i, layer, loading_task_map) {
		const info = layer.info;
		let tiles = [];

		if (info.tS) {
			let ps = "Tile/" + info.tS;
			if (!loading_task_map.has(ps)) {
				loading_task_map.set(ps, map_load_package("Tile", info.tS));
			}
		}
		else if (Object.keys(layer.tile).length) {
			debugger;
			console.warn("[" + i + "].tile = " + JSON.stringify(layer.tile));
		}
		for (let j = 0, ti = layer.tile[j]; !objIsEmpty(ti); j++ , ti = layer.tile[j]) {
			let tile = new MapTile(ti, info);

			tile._url = this._url + `${i}/tile/${j}`;

			tiles.push(tile);
		}

		return tiles;
	}
	__constructLayeredObject_obj(i, layer, loading_task_map) {
		let objs = [];

		for (let j = 0, raw = layer.obj[j]; !objIsEmpty(raw); j++ , raw = layer.obj[j]) {
			let obj;

			if (raw.spineAni) {
				switch (raw.spineAni) {
					case "animation":
						break;
					case "idle":
						console.warn("spine animation: idle ??");
						break;
					default:
						console.groupCollapsed("unknow spine:" + raw.spineAni);
						console.warn(`LayeredObject[${i}][${j}]`);
						console.warn(raw);
						console.groupEnd();
						break;
				}
				obj = new MapObjectSkeletalAnim(raw);
			}
			else {
				obj = new MapObject(raw);

				let ps = "Obj/" + obj._raw.oS;
				if (!loading_task_map.has(ps)) {
					loading_task_map.set(ps, map_load_package("Obj", obj._raw.oS));
				}
			}

			obj._url = this._url + `${i}/obj/${j}`;
			
			if (obj.name != null) {
				this.namedObject[obj.name] = obj;
			}

			objs.push(obj);
		}

		return objs;
	}

	/**
	 * top-bottom-border compute by visible mapObject
	 */
	__compute_top_bottom_border(layeredObject) {
		let top = null, bottom = null;//left, right,
		//let i = 0;
		
		for (let i = 0; i < layeredObject.length; ++i) {
			const objs = layeredObject[i];
			for (let j = 0; j < objs.length; ++j) {
				const obj = objs[j];
				let rect = obj.compute_max_rectangle();
				if (rect && top != null && bottom != null) {
					//left = Math.min(left, rect.left);
					top = Math.min(top, rect.top);
					//right = Math.max(right, rect.right);
					bottom = Math.max(bottom, rect.bottom);
				}
				else {
					//left = rect.left;
					top = rect.top;
					//right = rect.right;
					bottom = rect.bottom;
				}
			}
		}
		
		return { top, bottom };
	}
	
	/**
	 * top-bottom-border compute by visible mapObject
	 */
	_compute_top_bottom_border() {
		let objtb = this.__compute_top_bottom_border(this.layeredObject);
		let tiletb = this.__compute_top_bottom_border(this.layeredTile);
		let top = Math.min(objtb.top, tiletb.top);
		let bottom = Math.max(objtb.bottom, tiletb.bottom);
		return { top, bottom };
	}

	//_compute_view_rectangle
	
	_compute_map_bound(reCalc) {
		if (this.mapBound && !reCalc) {
			return this.mapBound;
		}

		const info = this._raw.info;
		let top, bottom;

		if (info.VRLeft != null && info.VRTop != null && info.VRRight != null && info.VRBottom != null) {
			top = info.VRTop;
			bottom = info.VRBottom;
		}
		else {
			let tb = this._compute_top_bottom_border();
			top = tb.top;
			bottom = tb.bottom;
		}

		const lr = this.controller.ground._compute_left_right_border();

		let rect = Rectangle.parse(lr.left, top, lr.right, bottom);
		this.mapBound = rect;//store

		return rect;
	}
	
	get _window_title() {
		if (this.mapName) {
			return `${[this.mapName, this.streetName].join("·")} (${this.map_id})`;
		}
		else {
			return `${this.map_id}`;
		}
	}
	
	_get_map_data_url(map_id) {
		return `/Map/Map/Map${map_id.slice(0, 1)}/${map_id}`;
	}

	/**
	 * loading: map data
	 * @param {string} map_id
	 * @param {boolean} reload - download
	 */
	async load(map_id, reload) {
		this.$promise = await this._route_load(map_id, reload);
		delete this.$promise;//loaded
	}
	/**
	 * loading: map data
	 * @param {string} map_id
	 * @param {boolean} reload - download
	 */
	async _route_load(map_id, reload) {
		this.$loading_status = "loading";
		
		if (!reload && map_id != null && this.map_id == map_id && this._raw != null) {
			if (this.isLoaded()) {
				this.unload();
			}
			await this._load(this._raw);
			return;
		}
		const url = this._get_map_data_url(map_id);
		
		let raw;
		try {
			raw = await $get.data(url);
			if (!raw) {
				alert("map not exit");
				debugger;
				throw new Error("map not exit");
			}
		}
		catch (ex) {
			this.$loading_status = "failed: load";
			throw ex;
		}
		
		try {
			if (raw.info && raw.info.link) {
				const url2 = this._get_map_data_url(raw.info.link);
					
				raw = await $get.data(url2);
				if (!raw) {
					alert("map-link not exit");
					debugger;
					return;
				}
			}
		}
		catch (ex) {
			this.$loading_status = "failed: link";
			throw ex;
		}
		
		try {
			if (this.isLoaded()) {
				this.unload();
			}
		}
		catch (ex) {
			console.warn("SceneMap#unload");
		}
		
		try {
			this._url = url;
			this.map_id = map_id;
			
			await this._load(raw);
		}
		catch (ex) {
			this.$loading_status = "failed: constructor map";
			throw ex;
		}
		
		delete this.$loading_status;//loaded
	}
	/**
	 * load map from loaded data
	 * @param {{[prop:string]:{}}} raw
	 */
	async _load(raw) {
		const map_id = this.map_id;
		
		this._raw = raw;

		$gv.allQuest = {};
		
		this.controller.stop = true;//begin load
		
		if (SceneMap._map_names[map_id]) {
			this.mapName = SceneMap._map_names[map_id].mapName;
			this.streetName = SceneMap._map_names[map_id].streetName;
		}

		this.$load_tasks = [];

		this._loadBgm(raw);

		this.$load_tasks.push(this._constructBack(raw, this));
		
		this.$load_tasks.push(this._constructLayeredObject(raw, this).then((mapobj) => {
			//this.layeredObject
			//this.layeredTile
		}));
		
		this.$load_tasks.push(this.portalMgr.load(raw, this).then((portals) => {
		}));
		
		this.$load_tasks.push(this.__constructMiniMap(raw, this));

		this.$load_tasks.push(this.controller.load(raw, this));//load foothold...
		this.$load_tasks.push(this.lifeMgr.load(raw, this));
		
		this.$load_tasks.push(MapParticle.construct(raw, this));

		let load_results = await Promise.all(this.$load_tasks);
		
		const viewRect = this._compute_map_bound();
		const viewCenter = viewRect.center;
		
		$gv.m_viewRect.setCenter(viewCenter.x, viewCenter.y);
		
		this.controller._createMapBound(viewRect);
		
		this.controller.stop = false;//end load
		
		this.$load_tasks = [];
		console.log("completed scene_map.waitLoaded: [...]");
		
		this._script();
		
		if (this.onload) {
			this.onload.call(this);//history.pushState
		}
		
		console.log("End scene_map.load");
	}
	_script() {
		switch (this.map_id) {
			case "450004150":
			case "450004450":
			case "450004750":
				this.lifeMgr.spawnMob("8880166", 1000, 47, false, 0);//from /Etc/BossLucid
				this.lifeMgr.spawnMob("8880140", 1000, 47, false, 0);//from /Etc/BossLucid
				//this.lifeMgr.spawnMob("8880176", 1000, 47, false, 0);
				//this.lifeMgr.spawnMob("8880141", 1000, 47, false, 0);
				break;
		}
	}
	reload() {
		this.unload();
		this._load(this._raw);
	}
	
	unload() {
		this.$loading_status = "loading";
		
		for (let i = 0; i < this.background.length; ++i) {
			this.background[i].unload();
		}
		this.background = [];
		
		for (let i = 0; i < this.frontground.length; ++i) {
			this.frontground[i].unload();
		}
		this.frontground = [];
		
		for (let i = 0; i < this.layeredObject.length; ++i) {
			let objs = this.layeredObject[i];
			for (let j = 0; j < objs.length; ++j) {
				objs[j].unload();
			}
		}
		this.layeredObject = [];
		
		for (let i = 0; i < this.layeredTile.length; ++i) {
			let tiles = this.layeredTile[i];
			for (let j = 0; j < tiles.length; ++j) {
				tiles[j].unload();
			}
		}
		this.layeredTile = [];
		
		this.backTags = {};
		
		this.particleList = null;
		
		this.controller.unload();
		this.lifeMgr.unload();
		this.portalMgr.unload();
		
		map_sprite.Back = {};
		map_sprite.Obj = {};
		map_sprite.Tile = {};
	}

	/**
	 * load map from loaded data
	 * @param {{info:{bgm:string}}} mapRawData
	 */
	_getBgmPath(mapRawData) {
		let bgmPath = mapRawData.info.bgm;
		let i = bgmPath.indexOf("/"), path = bgmPath.slice(0, i) + bgmPath.slice(i);
		//let m = bgmPath.match(/([^\/]+)(\/.*)/), path = [m[1], m[2]].join("/");
		return ["", "Sound", path].join("/");
	}

	/**
	 * load map from loaded data
	 * @param {{info:{bgm:string}}} mapRawData
	 */
	_loadBgm(mapRawData) {
		const elem_bgm = document.getElementById("bgm");
		if (elem_bgm) {
			const path = this._getBgmPath(mapRawData);
			this._bgm_path = path;

			const url = $get.soundMp3Url(path);
			
			elem_bgm.innerHTML = `<source src="${url}" type="audio/mpeg">`;
			
			if (process.env.NODE_ENV === 'production') {
				elem_bgm.autoplay = true;
			}
			else {
				elem_bgm.autoplay = false;
			}
		}
		else {
			console.error(new TypeError("#bgm"));
		}
	}

	playBgm() {
		document.getElementById("bgm").play();
	}

	pauseBgm() {
		document.getElementById("bgm").pause();
	}
	
	__constructMiniMap(raw) {
		if (raw.miniMap) {
			//const hw = raw.miniMap.width * 0.5;
			//const hh = raw.miniMap.height * 0.5;
			//const cx = raw.miniMap.centerX;
			//const cy = raw.miniMap.centerY;
			this.width = raw.miniMap.width;
			this.height = raw.miniMap.height;
			this.centerX = raw.miniMap.centerX;
			this.centerY = raw.miniMap.centerY;
			//this.boundRect = new Rectangle(cx - hw, cy - hh, raw.miniMap.width, raw.miniMap.height);
		}
		else {
			this.width = 0;
			this.height = 0;
			this.centerX = 0;
			this.centerY = 0;
		}
	}
	
	_miniMap_src() {
		return this._url + "miniMap/canvas";
		const a = {
			"canvas": {
				"": ""
			},
			"width": 4483,
			"height": 1244,
			"centerX": 1030,
			"centerY": 781,
			"mag": 4
		};
	}

	/**
	 * wait all task: return true if nothing to loading else list of loaded object
	 * loading: texture...
	 * @returns {Promise<true>|Promise<any[]>}
	 */
	async waitLoaded() {
		await this.$promise;
	}

	isLoaded() {
		return ((!this.$load_tasks || !this.$load_tasks.length) && this._raw && !this.$loading_status);
	}


	/**
	 * @param {number} stamp
	 */
	update(stamp) {
		window.m_hover_object = null;
		if ($gv.mouse_dm || $gv.mouse_dr) {
			window.m_selected_object = null;
		}
		
		if (stamp != null) {
			this.stamp = stamp;

			this.lifeMgr.update(stamp);

			if (this.isLoaded()) {
				this.controller.update(stamp);
			}
		}
		else {
			debugger;
		}
	}
	
	/**
	 * @param {SceneCharacter} chara
	 */
	_addChara(chara) {
		try {
			let player_spawns = this.portalMgr.portals.filter(a => a.pn == "sp");
			let spawn = player_spawns[Math.trunc(Math.random() * 100) % player_spawns.length];
			const $physics = chara.$physics;
			const x = spawn.x / $gv.CANVAS_SCALE;
			const y = spawn.y / $gv.CANVAS_SCALE;
			$physics.setPosition(x, y);
			$physics.body.SetAwake(true);
		}
		catch (ex) {
			console.error(ex);
		}
	}
	/**
	 * @param {SceneCharacter} chara
	 */
	addChara(chara) {
		if (this.$promise) {
			this.$promise.then(() => {
				this._addChara(chara);
			});
		}
		else {
			this._addChara(chara);
		}
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	applyCamera(renderer) {
		renderer.ctx.setTransform(1, 0, 0, 1, Math.trunc(-$gv.m_viewRect.x), Math.trunc(-$gv.m_viewRect.y));
	}

	/**
	 * pushGlobalAlpha
	 * @param {IRenderer} renderer
	 */
	beginRender(renderer) {
		renderer.pushGlobalAlpha();
	}

	/**
	 * @param {IRenderer} renderer
	 */
	endRender(renderer) {
		renderer.popGlobalAlpha();
		//renderer.popMatrix();
	}

	/**
	 * @param {IRenderer} renderer
	 * @param {number} whereLayer - where layer index
	 */
	renderLife(renderer, whereLayer) {
		if (!$gv.m_display_life) {
			return;
		}
		const center = Vec2.empty;
		const viewRect = $gv.m_viewRect;
		
		this.lifeMgr.draw(renderer, center, viewRect, whereLayer);
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	renderPortal(renderer) {
		if (!$gv.m_display_portal) {
			return;
		}
		const center = Vec2.empty;
		const viewRect = $gv.m_viewRect;

		this.portalMgr.update(this.stamp);
		this.portalMgr.draw(renderer, center, viewRect);
	}

	/**
	 * @param {IRenderer} renderer
	 */
	renderFrontground(renderer) {
		if (!$gv.m_display_front) {
			return;
		}
		const center = $gv.m_viewRect.center;
		const viewRect = $gv.m_viewRect;
		
		for (let i = 0; i < this.frontground.length; ++i) {
			let back = this.frontground[i];
			if (this.isActivated(back.quest)) {
				back.update(this.stamp);
				back.draw(renderer, center, viewRect);
			}
		}
	}

	/**
	 * @param {IRenderer} renderer
	 */
	renderLayeredObject(renderer, layerIndex) {
		if (!$gv.m_display_mapobj) {
			return;
		}
		const center = Vec2.empty;
		const viewRect = $gv.m_viewRect;
		
		const objs = this.layeredObject[layerIndex];
		for (let j = 0; j < objs.length; ++j) {
			let obj = objs[j];
			if (this.isActivated(obj.quest)) {
				obj.update(this.stamp);
				obj.draw(renderer, center, viewRect);
			}
		}
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	renderLayeredTile(renderer, layerIndex) {
		if (!$gv.m_display_maptile) {
			return;
		}
		const center = Vec2.empty;
		const viewRect = $gv.m_viewRect;
		
		const tiles = this.layeredTile[layerIndex];
		for (let j = 0; j < tiles.length; ++j) {
			let tile = tiles[j];
			if (this.isActivated(tile.quest)) {
				tile.update(this.stamp);
				tile.draw(renderer, center, viewRect);
			}
		}
	}

	/**
	 * @param {IRenderer} renderer
	 */
	renderBackground(renderer) {
		if (!$gv.m_display_back) {
			return;
		}
		const center = $gv.m_viewRect.center;
		const viewRect = $gv.m_viewRect;
		
		for (let i = 0; i < this.background.length; ++i) {
			let back = this.background[i];
			if (this.isActivated(back.quest)) {
				back.update(this.stamp);
				back.draw(renderer, center, viewRect);
			}
		}
	}
	
	/**
	 * @param {IRenderer} renderer
	 */
	renderParticle(renderer) {
		if (!$gv.m_display_particle_system) {
			return;
		}
		//const center = Vec2.empty;
		const center = $gv.m_viewRect.center;
		const viewRect = $gv.m_viewRect;
		
		for (let i = 0; i < this.particleList.length; ++i) {
			let particle = this.particleList[i];
			if (this.isActivated(particle.quest)) {
				particle.update(this.stamp);
				particle.draw(renderer, center, viewRect);
			}
		}
	}
}
AddInitTask(SceneMap.Init());

///////////////////////////////////////////////////////////////////////////////
//
///////////////////////////////////////////////////////////////////////////////

function objIsEmpty(x) {
	if (typeof x == 'object' && x == null)
		throw new Error();
	return typeof x == 'undefined' || x == null;
}
