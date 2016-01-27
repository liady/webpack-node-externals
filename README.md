Webpack node_modules externals
==============================

[![Version](http://img.shields.io/npm/v/webpack-node-externals.svg)](https://www.npmjs.org/package/webpack-node-externals)
[![Build Status](https://travis-ci.org/liady/webpack-node-externals.svg?branch=master)](https://travis-ci.org/liady/webpack-node-externals)

Webpack allows you to define [*externals*](https://webpack.github.io/docs/configuration.html#externals) - modules that should not be bundled.

When bundling with Webpack for the backend - you usually wouldn't want to bundle its node_modules dependencies.
This library creates an *externals* function that ignores `node_modules` when bundling in Webpack.

## Quick usage
```sh
npm install webpack-node-externals --save-dev
```

In your `webpack.config.js`:
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
And that's it. All node modules will no longer be bundled but will be left as `require('module')`.

## Detailed overview
### Description
This library scans the `node_modules` folder for all node_modules names, and builds an *externals* function that tells Webpack not to bundle those modules, or any sub-modules of theirs.

### Configuration
This library accepts an `options` object:
```js
var nodeExternals = require('webpack-node-externals');
// in the webpack config:
{
    externals: [nodeExternals(options)]
}
```
 * #### `options.whitelist (=[])`
 An array of paths for the `externals` to whitelist, so they **will** be included in the bundle.

 * #### `options.importType (='commonjs')`
 The method in which unbundled modules will be required in the code. Best to leave as `commonjs` for node modules.

 * #### `options.modulesDir (='node_modules')`
 The folder in which to search for the node modules.

 * #### Example
    ```js
    var nodeExternals = require('webpack-node-externals');
    ...
    module.exports = {
        ...
        target: 'node', // important in order not to bundle built-in modules like path, fs, etc.
        externals: [nodeExternals({
            whitelist: ['jquery', 'webpack/hot/dev-server']
            // this WILL include `jquery` and `webpack/hot/dev-server` in the bundle
        })],
        ...
    };
    ```

### Test
```sh
npm run test
```

## Q&A
#### Why not just use a regex in the Webpack config?
Webpack allows inserting [regex](https://webpack.github.io/docs/configuration.html#externals) in the *externals* array, to capture non-relative modules:
```js
{
    externals: [
        // Every non-relative module is external
        // abc -> require("abc")
        /^[a-z\-0-9]+$/
    ]
}
```
However, this will leave unbundled **all non-relative requires**, so it does not account for aliases that may be defined in webpack itself.
This library scans the `node_modules` folder, so it only leaves unbundled the actual node modules that are being used.

## License
MIT
