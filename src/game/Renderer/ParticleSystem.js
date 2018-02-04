
import { ColorRGB, ImageDataHelper } from "../IRenderer.js";
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

function rand_r(min, range) {
	return min + Math.random() * range;
}
function rand_2r(min, range) {
	return min - range + Math.random() * range * 2;
}
function rand_color2i(color, colorVar) {
	const col = ColorRGB.fromInt24(color);
	const cv = ColorRGB.fromInt24(colorVar);
	const r = Math.max(0, Math.min(rand_2r(col.r, cv.r), 255));
	const g = Math.max(0, Math.min(rand_2r(col.g, cv.g), 255));
	const b = Math.max(0, Math.min(rand_2r(col.b, cv.b), 255));
	
	return new ColorRGB(r, g, b);
}
function _rand_color2i(color, colorVar) {
	return ColorRGB.fromInt24(Math.max(0, Math.min(rand_2r(color, colorVar), 255)));
}

export class Particle {
	/** @param {ParticleSystem} ps */
	constructor(ps) {
		this.lifeMax = rand_2r(ps.life, ps.lifeVar);
		
		const angle = rand_2r(ps.angle, ps.angleVar) * Math.PI / 180;//?rand_r
		
		if (1) {
			this.startColor = rand_color2i(ps.startColor, ps.startColorVar);
			this.color_d = rand_color2i(ps.endColor, ps.endColorVar).selfSub(this.startColor);
		}
		else {
			this.startColor = _rand_color2i(ps.startColor, ps.startColorVar);
			this.color_d = _rand_color2i(ps.endColor, ps.endColorVar).selfSub(this.startColor);
		}
		
		const size = Math.max(1, ps.texture.width);
		this.startScale = rand_2r(ps.startSize, ps.startSizeVar) / size;
		this.scale_d = ((rand_2r(ps.endSize, ps.endSizeVar) / size) - this.startScale);
		
		this.startX = rand_2r(ps.posX, ps.posVarX);
		this.startY = rand_2r(ps.posY, ps.posVarY);
		
		const speed = rand_r(ps.GRAVITY.speed, ps.GRAVITY.speedVar) / 1000;// 1 ms/px
		this.dx = Math.cos(angle) * speed * this.lifeMax;
		this.dy = -Math.sin(angle) * speed * this.lifeMax;
		
		this.gx = ps.GRAVITY.x;//gravity
		this.gy = ps.GRAVITY.y;//gravity
		
		this.life = 0;
		
		this.opacity = 1;
		this.scale = this.startScale;
		this.color = new ColorRGB(255, 255, 255);
	}
	/** @param {number} stamp - time in millisecond */
	update(stamp) {
		const dt = stamp / 1000;
		const tp = Math.max(0, Math.min(this.life / this.lifeMax, 1));
		
		this.x = this.startX + this.dx * tp;// + this.gx;
		this.y = this.startY + this.dy * tp;// + this.gy;
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
		const x = (this.x + mx);
		const y = (this.y + my);
		
		renderer.globalAlpha = this.opacity;
		
		renderer.drawColoredGraph2(texture, x, y, scale, scale, this.color);
	}
}

export class ParticleGroup {
	constructor() {
		this.x = 0;
		this.y = 0;
		
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
		
		let data = JSON.parse(await ajax_get("/assets/" + this._particle_path));
		
		Object.assign(this, data);

		this.GRAVITY = {};
		Object.assign(this.GRAVITY, data.GRAVITY);

		this.life = data.life * 1000;
		this.lifeVar = data.lifeVar * 1000;
		this.duration = data.duration * 1000;

		//this.totalParticle = 2;
		this.delay = (this.life + this.lifeVar / 2) / this.totalParticle;

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
			<image xlink:href="${new URL("/images/" + that._texture_base_path, window.location).href}"/>
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
				image.src = "/images/" + that._texture_base_path;
			});
		}
		else {
			this.texture = new Sprite(data.texture);
			this.texture._url = "/images/" + this._texture_base_path;
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

		renderer.ctx.setTransform(1, 0, 0, 1, Math.trunc(-m_viewRect.x), Math.trunc(-m_viewRect.y));
		ctx.globalCompositeOperation = "lighter";
		
		for (let i = 0; i < this.particles.length; ++i) {
			const particle = this.particles[i];
			const x = this.x + mx;
			const y = this.y + my;
			const hw = this.texture.width * particle.scale;
			const hh = this.texture.height * particle.scale;
			
			if (!viewRect || viewRect.collide4f2(x + particle.x, y + particle.y, hw, hh)) {
				particle.draw(renderer, this.texture, x, y);
			}
		}
		
		//reset
		ctx.globalCompositeOperation = "source-over";
		renderer.globalAlpha = 1;
	}
	
	get _particle_path() {
		return ["Effect/particle.img", this.particleName].join("/");
	}
	get _texture_base_path() {
		return [this._particle_path, "texture"].join("/");
	}
}




