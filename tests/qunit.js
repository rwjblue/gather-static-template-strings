'use strict';

const crypto = require('crypto');

function hashString(string) {
  return crypto.createHash('sha256').update(string).digest('hex');
}

QUnit.assert.mangledStringsEqual = function(mangled, expected) {
  let expectedKeys = Object.keys(expected);
  let mangledKeys = Object.keys(mangled);
  if (expectedKeys.length !== mangledKeys.length) {
    this.pushResult({
      result: false,
      actual: mangledKeys.length,
      expected: expectedKeys.length,
      message: 'count of properties should match'
    });

    return;
  }

  let mangledExpected = Object.create(null);
  for (let key of expectedKeys) {
    let mangledKey = hashString(key);
    mangledExpected[mangledKey] = expected[key];
  }

  this.deepEqual(mangled, mangledExpected);
};

module.exports = QUnit;
