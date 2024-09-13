import { f } from '../../utils/functools';
import type { RA, ValueOf } from '../../utils/types';
import { isTreeResource } from '../InitialContext/treeRanks';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import type {
  AnySchema,
  AnyTree,
  SerializedResource,
  TableFields,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import type { LiteralField, Relationship } from './specifyField';
import type { SpecifyTable } from './specifyTable';
import type { Tables } from './types';
/**
 * Lookups for operaters and relationships in Queries on the backend are
 * separated by `__`
 * The api supports the same syntax in query paramters.
 * For example `/api/specify/collectionobject/?collection__discipline__name__startswith="Invert"&catalognumber__gt=000000100`
 * fetches all collectionobjects in disciplines which names start with
 * "Invert" with catalognumbers greater than 100
 */
export const djangoLookupSeparator = '__';

export const backboneFieldSeparator = '.';

/**
 * Formats a relationship lookup which is used in a query passed to the backend.
 * For example `formatRelationshipPath('collection', 'discipline', 'division')`
 * becomes `'collection__discipline__division'`
 */
export const formatRelationshipPath = (...fields: RA<string>): string =>
  fields.join(djangoLookupSeparator);

const weekDayMap = {
  Sunday: 1,
  Monday: 2,
  Tuesday: 3,
  Wednesday: 4,
  Thursday: 5,
  Friday: 6,
  Saturday: 7,
};

/**
 * Use this to construct a query using a lookup for Django.
 * Returns an object which can be used as a filter when fetched from the backend.
 * Example: backendFilter('number1').isIn([1, 2, 3]) is the equivalent
 * of {number1__in: [1, 2, 3].join(',')}
 *
 * See the Django docs at:
 * https://docs.djangoproject.com/en/3.2/ref/models/querysets/#field-lookups
 */
export const backendFilter = (field: string) => ({
  equals: (value: number | string) => ({
    [[field, 'exact'].join(djangoLookupSeparator)]: value,
  }),
  contains: (value: string) => ({
    [[field, 'contains'].join(djangoLookupSeparator)]: value,
  }),
  caseInsensitiveContains: (value: string) => ({
    [[field, 'icontains'].join(djangoLookupSeparator)]: value,
  }),
  caseInsensitiveStartsWith: (value: string) => ({
    [[field, 'istartswith'].join(djangoLookupSeparator)]: value,
  }),
  startsWith: (value: string) => ({
    [[field, 'startswith'].join(djangoLookupSeparator)]: value,
  }),
  caseInsensitiveEndsWith: (value: string) => ({
    [[field, 'iendswith'].join(djangoLookupSeparator)]: value,
  }),
  endsWith: (value: string) => ({
    [[field, 'endswith'].join(djangoLookupSeparator)]: value,
  }),
  isIn: (value: RA<number | string>) => ({
    [[field, 'in'].join(djangoLookupSeparator)]: value.join(','),
  }),
  isNull: (value: 'false' | 'true' = 'true') => ({
    [[field, 'isnull'].join(djangoLookupSeparator)]: value,
  }),
  greaterThan: (value: number) => ({
    [[field, 'gt'].join(djangoLookupSeparator)]: value,
  }),
  greaterThanOrEqualTo: (value: number) => ({
    [[field, 'gte'].join(djangoLookupSeparator)]: value,
  }),
  lessThan: (value: number) => ({
    [[field, 'lt'].join(djangoLookupSeparator)]: value,
  }),
  lessThanOrEqualTo: (value: number) => ({
    [[field, 'lte'].join(djangoLookupSeparator)]: value,
  }),
  matchesRegex: (value: string) => ({
    [[field, 'regex'].join(djangoLookupSeparator)]: value,
  }),

  dayEquals: (value: number) => ({
    [[field, 'day'].join(djangoLookupSeparator)]: value,
  }),
  monthEquals: (value: number) => ({
    [[field, 'lte'].join(djangoLookupSeparator)]: value,
  }),
  yearEquals: (value: number) => ({
    [[field, 'year'].join(djangoLookupSeparator)]: value,
  }),
  weekEquals: (value: number) => ({
    [[field, 'week'].join(djangoLookupSeparator)]: value,
  }),
  weekDayEquals: (value: keyof typeof weekDayMap) => ({
    [[field, 'week_day'].join(djangoLookupSeparator)]: weekDayMap[value],
  }),
});

export const isResourceOfType = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableName: TABLE_NAME
  // @ts-expect-error
): resource is SpecifyResource<Tables[TABLE_NAME]> =>
  resource.specifyTable.name === tableName;

export const toTable = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableName: TABLE_NAME
): SpecifyResource<Tables[TABLE_NAME]> | undefined =>
  resource.specifyTable.name === tableName
    ? (resource as SpecifyResource<Tables[TABLE_NAME]>)
    : undefined;

export const toResource = <TABLE_NAME extends keyof Tables>(
  resource: SerializedResource<AnySchema>,
  tableName: TABLE_NAME
): SerializedResource<Tables[TABLE_NAME]> | undefined =>
  resource._tableName === tableName
    ? (resource as SerializedResource<Tables[TABLE_NAME]>)
    : undefined;

/**
 * The table.field has a very broad type to reduce type conflicts in components
 * that deal with generic schemas (accept AnySchema or a SCHEMA extends AnySchema)
 */
export const getField = <
  SCHEMA extends ValueOf<Tables>,
  FIELD extends TableFields<SCHEMA>
>(
  table: SpecifyTable<SCHEMA>,
  name: FIELD
): FIELD extends keyof SCHEMA['fields'] ? LiteralField : Relationship =>
  table.field[name] as FIELD extends keyof SCHEMA['fields']
    ? LiteralField
    : Relationship;

export const toTreeTable = (
  resource: SpecifyResource<AnySchema>
): SpecifyResource<AnyTree> | undefined =>
  isTreeResource(resource) ? resource : undefined;

export const toTables = <TABLE_NAME extends keyof Tables>(
  resource: SpecifyResource<AnySchema>,
  tableNames: RA<TABLE_NAME>
): SpecifyResource<Tables[TABLE_NAME]> | undefined =>
  f.includes(tableNames, resource.specifyTable.name)
    ? (resource as SpecifyResource<Tables[TABLE_NAME]>)
    : undefined;

/**
 * Example usage:
 * resource: Collector
 * fields: agent -> lastName
 * Would return [agent, lastName] if agent exists
 *
 */
export async function fetchDistantRelated(
  resource: SpecifyResource<AnySchema>,
  fields: RA<LiteralField | Relationship> | undefined
): Promise<
  | {
      readonly resource: SpecifyResource<AnySchema> | undefined;
      readonly field: LiteralField | Relationship | undefined;
    }
  | undefined
> {
  if (
    Array.isArray(fields) &&
    fields.some(
      (field) =>
        field.isRelationship &&
        relationshipIsToMany(field) &&
        field !== fields.at(-1)
    )
  ) {
    console.error(
      'Can not index inside of a -to-many relationship. Use an aggregator instead'
    );
    return undefined;
  }

  const related =
    fields === undefined || fields.length === 0
      ? resource
      : fields.length === 1
      ? await resource.fetch()
      : await resource.rgetPromise(
          fields
            .slice(0, -1)
            .map(({ name }) => name)
            .join(backboneFieldSeparator)
        );

  const field = fields?.at(-1);
  const relatedResource = related ?? undefined;
  return relatedResource === undefined && field === undefined
    ? undefined
    : {
        resource: relatedResource,
        field,
      };
}

// Cog types: Discrete, Consolidated, Drill Core
export const cogTypes = {
  DISCRETE: 'Discrete',
  CONSOLIDATED: 'Consolidated',
  DRILL_CORE: 'Drill Core'
}