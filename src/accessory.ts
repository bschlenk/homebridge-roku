import {
  Perms,
  Service,
  CharacteristicValue,
  CharacteristicSetCallback,
  CharacteristicGetCallback,
  WithUUID,
} from 'homebridge';
import { Keys } from 'roku-client';

import { RokuPlatform } from './platform';
import { RokuPlatformAccessory } from './types';

const DisplayOrderTypes = {
  ARRAY_ELEMENT_START: 0x1,
  ARRAY_ELEMENT_END: 0x0,
};

const getPromise = (fn: () => Promise<any>) => (
  cb: CharacteristicGetCallback,
) =>
  fn()
    .then((val) => cb(null, val))
    .catch(cb);

const setPromise = (fn: (val: CharacteristicValue) => Promise<any>) => (
  val: CharacteristicValue,
  cb: CharacteristicSetCallback,
) =>
  fn(val)
    .then(() => cb(null))
    .catch(cb);

export class RokuAccessory {
  private buttons: any;
  private television!: Service;
  private speaker?: Service;

  private isMuted = false;

  private volumeIncrement = 1;
  private volumeDecrement = 1;

  constructor(
    private readonly platform: RokuPlatform,
    private readonly accessory: RokuPlatformAccessory,
  ) {
    const { Characteristic } = this.platform;

    let infoButton = Keys.INFO;

    this.buttons = {
      [Characteristic.RemoteKey.REWIND]: Keys.REVERSE,
      [Characteristic.RemoteKey.FAST_FORWARD]: Keys.FORWARD,
      [Characteristic.RemoteKey.NEXT_TRACK]: Keys.REVERSE,
      [Characteristic.RemoteKey.PREVIOUS_TRACK]: Keys.FORWARD,
      [Characteristic.RemoteKey.ARROW_UP]: Keys.UP,
      [Characteristic.RemoteKey.ARROW_DOWN]: Keys.DOWN,
      [Characteristic.RemoteKey.ARROW_LEFT]: Keys.LEFT,
      [Characteristic.RemoteKey.ARROW_RIGHT]: Keys.RIGHT,
      [Characteristic.RemoteKey.SELECT]: Keys.SELECT,
      [Characteristic.RemoteKey.BACK]: Keys.BACK,
      [Characteristic.RemoteKey.EXIT]: Keys.HOME,
      [Characteristic.RemoteKey.PLAY_PAUSE]: Keys.PLAY,
      [Characteristic.RemoteKey.INFORMATION]: infoButton,
    };

    this.setupAccessoryInfo();
    this.setupTelevision();
    this.setupSpeaker();
    this.setupInputs();

    setInterval(() => {
      this.getPowerStatus().then((status) => {
        this.television.updateCharacteristic(Characteristic.Active, status);
      });
    }, 10000);
  }

  get device() {
    return this.accessory.context.device;
  }

  get info() {
    return this.accessory.context.info;
  }

  get name() {
    return this.info.userDeviceName || 'Roku';
  }

  setupAccessoryInfo() {
    const { Service, Characteristic } = this.platform;
    const {
      vendorName = 'Roku, Inc.',
      modelName,
      serialNumber,
      softwareVersion,
    } = this.info;

    this.accessory
      .getService(Service.AccessoryInformation)!
      .setCharacteristic(Characteristic.Manufacturer, vendorName)
      .setCharacteristic(Characteristic.Name, this.name)
      .setCharacteristic(Characteristic.Model, modelName)
      .setCharacteristic(Characteristic.SerialNumber, serialNumber)
      .setCharacteristic(Characteristic.FirmwareRevision, softwareVersion);
  }

  setupTelevision() {
    const { Service, Characteristic } = this.platform;

    // https://developers.homebridge.io/#/service/Television
    const television = (this.television = this.getOrAddService(
      Service.Television,
    ));

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    television.setCharacteristic(Characteristic.Name, this.name);

    television
      .getCharacteristic(Characteristic.Active)
      .on('get', getPromise(this.getPowerStatus))
      .on('set', setPromise(this.setPowerStatus));

    television
      .getCharacteristic(Characteristic.ActiveIdentifier)
      .on('get', getPromise(this.getActiveApp))
      .on('set', setPromise(this.setActiveApp));

    television
      .getCharacteristic(Characteristic.ConfiguredName)
      .setValue(this.name)
      .setProps({
        perms: [Perms.PAIRED_READ],
      });

    television.setCharacteristic(
      Characteristic.SleepDiscoveryMode,
      Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE,
    );

    television.getCharacteristic(Characteristic.DisplayOrder).setProps({
      perms: [Perms.PAIRED_READ],
    });

    television
      .getCharacteristic(Characteristic.RemoteKey)
      .on('set', setPromise(this.pressKey));
  }

  setupSpeaker() {
    if (!this.info.isTv) {
      return;
    }

    const { Service, Characteristic } = this.platform;

    const speaker = (this.speaker = this.getOrAddService(
      Service.TelevisionSpeaker,
    ));

    speaker.setCharacteristic(Characteristic.Name, `${this.name} Speaker`);

    speaker.setCharacteristic(
      Characteristic.VolumeControlType,
      Characteristic.VolumeControlType.RELATIVE,
    );

    speaker
      .getCharacteristic(Characteristic.Mute)
      .on('get', (cb: CharacteristicGetCallback) => cb(null, this.isMuted))
      .on('set', setPromise(this.setMuted));

    speaker.getCharacteristic(Characteristic.VolumeSelector).on(
      'set',
      setPromise((newValue) => {
        const isUp = newValue === Characteristic.VolumeSelector.INCREMENT;
        const key = isUp ? Keys.VOLUME_UP : Keys.VOLUME_DOWN;
        const jump = isUp ? this.volumeIncrement : this.volumeDecrement;

        return this.device.command().keypress(key, jump).send();
      }),
    );
  }

  async setupInputs() {
    const { Characteristic } = this.platform;
    const hap = this.platform.api.hap;
    let identifiersTLV = Buffer.alloc(0);

    const apps = await this.device.apps();
    const inputs = apps.map((config, index) => {
      const hapId = index + 1;
      const input = this.setupInput(config.id, config.name, hapId);

      if (identifiersTLV.length !== 0) {
        identifiersTLV = Buffer.concat([
          identifiersTLV,
          hap.encode(DisplayOrderTypes.ARRAY_ELEMENT_END, Buffer.alloc(0)),
        ]);
      }

      const element = hap.writeUInt32(hapId);
      identifiersTLV = Buffer.concat([
        identifiersTLV,
        hap.encode(DisplayOrderTypes.ARRAY_ELEMENT_START, element),
      ]);

      return input;
    });

    inputs.forEach((input) => {
      this.television.addLinkedService(input);
    });

    this.television.setCharacteristic(
      Characteristic.DisplayOrder,
      identifiersTLV.toString('base64'),
    );
  }

  setupInput(rokuId: string, name: string, hapId: number) {
    const { Service, Characteristic } = this.platform;

    const input = this.getOrAddService(
      Service.InputSource,
      `${this.name} ${name}`,
      rokuId,
    );

    const hdmiRegexp = /tvinput\.hdmi\d+/m;
    const inputSourceType = hdmiRegexp.test(rokuId)
      ? Characteristic.InputSourceType.HDMI
      : Characteristic.InputSourceType.APPLICATION;

    input
      .setCharacteristic(Characteristic.Identifier, hapId)
      .setCharacteristic(Characteristic.ConfiguredName, name)
      .setCharacteristic(
        Characteristic.IsConfigured,
        Characteristic.IsConfigured.CONFIGURED,
      )
      .setCharacteristic(Characteristic.InputSourceType, inputSourceType);

    input.getCharacteristic(Characteristic.ConfiguredName).setProps({
      perms: [Perms.PAIRED_READ],
    });

    return input;
  }

  getPowerStatus = async () => {
    const { Characteristic } = this.platform;
    const info = await this.device.info();

    return info.powerMode === 'PowerOn'
      ? Characteristic.Active.ACTIVE
      : Characteristic.Active.INACTIVE;
  };

  setPowerStatus = async (val: CharacteristicValue) => {
    const { Characteristic } = this.platform;
    if (val === Characteristic.Active.ACTIVE) {
      return this.device.keypress(Keys.POWER_ON);
    }
    return this.device.keypress(Keys.POWER_OFF);
  };

  getActiveApp = async () => {
    const apps = await this.device.apps();
    const app = await this.device.active();
    const index = app !== null ? apps.findIndex((a) => a.id === app.id) : -1;
    const hapId = index + 1;
    return hapId;
  };

  setActiveApp = async (index: CharacteristicValue) => {
    const apps = await this.device.apps();
    const rokuId = apps[(index as number) - 1].id;
    return this.device.launch(rokuId);
  };

  pressKey = (key: CharacteristicValue) => {
    return this.device.keypress(this.buttons[key as number]);
  };

  setMuted = (val: CharacteristicValue) => {
    this.isMuted = val as boolean;
    return (
      this.device
        .command()
        // toggling the volume up and down is a reliable way to unmute
        // the TV if the current state is not known
        .volumeDown()
        .volumeUp()
        .exec((cmd) => (val && cmd.volumeMute()) as any)
        .send()
    );
  };

  getOrAddService<T extends WithUUID<typeof Service>>(
    service: T,
    ...args: any[]
  ) {
    if (args.length) {
      return (
        this.accessory.getService(args[0]) ||
        this.accessory.addService(service, ...args)
      );
    }

    return (
      this.accessory.getService(service) || this.accessory.addService(service)
    );
  }
}
