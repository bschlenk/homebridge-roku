/* eslint-env jest */

'use strict';

const nodeSSDP = jest.genMockFromModule('node-ssdp');
const { EventEmitter } = require('events');

const HEADERS = {};

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
