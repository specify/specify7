import type { Queries, queries } from '@testing-library/dom';
import type { RenderOptions, RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';
import React from 'react';

import type { IR } from '../utils/types';

/**
 * A wrapper for render() with userEvents setup function
 */
export const mount = <
  Q extends Queries = typeof queries,
  CONTAINER extends DocumentFragment | Element = HTMLElement,
  BASE_ELEMENT extends DocumentFragment | Element = CONTAINER
>(
  ui: React.ReactElement,
  options: RenderOptions<Q, CONTAINER, BASE_ELEMENT> = {}
): RenderResult<Q, CONTAINER, BASE_ELEMENT> & {
  readonly user: UserEvent;
} => ({
  ...render(ui, options),
  user: userEvent.setup(),
});

/**
 * An easy way to create a snapshot test from a component
 */
export function snapshot<PROPS extends IR<unknown>>(
  component: (props: PROPS) => React.ReactElement | null,
  props: PROPS,
  testName?: string
): void {
  const { name, displayName = name } = component as unknown as {
    readonly displayName: string;
    readonly name: string;
  };

  test(testName ?? `${displayName} renders without errors`, () => {
    const { asFragment } = render(React.createElement(component, props));
    expect(asFragment()).toMatchSnapshot();
  });
}

/**
 * A component that leaks the context value. Useful in tests
 */
export function LeakContext<T>({
  children,
  context,
  onLoaded: handleLoaded,
}: {
  readonly children?: React.ReactNode;
  readonly context: React.Context<T>;
  readonly onLoaded: (value: T) => void;
}): JSX.Element {
  const value = React.useContext(context);
  React.useEffect(() => {
    handleLoaded(value);
  }, [value, handleLoaded]);
  return <>{children}</>;
}
