'use strict';

const co = require('co');
const BroccoliTestHelper = require('broccoli-test-helper');
const ProcessFindings = require('../src/process-findings');
const hashString = require('../src/utils/hash');

const QUnit = require('./qunit');
const describe = QUnit.module;
const it = QUnit.test; // eslint-disable-line
const todo = QUnit.todo; // eslint-disable-line

const root = process.cwd();

function generateHashedFileContent(map) {
  let mangledMap = Object.create(null);
  for (let key in map) {
    let mangledKey = hashString(key);
    mangledMap[mangledKey] = map[key];
  }

  return JSON.stringify(mangledMap);
}

describe('ProcessFindings', function(hooks) {
  let input;

  hooks.beforeEach(co.wrap(function* () {
    input = yield BroccoliTestHelper.createTempDir();
  }));

  hooks.afterEach(function() {
    process.chdir(root);

    return input.dispose();
  });

  it('it merges known strings', function(assert) {
    input.write({
      mangled: {
        '001.json': generateHashedFileContent({ derp: 1 }),
        '002.json': generateHashedFileContent({ derp: 2, huzzah: 1 }),
        '003.json': generateHashedFileContent({ derp: 3, dorp: 1 })
      },
      'unmangled.json': JSON.stringify({ derp: 3, honk: 2 })
    });

    let instance = new ProcessFindings({
      mangledDir: input.path('mangled'),
      unmangledPath: input.path('unmangled.json')
    });

    instance.discover();

    assert.deepEqual(instance.result, {
      derp: 6
    });
  });

  it('only includes strings that are used by specified number of consumers', function(assert) {
    input.write({
      mangled: {
        '001.json': generateHashedFileContent({ derp: 1 }),
        '002.json': generateHashedFileContent({ derp: 2, huzzah: 1 }),
        '003.json': generateHashedFileContent({ derp: 3, huzzah: 2, snark: 1 }),
        '004.json': generateHashedFileContent({ derp: 4, huzzah: 3, snark: 2, derk: 1 }),
        '005.json': generateHashedFileContent({ derp: 5, huzzah: 4, snark: 3, derk: 2, kit: 1 })
      },
      'unmangled.json': JSON.stringify({ derp: 1, huzzah: 1, snark: 1, derk: 1, kit: 1 })
    });

    let instance = new ProcessFindings({
      mangledDir: input.path('mangled'),
      unmangledPath: input.path('unmangled.json'),
      consumerThreshold: 3
    });

    instance.discover();

    assert.deepEqual(instance.result, {
      derp: 15,
      huzzah: 10,
      snark: 6
    });
  });
});
