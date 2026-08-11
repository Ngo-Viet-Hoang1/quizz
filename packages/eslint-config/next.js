/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    './index.js',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  env: {
    browser: true,
    node: true, // Next.js has server-side code
    es2022: true,
  },
};
