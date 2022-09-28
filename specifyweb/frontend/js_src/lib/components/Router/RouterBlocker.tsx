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
  callback: (location: Location) => Promise<void>
): { readonly block: () => void; readonly unblock: () => void } {
  const { navigator } = React.useContext(
    NavigationContext
  ) as NavigationContextWithBlock;

  const blocker = React.useCallback(
    async (transition: Transition) =>
      callback(transition.location).then(() => transition.retry()),
    [callback]
  );

  const unblock = React.useRef<(() => void) | undefined>(undefined);

  return {
    block: React.useCallback(() => {
      unblock.current?.();
      unblock.current = navigator.block((transition: Transition) => {
        const autoUnblockingTx: Transition = {
          ...transition,
          retry() {
            /*
             * Automatically unblock the transition so it can play all the way
             * through before retrying it.
             */
            unblock.current?.();
            transition.retry();
          },
        };

        blocker(autoUnblockingTx).catch(f.void);
      });
    }, [blocker]),
    unblock: React.useCallback(() => unblock.current?.(), []),
  };
}
