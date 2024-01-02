import React from 'react';

import { RR } from '../../utils/types';
import { LoadingScreen } from '../Molecules/Dialog';

function FakeAsync<PROPS extends RR<never, never>>({
  Element,
  props,
}: {
  readonly Element: React.FunctionComponent<PROPS>;
  readonly props: PROPS;
}) {
  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Element {...props} />
    </React.Suspense>
  );
}

export function LazyAsync<PROPS extends RR<never, never>>(
  componentPromise: () => Promise<React.FunctionComponent<PROPS>>
) {
  const lazy = React.lazy(() =>
    componentPromise().then((module) => ({ default: module }))
  );
  function Wrapped(props: React.PropsWithRef<PROPS>): JSX.Element {
    return (
      <FakeAsync<React.PropsWithRef<PROPS>> Element={lazy} props={props} />
    );
  }
  return Wrapped;
}
