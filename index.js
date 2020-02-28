const fs = require('fs');
const readline = require('readline');

const runs = 3;

(async () => {
  await runProfiling('readline stream interface', () => new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream('big.txt'),
    });

    let i = 0;
    rl.on('line', (line) => {
      i += 1;
    });

    rl.on('error', reject);

    rl.on('close', () => {
      console.log(`Read ${i} lines`);
      resolve();
    });
  }));
  await runProfiling('readline async iteration', async () => {
    const rl = readline.createInterface({
        input: fs.createReadStream('big.txt'),
      });

      let i = 0;
      for await (const line of rl) {
        i += 1;
      }
      console.log(`Read ${i} lines`);
  });


  // Modify readline to return an array of lines
  // Copied from https://github.com/nodejs/node/blob/efec6811b667b6cf362d648bc599b667eebffce0/lib/readline.js
  const lineEnding = /\r?\n|\r(?!\n)/;
  readline.Interface.prototype._normalWrite = function(b) {
    if (b === undefined) {
      return;
    }
    let string = this._decoder.write(b);
    if (this._sawReturnAt &&
        DateNow() - this._sawReturnAt <= this.crlfDelay) {
      string = string.replace(/^\n/, '');
      this._sawReturnAt = 0;
    }

    // Run test() on the new string chunk, not on the entire line buffer.
    const newPartContainsEnding = lineEnding.test(string);

    if (this._line_buffer) {
      string = this._line_buffer + string;
      this._line_buffer = null;
    }
    if (newPartContainsEnding) {
      this._sawReturnAt = string.endsWith('\r') ? DateNow() : 0;

      // Got one or more newlines; process into "line" events
      const lines = string.split(lineEnding);
      // Either '' or (conceivably) the unfinished portion of the next line
      string = lines.pop();
      this._line_buffer = string;
      this._onLine(lines); // <- changed from `for of` to `this._onLine(lines)`
    } else if (string) {
      // No newlines this time, save what we have for next time
      this._line_buffer = string;
    }
  };

  readline.Interface.prototype._line = function() {
    const line = this._addHistory();
    this.clearLine();
    this._onLine([line]); // <- changed from `line` to `[line]`
  };

  await runProfiling('readline async iteration via array of lines', async () => {
    const rl = readline.createInterface({
        input: fs.createReadStream('big.txt'),
      });

      let i = 0;
      for await (const lines of rl) {
        for (const line of lines) {
          i += 1;
        }
      }
      console.log(`Read ${i} lines`);
  });
})();

async function runProfiling(name, run) {
  console.log('');
  console.log('####################################################');
  console.log(`WARMUP: Current memory usage: ${currentMemoryUsage({runGarbageCollector: true})} MB`);
  console.log(`WARMUP: ${name} profiling started`);
  const warmupStartTime = Date.now();
  await run();
  console.log(`WARMUP: ${name} profiling finished in ${Date.now() - warmupStartTime}ms`);
  console.log(`WARMUP: Current memory usage (before GC): ${currentMemoryUsage({runGarbageCollector: false})} MB`);
  console.log(`WARMUP: Current memory usage (after GC): ${currentMemoryUsage({runGarbageCollector: true})} MB`);

  for (let i = 1; i <= runs; i += 1) {
    console.log('');
    console.log('####################################################');
    console.log(`RUN ${i}: ${name} profiling started`);
    const startTime = Date.now();
    await run(); // eslint-disable-line no-await-in-loop
    console.log(`RUN ${i}: ${name} profiling finished in ${Date.now() - startTime}ms`);
    console.log(`RUN ${i}: Current memory usage (before GC): ${currentMemoryUsage({runGarbageCollector: false})} MB`);
    console.log(`RUN ${i}: Current memory usage (after GC): ${currentMemoryUsage({runGarbageCollector: true})} MB`);
  }
}

function currentMemoryUsage({runGarbageCollector}) {
  if (runGarbageCollector) global.gc();
  return Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
}
