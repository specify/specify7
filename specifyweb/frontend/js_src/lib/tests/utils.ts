import type { Queries, queries } from '@testing-library/dom';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';
import type React from 'react';

import type { RA } from '../utils/types';

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
