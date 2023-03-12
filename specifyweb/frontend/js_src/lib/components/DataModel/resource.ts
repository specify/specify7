import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { eventListener } from '../../utils/events';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined, filterArray } from '../../utils/types';
import { keysToLowerCase, removeKey } from '../../utils/utils';
import { formatUrl } from '../Router/queryString';
import { getUserPref } from '../UserPreferences/helpers';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { addMissingFields } from './addMissingFields';
import { businessRuleDefs } from './businessRuleDefs';
import type {
  AnySchema,
  SerializedRecord,
  SerializedResource,
  TableFields,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { getTable, tables } from './tables';
import type { SpecifyTable } from './specifyTable';
import type { Tables } from './types';
import { serializeResource } from './serializers';
import { schema } from './schema';

/*
 * REFACTOR: experiment with an object singleton:
 * There is only ever one instance of a record with the same table name
 * and id. Any changes in one place propagate to all the other places where
 * that record is used. Record is only fetched once and updates are kept track
 * of. When requesting object fetch, return the previous fetched version, while
 * fetching the new one.
 */

export const resourceEvents = eventListener<{
  readonly deleted: SpecifyResource<AnySchema>;
}>();

/**
 * Fetch a single resource from the back-end
 */
export const fetchResource = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME],
  STRICT extends boolean = true
>(
  tableName: TABLE_NAME,
  id: number,
  // @ts-expect-error Whether to trigger 404 on resource not found
  strict: STRICT = true
): Promise<
  SerializedResource<SCHEMA> | (STRICT extends true ? never : undefined)
> =>
  ajax<SerializedRecord<SCHEMA>>(
    `/api/specify/${tableName.toLowerCase()}/${id}/`,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { headers: { Accept: 'application/json' } },
    strict ? undefined : { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
  ).then(({ data: record, status }) =>
    status === Http.NOT_FOUND ? undefined! : serializeResource(record)
  );

// BUG: trigger resourceEvents.deleted here
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
): Promise<SerializedResource<Tables[TABLE_NAME]>> =>
  ajax<SerializedRecord<Tables[TABLE_NAME]>>(
    `/api/specify/${tableName.toLowerCase()}/`,
    {
      method: 'POST',
      body: keysToLowerCase(
        removeKey(
          addMissingFields(tableName, data, {
            optionalFields: 'omit',
            toManyRelationships: 'omit',
            optionalRelationships: 'omit',
          }),
          'id',
          '_tableName'
        )
      ),
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
  ajax<SerializedRecord<Tables[TABLE_NAME]>>(
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
    ? formatUrl(url, { recordSetId })
    : url;
}

/**
 * Generate a URL for working with a resource through a back-end API
 */
export function getResourceApiUrl(
  tableName: keyof Tables,
  resourceId: number | string | undefined,
  recordSetId?: number
): string {
  if (resourceId === undefined)
    return `/api/specify/${tableName.toLowerCase()}/`;
  const url = `/api/specify/${tableName.toLowerCase()}/${resourceId}/`;
  return typeof recordSetId === 'number'
    ? formatUrl(url, { recordSetId })
    : url;
}

export function parseResourceUrl(
  resourceUrl: string
): readonly [tableName: keyof Tables, id: number | undefined] | undefined {
  const parsed = /^\/api\/specify\/(\w+)\/(?:(\d+)\/)?$/u
    .exec(resourceUrl)
    ?.slice(1);
  const tableName = getTable(parsed?.[0] ?? '')?.name;
  return Array.isArray(parsed) && typeof tableName === 'string'
    ? [tableName, f.parseInt(parsed[1])]
    : undefined;
}

export const strictParseResourceUrl = (
  resourceUrl: string
): readonly [tableName: keyof Tables, id: number | undefined] =>
  defined(
    parseResourceUrl(resourceUrl),
    `Unable to parse resource API url: ${resourceUrl}`
  );

export const idFromUrl = (url: string): number | undefined =>
  parseResourceUrl(url)?.[1];

export const strictIdFromUrl = (url: string): number =>
  defined(idFromUrl(url), `Unable to extract resource id from url: ${url}`);

export function resourceFromUrl(
  resourceUrl: string,
  options?: ConstructorParameters<SpecifyTable['Resource']>[1]
): SpecifyResource<AnySchema> | undefined {
  const parsed = parseResourceUrl(resourceUrl);
  if (parsed === undefined) return undefined;
  const [tableName, id] = parsed;
  return new tables[tableName].Resource({ id }, options);
}

/**
 * This needs to exist outside of Resorce definition due to type conflicts
 * between AnySchema and table schemas defined in dataModel.ts
 */
export const resourceToJson = <SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>
): SerializedRecord<SCHEMA> => resource.toJSON() as SerializedRecord<SCHEMA>;

/*
 * Things to keep in mind:
 * on resource delete send header: {'If-Match': resource.get('version')}
 * placeInSameHierarchy
 * zero-to-one
 * business rules and validation
 * prevent fetching multiple at the same time
 * have separate types for new resource and resource (and on new resource
 * required fields can be undefined and and id is undefined). Potentially,
 * NewResource should extend Resource type since NewResource can turn into
 * Resource when saved, so components should be able to handle that
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
  immediate: boolean
): () => void {
  if (immediate) callback();
  resource.on(event.toLowerCase(), callback as () => void);
  return (): void => resource.off(event.toLowerCase(), callback as () => void);
}

/** Extract table name from a Java class name */
export const parseJavaClassName = (className: string): string =>
  className.split('.').at(-1) ?? '';

export function getFieldsToNotClone(
  table: SpecifyTable,
  cloneAll: boolean
): RA<string> {
  const fieldsToClone = getCarryOverPreference(table, cloneAll);
  const uniqueFields = getUniqueFields(table);
  return table.fields
    .map(({ name }) => name)
    .filter(
      (fieldName) =>
        uniqueFields.includes(fieldName) || !fieldsToClone.includes(fieldName)
    );
}

const getCarryOverPreference = (
  table: SpecifyTable,
  cloneAll: boolean
): RA<string> =>
  (cloneAll
    ? undefined
    : getUserPref('form', 'preferences', 'carryForward')?.[table.name]) ??
  getFieldsToClone(table);

export const getFieldsToClone = (table: SpecifyTable): RA<string> =>
  table.fields
    .filter(
      (field) =>
        !field.isVirtual &&
        (!field.isRelationship ||
          field.isDependent() ||
          !relationshipIsToMany(field))
    )
    .map(({ name }) => name);

// REFACTOR: move this into businessRuleDefs.ts
const businessRules = businessRuleDefs as {
  readonly [TABLE_NAME in keyof Tables]?: {
    readonly uniqueIn?: {
      readonly [FIELD_NAME in Lowercase<TableFields<Tables[TABLE_NAME]>>]?:
        | Lowercase<keyof Tables>
        | unknown;
    };
  };
};

const uniqueFields = [
  'guid',
  'timestampCreated',
  'version',
  'isCurrent',
  'timestampModified',
];

export const getUniqueFields = (table: SpecifyTable): RA<string> =>
  f.unique([
    ...Object.entries(businessRules[table.name]?.uniqueIn ?? {})
      .filter(
        ([_fieldName, uniquenessRules]) =>
          typeof uniquenessRules === 'string' &&
          uniquenessRules in schema.domainLevelIds
      )
      .map(([fieldName]) => table.strictGetField(fieldName).name),
    /*
     * Each attachment is assumed to refer to a unique attachment file
     * See https://github.com/specify/specify7/issues/1754#issuecomment-1157796585
     * Also, https://github.com/specify/specify7/issues/2562
     */
    ...table.relationships
      .filter(({ relatedTable }) => relatedTable.name.endsWith('Attachment'))
      .map(({ name }) => name),
    ...filterArray(
      uniqueFields.map((fieldName) => table.getField(fieldName)?.name)
    ),
  ]);

export const exportsForTests = {
  getCarryOverPreference,
  getFieldsToClone,
};
