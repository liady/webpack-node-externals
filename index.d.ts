type ImportType =
    | 'var'
    | 'module'
    | 'assign'
    | 'this'
    | 'window'
    | 'self'
    | 'global'
    | 'commonjs'
    | 'commonjs2'
    | 'commonjs-module'
    | 'commonjs-static'
    | 'amd'
    | 'amd-require'
    | 'umd'
    | 'umd2'
    | 'jsonp'
    | 'system'
    | 'promise'
    | 'import'
    | 'module-import'
    | 'script'
    | 'node-commonjs';

type ImportTypeCallback = (moduleName: string) => string;

type AllowlistOption = string | RegExp | ((moduleName: string) => boolean);

interface ModulesFromFileOptions {
    /** Sections to include (treat as externals). Alias: `excludeFromBundle` */
    include?: string | string[];
    /** Sections to include (treat as externals). */
    excludeFromBundle?: string | string[];
    /** Sections to exclude (bundle these). Alias: `includeInBundle` */
    exclude?: string | string[];
    /** Sections to exclude (bundle these). */
    includeInBundle?: string | string[];
    /** Custom path to package.json */
    fileName?: string;
}

interface NodeExternalsOptions {
    /** An array of modules to include in the bundle (not externalize).
     *  Accepts exact strings, regex patterns, or predicate functions. */
    allowlist?: AllowlistOption[];

    /** The external type for required modules.
     *  Can be a string (e.g. 'commonjs', 'module') or a callback function. */
    importType?: ImportType | ImportTypeCallback;

    /** The directory to scan for node_modules. Defaults to 'node_modules'. */
    modulesDir?: string;

    /** Additional directories to scan for modules. */
    additionalModuleDirs?: string[];

    /** Read module names from package.json instead of scanning the filesystem.
     *  Pass `true` to use defaults, or an options object for fine-grained control. */
    modulesFromFile?: boolean | ModulesFromFileOptions;

    /** Include absolute paths when matching externals. Defaults to false. */
    includeAbsolutePaths?: boolean;

    /** Directories to skip when scanning node_modules. Defaults to ['.bin']. */
    binaryDirs?: string[];

    /** Automatically scan parent directories for node_modules (useful for monorepos).
     *  Matches Node.js module resolution behavior. Defaults to false. */
    resolveFromParentDirs?: boolean;
}

type ExternalsCallback = (err?: Error | null, result?: string) => void;

type ExternalsFunction = {
    (context: string, request: string, callback: ExternalsCallback): void;
    (params: { context: string; request: string }, callback: ExternalsCallback): void;
};

declare function nodeExternals(options?: NodeExternalsOptions): ExternalsFunction;

export = nodeExternals;
