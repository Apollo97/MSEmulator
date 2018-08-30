
/*interface InputKeyMap {
	[keyName: string]: number;
}*/

export class InputKey {
	constructor() {
		/** @type {number} */
		this.time = 0;
		
		/** @type {string[][]} */
		this.inputCommand = [];
		
		/** @type {boolean} */
		this._skip_prev = false;
	}
	
	/**
	 * @param {number} stamp
	 * @param {InputKeyMap} keyDownMap
	 */
	update(stamp, keyDownMap) {
		if ((stamp - this.time) > 333) {
			this.inputCommand.length = 0;//clear
		}
		/** @type {string[]} */
		let keys = [];
		for (let keyName in keyDownMap) {
			if (keyDownMap[keyName]) {
				keys.push(keyName);
			}
		}
		
		if (!this.inputCommand.length || this._skip_prev) {
			this._skip_prev = false;
			this.inputCommand.push(keys);
		}
		else {
			if (keys.length) {
				this._skip_prev = false;
				if (!this._equals_input(this.inputCommand.length - 1, keys)) {
					this.inputCommand.push(keys);
				}
			}
			else {
				this._skip_prev = true;
			}
		}
		
		this.time = stamp;
	}
	
	/**
	 * @param {number} index - this.inputCommand[index]
	 * @param {string[]} keys
	 */
	_equals_input(index, keys) {
		const iCmd = this.inputCommand[index];
		if (!iCmd) {
			return false;
		}
		for (let j = 0; j < keys.length; ++j) {
			const keyName = keys[j];
			
			if (!(iCmd && iCmd.indexOf(keyName) >= 0 && iCmd.length == keys.length)) {
				return false;
			}
		}
		return true;
	}
	
	/**
	 * @param {string[][]} command
	 * @param {number} length - command length
	 * @returns {boolean}
	 *
	 * length = length + command.length
	 */
	match(command, length = command.length) {
		if (!this.inputCommand.length) {
			return false;
		}
		
		if (length < 0) {
			length = length + command.length;
		}
		
		for (let i = 0; i < length; ++i) {
			let r = this._equals_input(i, command[i]);
			if (!r) {
				return false;
			}
		}
		
		return true;
	}
}

function unit_test () {
	(function () {
		let ctrller = new InputKey();

		ctrller.update(0, {
			"down": 1,
		});
		ctrller.update(222, {
			"down": 1,
			"right": 1,
		});
		ctrller.update(444, {
			"right": 1,
		});

		let r = ctrller.match([
			["down"],
			["down", "right"],
			["right"],
		]);

		console.log("%o: %o\n\t%o", "全部正確", r, ctrller);
	})();

	(function () {
		let ctrller = new InputKey();

		ctrller.update(0, {
			"down": 1,
		});
		ctrller.update(222, {
			"down": 1,
			"right": 1,
		});
		ctrller.update(444, {
			"down": 1,
			"right": 1,
		});

		let r = ctrller.match([
			["down"],
			["down", "right"],
			["right"],
		]);

		console.log("%o: %o\n\t%o", "多按一個鍵", r == false, ctrller);
	})();

	(function () {
		let ctrller = new InputKey();

		ctrller.update(0, {
			"down": 1,
		});
		ctrller.update(222, {
			"down": 1,
		});

		let r = ctrller.match([
			["down"],
			["down"],
		]);

		console.log("%o: %o\n\t%o", "按住", r == false, ctrller);
	})();

	(function () {
		let ctrller = new InputKey();

		ctrller.update(0, {
			"down": 1,
		});
		ctrller.update(666, {
			"right": 1,
		});

		let r = ctrller.match([
			["down"],
			["right"],
		]);

		console.log("%o: %o\n\t%o", "間隔太長", r == false, ctrller);
	})();

	(function () {
		let ctrller = new InputKey();

		ctrller.update(0, {
			"down": 1,
		});
		ctrller.update(222, {
		});
		ctrller.update(444, {
			"down": 1,
		});

		let r = ctrller.match([
			["down"],
			["down"],
		]);

		console.log("%o: %o\n\t%o", "連按", r, ctrller);
	})();
}

