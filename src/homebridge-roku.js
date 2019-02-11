'use strict';

const DEFAULT_VOLUME_INCREMENT = 5;

const { Client, keys } = require('roku-client');
const map = require('lodash.map');
const tlv = require('hap-nodejs/lib/util/tlv');

let Service;
let Characteristic;

const DisplayOrderTypes = {
  ARRAY_ELEMENT_START: 0x1,
  ARRAY_ELEMENT_END: 0x0
};

class RokuAccessory {
  constructor(log, config) {
    this.log = log;
    this.name = config.name;

    if (!config.ip) {
      throw new Error(`An ip address is required for plugin ${this.name}`);
    }

    this.info = config.info;
    this.inputs = config.inputs;
    this.roku = new Client(config.ip);
    this.services = [];

    this.volumeIncrement = config.volumeIncrement || DEFAULT_VOLUME_INCREMENT;
    this.volumeDecrement = config.volumeDecrement || this.volumeIncrement;

    this.muted = false;
    this.poweredOn = Characteristic.Active.INACTIVE;

    this.buttons = {
      [Characteristic.RemoteKey.REWIND]: keys.REVERSE,
      [Characteristic.RemoteKey.FAST_FORWARD]: keys.FORWARD,
      [Characteristic.RemoteKey.NEXT_TRACK]: keys.REVERSE,
      [Characteristic.RemoteKey.PREVIOUS_TRACK]: keys.FORWARD,
      [Characteristic.RemoteKey.ARROW_UP]: keys.UP,
      [Characteristic.RemoteKey.ARROW_DOWN]: keys.DOWN,
      [Characteristic.RemoteKey.ARROW_LEFT]: keys.LEFT,
      [Characteristic.RemoteKey.ARROW_RIGHT]: keys.RIGHT,
      [Characteristic.RemoteKey.SELECT]: keys.SELECT,
      [Characteristic.RemoteKey.BACK]: keys.BACK,
      [Characteristic.RemoteKey.EXIT]: keys.HOME,
      [Characteristic.RemoteKey.PLAY_PAUSE]: keys.PLAY,
      [Characteristic.RemoteKey.INFORMATION]: keys.INFO,
    };

    this.setup();
  }

  setup() {
    this.services.push(this.setupAccessoryInfo());
    const television = this.setupTelevision();
    this.services.push(television);
    this.services.push(this.setupTelevisionSpeaker(television));
    this.services.push(...this.setupInputs(television));
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

  setupTelevision() {
    const television = new Service.Television(this.name);

    television
      .getCharacteristic(Characteristic.Active)
      .on('get', (callback) => {
        this.roku
          .info()
          .then((info) => {
            const value = info.powerMode === 'PowerOn' ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;
            this.poweredOn = value;
            callback(null, value);
          })
          .catch(callback);
      })
      .on('set', (newValue, callback) => {
        if (newValue == this.poweredOn) {
          callback(null);
          return;
        }
        this.poweredOn = newValue;
        this.roku
          .keypress('Power')
          .then(() => callback(null))
          .catch(callback);
      })

    television
      .getCharacteristic(Characteristic.ActiveIdentifier)
      .on('get', (callback) => {
        this.roku
          .active()
          .then((app) => {
            const index = app !== null ? this.inputs.findIndex((input) => input.id == app.id) : -1;
            const hapId = index + 1;
            callback(null, hapId);
          })
          .catch(callback);
      })
      .on('set', (index, callback) => {
        const rokuId = this.inputs[index - 1].id
        this.roku
          .launch(rokuId)
          .then(() => callback(null))
          .catch(callback);
      })

    television
      .getCharacteristic(Characteristic.ConfiguredName)
      .setValue(this.info.userDeviceName)
      .setProps({
        perms: [Characteristic.Perms.READ]
      });

    television
      .setCharacteristic(Characteristic.SleepDiscoveryMode, Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE);

    television
      .getCharacteristic(Characteristic.DisplayOrder)
      .setProps({
        perms: [Characteristic.Perms.READ]
      });

    television
      .getCharacteristic(Characteristic.RemoteKey)
      .on('set', (newValue, callback) => {
        this.roku
          .keypress(this.buttons[newValue])
          .then(() => callback(null))
          .catch(callback);
      });

    return television;
  }

  setupTelevisionSpeaker(television) {
    if (this.info.isTv !== 'true') { return }
    const speaker = new Service.TelevisionSpeaker(`${this.name} Speaker`);

    speaker
      .setCharacteristic(Characteristic.VolumeControlType, Characteristic.VolumeControlType.RELATIVE);

    speaker
      .getCharacteristic(Characteristic.Mute)
      .on('get', callback => callback(null, this.muted))
      .on('set', (value, callback) => {
        this.muted = value;
        this.roku
          .command()
          // toggling the volume up and down is a reliable way to unmute
          // the TV if the current state is not known
          .volumeDown()
          .volumeUp()
          .exec(cmd => this.muted && cmd.volumeMute())
          .send()
          .then(() => callback(null))
          .catch(callback);
      });

    speaker
      .getCharacteristic(Characteristic.VolumeSelector)
      .on('set', (newValue, callback) => {
        if (newValue == Characteristic.VolumeSelector.INCREMENT) {
          this.roku
            .command()
            .keypress(keys.VOLUME_UP, this.volumeIncrement)
            .send()
            .then(() => callback(null))
            .catch(callback);
        } else {
          this.roku
            .command()
            .keypress(keys.VOLUME_DOWN, this.volumeDecrement)
            .send()
            .then(() => callback(null))
            .catch(callback);
        }
      });

    return speaker;
  }

  setupInputs(television) {
    var identifiersTLV = Buffer.alloc(0);
    const inputs = this.inputs.map((config, index) => {
      const hapId = index + 1;
      const input = this.setupInput(config.id, config.name, hapId, television);

      if (identifiersTLV.length !== 0) {
        identifiersTLV = Buffer.concat([
          identifiersTLV,
          tlv.encode(DisplayOrderTypes.ARRAY_ELEMENT_END, Buffer.alloc(0))
        ]);
      }

      var element = Buffer.alloc(4);
      element.writeUInt32LE(hapId, 0);
      identifiersTLV = Buffer.concat([
        identifiersTLV,
        tlv.encode(DisplayOrderTypes.ARRAY_ELEMENT_START, element)
      ]);

      return input;
    });

    television
      .setCharacteristic(Characteristic.DisplayOrder, identifiersTLV.toString('base64'));

    return inputs;
  }

  setupInput(rokuId, name, hapId, television) {
    const input = new Service.InputSource(`${this.name} ${name}`, rokuId);
    const hdmiRegexp = /tvinput\.hdmi\d+/m;
    const inputSourceType = hdmiRegexp.test(rokuId) ? Characteristic.InputSourceType.HDMI : Characteristic.InputSourceType.APPLICATION;

    input
      .setCharacteristic(Characteristic.Identifier, hapId)
      .setCharacteristic(Characteristic.ConfiguredName, name)
      .setCharacteristic(Characteristic.IsConfigured, Characteristic.IsConfigured.CONFIGURED)
      .setCharacteristic(Characteristic.InputSourceType, inputSourceType);

    input
      .getCharacteristic(Characteristic.ConfiguredName)
      .setProps({
         perms: [Characteristic.Perms.READ]
       });

    television.addLinkedService(input);
    return input;
  }

  getServices() {
    return this.services;
  }
}

module.exports = homebridge => {
  ({ Service, Characteristic } = homebridge.hap);

  homebridge.registerAccessory('homebridge-roku', 'Roku', RokuAccessory);
};
