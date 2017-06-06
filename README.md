# gather-static-template-strings

Gather a list of all static strings in your Ember and/or Glimmer templates.

## Motivation

The goal of this library is to be able to collect a list of the most commonly used static strings
and allow us to remove them from the compiled template output (therefore shrinking template sizes
dramatically). It is quite feasible to store a list of the most common strings in an array, and
simply store their index in the precompiled template. For this to be useful, we need to be able to
gather these static strings across a good cross-section of applications.

## Privacy

If we are going to collectively share the output of this utility, we **must** ensure that we do
not accidentally expose private information in the output. In order to facilitate this, the utility
has been written so that all of the keys are SHA256 hashes of the original strings. This allows us
to efficiently aggregate them, but does not leak any private data from an applications templates.

## Usage

```bash
% npm install -g gather-static-template-strings
% gather-static-template-strings --path <path to your project> --output-path out.json
```

Share your `out.json` (via gist most likely) with us in #dev-glimmer on Ember Community slack.
