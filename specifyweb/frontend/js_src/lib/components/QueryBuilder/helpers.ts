import { parserFromType } from '../../utils/parser/definitions';
import { parseValue } from '../../utils/parser/parse';
import { today } from '../../utils/relativeDate';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { group, KEY, removeKey, sortFunction, VALUE } from '../../utils/utils';
import { serializeResource } from '../DataModel/helpers';
import type { SerializedResource } from '../DataModel/helperTypes';
import type { SpecifyResource } from '../DataModel/legacyTypes';
import { getModel, schema } from '../DataModel/schema';
import type { SpQuery, SpQueryField, Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import { queryMappingLocalityColumns } from '../Leaflet/config';
import { uniqueMappingPaths } from '../Leaflet/wbLocalityDataExtractor';
import { getTransitionDuration } from '../Preferences/Hooks';
import { mappingPathIsComplete } from '../WbPlanView/helpers';
import type { MappingPath } from '../WbPlanView/Mapper';
import {
  mappingPathToString,
  splitJoinedMappingPath,
  valueIsToManyIndex,
} from '../WbPlanView/mappingHelpers';
import type { MappingLineData } from '../WbPlanView/navigator';
import type { QueryFieldFilter } from './FieldFilter';
import { queryFieldFilters } from './FieldFilter';
import { QueryFieldSpec } from './fieldSpec';
import { currentUserValue } from './SpecifyUserAutoComplete';

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
          fieldSpec.datePart === 'fullDate' &&
          !field.startValue.includes(today)
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
                ),
                `Unknown SpQueryField.operStart value: ${field.operStart}`
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

const PHANTOM_FIELD_ID = -1;

export const queryFieldsToFieldSpecs = (
  baseTableName: keyof Tables,
  fields: RA<QueryField>
): RA<readonly [QueryField, QueryFieldSpec]> =>
  fields
    .filter(({ mappingPath }) => mappingPathIsComplete(mappingPath))
    .map((field) => {
      const fieldSpec = QueryFieldSpec.fromPath(
        baseTableName,
        field.mappingPath
      );
      if (field.id === PHANTOM_FIELD_ID) fieldSpec.isPhantom = true;
      return [field, fieldSpec];
    });

const auditLogMappingPaths = [
  ['recordId'],
  ['tableNum'],
  ['fields', 'fieldName'],
  ['fields', 'oldValue'],
  ['fields', 'newValue'],
];

/**
 * Add invisible fields to query if missing (fields that are required to format
 * audit log results or plot query results)
 */
export const augmentQueryFields = (
  baseTableName: keyof Tables,
  fields: RA<QueryField>,
  isDistinct: boolean
): RA<QueryField> =>
  isDistinct
    ? fields
    : baseTableName === 'SpAuditLog'
    ? addQueryFields(fields, auditLogMappingPaths, true)
    : addLocalityFields(baseTableName, fields);

/**
 * It is expected by QueryResultsWrapper that this function does not change
 * field specs of existing fields, and does not change the indexes of fields
 * that are already in the query
 */
const addQueryFields = (
  fields: RA<QueryField>,
  fieldsToAdd: RA<MappingPath>,
  makeVisible: boolean
): RA<QueryField> => [
  ...fields.map((field) => {
    const path = mappingPathToString(
      field.mappingPath.filter((part) => !valueIsToManyIndex(part))
    );
    const isPhantom =
      !field.isDisplay &&
      fieldsToAdd.some(
        (mappingPath) => path === mappingPathToString(mappingPath)
      );
    return {
      ...field,
      id: isPhantom && !makeVisible ? PHANTOM_FIELD_ID : field.id,
      // Force display the field
      isDisplay: field.isDisplay || isPhantom,
    };
  }),
  // Add missing fields
  ...fieldsToAdd
    .filter((mappingPath) =>
      fields.every(
        (field) =>
          mappingPathToString(
            field.mappingPath.filter((part) => !valueIsToManyIndex(part))
          ) !== mappingPathToString(mappingPath)
      )
    )
    .map(
      (mappingPath) =>
        ({
          id: makeVisible ? 0 : PHANTOM_FIELD_ID,
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
];

/**
 * Add any missing locality fields required for mapping
 */
function addLocalityFields(
  baseTableName: keyof Tables,
  fields: RA<QueryField>
): RA<QueryField> {
  const fieldSpecs = fields.map((field) =>
    QueryFieldSpec.fromPath(baseTableName, field.mappingPath)
  );
  const localityIndexes = fieldSpecs.map((spec) =>
    spec.joinPath.findIndex(
      (part) => part.isRelationship && part.relatedModel.name === 'Locality'
    )
  );
  const rawLocalityPaths: RA<MappingPath> = [
    ...(baseTableName === 'Locality' ? [[]] : []),
    ...filterArray(
      localityIndexes.map((localityIndex, fieldIndex) =>
        localityIndex === -1
          ? undefined
          : fieldSpecs[fieldIndex].joinPath
              .slice(0, localityIndex + 1)
              .map(({ name }) => name)
      )
    ),
  ];
  const localityPaths = uniqueMappingPaths(rawLocalityPaths);

  const localityFieldNames = queryMappingLocalityColumns
    .map(splitJoinedMappingPath)
    .map((parts) =>
      parts.length === 2
        ? parts[1]
        : error('Only direct locality fields are supported')
    )
    .map((fieldName) => schema.models.Locality.strictGetField(fieldName).name);

  return addQueryFields(
    fields,
    localityPaths.flatMap((path) =>
      localityFieldNames.map((fieldName) => [...path, fieldName])
    ),
    false
  );
}

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
                ),
                `Unknown query field filter type: ${type}`
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

const containsOr = (
  fieldSpecMapped: RA<readonly [QueryField, QueryFieldSpec]>
) => fieldSpecMapped.some(([field]) => field.filters.length > 1);

const containsSpecifyUsername = (
  baseTableName: keyof Tables,
  fieldSpecMapped: RA<readonly [QueryField, QueryFieldSpec]>
) =>
  fieldSpecMapped.some(([field]) => {
    const includesUserValue = field.filters.some(({ startValue }) =>
      startValue.includes(currentUserValue)
    );
    const terminatingField = schema.models[baseTableName].getField(
      mappingPathToString(field.mappingPath)
    );
    const endsWithSpecifyUser =
      terminatingField?.isRelationship === false &&
      terminatingField.name === 'name' &&
      terminatingField.model.name === 'SpecifyUser';
    return endsWithSpecifyUser && includesUserValue;
  });

const containsRelativeDate = (
  fieldSpecMapped: RA<readonly [QueryField, QueryFieldSpec]>
) =>
  fieldSpecMapped.some(
    ([field, fieldSpec]) =>
      field.filters.some(({ startValue }) => startValue.includes(today)) &&
      fieldSpec.datePart === 'fullDate'
  );

// If contains modern fields/functionality set isFavourite to false, to not appear directly in 6
export function isModern(query: SpecifyResource<SpQuery>): boolean {
  const serializedQuery = serializeResource(query);
  const baseTableName = getModel(serializedQuery.contextName)?.name;
  if (baseTableName === undefined) return false;
  const fields = serializedQuery.fields;

  const fieldSpecsMapped = queryFieldsToFieldSpecs(
    baseTableName,
    parseQueryFields(fields)
  );

  return (
    containsOr(fieldSpecsMapped) ||
    containsSpecifyUsername(baseTableName, fieldSpecsMapped) ||
    containsRelativeDate(fieldSpecsMapped)
  );
}
