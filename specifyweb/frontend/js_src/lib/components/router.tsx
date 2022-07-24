import React from 'react';
import type { Location } from 'react-router-dom';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';

import { listen } from '../events';
import { f } from '../functools';
import { commonText } from '../localization/common';
import { getUserPref } from '../preferencesutils';
import { Button, className } from './basic';
import { ErrorBoundary } from './errorboundary';
import { Dialog } from './modaldialog';
import { NotFoundView } from './notfoundview';
import { overlayRoutes } from './overlayroutes';
import { toReactRoutes } from './routerutils';
import { routes } from './routes';
import { UnloadProtectsContext } from './contexts';
import { toRelativeUrl } from '../ajax';

export function Router(): JSX.Element {
  const location = useLocation();
  const state = location.state as { readonly backgroundLocation?: Location };

  const [unloadProtects, setUnloadProtects] = React.useContext(
    UnloadProtectsContext
  )!;
  const [unloadProtectUrl, setUnloadProtectUrl] = React.useState<
    string | undefined
  >(undefined);

  const navigate = useNavigate();
  React.useEffect(() => {
    console.log([unloadProtects, setUnloadProtects]);
    // Leak goTo function in development for quicker development
    if (process.env.NODE_ENV === 'development')
      // @ts-expect-error Creating a global value
      globalThis._goTo = navigate;
  }, [navigate]);

  React.useEffect(
    () =>
      listen(document.body, 'click', (event) => {
        const parsed = parseEvent(event);
        if (parsed === undefined) return;
        const { url, isOverlay } = parsed;
        if (isOverlay)
          navigate(url, { state: { backgroundLocation: location } });
        else {
          // FIXME: handle cases where URL change should not trigger unload protect
          if (unloadProtects.length > 0) setUnloadProtectUrl(url);
          else navigate(url);
        }
      }),
    [navigate, location, unloadProtects]
  );

  useUnloadProtect(unloadProtects.at(-1));

  const transformedRoutes = React.useMemo(() => toReactRoutes(routes), []);
  const main = useRoutes(
    transformedRoutes,
    state?.backgroundLocation ?? location
  );

  const transformedOverlays = React.useMemo(
    () => toReactRoutes(overlayRoutes),
    []
  );
  const overlay = useRoutes(transformedOverlays);

  const backgroundUrl = state?.backgroundLocation?.pathname;
  const handleCloseOverlay = React.useCallback(
    () =>
      typeof backgroundUrl === 'string' ? navigate(backgroundUrl) : undefined,
    [backgroundUrl]
  );

  return main === null && overlay === null ? (
    <NotFoundView />
  ) : (
    <>
      {main}
      <OverlayContext.Provider value={handleCloseOverlay}>
        <ErrorBoundary dismissable>{overlay}</ErrorBoundary>
      </OverlayContext.Provider>
      {typeof unloadProtectUrl === 'string' && unloadProtects.length > 0 ? (
        <UnloadProtectDialog
          message={unloadProtects.at(-1)!}
          onCancel={(): void => setUnloadProtectUrl(undefined)}
          onConfirm={(): void => navigate(unloadProtectUrl)}
        />
      ) : undefined}
    </>
  );
}

export const OverlayContext = React.createContext<() => void>(f.never);
OverlayContext.displayName = 'OverlayContext';

function parseEvent(
  event: Readonly<MouseEvent>
): { readonly url: string; readonly isOverlay: boolean } | undefined {
  const link = (event.target as HTMLElement)?.closest('a');
  if (
    link !== null &&
    link.href.length > 0 &&
    link.getAttribute('href')?.startsWith('#') === false &&
    link.getAttribute('download') === null &&
    (link.target !== '_blank' ||
      (event.altKey &&
        getUserPref('general', 'behavior', 'altClickToSupressNewTab'))) &&
    !link.classList.contains(className.navigationHandled)
  ) {
    const relativeUrl = toRelativeUrl(link.href);
    if (typeof relativeUrl === 'string') {
      event.preventDefault();
      return {
        url: relativeUrl,
        isOverlay: relativeUrl.startsWith('/specify/overlay/'),
      };
    }
  }
  return undefined;
}

function useUnloadProtect(message: string | undefined): void {
  React.useEffect(() => {
    if (message === undefined) return undefined;
    const handleUnload = (): string => message;
    globalThis.addEventListener('beforeunload', handleUnload);
    return (): void =>
      globalThis.removeEventListener('beforeunload', handleUnload);
  }, [message]);
}

function UnloadProtectDialog({
  message,
  onCancel: handleCancel,
  onConfirm: handleConfirm,
}: {
  readonly message: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Button.Red onClick={handleConfirm}>{commonText('leave')}</Button.Red>
        </>
      }
      forceToTop
      header={commonText('leavePageDialogHeader')}
      onClose={handleCancel}
    >
      {message}
    </Dialog>
  );
}

/**
 * Let params = useParams();
 *   return <h2>Invoice: {params.invoiceId}</h2>;
 *
 * <NavLink
 *             style={({ isActive }) => {
 *               return {
 *                 display: "block",
 *                 margin: "1rem 0",
 *                 color: isActive ? "red" : "",
 *               };
 *             }}
 *             className={({ isActive }) => isActive ? "red" : "blue"}
 *             to={`/invoices/${invoice.number}`}
 *
 *
 * const [searchParams, setSearchParams] = useSearchParams();
 * searchParams.get("filter") || ""
 * params.getAll("brand").includes(brand);
 * setSearchParams({ filter });
 * setSearchParams({  });
 *
 *
 * // Maintains query string on navigation
 * function QueryNavLink({ to, ...props }) {
 *   let location = useLocation();
 *   return <NavLink to={to + location.search} {...props} />;
 * }
 *
 *
 * useLocation() :
 * {
 *   pathname: "/invoices",
 *   search: "?filter=sa",
 *   hash: "",
 *   state: null,
 *   key: "ae4cz2j"
 * }
 *
 * let navigate = useNavigate();
 * let location = useLocation();
 * navigate("/invoices" + location.search);
 *
 *
 * https://reactrouter.com/docs/en/v6/getting-started/overview#descendant-routes
 *
 * <Router basename>
 *
 *
 * function BrandLink({ brand, children, ...props }: BrandLinkProps) {
 *   let [searchParams] = useSearchParams();
 *   let isActive = searchParams.get('brand') === brand;
 *
 *   return (
 *     <Link
 *       to={`/?brand=${brand}`}
 *       {...props}
 *       style={{
 *         ...props.style,
 *         color: isActive ? "red" : "black",
 *       }}
 *     >
 *       {children}
 *     </Link>
 *   );
 * }
 *
 *
 * function CustomLink({ children, to, ...props }: LinkProps) {
 *   let resolved = useResolvedPath(to);
 *   let match = useMatch({ path: resolved.pathname, end: true });
 *
 *   return (
 *     <div>
 *       <Link
 *         style={{ textDecoration: match ? "underline" : "none" }}
 *         to={to}
 *         {...props}
 *       >
 *         {children}
 *       </Link>
 *       {match && " (active)"}
 *     </div>
 *   );
 * }
 *
 *
 * https://github.com/Sage/jsurl
 *
 *
 * Can nest useRoutes(), but parent path must end with *
 */
