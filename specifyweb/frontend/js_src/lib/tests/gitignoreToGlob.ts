import { readFileSync } from 'node:fs';

import type { RA } from '../utils/types';

/**
 * Convert .gitignore file to glob patterns.
 *
 * I tried gitignore-to-glob, but it has several issues
 * (i.e https://github.com/EE/gitignore-to-glob/issues/8), and doesn't quite
 * fit our use case.
 */
export const gitIgnoreToGlob = (gitIgnorePath: string): RA<string> =>
  readFileSync(gitIgnorePath, { encoding: 'utf8' })
    .split('\n')
    // Filter out empty lines and comments.
    .filter((pattern) => pattern && !pattern.startsWith('#'))
    // If pattern doesn't start with /, prepend **
    .map((pattern) =>
      pattern.startsWith('/') || pattern.startsWith('!/')
        ? pattern
        : `${pattern.startsWith('!') ? '!' : ''}**/${pattern}`
    )
    .reduce<RA<string>>((result, pattern) => {
      // Convert / into /**
      if (pattern.endsWith('/')) return [...result, `${pattern}**`];
      // Leave "file.js" as it
      // eslint-disable-next-line unicorn/prefer-ternary
      if (
        pattern.includes('*') ||
        pattern.includes('{') ||
        pattern.split('/').at(-1)?.includes('.') === true
      )
        return [...result, pattern];
      // Convert "file" into "file" and "file/**"
      else return [...result, pattern, `${pattern}/**`];
    }, []);
