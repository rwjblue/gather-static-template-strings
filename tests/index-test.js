'use strict';

const crypto = require('crypto');
const co = require('co');
const BroccoliTestHelper = require('broccoli-test-helper');
const StringCollector = require('../src');

const describe = QUnit.module;
const it = QUnit.test; // eslint-disable-line
const todo = QUnit.todo; // eslint-disable-line

const root = process.cwd();

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

describe('StringCollector', function(hooks) {
  let input;

  hooks.beforeEach(co.wrap(function* () {
    input = yield BroccoliTestHelper.createTempDir();
  }));

  hooks.afterEach(function() {
    process.chdir(root);
  });

  it('should capture strings across templates', function(assert) {
    input.write({
      'foo': {
        'bar': {
          'baz.hbs': 'derp',
          'qux.hbs': 'derp'
        }
      }
    });

    let instance = new StringCollector({
      path: input.path()
    });

    instance.populate();

    assert.mangledStringsEqual(instance.strings, {
      'derp': 2
    });
  });

  it('defaults to process.cwd', function(assert) {
    process.chdir(input.path());
    input.write({ 'foo.hbs': 'hi!' });

    let instance = new StringCollector();
    instance.populate();

    assert.mangledStringsEqual(instance.strings, { 'hi!': 1 });
  });

  it('can generate non-mangled list of strings', function(assert) {
    process.chdir(input.path());
    input.write({ 'foo.hbs': 'hi!' });

    let instance = new StringCollector({ mangle: false });
    instance.populate();

    assert.deepEqual(instance.strings, { 'hi!': 1 });
  });
});
