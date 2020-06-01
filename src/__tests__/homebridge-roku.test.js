'use strict';

const hap = require('hap-nodejs');
const setupService = require('../homebridge-roku');

describe('homebridge-roku', () => {
  let Accessory;
  let accessory;
  let config;
  const inputs = [
    { id: 1, name: 'Netflix' },
    { id: 2, name: 'Amazon' },
  ];

  class Characteristic {
    constructor() {
      this._events = {};
      this._value = undefined;
      this._props = undefined;
    }

    on(key, value) {
      this._events[key] = value;
      return this;
    }

    setValue(value) {
      this._value = value;
      return this;
    }

    setProps(props) {
      this._props = props;
      return this;
    }
  }

  class Service {
    constructor(service, name) {
      this.service = service;
      this.name = name;
      this._characteristics = new Map();
      this._linkedServices = [];
    }

    setCharacteristic(key, value) {
      this.getCharacteristic(key).setValue(value);
      return this;
    }

    getCharacteristic(key) {
      let characteristic = this._characteristics.get(key);
      if (!characteristic) {
        characteristic = new Characteristic();
        this._characteristics.set(key, characteristic);
      }
      return characteristic;
    }

    addLinkedService(service) {
      this._linkedServices.push(service);
      return this;
    }
  }

  const homebridge = {
    registerAccessory(name, service, acc) {
      Accessory = acc;
    },

    hap: {
      Service: {
        AccessoryInformation: Service,
        Switch: Service,
        Television: Service,
        InputSource: Service,
      },

      Characteristic: hap.Characteristic,

      encode: hap.encode,
      writeUInt32: hap.writeUInt32,
    },
  };

  beforeEach(() => {
    setupService(homebridge);
    config = {
      name: 'Roku',
      ip: '192.168.1.25',
      info: {
        vendorName: 'abc',
        modelName: 'def',
        userDeviceName: 'ghi',
        serialNumber: 'jkl',
        friendlyModelName: 'mno',
      },
      inputs,
    };
    accessory = new Accessory(() => {}, config);
  });

  it('should fail if no ip address is in config', () => {
    expect(() => {
      new Accessory(() => {}, { name: 'acc' });
    }).toThrow('An ip address is required for plugin acc');
  });

  it('should set up accessory info', () => {
    const accessoryInfo = accessory.services[0];
    const getCh = (ch) => accessoryInfo.getCharacteristic(ch)._value;
    expect(getCh(hap.Characteristic.Manufacturer)).toEqual('abc');
    expect(getCh(hap.Characteristic.Model)).toEqual('def');
    expect(getCh(hap.Characteristic.Name)).toEqual('mno');
    expect(getCh(hap.Characteristic.SerialNumber)).toEqual('jkl');
  });

  it('should return the available services', () => {
    const services = accessory.getServices();
    expect(services.length).toEqual(4);
  });

  describe.skip('PowerSwitch', () => {
    let powerSwitch;
    let on;

    beforeEach(() => {
      // eslint-disable-next-line
      powerSwitch = accessory.services[1];
      on = powerSwitch.getCharacteristic('on');
    });

    it('should have proper service and name set', () => {
      expect(powerSwitch.service).toEqual('Roku Power');
      expect(powerSwitch.name).toEqual('Power');
    });

    it('should return the power state', () => {
      const getMock = jest.fn();
      on._events.get(getMock);
      expect(getMock).toHaveBeenCalledWith(null, false);

      getMock.mockClear();
      accessory.poweredOn = true;
      on._events.get(getMock);
      expect(getMock).toHaveBeenCalledWith(null, true);
    });

    it('should set the power state & send power keypress to roku', (done) => {
      on._events.set(true, (val) => {
        expect(val).toBeNull();
        expect(accessory.poweredOn).toBeTruthy();
        expect(accessory.roku._keys).toEqual(['Power']);
        done();
      });
    });
  });

  describe.skip('MuteSwitch', () => {
    let muteSwitch;
    let on;

    beforeEach(() => {
      // eslint-disable-next-line
      muteSwitch = accessory.services[2];
      on = muteSwitch.getCharacteristic('on');
    });

    it('should return the mute state', () => {
      const getMock = jest.fn();
      on._events.get(getMock);
      expect(getMock).toHaveBeenCalledWith(null, false);

      getMock.mockClear();
      accessory.muted = true;
      on._events.get(getMock);
      expect(getMock).toHaveBeenCalledWith(null, true);
    });

    it('should call mute if mute is true', (done) => {
      on._events.set(true, (val) => {
        expect(val).toBeNull();
        expect(accessory.muted).toBeTruthy();
        expect(accessory.roku._keys).toEqual([
          'VolumeDown',
          'VolumeUp',
          'VolumeMute',
        ]);
        done();
      });
    });

    it('should not call mute if mute is false', (done) => {
      on._events.set(false, (val) => {
        expect(val).toBeNull();
        expect(accessory.muted).toBeFalsy();
        expect(accessory.roku._keys).toEqual(['VolumeDown', 'VolumeUp']);
        done();
      });
    });
  });

  ['VolumeUp', 'VolumeDown'].forEach((keypress, i) => {
    describe.skip(keypress, () => {
      let keySwitch;
      let on;

      beforeEach(() => {
        // eslint-disable-next-line
        keySwitch = accessory.services[3 + i];
        on = keySwitch.getCharacteristic('on');
      });

      it('should have the proper service and name', () => {
        expect(keySwitch.service).toEqual(`Roku ${keypress}`);
        expect(keySwitch.name).toEqual(keypress);
      });

      it('should always return false for get', () => {
        const getMock = jest.fn();
        on._events.get(getMock);
        expect(getMock).toHaveBeenCalledWith(null, false);
      });

      it(`should call ${keypress} 5 times on set`, (done) => {
        on._events.set(true, (val1, val2) => {
          expect(val1).toBeNull();
          expect(val2).toBeFalsy();
          expect(accessory.roku._keys).toEqual([
            keypress,
            keypress,
            keypress,
            keypress,
            keypress,
          ]);
          done();
        });
      });
    });
  });

  describe.skip('volumeIncrement setting', () => {
    it('should call VolumeUp/Down based on the volumeIncrement setting', (done) => {
      config.volumeIncrement = 2;
      accessory = new Accessory(() => {}, config);
      const upSwitch = accessory.services[3];
      const downSwitch = accessory.services[4];
      const upOn = upSwitch.getCharacteristic('on');
      const downOn = downSwitch.getCharacteristic('on');

      upOn._events.set(true, () => {
        downOn._events.set(true, () => {
          expect(accessory.roku._keys).toEqual([
            'VolumeUp',
            'VolumeUp',
            'VolumeDown',
            'VolumeDown',
          ]);
          done();
        });
      });
    });

    it('should allow setting VolumeUp/Down independently', (done) => {
      config.volumeIncrement = 4;
      config.volumeDecrement = 3;
      accessory = new Accessory(() => {}, config);
      const upSwitch = accessory.services[3];
      const downSwitch = accessory.services[4];
      const upOn = upSwitch.getCharacteristic('on');
      const downOn = downSwitch.getCharacteristic('on');

      upOn._events.set(true, () => {
        downOn._events.set(true, () => {
          expect(accessory.roku._keys).toEqual([
            'VolumeUp',
            'VolumeUp',
            'VolumeUp',
            'VolumeUp',
            'VolumeDown',
            'VolumeDown',
            'VolumeDown',
          ]);
          done();
        });
      });
    });
  });

  inputs.forEach((input, i) => {
    describe.skip(`Channel ${input.name}`, () => {
      const channelId = input.id;
      let channelSwitch;
      let on;

      beforeEach(() => {
        // eslint-disable-next-line
        channelSwitch = accessory.services[5 + i];
        on = channelSwitch.getCharacteristic('on');
      });

      it('should have proper service and name', () => {
        expect(channelSwitch.service).toEqual(`Roku ${input.name}`);
        expect(channelSwitch.name).toEqual(`${input.name}`);
      });

      it('should return false if there is no active app', (done) => {
        on._events.get((val1, val2) => {
          expect(val1).toBeNull();
          expect(val2).toBeFalsy();
          done();
        });
      });

      it('should return false if the app is not active', (done) => {
        accessory.roku._activeApp = channelId + 1;
        on._events.get((val1, val2) => {
          expect(val1).toBeNull();
          expect(val2).toBeFalsy();
          done();
        });
      });

      it('should return true if the app active', (done) => {
        accessory.roku._activeApp = channelId;
        on._events.get((val1, val2) => {
          expect(val1).toBeNull();
          expect(val2).toBeTruthy();
          done();
        });
      });

      it('should launch the given channel', (done) => {
        accessory.roku._activeApp = channelId;
        on._events.set(true, (val1, val2) => {
          expect(accessory.roku._lastLaunched).toEqual(channelId);
          expect(val1).toBeNull();
          expect(val2).toBeTruthy();
          done();
        });
      });

      it('should go home if toggling off', (done) => {
        on._events.set(false, (val1, val2) => {
          expect(accessory.roku._keys).toEqual(['Home']);
          expect(val1).toBeNull();
          expect(val2).toBeFalsy();
          done();
        });
      });
    });
  });
});
