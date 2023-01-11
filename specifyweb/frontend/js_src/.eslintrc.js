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
  extends: [
    '@maxxxxxdlp/eslint-config-react',
    // When editing the ESLint config, I found it advantageous to directly link to
    // the local .eslintrc file instead of the npm package:
    // '/Users/maxpatiiuk/site/git/dotfiles/npm/eslint-config-react/.eslintrc.js',
  ],
  rules: {
    '@typescript-eslint/no-empty-interface': OFF,
  },
};
