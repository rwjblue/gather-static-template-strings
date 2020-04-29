'use strict';

const path = require('path');
const BroccoliTestHelper = require('broccoli-test-helper');
const execa = require('execa');
const QUnit = require('./qunit');
const helpers = require('./helpers');
const generateHashedFileContent = helpers.generateHashedFileContent;

const describe = QUnit.module;
const it = QUnit.test; // eslint-disable-line
const todo = QUnit.todo; // eslint-disable-line

const root = process.cwd();

describe('StringCollector CLI', function(hooks) {
  let input;

  function run() {
    let options, command;
    if (arguments.length === 2) {
      command = arguments[0];
      options = arguments[1];
    } else {
      command = null;
      options = arguments[0] || {};
    }

    let executablePath = path.join(__dirname, '..', 'src', 'cli.js');
    let args = [executablePath, command].filter(Boolean);

    let keys = Object.keys(options);
    for (let key of keys) {
      args.push(key, options[key]);
    }

    return execa('node', args);
  }

  hooks.beforeEach(async function () {
    input = await BroccoliTestHelper.createTempDir();
  });

  hooks.afterEach(function() {
    process.chdir(root);

    return input.dispose();
  });

  describe('gather', function() {
    it('should run by default', async function (assert) {
      process.chdir(input.path());

      input.write({
        'foo.hbs': 'hi!'
      });

      let output = await run();
      let parsedOutput = JSON.parse(output.stdout);

      assert.mangledStringsEqual(parsedOutput, {
        'hi!': 1
      });
    });

    it('allows --path option ', async function (assert) {
      input.write({
        'foo.hbs': 'hi!'
      });

      let output = await run({ '--path': input.path() });
      let parsedOutput = JSON.parse(output.stdout);

      assert.mangledStringsEqual(parsedOutput, {
        'hi!': 1
      });
    });

    it('allows --output-path option ', async function (assert) {
      input.write({
        'foo.hbs': 'hi!'
      });

      let output = await BroccoliTestHelper.createTempDir();
      let outputJSONPath = output.path('out.json');
      await run({ '--path': input.path(), '--output-path': outputJSONPath });

      let parsedOutput = require(outputJSONPath);

      assert.mangledStringsEqual(parsedOutput, {
        'hi!': 1
      });

      await output.dispose();
    });
  });

  describe('process', function(hooks) {
    hooks.beforeEach(() => {
      input.write({
        mangled: {
          '001.json': generateHashedFileContent({ derp: 1 }),
          '002.json': generateHashedFileContent({ derp: 2, huzzah: 1 }),
          '003.json': generateHashedFileContent({ derp: 3, dorp: 1 })
        },
        'unmangled.json': JSON.stringify({ derp: 3, honk: 2 })
      });
    });


    it('emits to stdout by default', async function (assert) {
      let result = await run('process', {
        '--mangled-dir': input.path('mangled'),
        '--unmangled-file': input.path('unmangled.json')
      });

      let parsedOutput = JSON.parse(result.stdout);

      assert.deepEqual(parsedOutput, {
        derp: 100
      });
    });

    it('emits to file with --output-path option ', async function (assert) {
      let output = await BroccoliTestHelper.createTempDir();
      let outputJSONPath = output.path('out.json');

      await run('process', {
        '--mangled-dir': input.path('mangled'),
        '--unmangled-file': input.path('unmangled.json'),
        '--output-path': outputJSONPath
      });

      let parsedOutput = require(outputJSONPath);

      assert.deepEqual(parsedOutput, {
        derp: 100
      });

      await output.dispose();
    });
  });
});
