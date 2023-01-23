import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { load } from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import { xmlToSpec } from '../Syncer/xmlUtils';
import type { TypeSearch } from './spec';
import { typeSearchesSpec } from './spec';

export const typeSearches = f
  .all({
    xml: load<Element>(
      formatUrl('/context/app.resource', { name: 'TypeSearches' }),
      'text/xml'
    ),
    schema: import('../DataModel/schema').then(
      async ({ fetchContext }) => fetchContext
    ),
  })
  .then(({ xml }) =>
    filterArray(xmlToSpec(xml, typeSearchesSpec()).typeSearches)
  );

export function useTypeSearch(
  initialTypeSearch: TypeSearch | string | undefined,
  field: LiteralField | Relationship,
  initialRelatedModel: SpecifyModel | undefined
): TypeSearch | false | undefined {
  const relatedModel =
    initialRelatedModel ??
    (field?.isRelationship ? field.relatedModel : undefined) ??
    (typeof initialTypeSearch === 'object'
      ? initialTypeSearch.table
      : undefined);
  const [typeSearch] = useAsyncState<TypeSearch | false>(
    React.useCallback(() => {
      if (typeof initialTypeSearch === 'object') return initialTypeSearch;
      else if (relatedModel === undefined) return false;
      return typeSearches.then(
        (typeSearches) =>
          typeSearches.find(({ name }) => name === initialTypeSearch) ??
          typeSearches.find(({ table }) => table === relatedModel)
      );
    }, [initialTypeSearch, relatedModel]),
    false
  );
  return typeSearch;
}
