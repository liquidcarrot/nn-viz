import utils from '../utils'
import GateWorker from '../GateWorker';

const gateWorker = new GateWorker(utils.examples.XOR);
self.addEventListener('message', (message) => {
  gateWorker.handle(message);
})