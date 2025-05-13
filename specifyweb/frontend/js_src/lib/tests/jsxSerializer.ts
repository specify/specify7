/**
 * Make Jest snapshots of serialized JSX not include trailing whitespace on
 * blank lines as that conflicts with some ESLint rules and some Git configs.
 * A fix suggested by https://github.com/facebook/jest/issues/7104
 *
 * Additionally:
 * - Replaces <React.Fragment> with <>
 * - Replaces </React.Fragment> with </>
 *
 */

import type { NewPlugin } from 'pretty-format';
import { isElement } from 'react-is';

const reReplace = /<(?<end>\/)?React.Fragment>/gu;

export const serialize: NewPlugin['serialize'] = (...args): string => {
  const [value, { plugins }] = args;
  const jsxSerializer = plugins.find(
    (v) => v.test !== test && v.test(value)
  ) as NewPlugin | undefined;
  if (jsxSerializer === undefined)
    throw new Error('Unable to find JSX serializer');
  if (jsxSerializer.serialize === undefined)
    throw new Error(
      'Found old style serializer. Expected new style serializer'
    );
  const serialized = jsxSerializer.serialize(...args);
  return serialized
    .split('\n')
    .map((line) => line.trimEnd().replaceAll(reReplace, '<$<end>>'))
    .join('\n');
};

export const test: NewPlugin['test'] = (value: unknown): boolean =>
  value !== null && isElement(value);
