import type { QueryFieldFilter } from './components/querybuilderfieldinput';
import { queryFieldFilters } from './components/querybuilderfieldinput';
import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQueryField, Tables } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import { QueryFieldSpec } from './queryfieldspec';
import type { RA } from './types';
import { defined } from './types';
import type { Parser } from './uiparse';
import { group, sortObjectsByKey } from './wbplanviewhelper';
import { mappingPathToString } from './wbplanviewmappinghelper';
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

          // Back-end treats empty startValue as any for many filters
          const resetToAny =
            field.startValue === '' &&
            Object.values(queryFieldFilters).find(
              ({ id }) => id == field.operStart
            )?.resetToAny === true;

          return [
            mappingPathToString(fieldSpec.toMappingPath()),
            {
              id,
              mappingPath: fieldSpec.toMappingPath(),
              sortType: sortTypes[field.sortType],
              filter: {
                type: resetToAny
                  ? 'any'
                  : defined(
                      Object.entries(queryFieldFilters).find(
                        ([_, { id }]) => id === field.operStart
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
  fields: RA<QueryField>,
  originalQueryFields: RA<SerializedResource<SpQueryField>>
): RA<SerializedResource<SpQueryField>> =>
  queryFieldsToFieldSpecs(baseTableName, fields).flatMap(
    ([field, fieldSpec], index) => {
      const commonData = {
        ...fieldSpec.toSpQueryAttributes(),
        sortType: sortTypes.indexOf(field.sortType),
        position: index,
        isDisplay: field.isDisplay,
      };
      /*
       * For some filters, empty startValue is treated as "any" by Specify 6.
       * For user convenience, Query Builder tries to reuse the original
       * filter type if both original and new filter represents "any"
       */
      const originalField = originalQueryFields.find(
        ({ stringId }) => stringId === commonData.stringId
      );
      const originalAnyFilter =
        typeof originalField === 'object' &&
        originalField.startValue === '' &&
        Object.values(queryFieldFilters).find(
          ({ id }) => id === originalField.operStart
        )?.resetToAny === true
          ? originalField.operStart
          : undefined;

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
              operStart:
                startValue === ''
                  ? originalAnyFilter
                  : defined(
                      // Back-end treats "equal" with blank startValue as "any"
                      Object.entries(queryFieldFilters).find(
                        ([name]) => name === type
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
