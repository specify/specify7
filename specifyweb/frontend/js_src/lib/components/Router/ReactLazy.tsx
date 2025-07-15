import React from 'react';

import type { IR } from '../../utils/types';
import { LoadingScreen } from '../Molecules/Dialog';

/**
 * Using this allows Webpack to split code bundles.
 * React Suspense takes care of rendering a loading screen if component is
 * being fetched.
 * Having a separate Suspense for each async component rather than a one main
 * suspense on the top level prevents all components from being un-rendered
 * when any component is being loaded.
 */
export function ReactLazy<PROPS extends IR<unknown>>(
  componentPromise: () => Promise<React.FunctionComponent<PROPS>>
) {
  const Lazy = React.lazy(async () =>
    componentPromise().then((module) => ({ default: module }))
  );
  function Wrapped(props: PROPS & React.PropsWithRef<PROPS>): JSX.Element {
    return (
      <React.Suspense fallback={<LoadingScreen />}>
        <Lazy {...props} />
      </React.Suspense>
    );
  }
  return Wrapped;
}
