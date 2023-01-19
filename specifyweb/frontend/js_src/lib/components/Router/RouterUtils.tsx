import React from 'react';
import type { RouteObject } from 'react-router';
import { Outlet, useOutletContext } from 'react-router';
import type {
  IndexRouteObject,
  NonIndexRouteObject,
} from 'react-router/dist/lib/context';
import type { LocalizedString } from 'typesafe-i18n';

import type { IR, RA, WritableArray } from '../../utils/types';
import { useTitle } from '../Molecules/AppTitle';
import { LoadingScreen } from '../Molecules/Dialog';
import { SetSingleResourceContext } from './Router';
import { useLocation, useParams } from 'react-router-dom';
import { useStableLocation } from './RouterState';

/**
 * A wrapper for native React Routes object. Makes everything readonly.
 */
export type EnhancedRoute = Readonly<
  Omit<IndexRouteObject | NonIndexRouteObject, 'children' | 'element'>
> & {
  readonly children?: RA<EnhancedRoute>;
  // Allow to define element as a function that returns an async
  readonly element?: React.ReactNode | (() => Promise<React.FunctionComponent>);
  /*
   * Add a title attribute for usage when displaying the route in user
   * preferences
   */
  readonly title?: LocalizedString;
  /*
   * If true, links within this route won't trigger unload protect. Useful
   * when a single resource has separate URLs for tabs/subtabs (e.g, in
   * DataObjectFormatter editor)
   *
   * This can only be used if path ends with '*' and only for the main router
   * (not entry point router or nested routers)
   */
  readonly isSingleResource?: boolean;
};

/** Convert EnhancedRoutes to RouteObjects */
export const toReactRoutes = (
  enhancedRoutes: RA<EnhancedRoute>,
  title?: LocalizedString
): WritableArray<RouteObject> =>
  enhancedRoutes.map<IndexRouteObject | NonIndexRouteObject>((data) => {
    const {
      element: fetchElement,
      children,
      isSingleResource = false,
      ...enhancedRoute
    } = data;
    if (
      process.env.NODE_ENV !== 'production' &&
      isSingleResource &&
      (typeof enhancedRoute.path !== 'string' ||
        !enhancedRoute.path.endsWith('*'))
    )
      throw new Error(
        '"isSingleResource" only has effect for path\'s that end with "*"'
      );

    const element =
      typeof fetchElement === 'function' ? (
        <Async
          Element={React.lazy(async () =>
            fetchElement().then((element) => ({ default: element }))
          )}
          title={enhancedRoute.title ?? title}
        />
      ) : (
        fetchElement
      );

    return {
      ...enhancedRoute,
      index: enhancedRoute.index as unknown as false,
      children: Array.isArray(children)
        ? toReactRoutes(children, title)
        : undefined,
      element: isSingleResource ? (
        <SingleResource>{element}</SingleResource>
      ) : (
        element
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
  // eslint-disable-next-line @typescript-eslint/naming-convention
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

/**
 * Like <Outlet> but forwards all props from parent outlet
 */
export function ForwardOutlet(): JSX.Element {
  const context = useOutletContext();
  return <Outlet context={context} />;
}

function SingleResource({
  children,
}: {
  readonly children: React.ReactNode;
}): JSX.Element {
  const handleSet = React.useContext(SetSingleResourceContext);
  const parameters = useParams();
  const location = useStableLocation(useLocation());

  const index =
    parameters['*'] === undefined
      ? -1
      : location.pathname.indexOf(parameters['*']);
  const path = index === -1 ? undefined : location.pathname.slice(0, index);
  if (process.env.NODE_ENV !== 'production' && path === undefined)
    throw new Error(
      'Unable to extract the base path for the single resource URL'
    );

  React.useEffect(() => {
    handleSet(path);
    return () => handleSet(undefined);
  }, [handleSet, path]);
  return <>{children}</>;
}
