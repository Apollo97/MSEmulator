<template>
	<input :value='value' :step='step' :min='min' :max='max' @input='update($event.target.value)' @wheel.stop.prevent='wheel' type='number' />
</template>

<script>
export default {
	model: {
		prop: "value",
		event: "input",
	},
	props: ["value", "step", "min", "max", "fixed"],
	computed: {
		_$value: function () {
			return this.value === "" ? 0 : Number(this.value);
		},
		_$step: function () {
			return this.step != null ? Number(this.step) : 1;
		},
		_$min: function () {
			const { min = -Infinity } = this;
			return Number(min);
		},
		_$max: function () {
			const { max = Infinity } = this;
			return Number(max);
		},
	},
	methods: {
		_$toFixed(val) {
			const fixed = Number(this.fixed);
			if (Number.isSafeInteger(fixed)) {
				return val.toFixed(fixed);
			}
			return val;
		},
		update: function (val) {
			if (val === "") {
				return;
			}
			
			val = Math.max(this._$min, Math.min(val, this._$max));
			
			this.$emit("input", this._$toFixed(val));
			this.$parent.$forceUpdate();
		},
		wheel: function (event) {
			if (event.target.value === "") {
				return;
			}
			
			const step = this._$step;
			let val = Number(event.target.value);
			if (event.deltaY < 0) {
				val += step;
			}
			else if (event.deltaY > 0) {
				val -= step;
			}
			this.update(val);
		},
	},
}
</script>
