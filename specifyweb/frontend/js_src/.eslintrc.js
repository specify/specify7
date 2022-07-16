require('@rushstack/eslint-patch/modern-module-resolution');


const OFF = 'off';
const WARN = 'warn';
const ERROR = 'error';

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
  extends: ['@maxxxxxdlp/eslint-react-config'],
  rules: {
    '@typescript-eslint/no-empty-interface': OFF,
    '@next/next/google-font-display': OFF,
    '@next/next/google-font-preconnect': OFF,
    '@next/next/link-passhref': OFF,
    '@next/next/no-css-tags': OFF,
    '@next/next/no-document-import-in-page': OFF,
    '@next/next/no-head-import-in-document': OFF,
    '@next/next/no-html-link-for-pages': OFF,
    '@next/next/no-img-element': OFF,
    '@next/next/no-head-element': OFF,
    '@next/next/no-page-custom-font': OFF,
    '@next/next/no-sync-scripts': OFF,
    '@next/next/no-title-in-document-head': OFF,
    '@next/next/no-unwanted-polyfillio': OFF,
    '@next/next/inline-script-id': OFF,
    '@next/next/no-typos': OFF,
    '@next/next/next-script-for-ga': OFF,
  },
};
