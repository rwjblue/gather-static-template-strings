'use strict';

const fs = require('fs');
const path = require('path');
const walkSync = require('walk-sync');
const compiler = require('@glimmer/compiler');

class StringCounter {
  constructor() {
    this.map = Object.create(null);
  }

  see(string) {
    let count = this.map[string] || 0;
    this.map[string] = count + 1;
  }
}

function buildStringCollector(counter)  {
 return class StringCollectorASTPlugin {
   transform(ast) {
     this.syntax.traverse(ast, {
       ElementNode(node) {
         counter.see(node.tag);
       },
       TextNode(node) {
         counter.see(node.chars);
       },
       PathExpression(node) {
         for (let part of node.parts) {
           counter.see(part);
         }
       },
       AttrNode(node) {
         counter.see(node.name);
       },
      HashPair(node) {
        counter.see(node.key);
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
    this.options = options;

    this._counter = new StringCounter();

  }

  populate() {
    let files = walkSync(this._path, { globs: ['**/*.hbs' ] });
    for (let relativePath of files) {
      let fullPath = path.join(this._path, relativePath);
      let contents = fs.readFileSync(fullPath, { encoding: 'utf-8' });

      compiler.precompile(contents, {
        meta: { moduleName: relativePath },
        plugins: {
          ast: [buildStringCollector(this._counter)]
        }
      });
    }
  }

  get strings() {
    return this._counter.map;
  }
};
