// @ts-check
/** @type {import('lint-staged').Config} */
module.exports = {
  // TypeScript/TSX: lint (auto-fix) then format
  '**/*.{ts,tsx}': ['eslint --fix', 'prettier --write'],

  '**/*.{js,cjs,mjs,json,yml,yaml,md}': ['prettier --write'],
};
