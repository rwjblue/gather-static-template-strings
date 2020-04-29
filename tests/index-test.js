'use strict';

const { createTempDir } = require('broccoli-test-helper');
const { mangle } = require('./helpers');
const StringCollector = require('../src');

const root = process.cwd();

describe('StringCollector', function () {
  let input;

  beforeEach(async function () {
    input = await createTempDir();
  });

  afterEach(async function () {
    process.chdir(root);

    await input.dispose();
  });

  it('should capture strings across templates', function () {
    input.write({
      foo: {
        bar: {
          'baz.hbs': 'derp',
          'qux.hbs': 'derp',
        },
      },
    });

    let instance = new StringCollector({
      path: input.path(),
    });

    instance.populate();

    expect(instance.strings).toEqual(
      mangle({
        derp: 2,
      })
    );
  });

  it('should not capture strings from tmp', function () {
    input.write({
      tmp: {
        'derp.hbs': 'derp',
      },
      foo: {
        bar: {
          'baz.hbs': 'derp',
          'qux.hbs': 'derp',
        },
      },
    });

    let instance = new StringCollector({
      path: input.path(),
    });

    instance.populate();

    expect(instance.strings).toEqual(
      mangle({
        derp: 2,
      })
    );
  });

  it('defaults to process.cwd', function () {
    process.chdir(input.path());
    input.write({ 'foo.hbs': 'hi!' });

    let instance = new StringCollector();
    instance.populate();

    expect(instance.strings).toEqual(mangle({ 'hi!': 1 }));
  });

  it('can generate non-mangled list of strings', function () {
    process.chdir(input.path());
    input.write({ 'foo.hbs': 'hi!' });

    let instance = new StringCollector({ mangle: false });
    instance.populate();

    expect(instance.strings).toEqual({ 'hi!': 1 });
  });

  it('identifies strings within ambiguous contextual component invocations', function () {
    process.chdir(input.path());
    input.write({
      'foo.hbs': '{{#foo-bar as |bar|}}{{#bar.baz}}Hi!{{/bar.baz}}{{/foo-bar}}',
    });

    let instance = new StringCollector({ mangle: false });
    instance.populate();

    expect(instance.strings['Hi!']).toEqual(1);
  });

  it('does not crash on invalid template contents', function () {
    process.chdir(input.path());
    input.write({ 'foo.hbs': '<p>' });

    let instance = new StringCollector({ mangle: false });
    instance.populate();

    expect(instance.strings).toEqual({});
  });

  it('calls fileProcessed callback for each file', function () {
    let steps = [];
    process.chdir(input.path());

    input.write({
      'foo.hbs': 'hi!',
      'bar.hbs': 'derp',
    });

    let instance = new StringCollector({
      mangle: false,
      fileProcessed(path) {
        steps.push(path);
      },
    });
    instance.populate();

    expect(steps).toEqual(['bar.hbs', 'foo.hbs']);
    expect(instance.strings).toEqual({
      'hi!': 1,
      derp: 1,
    });
  });
});
