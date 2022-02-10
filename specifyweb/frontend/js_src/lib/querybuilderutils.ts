import type { State } from 'typesafe-reducer';

import type { QueryFieldFilter } from './components/querybuilderfieldinput';
import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQueryField, Tables } from './datamodel';
import type { SerializedModel, SerializedResource } from './datamodelutils';
import queryText from './localization/query';
import type { DatePart } from './queryfieldspec';
import { QueryFieldSpec } from './queryfieldspec';
import type { RA } from './types';
import { defined, filterArray } from './types';
import type { Parser } from './uiparse';
import { resolveParser } from './uiparse';
import { sortFunction } from './wbplanviewhelper';
import type { MappingLineData } from './wbplanviewnavigator';
import { mappingPathIsComplete } from './wbplanviewutils';

const sortTypes = [undefined, 'ascending', 'descending'];
export const flippedSortTypes = {
  none: 0,
  ascending: 1,
  descending: 2,
} as const;

export type QueryField = {
  // Used as a React [key] prop only in order to optimize rendering
  readonly id: number;
  readonly mappingPath: MappingPath;
  readonly sortType: typeof sortTypes[number];
  readonly filter: QueryFieldFilter;
  readonly startValue: string;
  readonly endValue: string;
  readonly details:
    | State<'regularField'>
    | State<'dateField', { datePart: DatePart }>;
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
      const parser = resolveParser(defined(fieldSpec.getField())) ?? {};

      return {
        id,
        mappingPath: fieldSpec.toMappingPath(),
        sortType: sortTypes[field.sortType],
        filter: 'any',
        startValue: field.startValue ?? '',
        endValue: field.endValue ?? '',
        details:
          parser.type === 'date'
            ? {
                type: 'dateField',
                datePart: fieldSpec.datePart ?? 'fullDate',
              }
            : { type: 'regularField' },
        isNot,
        isDisplay,
      };
    });
}

export const unParseQueryFields = (
  baseTableName: Lowercase<keyof Tables>,
  fields: RA<QueryField>
): RA<Partial<SerializedModel<SpQueryField>>> =>
  fields
    .filter(({ mappingPath }) => mappingPathIsComplete(mappingPath))
    .map((field, index) => {
      const fieldSpec = QueryFieldSpec.fromPath([
        baseTableName,
        ...field.mappingPath,
      ]);

      const attributes = fieldSpec.toSpQueryAttributes();

      return {
        tablelist: attributes.tableList,
        stringid: attributes.stringId,
        fieldname: attributes.fieldName,
        isrelfld: attributes.isRelFld,
        sorttype: sortTypes.indexOf(field.sortType),
        position: index,
        startvalue: field.startValue,
        endvalue: field.endValue,
      };
    });

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
              ...(lineData[index - 1]?.customSelectSubtype === 'toMany'
                ? {
                    _aggregated: {
                      optionLabel: queryText('aggregated'),
                      tableName: mappingElementProps.tableName,
                      isRelationship: false,
                      isDefault: mappingPath[index] === '_aggregated',
                    },
                  }
                : mappingElementProps?.customSelectSubtype === 'simple' &&
                  index !== 0
                ? {
                    _formatted: {
                      optionLabel: queryText('formatted'),
                      tableName: mappingElementProps.tableName,
                      isRelationship: false,
                      isDefault: mappingPath[index] === '_formatted',
                    },
                  }
                : {}),
              ...mappingElementProps.fieldsData,
            },
          }
    )
  );
