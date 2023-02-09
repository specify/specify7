const eslintConfig = require('@maxxxxxdlp/eslint-config');
const eslintConfigReact = require('@maxxxxxdlp/eslint-config-react');
const globals = require('globals');

module.exports = [
  ...eslintConfig,
  ...eslintConfigReact,
  {
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-empty-interface': 'off',
    },
  },
];
