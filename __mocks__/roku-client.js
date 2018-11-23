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
    this._keys.push(typeof key === 'string' ? key : key.command);
    return Promise.resolve();
  }

  command() {
    const pushKeys = (key, n) => {
      const command = typeof key === 'string' ? key : key.command;
      for (let i = 0; i < n; ++i) {
        this._keys.push(`${command[0].toUpperCase()}${command.substr(1)}`);
      }
    };
    const proxy = new Proxy(
      {
        send: () => Promise.resolve(),
        keypress: (key, n) => {
          pushKeys(key, n);
          return proxy;
        },
        exec: cb => {
          cb(proxy);
          return proxy;
        },
      },
      {
        get: (target, prop) => {
          if (prop in target) {
            return target[prop];
          }
          return (n = 1) => {
            pushKeys(prop, n);
            return proxy;
          };
        },
      },
    );
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
