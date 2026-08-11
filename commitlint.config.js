// @ts-check
/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    // Valid types: feat, fix, chore, docs, refactor, test, ci, perf
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'chore', 'docs', 'refactor', 'test', 'ci', 'perf', 'revert'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [0], // off — allow any case for subject
    'body-max-line-length': [0], // off — no limit on body length
  },
};
