import { architect, Network } from '@liquid-carrot/carrot';
import utils from './utils'

class GateWorker {

  constructor(examples) {
    this.examples = examples;
    this.suspend = false;
  }

  initialize() {
    this.network = architect.Perceptron(2, 3, 5, 3, 1);
    this.i = 0;
  }

  handle(message) {
    switch (message.data.event) {
      case 'initialize':
        this.initialize();
        break;
      case 'goes':
        this.goes(message.data);
        break;
      case 'pause':
        this.pause();
        break;
      case 'resume':
        this.resume();
        break;
      case 'load':
        this.load(message.data.network);
    }
  }

  loop() {
    let trainingResults = this.network.train(this.examples, { iterations: this.updateInterval, rate: this.learningRate,error: this.cutoff })
    this.i += this.updateInterval;

    const evaluation = utils.evaluate(this.network, this.examples);
    const serialized = this.network.toJSON();
    _.each(this.network.nodes, (node, index) => {
      serialized.nodes[index].activation = node.activation;
    });
    self.postMessage({
      event: 'update',
      epoch: this.i,
      network: serialized,
      results: evaluation.results,
      score: trainingResults.error
    })

    if (this.i < this.goestimes && !this.suspend && trainingResults.error >= this.cutoff) {
      self.setTimeout(() => { this.loop() }, 100)
    }
  }

  goes(message) {
    this.goestimes = +message.goestimes;
    this.updateInterval = +message.updateInterval;
    this.learningRate = +message.learningRate;
    this.cutoff = +message.cutoff;

    // post initial state
    self.postMessage({ epoch: 0, network: this.network.toJSON(), results: utils.evaluate(this.network, this.examples) });
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

export default GateWorker;