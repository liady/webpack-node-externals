const fs = require('fs');
const path = require('path');

exports.contains = function contains(arr, val) {
    return arr && arr.includes(val);
};

const atPrefix = /^@/;
exports.readDir = function readDir(dirName) {
    if (!fs.existsSync(dirName)) {
        return [];
    }

    try {
        return fs
            .readdirSync(dirName)
            .map((module) => {
                if (atPrefix.test(module)) {
                    try {
                        return fs
                            .readdirSync(path.join(dirName, module))
                            .map((scopedMod) => module + '/' + scopedMod);
                    } catch (e) {
                        return [module];
                    }
                }
                return module;
            })
            .flat();
    } catch (e) {
        return [];
    }
};

function getFilePath(options) {
    return path.resolve(process.cwd(), options.fileName || 'package.json');
}
exports.getFilePath = getFilePath;

exports.readFromPackageJson = function readFromPackageJson(options) {
    if (typeof options !== 'object') {
        options = {};
    }
    const includeInBundle = options.exclude || options.includeInBundle;
    const excludeFromBundle = options.include || options.excludeFromBundle;

    // read the file
    let packageJson;
    try {
        const packageJsonString = fs.readFileSync(getFilePath(options), 'utf8');
        packageJson = JSON.parse(packageJsonString);
    } catch (e) {
        return [];
    }
    // sections to search in package.json
    let sections = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
    ];
    if (excludeFromBundle) {
        sections = [].concat(excludeFromBundle);
    }
    if (includeInBundle) {
        sections = sections.filter(
            (section) => ![].concat(includeInBundle).includes(section)
        );
    }
    // collect dependencies
    const deps = {};
    sections.forEach((section) => {
        Object.keys(packageJson[section] || {}).forEach((dep) => {
            deps[dep] = true;
        });
    });
    return Object.keys(deps);
};

exports.findParentNodeModules = function findParentNodeModules(startDir) {
    const dirs = [];
    let currentDir = path.resolve(startDir || process.cwd());
    const root = path.parse(currentDir).root;

    // Traverse up from current directory, skipping the starting dir itself
    currentDir = path.dirname(currentDir);

    while (currentDir !== root) {
        const nodeModulesDir = path.join(currentDir, 'node_modules');
        if (fs.existsSync(nodeModulesDir)) {
            dirs.push(nodeModulesDir);
        }
        currentDir = path.dirname(currentDir);
    }
    return dirs;
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
                return pattern === val;
            }
        })
    );
};

exports.validateOptions = function (options) {
    options = options || {};
    const results = [];
    const mistakes = {
        allowlist: ['allowslist', 'whitelist', 'allow'],
        importType: ['import', 'importype', 'importtype'],
        modulesDir: ['moduledir', 'moduledirs'],
        modulesFromFile: ['modulesfile'],
        includeAbsolutePaths: ['includeAbsolutesPaths'],
        additionalModuleDirs: ['additionalModulesDirs', 'additionalModulesDir'],
        binaryDirs: ['binarydir', 'binarydirs'],
        resolveFromParentDirs: ['resolvefromparentdir', 'resolvefromparent'],
    };
    const optionsKeys = Object.keys(options);
    const optionsKeysLower = optionsKeys.map(function (optionName) {
        return optionName && optionName.toLowerCase();
    });
    Object.keys(mistakes).forEach(function (correctTerm) {
        if (!options.hasOwnProperty(correctTerm)) {
            mistakes[correctTerm]
                .concat(correctTerm.toLowerCase())
                .forEach(function (mistake) {
                    const ind = optionsKeysLower.indexOf(mistake.toLowerCase());
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
