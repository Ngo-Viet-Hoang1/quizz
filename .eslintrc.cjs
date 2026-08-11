// @ts-check
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true, // stop ESLint from looking for config files in parent folders

  extends: ['@repo/eslint-config'],

  ignorePatterns: [
    'node_modules',
    'dist',
    '.next',
    'coverage',
    'packages/api-client', // generated code
    '*.config.js', // JS config files at root (commonjs, no tsconfig)
    '*.config.cjs',
  ],
};
