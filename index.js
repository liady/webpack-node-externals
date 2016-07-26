var fs = require("fs");

function contains(arr, val) {
    return arr && arr.indexOf(val) !== -1;
}

function readDir(dirName) {
    try {
        return fs.readdirSync(dirName);
    } catch (e){
        return [];
    }
}

function readFromPackageJson() {
    var packageJson;
    try {
        packageJson = require(process.cwd() + '/package.json');
    } catch (e){
        return [];
    }
    var sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    var deps = {};
    sections.forEach(function(section){
        Object.keys(packageJson[section] || {}).forEach(function(dep){
            deps[dep] = true;
        });
    });
    return Object.keys(deps);
}

function containsPattern(arr, val) {
    return arr && arr.some(function(pattern){
        if(pattern instanceof RegExp){
            return pattern.test(val);
        } else {
            return pattern == val;
        }
    });
}

function getModuleName(request, modulesDir) {
    var req = request;
    // in case absolute, strip all parts before */modulesDir/
    req = req.replace(/^\/.*?node_modules\//, '');
    // return the module name
    return req.split('/')[0];
}

module.exports = function nodeExternals(options) {
    options = options || {};
    var whitelist = [].concat(options.whitelist || []);
    var binaryDirs = [].concat(options.binaryDirs || ['.bin']);
    var importType = options.importType || 'commonjs';
    var modulesDir = options.modulesDir || 'node_modules';
    var modulesFromFile = !!options.modulesFromFile;

    // helper function
    function isNotBinary(x) {
        return !contains(binaryDirs, x);
    }

    // create the node modules list
    var nodeModules = modulesFromFile ? readFromPackageJson() : readDir(modulesDir).filter(isNotBinary);

    // return an externals function
    return function(context, request, callback) {
        var moduleName = options.includeAbsolutePaths ? getModuleName(request) : request.split('/')[0];
        if (contains(nodeModules, moduleName) && !containsPattern(whitelist, request)) {
            // mark this module as external
            // https://webpack.github.io/docs/configuration.html#externals
            return callback(null, importType + " " + request);
        };
        callback();
    }
}
