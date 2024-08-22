import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { eventListener } from '../../utils/events';
import { f } from '../../utils/functools';
import type { DeepPartial, RA, RR } from '../../utils/types';
import {defined, filterArray, setDevelopmentGlobal} from '../../utils/types';
import { keysToLowerCase, removeKey } from '../../utils/utils';
import type { InteractionWithPreps } from '../Interactions/helpers';
import {
  interactionPrepTables,
  interactionsWithPrepTables,
} from '../Interactions/helpers';
import { userPreferences } from '../Preferences/userPreferences';
import { formatUrl } from '../Router/queryString';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { addMissingFields } from './addMissingFields';
import { getFieldsFromPath } from './businessRules';
import type {
  AnyInteractionPreparation,
  AnySchema,
  SerializedRecord,
  SerializedResource,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { schema } from './schema';
import { serializeResource } from './serializers';
import { SpecifyTable } from './specifyTable';
import {genericTables, getTable, tables} from './tables';
import type { Tables } from './types';
import { getUniquenessRules } from './uniquenessRules';

// FEATURE: use this everywhere
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

    {
      headers: { Accept: 'application/json' },
      expectedErrors: strict ? undefined : [Http.NOT_FOUND],
    }
  ).then(({ data: record, status }) =>
    status === Http.NOT_FOUND ? undefined! : serializeResource(record)
  );

// BUG: trigger resourceEvents.deleted here
export const deleteResource = async (
  tableName: keyof Tables,
  id: number
): Promise<void> =>
  ping(`/api/specify/${tableName.toLowerCase()}/${id}/`, {
    method: 'DELETE',
  }).then(f.void);

export async function createResource<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  fullData: DeepPartial<SerializedResource<Tables[TABLE_NAME]>>
): Promise<SerializedResource<Tables[TABLE_NAME]>> {
  const { id: _, resource_uri: __, ...data } = fullData;
  return ajax<SerializedRecord<Tables[TABLE_NAME]>>(
    `/api/specify/${tableName.toLowerCase()}/`,
    {
      method: 'POST',
      body: keysToLowerCase(
        removeKey(
          addMissingFields(tableName, data as typeof fullData, {
            optionalFields: 'omit',
            toManyRelationships: 'omit',
            optionalRelationships: 'omit',
          }),
          '_tableName'
        )
      ),
      headers: { Accept: 'application/json' },
    }
  ).then(({ data }) => serializeResource(data));
}

export const saveResource = async <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number,
  data: DeepPartial<SerializedResource<Tables[TABLE_NAME]>>,
  handleConflict: (() => void) | void
): Promise<SerializedResource<Tables[TABLE_NAME]>> =>
  ajax<SerializedRecord<Tables[TABLE_NAME]>>(
    `/api/specify/${tableName.toLowerCase()}/${id}/`,
    {
      method: 'PUT',
      body: keysToLowerCase(addMissingFields(tableName, data)),
      headers: { Accept: 'application/json' },
      expectedErrors:
        typeof handleConflict === 'function' ? [Http.CONFLICT] : [],
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
  return new genericTables[tableName].Resource({ id }, options);
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

function getCarryOverPreference(
  table: SpecifyTable,
  cloneAll: boolean
): RA<string> {
  const config: Partial<RR<keyof Tables, RA<string>>> = cloneAll
    ? {}
    : userPreferences.get('form', 'preferences', 'carryForward');
  return config?.[table.name] ?? getFieldsToClone(table);
}

export const getFieldsToClone = (
  table: SpecifyTable,  
): RA<string> =>
  table.fields
    .filter(
      (field) =>
        !field.isVirtual &&
        (!field.isRelationship ||
          field.isDependent() ||
          !relationshipIsToMany(field))
    )
    .map(({ name }) => name);

const uniqueFields = [
  'guid',
  'timestampCreated',
  'version',
  'isCurrent',
  'isPrimary',
  'timestampModified',
];

const getUniqueFieldsFromRules = (table: SpecifyTable)=>(getUniquenessRules(table.name) ?? [])
.filter(({ rule: { scopes } }) =>
  scopes.every(
    (fieldPath) =>
      (
        getFieldsFromPath(table, fieldPath).at(-1)?.name ?? ''
      ).toLowerCase() in schema.domainLevelIds
  )
)
.flatMap(({ rule: { fields } }) =>
  fields.flatMap((field) => table.getField(field)?.name)
);

// WARNING: Changing the behaviour here will also change how batch-edit clones records.
export const getUniqueFields = (table: SpecifyTable, schemaAware: boolean =true): RA<string> =>
  f.unique([
    ...filterArray(schemaAware ? getUniqueFieldsFromRules(table) : []),
    /*
     * Each attachment is assumed to refer to a unique attachment file
     * See https://github.com/specify/specify7/issues/1754#issuecomment-1157796585
     * Also, https://github.com/specify/specify7/issues/2562
     */
    ...table.relationships
      .filter(({ relatedTable }) => relatedTable.name.endsWith('Attachment'))
      .map(({ name }) => name),
    /*
     * Interaction Preparations should be considered unique for each
     * Interaction
     * See https://github.com/specify/specify7/issues/4012
     */
    ...table.relationships
      .filter(
        ({ relatedTable }) =>
          interactionsWithPrepTables.includes(
            table.name as InteractionWithPreps['tableName']
          ) &&
          interactionPrepTables.includes(
            relatedTable.name as AnyInteractionPreparation['tableName']
          )
      )
      .map(({ name }) => name),
    // Don't clone specifyuser.
    ...(table.name === 'Agent' ? table.relationships.filter(({relatedTable})=>relatedTable.name ==='SpecifyUser').map(({name})=>name) : []),
    ...filterArray(
      uniqueFields.map((fieldName) => table.getField(fieldName)?.name)
    ),
  ]);

export const exportsForTests = {
  getCarryOverPreference,
  getFieldsToClone,
};

setDevelopmentGlobal('_getUniqueFields', (): void => {
  // Batch-editor clones records in independent-to-one no-match cases. It needs to be aware of the fields to not clone. It's fine if it doesn't respect user preferences (for now), but needs to be replicate
  // front-end logic. So, the "fields to not clone" must be identical. This is done by storing them as a static file, which frontend and backend both access + a unit test to make sure the file is up-to-date.
  // In the case where the user is really doesn't want to carry-over some fields, they can simply add those fields in batch-edit query (and then set them to null) so it handles general use case pretty well.
  const allTablesResult = Object.fromEntries(Object.values(tables).map((table)=>[table.name.toLowerCase(), getUniqueFields(table, false)]));
  document.body.textContent = JSON.stringify(allTablesResult);
})
