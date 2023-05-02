import type { SafeLocation } from 'history';
import React from 'react';
import type { SafeNavigateFunction } from 'react-router';
import {
  unstable_useBlocker as useBlocker,
  useLocation,
  useNavigate,
  useRoutes,
} from 'react-router-dom';

import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { toRelativeUrl } from '../../utils/ajax/helpers';
import { listen } from '../../utils/events';
import { GetOrSet, RA, setDevelopmentGlobal } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { Dialog } from '../Molecules/Dialog';
import { NotFoundView } from './NotFoundView';
import { overlayRoutes } from './OverlayRoutes';
import { toReactRoutes } from './RouterUtils';
import { routes } from './Routes';
import { softFail } from '../Errors/Crash';
import { f } from '../../utils/functools';
import { useErrorContext } from '../../hooks/useErrorContext';
import { userPreferences } from '../Preferences/userPreferences';

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
  const location = useLocation();
  unsafeLocation = location;
  const state = location.state;
  const background =
    state?.type === 'BackgroundLocation' ? state.location : undefined;
  const isNotFoundPage =
    state?.type === 'NotFoundPage' ||
    background?.state?.type === 'NotFoundPage';
  useErrorContext('location', location);

  /*
   * REFACTOR: replace usages of navigate with <a> where possible
   * REFACTOR: replace <Button> with <Link> where possible
   */
  const navigate = useNavigate();
  unsafeNavigateFunction = navigate;
  React.useEffect(() => setDevelopmentGlobal('_goTo', navigate), [navigate]);

  useLinkIntercept(background);

  const main =
    useRoutes(transformedRoutes, background ?? location) ?? undefined;

  const overlay = useRoutes(transformedOverlays, location) ?? undefined;

  const isNotFound =
    (main === undefined && overlay === undefined) || isNotFoundPage;

  return (
    <>
      <UnloadProtect />
      {isNotFound ? <NotFoundView /> : undefined}
      {typeof overlay === 'object' && (
        <Overlay background={background} overlay={overlay} />
      )}
      {main}
    </>
  );
}

const pathIsOverlay = (relativeUrl: string): boolean =>
  relativeUrl.startsWith('/specify/overlay/');

// Don't trigger unload protect if only query string or hash changes
const isCurrentUrl = (relativeUrl: string): boolean =>
  new URL(relativeUrl, globalThis.location.origin).pathname ===
  globalThis.location.pathname;

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
        userPreferences.get('general', 'behavior', 'altClickToSupressNewTab')))
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

const locationToUrl = (location: SafeLocation): string =>
  `${location.pathname}${location.search}${location.hash}`;

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

function UnloadProtect(): JSX.Element | null {
  const unloadProtects = React.useContext(UnloadProtectsContext)!;
  const unloadProtectsRef = React.useContext(UnloadProtectsRefContext)!;

  const blocker = useBlocker(
    React.useCallback<Exclude<Parameters<typeof useBlocker>[0], boolean>>(
      ({ nextLocation, currentLocation }) =>
        unloadProtectsRef.current.length > 0 &&
        hasUnloadProtect(nextLocation, currentLocation),
      []
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
  currentLocation: SafeLocation
): boolean =>
  !pathIsOverlay(nextLocation.pathname) &&
  !isCurrentUrl(nextLocation.pathname) &&
  f.maybe(
    currentLocation.state?.type === 'BackgroundLocation'
      ? currentLocation.state.location
      : undefined,
    locationToUrl
  ) !== locationToUrl(nextLocation);

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
