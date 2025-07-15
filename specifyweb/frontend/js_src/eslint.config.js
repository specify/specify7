import eslintConfig from '@maxxxxxdlp/eslint-config';
import eslintConfigReact from '@maxxxxxdlp/eslint-config-react';
import globals from 'globals';

const testFiles = eslintConfig.find(
  (rules) =>
    typeof rules === 'object' &&
    Array.isArray(rules.files) &&
    rules.files.join('_').includes('test')
)?.files;
if (testFiles === undefined)
  throw new Error('Unable to find test files selector');

const abbreviationsConfig = eslintConfig
  .map((rules) =>
    typeof rules === 'object' && typeof rules.rules === 'object'
      ? Object.entries(rules.rules).find(
          ([name, options]) =>
            name === 'unicorn/prevent-abbreviations' && Array.isArray(options)
        )?.[1]?.[1]
      : undefined
  )
  .find((options) => typeof options === 'object');
if (abbreviationsConfig === undefined)
  throw new Error('Unable to find unicorn/prevent-abbreviations config');

export default [
  ...eslintConfig,
  ...eslintConfigReact,
  {
    languageOptions: {
      sourceType: 'module',
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
      'unicorn/prevent-abbreviations': [
        'error',
        {
          ...abbreviationsConfig,
          allowList: {
            ...abbreviationsConfig.allowList,
            spAppResourceDir: true,
            SpAppResourceDir: true,
            ScopedAppResourceDir: true,
          },
        },
      ],
    },
  },
  {
    files: [...testFiles],
    rules: {
      /*
       * Tests commonly need to use unusual variable names or mock back-end
       * responses, which may include variables in a different naming convention
       */
      '@typescript-eslint/naming-convention': 'warn',
    },
  },
];
