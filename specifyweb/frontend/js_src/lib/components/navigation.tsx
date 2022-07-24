/**
 * A wrapper for Backbone's routing API
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { isExternalUrl } from '../ajax';
import { removeItem } from '../helpers';
import type { GetSet } from '../types';
import { UnloadProtectsContext } from './contexts';

export function useSearchParam(name: string): GetSet<string | undefined> {
  const [queryString, setQueryString] = useSearchParams();

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
      setQuery.current(value === undefined ? {} : { [name]: value }, {
        replace: true,
      }),
    [name]
  );
  return [queryString.get(name) ?? undefined, handleChange];
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

// FIXME: migrate usages of this function
export function clearUnloadProtect(): void {
  unloadBlockers = [];
  changeOnBeforeUnloadHandler(undefined);
}

// FIXME: replace with react router
function navigate(
  url: string,
  options: {
    readonly trigger?: boolean;
    readonly replace?: boolean;
  } = {}
): void {
  const cont = (): void => {
    if (options.trigger !== false) clearUnloadProtect();

    if (isExternalUrl(url)) globalThis.location.assign(url);
    else {
      const origin =
        globalThis.location.origin ||
        `${globalThis.location.protocol}//${globalThis.location.host}`;
      const strippedUrl = url
        .replace(new RegExp(`^${origin}`), '')
        .replace(/^\/specify/, '');
      Backbone.history.navigate(strippedUrl, options);
    }
  };

  if (unloadBlockers.length > 0 && options.trigger !== false)
    confirmNavigation(cont, () => {
      /* Nothing */
    });
  else cont();
}

/*
 * FIXME: make navigate() trigger save blockers
 * FIXME: either add /specify/ or remove it for consistency
 */

// FIXME: remove usages
export const pushUrl = (url: string): void =>
  navigate(url, { trigger: false, replace: true });
