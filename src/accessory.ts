import { Perms, Service, CharacteristicValue, WithUUID } from 'homebridge';
import { Keys, RokuApp } from 'roku-client';

import { RokuPlatform } from './platform';
import { RokuPlatformAccessory, RokuPlatformConfig } from './types';

const HOME_APP = {
  id: 'home',
  name: 'Home',
  type: 'menu',
  version: '1',
};

export class RokuAccessory {
  private buttons: any;
  private television!: Service;
  private speaker?: Service;

  private isMuted = false;

  constructor(
    private readonly platform: RokuPlatform,
    private readonly accessory: RokuPlatformAccessory,
    private readonly config: RokuPlatformConfig,
  ) {
    const { Characteristic } = this.platform;

    const infoButton = config.infoButtonOverride
      ? Keys[config.infoButtonOverride] || Keys.INFO
      : Keys.INFO;

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

    if (this.config.syncTimeout !== 0) {
      setInterval(() => {
        this.getPowerStatus().then((status) => {
          this.television.updateCharacteristic(Characteristic.Active, status);
        });

        this.getActiveApp().then((appId) => {
          this.television.updateCharacteristic(
            Characteristic.ActiveIdentifier,
            appId,
          );
        });
      }, this.config.syncTimeout);
    }
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

    // this is what is displayed as the default name on the Home app
    television.setCharacteristic(Characteristic.Name, this.name);

    television
      .getCharacteristic(Characteristic.Active)
      .onGet(this.getPowerStatus)
      .onSet(this.setPowerStatus);

    television
      .getCharacteristic(Characteristic.ActiveIdentifier)
      .onGet(this.getActiveApp)
      .onSet(this.setActiveApp);

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

    television.getCharacteristic(Characteristic.RemoteKey).onSet(this.pressKey);
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
      .on('get', (cb) => cb(null, this.isMuted))
      .onSet(this.setMuted);

    speaker
      .getCharacteristic(Characteristic.VolumeSelector)
      .onSet((newValue) => {
        const isUp = newValue === Characteristic.VolumeSelector.INCREMENT;
        const key = isUp ? Keys.VOLUME_UP : Keys.VOLUME_DOWN;
        const jump = isUp
          ? this.config.volumeIncrement
          : this.config.volumeDecrement;

        return this.device.command().keypress(key, jump).send();
      });
  }

  async setupInputs() {
    const { Characteristic } = this.platform;

    const apps = await this.getApps();

    const identifiers = apps.map((config, index) => {
      const hapId = index + 1;
      const input = this.setupInput(config.id, config.name, hapId);
      this.television.addLinkedService(input);
      return hapId;
    });

    this.television.setCharacteristic(
      Characteristic.DisplayOrder,
      this.platform.api.hap.encode(1, identifiers).toString('base64'),
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
    const apps = await this.getApps();
    const app = await this.activeApp();
    const index = apps.findIndex((a) => a.id === app.id);
    // if the active app was excluded, we report "home" as active
    return index < 0 ? 1 : index + 1;
  };

  setActiveApp = async (index: CharacteristicValue) => {
    const apps = await this.getApps();
    const app = apps[(index as number) - 1];
    return this.launchApp(app);
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
        .exec((cmd) => val && cmd.volumeMute())
        .send()
    );
  };

  async getApps() {
    const apps = await this.device.apps();
    apps.unshift(HOME_APP);
    const excluded = this.config.excludeInputs;
    if (!excluded) {
      return apps;
    }
    return apps.filter((app) => !excluded.includes(app.name));
  }

  async activeApp() {
    const active = await this.device.active();
    return active || HOME_APP;
  }

  launchApp(app: RokuApp) {
    return app.id === 'home'
      ? this.device.keypress(Keys.HOME)
      : this.device.launch(app.id);
  }

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
