/* eslint-env jest */

'use strict';

const {
  generateConfig,
  mergeConfigWithMaster,
  HOMEBRIDGE_CONFIG,
} = require('../setup');

jest.mock('roku-client');
jest.mock('fs');

const IP = '192.168.1.1';

describe('setup', () => {
  describe('#generateConfig()', () => {
    beforeEach(() => {
      // eslint-disable-next-line global-require
      require('roku-client').__setClient(
        IP,
        [{ name: 'Netflix', id: '1234' }, { name: 'Spotify', id: '4567' }],
        {
          manufacturer: 'TCL',
          serialNumber: '12345',
        },
      );
    });

    it('should return the generated config', () =>
      generateConfig().then(config => {
        expect(config).toBeDefined();
        const { accessories } = config;
        expect(accessories).toBeInstanceOf(Array);
        expect(accessories.length).toEqual(1);
        const accessory = accessories[0];
        expect(accessory).toEqual({
          accessory: 'Roku',
          name: 'Roku',
          ip: IP,
          inputs: [
            { id: '1234', name: 'Netflix' },
            { id: '4567', name: 'Spotify' },
          ],
          info: { manufacturer: 'TCL', serialNumber: '12345' },
        });
      }));
  });

  describe('#mergeConfigWithMaster()', () => {
    beforeEach(() => {
      // eslint-disable-next-line global-require
      require('fs').__setReadFile(
        JSON.stringify({
          bridge: {
            name: 'homebridge',
          },
          description: 'test',
          accessories: [
            {
              accessory: 'test',
              name: 'test',
            },
          ],
        }),
      );
    });

    it('should combine the existing config with the given config', () => {
      mergeConfigWithMaster({
        accessories: [
          {
            accessory: 'Roku',
            name: 'Roku',
            ip: IP,
          },
        ],
      });

      const written = JSON.parse(
        // eslint-disable-next-line global-require
        require('fs').__getWrittenFile(HOMEBRIDGE_CONFIG),
      );
      expect(written).toEqual({
        bridge: {
          name: 'homebridge',
        },
        description: 'test',
        accessories: [
          {
            accessory: 'test',
            name: 'test',
          },
          {
            accessory: 'Roku',
            name: 'Roku',
            ip: IP,
          },
        ],
      });
    });

    it('should combine two configs if they have the same name', () => {
      mergeConfigWithMaster({
        accessories: [
          {
            accessory: 'Roku',
            name: 'Roku',
            ip: IP,
          },
          {
            name: 'test',
            ip: 'abc',
          },
        ],
      });

      const written = JSON.parse(
        // eslint-disable-next-line global-require
        require('fs').__getWrittenFile(HOMEBRIDGE_CONFIG),
      );
      expect(written).toEqual({
        bridge: {
          name: 'homebridge',
        },
        description: 'test',
        accessories: [
          {
            accessory: 'test',
            name: 'test',
            ip: 'abc',
          },
          {
            accessory: 'Roku',
            name: 'Roku',
            ip: IP,
          },
        ],
      });
    });
  });
});
