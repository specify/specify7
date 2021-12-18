'use strict';

module.exports = {
  extends: '@maxxxxxdlp/stylelint-config',
  rules: {},
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      customSyntax: '@stylelint/postcss-css-in-js',
    }
  ],
  ignoreFiles: [
    '**/*.md',
  ]
};
