import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { getAppResourceUrl } from '../../utils/ajax/helpers';
import { filterArray } from '../../utils/types';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyTable } from '../DataModel/specifyTable';
import { load } from '../InitialContext';
import { xmlToSpec } from '../Syncer/xmlUtils';
import type { TypeSearch } from './spec';
import { typeSearchesSpec } from './spec';

export const typeSearches = Promise.all([
  load<Element>(getAppResourceUrl('TypeSearches'), 'text/xml'),
  import('../DataModel/tables').then(async ({ fetchContext }) => fetchContext),
]).then(([xml]) =>
  filterArray(xmlToSpec(xml, typeSearchesSpec()).typeSearches)
);

export function useTypeSearch(
  initialTypeSearch: TypeSearch | string | undefined,
  field: LiteralField | Relationship,
  initialRelatedTable: SpecifyTable | undefined
): TypeSearch | false | undefined {
  const relatedTable =
    initialRelatedTable ??
    (field.isRelationship ? field.relatedTable : undefined) ??
    (typeof initialTypeSearch === 'object'
      ? initialTypeSearch.table
      : undefined);
  const [typeSearch] = useAsyncState<TypeSearch | false>(
    React.useCallback(async () => {
      if (typeof initialTypeSearch === 'object') return initialTypeSearch;
      else if (relatedTable === undefined) return false;
      return typeSearches.then(
        (typeSearches) =>
          typeSearches.find(({ name }) => name === initialTypeSearch) ??
          typeSearches.find(({ table }) => table === relatedTable) ??
          false
      );
    }, [initialTypeSearch, relatedTable]),
    false
  );
  return typeSearch;
}
