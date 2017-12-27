
<template>
	<div :class="active ? 'active':''"><slot></slot></div>
</template>

<script>
	export default {
		data: function () {
			return {
				active: false
			}
		}
	}
</script>

<style scoped>
	div {
		margin: 0;
		padding: 0;
	}

	.active {
		background: linear-gradient(to bottom, #ffec64 5%, #ffab23 100%);
		background-color: #ffec64;
	}
</style>

