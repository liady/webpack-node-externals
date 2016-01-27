Skips bundling node_modules in Webpack
======================================

[![Version](http://img.shields.io/npm/v/webpack-node-externals.svg)](https://www.npmjs.org/package/webpack-node-externals)
[![Build Status](https://travis-ci.org/liady/webpack-node-externals.svg?branch=master)](https://travis-ci.org/liady/webpack-node-externals)

Webpack allows you to define *externals* - modules that should not be bundled.

When bundling with Webpack for the backend - you usually wouldn't want to bundle its node_modules dependencies.
This library creates an *externals* function that ignores `node_modules` when bundling in Webpack.

## Quick usage
```sh
npm install webpack-node-externals --save-dev
```

In `webpack.config.js`:
```js
var nodeExternals = require('webpack-node-externals');
...
module.exports = {
    ...
    target: 'node', // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    ...
};
```

## Detailed overview

### Test
```sh
npm run test
```

## License
MIT