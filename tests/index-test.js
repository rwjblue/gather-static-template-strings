'use strict';

const co = require('co');
const BroccoliTestHelper = require('broccoli-test-helper');
const StringCollector = require('../src');

const describe = QUnit.module;
const it = QUnit.test; // eslint-disable-line
const todo = QUnit.todo; // eslint-disable-line

const root = process.cwd();

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

    assert.deepEqual(instance.strings, {
      'derp': 2
    });
  });

  it('defaults to process.cwd', function(assert) {
    process.chdir(input.path());
    input.write({ 'foo.hbs': 'hi!' });

    let instance = new StringCollector();
    instance.populate();

    assert.deepEqual(instance.strings, { 'hi!': 1 });
  });
});
