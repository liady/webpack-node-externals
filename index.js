var utils = require('./utils');

var scopedModuleRegex = new RegExp(
    '@[a-zA-Z0-9][\\w-.]+/[a-zA-Z0-9][\\w-.]+([a-zA-Z0-9./]+)?',
    'g'
);

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
    var mistakes = utils.validateOptions(options) || [];
    if (mistakes.length) {
        mistakes.forEach(function (mistake) {
            utils.error(
                mistakes.map(function (mistake) {
                    return mistake.message;
                })
            );
            utils.log(mistake.message);
        });
    }
    var allowlist = [].concat(options.allowlist || []);
    var binaryDirs = [].concat(options.binaryDirs || ['.bin']);
    var importType = options.importType || 'commonjs';
    var modulesDir = options.modulesDir || 'node_modules';
    var modulesFromFile = !!options.modulesFromFile;
    var includeAbsolutePaths = !!options.includeAbsolutePaths;
    var additionalModuleDirs = options.additionalModuleDirs || [];

    // helper function
    function isNotBinary(x) {
        return !utils.contains(binaryDirs, x);
    }

    // create the node modules list
    var nodeModules = modulesFromFile
        ? utils.readFromPackageJson(options.modulesFromFile)
        : utils.readDir(modulesDir).filter(isNotBinary);
    additionalModuleDirs.forEach(function (additionalDirectory) {
        nodeModules = nodeModules.concat(
            utils.readDir(additionalDirectory).filter(isNotBinary)
        );
    });

    // return an externals function
    return function () {
        var arg1 = arguments[0];
        var arg2 = arguments[1];
        var arg3 = arguments[2];
        var context = arg1;
        var request = arg2;
        var callback = arg3;
        // in case of webpack 5
        if (arg1 && arg1.context && arg1.request) {
            context = arg1.context;
            request = arg1.request;
            callback = arg2;
        }
        var moduleName = getModuleName(request, includeAbsolutePaths);
        if (
            utils.contains(nodeModules, moduleName) &&
            !utils.containsPattern(allowlist, request)
        ) {
            if (typeof importType === 'function') {
                return callback(null, importType(request));
            }
            // mark this module as external
            // https://webpack.js.org/configuration/externals/
            return callback(null, importType + ' ' + request);
        }
        callback();
    };
};
