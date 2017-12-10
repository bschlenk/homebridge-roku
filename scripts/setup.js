#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { generateConfig, mergeConfigs, HOMEBRIDGE_CONFIG } = require('../src/setup');

const rootDir = path.join(__dirname, '..');
const configFile = path.join(rootDir, 'config.json');

if (fs.existsSync(configFile)) {
  console.log('using existing config.json');
  process.exit(0);
}

generageConfig().then((config) => {
  console.log('generating config.json... ensure your Roku device is powered on');
  const merged = mergeConfigs(HOMEBRIDGE_CONFIG, config);
  fs.writeFileSync(configFile, JSON.stringify(merged, null, 4));
});

