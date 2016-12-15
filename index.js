const Roku = require('nodeku/lib/device');

let Service, Characteristic, roku, rokuInfo;

module.exports = homebridge => {
  console.log(`homebridge API version: ${homebridge.version}`);

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-roku", "Roku", RokuAccessory);
};

class RokuAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config['name'];

    if (!config.ip) {
      throw new Error(`An ip address is required for plugin ${this.name}`);
    }
    this.appMap = config.appMap;
    this.info = config.info;
    this.roku = new Roku(config.ip);
    this.services = [];

    this.setup();
  }

  setup() {
    this.services.push(this.setupAccessoryInfo());
    this.services.push(this.setupSwitch());
    this.services.push(this.setupVolume());
  }

  setupAccessoryInfo() {
    const accessoryInfo = new Service.AccessoryInformation(this.name);

    accessoryInfo
      .setCharacteristic(Characteristic.Manufacturer, rokuInfo.manufacturer)
      .setCharacteristic(Characteristic.Model, rokuInfo.modelName)
      .setCharacteristic(Characteristic.Name, rokuInfo.friendlyName)
      .setCharacteristic(Characteristic.SerialNumber, rokuInfo.serialNumber);
  }

  setupSwitch() {
    const switch_ = new Service.Switch(this.name);

    switch_
      .getCharacteristic(Characteristic.On)
      .on('get', this.getState.bind(this))
      .on('set', this.setState.bind(this));

    return switch_;
  }

  setupVolume() {
    const volume = new Service.Speaker(this.name);

    volume
      .getCharacteristic(Characteristic.Mute)
      .on('get', this.isMuted.bind(this))
      .on('set', this.setMuted.bind(this));

    volume
      .addCharacteristic(Characteristic.Volume)
      .on('get', this.getVolume.bind(this))
      .on('set', this.setVolume.bind(this));

    return volume;
  }

  getServices() {
    return this.services;
  }
}
