var fs = require("fs");
var path = require("path");
var findRoot = require("find-root");
var micromatch = require("micromatch");

var scopedModuleRegex = new RegExp('@[a-zA-Z0-9][\\w-.]+\/[a-zA-Z0-9][\\w-.]+([a-zA-Z0-9.\/]+)?', 'g');
var atPrefix = new RegExp('^@', 'g');
function contains(arr, val) {
    return arr && arr.indexOf(val) !== -1;
}

/**
 * Checks if we are running in a Yarn workspace
 * and if so returns the path to the root of the workspace.
 */
function findYarnWorkspaceRoot() {
    try {
        // Figure out the current root of the working directory.
        const processRoot = findRoot(process.cwd());

        // To find the workspace root, if any, we recursively look for package.json files
        // and check if they contain the workspaces array required by Yarn.
        // If we found such a package.json we'll check if this module is currently one of those workspaces.
        const workspaceRoot = findRoot(processRoot, function (dir) {
            const possiblePackageJSONPath = path.join(dir, "./package.json");

            if (!fs.existsSync(possiblePackageJSONPath)) {
                return false;
            }

            // We found a package.json so let's check for the workspaces array.
            const packageJSON = JSON.parse(fs.readFileSync(possiblePackageJSONPath));
            const containsWorkspaces =
                !!packageJSON.workspaces && Array.isArray(packageJSON.workspaces);

            if (!containsWorkspaces) {
                return false;
            }

            // All that's left is check this module is a workspace.
            // We do this by checking if our relative path matches one of the workspace globs.
            const relativeProcessRoot = path
                .relative(dir, processRoot)
                .replace(/\\/gi, "/"); // ensure all slashes are consistent and valid for glob matching.

            const matchingWorkspace = packageJSON.workspaces.find(function (
                workspace
            ) {
                const validWorkspace = workspace.replace(/\\/gi, "/"); // again, slashes should be consistent.
                return micromatch.isMatch(relativeProcessRoot, validWorkspace);
            });

            return !!matchingWorkspace;
        });

        return workspaceRoot;
    } catch (e) {
        // We went up so far that findRoot eventually returned an error
        // or we aren't even runninng in a working directory that contains a package.json,
        // default to no workspace.
        return null;
    }
}



function readDir(dirName) {	
    try {
		// When running in a Yarn workspace, just looking for node_modules won't work
        // because Yarn keeps the entire node_modules list at the root of all workspaces.
        // This is why we first have to figure out if we are running in a workspace.
        // If we are running in a workspace we have to look into the node_modules of the Yarn root.
        const rootPackageWithWorkspaces = findYarnWorkspaceRoot();
        const usingYarnWorkspaces = !!rootPackageWithWorkspaces;

        const nodeModulesRootDir = usingYarnWorkspaces
            ? path.join(rootPackageWithWorkspaces, dirName)
            : dirName;
		
        return fs.readdirSync(nodeModulesRootDir).map(function(module) {
            if (atPrefix.test(module)) {
                // reset regexp
                atPrefix.lastIndex = 0;
                try {
                    return fs.readdirSync(path.join(nodeModulesRootDir, module)).map(function(scopedMod) {
                        return module + '/' + scopedMod;
                    });
                } catch (e) {
                    return [module];
                }
            }
            return module
        }).reduce(function(prev, next) {
            return prev.concat(next);
        }, []);
    } catch (e) {
        console.log(e);
        return [];
    }
}

function readFromPackageJson() {
    var packageJson;
    try {
        var packageJsonString = fs.readFileSync(path.join(process.cwd(), './package.json'), 'utf8');
        packageJson = JSON.parse(packageJsonString);
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
        } else if (typeof pattern === 'function') {
            return pattern(val);
        } else {
            return pattern == val;
        }
    });
}

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
        return !contains(binaryDirs, x);
    }

    // create the node modules list
    var nodeModules = modulesFromFile ? readFromPackageJson() : readDir(modulesDir).filter(isNotBinary);

    // return an externals function
    return function(context, request, callback){
        var moduleName = getModuleName(request, includeAbsolutePaths);
        if (contains(nodeModules, moduleName) && !containsPattern(whitelist, request)) {
            // mark this module as external
            // https://webpack.github.io/docs/configuration.html#externals
            return callback(null, importType + " " + request);
        };
        callback();
    }
}