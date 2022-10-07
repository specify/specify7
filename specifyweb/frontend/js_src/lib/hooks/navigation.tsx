/**
 * A wrapper for Backbone's routing API
 */

import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';

import { UnloadProtectsContext } from '../components/Core/Contexts';
import type { BackgroundLocation } from '../components/Router/Router';
import { isOverlay, OverlayContext } from '../components/Router/Router';
import type { GetSet } from '../utils/types';
import { defined } from '../utils/types';
import { removeItem } from '../utils/utils';

export function useSearchParameter(
  name: string | undefined
): GetSet<string | undefined> {
  const [queryString, setQueryString] = useSearchParams();

  const isOverlayComponent = isOverlay(React.useContext(OverlayContext));
  const location = useLocation();
  const isOverlayOpen =
    (location.state as BackgroundLocation | undefined)?.type ===
    'BackgroundLocation';
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
  React.useEffect(() => {
    if (freezeValue) return;
    valueRef.current = value;
  }, [value, freezeValue]);

  return [valueRef.current, handleChange];
}

export function useUnloadProtect(
  isEnabled: boolean,
  message: string
): () => void {
  const [_unloadProtects, setUnloadProtects] = React.useContext(
    UnloadProtectsContext
  )!;

  const handleRemove = React.useCallback(
    (): void =>
      setUnloadProtects((unloadProtects) =>
        /*
         * If there are multiple unload protects with the same message, this makes
         * sure to remove only one
         */
        removeItem(unloadProtects, unloadProtects.indexOf(message))
      ),
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
