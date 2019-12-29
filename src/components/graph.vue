<template>
	<div>
		<div ref="graph2D" id="graph2D" class="graph_hide"></div>
		<button @click="graph2D" class="btn btn_green btn-sm">render 2D</button>
		<div ref="graph3D" id="graph3D" class="graph_hide"></div>
		<button @click="graph3D" class="btn btn_green btn-sm">render 3D</button>
		<pre v-html="clickedNode" class="json_small"></pre>
		<pre v-html="clickedEdge" class="json_small"></pre>
	</div>
</template>

<script lang="ts">
import Vue from "vue";
import ForceGraph3D from "3d-force-graph";
import vis from "vis-network";
import _ from "lodash";
import beautify from "json-beautify";
import format from "json-format-highlight";
import Converter from "hex2dec";
import Color from "color";

import utils from "../utils";

const NETVIS_COLORS = {
	input: "#4b8c48",
	hidden: "#48688c",
	action: "#b80f0f"
};

function normalize(low, high, value) {
	return (value - low) / (high - low);
}
function denormalize(low, high, value) {
	return +low + value * (high - low);
}

export default Vue.extend({
	name: "vis",

	props: ["network", "auto2D", "auto3D"],
	data() {
		return {
			enabled2D: false,
			enabled3D: false,
			clickedEdge: null,
			clickedNode: null
		};
	},

	mounted() {
		this.render();
	},

	watch: {
		network() {
			this.render();
		}
	},

	methods: {
		render() {
			if (this.auto2D) this.graph2D();
			if (this.auto3D) this.graph3D();
		},
		graph2D() {
			if (!this.network) return;
			this.enabled2D = true;
			this.render2D(this.$refs["graph2D"], this.network, this);
		},
		graph3D() {
			if (!this.network) return;
			this.enabled3D = true;
			this.render3D(this.$refs["graph3D"], this.network, this);
		},
		render2D: async (element, network, vue) => {
			element.classList.remove("graph_hide");
			element.classList.add("graph_show");
			_.each(network.nodes, (node, index) => (node.index = index));

			const nodesRaw = _.map(network.nodes, (node, index) => {
        let border;
				if (node.type == 'input') border = "#dbdd60";
				if (node.type == 'hidden') border = "#92b6ce";
				if (node.type == 'output') border = "#ffffff";

        const dec = denormalize(0, 255, node.activation);
        const hex = Converter.decToHex("" + Math.round(dec), { prefix: false });
        const color = "#" + hex + hex + hex;
				const connectionMapper = connection => {
					return {
						from: connection.from.index,
						to: connection.to.index,
						weight: connection.weight
					};
				};
				return {
					id: node.index,
					title: "" + node.index,
					label: "" + node.index,
					color: {
						background: color,
						border,
						highlight: "red"
					},
					custom: {
						id: node.index,
						type: node.type,
						output: node.activation,
						bias: node.bias,
						connections: _.map(network.connections, connectionMapper)
					}
				};
			});
			const nodes = new vis.DataSet(nodesRaw);

			const max = _.maxBy(network.connections, connection => connection.weight)
				.weight;
			const min = _.minBy(network.connections, connection => connection.weight)
				.weight;
			const edgesRaw = network.connections.map(connection => {
				const normalized = normalize(min, max, connection.weight);
				const width = denormalize(1, 10, normalized);
				return {
					from: connection.from.index,
					to: connection.to.index,
					width,
					arrows: "to",
					color: connection.weight > 0 ? "green" : "red",
					custom: { connection }
				};
			});
			const edges = new vis.DataSet(_.remove(edgesRaw, edge => edge !== null));

			const options = {
				autoResize: true,
				height: "250px",
				width: "100%",
				edges: {
					smooth: {
						type: "cubicBezier",
						forceDirection: "vertical"
					}
				},
				layout: {
					hierarchical: {
						direction: 'LR',
						sortMethod: "directed"
					}
				},
				physics: false
			};

			const visNetwork = new vis.Network(element, { nodes, edges }, options);

			visNetwork.on("click", properties => {
				const nodeIds = properties.nodes;
				const node = nodes.get(nodeIds)[0];

				const edgeIds = properties.edges;
				const edge = edges.get(edgeIds)[0];

				if (node && node.custom) {
					vue.clickedNode = format(beautify(node.custom, null, 2, 100));
				} else {
					vue.clickedNode = "";
				}
				if (edge && edge.custom && edge.custom.connection) {
					vue.clickedEdge = format(
						beautify(edge.custom.connection, null, 2, 100)
					);
				} else {
					vue.clickedEdge = "";
				}
			});
		},

		async render3D(element, network, vue) {
			element.classList.remove("graph_hide");
			element.classList.add("graph_show");
			const max = _.maxBy(network.connections, connection => connection.weight)
				.weight;
			const min = _.minBy(network.connections, connection => connection.weight)
				.weight;

			const gData = {
				nodes: _.map(network.nodes, node => ({
					id: node.index,
					type: node.type
				})),
				links: _.map(network.connections, connection => {
					const normalized = normalize(min, max, connection.weight);
					const width = denormalize(1, 3, normalized);
					return {
						source: connection.from.index,
						target: connection.to.index,
						weight: connection.weight,
						width
					};
				})
			};
			const Graph = ForceGraph3D()(element)
				.graphData(gData)
				.linkDirectionalArrowLength(3.5)
				.linkDirectionalArrowRelPos(1)
				.linkCurvature(0.25)
				.linkColor(link => {
					return link.weight > 0 ? "green" : "red";
				})
				.nodeColor(node => {
					if (node.type == "input") return NETVIS_COLORS.input;
					if (node.type == "hidden") return NETVIS_COLORS.hidden;
					if (node.type == "action") return NETVIS_COLORS.action;
					return "#ff0000";
				})
				.linkWidth(node => node.width)
				.height(500)
				.backgroundColor("black");
		}
	}
});
</script>

<style>
.json_small {
	font-size: 14px;
	background-color: #111;
}
#graph2D {
	background-color: black;
}
#graph3D {
	height: 500px;
}
.graph_show {
	display: block;
}
.graph_hide {
	display: none;
}
</style>
