<template>
	<div :key="frame">
		<Graph :network="network" :auto2D="auto2D" :auto3D="auto3D" />
		<div id="content">
			<div class="d-flex flex-row flexatron">
				<div class="controls">
					<div
						v-for="(item, index) in config.inputsLeft"
						:key="'input_left_' + index"
						class="input-group input-group-sm"
					>
						<div class="input-group-prepend" v-tooltip.right="item.tooltip">
							<span class="input-group-text">{{item.caption}}</span>
						</div>
						<input type="text" class="form-control" v-input-model="'vizconfig_' + index" />
					</div>
				</div>
				<div class="controls">
					<div
						v-for="(item, index) in config.inputsRight"
						:key="'input_left_' + index"
						class="input-group input-group-sm"
					>
						<div class="input-group-prepend" v-tooltip.left="item.tooltip">
							<span class="input-group-text">{{item.caption}}</span>
						</div>
						<input type="text" class="form-control" v-input-model="'vizconfig_' + index" />
					</div>
				</div>
			</div>
			<div class="d-flex flex-row flexatron">
				<div class="btn-group" role="group" aria-label="Basic example">
					<button
						v-for="(buttonConfig, name) in config.workers"
						:key="'button_' + name"
						:class="['btn', workerClass == name ? 'btn_blue_active' : 'btn_blue']"
						@click="setWorker(name)"
					>{{name}}</button>
				</div>
				<div class="input-group special">
					<div class="input-group-prepend">
						<button @click="goes()" class="btn btn_red" type="button">{{goescaption}}</button>
						<button @click="save()" class="btn btn_green" type="button">SAVE</button>
						<button @click="load()" class="btn btn_green" type="button">LOAD</button>
					</div>
				</div>
				<div class="form-group">
					<div class="custom-control custom-switch">
						<input type="checkbox" class="custom-control-input" id="autoswitch2d" v-model="auto2D" />
						<label class="custom-control-label" for="autoswitch2d">auto render 2D</label>
					</div>
					<div class="custom-control custom-switch">
						<input type="checkbox" class="custom-control-input" id="autoswitch3d" v-model="auto3D" />
						<label class="custom-control-label" for="autoswitch3d">auto render 3D</label>
					</div>
				</div>
			</div>
			<div class="d-flex flex-row flexatron">
				<table id="result">
					<tr v-for="(result, index) in results" :key="index">
						<td class="input">{{result.input.join(',')}}</td>
						<td class="ideal">{{result.output.join(',')}}</td>
						<td class="actual">{{result.actual.join(' ')}}</td>
					</tr>
				</table>
				<table id="current">
					<tr>
						<th>time</th>
						<td>{{elapsedTime}}s</td>
					</tr>
					<tr>
						<th>epoch</th>
						<td>{{epoch}}</td>
					</tr>
					<tr>
						<th>score</th>
						<td>{{score}}</td>
					</tr>
				</table>
			</div>
			<div class="btn-group" role="group"></div>
			<Scores :scores="scores" v-if="scores" />
			<Genome :network="network" v-if="network" />
		</div>
	</div>
</template>

<script>
import _ from "lodash";

import Vue from "vue";
import Graph from "./components/graph.vue";
import GenomeComponent from "./components/genome.vue";
import Scores from "./components/scores.vue";

import utils from "./utils";

let { Network } = require("@liquid-carrot/carrot");

Vue.directive("input-model", {
	bind: function(element, binding, vnode) {
		element.value = vnode.context[binding.value];
		element.onchange = () => {
			vnode.context[binding.value] = element.value;
		};
	}
});

const config = {
	inputsLeft: {
		goestimes: {
			caption: "X",
			tooltip: "maximum samples to feed the network",
			default: 100000
		},
		cutoff: {
			caption: "cutoff",
			tooltip: "the minimum error at which to stop learning",
			default: 0.001
		},
		updateInterval: {
			caption: "update interval",
			tooltip: "the amount of learning examples before updating the viz",
			default: 1000
		}
	},
	inputsRight: {
		learningRate: {
			caption: "learning rate",
			tooltip: "the multiplier applied to weight updates",
			default: 0.01
		}
	},
	workers: {
		mirror: {
      architecture: [3, 7, 5, 4, 3]
    },
		X2: {},
		AND: {},
		OR: {},
		XOR: {},
		NAND: {},
		NOR: {},
    XNOR: {}
	}
};

// reactive local storage wrapper
const dataItems = {};
const watchItems = {};
const wrap = (name, default_, prefix = true) => {
  if(prefix) name = 'vizconfig_' + name;
	dataItems[name] = localStorage.getItem(name) || default_;
	watchItems[name] = value => {
		localStorage.setItem(name, value);
	};
};
_.each(config.inputsLeft, (item, name) => wrap(name, item.default));
_.each(config.inputsRight, (item, name) => wrap(name, item.default));
wrap("activeWorker", Object.keys(config.workers)[0], false);

export default Vue.extend({
	name: "app",

	components: {
		Graph,
		Genome: GenomeComponent,
		Scores
	},

	data() {
		return {
			results: [],
			scores: [],
			network: null,
			genome: null,
			worker: null,
			frame: 0,
			score: 0,
			epoch: 0,
			startTime: new Date(),
			elapsedTime: 0,
			auto2D: true,
			auto3D: false,
			status: "idle",
			goescaption: "goes",
			config,
			workerClass: null, // for button class reactivity
			...dataItems
		};
	},
	watch: watchItems,
	async created() {
		document.title = "nn-viz";

		if (!this.activeWorker) this.setWorker(Object.keys(config.workers)[0]);
		else this.setWorker(this.activeWorker);
	},
	methods: {
    reset() {
			this.status = "idle";
      this.goescaption = "goes";
      this.score = 0;
      this.scores = [];
      this.frame++;
    },

		setWorker(name) {
			if (this.worker) {
				this.worker.terminate();
      }
      this.reset();

			this.activeWorker = name;
			this.workerClass = name;
			const path = import("worker-loader!./workers/" + name + ".js").then(
				worker => {
					this.worker = worker.default();
					this.worker.onmessage = message => {
						if (message.data.event == "update") {
							this.elapsedTime =
								(new Date().getTime() - this.startTime.getTime()) / 1000;
              this.updateEpoch(message.data.epoch);
              const network = Network.fromJSON(message.data.network);
              _.each(message.data.network.nodes, (node, index) => network.nodes[index].activation = node.activation);
							this.updateNetwork(network);
							this.updateScore(message.data.score);
							this.updateResults(message.data.results);
						}
					};

					this.worker.postMessage({ event: "initialize", config: config.workers[name] });
				}
			);
		},

		updateNetwork(network) {
			this.network = network;
		},
		updateEpoch(epoch) {
			this.epoch = epoch;
		},
		updateScore(score) {
			this.score = score;
			this.scores.push(score);
		},
		updateResults(results) {
			this.results = results;
		},

		updateDisplay(epoch, network, score) {
			this.epoch = epoch;
			this.MSE = score;
			this.network = network;
			this.scores.push(score);
			//this.results = results.results;
			if (this.scores.length > 100) this.scores.splice(0, 1);
			this.frame++;
		},

		goes() {
			switch (this.status) {
				case "idle":
					this.status = "running";
          this.goescaption = "pause";

          // create event config
          const goesConfig = {
            event: 'goes'
          };
          // add configurations of input elements
          const addToConfig = (name) => {
            goesConfig[name] = this['vizconfig_' + name];
          };
          _.each(config.inputsLeft, (item, name) => addToConfig(name));
          _.each(config.inputsRight, (item, name) => addToConfig(name));

          // post to worker
					this.worker.postMessage({
            event: "goes",
            ...goesConfig
					});
					this.startTime = new Date();
					break;
				case "running":
					this.worker.postMessage({
						event: "pause"
					});
					this.status = "paused";
					this.goescaption = "resume";
					break;
				case "paused":
					this.status = "running";
					this.goescaption = "pause";
					this.worker.postMessage({
						event: "resume"
					});
					break;
			}
		},

		buttonClass(name) {
			if (name == this.activeWorker) return "btn btn-info";
			return "btn btn-secondary";
		},
		save() {
			if (!this.network)
				return this.$toasted.show("no network to save", {
					type: "error",
					duration: 3000
				});

			localStorage.network = JSON.stringify(this.network.toJSON());
		},
		load() {
			if (!localStorage.getItem("network"))
				return this.$toasted.show("no saved network", {
					type: "error",
					duration: 3000
        });
			this.worker.postMessage({
				event: "load",
				network: JSON.parse(localStorage.network)
			});
		}
	},
	beforeDestroy() {
		if (this.worker) {
			this.worker.terminate();
		}
	}
});
</script>

<style lang="scss">
html body {
	background-color: #0c0c0c;
	color: #eee;
}
#content {
	padding: 20px;
}
input[type="text"] {
	background-color: black;
	color: #ddd;
	border: 0;
}
html pre {
	color: #eee;
}
.flexatron {
	margin-bottom: 10px;
	& > * {
		margin-right: 20px;
		flex: 1;
	}
}
#result {
	font-family: "Consolas";
	td {
		border: 1px solid #333;
		padding: 5px;
	}
	.input {
		color: yellow;
	}
	.output {
		color: #aaa;
	}
	.result {
		color: white;
	}
}
#trend {
	margin-bottom: 20px;
}
html .btn {
	padding: 10px;
}
html .btn-secondary {
	background-color: black;
	color: white;
}
html .input-group-text {
	width: 150px;
	background-color: black;
	color: white;
	border-right: 1px solid white;
}
.btn-group.special {
	display: flex;
}
.special .btn {
	flex: 1;
}
#current td {
	padding-left: 15px;
}

.tooltip {
	display: block !important;
	z-index: 10000;
	.tooltip-inner {
		background: #333;
		color: white;
		border-radius: 5px;
		padding: 5px 10px 4px;
		border-bottom: 3px solid #46828d;
	}
	&[x-placement^="right"] {
		margin-left: 5px;
		.tooltip-arrow {
			border-width: 5px 5px 5px 0;
			border-left-color: transparent !important;
			border-top-color: transparent !important;
			border-bottom-color: transparent !important;
			left: -5px;
			top: calc(50% - 5px);
			margin-left: 0;
			margin-right: 0;
		}
	}
	&[x-placement^="left"] {
		margin-right: 5px;
		.tooltip-arrow {
			border-width: 5px 0 5px 5px;
			border-top-color: transparent !important;
			border-right-color: transparent !important;
			border-bottom-color: transparent !important;
			right: -5px;
			top: calc(50% - 5px);
			margin-left: 0;
			margin-right: 0;
		}
	}
	&[aria-hidden="true"] {
		visibility: hidden;
		opacity: 0;
		transition: opacity 0.15s, visibility 0.15s;
	}
	&[aria-hidden="false"] {
		visibility: visible;
		opacity: 1;
		transition: opacity 0.15s;
	}
}

html .btn_green {
  background-color: #506e50;
  color: white;
}
html .btn_blue {
  background-color: #505e6e;
  color: white;
}
html .btn_blue_active {
  background-color: lighten(#505e6e, 20%);
  color: white;
}
html .btn_red {
  background-color: #6e5050;
  color: white;
}
html .btn_outline_green {
  border: 2px solid #506e50;
  color: white;
}
</style>
