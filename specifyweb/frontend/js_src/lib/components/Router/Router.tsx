import React from 'react';
import type { NavigateFunction } from 'react-router/lib/hooks';
import type { Location } from 'react-router-dom';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';
import type { State } from 'typesafe-reducer';

import { commonText } from '../../localization/common';
import { toRelativeUrl } from '../../utils/ajax/helpers';
import { listen } from '../../utils/events';
import { setDevelopmentGlobal } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { unloadProtectEvents, UnloadProtectsContext } from '../Core/Contexts';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog } from '../Molecules/Dialog';
import { getUserPref } from '../UserPreferences/helpers';
import { NotFoundView } from './NotFoundView';
import { overlayRoutes } from './OverlayRoutes';
import { useRouterBlocker } from './RouterBlocker';
import { toReactRoutes } from './RouterUtils';
import { routes } from './Routes';

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

export type BackgroundLocation = State<
  'BackgroundLocation',
  {
    readonly location: Location;
  }
>;

/*
 * Symbol() would be better suites for this, but it can't be used because
 * state must be serializable
 */
type States =
  | BackgroundLocation
  | State<
      'NoopRoute',
      {
        readonly originalLocation: Location;
      }
    >
  | State<'NotFoundPage'>
  | undefined;
// Wrap state object in this for type safety
const createState = (state: States): States => state;

const transformedRoutes = toReactRoutes(routes);
const transformedOverlays = toReactRoutes(overlayRoutes);

/**
 * Wrapper for React-Router with support for overlays and unload protect.
 *
 * Support for overlays was modeled based on this example:
 * https://reactrouter.com/docs/en/v6/examples/modal
 */
export function Router(): JSX.Element {
  const location = useLocation();
  unsafeLocation = location;
  const state = location.state as States;
  const background =
    state?.type === 'BackgroundLocation' ? state.location : undefined;
  const backgroundUrl =
    typeof background === 'object'
      ? `${background.pathname}${background.search}${background.hash}`
      : undefined;
  const originalLocation =
    state?.type === 'NoopRoute' ? state.originalLocation : undefined;
  const isNotFoundPage = state?.type === 'NotFoundPage';

  /*
   * REFACTOR: replace usages of navigate with <a> where possible
   * REFACTOR: replace <Button> with <Link> where possible
   */
  const navigate = useNavigate();
  unsafeNavigate = navigate;
  React.useEffect(() => setDevelopmentGlobal('_goTo', navigate), [navigate]);

  useLinkIntercept(background);

  const main =
    useRoutes(transformedRoutes, originalLocation ?? background ?? location) ??
    undefined;

  const overlay =
    useRoutes(transformedOverlays, originalLocation ?? location) ?? undefined;

  const isNotFound = main === undefined && overlay === undefined;
  // If supposed to show an overlay, but it wasn't found, show <NotFoundView />
  const isNotFoundOverlay =
    typeof background === 'object' && overlay === undefined;

  return isNotFoundPage || isNotFound || isNotFoundOverlay ? (
    <NotFoundView />
  ) : (
    <>
      {main}
      <Overlay backgroundUrl={backgroundUrl} overlay={overlay} />
      <UnloadProtect backgroundPath={backgroundUrl} />
    </>
  );
}

const pathIsOverlay = (relativeUrl: string): boolean =>
  relativeUrl.startsWith('/specify/overlay/');

// Don't trigger unload protect if only query string or hash changes
const isCurrentUrl = (relativeUrl: string): boolean =>
  new URL(relativeUrl, globalThis.location.origin).pathname ===
  globalThis.location.pathname;

function useLinkIntercept(background: Location | undefined): void {
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedLocation = React.useRef<Location>(background ?? location);
  React.useEffect(() => {
    // REFACTOR: consider adding a set() util like in @vueuse/core
    resolvedLocation.current = background ?? location;
  }, [background, location]);

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
                  location: resolvedLocation.current,
                }),
              }
            : undefined
        );
      }),
    [navigate]
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
  backgroundUrl = '/specify/',
}: {
  readonly overlay: JSX.Element | undefined;
  readonly backgroundUrl: string | undefined;
}): JSX.Element {
  const navigate = useNavigate();

  const handleCloseOverlay = React.useCallback(
    () => navigate(backgroundUrl),
    [backgroundUrl]
  );

  return (
    <OverlayContext.Provider value={handleCloseOverlay}>
      <ErrorBoundary dismissable>{overlay}</ErrorBoundary>
    </OverlayContext.Provider>
  );
}

function defaultOverlayContext() {
  throw new Error('Tried to close Overlay outside of an overlay');
}
export const isOverlay = (overlayContext: () => void): boolean =>
  overlayContext !== defaultOverlayContext;
export const OverlayContext = React.createContext<() => void>(
  defaultOverlayContext
);
OverlayContext.displayName = 'OverlayContext';

function UnloadProtect({
  backgroundPath,
}: {
  readonly backgroundPath: string | undefined;
}): JSX.Element | null {
  const [unloadProtects] = React.useContext(UnloadProtectsContext)!;
  const [unloadProtect, setUnloadProtect] = React.useState<
    { readonly resolve: () => void; readonly reject: () => void } | undefined
  >(undefined);

  const backgroundPathRef = React.useRef<string | undefined>(backgroundPath);
  React.useEffect(() => {
    backgroundPathRef.current = backgroundPath;
  }, [backgroundPath]);
  const { block, unblock } = useRouterBlocker(
    React.useCallback(
      async (location) =>
        new Promise((resolve, reject) =>
          hasUnloadProtect(backgroundPathRef.current, location)
            ? setUnloadProtect({ resolve: () => resolve('unblock'), reject })
            : resolve('ignore')
        ),
      []
    )
  );
  /*
   * Need to use events rather than context because contexts take time to
   * propagate, leading to false "Unsaved changes" warnings when unsetting
   * unload protects and navigation are done one after another.
   */
  React.useEffect(() => unloadProtectEvents.on('blocked', block), [block]);
  React.useEffect(
    () => unloadProtectEvents.on('unblocked', unblock),
    [unblock]
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

function hasUnloadProtect(
  backgroundPath: string | undefined,
  { pathname, state }: Location
): boolean {
  const noUnloadProtect =
    (state as { readonly noUnloadProtect?: true } | undefined)
      ?.noUnloadProtect === true;
  return (
    !noUnloadProtect &&
    !pathIsOverlay(pathname) &&
    !isCurrentUrl(pathname) &&
    pathname !== backgroundPath
  );
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
