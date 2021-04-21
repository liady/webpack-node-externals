module.exports = {
    env: {
        commonjs: true,
        es2020: true,
        node: true,
        mocha: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 12,
    },
    rules: {
        'no-prototype-builtins': 0,
    },
};
