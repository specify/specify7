import type { SafeLocation } from 'history';
import React from 'react';
import { unstable_useBlocker as useBlocker } from 'react-router';

import { commonText } from '../../localization/common';
import { mainText } from '../../localization/main';
import { f } from '../../utils/functools';
import type { GetOrSet, RA } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { Dialog } from '../Molecules/Dialog';
import { locationToUrl } from './queryString';

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
          <Button.Danger onClick={handleConfirm}>
            {mainText.leave()}
          </Button.Danger>
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

/**
 * This component should only be used by the router
 *
 * Handles blocking navigation and displaying an unload protect dialog as
 * appropriate
 */
export function RouterUnloadProtect({
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

export const pathIsOverlay = (relativeUrl: string): boolean =>
  relativeUrl.startsWith('/specify/overlay/');
