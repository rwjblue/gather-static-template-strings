'use strict';

const { createTempDir } = require('broccoli-test-helper');
const execa = require('execa');
const { generateHashedFileContent, mangle } = require('./helpers');

const root = process.cwd();

describe('CLI', function () {
  let input;

  function run(command, options = {}) {
    let executablePath = require.resolve('../src/cli.js');
    let args = [executablePath, command];

    let keys = Object.keys(options);
    for (let key of keys) {
      args.push(key, options[key]);
    }

    if (command === 'gather' && options['visitor-path'] === undefined) {
      args.push('--visitor-path', require.resolve('./string-collector'));
    }

    return execa(process.execPath, args);
  }

  beforeEach(async function () {
    input = await createTempDir();
  });

  afterEach(async function () {
    process.chdir(root);

    await input.dispose();
  });

  describe('gather', function () {
    it('should run by default', async function () {
      process.chdir(input.path());

      input.write({
        'foo.hbs': 'hi!',
      });

      let output = await run('gather');
      let parsedOutput = JSON.parse(output.stdout);

      expect(parsedOutput).toEqual(mangle({ 'hi!': 1 }));
    });

    it('allows --path option ', async function () {
      input.write({
        'foo.hbs': 'hi!',
      });

      let output = await run('gather', { '--path': input.path() });
      let parsedOutput = JSON.parse(output.stdout);

      expect(parsedOutput).toEqual(mangle({ 'hi!': 1 }));
    });

    it('allows --output-path option ', async function () {
      input.write({
        'foo.hbs': 'hi!',
      });

      let output = await createTempDir();
      let outputJSONPath = output.path('out.json');
      await run('gather', {
        '--path': input.path(),
        '--output-path': outputJSONPath,
      });

      let parsedOutput = require(outputJSONPath);

      expect(parsedOutput).toEqual(mangle({ 'hi!': 1 }));

      await output.dispose();
    });
  });

  describe('process', function () {
    beforeEach(() => {
      input.write({
        mangled: {
          '001.json': generateHashedFileContent({ derp: 1 }),
          '002.json': generateHashedFileContent({ derp: 2, huzzah: 1 }),
          '003.json': generateHashedFileContent({ derp: 3, dorp: 1 }),
        },
        'unmangled.json': JSON.stringify({ derp: 3, honk: 2 }),
      });
    });

    it('emits to stdout by default', async function () {
      let result = await run('process', {
        '--mangled-dir': input.path('mangled'),
        '--unmangled-file': input.path('unmangled.json'),
      });

      let parsedOutput = JSON.parse(result.stdout);

      expect(parsedOutput).toEqual({
        derp: 100,
      });
    });

    it('emits to file with --output-path option ', async function () {
      let output = await createTempDir();
      let outputJSONPath = output.path('out.json');

      await run('process', {
        '--mangled-dir': input.path('mangled'),
        '--unmangled-file': input.path('unmangled.json'),
        '--output-path': outputJSONPath,
      });

      let parsedOutput = require(outputJSONPath);

      expect(parsedOutput).toEqual({
        derp: 100,
      });

      await output.dispose();
    });
  });
});
