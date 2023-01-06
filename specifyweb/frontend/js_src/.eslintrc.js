require('@rushstack/eslint-patch/modern-module-resolution');

const OFF = 'off';
const WARN = 'warn';
const ERROR = 'error';

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    browser: true,
    node: true,
  },
  extends: ['@maxxxxxdlp/eslint-config-react'],
  rules: {
    '@typescript-eslint/no-empty-interface': OFF,
  },
};
