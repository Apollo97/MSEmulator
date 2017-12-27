
function  ajax_get(url) {
	return new Promise(function (resolve, reject) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);

		//xhr.timeout = 20000;

		xhr.onload = function () {
			if (this.status == 404 || this.status == 500) {
				resolve(null);
				//reject("404/500: " + url);
			}
			else if (this.status == 200) {
				resolve(this.responseText);
			}
			else if (this.status == 304) {
				debugger
			}
		};

		xhr.ontimeout = function (e) {
			// XMLHttpRequest 超时。在此做某事。
			resolve(null);
		};

		xhr.send();
	});
}
		
function main() {
}

var camera_x = 0;
var camera_y = 200;
var camera_zoom = 1.0;

var enable_render_webgl = false;
var enable_render_ctx2d = true;

main.start = function() {
	document.body.style.margin = '0px';
	document.body.style.border = '0px';
	document.body.style.padding = '0px';
	document.body.style.overflow = 'hidden';
	document.body.style.fontFamily = '"PT Sans",Arial,"Helvetica Neue",Helvetica,Tahoma,sans-serif';

	var controls = document.createElement('div');
	controls.style.position = 'absolute';
	document.body.appendChild(controls);

	var add_checkbox_control = function(text, checked, callback) {
		var control = document.createElement('div');
		var input = document.createElement('input');
		input.type = 'checkbox';
		input.checked = checked;
		input.addEventListener('click', function() {
			callback.call(this, this.checked);
		});
		control.appendChild(input);
		var label = document.createElement('label');
		label.innerHTML = text;
		control.appendChild(label);
		controls.appendChild(control);
	}

	var add_range_control = function(text, init, min, max, step, callback) {
		var control = document.createElement('div');
		var input = document.createElement('input');
		input.type = 'range';
		input.value = init;
		input.min = min;
		input.max = max;
		input.step = step;
		input.addEventListener('input', function() {
			callback.call(this, this.value);
			label.innerHTML = text + " : " + this.value;
		});
		control.appendChild(input);
		var label = document.createElement('label');
		label.innerHTML = text + " : " + init;
		control.appendChild(label);
		controls.appendChild(control);
	}

	//
		var canvas = document.createElement('canvas');
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.style.position = 'absolute';
		canvas.style.width = canvas.width + 'px';
		canvas.style.height = canvas.height + 'px';
		canvas.style.zIndex = -1; // behind controls

		document.body.appendChild(canvas);

		var ctx = canvas.getContext('2d');
		ctx.imageSmoothingEnabled = false;

		window.addEventListener('resize', function() {
			canvas.width = window.innerWidth;
			canvas.style.width = canvas.width + 'px';
			canvas.height = window.innerHeight;
			canvas.style.height = canvas.height + 'px';
		});
	//
		var canvas_gl = document.createElement('canvas');
		canvas_gl.width = window.innerWidth;
		canvas_gl.height = window.innerHeight;
		canvas_gl.style.position = 'absolute';
		canvas_gl.style.width = canvas_gl.width + 'px';
		canvas_gl.style.height = canvas_gl.height + 'px';
		canvas_gl.style.zIndex = -2; // behind 2D context canvas

		document.body.appendChild(canvas_gl);

		var gl = canvas_gl.getContext('webgl') || canvas_gl.getContext('experimental-webgl');

		window.addEventListener('resize', function() {
			canvas_gl.width = window.innerWidth;
			canvas_gl.height = window.innerHeight;
			canvas_gl.style.width = canvas_gl.width + 'px';
			canvas_gl.style.height = canvas_gl.height + 'px';
		});
	//

	add_checkbox_control("GL", enable_render_webgl, function(checked) {
		enable_render_webgl = checked;
	});
	add_checkbox_control("2D", enable_render_ctx2d, function(checked) {
		enable_render_ctx2d = checked;
	});
		
	camera_x = 0;
	camera_y = canvas.height / 2;
	camera_zoom = 1.0;
	
	camera_x = 0;
	camera_y = 0;//canvas.height / 2;
	camera_zoom = 0.5

	add_checkbox_control("2D Debug Data", ENABLE_RENDER_DEBUG_DATA, function(checked) {
		ENABLE_RENDER_DEBUG_DATA = checked;
	});
	add_checkbox_control("2D Debug Pose", ENABLE_RENDER_DEBUG_POSE, function(checked) {
		ENABLE_RENDER_DEBUG_POSE = checked;
	});
	add_range_control("x", camera_x, -canvas.width, canvas.width, 1, function(value) {
		camera_x = parseFloat(value);
	});
	add_range_control("y", camera_y, -canvas.height, canvas.height, 1, function(value) {
		camera_y = parseFloat(value);
	});
	add_range_control("zoom", camera_zoom, 0.1, 2, 0.1, function(value) {
		camera_zoom = parseFloat(value);
	});
	window.onmousewheel = function (e) {
		if (e.wheelDelta > 0) {
			camera_zoom += 0.1;
		}
		else if (e.wheelDelta < 0) {
			camera_zoom -= 0.1;
		}
	}
	
/* 
	add_range_control("Anim Rate", this.anim_rate, -2.0, 2.0, 0.1, function(value) {
		this.anim_rate = parseFloat(value);
	});

	add_range_control("Anim Blend", ANIM_BLEND, 0.0, 1.0, 0.01, function(value) {
		ANIM_BLEND = parseFloat(value);
	});
 */
	
	enable_render_webgl = false;
	enable_render_ctx2d = true;
	SSAnim.SetRenderingContext(ctx);
	//SSAnim.SetRenderingContext(gl);
	
	var tasks = [];
	var ssanim = window.ssanim = [];
	
	for (let i = 0; i < 6; ++i) {//6
		let ann = new SSAnim();
		let path;//, fname;
		let sp = 1;
		
		if (sp == 0) {
			path = "Map/Back/arcana1.img/spine/" + i;
			//fname = "skeleton";
		}
		else if (sp == 1) {
			path = "Map/Effect3.img/BossLucid/Lucid";
			//fname = "lusi";
			tasks.push(ann.load(path));
			ssanim.push(ann);
			break;
		}
		else if (sp == 2) {
			path = "Map/Obj/Lacheln.img/Boss/obj/9";
			//fname = "a_1";//002
			tasks.push(ann.load(path));
			ssanim.push(ann);
			break;
		}
		else if (sp == 3) {
			path = "Map/Obj/arcana.img/town/spine/0";
			tasks.push(ann.load(path));
			ssanim.push(ann);
			break;
		}
		else if (sp == 4) {
			path = "Map/Obj/arcana.img/town/spine/1";
			tasks.push(ann.load(path));
			ssanim.push(ann);
			break;
		}
		else if (sp == 5) {
			path = "Map/Back/Lacheln.img/spine/0";
			tasks.push(ann.load(path));
			ssanim.push(ann);
			break;
		}
		
		tasks.push(ann.load(path));
		ssanim.push(ann);
	}
	
	Promise.all(tasks).then(function () {
		requestAnimationFrame(loop);
	});

	var prev_time = 0;
	var loop = function(time) {
		requestAnimationFrame(loop);

		var dt = time - (prev_time || time);
		prev_time = time; // ms

		if (enable_render_ctx2d) {
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

			// origin at center, x right, y up
			ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
			ctx.scale(1, -1);

			ctx.translate(-camera_x, -camera_y);
			ctx.scale(camera_zoom, camera_zoom);
			ctx.lineWidth = 1 / camera_zoom;
		}
		if (enable_render_webgl) {
			var render_webgl = SSAnim.GetRenderer();
			var gl_color = render_webgl.gl_color;
			gl_color[3] = 1//alpha;

			var gl_projection = render_webgl.gl_projection;
			mat4x4Identity(gl_projection);
			mat4x4Ortho(gl_projection, -gl.canvas.width / 2, gl.canvas.width / 2, -gl.canvas.height / 2, gl.canvas.height / 2, -1, 1);

			if (enable_render_ctx2d && enable_render_webgl) {
				mat4x4Translate(gl_projection, gl.canvas.width / 4, 0, 0);
			}

			mat4x4Translate(gl_projection, -camera_x, -camera_y, 0);
			mat4x4Scale(gl_projection, camera_zoom, camera_zoom, 1);
		}
		if (enable_render_ctx2d || enable_render_webgl) {
			ssanim.forEach(a => {
				//ctx.translate(-100, 0);
				a.update(dt);
				
				a.render();
			});
		}
	}
}

