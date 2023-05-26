import { commonText } from '../../localization/common';
import { queryText } from '../../localization/query';
import { f } from '../../utils/functools';
import { filterArray, localized } from '../../utils/types';
import { formatConjunction } from '../Atoms/Internationalization';
import { error } from '../Errors/assert';
import type { SpecToJson } from '../Syncer';
import { pipe, syncer } from '../Syncer';
import { syncers } from '../Syncer/syncers';
import { createXmlSpec } from '../Syncer/xmlUtils';
import { columnToFieldMapper } from './parseSelect';

export const typeSearchesSpec = f.store(() =>
  createXmlSpec({
    typeSearches: pipe(
      syncers.xmlChildren('typesearch'),
      syncers.map(
        pipe(
          syncers.object(typeSearchSpec()),
          syncer(postProcessTypeSearch, (_typeSearch) =>
            error('Reverse type search syncer is not implemented')
          )
        )
      )
    ),
  })
);

export type TypeSearch = Exclude<
  SpecToJson<ReturnType<typeof typeSearchesSpec>>['typeSearches'][number],
  undefined
>;

export function postProcessTypeSearch({
  searchFields,
  query,
  table,
  ...typeSearch
}: SpecToJson<ReturnType<typeof typeSearchSpec>>) {
  if (table === undefined) return undefined;
  const rawSearchFieldsNames =
    searchFields
      ?.map(f.trim)
      .map(
        typeof query === 'string' && query.length > 0
          ? columnToFieldMapper(query)
          : f.id
      ) ?? [];
  const parsedSearchFields = rawSearchFieldsNames
    .map((searchField) => table.getFields(searchField) ?? [])
    .filter(({ length }) => length > 0);
  if (parsedSearchFields.length === 0) return undefined;

  /*
   * Can't use generateMappingPathPreview here as that function expects
   * tree ranks to be loaded
   */
  const fieldTitles = parsedSearchFields
    .map((fields) => fields.at(-1)!)
    .map((field) =>
      localized(
        filterArray([
          field.table === table ? undefined : field.table.label,
          field.label,
        ]).join(' / ')
      )
    );

  return {
    ...typeSearch,
    table,
    title: commonText.colonLine({
      label: queryText.searchFields(),
      value: formatConjunction(fieldTitles),
    }),
    searchFields: parsedSearchFields,
  };
}

const typeSearchSpec = f.store(() =>
  createXmlSpec({
    name: pipe(
      syncers.xmlAttribute('name', 'required'),
      syncers.default(localized(''))
    ),
    table: pipe(
      syncers.xmlAttribute('tableId', 'required'),
      syncers.maybe(syncers.toDecimal),
      syncers.maybe(syncers.tableId)
    ),
    // Sp6 concatenates this into SQL. Vulnerable to SQL injection
    searchFields: pipe(
      syncers.xmlAttribute('searchField', 'required'),
      syncers.maybe(syncers.split(','))
    ),
    // Sp6 concatenates this into SQL. Vulnerable to SQL injection
    displayFields: pipe(
      syncers.xmlAttribute('displayCols', 'required'),
      syncers.maybe(syncers.split(','))
    ),
    format: syncers.xmlAttribute('format', 'empty', false),
    formatter: syncers.xmlAttribute('dataObjFormatter', 'empty'),
    // Sp6 executes this query directly. Quite vulnerable
    query: syncers.xmlContent,
  })
);
