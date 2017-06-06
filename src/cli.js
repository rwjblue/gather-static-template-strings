#!/usr/bin/env node
'use strict';

const name = require('../package').name;
const argv = require('yargs')
      .help()
      .usage(`${name} <options>`)
      .option('path', { type: 'string', describe: 'directory to process' })
      .option('mangle', { type: 'boolean', default: true, describe: 'hashes strings to be unrecognized' })
      .option('output-path', { type: 'string', describe: 'write JSON file of string counts' })
      .default('path', () => process.cwd(), '.')
      .argv;

const StringCollector = require('./index');

const fs = require('fs');

let collector = new StringCollector({
  path: argv.path,
  mangle: argv.mangle
});

collector.populate();

let jsonOutput = JSON.stringify(collector.strings, null, 2);
if (argv.outputPath) {
  fs.writeFileSync(argv.outputPath, jsonOutput, { encoding: 'utf-8' });
} else {
  console.log(jsonOutput); // eslint-disable-line no-console
}
