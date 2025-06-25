// FS mock
const fs = {
  readFile: jest.fn((path, options, callback) => {
    if (typeof options === 'function') {
      callback = options;
    }
    callback(null, 'mock file content');
  }),
  writeFile: jest.fn((path, data, options, callback) => {
    if (typeof options === 'function') {
      callback = options;  
    }
    callback(null);
  }),
  readFileSync: jest.fn().mockReturnValue('mock file content'),
  writeFileSync: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  statSync: jest.fn().mockReturnValue({
    isFile: () => true,
    isDirectory: () => false,
    size: 1024,
  }),
  readdirSync: jest.fn().mockReturnValue(['file1.txt', 'file2.txt']),
  mkdirSync: jest.fn(),
  createReadStream: jest.fn().mockImplementation(() => {
    const { EventEmitter } = require('events');
    return new EventEmitter();
  }),
  createWriteStream: jest.fn().mockImplementation(() => {
    const { EventEmitter } = require('events');
    return new EventEmitter();
  }),
};

module.exports = fs;
