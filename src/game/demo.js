

window.$angle = 0;
window.$rota = 0;
window.$flip = false;

window.$x = 300;
window.$y = 300;
window.$text = "";
window.$text2 = "";

void function () {
	window.oninput_text = function (e) {
		window.$text = e.target.value;
	};
	window.oninput_text2 = function (e) {
		window.$text2 = e.target.value;
	};
	let div = document.createElement("div");
	div.innerHTML = `
	<label>Text <input type="text" value="${window.$text}" oninput="oninput_text(event)" /></label>
	<label>Name <input type="text" value="${window.$text2}" oninput="oninput_text2(event)" /></label>
`;
	div.style.display = "inline-block";
	div.style.position = "sticky";
	div.style.left = "1em";
	div.style.top = "1em";
	div.style.border = "1px solid black";
	
	document.body.append(div);
}();

void async function () {
	await import('./init.js');

	const { Vec2, Rectangle } = await import('./math.js');
	const { IGraph, IRenderer } = await import('./IRenderer.js');

	const { engine, Graph } = await import('./Engine.js');

	const { CharacterRenderer } = await import('./Renderer/CharacterRenderer.js');
	const { ChatBalloon } = await import('./Renderer/ChatBalloon.js');
	const { NameLabel } = await import('./Renderer/NameLabel.js');
	const { Animation } = await import('./Animation.js');

	window.m_is_run = true;

	window.$engine = engine;

	//window.chara = new CharacterRenderer();

	var screen_size = engine.screen_size;

	if (window.chara) {
		chara.load();
		chara._setup_test();

		chara.x = screen_size.x / 2;
		chara.y = screen_size.y / 2;
	}

	let chatBalloon = new ChatBalloon();
	window.chatBalloon = chatBalloon;
	
	let nameLabel = new NameLabel();
	window.nameLabel = nameLabel;

	Promise.all([
		//$get.data("/Skill/MobSkill/238/level/4"),
		chatBalloon.load(136),
		nameLabel.load("40"),
	]).then(async function (_data) {
		//let _raw = JSON.parse(_data);
		//window.anima = new Animation(_raw["ball0"], "/Skill/MobSkill/238/level/4/ball0");
		if (window.anima) {
			anima.is_loop = true;
			anima.load();
		}
	}).then(() => {
		if (!animationRequestID) {
			render(0);
		}
	});

	var animationRequestID = null;
	var time0 = 0;
	function render(time) {
		let stamp = time - time0;
		time0 = time;
		if (window.m_is_run) {
			animationRequestID = requestAnimationFrame(render);
		}

		engine.ctx.setTransform(1, 0, 0, 1, 0, 0);
		engine.clearDrawScreen();
		engine.beginScene();

		if (window.chara) {
			if ($gv.mouse_dl) {
				chara.speed = 1;
				chara.x = $gv.mouse_x;
				chara.y = $gv.mouse_y;
			}
			if ($gv.mouse_dr) {
				chara.speed = 0;
			}

			chara.update(stamp);
		}
		chatBalloon.draw(engine, window.$text || "123451234512345123451234512345123451234512345123451234512345123451234512345123451234", (window.$x || 0), (window.$y || 0), 84);
		//ChatBalloon origin
		engine.ctx.beginPath();
		engine.ctx.fillStyle = "#F007";
		engine.ctx.fillRect((window.$x || 0), (window.$y || 0), 32, 32);
		
		nameLabel.draw(engine, window.$text2 || "Maple", (window.$x || 0), (window.$y || 0));

		engine.loadIdentity();
		engine.scale(1, (screen_size.y + 1) / screen_size.y);

		if (window.chara) {
			chara.render(engine);
		}

		if (window.anima) {
			anima.update(stamp);
			anima.draw(engine, screen_size.x / 2, screen_size.y / 2, window.$angle || 0, window.$flip != undefined ? window.$flip : false);

			// const sc_size = engine.screen_size;
			// const ctx = engine.ctx;

			// const graph = anima.textures[anima.frame];
			// const cx = graph.width * 0.5;
			// const cy = graph.height * 0.5;

			// ctx.setTransform(1, 0, 0, 1, sc_size.x * 0.5, sc_size.y * 0.5);

			// ctx.rotate(window.$angle);

			// ctx.scale(window.$flip ? -1 : 1, 1);

			// ctx.translate(-graph.x, -graph.y);

			// //ctx.translate(cx, cy);
			// //ctx.translate(-cx, -cy);

			// {
			// ctx.beginPath();
			// ctx.moveTo(0, 0);
			// ctx.lineTo(0 + 32, 0);
			// ctx.strokeStyle = "red";
			// ctx.stroke();

			// ctx.beginPath();
			// ctx.moveTo(0, 0);
			// ctx.lineTo(0, 0 + 32);
			// ctx.strokeStyle = "#0f0";
			// ctx.stroke();
			// }

			// engine.drawGraph(graph);

			window.$angle += window.$rota;
		}

		{
			const ctx = engine.ctx;
			const sc_size = engine.screen_size;
			ctx.setTransform(1, 0, 0, 1, sc_size.x * 0.5, sc_size.y * 0.5);

			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0 + 32, 0);
			ctx.strokeStyle = "darkred";
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(0, 0 + 32);
			ctx.strokeStyle = "darkgreen";
			ctx.stroke();
		}
		engine.ctx.setTransform(1, 0, 0, 1, 0, 0);

		//x
		engine.color = [1, 0, 0, 0.5];
		engine.drawRect(0, 0, 800, 1);

		//y
		engine.color = [0, 1, 0, 0.5];
		engine.drawRect(0, 0, 1, 600);

		//x
		engine.color = [0.8, 0.2, 0.2, 0.5];
		engine.drawRect(screen_size.x - 800, screen_size.y - 2, screen_size.x, 1);

		//y
		engine.color = [0.2, 0.8, 0.2, 0.5];
		engine.drawRect(screen_size.x - 1, screen_size.y - 600, 1, screen_size.y);

		//engine.drawRect(0, -1000, 1000, 1000, [1, 0, 0, 0.5]);
		//engine.drawRect(0, 0, 32, 32, [1, 0, 1, 0.5]);//chip-size

		engine.endScene();
	}

	document.getElementById("m_is_run").onchange = function (e) {
		window.m_is_run = e.target.checked ? true : false;
		if (window.m_is_run) {
			animationRequestID = requestAnimationFrame(render);
		}
	};

	$gv.mouse_move = 0;
	$gv.mouse_x = 0;
	$gv.mouse_y = 0;
	$gv.mouse_dl = 0;
	$gv.mouse_ul = 0;
	$gv.mouse_dm = 0;
	$gv.mouse_um = 0;
	$gv.mouse_dr = 0;
	$gv.mouse_ur = 0;
	$gv.mouse_wheel = 0;

	/**
	 * @param {MouseEvent} e
	 */
	window.onmousedown = function (e) {
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
		$gv.mouse_x = e.pageX;
		$gv.mouse_y = e.pageY;
		$gv.mouse_move = 1;
	}

	window.onwheel = function (event) {
		if (event.deltaY < 0) {
			$gv.mouse_wheel = 1;
		}
		else if (event.deltaY > 0) {
			$gv.mouse_wheel = -1;
		}
	}
}()

if (module.hot) {
	module.hot.accept(function () {
		window.location.reload();
	});
}

