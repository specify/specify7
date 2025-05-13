import type { Location, SafeLocation } from 'history';
import React from 'react';
import type { Navigator as BaseNavigator } from 'react-router-dom';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

import { f } from '../../utils/functools';
import type { SafeLocationState } from './RouterState';

type NavigationContextWithBlock = React.ContextType<
  typeof NavigationContext
> & {
  readonly navigator: Navigator;
};

type Navigator = BaseNavigator & {
  readonly block: (callback: (transition: Transition) => void) => () => void;
};

type Transition = {
  readonly location: Location<SafeLocationState>;
  readonly retry: () => void;
};

/**
 * This hook should only be used in the router. For setting unload protect,
 * use "useUnloadProtect" instead.
 *
 * Adapted from:
 * https://github.com/remix-run/react-router/commit/256cad70d3fd4500b1abcfea66f3ee622fb90874
 */
export function useRouterBlocker(
  callback: (location: SafeLocation) => Promise<'ignore' | 'unblock'>
): { readonly block: () => void; readonly unblock: () => void } {
  const { navigator } = React.useContext(
    NavigationContext
  ) as NavigationContextWithBlock;

  const blockerCallback = React.useCallback(
    async ({ location, retry }: Transition) =>
      callback(location).then((resolution) => {
        retry();
        return resolution;
      }),
    [callback]
  );

  const unblockRef = React.useRef<(() => void) | undefined>(undefined);

  const block = React.useCallback(() => {
    unblockRef.current?.();
    unblockRef.current = navigator.block((transition) => {
      const autoUnblockingTx: Transition = {
        ...transition,
        retry() {
          /*
           * Automatically unblock the transition so it can play all the way
           * through before retrying it.
           */
          unblockRef.current?.();
          transition.retry();
        },
      };

      blockerCallback(autoUnblockingTx)
        .then((resolution) => (resolution === 'ignore' ? block() : undefined))
        .catch(f.void);
    });
  }, [blockerCallback]);
  const unblock = React.useCallback(() => unblockRef.current?.(), []);
  return { block, unblock };
}
