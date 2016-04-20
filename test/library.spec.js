var nodeExternals = require('../index.js');
var testUtils = require('./test-utils.js');
var mockNodeModules = testUtils.mockNodeModules;
var restoreMock = testUtils.restoreMock;
var context={};
var assertResult = testUtils.buildAssertion.bind(null, context);

// Test basic functionality
describe('invocation with no settings', function() {
    before(function(){
        mockNodeModules();
        context.instance = nodeExternals();
    });
    it('should invoke a commonjs callback when given an existing module',       assertResult('moduleA', 'commonjs moduleA'));
    it('should invoke a commonjs callback when given another existing module',  assertResult('moduleB', 'commonjs moduleB'));
    it('should invoke a commonjs callback when given an existing sub-module',   assertResult('moduleA/sub-module', 'commonjs moduleA/sub-module'));
    it('should invoke a commonjs callback when given an existing file in a sub-module',  assertResult('moduleA/another-sub/index.js', 'commonjs moduleA/another-sub/index.js'));

    it('should invoke an empty callback when given a non-node module',           assertResult('non-node-module', undefined));
    it('should invoke an empty callback when given a relative path',             assertResult('./src/index.js', undefined));
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
    it('should invoke a var callback when given an existing module',         assertResult('moduleA', 'var moduleA'));
    it('should invoke a var callback when given another existing module',    assertResult('moduleB', 'var moduleB'));
    it('should invoke a var callback when given an existing sub-module',     assertResult('moduleA/sub-module', 'var moduleA/sub-module'));
    it('should invoke a var callback when given an existing file in a sub-module',  assertResult('moduleA/another-sub/index.js', 'var moduleA/another-sub/index.js'));

    it('should invoke an empty callback when given a non-node module',       assertResult('non-node-module', undefined));
    it('should invoke an empty callback when given a relative path',         assertResult('./src/index.js', undefined));
    after(function(){
        restoreMock()
    });
});

// Test whitelist
describe('honors a whitelist', function() {
    before(function(){
        mockNodeModules();
        context.instance = nodeExternals({
            whitelist: ['moduleA/sub-module', 'moduleA/another-sub/index.js', 'moduleC', /^moduleD/]
        });
    });
    it('should invoke a commonjs callback when given an existing module',        assertResult('moduleB', 'commonjs moduleB'));
    it('should invoke a commonjs callback when given an existing sub-module',    assertResult('moduleB/sub-module', 'commonjs moduleB/sub-module'));
    it('should invoke a commonjs callback when given a module which is the parent on an ignored path',  assertResult('moduleA', 'commonjs moduleA'));
    it('should invoke a commonjs callback when given a sub-module of an ignored module',  assertResult('moduleC/sub-module', 'commonjs moduleC/sub-module'));

    it('should invoke an empty callback when given an ignored module path',      assertResult('moduleC', undefined));
    it('should invoke an empty callback when given an ignored sub-module path',  assertResult('moduleA/sub-module', undefined));
    it('should invoke an empty callback when given an ignored file path',        assertResult('moduleA/another-sub/index.js', undefined));
    it('should invoke an empty callback when given an ignored regex path',       assertResult('moduleD', undefined));
    it('should invoke an empty callback when given an ignored regex sub-module path',  assertResult('moduleD/sub-module', undefined));
    it('should invoke an empty callback when given a non-node module',           assertResult('non-node-module', undefined));
    it('should invoke an empty callback when given a relative path',             assertResult('./src/index.js', undefined));
    after(function(){
        restoreMock()
    });
});