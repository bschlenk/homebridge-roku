'use strict';

const { Client } = require('roku-client');
const fs = require('fs');
const os = require('os');
const path = require('path');
const deepmerge = require('deepmerge');

const HOMEBRIDGE_CONFIG = path.join(os.homedir(), '.homebridge', 'config.json');

/**
 * Generate or merge the configuration for homebridge-roku by querying
 * roku for information and installed apps.
 * @return {Promise<Object>}
 */
function generateConfig() {
  return Client.discover()
    .then(device => {
      const { ip } = device;
      const inputs = [];
      return device
        .apps()
        .then(apps =>
          apps.forEach(app => {
            inputs.push({ id: app.id, name: app.name });
          }),
        )
        .then(() => device.info())
        .then(info => ({ ip, inputs, info }));
    })
    .then(({ ip, inputs, info }) => ({
      accessories: [
        {
          ip,
          info,
          inputs,
          name: 'Roku',
          accessory: 'Roku',
        },
      ],
    }));
}

/**
 * Pass to `deepmerge` to merge together objects with the same name
 * within merging arrays.
 * @param {any[]} dest The destination array.
 * @param {any[]} source The source array.
 * @return {any[]} The new merged array.
 */
function arrayMerge(dest, source) {
  const merged = dest.map(destEl => {
    if (!Object.prototype.hasOwnProperty.call(destEl, 'name')) {
      return destEl;
    }
    const idx = source.findIndex(sourceEl => destEl.name === sourceEl.name);
    if (idx >= 0) {
      const [match] = source.splice(idx, 1);
      return deepmerge(destEl, match);
    }
    return destEl;
  });
  return merged.concat(source);
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
      return JSON.parse(fs.readFileSync(name).toString('utf-8'));
    }
    return name;
  }
  const configA = readConfig(configAName);
  const configB = readConfig(configBName);
  return deepmerge(configA, configB, { arrayMerge });
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
