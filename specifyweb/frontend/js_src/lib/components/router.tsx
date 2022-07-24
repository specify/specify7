import React from 'react';
import type { Location } from 'react-router-dom';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';

import { toRelativeUrl } from '../ajax';
import { listen } from '../events';
import { f } from '../functools';
import { commonText } from '../localization/common';
import { getUserPref } from '../preferencesutils';
import { Button, className } from './basic';
import { UnloadProtectsContext } from './contexts';
import { ErrorBoundary } from './errorboundary';
import { Dialog } from './modaldialog';
import { NotFoundView } from './notfoundview';
import { overlayRoutes } from './overlayroutes';
import { useRouterBlocker } from './routerblocker';
import { toReactRoutes } from './routerutils';
import { routes } from './routes';

export function Router(): JSX.Element {
  const location = useLocation();
  const state = location.state as { readonly backgroundLocation?: Location };

  const [unloadProtects] = React.useContext(UnloadProtectsContext)!;
  const [unloadProtect, setUnloadProtect] = React.useState<
    { readonly resolve: () => void; readonly reject: () => void } | undefined
  >(undefined);
  useRouterBlocker(
    async ({ pathname }) =>
      new Promise((resolve, reject) =>
        pathIsOverlay(pathname) || isCurrentUrl(pathname)
          ? resolve()
          : setUnloadProtect({ resolve, reject })
      ),
    unloadProtects.length > 0
  );

  const navigate = useNavigate();
  React.useEffect(() => {
    // Leak goTo function in development for quicker development
    if (process.env.NODE_ENV === 'development')
      // @ts-expect-error Creating a global value
      globalThis._goTo = navigate;
  }, [navigate]);

  useLinkIntercept();

  const transformedRoutes = React.useMemo(() => toReactRoutes(routes), []);
  const main =
    useRoutes(transformedRoutes, state?.backgroundLocation ?? location) ??
    undefined;

  const transformedOverlays = React.useMemo(
    () => toReactRoutes(overlayRoutes),
    []
  );
  const overlay = useRoutes(transformedOverlays) ?? undefined;

  return main === undefined && overlay === undefined ? (
    <NotFoundView />
  ) : (
    <>
      {main}
      <Overlay
        backgroundUrl={state?.backgroundLocation?.pathname}
        overlay={overlay}
      />
      {typeof unloadProtect === 'object' && unloadProtects.length > 0 ? (
        <UnloadProtectDialog
          message={unloadProtects.at(-1)!}
          onCancel={(): void => {
            unloadProtect.reject();
            setUnloadProtect(undefined);
          }}
          onConfirm={(): void => {
            unloadProtect.resolve();
            setUnloadProtect(undefined);
          }}
        />
      ) : undefined}
    </>
  );
}

const pathIsOverlay = (relativeUrl: string): boolean =>
  relativeUrl.startsWith('/specify/overlay/');

// Don't trigger unload protect if query string or hash changes
const isCurrentUrl = (relativeUrl: string): boolean =>
  new URL(relativeUrl, globalThis.location.origin).pathname ===
  globalThis.location.pathname;

function useLinkIntercept(): void {
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(
    () =>
      listen(document.body, 'click', (event) => {
        const parsed = parseEvent(event);
        if (parsed === undefined) return;
        const { url, isOverlay } = parsed;
        navigate(
          url,
          isOverlay ? { state: { backgroundLocation: location } } : undefined
        );
      }),
    [navigate, location]
  );
}

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
        isOverlay: pathIsOverlay(relativeUrl),
      };
    }
  }
  return undefined;
}

function Overlay({
  overlay,
  backgroundUrl,
}: {
  readonly overlay: JSX.Element | undefined;
  readonly backgroundUrl: string | undefined;
}): JSX.Element {
  const navigate = useNavigate();

  const handleCloseOverlay = React.useCallback(
    () => navigate(backgroundUrl ?? '/specify/'),
    [backgroundUrl]
  );

  return (
    <OverlayContext.Provider value={handleCloseOverlay}>
      <ErrorBoundary dismissable>{overlay}</ErrorBoundary>
    </OverlayContext.Provider>
  );
}

export const OverlayContext = React.createContext<() => void>(f.never);
OverlayContext.displayName = 'OverlayContext';

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
 */
