declare function _exports(options?: {
    additionalModuleDirs?: string[];
    allowlist?: string | RegExp | ((moduleName: string) => boolean) | (string | RegExp | ((moduleName: string) => boolean))[];
    binaryDirs?: string[];
    importType?: "var" | "amd" | "commonjs" | "this" | "umd" | ((moduleName: string) => string);
    includeAbsolutePaths?: boolean;
    modulesDir?: string;
    modulesFromFile?: boolean | {
        exclude?: string | string[];
        include?: string | string[];
    };
}): (...args: any[]) => any;
export = _exports;
