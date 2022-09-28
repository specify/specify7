import type { IR, RA } from '../utils/types';

/**
 * Named after https://github.com/RobPethick/jest-theories
 *
 * Provides an easy way to define input/output pairs in a way that is
 * more succinct than the regular describe/test/expect/toEqual form, while
 * being easier to read, and just as type safe.
 */
export function theories<ARGUMENTS_TYPE extends RA<unknown>, RETURN_TYPE>(
  testFunction: (...arguments_: ARGUMENTS_TYPE) => RETURN_TYPE,
  inputOutputSet:
    | IR<
        | readonly [ARGUMENTS_TYPE, RETURN_TYPE]
        | {
            readonly in: ARGUMENTS_TYPE;
            readonly out: RETURN_TYPE;
          }
      >
    | RA<
        | readonly [ARGUMENTS_TYPE, RETURN_TYPE]
        | {
            readonly name?: string;
            readonly in: ARGUMENTS_TYPE;
            readonly out: RETURN_TYPE;
          }
      >
): void {
  const items = Array.isArray(inputOutputSet)
    ? inputOutputSet
    : Object.entries(inputOutputSet).map(([name, inputOutput]) => ({
        name,
        in: Array.isArray(inputOutput) ? inputOutput[0] : inputOutput.in,
        out: Array.isArray(inputOutput) ? inputOutput[1] : inputOutput.out,
      }));

  function runTest(
    entry:
      | readonly [ARGUMENTS_TYPE, RETURN_TYPE]
      | {
          readonly name?: string;
          readonly in: ARGUMENTS_TYPE;
          readonly out: RETURN_TYPE;
        },
    index: number
  ): void {
    const {
      in: input,
      out: output,
      name = undefined,
    } = Array.isArray(entry) ? { in: entry[0], out: entry[1] } : entry;
    test(name ?? createName(input, index), () => {
      const expected = expect(testFunction(...input));
      if (output === undefined) expected.toBeUndefined();
      else if (output === null) expected.toBeNull();
      else if (Number.isNaN(output)) expected.toBeNaN();
      else expected.toEqual(output);
    });
  }

  if (items.length === 0) throw new Error('No items in a theory');
  // If there is just 1 test, don't use describe()
  else if (
    items.length === 1 &&
    (Array.isArray(items[0]) || items[0].name === undefined)
  )
    runTest(
      {
        name: testFunction.name,
        in: Array.isArray(items[0]) ? items[0][0] : items[0].in,
        out: Array.isArray(items[0]) ? items[0][1] : items[0].out,
      },
      0
    );
  else describe(testFunction.name, () => items.forEach(runTest));
}

function createName(input: RA<unknown>, index: number): string {
  if (input.length === 1) {
    if (
      typeof input[0] === 'string' &&
      input[0].trim().length > 0 &&
      input[0].length < 30
    )
      return input[0];
    else if (input[0] === null) return 'null';
    else if (input[0] === undefined) return 'undefined';
    else if (typeof input[0] === 'number' || typeof input[0] === 'boolean')
      return input[0].toString();
  }
  return `#${index + 1}`;
}
