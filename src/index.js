'use strict';

const fs = require('fs');
const path = require('path');
const hash = require('./utils/hash');
const walkSync = require('walk-sync');
const compiler = require('@glimmer/compiler');

function transformDotComponentInvocation(env) {
  let builders = env.syntax.builders;

  function isMultipartPath(path) {
    return path.parts && path.parts.length > 1;
  }

  function isInlineInvocation(path, params, hash) {
    if (isMultipartPath(path)) {
      if (params.length > 0 || hash.pairs.length > 0) {
        return true;
      }
    }

    return false;
  }

  function wrapInComponent(node) {
    let component = node.path;
    let componentHelper = builders.path('component');
    node.path = componentHelper;
    node.params.unshift(component);
  }

  return {
    name: 'transform-dot-component-invocation',

    visitor: {
      MustacheStatement: node => {
        if (isInlineInvocation(node.path, node.params, node.hash)) {
          wrapInComponent(node);
        }
      },
      BlockStatement: node => {
        if (isMultipartPath(node.path)) {
          wrapInComponent(node);
        }
      },
    },
  };
}

function buildStringCollector(counter)  {
  return () => ({
    name: 'string-collector',

    visitor: {
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
    }
  });
}

module.exports = class CollectStrings {
  constructor(_options) {
    let options = _options || {};
    this._path = options.path || process.cwd();
    this._mangle = 'mangle' in options ? options.mangle : true;
    this._fileProcessed = options.fileProcessed || function() {};

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

      try {
        compiler.precompile(contents, {
          moduleName: relativePath,
          meta: { moduleName: relativePath },
          plugins: {
            ast: [
              transformDotComponentInvocation,
              buildStringCollector(this)
            ]
          }
        });

      } catch(e) {
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
