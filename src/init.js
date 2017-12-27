
import { } from "./util.js";

import Vue from "vue";
import Vuex from "vuex";

Vue.config.productionTip = false;

Vue.use(Vuex);

if (!window.onwheel) {
	window.onwheel = function () {
	}
}

let init_tasks = [];

export function AddInitTask(task) {
	init_tasks.push(task);
}

export function InitAll() {
	let a = Promise.all(init_tasks);
	init_tasks = [];
	return a;
}
