var mockDir = require('mock-fs');
var chai = require('chai');
var expect = chai.expect;

/**
 * Creates an assertion function that makes sure to output expectedResult when given moduleName
 * @param  {object} context          context object that holds the instance
 * @param  {string} moduleName       given module name
 * @param  {string} expectedResult   expected external module string
 * @return {function}                the assertion function
 */
exports.buildAssertion = function buildAssertion(context, moduleName, expectedResult){
    return function(done) {
        context.instance(null, moduleName, function(noarg, externalModule) {
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
    };
    mockDir({'node_modules' : structure});
}

/**
 * Restores the fs module
 * @return {void}
 */
exports.restoreMock = function restoreMock(){
    mockDir.restore();
}