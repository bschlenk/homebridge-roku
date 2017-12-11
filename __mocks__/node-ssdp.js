const nodeSSDP = jest.genMockFromModule('node-ssdp');
const EventEmitter = require('events').EventEmitter;

let HEADERS = {};

class Client extends EventEmitter {
  search(key) {
    setImmediate(() => {
      this.emit('response', HEADERS[key]);
    });
  }
}

function __setResponseHeaders(key, headers) {
  HEADERS[key] = headers;
}

nodeSSDP.Client = Client;
nodeSSDP.__setResponseHeaders = __setResponseHeaders;

module.exports = nodeSSDP;
