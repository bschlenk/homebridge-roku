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

    this.muted = false;
    this.volumeLevel = 50;
    this.poweredOn = false;

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

    accessoryInfo;
  }

  setupSwitch() {
    const switch_ = new Service.Switch(this.name);

    switch_
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, this.poweredOn))
      .on('set', (value, callback) => {
        this.poweredOn = value;
        this.roku.keypress('Power')
          .then(() => callback(null))
          .catch(callback);
      });

    return switch_;
  }

  setupVolume() {
    const volume = new Service.Speaker(this.name);

    volume
      .getCharacteristic(Characteristic.Mute)
      .on('get', callabck => callback(null, this.muted))
      .on('set', (value, callback) => {
        this.muted = value;
        this.roku.keypress('VolumeDown')
          .then(() => this.roku.keypress('VolumeUp'))
          .then(() => {
            if (this.muted) {
              return this.roku.keypress('VolumeMute');
            }
          })
          .then(() => callback(null))
          .catch(callback);

    volume
      .addCharacteristic(Characteristic.Volume)
      .on('get', callback => callback(null, this.volumeLevel))
      .on('set', (value, callback) => {
        this.log('requested volume level %d, current level %d',
          volume, this.volumeLevel);
        let change = value - this.volumeLevel;
        this.volumeLevel = value;
        if (change === 0) {
          return;
        }
        let button = 'VolumeUp';
        if (change < 0) {
          button = 'VolumeDown';
        }
        change = Math.abs(change);

        this.log('sending %s %d times', button, change);

        let promise = Promise.resolve();
        for (let i = 0; i < change; ++i) {
          promise = promise.then(() => this.roku.keypress(button));
        }
        promise.then(() => callback(null))
          .catch(callback);
      });

    return volume;
  }

  getServices() {
    return this.services;
  }
}
