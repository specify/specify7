import type { SafeLocation } from 'history';
import React from 'react';
import type { SafeNavigateFunction } from 'react-router';
import { unstable_useBlocker as useBlocker } from 'react-router';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';

import { useErrorContext } from '../../hooks/useErrorContext';
import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { toLocalUrl } from '../../utils/ajax/helpers';
import { listen } from '../../utils/events';
import { f } from '../../utils/functools';
import type { GetOrSet, RA } from '../../utils/types';
import { setDevelopmentGlobal } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { error } from '../Errors/assert';
import { crash, softFail } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog } from '../Molecules/Dialog';
import { getUserPref } from '../UserPreferences/helpers';
import { NotFoundView } from './NotFoundView';
import { overlayRoutes } from './OverlayRoutes';
import { locationToUrl } from './queryString';
import { toReactRoutes } from './RouterUtils';
import { routes } from './Routes';

let unsafeNavigateFunction: SafeNavigateFunction | undefined;
export const unsafeNavigate = (
  ...parameters: Parameters<SafeNavigateFunction>
): void => unsafeNavigateFunction?.(...parameters);
let unsafeLocation: SafeLocation | undefined;

// Using this is not recommended. Render <NotFoundView /> instead.
export function unsafeTriggerNotFound(): boolean {
  unsafeNavigateFunction?.(unsafeLocation ?? '/specify/', {
    replace: true,
    state: { type: 'NotFoundPage' },
  });
  return typeof unsafeNavigateFunction === 'function';
}

const transformedRoutes = toReactRoutes(routes);
const transformedOverlays = toReactRoutes(overlayRoutes);

/**
 * Wrapper for React-Router with support for overlays and unload protect.
 *
 * Support for overlays was modeled based on this example:
 * https://reactrouter.com/docs/en/v6/examples/modal
 */
export function Router(): JSX.Element {
  /*
   * REFACTOR: replace usages of navigate with <a> where possible
   * REFACTOR: replace <Button> with <Link> where possible
   */
  const navigate = useNavigate();

  const location = useLocation();
  unsafeLocation = location;
  const state = location.state;
  const background =
    state?.type === 'BackgroundLocation' ? state.location : undefined;
  const isNotFoundPage =
    state?.type === 'NotFoundPage' ||
    background?.state?.type === 'NotFoundPage';
  useErrorContext('location', location);

  React.useEffect(() => {
    unsafeNavigateFunction = navigate;
    setDevelopmentGlobal('_goTo', navigate);
    // If page was in 404 state and user reloaded it, then clear the 404 state
    if (isNotFoundPage) navigate(locationToUrl(location), { replace: true });
  }, []);

  useLinkIntercept(background);

  const main =
    useRoutes(transformedRoutes, background ?? location) ?? undefined;

  const overlay = useRoutes(transformedOverlays, location) ?? undefined;

  const isNotFound =
    (main === undefined && overlay === undefined) || isNotFoundPage;

  const [singleResource, setSingleResource] = React.useState<
    string | undefined
  >(undefined);
  return (
    <SetSingleResourceContext.Provider value={setSingleResource}>
      <UnloadProtect singleResource={singleResource} />
      {isNotFound ? <NotFoundView /> : undefined}
      {typeof overlay === 'object' && (
        <Overlay background={background} overlay={overlay} />
      )}
      {main}
    </SetSingleResourceContext.Provider>
  );
}

const pathIsOverlay = (relativeUrl: string): boolean =>
  relativeUrl.startsWith('/specify/overlay/');

function useLinkIntercept(background: SafeLocation | undefined): void {
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedLocation = React.useRef<SafeLocation>(background ?? location);
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
                state: {
                  type: 'BackgroundLocation',
                  location: resolvedLocation.current,
                },
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
    link.getAttribute('href')?.startsWith('/specify/') === true &&
    link.getAttribute('download') === null &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.ctrlKey &&
    (link.target === '' ||
      link.target === '_self' ||
      (event.altKey &&
        getUserPref('general', 'behavior', 'altClickToSupressNewTab')))
  ) {
    // Don't handle absolute URLs that lead to a different origin
    const localUrl = toLocalUrl(link.href);
    if (typeof localUrl === 'string') {
      event.preventDefault();
      if (
        process.env.NODE_ENV !== 'production' &&
        link.getAttribute('href')!.startsWith('.')
      )
        crash(
          new Error(
            'Relative URLs are not supported as they are unpredictable. ' +
              'Relative URL leads to different path depending on whether ' +
              'current URL has trailing slash or not. Consider calling ' +
              'resolveRelative() first'
          )
        );
      return {
        url: localUrl,
        isOverlay: pathIsOverlay(localUrl),
      };
    }
  }
  return undefined;
}

function Overlay({
  overlay,
  background,
}: {
  readonly overlay: JSX.Element | undefined;
  // This happens when user opened the overlay directly by going to the URL
  readonly background: SafeLocation | undefined;
}): JSX.Element {
  const navigate = useNavigate();

  function handleClose(): void {
    const backgroundUrl =
      typeof background === 'object' ? locationToUrl(background) : '/specify/';
    navigate(backgroundUrl, { state: background?.state });
  }

  const handleCloseRef = React.useRef(handleClose);
  handleCloseRef.current = handleClose;

  const handleCloseOverlay = React.useCallback(
    () => handleCloseRef.current(),
    []
  );

  return (
    <OverlayContext.Provider value={handleCloseOverlay}>
      <ErrorBoundary dismissible>{overlay}</ErrorBoundary>
    </OverlayContext.Provider>
  );
}

function defaultOverlayContext() {
  softFail(new Error('Tried to close Overlay outside of an overlay'));
}

export const isOverlay = (overlayContext: () => void): boolean =>
  overlayContext !== defaultOverlayContext;
export const OverlayContext = React.createContext<() => void>(
  defaultOverlayContext
);
OverlayContext.displayName = 'OverlayContext';

/**
 * If set, links within this path won't trigger unload protection
 */
export const SetSingleResourceContext = React.createContext<
  (path: string | undefined) => void
>(() => error('SetSingleResourceContext is not defined'));
SetSingleResourceContext.displayName = 'SetSingleResourceContext';

function UnloadProtect({
  singleResource,
}: {
  readonly singleResource: string | undefined;
}): JSX.Element | null {
  const unloadProtects = React.useContext(UnloadProtectsContext)!;
  const unloadProtectsRef = React.useContext(UnloadProtectsRefContext)!;

  const blocker = useBlocker(
    React.useCallback<Exclude<Parameters<typeof useBlocker>[0], boolean>>(
      ({ nextLocation, currentLocation }) =>
        unloadProtectsRef.current.length > 0 &&
        hasUnloadProtect(nextLocation, currentLocation, singleResource),
      [singleResource]
    )
  );

  // Remove the blocker if nothing is blocking
  const isEmpty = unloadProtects.length === 0;
  const isSet = blocker.state === 'blocked';
  const shouldUnset = isEmpty && isSet;
  React.useEffect(
    () => (shouldUnset ? blocker.proceed() : undefined),
    [isEmpty, isSet, blocker]
  );

  return (
    <>
      {blocker.state === 'blocked' && unloadProtects.length > 0 ? (
        <UnloadProtectDialog
          onCancel={(): void => blocker.reset()}
          onConfirm={(): void => blocker.proceed()}
        >
          {unloadProtects.at(-1)!}
        </UnloadProtectDialog>
      ) : null}
    </>
  );
}

/** Decide whether a given URL change should trigger unload protect */
const hasUnloadProtect = (
  nextLocation: SafeLocation,
  currentLocation: SafeLocation,
  singleResource: string | undefined
): boolean =>
  // Check for navigation within overlay
  !pathIsOverlay(nextLocation.pathname) &&
  // Check for navigation that only changes query string / hash
  !isCurrentUrl(nextLocation.pathname) &&
  // Check for exiting overlay
  f.maybe(
    currentLocation.state?.type === 'BackgroundLocation'
      ? currentLocation.state.location
      : undefined,
    locationToUrl
  ) !== locationToUrl(nextLocation) &&
  // Check for navigation within single resource
  !isSingleResource(nextLocation, singleResource);

// Don't trigger unload protect if only query string or hash changes
const isCurrentUrl = (relativeUrl: string): boolean =>
  new URL(relativeUrl, globalThis.location.origin).pathname ===
  globalThis.location.pathname;

const isSingleResource = (
  { pathname }: SafeLocation,
  singleResource: string | undefined
): boolean =>
  singleResource !== undefined &&
  pathname.startsWith(singleResource) &&
  globalThis.location.pathname.startsWith(singleResource);

export function UnloadProtectDialog({
  children,
  onCancel: handleCancel,
  onConfirm: handleConfirm,
}: {
  readonly children: string;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}): JSX.Element {
  return (
    <Dialog
      buttons={
        <>
          <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
          <Button.Red onClick={handleConfirm}>{mainText.leave()}</Button.Red>
        </>
      }
      forceToTop
      header={mainText.leavePageConfirmation()}
      onClose={handleCancel}
    >
      {children}
    </Dialog>
  );
}

/**
 * List of current unload protects (used for preventing loss of unsaved changes)
 */
export const UnloadProtectsContext = React.createContext<
  RA<string> | undefined
>(undefined);
UnloadProtectsContext.displayName = 'UnloadProtectsContext';

export const UnloadProtectsRefContext = React.createContext<
  { readonly current: RA<string> } | undefined
>(undefined);
UnloadProtectsRefContext.displayName = 'UnloadProtectsRefContext';

export const SetUnloadProtectsContext = React.createContext<
  GetOrSet<RA<string>>[1] | undefined
>(undefined);
SetUnloadProtectsContext.displayName = 'SetUnloadProtectsContext';

export const exportsForTests = { parseClickEvent };
