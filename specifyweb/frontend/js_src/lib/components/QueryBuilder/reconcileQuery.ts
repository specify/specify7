import _ from 'underscore';

import type { IR, RA } from '../../utils/types';
import { group } from '../../utils/utils';
import type { SerializedResource } from '../DataModel/helperTypes';
import { getTableById } from '../DataModel/tables';
import type { SpQuery, SpQueryField } from '../DataModel/types';
import { parseQueryFields, unParseQueryFields } from './helpers';

type Definition = SerializedResource<SpQuery>;
const resourceMetadata = [
  'id',
  'resource_uri',
  'version',
  'timestampCreated',
  'timestampModified',
  'createdByAgent',
  'modifiedByAgent',
] as const;
const fieldMetadata = new Set<string>([
  ...resourceMetadata,
  'query',
  'mappings',
]);

/** Keep server field properties that the builder does not expose as controls. */
export function completeQueryFields(
  query: Definition,
  fields: RA<SerializedResource<SpQueryField>>
): RA<SerializedResource<SpQueryField>> {
  const remaining = [...query.fields];
  return fields.map((field) => {
    const index = remaining.findIndex(
      (saved) => saved.stringId.toLowerCase() === field.stringId.toLowerCase()
    );
    const saved = index < 0 ? undefined : remaining.splice(index, 1)[0];
    return { ...saved, ...field };
  });
}
export type QueryConflict = {
  readonly path: string;
  readonly local: unknown;
  readonly server: unknown;
};
export type QueryResolutions = IR<'local' | 'server'>;

const queryProperties = (query: Definition) => ({
  ..._.omit(query, 'fields', ...resourceMetadata),
  selectDistinct: query.selectDistinct ?? false,
  searchSynonymy: query.searchSynonymy ?? false,
  smushed: query.smushed ?? false,
});

function normalize(query: Definition): Definition {
  return {
    ...query,
    ...queryProperties(query),
    // Compare canonical builder definitions, without treating record IDs,
    // versions, or nullable serialization defaults as user edits.
    fields: completeQueryFields(
      query,
      unParseQueryFields(
        getTableById(query.contextTableId).name,
        parseQueryFields(query.fields ?? [])
      )
    ).map(
      (field) =>
        Object.fromEntries(
          Object.entries(field).filter(([key]) => !fieldMetadata.has(key))
        ) as SerializedResource<SpQueryField>
    ),
  };
}

export const queryPropertiesEqual = (
  left: Definition,
  right: Definition
): boolean => _.isEqual(queryProperties(left), queryProperties(right));

export function reconcileQuery(
  baseline: Definition,
  local: Definition,
  server: Definition,
  resolutions: QueryResolutions = {}
): {
  readonly definition: Definition;
  readonly conflicts: RA<QueryConflict>;
} {
  const conflicts: QueryConflict[] = [];
  function choose<T>(base: T, ours: T, theirs: T, path: string): T {
    if (_.isEqual(ours, base)) return theirs;
    if (_.isEqual(theirs, base) || _.isEqual(ours, theirs)) return ours;
    const resolution = resolutions[path];
    if (resolution !== undefined) return resolution === 'local' ? ours : theirs;
    conflicts.push({ path, local: ours, server: theirs });
    return ours;
  }

  function mergeProperties<T extends IR<unknown>>(
    base: T,
    ours: T,
    theirs: T,
    prefix = ''
  ): T {
    return Object.fromEntries(
      Object.keys(theirs).map((key) => [
        key,
        resourceMetadata.some((name) => name === key)
          ? theirs[key]
          : choose(base[key], ours[key], theirs[key], `${prefix}${key}`),
      ])
    ) as T;
  }

  const base = normalize(baseline);
  const ours = normalize(local);
  const theirs = normalize(server);
  const byPath = (query: Definition) =>
    new Map(group(query.fields.map((field) => [field.stringId, field])));
  const [baseFields, localFields, serverFields] = [base, ours, theirs].map(
    byPath
  );
  const fields = [
    ...new Set([
      ...baseFields.keys(),
      ...localFields.keys(),
      ...serverFields.keys(),
    ]),
  ]
    .flatMap((key) => {
      const before = baseFields.get(key);
      const local = localFields.get(key);
      const remote = serverFields.get(key);
      const path = `fields.${key}`;
      // OR filters share a path and must be resolved together.
      return before?.length === 1 && local?.length === 1 && remote?.length === 1
        ? [mergeProperties(before[0], local[0], remote[0], `${path}.`)]
        : (choose(before, local, remote, path) ?? []);
    })
    .sort((left, right) => left.position - right.position);

  return {
    definition: {
      ...mergeProperties(
        { ...base, fields: [] },
        { ...ours, fields: [] },
        { ...theirs, fields: [] }
      ),
      fields: completeQueryFields(server, fields),
    },
    conflicts,
  };
}
