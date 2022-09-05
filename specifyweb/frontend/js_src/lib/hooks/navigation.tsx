/**
 * A wrapper for Backbone's routing API
 */

import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { removeItem } from '../utils/utils';
import type { GetSet } from '../utils/types';
import { defined } from '../utils/types';
import { UnloadProtectsContext } from '../components/Core/Contexts';

export function useSearchParam(
  name: string | undefined
): GetSet<string | undefined> {
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
  return [
    typeof name === 'string' ? queryString.get(name) ?? undefined : undefined,
    handleChange,
  ];
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
