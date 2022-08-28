import { getTransitionDuration } from '../UserPreferences/Hooks';
import type { QueryFieldFilter } from './FieldFilter';
import { queryFieldFilters } from './FieldFilter';
import type { MappingPath } from '../WbPlanView/Mapper';
import type { SpQueryField, Tables } from '../DataModel/types';
import type { SerializedResource } from '../DataModel/helpers';
import { group, KEY, removeKey, sortFunction, VALUE } from '../../utils/utils';
import { QueryFieldSpec } from './fieldSpec';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { parserFromType, parseValue } from '../../utils/uiParse';
import { mappingPathToString } from '../WbPlanView/mappingHelpers';
import type { MappingLineData } from '../WbPlanView/navigator';
import { mappingPathIsComplete } from '../WbPlanView/helpers';

export type SortTypes = 'ascending' | 'descending' | undefined;
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
      .map(({ isNot, isDisplay, ...field }, index) => {
        const fieldSpec = QueryFieldSpec.fromStringId(
          field.stringId,
          field.isRelFld ?? false
        );

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
                  parsed?.isValid
                    ? (parsed.parsed as string)
                    : field.startValue ?? ''
                )
                .join(',')
            : field.startValue;

        const mappingPath = fieldSpec.toMappingPath();
        return [
          mappingPathToString(mappingPath),
          {
            id: index,
            mappingPath,
            sortType: sortTypes[field.sortType],
            filter: {
              type: defined(
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
): RA<readonly [QueryField, QueryFieldSpec]> =>
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
  fields: RA<QueryField>
): RA<SerializedResource<SpQueryField>> =>
  queryFieldsToFieldSpecs(baseTableName, fields).flatMap(
    ([field, fieldSpec], index) => {
      const commonData = {
        ...fieldSpec.toSpQueryAttributes(),
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
          ({ type, startValue, isNot }, index) =>
            ({
              ...commonData,
              operStart: defined(
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
      .map(({ mappingPath }) => mappingPath.at(-1))
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
