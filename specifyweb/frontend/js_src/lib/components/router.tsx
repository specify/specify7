import React from 'react';
import type { NavigateFunction } from 'react-router/lib/hooks';
import type { Location } from 'react-router-dom';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

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

let unsafeNavigate: NavigateFunction | undefined;
let unsafeLocation: Location | undefined;

// Using this is not recommended. Render <NotFoundView /> instead.
export function unsafeTriggerNotFound(): boolean {
  unsafeNavigate?.(unsafeLocation ?? '/specify/', {
    replace: true,
    state: createState({ type: 'NotFoundPage' }),
  });
  return typeof unsafeNavigate === 'undefined';
}

/*
 * Symbol() would be better suites for this, but it can't be used because
 * state must be serializable
 */
type States =
  | State<
      'BackgroundLocation',
      {
        readonly location: Location;
      }
    >
  | State<'NotFoundPage'>
  | undefined;
// Wrap state object in this for type safety
const createState = (state: States): States => state;

const transformedRoutes = toReactRoutes(routes);
const transformedOverlays = toReactRoutes(overlayRoutes);

export function Router(): JSX.Element {
  const location = useLocation();
  unsafeLocation = location;
  const state = location.state as States;
  const background =
    state?.type === 'BackgroundLocation' ? state.location : undefined;
  const isNotFoundPage = state?.type === 'NotFoundPage';

  const navigate = useNavigate();
  unsafeNavigate = navigate;
  React.useEffect(() => {
    // Leak navigate function in development for quicker development
    if (process.env.NODE_ENV === 'development')
      // @ts-expect-error Creating a global value
      globalThis._goTo = navigate;
  }, [navigate]);

  useLinkIntercept();

  const main =
    useRoutes(transformedRoutes, background ?? location) ?? undefined;

  const overlay = useRoutes(transformedOverlays) ?? undefined;

  return isNotFoundPage || (main === undefined && overlay === undefined) ? (
    <NotFoundView />
  ) : (
    <>
      {main}
      <Overlay backgroundUrl={background?.pathname} overlay={overlay} />
      <UnloadProtect backgroundPath={background?.pathname} />
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
        const parsed = parseClickEvent(event);
        if (parsed === undefined) return;
        const { url, isOverlay } = parsed;
        navigate(
          url,
          isOverlay
            ? {
                state: createState({
                  type: 'BackgroundLocation',
                  location,
                }),
              }
            : undefined
        );
      }),
    [navigate, location]
  );
}

/* Partially inspired by react-router's useLinkClickHandler() */
function parseClickEvent(
  event: Readonly<MouseEvent>
): { readonly url: string; readonly isOverlay: boolean } | undefined {
  const link = (event.target as HTMLElement)?.closest('a');
  if (
    // Check if link already has an onClick that called event.preventDefault()
    !event.defaultPrevented &&
    link !== null &&
    link.href.length > 0 &&
    link.getAttribute('href')?.startsWith('#') === false &&
    link.getAttribute('download') === null &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.ctrlKey &&
    (link.target === '' ||
      link.target === '_self' ||
      (event.altKey &&
        getUserPref('general', 'behavior', 'altClickToSupressNewTab'))) &&
    // Can add this class name to links to prevent react-router from handling them
    !link.classList.contains(className.navigationHandled)
  ) {
    // Don't handle absolute URLs that lead to a different origin
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

function UnloadProtect({
  backgroundPath,
}: {
  readonly backgroundPath?: string | undefined;
}): JSX.Element | null {
  const [unloadProtects] = React.useContext(UnloadProtectsContext)!;
  const [unloadProtect, setUnloadProtect] = React.useState<
    { readonly resolve: () => void; readonly reject: () => void } | undefined
  >(undefined);
  useRouterBlocker(
    React.useCallback(
      async ({ pathname }) =>
        new Promise((resolve, reject) =>
          pathIsOverlay(pathname) ||
          isCurrentUrl(pathname) ||
          pathname === backgroundPath
            ? resolve()
            : setUnloadProtect({ resolve, reject })
        ),
      [backgroundPath]
    ),
    unloadProtects.length > 0
  );
  return typeof unloadProtect === 'object' && unloadProtects.length > 0 ? (
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
  ) : null;
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
