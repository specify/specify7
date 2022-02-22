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
import { sortFunction } from './wbplanviewhelper';
import {
  anyTreeRank,
  formattedEntry,
  formatTreeRank,
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
  readonly filter: QueryFieldFilter;
  readonly startValue: string;
  readonly isNot: boolean;
  readonly isDisplay: boolean;
  readonly parser?: Parser;
};

export function parseQueryFields(
  queryFields: RA<SerializedResource<SpQueryField>>
): RA<QueryField> {
  return Array.from(queryFields)
    .sort(sortFunction(({ position }) => position))
    .map(({ id, isNot, isDisplay, ...field }) => {
      const fieldSpec = QueryFieldSpec.fromStringId(
        field.stringId,
        field.isRelFld ?? false
      );

      return {
        id,
        mappingPath: fieldSpec.toMappingPath(),
        sortType: sortTypes[field.sortType],
        filter: defined(
          // Back-end treats "equal" with blank startValue as "any"
          Object.entries(queryFieldFilters).find(
            ([_, { id }]) =>
              (id === queryFieldFilters.any.id &&
                field.operStart === queryFieldFilters.equal.id &&
                field.startValue === '') ||
              id === field.operStart
          )
        )[0],
        startValue: field.startValue ?? '',
        isNot,
        isDisplay,
      };
    });
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
  queryFieldsToFieldSpecs(baseTableName, fields).map(
    ([field, fieldSpec], index) => {
      const attributes = fieldSpec.toSpQueryAttributes();
      return {
        ...attributes,
        sortType: sortTypes.indexOf(field.sortType),
        position: index,
        startValue: field.startValue,
        operStart: defined(
          // Back-end treats "equal" with blank startValue as "any"
          Object.entries(queryFieldFilters).find(
            ([name, { id }]) =>
              (field.startValue === '' &&
                field.filter === 'any' &&
                id === queryFieldFilters.equal.id) ||
              name === field.filter
          )
        )[1].id,
        isDisplay: field.isDisplay,
        // TODO: add missing nullable fields here
      } as unknown as SerializedResource<SpQueryField>;
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
  lineData: RA<MappingLineData>,
  mappingPath: MappingPath
): RA<MappingLineData> =>
  filterArray(
    lineData.map((mappingElementProps, index) =>
      mappingElementProps.customSelectSubtype === 'toMany'
        ? undefined
        : {
            ...mappingElementProps,
            fieldsData: {
              ...(mappingElementProps.customSelectSubtype === 'tree'
                ? {
                    [formatTreeRank(anyTreeRank)]: {
                      optionLabel: queryText('anyRank'),
                      isRelationship: true,
                      isDefault:
                        mappingPath[index] === formatTreeRank(anyTreeRank),
                      tableName: mappingElementProps.tableName,
                    },
                  }
                : {}),
              ...(lineData[index - 1]?.customSelectSubtype === 'tree' ||
              // TODO: test if this condition is needed
              index === 0
                ? {}
                : {
                    [formattedEntry]: {
                      optionLabel:
                        mappingElementProps?.customSelectSubtype === 'simple'
                          ? queryText('formatted')
                          : queryText('aggregated'),
                      tableName: mappingElementProps.tableName,
                      isRelationship: false,
                      isDefault: mappingPath[index] === formattedEntry,
                    },
                  }),
              ...mappingElementProps.fieldsData,
            },
          }
    )
  );
