'use strict';

const hashString = require('../src/utils/hash');

function mangle(expected) {
  let keys = Object.keys(expected);
  let mangled = Object.create(null);
  for (let key of keys) {
    let mangledKey = hashString(key);
    mangled[mangledKey] = expected[key];
  }

  return mangled;
}

function generateHashedFileContent(map) {
  let mangled = mangle(map);

  return JSON.stringify(mangled);
}

module.exports = {
  mangle,
  generateHashedFileContent,
};
