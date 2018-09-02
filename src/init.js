
import jQuery from "jquery";

import "jquery-ui/themes/base/core.css";
import "jquery-ui/themes/base/theme.css";
import "jquery-ui/themes/base/selectable.css";
import "jquery-ui/themes/base/sortable.css";
import "jquery-ui/themes/base/draggable.css";

import "jquery-ui/ui/core";
import "jquery-ui/ui/widgets/selectable";
import "jquery-ui/ui/widgets/sortable";
import "jquery-ui/ui/widgets/draggable";
import "jquery-ui/ui/disable-selection";
import "jquery-ui/ui/position";
import "jquery-ui/ui/effect";

import { } from "./util.js";

import Vue from "vue";
import Vuex from "vuex";

Vue.config.productionTip = false;
Vue.use(Vuex);

window.jQuery = jQuery;
window.$ = jQuery;

if (!window.onwheel) {
	window.onwheel = function () {
	}
}

let init_tasks = [];

export function AddInitTask(task) {
	init_tasks.push(task);
}

export function InitAll() {
	let promise_list = init_tasks.map(f => f());
	init_tasks = [];
	let a = Promise.all(promise_list);
	return a;
}
