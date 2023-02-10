import React from 'react';
import { AnySchema } from '../components/DataModel/helperTypes';
import { SpecifyResource } from '../components/DataModel/legacyTypes';
import { softFail } from '../components/Errors/Crash';
import { format } from '../components/Forms/dataObjFormatters';
import { useAsyncState } from './useAsyncState';

export function useFormatted(
  resource: SpecifyResource<AnySchema>
): string | undefined {
  const [formatted] = useAsyncState(
    React.useCallback(
      async () =>
        format(resource, undefined, true).catch((error) => {
          softFail(error);
          return undefined;
        }),
      [resource]
    ),
    true
  );
  return formatted;
}
