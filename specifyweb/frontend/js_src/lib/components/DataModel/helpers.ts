import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { isTreeResource } from '../InitialContext/treeRanks';
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
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

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
  resource.specifyTable.name === tableName ? resource : undefined;

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
  SCHEMA extends Tables[keyof Tables],
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
  f.includes(tableNames, resource.specifyTable.name) ? resource : undefined;

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
            .join('.')
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
