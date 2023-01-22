/**
 * A wrapper for Backbone's routing API
 */

import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import type { LocalizedString } from 'typesafe-i18n';

import type { GetOrSet, GetSet, RA } from '../utils/types';
import { defined } from '../utils/types';
import { removeItem } from '../utils/utils';
import { locationToState } from '../components/Router/RouterState';
import {
  isOverlay,
  OverlayContext,
  SetUnloadProtectsContext,
} from '../components/Router/Router';

export function useSearchParameter(
  name: string | undefined
): GetSet<string | undefined> {
  const [queryString, setQueryString] = useSearchParams();

  const isOverlayComponent = isOverlay(React.useContext(OverlayContext));
  const location = useLocation();
  const state = locationToState(location, 'BackgroundLocation');
  const isOverlayOpen = typeof state === 'object';
  /*
   * If non-overlay listens for a query string, and you open an overlay, the
   * previous query string value should be used
   */
  const freezeValue = isOverlayComponent !== isOverlayOpen;

  /*
   * Unfortunately, setQueryString changes whenever the URL changes, which can
   * easily trigger an endless re-render. Thus, have to use a ref
   */
  const setQuery = React.useRef(setQueryString);
  React.useEffect(() => {
    setQuery.current = setQueryString;
  }, [setQueryString]);

  const handleChange = React.useCallback(
    (value: string | undefined) =>
      setQuery.current(
        value === undefined
          ? {}
          : {
              [defined(
                name,
                'Tried to change query string without providing a name'
              )]: value,
            },
        {
          replace: true,
        }
      ),
    [name]
  );

  const value =
    typeof name === 'string' ? queryString.get(name) ?? undefined : undefined;
  const valueRef = React.useRef(value);
  if (!freezeValue) valueRef.current = value;

  return [valueRef.current, handleChange];
}

export function useUnloadProtect(
  isEnabled: boolean,
  message: LocalizedString
): () => void {
  const setUnloadProtects = React.useContext(SetUnloadProtectsContext)!;

  const handleRemove = React.useCallback(
    (): void => unsetUnloadProtect(setUnloadProtects, message),
    [setUnloadProtects, message]
  );

  React.useEffect(() => {
    if (!isEnabled) return undefined;
    setUnloadProtects((unloadProtects) => [...unloadProtects, message]);
    return handleRemove;
  }, [setUnloadProtects, isEnabled, message]);

  return React.useCallback(
    () => (isEnabled ? handleRemove() : undefined),
    [setUnloadProtects, isEnabled]
  );
}

export const unsetUnloadProtect = (
  setUnloadProtects: GetOrSet<RA<string>>[1],
  message: LocalizedString
) =>
  setUnloadProtects((unloadProtects) => {
    const index = unloadProtects.indexOf(message);
    if (index === -1) return unloadProtects;

    /*
     * If there are multiple unload protects with the same message, this makes
     * sure to remove only one
     */
    return removeItem(unloadProtects, index);
  });
