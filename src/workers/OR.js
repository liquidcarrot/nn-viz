import utils from '../utils'
import GateWorker from '../GateWorker';

const gateWorker = new GateWorker(utils.examples.OR);
self.addEventListener('message', (message) => {
  gateWorker.handle(message);
})