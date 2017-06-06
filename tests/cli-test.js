'use strict';

const path = require('path');
const co = require('co');
const BroccoliTestHelper = require('broccoli-test-helper');
const execa = require('execa');
const QUnit = require('./qunit');

const describe = QUnit.module;
const it = QUnit.test; // eslint-disable-line
const todo = QUnit.todo; // eslint-disable-line

const root = process.cwd();

describe('StringCollector CLI', function(hooks) {
  let input;

  function run(_options) {
    let executablePath = path.join(__dirname, '..', 'src', 'cli.js');
    let args = [executablePath];

    let options = _options || {};
    let keys = Object.keys(options);
    for (let key of keys) {
      args.push(key, options[key]);
    }

    return execa('node', args);
  }

  hooks.beforeEach(co.wrap(function* () {
    input = yield BroccoliTestHelper.createTempDir();
  }));

  hooks.afterEach(function() {
    process.chdir(root);

    return input.dispose();
  });

  it('should run by default', co.wrap(function* (assert) {
    process.chdir(input.path());

    input.write({
      'foo.hbs': 'hi!'
    });

    let output = yield run();
    let parsedOutput = JSON.parse(output.stdout);

    assert.mangledStringsEqual(parsedOutput, {
      'hi!': 1
    });
  }));

  it('allows --path option ', co.wrap(function* (assert) {
    input.write({
      'foo.hbs': 'hi!'
    });

    let output = yield run({ '--path': input.path() });
    let parsedOutput = JSON.parse(output.stdout);

    assert.mangledStringsEqual(parsedOutput, {
      'hi!': 1
    });
  }));

  it('allows --output-path option ', co.wrap(function* (assert) {
    input.write({
      'foo.hbs': 'hi!'
    });

    let output = yield BroccoliTestHelper.createTempDir();
    let outputJSONPath = output.path('out.json');
    yield run({ '--path': input.path(), '--output-path': outputJSONPath });

    let parsedOutput = require(outputJSONPath);

    assert.mangledStringsEqual(parsedOutput, {
      'hi!': 1
    });

    yield output.dispose();
  }));
});
