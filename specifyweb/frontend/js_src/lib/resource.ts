import { ajax, Http, ping } from './ajax';
import type { Tables } from './datamodel';
import type {
  AnySchema,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import {
  addMissingFields,
  keysToLowerCase,
  serializeResource,
} from './datamodelutils';
import { f } from './functools';
import type { SpecifyResource } from './legacytypes';
import { formatUrl } from './querystring';
import { getModel } from './schema';
import type { RA } from './types';
import { removeKey } from './helpers';

/*
 * TODO: experiment with an object singleton:
 * There is only ever one instance of a record with the same table name
 * and id. Any changes in one place propagate to all the other places where
 * that record is used. Record is only fetched once and updates are kept track
 * of. When requesting object fetch, return the previous fetched version, while
 * fetching the new one.
 */

/**
 * Fetch a single resource from the back-end
 */
export const fetchResource = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME]
>(
  tableName: TABLE_NAME,
  id: number
): Promise<SerializedResource<SCHEMA> | undefined> =>
  ajax<SerializedModel<SCHEMA>>(
    `/api/specify/${tableName.toLowerCase()}/${id}/`,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { headers: { Accept: 'application/json' } },
    { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
  ).then(({ data: record, status }) =>
    status === Http.NOT_FOUND ? undefined : serializeResource(record)
  );

export const deleteResource = async (
  tableName: keyof Tables,
  id: number
): Promise<void> =>
  ping(
    `/api/specify/${tableName.toLowerCase()}/${id}/`,
    {
      method: 'DELETE',
    },
    { expectedResponseCodes: [Http.NO_CONTENT] }
  ).then(f.void);

export const createResource = async <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  data: Partial<SerializedResource<Tables[TABLE_NAME]>>
) =>
  ajax<SerializedModel<Tables[TABLE_NAME]>>(
    `/api/specify/${tableName.toLowerCase()}/`,
    {
      method: 'POST',
      body: removeKey(keysToLowerCase(addMissingFields(tableName, data)), 'id'),
      headers: { Accept: 'application/json' },
    },
    { expectedResponseCodes: [Http.CREATED] }
  ).then(({ data }) => serializeResource(data));

export const saveResource = async <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number,
  data: Partial<SerializedResource<Tables[TABLE_NAME]>>,
  handleConflict: (() => void) | void
): Promise<SerializedResource<Tables[TABLE_NAME]>> =>
  ajax<SerializedModel<Tables[TABLE_NAME]>>(
    `/api/specify/${tableName.toLowerCase()}/${id}/`,
    {
      method: 'PUT',
      body: keysToLowerCase(addMissingFields(tableName, data)),
      headers: { Accept: 'application/json' },
    },
    {
      expectedResponseCodes: [
        Http.OK,
        ...(typeof handleConflict === 'function' ? [Http.CONFLICT] : []),
      ],
    }
  ).then(({ data: response, status }) => {
    if (status === Http.CONFLICT) {
      handleConflict?.();
      return data as SerializedResource<Tables[TABLE_NAME]>;
    } else return serializeResource(response);
  });

/**
 * Generate a URL to view the resource in the front-end
 */
export function getResourceViewUrl(
  tableName: keyof Tables,
  resourceId: number | 'new' = 'new',
  recordSetId?: number
): string {
  const url = `/specify/view/${tableName.toLowerCase()}/${resourceId}/`;
  return typeof recordSetId === 'number'
    ? formatUrl(url, { recordSetId: recordSetId.toString() })
    : url;
}

/**
 * Generate a URL for working with a resource through a back-end API
 */
export function getResourceApiUrl(
  tableName: keyof Tables,
  resourceId: number | string,
  recordSetId?: number
): string {
  const url = `/api/specify/${tableName.toLowerCase()}/${resourceId}/`;
  return typeof recordSetId === 'number'
    ? formatUrl(url, { recordSetId: recordSetId.toString() })
    : url;
}

export function parseResourceUrl(
  resourceUrl: string
): Readonly<[modelName: keyof Tables, id: number] | undefined> {
  const parsed = /^\/api\/specify\/(\w+)\/(?:(\d+)\/)?$/
    .exec(resourceUrl)
    ?.slice(1);
  const tableName = getModel(parsed?.[0] ?? '')?.name;
  return Array.isArray(parsed) && typeof tableName === 'string'
    ? [tableName, Number.parseInt(parsed[1])]
    : undefined;
}

export const idFromUrl = (url: string): number | undefined =>
  parseResourceUrl(url)?.[1];

/**
 * This needs to exist outside of Resorce definition due to type conflicts
 * between AnySchema and table schemas defined in datamodel.ts
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

/**
 * A type-safe wrapper for Backbone.Events to keep things sane
 */
export function resourceOn(
  resource: {
    readonly on: (
      eventName: string,
      callback: (...args: RA<any>) => void
    ) => void;
    readonly off: (
      eventName?: string,
      callback?: (...args: RA<any>) => void
    ) => void;
  },
  event: string,
  callback: (...args: RA<never>) => void,
  immediate = false
): () => void {
  if (immediate) callback();
  resource.on(event.toLowerCase(), callback as () => void);
  return (): void => resource.off(event.toLowerCase(), callback as () => void);
}

/** Extract model name from a Java class name */
export const parseClassName = (className: string): string =>
  className.split('.').slice(-1)[0];
