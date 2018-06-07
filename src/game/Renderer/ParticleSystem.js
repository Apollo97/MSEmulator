
import { ColorRGB, ImageDataHelper } from "../IRenderer.js";
import { Vec2, Rectangle } from "../math.js";
import { Sprite } from "../Sprite.js";


/**
 * @param {HTMLImageElement} image
 */
function whiteToRed(image) {
	let helper = new ImageDataHelper();
	let imagedata = helper.imageToImagedata(image);

	for (let y = 0; y < imagedata.height; ++y) {
		for (let x = 0; x < imagedata.width * 4; ++x) {
			//imagedata.data[y * imagedata.width * 4 + x * 4 + 0] = 0;
			imagedata.data[y * imagedata.width * 4 + x * 4 + 1] = 0;
			imagedata.data[y * imagedata.width * 4 + x * 4 + 2] = 0;
			//imagedata.data[y * imagedata.width * 4 + x * 4 + 3] = 0;
		}
	}

	return helper.imagedataToDataURL(imagedata);
}

/**
 * @param {number} min
 * @param {number} range
 * @returns {number} min + Random(-1, 1) * range
 */
function rand_r(min, range) {
	return min - range + Math.random() * range * 2;
}

/**
 * @param {ColorRGB} color
 * @param {ColorRGB} colorVar
 * @returns {ColorRGB}
 */
function rand_color2i(color, colorVar) {
	const col = ColorRGB.fromInt24(color);
	const cv = ColorRGB.fromInt24(colorVar);
	const r = Math.max(0, Math.min(rand_r(col.r, cv.r), 255));
	const g = Math.max(0, Math.min(rand_r(col.g, cv.g), 255));
	const b = Math.max(0, Math.min(rand_r(col.b, cv.b), 255));
	
	return new ColorRGB(r, g, b);
}
function _rand_color2i(color, colorVar) {
	return ColorRGB.fromInt24(Math.max(0, Math.min(rand_r(color, colorVar), 255)));
}

export class Particle {
	/** @param {ParticleSystem} ps */
	constructor(ps) {
		this._initParam(ps);

		this.life = 0;

		/** @type {Vec2} */
		this.pos = new Vec2(0, 0);
		
		this.opacity = 1;
		this.scale = this.startScale;
		this.color = new ColorRGB(255, 255, 255);
	}

	/** @param {ParticleSystem} ps */
	_initParam(ps) {
		this.lifeMax = rand_r(ps.life, ps.lifeVar);

		const angle = rand_r(ps.angle, ps.angleVar) * Math.PI / 180;//?rand_r

		if (1) {
			this.startColor = rand_color2i(ps.startColor, ps.startColorVar);
			this.color_d = rand_color2i(ps.endColor, ps.endColorVar).selfSub(this.startColor);
		}
		else {
			this.startColor = _rand_color2i(ps.startColor, ps.startColorVar);
			this.color_d = _rand_color2i(ps.endColor, ps.endColorVar).selfSub(this.startColor);
		}

		//unit: px
		const sizeX = Math.max(1, ps.texture.width);
		const sizeY = Math.max(1, ps.texture.height);
		//const size = Math.sqrt(sizeX ** 2 + sizeY ** 2);
		const size = sizeX == 1 ? sizeY:(sizeY == 1 ? 1 : Math.min(sizeX, sizeY));

		this.startScale = rand_r(ps.startSize, ps.startSizeVar) / size;
		const endScale = rand_r(ps.endSize, ps.endSizeVar) / size;
		this.scale_d = endScale - this.startScale;

		this.startX = rand_r(ps.posX, ps.posVarX);
		this.startY = rand_r(ps.posY, ps.posVarY);

		this.emitterMode = ps.emitterType ? 1 : 0;

		// Mode A: Gravity + tangential accel + radial accel
		if (!this.emitterMode) {//Particle.EMITTER_MODE.GRAVITY
			// gravity
			this.gravity = new Vec2(ps.GRAVITY.x, ps.GRAVITY.y);

			// speed
			const speed = rand_r(ps.GRAVITY.speed, ps.GRAVITY.speedVar);
			
			/** @type {Vec2} - velocity */
			this.dir = new Vec2(Math.cos(angle) * speed, -Math.sin(angle) * speed);

			// radial acceleration
			this.radialAccel = rand_r(ps.GRAVITY.radialAccel || 0, ps.GRAVITY.radialAccelVar || 0);

			// tangential acceleration
			this.tangentialAccel = rand_r(ps.GRAVITY.tangentialAccel || 0, ps.GRAVITY.tangentialAccelVar || 0);

			// rotation is dir
			this.rotationIsDir = ps.GRAVITY.rotationIsDir ? true : false;
		}
		else if (this.emitterMode == 1) {
			alert("Particle.EMITTER_MODE.RADIUS");
		}
	}

	/** @param {number} stamp - time in millisecond */
	update(stamp) {
		const dt = stamp / 1000;
		const tp = Math.max(0, Math.min(this.life / this.lifeMax, 1));

		// update position
		{
			let radial;

			// radial acceleration
			if (this.pos.x || this.pos.y) {
				radial = (new Vec2(this.pos.x, this.pos.y)).normalize();
			}
			else {
				radial = new Vec2(0, 0);
			}

			let tangential = radial.clone();
			radial = radial.mul(this.radialAccel);

			// tangential acceleration
			let newy = tangential.x;
			tangential.x = -tangential.y;
			tangential.y = newy;

			tangential = tangential.mul(this.tangentialAccel);

			let _radial = radial.add(tangential);
			_radial = _radial.add(this.gravity);
			_radial = _radial.mul(dt);
			
			this.dir = this.dir.add(_radial);

			let _dir = this.dir.mul(dt);
			this.pos = this.pos.add(_dir);
		}

		this.scale = Math.max(0, this.startScale + this.scale_d * tp);
		this.color = ColorRGB.add(this.startColor, ColorRGB.scale(this.color_d, tp));
		this.opacity = 1 - tp;
		
		this.life += stamp;
	}
	isEnd() {
		return this.life >= this.lifeMax;
	}
	draw(renderer, texture, mx, my) {
		const scale = this.scale;
		const x = (this.startX + this.pos.x + mx);
		const y = (this.startY + this.pos.y + my);
		
		renderer.globalAlpha = this.opacity;

		let color = this.color.toHSV();
		renderer.drawColoredGraph2(texture, x, y, scale, scale, color);
	}
}

class _ParticleGroupData {
	constructor() {
		this.GRAVITY = new Vec2();
		this.life = 0;
		this.lifeVar = 0;
		this.duration = 0;
		this.totalParticle = 0;
	}
}

export class ParticleGroup extends _ParticleGroupData {
	constructor() {
		this.x = 0;
		this.y = 0;

		/** @type {Particle[]} */
		this.particles = [];

		/** @type {number} time_in_ms:float */
		this.time = 0;

		/** @type {number} timeElapsed_in_ms:float */
		this.delta = 0;
		
		/** @type {number} */
		this.delay = Infinity;
		
		this.duration = -1;//Infinity
	}
	
	clone() {
		let pg = new ParticleGroup();
		Object.assign(pg, this);
		pg.particles = [];
		pg.time = 0;
		pg.delta = 0;
		return pg;
	}

	evaluate() {
		let totalTime = this.totalParticle * this.delay;

		for (let i = 0; i < this.totalParticle; ++i) {
			const particle = new Particle(this);
			const t = totalTime - i * this.delay;
			particle.life += t;
			particle.update(t);
			particle.life = t;
			this.particles.push(particle);
		}
	}
	
	async load(particle_name) {
		this.particleName = particle_name;

		/** @type ParticleGroupData */
		let data = JSON.parse(await $get.data(this._particle_path));
		
		Object.assign(this, data);

		this.GRAVITY.x = data.GRAVITY.x;
		this.GRAVITY.y = data.GRAVITY.y;

		this.life = data.life * 1000;
		this.lifeVar = data.lifeVar * 1000;
		this.duration = data.duration * 1000;

		//this.totalParticle = 2;//debug
		this.delay = this.life / this.totalParticle;

		if (_experimental_particle) {
			const that = this;
			return new Promise(function (resolve, reject) {
				let image = new Image();
				image.onload = function () {
					let texture = new Sprite(data.texture);
					if (_experimental_particle === true) {
						texture._url = whiteToRed(this);
					}
					else {
						texture._url = "data:image/svg+xml;utf-8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.naturalWidth}" height="${this.naturalHeight}">
	<defs>
		<mask id="Mask">
			<image xlink:href="${new URL("/images" + that._texture_base_path, window.location).href}"/>
		</mask>
	</defs>
	<g>
		<rect width="${this.naturalWidth}" height="${this.naturalHeight}" fill="red" mask="url(#Mask)"/>
	</g>
</svg>`);
					}
					that.texture = texture;
					resolve();
				}
				image.src = "/images" + that._texture_base_path;
			});
		}
		else {
			this.texture = new Sprite(data.texture);
			this.texture._url = "/images" + this._texture_base_path;
		}
	}
	
	/** @param {number} stamp - time in millisecond */
	update(stamp) {
		if (this.particles.length < this.totalParticle && (!this.time || this.time > this.delay)) {
			this.particles.push(new Particle(this));
			this.time = 0;
		}

		for (let i = 0; i < this.particles.length; ++i) {
			const particle = this.particles[i];
			if (particle.isEnd()) {
				this.particles.splice(i, 1);
			}
			else {
				particle.update(stamp);
			}
		}
		this.time += stamp;
		this.delta += stamp;
	}
	
	isEnd() {
		return (this.delta > this.duration && this.duration != -1);
	}
	
	/**
	 * @param {IRenderer} renderer
	 * @param {Rectangle} viewRect
	 * @param {number} mx - translate x
	 * @param {number} my - translate y
	 */
	render(renderer, viewRect, mx, my) {
		const ctx = renderer.ctx;

		renderer.ctx.setTransform(1, 0, 0, 1, Math.trunc(-$gv.m_viewRect.x), Math.trunc(-$gv.m_viewRect.y));
		if (this.blendFuncDst != 6 || this.blendFuncSrc != 5) {
			ctx.globalCompositeOperation = "lighter";
		}
		
		for (let i = 0; i < this.particles.length; ++i) {
			const particle = this.particles[i];
			const x = this.x + mx;
			const y = this.y + my;
			const hw = this.texture.width * particle.scale;
			const hh = this.texture.height * particle.scale;
			
			if (!viewRect || viewRect.collide4f2(x + particle.startX + particle.pos.x, y + particle.startY + particle.pos.y, hw, hh)) {
				particle.draw(renderer, this.texture, x, y);
			}
		}
		
		//reset
		ctx.globalCompositeOperation = "source-over";
		renderer.globalAlpha = 1;
	}
	
	get _particle_path() {
		return ["/Effect/particle.img", this.particleName].join("/");
	}
	get _texture_base_path() {
		return [this._particle_path, "texture"].join("/");
	}
}




