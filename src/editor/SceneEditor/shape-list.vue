
<template>
	<table>
		<thead>
			<tr>
				<td>
					<div style="display: flex;">
						<button @click="newShape">New</button>
						<button @click="duplicateShape">Duplicate</button>
						<button @click="deleteShape">Delete</button>
					</div>
				</td>
			</tr>
			<tr>
				<th>
					<input type="text" v-model="name" @blur="editNameBlur($event)" style="background: transparent;" />
				</th>
				<td v-if="alertName">
					<span style="background-color: yellow; color: red;">名稱重複</span>
				</td>
				<th v-if="isShowType">Type</th>
			</tr>
		</thead>
		<tbody>
			<template v-for="shape in editor.shapes">
				<tr @click="selectShape(shape.name)" :class="{selected:editor.selectedShapeName==shape.name}">
					<th>
						<span>{{shape.name}}</span>
					</th>
					<th v-if="isShowType">
						<span>{{shape.type}}</span>
					</th>
				</tr>
			</template>
		</tbody>
	</table>
</template>

<script>
	import { ShapeDef } from "./ShapeDefinition.js";


	let shapeSN = 0;

	export default {
		props: {
			editor: {
				required: true,
			},
		},
		data: function () {
			return {
				isShowType: false,
				name: null,
				alertName: false,
			};
		},
		methods: {
			newShape: function () {
				const editor = this.editor;
				let def = new ShapeDef();
				def.name = "Shape_" + (++shapeSN);
				editor.shapes.push(def);
			},
			duplicateShape: function (index) {
				const editor = this.editor;
				let def = editor.shapes[index].clone();
				def.name = "Shape_" + (++shapeSN) + "(" + def.name + ")";
				editor.shapes.push(def);
			},
			deleteShape: function (index) {
				const editor = this.editor;
				editor.shapes.splice(index, 1);
			},
			selectShape: function (shapeName) {
				const editor = this.editor;
				editor.selectedShapeName = shapeName;
				this.name = shapeName;
			},

			editNameBlur: function (evt) {
				const editor = this.editor;
				if (editor.selectedShape.name == this.name) {
					return;
				}
				else if (editor.getShapeByName(this.name)) {
					this.alertName = true;
					evt.target.focus();
				}
				else {
					this.alertName = false;
					editor.selectedShape.name = this.name;
				}
			}
		},
	}
</script>

<style scoped>
	.selected {
		background-color: lightcoral;
	}
</style>

