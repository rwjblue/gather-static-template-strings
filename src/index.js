'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const walkSync = require('walk-sync');
const compiler = require('@glimmer/compiler');

function buildStringCollector(counter)  {
 return class StringCollectorASTPlugin {
   transform(ast) {
     this.syntax.traverse(ast, {
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
      }
     });

     return ast;
   }
 };
}

module.exports = class CollectStrings {
  constructor(_options) {
    let options = _options || {};
    this._path = options.path || process.cwd();
    this._mangle = 'mangle' in options ? options.mangle : true;
    this.options = options;

    this._map = Object.create(null);
    this._files = null;
  }

  incrementStringCount(string) {
    let count = this._map[string] || 0;
    this._map[string] = count + 1;
  }

  get files() {
    if (!this._files) {
      let files = walkSync(this._path, { globs: ['**/*.hbs'], directories: false })
          .filter(path => !path.startsWith('tmp'))
          .filter(path => !path.startsWith('node_modules'));
      this._files = files;
    }

    return this._files;
  }

  populate() {
    for (let relativePath of this.files) {
      let fullPath = path.join(this._path, relativePath);
      let contents = fs.readFileSync(fullPath, { encoding: 'utf-8' });

      compiler.precompile(contents, {
        meta: { moduleName: relativePath },
        plugins: {
          ast: [buildStringCollector(this)]
        }
      });
    }
  }

  get strings() {
    let map = this._map;

    if (this._mangle) {
      let mangledMap = Object.create(null);
      for (let key in map) {
        let mangledKey = crypto.createHash('sha256').update(key).digest('hex');
        mangledMap[mangledKey] = map[key];
      }
      return mangledMap;
    } else {
      return map;
    }
  }
};
