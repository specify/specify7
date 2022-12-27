import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { multiSortFunction, sortFunction } from '../../utils/utils';
import { addMissingFields } from '../DataModel/addMissingFields';
import { specialFields } from '../DataModel/helpers';
import type {
  AnySchema,
  SerializedModel,
  SerializedResource,
} from '../DataModel/helperTypes';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';

/**
 * Automatically merge n records into one. Used for smart defaults
 */
export function autoMerge(
  model: SpecifyModel,
  rawResources: RA<SerializedResource<AnySchema>>
): SerializedResource<AnySchema> {
  if (rawResources.length === 1) return rawResources[0];
  const resources = sortResources(rawResources);
  return addMissingFields(
    model.name,
    Object.fromEntries(
      f
        .unique(resources.flatMap(Object.keys))
        .filter((fieldName) => !specialFields.has(fieldName))
        .map((fieldName) => [
          fieldName,
          mergeField(model.strictGetField(fieldName), resources),
        ])
    )
  );
}

/**
 * Sort from newest to oldest
 */
const sortResources = (
  resources: RA<SerializedResource<AnySchema>>
): RA<SerializedResource<AnySchema>> =>
  Array.from(resources).sort(
    multiSortFunction(
      (resource) => resource.timestampModified ?? '',
      true,
      (resource) => resource.timestampCreated ?? '',
      true,
      (resource) => resource.id ?? '',
      true
    )
  );

function mergeField(
  field: LiteralField | Relationship,
  resources: RA<SerializedResource<AnySchema>>
) {
  const values = resources.map((resource) => resource[field.name]);
  const nonNullValues = values.filter(
    (value) =>
      value !== undefined && value !== null && value !== false && value !== ''
  );
  const firstValue = nonNullValues[0] ?? values[0];
  if (field.isRelationship)
    if (field.isDependent())
      if (relationshipIsToMany(field)) {
        const records = nonNullValues as unknown as RA<
          RA<SerializedResource<AnySchema>>
        >;
        // Remove duplicates
        return f
          .unique(
            records
              .flat()
              .map(resourceToGeneric)
              .map((resource) => JSON.stringify(resource))
          )
          .map((resource) => JSON.parse(resource));
      } else
        return autoMerge(
          field.relatedModel,
          nonNullValues as unknown as RA<SerializedResource<AnySchema>>
        );
    else return firstValue;
  else if (typeof nonNullValues[0] === 'string')
    return (
      nonNullValues.sort(
        sortFunction((string) =>
          typeof string === 'string' ? string.length : 0
        )
      )[0] ?? firstValue
    );
  else return firstValue;
}

/**
 * Remove id and resource_uri from resource and sub resources. Useful when
 * comparing whether two records are identical
 */
export const resourceToGeneric = <
  T extends SerializedModel<AnySchema> | SerializedResource<AnySchema>
>(
  resource: T
): T =>
  Object.fromEntries(
    Object.entries(resource)
      .filter(([key]) => !specialFields.has(key))
      .map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map(resourceToGeneric)
          : typeof value === 'object' && value !== null
          ? resourceToGeneric(value)
          : value,
      ])
  ) as T;
