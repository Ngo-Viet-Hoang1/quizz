/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ['./index.js'],
  rules: {
    // NestJS controller/service methods must have expicit return type 
    // (warn instead of error because void/Promise<void> is often omitted and harmless)
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true, // arrow function in array/object ok
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/explicit-module-boundary-types': 'warn',

    // NestJS normally uses empty constructor body when injecting via DI
    '@typescript-eslint/no-empty-function': ['warn', { allow: ['constructors'] }],

    '@typescript-eslint/no-empty-interface': 'warn',
  },
  env: {
    node: true,
  },
};
