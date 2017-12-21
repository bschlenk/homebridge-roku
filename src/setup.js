'use strict';

const { Client } = require('roku-client');
const fs = require('fs');
const path = require('path');
const deepmerge = require('deepmerge');

const HOMEBRIDGE_CONFIG = path.join(process.env.HOME, '.homebridge', 'config.json');

/**
 * Generate or merge the configuration for homebridge-roku by querying
 * roku for information and installed apps.
 * @return {Promise<Object>}
 */
function generateConfig() {
  return Client.discover().then((device) => {
    const { ip } = device;
    const appMap = {};
    return device.apps()
      .then(apps => apps.forEach((app) => { appMap[app.name] = app.id; }))
      .then(() => device.info())
      .then(info => ({ ip, appMap, info }));
  })
    .then(({ ip, appMap, info }) => {
      const config = {
        accessories: [
          {
            ip,
            info,
            appMap,
            name: 'Roku',
            accessory: 'Roku',
          },
        ],
      };

      return config;
    });
}

/**
 * Merge two config files together. Assumes that
 * string arguments are file names and loads them
 * before merging.
 * @param {Object|string} configAName
 * @param {Object|string} configBName
 * @return {Object} The merged config.
 */
function mergeConfigs(configAName, configBName) {
  function readConfig(name) {
    if (typeof name === 'string') {
      return JSON.parse(fs.readFileSync(name));
    }
    return name;
  }
  const configA = readConfig(configAName);
  const configB = readConfig(configBName);
  return deepmerge(configA, configB);
}

/**
 * Merge the given config object with the existing homebridge config.
 * @param {Object} toMerge
 */
function mergeConfigWithMaster(toMerge) {
  try {
    const merged = mergeConfigs(HOMEBRIDGE_CONFIG, toMerge);
    fs.writeFileSync(HOMEBRIDGE_CONFIG, JSON.stringify(merged, null, 4));
  } catch (err) {
    console.error(`There was a problem merging the config: ${err}`);
  }
}

module.exports = {
  generateConfig,
  mergeConfigs,
  mergeConfigWithMaster,
  HOMEBRIDGE_CONFIG,
};
