'use strict';

const { Client, keys } = require('roku-client');
const map = require('lodash.map');

let Service;
let Characteristic;

class RokuAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;

    if (!config.ip) {
      throw new Error(`An ip address is required for plugin ${this.name}`);
    }

    this.appMap = config.appMap;
    this.info = config.info;
    this.roku = new Client(config.ip);
    this.services = [];

    this.muted = false;
    this.volumeLevel = 50;
    this.poweredOn = false;

    this.setup();
  }

  setup() {
    this.services.push(this.setupAccessoryInfo());
    this.services.push(this.setupSwitch());
    this.services.push(this.setupMute());
    this.services.push(this.setupVolumeUp());
    this.services.push(this.setupVolumeDown());
    this.services.push(...this.setupChannels());
  }

  setupAccessoryInfo() {
    const accessoryInfo = new Service.AccessoryInformation();

    accessoryInfo
      .setCharacteristic(Characteristic.Manufacturer, this.info.vendorName)
      .setCharacteristic(Characteristic.Model, this.info.modelName)
      .setCharacteristic(Characteristic.Name, this.info.userDeviceName)
      .setCharacteristic(Characteristic.SerialNumber, this.info.serialNumber);

    return accessoryInfo;
  }

  setupSwitch() {
    const switch_ = new Service.Switch(`${this.name}Power`, 'Power');

    switch_
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, this.poweredOn))
      .on('set', (value, callback) => {
        this.poweredOn = value;
        this.roku
          .keypress('Power')
          .then(() => callback(null))
          .catch(callback);
      });

    return switch_;
  }

  setupMute() {
    // Speaker seems to be unsupported, emmulating with a switch
    const volume = new Service.Switch(`${this.name}Mute`, 'Mute');

    volume
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, this.muted))
      .on('set', (value, callback) => {
        this.muted = value;
        const command = this.roku
          .command()
          // toggling the volume up and down is a reliable way to unmute
          // the TV if the current state is not known
          .volumeDown()
          .volumeUp();

        if (this.muted) {
          command.volumeMute();
        }

        command
          .send()
          .then(() => callback(null))
          .catch(callback);
      });

    return volume;
  }

  setupVolumeUp() {
    return this.setupVolume(keys.VOLUME_UP);
  }

  setupVolumeDown() {
    return this.setupVolume(keys.VOLUME_DOWN);
  }

  setupVolume(key) {
    const volume = new Service.Switch(
      `${this.name}${key.command}`,
      key.command,
    );

    volume
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, false))
      .on('set', (value, callback) => {
        this.roku
          .command()
          .keypress(key, 10)
          .send()
          .then(() => callback(null, false))
          .catch(callback);
      });

    return volume;
  }

  setupChannels() {
    return map(this.appMap, (id, name) => this.setupChannel(name, id));
  }

  setupChannel(name, id) {
    const channel = new Service.Switch(`${this.name}${name}`, name);

    channel
      .getCharacteristic(Characteristic.On)
      .on('get', callback => {
        this.roku
          .active()
          .then(app => {
            callback(null, app && app.id === id);
          })
          .catch(callback);
      })
      .on('set', (value, callback) => {
        if (value) {
          this.roku
            .launch(id)
            .then(() => callback(null, true))
            .catch(callback);
        } else {
          this.roku
            .keypress(keys.HOME)
            .then(() => callback(null, false))
            .catch(callback);
        }
      });

    return channel;
  }

  getServices() {
    return this.services;
  }
}

module.exports = homebridge => {
  ({ Service, Characteristic } = homebridge.hap);

  homebridge.registerAccessory('homebridge-roku', 'Roku', RokuAccessory);
};
