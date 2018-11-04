/* eslint-env jest */

'use strict';

const roku = jest.genMockFromModule('roku-client');

class Client {
  constructor(ip, apps, info) {
    this.ip = ip;
    this._activeApp = null;
    this._lastLaunched = null;
    this._apps = apps;
    this._info = info;
    this._keys = [];
  }

  active() {
    return Promise.resolve({
      id: this._activeApp,
    });
  }

  launch(id) {
    this._lastLaunched = id;
    return Promise.resolve();
  }

  apps() {
    return Promise.resolve(this._apps);
  }

  info() {
    return Promise.resolve(this._info);
  }

  keypress(key) {
    this._keys.push(key);
    return Promise.resolve();
  }

  command() {
    const pushKeys = (key, n) => {
      for (let i = 0; i < n; ++i) {
        this._keys.push(`${key[0].toUpperCase()}${key.substr(1)}`);
      }
    };
    const proxy = new Proxy({
      send: () => Promise.resolve(),
      keypress: (key, n) => {
        pushKeys(key, n);
        return proxy;
      },
    }, {
      get: (target, prop) => {
        if (prop in target) {
          return target[prop];
        }
        return (n = 1) => {
          pushKeys(prop, n);
          return proxy;
        };
      },
    });
    return proxy;
  }
}

let CLIENT = new Client();

function __setClient(ip, apps, info) {
  CLIENT = new Client(ip, apps, info);
}

function discover() {
  return Promise.resolve(CLIENT.ip);
}

Client.discover = () => Promise.resolve(CLIENT);

roku.discover = discover;
roku.__setClient = __setClient;
roku.Client = Client;

module.exports = roku;
