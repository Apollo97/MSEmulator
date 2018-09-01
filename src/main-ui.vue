
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
	import Frame2 from "./ui/UIToolTip/Frame2.vue";
	
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
			"frame-2": Frame2,
		}
	};
</script>

<!--<style scoped>
</style>-->
