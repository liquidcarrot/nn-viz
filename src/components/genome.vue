<template>
		<pre v-html="json" />
</template>

<script lang="ts">
import Vue from "vue";

import beautify from "json-beautify";
import * as format from "json-format-highlight";
import * as _ from "lodash";

import utils from "../utils";

  function normalize(low, high, value) {
    return (value - low) / (high - low)
  }
  function denormalize(low, high, value) {
    return +low + (value * (high - low))
  }


export default Vue.extend({
	name: "vis",

	props: ["network"],
	data() {
		return { json: "" };
	},

	mounted() {
    const genome = {connections: [], nodes: {} }

    _.each(this.network.connections, connection => {
      genome.connections.push({ from: connection.from.index, to: connection.to.index, weight: utils.toDecimaNum(connection.weight, 8) })
    })

    _.each(this.network.nodes, (node, id) => {
      genome.nodes[id] = { type: node.type, bias: utils.toDecimaNum(node.bias, 8) };
    })

		this.json = format(beautify(genome, null, 2, 100));
	}
});
</script>

<style>
</style>
