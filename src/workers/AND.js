import utils from '../utils'
import GateWorker from '../GateWorker';

const gateWorker = new GateWorker(utils.examples.AND);
self.addEventListener('message', (message) => {
  console.log(JSON.stringify(message.data))
  gateWorker.handle(message);
})