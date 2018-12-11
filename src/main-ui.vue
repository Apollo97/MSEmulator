
<template>
	<div>
		<component :is="view"></component>
		<frame-2 ref="smallTip" style="position: absolute;"></frame-2>
	</div>
</template>

<script>
	import app_state from "./state.js";
	import UIApp from "./ui-app.vue";
	import UILogin from "./ui-login.vue";
	import UISelectServer from "./ui-select-server.vue";

	window.$app_state = app_state;
	
	export default {
		store: app.store,
		data: function () {
			return {
			};
		},
		computed: {
			view: function () {
				return app_state.state.view;
			}
		},
		methods: {
		},
		mounted: function () {
			document.getElementById("loading").style.display = "none";
		},
		beforeDestroy: function () {
		},
		components: {
			"ui-app": UIApp,
			"ui-login": UILogin,
			"ui-select-server": UISelectServer,
			"frame-2": () => import("./ui/UIToolTip/Frame2.vue"),
		}
	};
</script>

<!--<style scoped>
</style>-->
