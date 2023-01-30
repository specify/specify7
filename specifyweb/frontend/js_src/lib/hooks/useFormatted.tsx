import React from 'react';
import { AnySchema } from '../components/DataModel/helperTypes';
import { SpecifyResource } from '../components/DataModel/legacyTypes';
import { format } from '../components/Forms/dataObjFormatters';
import { useAsyncState } from './useAsyncState';

export function useFormatted(
  resource: SpecifyResource<AnySchema>
): string | undefined {
  const [formatted] = useAsyncState(
    React.useCallback(
      async () => format(resource, undefined, true),
      [resource]
    ),
    true
  );
  return formatted;
}
