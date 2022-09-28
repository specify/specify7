import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import { filterArray } from '../../utils/types';
import { getParsedAttribute } from '../../utils/utils';
import { formatList } from '../Atoms/Internationalization';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { load } from '../InitialContext';
import { formatUrl } from '../Router/queryString';
import { columnToFieldMapper } from './parseSelect';
import type { TypeSearch } from './queryComboBoxUtils';

const typeSearches = load<Element>(
  formatUrl('/context/app.resource', { name: 'TypeSearches' }),
  'text/xml'
);

export function useTypeSearch(
  initialTypeSearch: Element | string | undefined,
  field: LiteralField | Relationship | undefined,
  initialRelatedModel: SpecifyModel | undefined
): TypeSearch | false | undefined {
  const [typeSearch] = useAsyncState<TypeSearch | false>(
    React.useCallback(async () => {
      const relatedModel =
        initialRelatedModel ??
        (field?.isRelationship === true ? field.relatedModel : undefined);
      if (relatedModel === undefined) return false;

      const typeSearch =
        typeof initialTypeSearch === 'object'
          ? initialTypeSearch
          : (await typeSearches).querySelector(
              typeof initialTypeSearch === 'string'
                ? `[name="${initialTypeSearch}"]`
                : `[tableid="${relatedModel.tableId}"]`
            );
      if (typeSearch === undefined) return false;

      const rawSearchFieldsNames =
        typeSearch === null
          ? []
          : getParsedAttribute(typeSearch, 'searchField')
              ?.split(',')
              .map(f.trim)
              .map(
                typeof typeSearch?.textContent === 'string' &&
                  typeSearch.textContent.trim().length > 0
                  ? columnToFieldMapper(typeSearch.textContent)
                  : f.id
              ) ?? [];
      const searchFields = rawSearchFieldsNames.map((searchField) =>
        relatedModel.strictGetField(searchField)
      );

      const fieldTitles = searchFields.map((field) =>
        filterArray([
          field.model === relatedModel ? undefined : field.model.label,
          field.label,
        ]).join(' / ')
      );

      return {
        title: queryText('queryBoxDescription', formatList(fieldTitles)),
        searchFields,
        relatedModel,
        dataObjectFormatter:
          typeSearch?.getAttribute('dataObjFormatter') ?? undefined,
      };
    }, [initialTypeSearch, field, initialRelatedModel]),
    false
  );
  return typeSearch;
}
