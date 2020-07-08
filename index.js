var utils = require('./utils');

var scopedModuleRegex = new RegExp('@[a-zA-Z0-9][\\w-.]+\/[a-zA-Z0-9][\\w-.]+([a-zA-Z0-9.\/]+)?', 'g');

function getModuleName(request, includeAbsolutePaths) {
    var req = request;
    var delimiter = '/';

    if (includeAbsolutePaths) {
        req = req.replace(/^.*?\/node_modules\//, '');
    }
    // check if scoped module
    if (scopedModuleRegex.test(req)) {
        // reset regexp
        scopedModuleRegex.lastIndex = 0;
        return req.split(delimiter, 2).join(delimiter);
    }
    return req.split(delimiter)[0];
}

module.exports = function nodeExternals(options) {
    options = options || {};
    var whitelist = [].concat(options.whitelist || []);
    var binaryDirs = [].concat(options.binaryDirs || ['.bin']);
    var importType = options.importType || 'commonjs';
    var modulesDir = options.modulesDir || 'node_modules';
    var modulesFromFile = !!options.modulesFromFile;
    var includeAbsolutePaths = !!options.includeAbsolutePaths;

    // helper function
    function isNotBinary(x) {
        return !utils.contains(binaryDirs, x);
    }

    // create the node modules list
    var nodeModules = modulesFromFile ? utils.readFromPackageJson(options.modulesFromFile) : utils.readDir(modulesDir).filter(isNotBinary);

    // return an externals function
    return function(context, request, callback){
        var moduleName = getModuleName(request, includeAbsolutePaths);
        if (utils.contains(nodeModules, moduleName) && !utils.containsPattern(whitelist, request)) {
            if (typeof importType === 'function') {
                return callback(null, importType(request));
            }
            // mark this module as external
            // https://webpack.js.org/configuration/externals/
            return callback(null, importType + " " + request);
        };
        callback();
    }
};