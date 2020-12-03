var fs = require('fs');
var path = require('path');
var resolve = require('resolve');

exports.contains = function contains(arr, val) {
    return arr && arr.indexOf(val) !== -1;
};

var atPrefix = new RegExp('^@', 'g');
exports.readDir = function readDir(dirName) {
    if (!fs.existsSync(dirName)) {
        return [];
    }

    try {
        return fs
            .readdirSync(dirName)
            .map(function (module) {
                if (atPrefix.test(module)) {
                    // reset regexp
                    atPrefix.lastIndex = 0;
                    try {
                        return fs
                            .readdirSync(path.join(dirName, module))
                            .map(function (scopedMod) {
                                return module + '/' + scopedMod;
                            });
                    } catch (e) {
                        return [module];
                    }
                }
                return module;
            })
            .reduce(function (prev, next) {
                return prev.concat(next);
            }, []);
    } catch (e) {
        return [];
    }
};

exports.readFromPackageJson = function readFromPackageJson(options) {
    if (typeof options !== 'object') {
        options = {};
    }
    var includeInBundle = options.exclude || options.includeInBundle;
    var excludeFromBundle = options.include || options.excludeFromBundle;

    // read the file
    var packageJson;
    try {
        var fileName = options.fileName || 'package.json';
        var packageJsonString = fs.readFileSync(
            path.resolve(process.cwd(), fileName),
            'utf8'
        );
        packageJson = JSON.parse(packageJsonString);
    } catch (e) {
        return [];
    }
    // sections to search in package.json
    var sections = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
    ];
    if (excludeFromBundle) {
        sections = [].concat(excludeFromBundle);
    }
    if (includeInBundle) {
        sections = sections.filter(function (section) {
            return [].concat(includeInBundle).indexOf(section) === -1;
        });
    }
    // collect dependencies
    var deps = {};
    sections.forEach(function (section) {
        Object.keys(packageJson[section] || {}).forEach(function (dep) {
            deps[dep] = true;
        });
    });
    return Object.keys(deps);
};

exports.containsPattern = function containsPattern(arr, val) {
    return (
        arr &&
        arr.some(function (pattern) {
            if (pattern instanceof RegExp) {
                return pattern.test(val);
            } else if (typeof pattern === 'function') {
                return pattern(val);
            } else {
                return pattern == val;
            }
        })
    );
};

exports.validateOptions = function (options) {
    options = options || {};
    var results = [];
    var mistakes = {
        allowlist: ['allowslist', 'whitelist', 'allow'],
        importType: ['import', 'importype', 'importtype'],
        modulesDir: ['moduledir', 'moduledirs'],
        modulesFromFile: ['modulesfile'],
        includeAbsolutePaths: ['includeAbsolutesPaths'],
        additionalModuleDirs: ['additionalModulesDirs', 'additionalModulesDir'],
    };
    var optionsKeys = Object.keys(options);
    var optionsKeysLower = optionsKeys.map(function (optionName) {
        return optionName && optionName.toLowerCase();
    });
    Object.keys(mistakes).forEach(function (correctTerm) {
        if (!options.hasOwnProperty(correctTerm)) {
            mistakes[correctTerm]
                .concat(correctTerm.toLowerCase())
                .forEach(function (mistake) {
                    var ind = optionsKeysLower.indexOf(mistake.toLowerCase());
                    if (ind > -1) {
                        results.push({
                            message: `Option '${optionsKeys[ind]}' is not supported. Did you mean '${correctTerm}'?`,
                            wrongTerm: optionsKeys[ind],
                            correctTerm: correctTerm,
                        });
                    }
                });
        }
    });
    return results;
};

exports.log = function (message) {
    console.log(`[webpack-node-externals] : ${message}`);
};

exports.error = function (errors) {
    throw new Error(
        errors
            .map(function (error) {
                return `[webpack-node-externals] : ${error}`;
            })
            .join('\r\n')
    );
};

exports.resolveRequest= function (req, issuer) {
  var basedir =
    issuer.endsWith(path.posix.sep) || issuer.endsWith(path.win32.sep)
      ? issuer
      : path.dirname(issuer);
  return resolve.sync(req, { basedir: basedir });
};
