import { eventListener } from '../../utils/events';
import { addMissingFields } from '../DataModel/addMissingFields';
import { SerializedResource } from '../DataModel/helperTypes';
import { fetchResource as internalFetchResource } from '../DataModel/resource';
import { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';
import type { Nominal } from './nominal';

export type NewResourceRef<TABLE extends keyof Tables> = Nominal<
  string,
  `NewResourceRef_${TABLE}`
>;
export type SavedResourceRef<TABLE extends keyof Tables> = Nominal<
  string,
  `SavedResourceRef_${TABLE}`
>;
export type ResourceRef<TABLE extends keyof Tables> =
  | NewResourceRef<TABLE>
  | SavedResourceRef<TABLE>;

export type NewResource<TABLE_NAME extends keyof Tables> = {
  readonly table: SpecifyTable<Tables[TABLE_NAME]>;
  readonly uuid: number;
  readonly id: undefined;
  readonly data: SerializedResource<Tables[TABLE_NAME]>;
};
export type SavedResource<TABLE_NAME extends keyof Tables> = {
  readonly table: SpecifyTable<Tables[TABLE_NAME]>;
  readonly uuid: number;
  readonly id: number;
  readonly data: SerializedResource<Tables[TABLE_NAME]>;
};
export type Resource<TABLE_NAME extends keyof Tables> =
  | NewResource<TABLE_NAME>
  | SavedResource<TABLE_NAME>;

const savedResourceStore: {
  // eslint-disable-next-line prefer-readonly-type
  [TABLE_NAME in keyof Tables]?: Record<
    number,
    WeakRef<SavedResource<TABLE_NAME>> | undefined
  >;
} = {};
const newResourceStore: {
  // eslint-disable-next-line prefer-readonly-type
  [TABLE_NAME in keyof Tables]?: Record<number, NewResource<TABLE_NAME>>;
} = {};

const makeUuid = () => Math.random();
export async function fetchResource<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number
): Promise<SavedResource<TABLE_NAME>> {
  const savedResource = savedResourceStore[tableName]?.[id]?.deref();
  if (typeof savedResource === 'object') return savedResource;

  // Simplified:
  const data = await internalFetchResource(tableName, id);
  const resource: SavedResource<TABLE_NAME> = {
    table: tables[tableName],
    uuid: makeUuid(),
    id,
    data,
  };

  savedResourceStore[tableName] ??= {};
  savedResourceStore[tableName]![id] = new WeakRef(resource);
  return resource;
}

export const resourceEvents = eventListener<{
  readonly changed: { readonly tableName: keyof Tables; readonly id: number };
}>();

/** Resolve resource ref if possible */
export const getResource = <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number
): SavedResource<TABLE_NAME> | undefined =>
  savedResourceStore[tableName]?.[id]?.deref();

/** Resolve resource ref */
export const resolveResource = <TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number
): SavedResource<TABLE_NAME> =>
  getResource(tableName, id) ??
  error('Unable to resolve the resource', { tableName, id });

export function makeResource<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME
): NewResource<TABLE_NAME> {
  const uuid = makeUuid();
  const resource: NewResource<TABLE_NAME> = {
    table: tables[tableName],
    uuid,
    id: undefined,
    data: addMissingFields(tableName, {}),
  };
  newResourceStore[tableName] ??= {};
  newResourceStore[tableName]![uuid] = resource;
  return resource;
}
