import { architect, Network } from '@liquid-carrot/carrot';
import utils from '../utils'
import _ from 'lodash';

const examples = utils.examples.X2;

class Handler {

  constructor() {
    this.suspend = false;
  }

  initialize(architecture) {
    this.network = architect.Perceptron(1, 5, 1);
    this.i = 0;
  }

  loop() {
    this.network.train(examples, { iterations: this.updateInterval, rate: this.learningRate, error: this.cutoff })
    this.i += this.updateInterval;

    const evaluation = utils.evaluate(this.network, examples);
    const serialized = this.network.toJSON();
    _.each(this.network.nodes, (node, index) => {
      serialized.nodes[index].activation = node.activation;
    });
    self.postMessage({
      event: 'update',
      epoch: this.i,
      network: serialized,
      results: evaluation.results,
      score: evaluation.score
    })

    if (this.i < this.goestimes && !this.suspend) {
      self.setTimeout(() => { this.loop() }, 100)
    }
  }

  goes(message) {
    this.goestimes = +message.goestimes;
    this.updateInterval = +message.updateInterval;
    this.learningRate = +message.learningRate;
    this.cutoff = +message.cutoff;

    // post initial state
    self.postMessage({ epoch: 0, network: this.network.toJSON(), results: utils.evaluate(this.network, examples) });
    this.loop();
  }

  pause() {
    this.suspend = true;
  }

  resume() {
    this.suspend = false;
    this.loop();
  }

  load(network) {
    this.network = Network.fromJSON(network)
  }
}

const handler = new Handler;
self.addEventListener('message', (message) => {
  switch (message.data.event) {
    case 'initialize':
      handler.initialize();
      break;
    case 'goes':
      handler.goes(message.data);
      break;
    case 'pause':
      handler.pause();
      break;
    case 'resume':
      handler.resume();
      break;
    case 'load':
      handler.load(message.data.network);
  }
})