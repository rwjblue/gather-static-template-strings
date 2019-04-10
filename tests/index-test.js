'use strict';

const co = require('co');
const BroccoliTestHelper = require('broccoli-test-helper');
const StringCollector = require('../src');

const QUnit = require('./qunit');
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

    return input.dispose();
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

  it('should not capture strings from tmp', function(assert) {
    input.write({
      'tmp': {
        'derp.hbs': 'derp'
      },
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

  it('identifies strings within ambiguous contextual component invocations', function(assert) {
    process.chdir(input.path());
    input.write({ 'foo.hbs': '{{#foo-bar as |bar|}}{{#bar.baz}}Hi!{{/bar.baz}}{{/foo-bar}}'});

    let instance = new StringCollector({ mangle: false });
    instance.populate();

    assert.equal(instance.strings['Hi!'], 1);
  });

  it('does not crash on invalid template contents', function(assert) {
    process.chdir(input.path());
    input.write({ 'foo.hbs': '<p>' });

    let instance = new StringCollector({ mangle: false });
    instance.populate();

    assert.deepEqual(instance.strings, { });
  });

  it('calls fileProcessed callback for each file', function(assert) {
    process.chdir(input.path());

    input.write({
      'foo.hbs': 'hi!',
      'bar.hbs': 'derp'
    });

    let instance = new StringCollector({
      mangle: false,
      fileProcessed(path) { assert.step(path); }
    });
    instance.populate();


    assert.verifySteps(['bar.hbs', 'foo.hbs']);
    assert.deepEqual(instance.strings, { 'hi!': 1, 'derp': 1 });
  });
});
