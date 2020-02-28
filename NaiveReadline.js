let Stream = require('stream');

const lineEnding = /\r?\n|\r(?!\n)/;
module.exports = class NaiveReadline extends Stream.Transform {
  constructor() {
    super({readableObjectMode: true, writableObjectMode: true});
    this.buffer = '';
  }

  _transform(chunk, _encoding, callback) {
    let pausing = false;
    chunk = this.buffer + chunk;
    const lines = chunk.split(lineEnding);
    this.buffer = lines.pop();
    for (const line of lines) {
      if (!this.push(line) && !pausing) {
        pausing = true;
        this.pause();
      }
    }

    if(!pausing) return callback();
    this.once('readable', callback);
  }
};
