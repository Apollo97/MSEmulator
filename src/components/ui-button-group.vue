
<template>
	<div class="ui-button-group">
		<button v-for="(item, index) in buttons" :data-id="index" @click="onclick(index)" :style="item.style">
			<slot :text="item.text" :value="item.value" :index="index"></slot>
		</button>
	</div>
</template>

<script>
	export default {
		props: {
			buttons: {
				type: Array,
				required: true
			},
			type: {
				type: String,
				default: 'checkbox'
			},
			active: {
				type: [Number, Array],
				required: false
			},
		},
		methods: {
			onclick: function (id) {
				let selected;

				if (this.type == 'checkbox') {
					const index = this.active.indexOf(id);
					if (index >= 0) {
						selected = [...this.active];
						selected.splice(index, 1);
					}
					else {
						selected = [...this.active, id];
					}
					const buttons = this.buttons;
					let btns = selected.map(function (id) {
						return buttons[id];
					});
					this.$emit('update:active', selected);
					this.$emit('change', btns);
				}
				else {
					this.$emit('update:active', id);
					this.$emit('change', this.buttons[id]);
				}
			},
			_update_element: function () {
				let actives;
				if (this.type == 'checkbox') {
					if (!this.active) {
						return;
					}
					actives = this.active;
				}
				else {
					if (!Number.isInteger(this.active)) {
						return;
					}
					actives = [this.active];
				}
				let $el = this.$el;

				let $all_active = [...this.$el.querySelectorAll(".active")];
				let selected = $all_active.forEach(function (elem) {
					elem.classList.remove("active");
				});

				actives.forEach(function (id) {
					let elem = $el.querySelector(`[data-id="${id}"]`);
					if (elem) {
						elem.classList.toggle("active");
					}
					else {
						debugger;
					}
				});
			}
		},
		watch: {
			active: function () {
				this._update_element();
			},
		},
		mounted: function () {
			this._update_element();
		},
	};
	//<slot v-for="(value, key) in buttons" :value="value" :key="key"></slot>
</script>

<style>
	.ui-button-group input[type="radio"] {
		display: none;
	}
	.ui-button-group {
		display: flex;
	}
	.ui-button-group button {
		flex: 1;
		padding: 0;
		outline: none;
	}
	/*.ui-button-group button > * {
		width: 100%;
		height: 100%;
	}*/
</style>
