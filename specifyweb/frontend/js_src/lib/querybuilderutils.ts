import { getTransitionDuration } from './components/preferenceshooks';
import type { QueryFieldFilter } from './components/querybuilderfieldfilter';
import { queryFieldFilters } from './components/querybuilderfieldfilter';
import type { MappingPath } from './components/wbplanviewmapper';
import type { SpQueryField, Tables } from './datamodel';
import type { SerializedResource } from './datamodelutils';
import { group, KEY, removeKey, sortFunction, VALUE } from './helpers';
import { QueryFieldSpec } from './queryfieldspec';
import type { RA } from './types';
import { defined } from './types';
import type { Parser } from './uiparse';
import { parserFromType, parseValue } from './uiparse';
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
   * ID is used only as a React [key] prop in order to optimize rendering when
   * query lines move
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

/** Convert SpQueryField to internal QueryField representation */
export function parseQueryFields(
  queryFields: RA<SerializedResource<SpQueryField>>
): RA<QueryField> {
  return group(
    Array.from(queryFields)
      .sort(sortFunction(({ position }) => position))
      .map(({ id, isNot, isDisplay, ...field }, index) => {
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

        /*
         * SpQueryField.startValue containing fullDate may be in different formats
         * See https://github.com/specify/specify7/issues/1348
         */
        const startValue =
          typeof field.startValue === 'string' &&
          fieldSpec.datePart === 'fullDate'
            ? field.startValue
                .split(',')
                .map((value) =>
                  parseValue(
                    parserFromType('java.sql.Timestamp'),
                    undefined,
                    value
                  )
                )
                .map((parsed) =>
                  parsed?.isValid === true
                    ? (parsed.parsed as string)
                    : field.startValue ?? ''
                )
                .join(',')
            : field.startValue;

        const mappingPath = fieldSpec.toMappingPath();
        return [
          mappingPathToString(mappingPath),
          {
            id: id ?? index,
            mappingPath,
            sortType: sortTypes[field.sortType],
            filter: {
              type: resetToAny
                ? 'any'
                : defined(
                    Object.entries(queryFieldFilters).find(
                      ([_, { id }]) => id === field.operStart
                    )
                  )[KEY],
              isNot,
              startValue,
            },
            isDisplay,
          },
        ] as const;
      })
  ).map(([_mappingPath, groupedFields]) => ({
    ...removeKey(groupedFields[0], 'filter'),
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
      QueryFieldSpec.fromPath(baseTableName, field.mappingPath),
    ]);

const auditLogMappingPaths = [
  ['parentRecordId'],
  ['parentTableNum'],
  ['recordId'],
  ['tableNum'],
  ['fields', 'oldValue'],
  ['fields', 'newValue'],
  ['fields', 'fieldName'],
];

/** Add audit log fields required to format audit log results (if missing) */
export const addAuditLogFields = (
  baseTableName: keyof Tables,
  fields: RA<QueryField>
): RA<QueryField> =>
  baseTableName === 'SpAuditLog'
    ? [
        ...fields.map((field) => ({
          ...field,
          // Force display audit log fields
          isDisplay:
            field.isDisplay ||
            auditLogMappingPaths.some(
              (mappingPath) =>
                mappingPathToString(field.mappingPath) ===
                mappingPathToString(mappingPath)
            ),
        })),
        // Add missing audit log fields
        ...auditLogMappingPaths
          .filter((mappingPath) =>
            fields.every(
              (field) =>
                mappingPathToString(field.mappingPath) !==
                mappingPathToString(mappingPath)
            )
          )
          .map(
            (mappingPath) =>
              ({
                id: 0,
                mappingPath,
                sortType: undefined,
                isDisplay: true,
                parser: undefined,
                filters: [
                  {
                    type: 'any',
                    startValue: '',
                    isNot: false,
                  },
                ],
              } as const)
          ),
      ]
    : fields;

/** Convert internal QueryField representation to SpQueryFields */
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
          ({ type, startValue, isNot }, index) =>
            ({
              ...commonData,
              operStart:
                startValue === '' && typeof originalAnyFilter === 'number'
                  ? originalAnyFilter
                  : defined(
                      // Back-end treats "equal" with blank startValue as "any"
                      Object.entries(queryFieldFilters).find(
                        ([name]) => name === type
                      )
                    )[VALUE].id,
              startValue,
              isNot,
              /*
               * Prevent OR conditions from returning separate column in the
               * results
               */
              isDisplay: commonData.isDisplay && index === 0,
              // REFACTOR: add missing nullable fields here
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

export function smoothScroll(element: HTMLElement, top: number): void {
  if (typeof element.scrollTo === 'function')
    element.scrollTo({
      top,
      behavior: getTransitionDuration() === 0 ? 'auto' : 'smooth',
    });
  else element.scrollTop = element.scrollHeight;
}
