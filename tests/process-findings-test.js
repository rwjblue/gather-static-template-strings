'use strict';

const { createTempDir } = require('broccoli-test-helper');
const ProcessFindings = require('../src/process-findings');
const { generateHashedFileContent } = require('./helpers');

const root = process.cwd();

describe('ProcessFindings', function () {
  let input;

  beforeEach(async function () {
    input = await createTempDir();
  });

  afterEach(function () {
    process.chdir(root);

    return input.dispose();
  });

  it('it merges known strings', function () {
    input.write({
      mangled: {
        '001.json': generateHashedFileContent({ derp: 1 }),
        '002.json': generateHashedFileContent({ derp: 2, huzzah: 1 }),
        '003.json': generateHashedFileContent({ derp: 3, dorp: 1 }),
      },
      'unmangled.json': JSON.stringify({ derp: 3, honk: 2 }),
    });

    let instance = new ProcessFindings({
      mangledDir: input.path('mangled'),
      unmangledPath: input.path('unmangled.json'),
    });

    instance.discover();

    let parsedResult = JSON.parse(instance.result);

    expect(parsedResult).toEqual({
      derp: 100,
    });
  });

  it('only includes strings that are used by specified number of consumers', function () {
    input.write({
      mangled: {
        '001.json': generateHashedFileContent({ derp: 1 }),
        '002.json': generateHashedFileContent({ derp: 2, huzzah: 1 }),
        '003.json': generateHashedFileContent({ derp: 3, huzzah: 2, snark: 1 }),
        '004.json': generateHashedFileContent({
          derp: 4,
          huzzah: 3,
          snark: 2,
          derk: 1,
        }),
        '005.json': generateHashedFileContent({
          derp: 5,
          huzzah: 4,
          snark: 3,
          derk: 2,
          kit: 1,
        }),
      },
      'unmangled.json': JSON.stringify({
        derp: 1,
        huzzah: 1,
        snark: 1,
        derk: 1,
        kit: 1,
      }),
    });

    let instance = new ProcessFindings({
      mangledDir: input.path('mangled'),
      unmangledPath: input.path('unmangled.json'),
      consumerThreshold: 3,
    });

    instance.discover();

    let parsedResult = JSON.parse(instance.result);

    let keys = Object.keys(parsedResult);
    expect(keys).toEqual(['derp', 'huzzah', 'snark']);
  });

  it('sorts results by count', function () {
    input.write({
      mangled: {
        '005.json': generateHashedFileContent({ derp: 1 }),
        '004.json': generateHashedFileContent({ derp: 2, huzzah: 4 }),
        '003.json': generateHashedFileContent({ derp: 3, huzzah: 8, snark: 1 }),
        '002.json': generateHashedFileContent({
          derp: 4,
          huzzah: 12,
          snark: 2,
          derk: 1,
        }),
        '001.json': generateHashedFileContent({
          derp: 5,
          huzzah: 16,
          snark: 3,
          derk: 2,
          kit: 1,
        }),
      },
      'unmangled.json': JSON.stringify({
        derp: 1,
        huzzah: 1,
        snark: 1,
        derk: 1,
        kit: 1,
      }),
    });

    let instance = new ProcessFindings({
      mangledDir: input.path('mangled'),
      unmangledPath: input.path('unmangled.json'),
      consumerThreshold: 3,
    });

    instance.discover();

    let parsedResult = JSON.parse(instance.result);

    expect(Object.keys(parsedResult)).toEqual(['huzzah', 'derp', 'snark']);
  });
});
