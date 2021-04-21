const mockDir = require('mock-fs');
const nodeExternals = require('../index.js');
const webpack = require('webpack');
const fs = require('fs');
const ncp = require('ncp').ncp;
const path = require('path');
const relative = path.join.bind(path, __dirname);
const chai = require('chai');
const expect = chai.expect;

/**
 * Creates an assertion function that makes sure to output expectedResult when given moduleName
 * @param  {object} context          context object that holds the instance
 * @param  {string} moduleName       given module name
 * @param  {string} expectedResult   expected external module string
 * @return {function}                the assertion function
 */
exports.buildAssertion = function buildAssertion(context, moduleName, expectedResult){
    return function(done) {
        context.instance(relative(), moduleName, function(noarg, externalModule) {
            expect(externalModule).to.be.equal(expectedResult);
            done();
        })
    };
}

/**
 * Creates an assertion function that makes sure to output expectedResult when given moduleName
 * <<Webpack 5 version>>
 * @param  {object} context          context object that holds the instance
 * @param  {string} moduleName       given module name
 * @param  {string} expectedResult   expected external module string
 * @return {function}                the assertion function
 */
exports.buildAssertionWebpack5 = function buildAssertion(context, moduleName, expectedResult){
    return function(done) {
        context.instance({ context: relative(), request: moduleName }, function(noarg, externalModule) {
            expect(externalModule).to.be.equal(expectedResult);
            done();
        })
    };
}

/**
 * Mocks the fs module to output a desired structure
 * @param  {object} structure       the requested structure
 * @return {void}
 */
exports.mockNodeModules = function mockNodeModules(structure){
    structure = structure || {
        'moduleA' : {
            'sub-module':{},
            'another-sub':{
                'index.js' : ''
            },
        },
        'moduleB' : {
            'sub-module':{}
        },
        'moduleC' : {},
        'moduleD' : {
            'sub-module':{}
        },
        'moduleF' : {},
        '@organisation/moduleA':{},
        '@organisation/base-node':{},
    };

    mockDir({
        'node_modules' : structure,
        'package.json': JSON.stringify({
            dependencies: {
                'moduleE': '1.0.0',
                'moduleF': '1.0.0',
                '@organisation/moduleE': '1.0.0',
            },
            devDependencies: {
                'moduleG': '1.0.0',
                '@organisation/moduleG': '1.0.0',
            },            
        })
    });
}

/**
 * Restores the fs module
 * @return {void}
 */
exports.restoreMock = function restoreMock(){
    mockDir.restore();
}

exports.copyModules = function(moduleNames) {
    return Promise.all(moduleNames.map(function(moduleName) {
        return copyDir(relative('test-webpack', 'modules', moduleName), relative('../node_modules', moduleName));
    }));
}

exports.removeModules = function(moduleNames) {
    moduleNames.forEach(function(moduleName){
        removeDir(relative('../node_modules', moduleName));
    });
}

/**
 * Creates an assertion function that makes sure the result contains/doesnt contain expected modules
 * @param {object} nodeExternalsConfig The node externals configuration
 * @param {object} externals expected externals
 * @param {object} nonExternals expected non externals
 * @return {function} the assertion function
 */
exports.webpackAssertion = function webpackAssertion(nodeExternalsConfig, externals, nonExternals){
    return function() {
        return generateWithWebpack(nodeExternalsConfig).then(function(result) {
            assertExternals(result, externals, nonExternals);
        });
    };
}

/**
 * Generates the result file with Webpack, using our nodeExternals
 * @param  {object} context             The context object to hang the result on
 * @param  {object} nodeExternalsConfig The node externals configuration
 * @return {Promise}
 */
function generateWithWebpack(nodeExternalsConfig) {
    const testDir = relative('test-webpack');
    const outputFileName = 'bundle.js';
    const outputFile = path.join(testDir, outputFileName);
    return new Promise(function(resolve, reject) {
        webpack({
            entry: path.join(testDir, 'index.js'),
            output: {
                filename: outputFileName,
                path: testDir
            },
            externals: [nodeExternals(nodeExternalsConfig)],
            resolve: {
                alias: {
                    'module-c' : path.join(testDir, './modules/module-c')
                }
            }
        }, function(err){
            if(err) {
                reject(err);
            } else {
                const contents = fs.readFileSync(outputFile, 'utf-8');
                fs.unlinkSync(outputFile);
                resolve(contents);
            }
        });
    });
}

function assertExternals(result , externals, nonExternals) {
    externals.forEach(function(moduleName) {
        expect(result).to.not.contain(bundled(moduleName));
        expect(result).to.contain(external(moduleName));
    });
    nonExternals.forEach(function(moduleName) {
        expect(result).to.not.contain(external(moduleName));
        expect(result).to.contain(bundled(moduleName));
    });
}

function bundled(moduleName) {
    return moduleName + ':bundled';
}

function external(moduleName) {
    return 'require("'+ moduleName +'")';
}

function removeDir(dirName) {
    if(fs.existsSync(dirName) ) {
      fs.readdirSync(dirName).forEach(function(file){
        fs.unlinkSync(path.join(dirName, file));
      });
      fs.rmdirSync(dirName);
    }
}

function copyDir(source, dest) {
    return new Promise(function(resolve, reject) {
        ncp(source, dest, function(err) {
            if(err) {
                reject(err)
            } else {
                resolve()
            }
        })
    })
}