'use strict';

const fs = require('fs');
const path = require('path');
const walkSync = require('walk-sync');
const hash = require('./utils/hash');

class Consumer {
  constructor(path) {
    this.path = path;
    this.total = 0;
  }
}

class StringData {
  constructor(value) {
    this.value = value;
    this.references = [];
    this._consumers = [];
  }

  add(count, consumer) {
    this.references.push([count, consumer]);
    if (!this._consumers.includes(consumer)) {
      this._consumers.push(consumer);
    }
  }

  get consumers() {
    return this._consumers.length;
  }

  get count() {
    if (!this._count) {
      let count = 0;
      for (let reference of this.references) {
        count += (reference[0] / reference[1].total) * 100;
      }

      this._count = count;
    }

    return this._count;
  }
}

module.exports = class ProcessFindings {
  constructor(options) {
    this._mangledDir = options.mangledDir;
    this._unmangledPath = options.unmangledPath;
    this._consumerThreshold = options.consumerThreshold || 3;
    this._appWeighted = options.weighted === 'app';

    this._knownStringsMap = Object.create(null);
    this._totalFiles = 0;
  }

  discover() {
    this._buildHashToPlainStringMap();
    this._data = Object.create(null);

    let files = walkSync(this._mangledDir);
    for (let file of files) {
      this._processFile(file);
    }

    this._totalFiles = files.length;
  }

  _buildHashToPlainStringMap() {
    let unmangledContents = fs.readFileSync(this._unmangledPath, {
      encoding: 'utf-8',
    });
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
    let consumer = new Consumer(relativePath);

    for (let key in mangled) {
      let unmangledKey = this._knownStringsMap[key];
      if (!unmangledKey) {
        continue;
      }

      let data = this._data[unmangledKey];
      if (!data) {
        data = this._data[unmangledKey] = new StringData(unmangledKey);
      }

      let count = mangled[key];
      data.add(count, consumer);
      consumer.total += count;
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

    let result = '{';
    for (let item of results) {
      result += `\n  ${JSON.stringify(item.value)}: ${(
        item.count / this._totalFiles
      ).toFixed(3)},`;
    }

    result = result.slice(0, -1) + `\n}`;

    return result;
  }
};
