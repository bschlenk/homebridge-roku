/* eslint-env jest */

'use strict';

const fs = jest.genMockFromModule('fs');

let READ_FILE = {};

function __setReadFile(readFile) {
  READ_FILE = readFile;
}

function readFileSync() {
  return READ_FILE;
}

const WRITTEN_FILES = {};

function __getWrittenFile(name) {
  return WRITTEN_FILES[name];
}

function writeFileSync(name, file) {
  WRITTEN_FILES[name] = file;
}

fs.readFileSync = readFileSync;
fs.writeFileSync = writeFileSync;
fs.__setReadFile = __setReadFile;
fs.__getWrittenFile = __getWrittenFile;

module.exports = fs;
