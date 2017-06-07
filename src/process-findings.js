'use strict';

const fs = require('fs');
const path = require('path');
const walkSync = require('walk-sync');
const hash = require('./utils/hash');

class StringData {
  constructor(value) {
    this.value = value;
    this.consumers = 0;
    this.count = 0;
  }

  add(count) {
    this.consumers++;
    this.count += count;
  }
}

module.exports = class ProcessFindings {
  constructor(options) {
    this._mangledDir = options.mangledDir;
    this._unmangledPath = options.unmangledPath;
    this._consumerThreshold = options.consumerThreshold || 3;

    this._knownStringsMap = Object.create(null);
  }

  discover() {
    this._buildHashToPlainStringMap();
    this._data = Object.create(null);

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

      let data = this._data[unmangledKey];
      if (!data) {
        data = this._data[unmangledKey] = new StringData(unmangledKey);
      }

      data.add(mangled[key]);
    }
  }

  get result() {
    let data = this._data;
    let results = [];

    for (let key in data) {
      let item = data[key];

      if (item.consumers >= this._consumerThreshold) {
        results.push(item);
      }
    }

    results.sort((a, b) => b.count - a.count);

    let final = Object.create(null);
    for (let item of results) {
      final[item.value] = item.count;
    }

    return final;
  }
};
