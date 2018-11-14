
<template>
	<table class="main-frame">
		<tr>
			<td>
				<table class="fill" style="border-bottom: 1px solid gray;">
					<tr>
						<td>
							<div style="display: flex;">
								<button @click="newFixture">New</button>
								<button @click="duplicateFixture">Duplicate</button>
								<button @click="deleteFixture">Delete</button>
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
					<template v-for="fixture in editor.fixtures">
						<li @click="selectFixture(fixture.name)" :class="{selected:editor.selectedFixtureName==fixture.name}">
							<span>
								<span>{{fixture.name}}</span>
							</span>
							<span v-if="isShowType">
								<span>{{fixture.type}}</span>
							</span>
						</li>
					</template>
				</ul>
			</td>
		</tr>
	</table>
</template>

<script>
	import { FixtureDef } from "./FixtureDefinition.js";


	let fixtureSN = 0;

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
			newFixture: function () {
				const editor = this.editor;
				let def = new FixtureDef();
				def.name = "Fixture_" + (++fixtureSN);
				editor.fixtures.push(def);
			},
			duplicateFixture: function (index) {
				const editor = this.editor;
				let def = editor.fixtures[index].clone();
				def.name = "Fixture_" + (++fixtureSN) + "(" + def.name + ")";
				editor.fixtures.push(def);
			},
			deleteFixture: function (index) {
				const editor = this.editor;
				editor.fixtures.splice(index, 1);
			},
			selectFixture: function (fixtureName) {
				if (!this.alertName) {
					const editor = this.editor;
					editor.selectedFixtureName = fixtureName;
					this.inputName = fixtureName;
					return editor.selectedFixture;
				}
				return false;
			},

			editName: function (evt) {
				if (!this.editor.selectedFixture) {
					return;
				}
				const newName = evt.target.value;//this.inputName
				const editor = this.editor;

				if (editor.selectedFixture.name == newName) {
					this.alertName = false;
					return;
				}
				else if (editor.getFixtureByName(newName)) {
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
					editor.selectedFixture.name = newName;
					editor.selectedFixtureName = newName;
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

