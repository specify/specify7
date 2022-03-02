import type { QueryFieldFilter } from './components/querybuilderfieldinput';
import { queryFieldFilters } from './components/querybuilderfieldinput';
import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQueryField, Tables } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import queryText from './localization/query';
import { QueryFieldSpec } from './queryfieldspec';
import type { RA } from './types';
import { defined, filterArray } from './types';
import type { Parser } from './uiparse';
import { group, sortObjectsByKey } from './wbplanviewhelper';
import {
  anyTreeRank,
  formatTreeRank,
  mappingPathToString,
} from './wbplanviewmappinghelper';
import type { MappingLineData } from './wbplanviewnavigator';
import { mappingPathIsComplete } from './wbplanviewutils';

export type SortTypes = undefined | 'ascending' | 'descending';
export const sortTypes: RA<SortTypes> = [undefined, 'ascending', 'descending'];
export const flippedSortTypes = {
  none: 0,
  ascending: 1,
  descending: 2,
} as const;

export type QueryField = {
  /*
   * Used only as a React [key] prop in order to optimize rendering when query
   * lines move
   */
  readonly id: number;
  readonly mappingPath: MappingPath;
  readonly sortType: SortTypes;
  readonly isDisplay: boolean;
  readonly parser?: Parser;
  readonly filters: RA<{
    readonly type: QueryFieldFilter;
    readonly startValue: string;
    readonly isNot: boolean;
  }>;
};

export function parseQueryFields(
  queryFields: RA<SerializedResource<SpQueryField>>
): RA<QueryField> {
  return Object.values(
    group(
      sortObjectsByKey(Array.from(queryFields), 'position').map(
        ({ id, isNot, isDisplay, ...field }) => {
          const fieldSpec = QueryFieldSpec.fromStringId(
            field.stringId,
            field.isRelFld ?? false
          );

          return [
            mappingPathToString(fieldSpec.toMappingPath()),
            {
              id,
              mappingPath: fieldSpec.toMappingPath(),
              sortType: sortTypes[field.sortType],
              filter: {
                type: defined(
                  // Back-end treats "equal" with blank startValue as "any"
                  Object.entries(queryFieldFilters).find(
                    ([_, { id }]) =>
                      (id === queryFieldFilters.any.id &&
                        field.operStart === queryFieldFilters.equal.id &&
                        field.startValue === '') ||
                      id === field.operStart
                  )
                )[0],
                isNot,
                startValue: field.startValue ?? '',
              },
              isDisplay,
            },
          ] as const;
        }
      )
    )
  ).map((groupedFields) => ({
    ...groupedFields[0],
    filters: groupedFields.map(({ filter }) => filter),
  }));
}

export const queryFieldsToFieldSpecs = (
  baseTableName: keyof Tables,
  fields: RA<QueryField>
): RA<Readonly<[QueryField, QueryFieldSpec]>> =>
  fields
    .filter(({ mappingPath }) => mappingPathIsComplete(mappingPath))
    .map((field) => [
      field,
      QueryFieldSpec.fromPath([baseTableName, ...field.mappingPath]),
    ]);

export const unParseQueryFields = (
  baseTableName: keyof Tables,
  fields: RA<QueryField>
): RA<SerializedResource<SpQueryField>> =>
  queryFieldsToFieldSpecs(baseTableName, fields).flatMap(
    ([field, fieldSpec], index) => {
      const attributes = fieldSpec.toSpQueryAttributes();
      const commonData = {
        ...attributes,
        sortType: sortTypes.indexOf(field.sortType),
        position: index,
        isDisplay: field.isDisplay,
      };
      const hasFilters = field.filters.some(({ type }) => type !== 'any');
      return field.filters
        .filter((filter, index) =>
          // Filter out duplicate or redundant "any"
          hasFilters ? filter.type !== 'any' : index === 0
        )
        .map(
          ({ type, startValue, isNot }) =>
            ({
              ...commonData,
              operStart: defined(
                // Back-end treats "equal" with blank startValue as "any"
                Object.entries(queryFieldFilters).find(
                  ([name, { id }]) =>
                    (startValue === '' &&
                      type === 'any' &&
                      id === queryFieldFilters.equal.id) ||
                    name === type
                )
              )[1].id,
              startValue,
              isNot,
              // TODO: add missing nullable fields here
            } as unknown as SerializedResource<SpQueryField>)
        );
    }
  );

export function hasLocalityColumns(fields: RA<QueryField>): boolean {
  const fieldNames = new Set(
    fields
      .filter(({ isDisplay }) => isDisplay)
      .map(({ mappingPath }) => mappingPath.slice(-1)[0])
  );
  return fieldNames.has('latitude1') && fieldNames.has('longitude1');
}

export const mutateLineData = (
  lineData: RA<MappingLineData>
): RA<MappingLineData> =>
  lineData.filter(
    ({ customSelectSubtype }) => customSelectSubtype !== 'toMany'
  );
