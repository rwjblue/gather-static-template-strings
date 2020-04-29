'use strict';

const fs = require('fs');
const path = require('path');
const hash = require('./utils/hash');
const walkSync = require('walk-sync');
const { preprocess, traverse } = require('@glimmer/syntax');

function buildStringCollector(counter) {
  return {
    ElementNode(node) {
      counter.incrementStringCount(node.tag);
    },
    TextNode(node) {
      counter.incrementStringCount(node.chars);
    },
    PathExpression(node) {
      for (let part of node.parts) {
        counter.incrementStringCount(part);
      }
    },
    AttrNode(node) {
      counter.incrementStringCount(node.name);
    },
    HashPair(node) {
      counter.incrementStringCount(node.key);
    },
  };
}

module.exports = class CollectStrings {
  constructor(_options) {
    let options = _options || {};
    this._path = options.path || process.cwd();
    this._mangle = 'mangle' in options ? options.mangle : true;
    this._fileProcessed = options.fileProcessed || function () {};

    this._map = Object.create(null);
    this._files = null;
  }

  incrementStringCount(string) {
    let count = this._map[string] || 0;
    this._map[string] = count + 1;
  }

  get files() {
    if (!this._files) {
      let files = walkSync(this._path, {
        globs: ['**/*.hbs'],
        directories: false,
      })
        .filter((path) => !path.startsWith('tmp'))
        .filter((path) => !path.startsWith('node_modules'));

      this._files = files;
    }

    return this._files;
  }

  populate() {
    for (let relativePath of this.files) {
      let fullPath = path.join(this._path, relativePath);
      let contents = fs.readFileSync(fullPath, { encoding: 'utf-8' });

      try {
        let ast = preprocess(contents, {
          mode: 'codemod',
        });
        traverse(ast, buildStringCollector(this));
      } catch (e) {
        // do nothing
      }

      this._fileProcessed(relativePath);
    }
  }

  get strings() {
    let map = this._map;

    if (this._mangle) {
      let mangledMap = Object.create(null);
      for (let key in map) {
        let mangledKey = hash(key);
        mangledMap[mangledKey] = map[key];
      }
      return mangledMap;
    } else {
      return map;
    }
  }
};
