require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
  },
  env: {
    browser: true,
    node: true,
  },
  extends: ['@maxxxxxdlp/eslint-config'],
  rules: {
    '@typescript-eslint/no-empty-interface': 'off',
    '@next/next/no-img-element': 'off',
  },
};
