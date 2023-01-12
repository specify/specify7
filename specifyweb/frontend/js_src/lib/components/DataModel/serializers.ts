import { defined } from '../../utils/types';
import { removeKey } from '../../utils/utils';
import { addMissingFields } from './addMissingFields';
import type {
  AnySchema,
  SerializedModel,
  SerializedResource,
} from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { parseResourceUrl, resourceToJson } from './resource';
import { schema, strictGetModel } from './schema';
import type { Tables } from './types';

/** Like resource.toJSON(), but keys are converted to camel case */
export const serializeResource = <SCHEMA extends AnySchema>(
  resource: SerializedModel<SCHEMA> | SpecifyResource<SCHEMA>
): SerializedResource<SCHEMA> =>
  serializeModel<SCHEMA>(
    'toJSON' in resource ? resourceToJson(resource) : resource,
    (resource as SpecifyResource<SCHEMA>)?.specifyModel?.name
  );

const specialFields = new Set([
  'id',
  'resource_uri',
  'recordset_info',
  '_tableName',
]);

/** Recursive helper for serializeResource */
function serializeModel<SCHEMA extends AnySchema>(
  resource: SerializedModel<SCHEMA>,
  tableName?: keyof Tables
): SerializedResource<SCHEMA> {
  const model = strictGetModel(
    defined(
      (tableName as SCHEMA['tableName']) ??
        ('_tableName' in resource
          ? (resource as SerializedResource<SCHEMA>)._tableName
          : undefined) ??
        parseResourceUrl(
          'resource_uri' in resource
            ? (resource as { readonly resource_uri: string }).resource_uri ?? ''
            : ''
        )?.[0],
      `Unable to serialize resource because table name is unknown.${
        process.env.NODE_ENV === 'test'
          ? `\nMake sure your test file calls requireContext();`
          : ''
      }`
    )
  );
  const fields = [...model.fields.map(({ name }) => name), model.idField.name];

  return addMissingFields(
    model.name,
    Object.fromEntries(
      Object.entries(resource).map(([lowercaseFieldName, value]) => {
        let camelFieldName = fields.find(
          (fieldName) => fieldName.toLowerCase() === lowercaseFieldName
        );
        if (camelFieldName === undefined) {
          camelFieldName = lowercaseFieldName;
          if (!specialFields.has(lowercaseFieldName))
            console.warn(
              `Trying to serialize unknown field ${lowercaseFieldName} for table ${model.name}`,
              resource
            );
        }
        if (
          typeof value === 'object' &&
          value !== null &&
          !specialFields.has(camelFieldName)
        ) {
          const field = model.getField(lowercaseFieldName);
          const tableName =
            field === undefined || !field.isRelationship
              ? undefined
              : field.relatedModel.name;
          return [
            camelFieldName,
            Array.isArray(value)
              ? value.map((value) =>
                  serializeModel(
                    value as unknown as SerializedModel<SCHEMA>,
                    tableName
                  )
                )
              : serializeModel(
                  value as unknown as SerializedModel<AnySchema>,
                  tableName
                ),
          ];
        } else return [camelFieldName, value];
      })
    )
  ) as SerializedResource<SCHEMA>;
}

export const deserializeResource = <SCHEMA extends AnySchema>(
  serializedResource: SerializedModel<SCHEMA> | SerializedResource<SCHEMA>
): SpecifyResource<SCHEMA> =>
  new schema.models[
    /**
     * This assertion, while not required by TypeScript, is needed to fix
     * a typechecking performance issue (it was taking 5s to typecheck this
     * line according to TypeScript trace analyzer)
     */
    (serializedResource as SerializedResource<SCHEMA>)._tableName
  ].Resource(removeKey(serializedResource, '_tableName' as 'id'));
