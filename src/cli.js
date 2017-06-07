#!/usr/bin/env node
'use strict';

const fs = require('fs');
const name = require('../package').name;
const StringCollector = require('./index');

require('yargs')


  .command({
    command: 'gather',
    aliases: ['*'],
    desc: 'gather strings',
    builder(yargs) {
      return yargs
        .usage(`${name} <options>`)
        .option('path', { type: 'string', describe: 'directory to process' })
        .option('mangle', { type: 'boolean', default: true, describe: 'hashes strings to be unrecognized' })
        .option('output-path', { type: 'string', describe: 'write JSON file of string counts' })
        .default('path', () => process.cwd(), '.');
    },
    handler(argv) {
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
    }
  })
  .help()
  .argv;
