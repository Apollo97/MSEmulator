
<template>
	<table class="main-frame">
		<tr>
			<td>
				<table class="fill" style="border-bottom: 1px solid gray;">
					<tr>
						<td>
							<div style="display: flex;">
								<button @click="newBody">New</button>
								<button @click="duplicateBody">Duplicate</button>
								<button @click="deleteBody">Delete</button>
							</div>
						</td>
					</tr>
					<tr>
						<td>
							<input type="text" v-model="inputName" @keydown.enter="editName($event)" @blur="editName($event)" placeholder="Name" style="background: transparent;" />
						</td>
						<td v-if="alertName">
							<span style="background-color: yellow; color: red;">名稱重複</span>
						</td>
						<td v-if="isShowType">Type</td>
					</tr>
				</table>
			</td>
		</tr>
		<tr>
			<td class="fill">
				<ul class="fill list">
					<template v-for="body in editor.bodies">
						<li @click="selectBody(body.name)" :class="{selected:editor.selectedBodyName==body.name}">
							<span>
								<span>{{body.name}}</span>
							</span>
							<span v-if="isShowType">
								<span>{{body.type}}</span>
							</span>
						</li>
					</template>
				</ul>
			</td>
		</tr>
	</table>
</template>

<script>
	import { BodyDef } from "./BodyDefinition.js";


	let bodySN = 0;

	export default {
		props: {
			editor: {
				required: true,
			},
		},
		data: function () {
			return {
				isShowType: false,
				inputName: null,
				alertName: false,
			};
		},
		methods: {
			newBody: function () {
				const editor = this.editor;
				let def = new BodyDef();
				def.name = "Body_" + (++bodySN);
				editor.bodies.push(def);
			},
			duplicateBody: function (index) {
				const editor = this.editor;
				let def = editor.bodies[index].clone();
				def.name = "Body_" + (++bodySN) + "(" + def.name + ")";
				editor.bodies.push(def);
			},
			deleteBody: function (index) {
				const editor = this.editor;
				editor.bodies.splice(index, 1);
			},
			selectBody: function (bodyName) {
				if (!this.alertName) {
					const editor = this.editor;
					editor.selectedBodyName = bodyName;
					this.inputName = bodyName;
					return editor.selectedBody;
				}
				return false;
			},

			editName: function (evt) {
				if (!this.editor.selectedBody) {
					return;
				}
				const newName = evt.target.value;//this.inputName
				const editor = this.editor;

				if (editor.selectedBody.name == newName) {
					this.alertName = false;
					return;
				}
				else if (editor.getBodyByName(newName)) {
					this.alertName = true;

					let na = window.prompt("New name", newName + "_Copy");
					if (na) {
						evt.target.value = na;
						this.inputName = na;
					}
					this.editName(evt);
				}
				else {
					this.alertName = false;
					editor.selectedBody.name = newName;
					editor.selectedBodyName = newName;
				}
			}
		},
		mounted: async function () {
			await scene_map.$promise;
		}
	}
</script>

<style scoped>
	.selected {
		background-color: lightcoral;
	}

	.fill {
		width: 100%;
		height: 100%;
	}

	.list {
		overflow: auto;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.main-frame {
		width: 100%;
		height: 100%;
		border-collapse: collapse;
		border-spacing: 0;
	}
</style>

