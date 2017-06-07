#!/usr/bin/env node
'use strict';

const fs = require('fs');
const name = require('../package').name;
const StringCollector = require('./index');
const ProcessFindings = require('./process-findings');

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


  .command({
    command: 'process',
    desc: 'process directory of mangled json output',
    builder(yargs) {
      return yargs
        .usage(`${name} process <options>`)
        .option('mangled-dir', { type: 'string', describe: 'directory to process' })
        .option('unmangled-file', { type: 'string', describe: 'unmangled file to use to reverse hashing' })
        .option('consumer-threshold', { type: 'number', describe: 'minimum number of consumers to consider a string' })
        .option('output-path', { type: 'string', describe: 'write JSON file of string counts' })
        .default('path', () => process.cwd(), '.');
    },
    handler(argv) {
      let instance = new ProcessFindings({
        mangledDir: argv.mangledDir,
        unmangledPath: argv.unmangledFile,
        consumerThreshold: argv.consumerThreshold
      });

      instance.discover();
      let jsonOutput = instance.result;
      if (argv.outputPath) {
        fs.writeFileSync(argv.outputPath, jsonOutput, { encoding: 'utf-8' });
      } else {
        console.log(jsonOutput); // eslint-disable-line no-console
      }
    }
  })


  .help()
  .argv;
