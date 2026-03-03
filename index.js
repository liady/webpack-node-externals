const utils = require('./utils');

const scopedModuleRegex =
    /@[a-zA-Z0-9][\w-.]+\/[a-zA-Z0-9][\w-.]+([a-zA-Z0-9./]+)?/;

function getModuleName(request, includeAbsolutePaths) {
    let req = request;
    const delimiter = '/';

    if (includeAbsolutePaths) {
        req = req.replace(/^.*?\/node_modules\//, '');
    }
    // check if scoped module
    if (scopedModuleRegex.test(req)) {
        return req.split(delimiter, 2).join(delimiter);
    }
    return req.split(delimiter)[0];
}

module.exports = function nodeExternals(options) {
    options = options || {};
    const mistakes = utils.validateOptions(options) || [];
    if (mistakes.length) {
        utils.error(mistakes.map((mistake) => mistake.message));
    }
    const webpackInternalAllowlist = [/^webpack\/container\/reference\//];
    const allowlist = []
        .concat(webpackInternalAllowlist)
        .concat(options.allowlist || []);
    const binaryDirs = [].concat(options.binaryDirs || ['.bin']);
    const importType = options.importType || 'commonjs';
    const modulesDir = options.modulesDir || 'node_modules';
    const modulesFromFile = !!options.modulesFromFile;
    const includeAbsolutePaths = !!options.includeAbsolutePaths;
    const additionalModuleDirs = options.additionalModuleDirs || [];
    const resolveFromParentDirs = !!options.resolveFromParentDirs;

    // helper function
    function isNotBinary(x) {
        return !utils.contains(binaryDirs, x);
    }

    // create the node modules list
    let nodeModules = modulesFromFile
        ? utils.readFromPackageJson(options.modulesFromFile)
        : utils.readDir(modulesDir).filter(isNotBinary);
    additionalModuleDirs.forEach(function (additionalDirectory) {
        nodeModules = nodeModules.concat(
            utils.readDir(additionalDirectory).filter(isNotBinary)
        );
    });
    if (resolveFromParentDirs) {
        utils.findParentNodeModules(process.cwd()).forEach(function (parentDir) {
            nodeModules = nodeModules.concat(
                utils.readDir(parentDir).filter(isNotBinary)
            );
        });
    }

    // return an externals function
    return function (...args) {
        const [arg1, arg2, arg3] = args;
        // let context = arg1;
        let request = arg2;
        let callback = arg3;
        // in case of webpack 5
        if (arg1 && arg1.context && arg1.request) {
            // context = arg1.context;
            request = arg1.request;
            callback = arg2;
        }
        const moduleName = getModuleName(request, includeAbsolutePaths);
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
