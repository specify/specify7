'use strict';

module.exports = {
  extends: '@maxxxxxdlp/stylelint-config',
  rules: {
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'extends',
          'apply',
          'tailwind',
          'components',
          'utilities',
          'screen',
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      customSyntax: '@stylelint/postcss-css-in-js',
    },
  ],
  ignoreFiles: ['**/*.md'],
};
