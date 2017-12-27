
function default_position() {
	return {
		x: 0,	// my props
		y: 0,	// my props
		my: "left top",	// my =	`${h}+${x} ${v}+${y}`
		at: "left top",
		//of: selector,
		collision: "flip",
		//using: null,
		//within: window,
	};
}

export default {
	props: {
		position: {
			default: function () {
				return default_position();
			}
		}
	},
	methods: {
		calcPosition: function (rel) {
			let pos = Object.assign(default_position(), this.position);
			let mypos;

			mypos = pos.my.replace(/[+-\d]/g, "").split(" ");

			if (mypos.length >= 2) {
				let x = rel.x || pos.x;
				let y = rel.y || pos.y;

				if (x > 0) {
					mypos[0] += "+" + x || "";
				}
				else if (x < 0) {
					mypos[0] += x || "";
				}

				if (y > 0) {
					mypos[1] += "+" + y || "";
				}
				else if (y < 0) {
					mypos[1] += y || "";
				}
				mypos = mypos.join(" ");
			}
			pos.my = mypos;

			//if (!pos.of) {
			//	pos.of = $(this.$el.parentElement);
			//}

			return pos;
		},
		setPosition: function (val) {
			$(this.$el).position(val);
		},
	},
	watch: {
		"position": {
			handler: function (val) {
				let pos = this.calcPosition(val);
				if (!pos.of) {
					this.setPosition(pos);
				}
				else {
					debugger;
					alert("JQueryUI.position(option)\nlost option.of:selector");
				}
			},
			deep: true,
		},
	},
};
