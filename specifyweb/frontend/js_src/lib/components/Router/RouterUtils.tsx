import React from 'react';
import type {
  IndexRouteObject,
  NonIndexRouteObject,
  RouteObject,
} from 'react-router';
import { Outlet } from 'react-router';
import type { LocalizedString } from 'typesafe-i18n';

import type { IR, RA, WritableArray } from '../../utils/types';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { useTitle } from '../Molecules/AppTitle';
import { LoadingScreen } from '../Molecules/Dialog';

/**
 * A wrapper for native React Routes object. Makes everything readonly.
 */
export type EnhancedRoute = Readonly<
  Omit<
    IndexRouteObject | NonIndexRouteObject,
    /*
     * Not using errorElement because of https://github.com/remix-run/react-router/discussions/9881
     */
    'children' | 'element' | 'errorElement'
  >
> & {
  readonly children?: RA<EnhancedRoute>;
  // Allow to define element as a function that returns an async
  readonly element?: React.ReactNode | (() => Promise<React.FunctionComponent>);
  /*
   * Add a title attribute for usage when displaying the route in user
   * preferences
   */
  readonly title?: LocalizedString;
};

let index = 0;

/** Convert EnhancedRoutes to RouteObjects */
export const toReactRoutes = (
  enhancedRoutes: RA<EnhancedRoute>,
  title?: LocalizedString,
  dismissible: boolean = true
): WritableArray<RouteObject> =>
  enhancedRoutes.map<IndexRouteObject | NonIndexRouteObject>((data) => {
    const { element: rawElement, children, ...enhancedRoute } = data;

    const resolvedElement =
      typeof rawElement === 'function' ? (
        <Async
          Element={React.lazy(async () =>
            rawElement().then((element) => ({ default: element }))
          )}
          title={enhancedRoute.title ?? title}
        />
      ) : rawElement === undefined ? (
        enhancedRoute.index ? (
          <></>
        ) : undefined
      ) : (
        rawElement
      );

    index += 1;

    return {
      id: index.toString(),
      ...enhancedRoute,
      index: enhancedRoute.index as unknown as false,
      children: Array.isArray(children)
        ? toReactRoutes(children, title)
        : undefined,
      element:
        resolvedElement === undefined ||
        process.env.NODE_ENV === 'test' ? undefined : (
          <ErrorBoundary dismissible={dismissible}>
            {resolvedElement}
          </ErrorBoundary>
        ),
    };
  });

/**
 * Using this allows Webpack to split code bundles.
 * React Suspense takes care of rendering a loading screen if component is
 * being fetched.
 * Having a separate Suspense for each async component rather than a one main
 * suspense on the top level prevents all components from being un-rendered
 * when any component is being loaded.
 */
export function Async({
  Element,
  title,
}: {
  readonly Element: React.FunctionComponent;
  readonly title: LocalizedString | undefined;
}): JSX.Element {
  useTitle(title);

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
