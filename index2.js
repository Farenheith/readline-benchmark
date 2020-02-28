const fs = require('fs');
const NaiveReadline = require('./NaiveReadline');
const NaiveReadline2 = require('./NaiveReadline2');
const runProfiling = require('./runProfiling');

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
    let i = 0;
    for await (const line of fs.createReadStream('big.txt').pipe(new NaiveReadline())) {
      i += 1;
    }
    console.log(`Read ${i} lines`);
  });

  await runProfiling('naive readline2 async iteration via array of lines', async () => {
    let i = 0;
    for await (const lines of fs.createReadStream('big.txt').pipe(new NaiveReadline2())) {
      for (const line of lines) {
        i += 1;
      }
    }
    console.log(`Read ${i} lines`);
  });
})();
