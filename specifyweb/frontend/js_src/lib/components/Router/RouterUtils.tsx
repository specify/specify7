import React from 'react';
import { Outlet } from 'react-router';
import type { RouteObject } from 'react-router/lib/router';

import type { IR, RA, WritableArray } from '../../utils/types';
import { LoadingScreen } from '../Molecules/Dialog';
import { useTitle } from '../Molecules/AppTitle';

/**
 * A wrapper for native React Routes object. Makes everything readonly.
 */
export type EnhancedRoute = Readonly<
  Omit<RouteObject, 'children' | 'element'>
> & {
  readonly children?: RA<EnhancedRoute>;
  // Allow to define element as a function that returns an async
  readonly element?: React.ReactNode | (() => Promise<React.FunctionComponent>);
  /*
   * Add a title attribute for usage when displaying the route in user
   * preferences
   */
  readonly title?: string;
  /*
   * Add an explicit way of opting out from displaying the path in user
   * preferences (this is the case implicitly if title is missing)
   */
  readonly navigatable?: boolean;
};

/** Convert EnhancedRoutes to RouteObjects */
export const toReactRoutes = (
  enhancedRoutes: RA<EnhancedRoute>,
  title?: string
): WritableArray<RouteObject> =>
  enhancedRoutes.map(({ element, children, ...enhancedRoute }) => ({
    ...enhancedRoute,
    children: Array.isArray(children)
      ? toReactRoutes(children, title)
      : undefined,
    element:
      typeof element === 'function' ? (
        <Async element={element} title={enhancedRoute.title ?? title} />
      ) : (
        element
      ),
  }));

/**
 * Using this allows Webpack to split code bundles.
 * React Suspense takes care of rendering a loading screen if component is
 * being fetched.
 * Having a separate Suspense for each async component rather than a one main
 * suspense on the top level prevents all components from being un-rendered
 * when any component is being loaded.
 */
export function Async({
  element,
  title,
}: {
  readonly element: () => Promise<React.FunctionComponent>;
  readonly title: string | undefined;
}): JSX.Element {
  useTitle(title);

  const Element = React.lazy(async () =>
    element().then((element) => ({ default: element }))
  );

  return (
    <React.Suspense fallback={<LoadingScreen />}>
      <Element />
    </React.Suspense>
  );
}

/** Type-safe react-router outlet */
export function SafeOutlet<T extends IR<unknown>>(props: T): JSX.Element {
  return <Outlet context={props} />;
}
