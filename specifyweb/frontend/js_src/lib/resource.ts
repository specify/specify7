import { ajax, Http } from './ajax';
import type { Tables } from './datamodel';
import type {
  AnySchema,
  SerializedModel,
  SerializedResource,
} from './datamodelutils';
import { serializeResource } from './datamodelutils';
import type { SpecifyResource } from './legacytypes';
import * as queryString from './querystring';
import { getModel } from './schema';
import { defined } from './types';

export const fetchResource = async <
  TABLE_NAME extends keyof Tables,
  SCHEMA extends Tables[TABLE_NAME]
>(
  tableName: TABLE_NAME,
  id: number
): Promise<SerializedResource<SCHEMA> | undefined> =>
  ajax<SerializedModel<SCHEMA>>(
    `/api/specify/${tableName}/${id}`,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    { headers: { Accept: 'application/json' } },
    { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
  ).then(({ data: record, status }) =>
    status === Http.NOT_FOUND ? undefined : serializeResource(record)
  );

export function resourceViewUrl(
  tableName: keyof Tables,
  resourceId: number | 'new' = 'new',
  recordSetId?: number
): string {
  const url = `/specify/view/${tableName.toLowerCase()}/${resourceId}/`;
  return typeof recordSetId === 'number'
    ? queryString.format(url, { recordsetid: recordSetId.toString() })
    : url;
}

export function resourceApiUrl(
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
