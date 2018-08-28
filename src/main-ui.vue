
<template>
	<component :is="view"></component>
</template>

<script>
	import app_state from "./state.js";
	import UIApp from "./ui-app.vue";
	import UILogin from "./ui-login.vue";
	
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
		}
	};
</script>

<!--<style scoped>
</style>-->
