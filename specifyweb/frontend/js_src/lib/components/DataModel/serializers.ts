import { defined } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { addMissingFields } from './addMissingFields';
import type {
  AnySchema,
  SerializedRecord,
  SerializedResource,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { parseResourceUrl, resourceToJson } from './resource';
import { strictGetTable, tables } from './tables';
import type { Tables } from './types';

/** Like resource.toJSON(), but keys are converted to camel case */
export const serializeResource = <SCHEMA extends AnySchema>(
  resource: SerializedRecord<SCHEMA> | SpecifyResource<SCHEMA>
): SerializedResource<SCHEMA> =>
  serializeRecord<SCHEMA>(
    'toJSON' in resource ? resourceToJson(resource) : resource,
    (resource as SpecifyResource<SCHEMA>)?.specifyTable?.name
  );

const specialFields = new Set([
  'id',
  'resource_uri',
  'recordset_info',
  '_tableName',
]);

/** Recursive helper for serializeResource */
function serializeRecord<SCHEMA extends AnySchema>(
  resource: SerializedRecord<SCHEMA>,
  tableName?: keyof Tables
): SerializedResource<SCHEMA> {
  const table = strictGetTable(
    defined(
      (tableName as SCHEMA['tableName']) ??
        ('_tableName' in resource
          ? (resource as SerializedResource<SCHEMA>)._tableName
          : undefined) ??
        parseResourceUrl(
          (resource as { readonly resource_uri: string }).resource_uri ?? ''
        )?.[0],
      `Unable to serialize resource because table name is unknown.${
        process.env.NODE_ENV === 'test'
          ? `\nMake sure your test file calls requireContext();`
          : ''
      }`
    )
  );
  const fields = [...table.fields.map(({ name }) => name), table.idField.name];

  return addMissingFields(
    table.name,
    Object.fromEntries(
      Object.entries(resource).map(([rawFieldName, value]) => {
        const lowerCaseFieldName = rawFieldName.toLowerCase();
        let camelFieldName = fields.find(
          (fieldName) => fieldName.toLowerCase() === lowerCaseFieldName
        );
        if (camelFieldName === undefined) {
          camelFieldName = rawFieldName;
          if (
            !specialFields.has(lowerCaseFieldName) &&
            !specialFields.has(rawFieldName)
          )
            console.warn(
              `Trying to serialize unknown field ${rawFieldName} for table ${table.name}`,
              resource
            );
        }
        if (
          typeof value === 'object' &&
          value !== null &&
          !specialFields.has(camelFieldName)
        ) {
          const field = table.getField(rawFieldName);
          const tableName =
            field === undefined || !field.isRelationship
              ? undefined
              : field.relatedTable.name;
          return [
            camelFieldName,
            Array.isArray(value)
              ? value.map((value) =>
                  serializeRecord(
                    value as unknown as SerializedRecord<SCHEMA>,
                    tableName
                  )
                )
              : serializeRecord(
                  value as unknown as SerializedRecord<AnySchema>,
                  tableName
                ),
          ];
        } else return [camelFieldName, value];
      })
    )
  ) as SerializedResource<SCHEMA>;
}

export const deserializeResource = <SCHEMA extends AnySchema>(
  serializedResource: SerializedRecord<SCHEMA> | SerializedResource<SCHEMA>
): SpecifyResource<SCHEMA> =>
  new tables[
    /**
     * This assertion, while not required by TypeScript, is needed to fix
     * a typechecking performance issue (it was taking 5s to typecheck this
     * line according to TypeScript trace analyzer)
     */
    (serializedResource as SerializedResource<SCHEMA>)._tableName
  ].Resource(removeKey(serializedResource, '_tableName' as 'id'));
