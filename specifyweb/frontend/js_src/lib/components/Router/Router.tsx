import type { SafeLocation } from 'history';
import React from 'react';
import type { SafeNavigateFunction } from 'react-router';
import { useLocation, useNavigate, useRoutes } from 'react-router-dom';

import { useErrorContext } from '../../hooks/useErrorContext';
import { toLocalUrl } from '../../utils/ajax/helpers';
import { listen } from '../../utils/events';
import { setDevelopmentGlobal } from '../../utils/types';
import { error } from '../Errors/assert';
import { crash, softFail } from '../Errors/Crash';
import { ErrorBoundary } from '../Errors/ErrorBoundary';
import { userPreferences } from '../Preferences/userPreferences';
import { NotFoundView } from './NotFoundView';
import { overlayRoutes } from './OverlayRoutes';
import { locationToUrl } from './queryString';
import { toReactRoutes } from './RouterUtils';
import { routes } from './Routes';
import { pathIsOverlay, RouterUnloadProtect } from './UnloadProtect';

let unsafeNavigateFunction: SafeNavigateFunction | undefined;
export const unsafeNavigate = (
  ...parameters: Parameters<SafeNavigateFunction>
): void => unsafeNavigateFunction?.(...parameters);
let unsafeLocation: SafeLocation | undefined;

/**
 * Using this should be avoided when possible. Render <NotFoundView /> or
 * <NotFoundDialog /> instead.
 *
 * If error was triggered by an overlay, display 404 error in a dialog. Otherwise,
 * replace the main page with a 404.
 *
 * BUG: This assumes that if overlay is open, then it triggered the 404
 *  error, which is not always the case as the main content could be sending
 *  requests in the background too
 */
export function unsafeTriggerNotFound(): boolean {
  unsafeNavigateFunction?.(
    unsafeLocation === undefined
      ? '/specify/'
      : pathIsOverlay(locationToUrl(unsafeLocation))
        ? '/specify/overlay/not-found/'
        : unsafeLocation,
    {
      replace: true,
      state:
        typeof unsafeLocation === 'object' &&
        pathIsOverlay(locationToUrl(unsafeLocation))
          ? unsafeLocation.state
          : { type: 'NotFoundPage' },
    }
  );
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

  /*
   * BUG: direct calls to navigate() with overlay URL don't set
   *    BackgroundLocation. This is a partial workaround, but it won't stand on
   *    page reload
   */
  const previousLocation = React.useRef(location);
  const rawBackground =
    state?.type === 'BackgroundLocation' ? state.location : undefined;
  const backgroundRef = React.useRef(rawBackground);
  if (!pathIsOverlay(location.pathname)) backgroundRef.current = undefined;
  else if (rawBackground !== undefined) backgroundRef.current = rawBackground;
  else if (!pathIsOverlay(previousLocation.current.pathname))
    backgroundRef.current = previousLocation.current;
  const background = backgroundRef.current;
  previousLocation.current = location;

  const isNotFoundState =
    state?.type === 'NotFoundPage' ||
    background?.state?.type === 'NotFoundPage';
  useErrorContext('location', location);

  React.useEffect(() => {
    unsafeNavigateFunction = navigate;
    setDevelopmentGlobal('_goTo', navigate);
    // If page was in 404 state and user reloaded it, then clear the 404 state
    if (isNotFoundState) navigate(locationToUrl(location), { replace: true });
    // Only ever execute this on initial render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLinkIntercept(background);

  const main =
    useRoutes(transformedRoutes, background ?? location) ?? undefined;

  const overlay = useRoutes(transformedOverlays, location) ?? undefined;

  const urlNotFound = main === undefined && overlay === undefined;

  const [singleResource, setSingleResource] = React.useState<
    string | undefined
  >(undefined);
  return (
    <SetSingleResourceContext.Provider value={setSingleResource}>
      <RouterUnloadProtect singleResource={singleResource} />
      <OverlayLocation.Provider
        value={pathIsOverlay(location.pathname) ? location : undefined}
      >
        {isNotFoundState || urlNotFound ? <NotFoundView /> : undefined}
        {typeof overlay === 'object' && (
          <Overlay background={background} overlay={overlay} />
        )}
        {
          /**
           * If in 404 state, don't render the main content.
           * Fixes https://github.com/specify/specify7/issues/3339
           */
          isNotFoundState ? undefined : main
        }
      </OverlayLocation.Provider>
    </SetSingleResourceContext.Provider>
  );
}

function useLinkIntercept(background: SafeLocation | undefined): void {
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedLocation = React.useRef<SafeLocation>(background ?? location);
  React.useEffect(() => {
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
    // False positive
    // eslint-disable-next-line functional/prefer-tacit
    () => handleCloseRef.current(),
    []
  );

  return (
    <OverlayContext.Provider value={handleCloseOverlay}>
      <ErrorBoundary dismissible>{overlay}</ErrorBoundary>
    </OverlayContext.Provider>
  );
}

function defaultOverlayContext(): void {
  softFail(new Error('Tried to close Overlay outside of an overlay'));
}

export const isOverlay = (overlayContext: () => void): boolean =>
  overlayContext !== defaultOverlayContext;

/**
 * When in overlay, this context provides a function that closes the overlay.
 */
export const OverlayContext = React.createContext<() => void>(
  defaultOverlayContext
);
OverlayContext.displayName = 'OverlayContext';

/**
 * Regardless of whether component is in overlay or not, if any overlay is open,
 * this will provide location of that component
 */
export const OverlayLocation = React.createContext<SafeLocation | undefined>(
  undefined
);
OverlayLocation.displayName = 'OverlayLocation';

/**
 * If set, links within this path won't trigger unload protection
 */
export const SetSingleResourceContext = React.createContext<
  (path: string | undefined) => void
>(() => error('SetSingleResourceContext is not defined'));
SetSingleResourceContext.displayName = 'SetSingleResourceContext';

export const exportsForTests = { parseClickEvent };
