// Stream mock
const { EventEmitter } = require('events');

class MockReadable extends EventEmitter {
  constructor() {
    super();
    this.readable = true;
  }
  
  read() {
    return null;
  }
  
  pipe(destination) {
    return destination;
  }
}

class MockWritable extends EventEmitter {
  constructor() {
    super();
    this.writable = true;
  }
  
  write(chunk, encoding, callback) {
    if (typeof encoding === 'function') {
      callback = encoding;
    }
    if (callback) callback();
    return true;
  }
  
  end(chunk, encoding, callback) {
    if (typeof chunk === 'function') {
      callback = chunk;
    } else if (typeof encoding === 'function') {
      callback = encoding;
    }
    if (callback) callback();
  }
}

const stream = {
  Readable: MockReadable,
  Writable: MockWritable,
  Transform: MockWritable,
  PassThrough: MockWritable,
  pipeline: jest.fn((source, ...transforms) => {
    const destination = transforms[transforms.length - 1];
    if (typeof destination === 'function') {
      destination();
    }
    return destination;
  }),
};

module.exports = stream;
