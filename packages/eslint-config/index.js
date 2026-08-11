/** @type {import("eslint").Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // must be the LAST to override ESLint format rules (eslint-config-prettier)
  ],
  rules: {
    // any is an error - all code in the monorepo must have explicit types
    '@typescript-eslint/no-explicit-any': 'error',

    // Unused variables are errors, except when prefixed with _ (convention for intentionally unused)
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],

    // console.log is typically a debug artifact — warn to remind 
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

    'no-undef': 'off',
  },
  env: {
    node: true,
    es2022: true,
  },
};
