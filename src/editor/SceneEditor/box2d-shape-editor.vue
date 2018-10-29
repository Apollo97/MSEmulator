
<template>
	<table class="fill sptb">
		<tr style="background: lightgray;">
			<td>
				<div style="display: flex;">
					<button :disabled="!shape" @click="refreshShapeFromScene">refresh</button>
					<button :disabled="!shape" @click="applyShapeToScene">apply</button>
					<label>
						unit
						<select v-model="unit">
							<option value="32">meter</option>
							<option value="1">pixel</option>
						</select>
					</label>
				</div>
			</td>
			<td>
				detail
			</td>
		</tr>
		<tr class="fill">
			<td class="fill">
				<div class="fill" style="position: relative; top: 0; left: 0; box-shadow: 0 0 1px 1px #2196F3;">
					<!--<template v-for="(shape, index) in shapes">
						<ui-draggable @mousedown="selectPoint(index)" :borderWidth="0" :options="{left: '0em', top: '0em', width: '5em', height: '5em'}" style="background: lightgray;">
							<template slot="content">
								<div class="header" style="background: gray;">
									[<span class="header">{{index}}</span>]: <span class="header">{{shape.name}}</span>
								</div>
								<div>
									{{shape.type}} / {{shape.radius}}
								</div>
							</template>
						</ui-draggable>
					</template>-->
				</div>
			</td>
			<td>
				<div class="fill" style="position: relative; top: 0; left: 0;">
					<table style="width: 10em;">
						<thead>
							<tr>
								<th>props</th>
								<th>value</th>
							</tr>
						</thead>
						<tbody v-if="shape">
							<tr>
								<th>type</th>
								<td>
									<select v-model="shape.type">
										<option value="circle">circle</option>
										<option value="polygon">polygon</option>
										<option value="edge">edge</option>
										<option value="chain">chain</option>
									</select>
								</td>
							</tr>
						</tbody>
						<tbody v-if="shape && shape.type == 'circle'">
							<tr>
								<th>radius</th>
								<td><input type="number" v-model="shape.radius" min="0.004" max="2"></td>
							</tr>
						</tbody>
						<tbody v-if="shape && shape.type == 'polygon'">
							<tr>
								<th>radius</th>
								<td><input type="number" v-model="shape.radius" min="-9999" max="9999"></td>
							</tr>
						</tbody>
					</table>
				</div>
			</td>
		</tr>
	</table>
</template>

<script>
	import UIDraggable from "../../components/ui-draggable.vue";

	import { Vec2 } from "../../game/math.js";

	import { ShapeDef, b2ShapeTypeToName } from "./ShapeDefinition.js";

	import {
		b2_maxPolygonVertices,
		b2ShapeType, b2Shape, b2CircleShape, b2EdgeShape, b2ChainShape, b2PolygonShape,
	} from "../../game/Physics/Physics.js";

	// :options="{top:index*10}"


	export default {
		props: {
			shape: {
				default: null,
				type: ShapeDef,
			},
		},
		data: function () {
			return {
				selectedVertex: 0,
				unit: 32,
			};
		},
		methods: {
			selectVertex: function (index) {
				this.selectedVertex = index;
			},

			/** @returns {b2Shape} */
			getSelectedShapeFromScene: function () {
				if (scene_map && scene_map.controller && scene_map.controller.$_selectedFixture) {
					return scene_map.controller.$_selectedFixture.m_shape;
				}
				return null;
			},

			refreshShapeFromScene: function () {
				/** @type {ShapeDef} */
				const editShape = this.shape;

				let shape = this.getSelectedShapeFromScene();
				if (editShape && shape) {
					editShape.type = b2ShapeTypeToName[shape.m_type];
					editShape.radius = shape.m_radius;
				}
			},
			applyShapeToScene: function () {
				/** @type {ShapeDef} */
				const editShape = this.shape;

				if (editShape && editShape.radius != null) {
					let shape = this.getSelectedShapeFromScene();
					if (shape) {
						if (editShape.type == b2ShapeTypeToName[shape.m_type]) {
							shape.m_radius = editShape.radius;
						}
						else {
							alert("");
						}
					}
				}
			},
		},
		mounted: function () {
		},
		components: {
			"ui-draggable": UIDraggable,
		},
	};

</script>

<style scoped>
	.sptb {
		border-collapse: collapse;
		border-spacing: 0px;
	}


	.fill {
		width: 100%;
		height: 100%;
	}
</style>
