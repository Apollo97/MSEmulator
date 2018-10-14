
<template>
	<div style="position: absolute; width: 100%; height: 100%; top: 0px; left: 0px; user-select: none;">
		<div>
			<table style="width: 100%; height: 100%;">
				<thead>
					<tr>
						<td>
							<h1>Select chat server</h1>
						</td>
					</tr>
				</thead>
				<tbody>
					<tr>
						<th>Account</th>
						<td><input :disabled="is_lock_ui" type="text" v-model="account" /></td>
					</tr>
					<tr>
						<th>Password</th>
						<td><input :disabled="is_lock_ui" type="text" v-model="password" /></td>
					</tr>
					<tr>
						<th></th>
						<td><button :disabled="is_lock_ui" @click="login">Login</button></td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<th></th>
						<td>Auto create account</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>
</template>

<script>
	import app_state from "./state.js";

	export default {
		data: function () {
			return {
				account: "",
				password: "",
				is_lock_ui: false,
			};
		},
		methods: {
			login: async function () {
				this.is_lock_ui = true;

				await app_state.dispatch('login', {
					account: this.account,
					password: this.password,
				});

				this.is_lock_ui = false;
			},
		},
	}
</script>

<style scoped>
</style>
