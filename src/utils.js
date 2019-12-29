import * as _ from "lodash";
function normalize(low, high, value) {
  return (value - low) / (high - low);
}
function denormalize(low, high, value) {
  return +low + value * (high - low);
}
function evaluate(network, examples) {
  let score = 0;
  const results = [];
  _.each(examples, example => {
    const actual = network.activate(example.input);
    _.each(example.output, (output, index) => {
      results.push({ input: example.input, output: example.output, actual })
      score += Math.pow(output - actual[index], 2);
    })
  })
  return { score: score * .5, results }
}
export default {
  normalize,
  denormalize,
  evaluate,
  examples: {
    mirror: [
      { input: [1, 0, 0], output: [1, 0, 0] },
      { input: [0, 1, 0], output: [0, 1, 0] },
      { input: [0, 0, 1], output: [0, 0, 1] }
    ],
    X2: [
      { input: [.1], output: [.2] },
      { input: [.2], output: [.4] },
      { input: [.3], output: [.6] },
      { input: [.4], output: [.8] },
      { input: [.5], output: [1] },
    ],
    AND: [
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [0] },
      { input: [1, 0], output: [0] },
      { input: [1, 1], output: [1] },
      { input: [1, 1], output: [1] },
      { input: [1, 1], output: [1] }
    ],
    OR: [
      { input: [0, 0], output: [0] },
      { input: [0, 0], output: [0] },
      { input: [0, 0], output: [0] },
      { input: [0, 1], output: [1] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [1] }
    ],
    XOR: [
      { input: [0, 1], output: [1] },
      { input: [0, 0], output: [0] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [0] }
    ],
    NAND: [
      { input: [0, 0], output: [1] },
      { input: [0, 1], output: [1] },
      { input: [1, 0], output: [1] },
      { input: [1, 1], output: [0] }
    ],
    NOR: [
      { input: [0, 0], output: [1] },
      { input: [0, 1], output: [0] },
      { input: [1, 0], output: [0] },
      { input: [1, 1], output: [0] }
    ],
    XNOR: [
      { input: [0, 0], output: [1] },
      { input: [0, 1], output: [0] },
      { input: [1, 0], output: [0] },
      { input: [1, 1], output: [1] }
    ]
  },
  toDecimaNum(number, places = 5) {
    const value = number.toFixed(places).padEnd(places, '0')
    return (number < 0)
      ? "" + value
      : '+' + value

  }
};
