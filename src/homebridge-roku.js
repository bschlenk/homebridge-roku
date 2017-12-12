const { Client, keys } = require('roku-client');

let Service, Characteristic;

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
      .setCharacteristic(Characteristic.Manufacturer, this.info['vendor-name'])
      .setCharacteristic(Characteristic.Model, this.info['model-name'])
      .setCharacteristic(Characteristic.Name, this.info['user-device-name'])
      .setCharacteristic(Characteristic.SerialNumber, this.info['serial-number']);

    return accessoryInfo;
  }

  setupSwitch() {
    const switch_ = new Service.Switch(`${this.name}Power`, 'Power');

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

  setupMute() {
    // Speaker seems to be unsupported, emmulating with a switch
    const volume = new Service.Switch(`${this.name}Mute`, 'Mute');

    volume
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, this.muted))
      .on('set', (value, callback) => {
        this.muted = value;
        this.roku.keypress(keys.VOLUME_DOWN)
          .then(() => this.roku.keypress(keys.VOLUME_UP))
          .then(() => {
            if (this.muted) {
              return this.roku.keypress(keys.VOLUME_MUTE);
            }
          })
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
    const volume = new Service.Switch(`${this.name}${key}`, key);

    volume
      .getCharacteristic(Characteristic.On)
      .on('get', callback => callback(null, false))
      .on('set', (value, callback) => {
        let promise = Promise.resolve();
        for (let i = 0; i < 10; ++i) {
          promise = promise.then(this.roku.keypress(key));
        }
        promise
          .then(() => callback(null, false))
          .catch(callback);
      });

    return volume;
  }

  setupChannels() {
    return Object.entries(this.appMap)
      .map(([name, id]) => this.setupChannel(name, id));
  }

  setupChannel(name, id) {
    const channel = new Service.Switch(`${this.name}${name}`, name);

    channel
      .getCharacteristic(Characteristic.On)
      .on('get', callback => {
        this.roku.active().then(app => {
          callback(null, app && app.id === id);
        }).catch(callback);
      })
      .on('set', (value, callback) => {
        if (value) {
          this.roku.launch(id)
            .then(() => callback(null, true))
            .catch(err => callback(err));
        } else {
          // TODO: return to home screen
          callback(null, false);
        }
      })

    return channel;
  }

  getServices() {
    return this.services;
  }
}
