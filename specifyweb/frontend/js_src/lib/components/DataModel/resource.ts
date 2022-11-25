import { ajax } from '../../utils/ajax';
import { ping } from '../../utils/ajax/ping';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { defined } from '../../utils/types';
import { keysToLowerCase, removeKey } from '../../utils/utils';
import { formatUrl } from '../Router/queryString';
import { businessRuleDefs } from './businessRuleDefs';
import { serializeResource } from './helpers';
import type {
  AnySchema,
  SerializedModel,
  SerializedResource,
  TableFields,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { getModel, schema } from './schema';
import type { SpecifyModel } from './specifyModel';
import type { Tables } from './types';
import { addMissingFields } from './addMissingFields';
import { Http } from '../../utils/ajax/definitions';
import { getUserPref } from '../UserPreferences/helpers';

/*
 * REFACTOR: experiment with an object singleton:
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
  SCHEMA extends Tables[TABLE_NAME],
  STRICT extends boolean = true
>(
  tableName: TABLE_NAME,
  id: number,
  // @ts-expect-error Whether to trigger 404 on resource not foudn
  strict: STRICT = true
): Promise<
  SerializedResource<SCHEMA> | (STRICT extends true ? never : undefined)
> =>
  ajax<SerializedModel<SCHEMA>>(
    `/api/specify/${tableName.toLowerCase()}/${id}/`,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { headers: { Accept: 'application/json' } },
    strict ? undefined : { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
  ).then(({ data: record, status }) =>
    status === Http.NOT_FOUND ? undefined! : serializeResource(record)
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
): Promise<SerializedResource<Tables[TABLE_NAME]>> =>
  ajax<SerializedModel<Tables[TABLE_NAME]>>(
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
  resourceId: number | string | undefined,
  recordSetId?: number
): string {
  if (resourceId === undefined)
    return `/api/specify/${tableName.toLowerCase()}/`;
  const url = `/api/specify/${tableName.toLowerCase()}/${resourceId}/`;
  return typeof recordSetId === 'number'
    ? formatUrl(url, { recordSetId: recordSetId.toString() })
    : url;
}

export function parseResourceUrl(
  resourceUrl: string
): readonly [modelName: keyof Tables, id: number | undefined] | undefined {
  const parsed = /^\/api\/specify\/(\w+)\/(?:(\d+)\/)?$/u
    .exec(resourceUrl)
    ?.slice(1);
  const tableName = getModel(parsed?.[0] ?? '')?.name;
  return Array.isArray(parsed) && typeof tableName === 'string'
    ? [tableName, f.parseInt(parsed[1])]
    : undefined;
}

export const strictParseResourceUrl = (
  resourceUrl: string
): readonly [modelName: keyof Tables, id: number | undefined] =>
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
  options?: ConstructorParameters<SpecifyModel['Resource']>[1]
): SpecifyResource<AnySchema> | undefined {
  const parsed = parseResourceUrl(resourceUrl);
  if (parsed === undefined) return undefined;
  const [tableName, id] = parsed;
  const model = new schema.models[tableName].Resource({ id }, options);
  return model;
}

/**
 * This needs to exist outside of Resorce definition due to type conflicts
 * between AnySchema and table schemas defined in datamodel.ts
 */
export const resourceToJson = <SCHEMA extends AnySchema>(
  resource: SpecifyResource<SCHEMA>
): SerializedModel<SCHEMA> => resource.toJSON() as SerializedModel<SCHEMA>;

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
export const parseJavaClassName = (className: string): string =>
  className.split('.').at(-1) ?? '';

export function getFieldsToNotClone(model: SpecifyModel): RA<string> {
  const fieldsToClone = getFieldsToClone(model);
  const uniqueFields = getUniqueFields(model);
  return model.fields
    .map(({ name }) => name)
    .filter(
      (fieldName) =>
        uniqueFields.includes(fieldName) || !fieldsToClone.includes(fieldName)
    );
}

const getFieldsToClone = (model: SpecifyModel): RA<string> =>
  getUserPref('form', 'preferences', 'carryForward')?.[model.name] ??
  model.fields.filter(({ isVirtual }) => !isVirtual).map(({ name }) => name);

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

export const getUniqueFields = (model: SpecifyModel): RA<string> =>
  f.unique([
    ...Object.entries(businessRules[model.name]?.uniqueIn ?? {})
      .filter(
        ([_fieldName, uniquenessRules]) =>
          typeof uniquenessRules === 'string' &&
          uniquenessRules in schema.domainLevelIds
      )
      .map(([fieldName]) => model.strictGetField(fieldName).name),
    /*
     * Each attachment is assumed to refer to a unique attachment file
     * See https://github.com/specify/specify7/issues/1754#issuecomment-1157796585
     */
    ...model.relationships
      .filter(({ relatedModel }) => relatedModel.name === 'Attachment')
      .map(({ name }) => name),
    /*
     * Disable carry over for GUIDs
     * See https://github.com/specify/specify7/issues/2492#issuecomment-1327780411
     */
    'guid',
  ]);

export const exportsForTests = {
  getFieldsToClone,
};
