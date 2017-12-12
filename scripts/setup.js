#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { generateConfig, mergeConfigs, HOMEBRIDGE_CONFIG } = require('../src/setup');

const rootDir = path.join(__dirname, '..');
const configFile = path.join(rootDir, 'config.json');
const sampleConfig = path.join(__dirname, 'sample-config.json');

if (fs.existsSync(configFile)) {
  console.log('using existing config.json');
  process.exit(0);
}

generateConfig().then((config) => {
  console.log('generating config.json... ensure your Roku device is powered on');
  let merged;
  if (fs.existsSync(HOMEBRIDGE_CONFIG)) {
    merged = mergeConfigs(HOMEBRIDGE_CONFIG, config);
  } else {
    console.log(`${HOMEBRIDGE_CONFIG} does not exist, using sample config`);
    merged = mergeConfigs(sampleConfig, config);
  }
  fs.writeFileSync(configFile, JSON.stringify(merged, null, 4));
}).catch(err => {
  console.error('failed to configure development config file', err);
  process.exit(1);
});

