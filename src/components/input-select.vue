<template>
	<select ref='input' :value='value' @input='update($event.target.value)' @wheel.stop.prevent='wheel'><slot></slot></select>
</template>

<script>
export default {
	model: {
		prop: "value",
		event: "input",
	},
	props: ["value"],
	methods: {
		update: function (val) {
			this.$emit("input", val);
			this.$parent.$forceUpdate();
		},
		wheel: function (event) {
			const values = [...this.$el.children].map(a=>a.value);
			const length = values.length;
			
			let index = values.indexOf(event.target.value);
			if (event.deltaY < 0) {
				index -= 1;
			}
			else if (event.deltaY > 0) {
				index += 1;
			}
			index = index >= 0 ? (index % length) : (length - 1);
			this.update(values[index]);
		},
	},
}
</script>
