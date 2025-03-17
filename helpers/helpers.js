const { fromPromise } = require('xstate');

const fromTerminal = fromPromise(async ({ input }) => {
  const topic = await new Promise((res) => {
    console.log(input + '\n');
    const listener = (data) => {
      const result = data.toString().trim();
      process.stdin.off('data', listener);
      res(result);
    };
    process.stdin.on('data', listener);
  });

  return topic;
});

async function getFromTerminal(msg) {
  const topic = await new Promise((res) => {
    console.log(msg + '\n');
    const listener = (data) => {
      const result = data.toString().trim();
      process.stdin.off('data', listener);
      res(result);
    };
    process.stdin.on('data', listener);
  });

  return topic;
}

module.exports = {
  fromTerminal,
  getFromTerminal,
};
