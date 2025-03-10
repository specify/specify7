import { join } from 'node:path/posix';
import { fileURLToPath } from 'node:url';

import { getModeHandler } from '@jscpd/core';
import { detectClones } from 'jscpd';

import { gitIgnoreToGlob } from './gitignoreToGlob';

const repositoryRoot = join(
  // @ts-expect-error REFACTOR: modify tsconfig.json to allow modern features
  fileURLToPath(import.meta.url),
  '../../../../../..'
);
// Make relative file paths be relative to repository root
process.chdir(repositoryRoot);

// Workaround for https://github.com/kucherenko/jscpd/issues/651
const gitIgnore = gitIgnoreToGlob(join(repositoryRoot, '.gitignore'));
const fixRelative = (pattern: string): string =>
  pattern.startsWith('/')
    ? join(repositoryRoot, pattern)
    : pattern.startsWith('!/')
    ? `!${join(repositoryRoot, pattern.slice(1))}`
    : pattern;
const allIgnore = [
  ...gitIgnore,
  '/.git/**',
  '/specifyweb/context/data/**',
  '/specifyweb/specify/migrations/**',
  '/specifyweb/frontend/static/**',
  '/specifyweb/frontend/locale/**',
  '/specifyweb/frontend/js_src/lib/tests/fixtures/**',
  '/specifyweb/frontend/js_src/lib/tests/ajax/static/**',
  '/specifyweb/frontend/js_src/lib/**/__tests__/**',
  '/specifyweb/frontend/js_src/lib/tests/*.js',
  '/specifyweb/**/tests/**',
  '/specifyweb/**/tests.py',
].map(fixRelative);

void detectClones({
  path: [repositoryRoot],
  absolute: false,
  ignoreCase: true,
  minLines: 8,
  minTokens: 80,
  /*
   * These reporters create duplication, but we need both if we want to see
   * both the code snippets and the summary table
   * Filed a feature request: https://github.com/kucherenko/jscpd/issues/652
   */
  reporters: ['console', 'consoleFull'],
  ignore: allIgnore,
  format: [
    'javascript',
    'typescript',
    'python',
    'bash',
    'css',
    'docker',
    'django',
    'html',
    'markdown',
    'yaml',
    'tsx',
  ],
  gitignore: true,
  mode: getModeHandler('weak'),
})
  // eslint-disable-next-line unicorn/no-process-exit
  .then(({ length }) => process.exit(length > 0 ? 1 : 0))
  .catch((error) => {
    console.error(error);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  });
