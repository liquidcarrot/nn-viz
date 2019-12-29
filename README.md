# nn-viz
A visualizer for JavaScript neural networks, deep learning and machine learning models

## Demo

![Visualization Demo](https://raw.githubusercontent.com/liquidcarrot/nn-viz/master/images/@teh-mICON_network_visualization_demo.png)

## Built on

* [3D Force Graph](https://github.com/vasturiano/3d-force-graph)
* [Vis-Network](https://github.com/visjs/vis-network)
* [Vue.js](https://github.com/vuejs/vue)

## Contributing

This project is in its very earliest stages. Your contributions are very welcome especially in guiding the direction of the project!

To build a community welcome to all, NN-Viz follows the [Contributor Covenant](https://github.com/liquidcarrot/carrot/blob/master/CODE_OF_CONDUCT.md) Code of Conduct.

And finally, a big thank you to all of you for supporting!

## Concept
nn-viz is a [Vue.js](https://github.com/vuejs/vue) project that displays the structure of a network. The actual network is being trained in a seperate thread in a web worker.

## Examples
For examples on how to create such a worker and how to communicate with the visualization thread, see src/workers.

## Configuration
For configuration options to pass to the worker, see the `config` object in App.vue (Beware, this is subject to change. We will most likely move this object to a stand-alone .json or even .js file)
To create a new worker, just add an entry here. A new button will appear in the control section of the visualizer. If you click it, the new worker will be set as active and commands will be sent to this particular web worker.

The web worker itself needs to have the same name and be created inside the src/workers directory.

## API

The `AND` worker already exists as an example for this project but we will use it as an example on how to add a new worker and as part of the API examples regardless.

### App.vue, config object:
```
AND: { archtitecture: [2, 5, 5, 1] }
// This will create a new button "AND"
```

### Incoming messages to web worker
#### initialize
This event is fired when the worker has been selected, it might look like this:
```
{ event: 'initialize', config: { archtitecture: [2, 5, 5, 1] } }
```

#### goes
This event is fired by the 'GOES' button in the _control_ section. It commands the worker to start training the network.
Arguments are the config options you set via the _control_ section.

It might look like this:
```
{ event: 'goes', goestimes: 100000, cutoff: 0.001, updateInterval: 1000, learningRate: 0.01 }
```

#### pause
The pause event commands the worker to pause its training. This pause is started once the current training interval has ended (see updateInterval goes config). No config other than the name of the event is passed.

#### resume
The resume event commands the worker to continue the training. No config other than the name of the event is passed.

#### load
This commands the worker to load a certain network. The network is a JSON formatted export. To load it, use  `Network.fromJSON`. The network sent to be loaded is the one last saved from the _control_ section.

### Outgoing messages
The web worker updates the visualization via events. The update event takes the following arguments:
* network: the JSON formatted network export
* epoch: the currently completed training epoch
* results: the actual activation values of the network compared to the input and ideal output
* score: the score/error of the network. For simplicity, the property is just called `score`

#### network
To export the network to JSON, simply call `network.toJSON`. To show activation values as part of the visualization, you need to manually add those.

#### epoch
The epoch is the counter of how many times an example has been run past the network. Simply pass an integer.

#### results
Results can be easily obtained via `utils.evaluate`. This will calculate the mean squared error and the results and deliver them as part of the evaluation with the keyword `results`

#### score
Score can be easily obtained via `utils.evaluate`. This will calculate the mean squared error and the results and deliver the score as part of the evaluation with the keyword `score`

Example:
```
const evaluation = utils.evaluate(this.network, examples);
self.postMessage({
  event: 'update',
  epoch: i,
  network: network.toJSON(),
  results: evaluation.results,
  score: evaluation.score
})
```