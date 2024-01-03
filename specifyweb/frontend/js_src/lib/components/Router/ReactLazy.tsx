import React from 'react';

import type { IR } from '../../utils/types';
import { LoadingScreen } from '../Molecules/Dialog';

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
