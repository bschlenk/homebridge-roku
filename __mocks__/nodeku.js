'use strict';

class Device {
  constructor(ip, apps, info) {
    this.ip = ip;
    this.apps = apps;
    this.info = info;
  }

  ip() {
    return ip;
  }

  apps() {
    return Promise.resolve(apps);
  }

  info() {
    return Promise.resolve(info);
  }
}

let DEVICE = new Device();

function __setDevice(ip, apps, info) {
  DEVICE = new Device(ip, apps, info);
}

function nodeku() {
  return Promise.resolve(DEVICE);
}

nodeku.__setDevice = __setDevice;

module.exports = nodeku;
