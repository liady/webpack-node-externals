var nodeExternals = require('../index.js');
var testUtils = require('./test-utils.js');
var buildAssertion = testUtils.buildAssertion;
var mockNodeModules = testUtils.mockNodeModules;
var restoreMock = testUtils.restoreMock;
var context={};

// Test basic functionality
describe('invocation with no settings', function() {
    before(function(){
        mockNodeModules();
        context.instance = nodeExternals();
    });
    it('should invoke a commonjs callback when given an existing module',      buildAssertion(context, 'moduleA', 'commonjs moduleA'));
    it('should invoke a commonjs callback when given another existing module', buildAssertion(context, 'moduleB', 'commonjs moduleB'));
    it('should invoke a commonjs callback when given an existing sub-module',  buildAssertion(context, 'moduleA/sub-module', 'commonjs moduleA/sub-module'));
    it('should invoke a commonjs callback when given an existing file in a sub-module', buildAssertion(context, 'moduleA/another-sub/index.js', 'commonjs moduleA/another-sub/index.js'));

    it('should invoke an empty callback when given a non-node module',          buildAssertion(context, 'non-node-module', undefined));
    it('should invoke an empty callback when given a relative path',            buildAssertion(context, './src/index.js', undefined));
    after(function(){
        restoreMock()
    });
});

// Test different "importType"
describe('invocation with a different importType', function() {
    before(function(){
        mockNodeModules();
        context.instance = nodeExternals({importType: 'var'});
    });
    it('should invoke a var callback when given an existing module',        buildAssertion(context, 'moduleA', 'var moduleA'));
    it('should invoke a var callback when given another existing module',   buildAssertion(context, 'moduleB', 'var moduleB'));
    it('should invoke a var callback when given an existing sub-module',    buildAssertion(context, 'moduleA/sub-module', 'var moduleA/sub-module'));
    it('should invoke a var callback when given an existing file in a sub-module', buildAssertion(context, 'moduleA/another-sub/index.js', 'var moduleA/another-sub/index.js'));

    it('should invoke an empty callback when given a non-node module',      buildAssertion(context, 'non-node-module', undefined));
    it('should invoke an empty callback when given a relative path',        buildAssertion(context, './src/index.js', undefined));
    after(function(){
        restoreMock()
    });
});

// Test ignore list
describe('honors an ignore list', function() {
    before(function(){
        mockNodeModules();
        context.instance = nodeExternals({ignore: ['moduleA/sub-module', 'moduleA/another-sub/index.js', 'moduleC']});
    });
    it('should invoke a commonjs callback when given an existing module',       buildAssertion(context, 'moduleB', 'commonjs moduleB'));
    it('should invoke a commonjs callback when given an existing sub-module',   buildAssertion(context, 'moduleB/sub-module', 'commonjs moduleB/sub-module'));
    it('should invoke a commonjs callback when given a module which is the parent on an ignored path', buildAssertion(context, 'moduleA', 'commonjs moduleA'));

    it('should invoke an empty callback when given an ignored module path',     buildAssertion(context, 'moduleC', undefined));
    it('should invoke an empty callback when given an ignored sub-module path', buildAssertion(context, 'moduleA/sub-module', undefined));
    it('should invoke an empty callback when given an ignored file path',       buildAssertion(context, 'moduleA/another-sub/index.js', undefined));
    it('should invoke an empty callback when given a non-node module',          buildAssertion(context, 'non-node-module', undefined));
    it('should invoke an empty callback when given a relative path',            buildAssertion(context, './src/index.js', undefined));
    after(function(){
        restoreMock()
    });
});