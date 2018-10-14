
<template>
	<div style="position: absolute; width: 100%; height: 100%; top: 0px; left: 0px; user-select: none;">
		<div>
			<table>
				<thead>
					<tr>
						<td>
							<h1>Select chat server</h1>
						</td>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(server, name) in serverList">
						<td style="width: 50%;"></td>
						<td>
							<button :disabled="is_lock_ui" @click="selectServer(name)">
								<h2>{{name}}</h2>
							</button>
						</td>
						<td style="width: 50%;"></td>
					</tr>
				</tbody>
			</table>

		</div>
	</div>
</template>

<script>
	import app_state from "./state.js";

	export default {
		data: function () {
			return {
				selected_server: "",
				is_lock_ui: false,
			};
		},
		computed: {
			serverList: function () {
				return app_state.state.serverList;
			}
		},
		methods: {
			selectServer: async function (serverName) {
				this.is_lock_ui = true;

				await app_state.dispatch('selectServer', {
					serverName: serverName,
				});

				document.getElementById("sys_info").style.display = "block";

				this.is_lock_ui = false;
			}
		},
		mounted: function () {
			document.getElementById("sys_info").style.display = "none";
		},
		beforeDestroy: function () {
		},
		components: {
		}
	};
</script>

<!--<style scoped>
</style>-->
