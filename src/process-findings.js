'use strict';

const fs = require('fs');
const path = require('path');
const walkSync = require('walk-sync');
const hash = require('./utils/hash');

module.exports = class ProcessFindings {
  constructor(options) {
    this._mangledDir = options.mangledDir;
    this._unmangledPath = options.unmangledPath;

    this._knownStringsMap = Object.create(null);
  }

  discover() {
    this._buildHashToPlainStringMap();
    this._map = Object.create(null);

    let files = walkSync(this._mangledDir);
    for (let file of files) {
      this._processFile(file);
    }
  }

  _buildHashToPlainStringMap() {
    let unmangledContents = fs.readFileSync(this._unmangledPath, { encoding: 'utf-8' });
    let unmangled = JSON.parse(unmangledContents);

    for (let key in unmangled) {
      let hashedKey = hash(key);
      this._knownStringsMap[hashedKey] = key;
    }
  }

  _processFile(relativePath) {
    let fullPath = path.join(this._mangledDir, relativePath);
    let mangledContents = fs.readFileSync(fullPath, { encoding: 'utf-8' });
    let mangled = JSON.parse(mangledContents);

    for (let key in mangled) {
      let unmangledKey = this._knownStringsMap[key];
      if (!unmangledKey) { continue; }

      this._map[unmangledKey] = (this._map[unmangledKey] || 0) + mangled[key];
    }
  }

  get result() {
    return this._map;
  }
};
