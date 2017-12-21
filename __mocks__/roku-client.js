/* eslint-env jest */

'use strict';

const roku = jest.genMockFromModule('roku-client');

class Client {
  constructor(ip, apps, info) {
    this.ip = ip;
    this._apps = apps;
    this._info = info;
  }

  apps() {
    return Promise.resolve(this._apps);
  }

  info() {
    return Promise.resolve(this._info);
  }
}

let CLIENT = new Client();

function __setClient(ip, apps, info) {
  CLIENT = new Client(ip, apps, info);
}

function discover() {
  return Promise.resolve(CLIENT.ip);
}

Client.discover = function () {
  return Promise.resolve(CLIENT);
};

roku.discover = discover;
roku.__setClient = __setClient;
roku.Client = Client;

module.exports = roku;
