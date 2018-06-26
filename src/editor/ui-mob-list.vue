
<template>
	<div class="ui-life-list">
		<table>
			<thead>
				<tr>
					<td colspan="9">
						<button @click="removeAll" style="float: right;" title="Issues: not work">Remove all</button>
						<button @click="reload" style="float: right;" title="Issues: not work ??">reload</button>
						<button @click="killAll" style="float: right;">Kill all</button>
					</td>
				</tr>
				
				<tr>
					<td>
						<label for="mob-preview">
							#
						</label>
					</td>
					<td>
						<label for="mob-id">ID</label>
					</td>
					<td>
						<label for="mob-type">type</label>
					</td>
					<td>
						<label for="mob-x">x</label>
					</td>
					<td>
						<label for="mob-y">y</label>
					</td>
					<td>
						<label for="mob-flip">flip</label>
					</td>
					<td>
						<label for="mob-fh">fh</label>
					</td>
					<td>
						<label for="mob-rx0">rx0</label>
					</td>
					<td>
						<label for="mob-rx1">rx1</label>
					</td>
				</tr>
				
				<tr @mouseover="showPreview($event,m)" @mouseleave="hidePreview" class="item new-item">
					<td>
						<button @click="addSpawn" class="input">add</button>
					</td>
					<td>
						<input type="number" v-model="m.id" id="mob-id" min="1" max="9999999" class="input-mobid" />
					</td>
					<td>
						<select v-model="m.type" id="mob-type">
							<option value="m">Mob</option>
							<option value="n">Npc</option>
						</select>
					</td>
					<td>
						<input type="number" v-model.number="m.x" id="mob-x" class="input" />
					</td>
					<td>
						<input type="number" v-model.number="m.cy" id="mob-y" class="input" />
					</td>
					<td>
						<input type="checkbox" v-model="m.f" id="mob-flip" class="input" />
					</td>
					<td>
						<input type="number" v-model.number="m.fh" id="mob-fh" class="input" />
					</td>
					<!-- <td> -->
					<!-- 	<input type="number" v-model.number="m.cy" id="mob-cy" class="input" /> -->
					<!-- </td> -->
					<td>
						<input type="number" v-model.number="m.rx0" id="mob-rx0" class="input" />
					</td>
					<td>
						<input type="number" v-model.number="m.rx1" id="mob-rx1" class="input" />
					</td>
				</tr>
			</thead>
			
			<tbody>
				<tr v-for="(spawn, index) in spawns" @mouseover="showPreview($event,spawn)" @mouseleave="hidePreview" class="item">
					<td>
						<button title="preview" style="text-align: center;" class="input">{{index}}</button>
					</td>
					<td>
						<input type="number" v-model="spawn.id" min="1" max="9999999" class="input-mobid" />
					</td>
					<td>
						<select v-model="spawn.type">
							<option value="m">Mob</option>
							<option value="n">Npc</option>
						</select>
					</td>
					<td>
						<input type="number" v-model.number="spawn.x" class="input" />
					</td>
					<td>
						<input type="number" v-model.number="spawn.cy" class="input" />
					</td>
					<td>
						<input type="checkbox" v-model="spawn.f" class="input" />
					</td>
					<td>
						<input type="number" v-model.number="spawn.fh" class="input" />
					</td>
					<!--<td>-->
					<!--	<input type="number" v-model.number="spawn.cy" class="input" />-->
					<!--</td>-->
					<td>
						<input type="number" v-model.number="spawn.rx0" class="input" />
					</td>
					<td>
						<input type="number" v-model.number="spawn.rx1" class="input" />
					</td>
				</tr>
			</tbody>
	<!--		
			<tr>
				<td>
				</td>
			</tr>
	-->
		</table>
	</div>

</template>

<script>
	import Vuex from "vuex";
	import { LifeSpawnPoint, MapLifeEntity } from "../game/Map.js"
	
	const store = new Vuex.Store({
		state: {
		},
		//mutations: {
		//},
		actions: {
		}
	});

	export default {
		store,
		data: function () {
			return {
				spawns: [],	//no hook source
				m: {		// form table
					type: "m",
					id: 8880141,
					x: 0,
					y: 0,
					mobTime: 0,
					f: 0,
					hide: 0,
					fh: 1,
					cy: 0,
					rx0: 0,
					rx1: 0,
				},
				is_clear: true,
			};
		},
		computed: {
		},
		methods: {
			onCollapsed: function () {
				this.hidePreview();
			},
			showPreview: async function (event, m) {
				let target = event.currentTarget;
				let type = m.type == "m" ? "Mob":"Npc";
				let smallTip = this.$root.$refs.smallTip;
				
				let desc = await MapLifeEntity.loadLifeDesc(m);
				
				smallTip.html = ["<div>" + desc.name + "</div>" + `<img src="/images/${type}/${m.id}.img/stand/0" />`];
				
				smallTip.show(function () {
					smallTip.setPosition({
						my: "right center",
						at: "left center",
						of: target,
						collision: "fit"
					});
				});
			},
			hidePreview: function (event) {
				let smallTip = this.$root.$refs.smallTip;
				smallTip.hide();
			},
			addSpawn: function () {
				if (scene_map && scene_map.lifeMgr) {
					if (!this.m.type.match(/m|n/)) {
						window.alert("life type: 'm' or 'n'");
					}
					let d = new LifeSpawnPoint(this.m);
					
					d.y = d.cy;//cy = position.y; y = ?

					scene_map.lifeMgr.spawnPoints.push(d);
				}
				this.reload();
			},
			reload: function () {
				const src = scene_map.lifeMgr.spawnPoints;
				this.spawns = new Array(src.length);
				for (let i = 0; i < src.length; ++i) {
					this.$set(this.spawns, i, src[i]);
				}
				this.is_clear = false;
				this.$emit("resize");
			},
			removeAll: function () {
				this.is_clear = true;
				this.spawns = [];
				this.$emit("resize");
			},
			killAll: function () {
				scene_map.lifeMgr.entities.forEach(life => life.die());
			},
		},
		mounted: function () {
			this.$on("onCollapsed", this.onCollapsed);
		}
	}
	
	//8880141
</script>

<style scoped>

.ui-life-list {
	padding: 0 1px;
}

table {
    border-collapse: collapse;
    border-spacing: 0;
}

tr.new-item {
	background: lightgray;
}
tr.item:hover {
	background: lightblue;
	outline: 1px auto rgb(77, 144, 254);
}

.button {
	width: 100%;
}

.input {
  width: 2.7em;
}

.input[type=text] {
  width: 4em;
}

.input[type=number] {
  width: 4em;
}

.input[type=checkbox] {
  width: 1em;
}

.input-mobid[type=number] {
  width: 5em;
}

</style>
