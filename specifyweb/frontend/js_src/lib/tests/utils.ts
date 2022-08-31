import type { Queries, queries } from '@testing-library/dom';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';
import type React from 'react';

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
      name = `#${index}`,
    } = Array.isArray(entry) ? { in: entry[0], out: entry[1] } : entry;
    test(name, () => {
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

export function mount<
  Q extends Queries = typeof queries,
  CONTAINER extends DocumentFragment | Element = HTMLElement,
  BASE_ELEMENT extends DocumentFragment | Element = CONTAINER
>(
  ui: React.ReactElement,
  options: RenderOptions<Q, CONTAINER, BASE_ELEMENT>
): RenderResult<Q, CONTAINER, BASE_ELEMENT> & {
  readonly user: UserEvent;
} {
  const user = userEvent.setup();
  return { ...render(ui, options), user };
}
