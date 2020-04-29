'use strict';

const hashString = require('../src/utils/hash');

function generateHashedFileContent(map) {
  let mangledMap = Object.create(null);
  for (let key in map) {
    let mangledKey = hashString(key);
    mangledMap[mangledKey] = map[key];
  }

  return JSON.stringify(mangledMap);
}

module.exports = {
  generateHashedFileContent,
};
