import { expect, test } from '@jest/globals';
import type {
  Queries,
  queries,
  RenderOptions,
  RenderResult,
} from '@testing-library/react';
import { act, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event/dist/types/setup/setup';
import React from 'react';

import type { IR, RA } from '../utils/types';

const createActUser = (user: UserEvent): UserEvent =>
  new Proxy(user, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;

      return async (...args: RA<unknown>) =>
        act(async () => value.apply(target, args));
    },
  }) as UserEvent;

/**
 * A wrapper for render() with userEvents setup function
 */
export const mount = <
  Q extends Queries = typeof queries,
  CONTAINER extends DocumentFragment | Element = HTMLElement,
  BASE_ELEMENT extends DocumentFragment | Element = CONTAINER,
>(
  ui: React.ReactElement,
  options: RenderOptions<Q, CONTAINER, BASE_ELEMENT> = {}
): RenderResult<Q, CONTAINER, BASE_ELEMENT> & {
  readonly user: UserEvent;
} => ({
  ...render(ui, options),
  user: createActUser(userEvent.setup()),
});

/**
 * An easy way to create a snapshot test from a component
 */
export function snapshot<PROPS extends IR<unknown>>(
  component: (props: PROPS) => React.ReactElement | null,
  props: PROPS | (() => PROPS),
  testName?: string
): void {
  const { name, displayName = name } = component as unknown as {
    readonly displayName: string;
    readonly name: string;
  };

  test(testName ?? `${displayName} renders without errors`, () => {
    const resolvedProps = typeof props === 'function' ? props() : props;
    const { asFragment } = render(
      React.createElement(component, resolvedProps)
    );
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
