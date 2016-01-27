var fs = require("fs");

function contains(arr, val) {
    return arr && arr.indexOf(val) !== -1;
}

function readDir(dirName){
    try {
        return fs.readdirSync(dirName);
    } catch (e){
        return [];
    }
}

module.exports = function nodeExternals(options) {
    options = options || {};
    var ignoreList = [].concat(options.ignore || []);
    var binaryDirs = [].concat(options.binaryDirs || ['.bin']);
    var importType = options.importType || 'commonjs';
    var modulesDir = options.modulesDir || 'node_modules';

    // helper function
    function isNotBinary(x) {
        return !contains(binaryDirs, x);
    }

    // create the node modules list
    var nodeModules = readDir(modulesDir).filter(isNotBinary);

    // return an externals function
    return function(context, request, callback) {
        var pathStart = request.split('/')[0];
        if (contains(nodeModules, pathStart) && !contains(ignoreList, request)) {
            // mark this module as external
            // https://webpack.github.io/docs/configuration.html#externals
            return callback(null, importType + " " + request);
        };
        callback();
    }
}