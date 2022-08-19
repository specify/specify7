import type { RA } from '../types';
/*import { leafletStub } from './leafletstub';
 *
 *
 * FIXME: error on console.error and console.warn
 */

/**
 * Named after https://github.com/RobPethick/jest-theories
 */
export const theories = <ARGUMENTS_TYPE extends RA<unknown>, RETURN_TYPE>(
  testFunction: (...arguments_: ARGUMENTS_TYPE) => RETURN_TYPE,
  inputOutputSet: RA<readonly [ARGUMENTS_TYPE, RETURN_TYPE]>
): void =>
  describe(testFunction.name, () =>
    inputOutputSet.forEach(([input, output], index) =>
      test(`#${index}`, () => expect(testFunction(...input)).toEqual(output))
    )
  );

// FIXME: migrate all of these
//   leafletStub();
