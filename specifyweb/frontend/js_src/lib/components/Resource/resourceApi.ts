import { eventListener } from '../../utils/events';
import { addMissingFields } from '../DataModel/addMissingFields';
import { SerializedResource } from '../DataModel/helperTypes';
import {
  createResource as internalCreateResource,
  fetchResource as internalFetchResource,
} from '../DataModel/resource';
import { SpecifyTable } from '../DataModel/specifyTable';
import { tables } from '../DataModel/tables';
import type { Tables } from '../DataModel/types';
import { error } from '../Errors/assert';

export type NewResourceRef<TABLE_NAME extends keyof Tables> = {
  readonly table: SpecifyTable<Tables[TABLE_NAME]>;
  readonly id: string;
};

export type SavedResourceRef<TABLE_NAME extends keyof Tables> = {
  readonly table: SpecifyTable<Tables[TABLE_NAME]>;
  readonly id: number;
};

export type ResourceRef<TABLE_NAME extends keyof Tables> =
  | NewResourceRef<TABLE_NAME>
  | SavedResourceRef<TABLE_NAME>;

export type NewResource<TABLE_NAME extends keyof Tables> =
  NewResourceRef<TABLE_NAME> & {
    readonly ref: NewResourceRef<TABLE_NAME>;
    readonly data: SerializedResource<Tables[TABLE_NAME]>;
  };

export type SavedResource<TABLE_NAME extends keyof Tables> =
  SavedResourceRef<TABLE_NAME> & {
    readonly ref: SavedResourceRef<TABLE_NAME>;
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
  [TABLE_NAME in keyof Tables]?:
    | Record<string, WeakRef<NewResource<TABLE_NAME>>>
    | undefined;
} = {};

const makeUuid = () => Math.random().toString();
export async function fetchResource<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  id: number
): Promise<SavedResource<TABLE_NAME>> {
  const savedResource = savedResourceStore[tableName]?.[id]?.deref();
  if (typeof savedResource === 'object') return savedResource;

  // Simplified:
  const data = await internalFetchResource(tableName, id);
  const ref: SavedResourceRef<TABLE_NAME> = {
    table: tables[tableName],
    id,
  };
  const resource: SavedResource<TABLE_NAME> = { ...ref, ref, data };

  savedResourceStore[tableName] ??= {};
  savedResourceStore[tableName]![id] = new WeakRef(resource);
  return resource;
}

export const resourceEvents = eventListener<{
  readonly changed: SavedResource<keyof Tables>;
}>();

/** Resolve resource ref if possible */
export const getResource = <TABLE_NAME extends keyof Tables>({
  table: { name },
  id,
}: SavedResourceRef<TABLE_NAME>): SavedResource<TABLE_NAME> | undefined =>
  // FIXME: figure out why this type assertion is needed
  savedResourceStore[name as TABLE_NAME]?.[id]?.deref();

/** Resolve resource ref */
export const resolveResource = <TABLE_NAME extends keyof Tables>(
  ref: SavedResourceRef<TABLE_NAME>
): SavedResource<TABLE_NAME> =>
  getResource(ref) ?? error('Unable to resolve the resource', ref);

export function makeResource<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME
): NewResource<TABLE_NAME> {
  const uuid = makeUuid();
  const ref: NewResourceRef<TABLE_NAME> = {
    table: tables[tableName],
    id: makeUuid(),
  };
  const resource: NewResource<TABLE_NAME> = {
    ...ref,
    ref,
    data: addMissingFields(tableName, {}),
  };

  newResourceStore[tableName] ??= {};
  const tableRecords = newResourceStore[tableName];
  // FIXME: this is a needless check, but typescript requires it. why?
  if (tableRecords) tableRecords[uuid] = new WeakRef(resource);

  return resource;
}

export async function createResource<TABLE_NAME extends keyof Tables>(
  resource: NewResource<TABLE_NAME>
): Promise<SavedResource<TABLE_NAME>> {
  const tableName = resource.table.name;
  // FIXME: figure out typing
  const data = await internalCreateResource(tableName, resource.data);
  const savedResource = {
    ...resource,
    id: data.id,
    ref: {
      ...resource.ref,
      id: data.id,
    },
  };

  savedResourceStore[tableName] ??= {};
  const tableRecords = savedResourceStore[tableName];
  // FIXME: figure out typing
  if (tableRecords) tableRecords[data.id] = new WeakRef(savedResource);

  return savedResource;
}
