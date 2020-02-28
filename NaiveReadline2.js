let Stream = require('stream');

const lineEnding = /\r?\n|\r(?!\n)/;
module.exports = class NaiveReadline2 extends Stream.Transform {
  constructor() {
    super({readableObjectMode: true, writableObjectMode: true});
    this.buffer = '';
  }

  _transform(chunk, _encoding, callback) {
    chunk = this.buffer + chunk;
    const lines = chunk.split(lineEnding);
    callback(null, lines);
  }
};
