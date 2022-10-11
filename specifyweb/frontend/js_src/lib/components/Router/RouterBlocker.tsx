import type { History, Location, Transition } from 'history';
import React from 'react';
import type { Navigator as BaseNavigator } from 'react-router-dom';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

import { f } from '../../utils/functools';

type Navigator = BaseNavigator & {
  readonly block: History['block'];
};

type NavigationContextWithBlock = React.ContextType<
  typeof NavigationContext
> & {
  readonly navigator: Navigator;
};

/**
 * This hook should only be used in the router. For setting unload protect,
 * use "useUnloadProtect" instead.
 *
 * Adapted from:
 * https://github.com/remix-run/react-router/commit/256cad70d3fd4500b1abcfea66f3ee622fb90874
 */
export function useRouterBlocker(
  callback: (location: Location) => Promise<'ignore' | 'unblock'>
): { readonly block: () => void; readonly unblock: () => void } {
  const { navigator } = React.useContext(
    NavigationContext
  ) as NavigationContextWithBlock;

  const blockerCallback = React.useCallback(
    async (transition: Transition) =>
      callback(transition.location).then((resolution) => {
        transition.retry();
        return resolution;
      }),
    [callback]
  );

  const blocker = React.useRef<(() => void) | undefined>(undefined);

  const block = React.useCallback(() => {
    blocker.current?.();
    blocker.current = navigator.block((transition: Transition) => {
      const autoUnblockingTx: Transition = {
        ...transition,
        retry() {
          /*
           * Automatically unblock the transition so it can play all the way
           * through before retrying it.
           */
          blocker.current?.();
          transition.retry();
        },
      };

      blockerCallback(autoUnblockingTx)
        .then((resolution) => (resolution === 'ignore' ? block() : undefined))
        .catch(f.void);
    });
  }, [blockerCallback]);
  const unblock = React.useCallback(() => blocker.current?.(), []);
  return { block, unblock };
}
