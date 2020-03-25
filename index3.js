const fs = require('fs');
const NaiveReadline = require('./NaiveReadline');
const NaiveReadline2 = require('./NaiveReadline2');
const runProfiling = require('./runProfiling');

const lineEnding = /\r?\n|\r(?!\n)/;
(async () => {
  await runProfiling('naive readline stream interface', () => new Promise((resolve, reject) => {
    const rl = new NaiveReadline();
    let i = 0;
    rl.on('data', (line) => {
      i += 1;
    });

    rl.on('error', reject);

    rl.on('end', () => {
      console.log(`Read ${i} lines`);
      resolve();
    });

    fs.createReadStream('big.txt').pipe(rl);
  }));

  await runProfiling('naive readline async iteration', async () => {
    async function* readline(stream) {
      let buffer = '';
      for await (let chunk of stream) {
        chunk = buffer + chunk;
        const lines = chunk.split(lineEnding);
        buffer = lines.pop();
        for (const line of lines) {
          yield line
        }
      }
    }

    let i = 0;
    for await (const line of readline(fs.createReadStream('big.txt'))) {
      i += 1;
    }
    console.log(`Read ${i} lines`);
  });

  await runProfiling('naive readline2 async iteration via array of lines', async () => {
    async function* readline2(stream) {
      let buffer = '';
      for await (let chunk of stream) {
        chunk = buffer + chunk;
        const lines = chunk.split(lineEnding);
        buffer = lines.pop();
        yield lines;
      }
    }

    let i = 0;
    for await (const lines of readline2(fs.createReadStream('big.txt'))) {
      for (const line of lines) {
        i += 1;
      }
    }
    console.log(`Read ${i} lines`);
  });

  await runProfiling('naive readline3 async iteration via an iterator', async () => {
    async function readline3(stream, iterator) {
      let buffer = '';
      for await (let chunk of stream) {
        chunk = buffer + chunk;
        const lines = chunk.split(lineEnding);
        buffer = lines.pop();
        for (const line of lines) {
          iterator(line)
        }
      }
    }

    let i = 0;
    await readline3(fs.createReadStream('big.txt'), line => {
      i += 1;
    })

    console.log(`Read ${i} lines`);
  });
})();
