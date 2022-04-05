import { ajax, Http } from './ajax';
import type { Tables } from './datamodel';
import type {
  AnySchema,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import { serializeResource } from './datamodelutils';
import { f } from './functools';
import type { SpecifyResource } from './legacytypes';
import * as queryString from './querystring';
import { getModel } from './schema';
import { defined } from './types';

/*
 * TODO: experiment with an object singleton:
 * There is only ever one instance of a record with the same table name
 * and id. Any changes in one place propagate to all the other places where
 * that record is used. Record is only fetched once and updates are kept track
 * of. When requesting object fetch, return the previous fetched version, while
 * fetching the new one.
 */

export const fetchResource = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME]
>(
  tableName: TABLE_NAME,
  id: number
): Promise<SerializedResource<SCHEMA> | undefined> =>
  ajax<SerializedModel<SCHEMA>>(
    `/api/specify/${tableName}/${id}/`,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { headers: { Accept: 'application/json' } },
    { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
  ).then(({ data: record, status }) =>
    status === Http.NOT_FOUND ? undefined : serializeResource(record)
  );

export function getResourceViewUrl(
  tableName: keyof Tables,
  resourceId: number | 'new' = 'new',
  recordSetId?: number
): string {
  const url = `/specify/view/${tableName.toLowerCase()}/${resourceId}/`;
  return typeof recordSetId === 'number'
    ? queryString.format(url, { recordsetid: recordSetId.toString() })
    : url;
}

export function getResourceApiUrl(
  tableName: keyof Tables,
  resourceId: number,
  recordSetId?: number
): string {
  const url = `/api/specify/${tableName.toLowerCase()}/${resourceId}/`;
  return typeof recordSetId === 'number'
    ? queryString.format(url, { recordsetid: recordSetId.toString() })
    : url;
}

export function parseResourceUrl(
  resourceUrl: string
): Readonly<[modelName: keyof Tables, id: number] | undefined> {
  const parsed = /^\/api\/specify\/(\w+)\/(?:(\d+)\/)?$/
    .exec(resourceUrl)
    ?.slice(1);
  return typeof parsed === 'undefined'
    ? parsed
    : [parsed[0] as keyof Tables, Number.parseInt(parsed[1])];
}

export function resourceFromUri(
  resourceUrl: string,
  options = { noBusinessRules: false }
): SpecifyResource<AnySchema> | undefined {
  const parsed = parseResourceUrl(resourceUrl);
  if (typeof parsed === 'undefined') return undefined;
  const [tableName, id] = parsed;
  return new (defined(getModel(tableName)).Resource)({ id }, options);
}

/** Assuming urls are constructed by ResourceBase.url method */
export const idFromUrl = (url: string): number | undefined =>
  f.parseInt(url.split('/').slice(-2)[0] ?? '');

/**
 * This needs to exist due to type conflicts between AnySchema and table
 * schemas defined in datamodel.ts
 */
export const resourceToJson = <SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>
): SerializedModel<SCHEMA> => resource.toJSON() as SerializedModel<SCHEMA>;

export async function getRelatedObjectCount<SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>,
  fieldName: string &
    (keyof SCHEMA['toManyDependent'] | keyof SCHEMA['toManyIndependent'])
): Promise<number | undefined> {
  // Return the number of objects represented by a to-many field
  if (resource.specifyModel.getField(fieldName)?.type !== 'one-to-many') {
    throw new TypeError('field is not one-to-many');
  }

  // For unpersisted objects, this function doesn't make sense
  if (resource.isNew()) return undefined;

  return resource
    .rgetCollection(fieldName)
    .then(async (collection) => collection?.getTotalCount() ?? 0);
}

/*
 * Things to keep in mind:
 * on resource delete send header: {'If-Match': resource.get('version')}
 * placeInSameHierarchy
 * zero-to-one
 * business rules and validation
 * prevent fetching multiple at the same time
 */
