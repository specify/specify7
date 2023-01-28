import { f } from '../../utils/functools';
import type { IR, RA } from '../../utils/types';
import { multiSortFunction, sortFunction } from '../../utils/utils';
import { addMissingFields } from '../DataModel/addMissingFields';
import { resourceToModel, specialFields } from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { getUniqueFields } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import { strictDependentFields } from '../FormMeta/CarryForward';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { unMergeableFields } from './Compare';

// FIXME: add tests for this file
/**
 * Automatically merge n records into one. Used for smart defaults
 */
export function autoMerge(
  model: SpecifyModel,
  rawResources: RA<SerializedResource<AnySchema>>,
  /**
   * Only copy data into the merged record if it is the same between all records
   * Don't try to predict which record to get the data from.
   */
  cautious = true
): SerializedResource<AnySchema> {
  if (rawResources.length === 1) return rawResources[0];
  const resources = sortResources(rawResources);
  const allKeys = f
    .unique(resources.flatMap(Object.keys))
    .filter((fieldName) => !specialFields.has(fieldName))
    .map((fieldName) => model.strictGetField(fieldName));

  return addMissingFields(
    model.name,
    mergeDependentFields(
      resources,
      Object.fromEntries(
        allKeys.map((field) => [
          field.name,
          mergeField(field, resources, cautious),
        ])
      )
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
  resources: RA<SerializedResource<AnySchema>>,
  cautious: boolean
) {
  const values = resources.map((resource) => resource[field.name]);
  const nonFalsyValues = f.unique(values.filter(Boolean));
  const firstValue = nonFalsyValues[0] ?? values[0];
  if (field.isRelationship)
    if (field.isDependent())
      if (relationshipIsToMany(field)) {
        const records = nonFalsyValues as unknown as RA<
          RA<SerializedResource<AnySchema>>
        >;
        // Remove duplicates
        return f
          .unique(
            records
              .flat()
              .map((value) => resourceToGeneric(value, false))
              .map((resource) => JSON.stringify(resource))
          )
          .map((resource) => JSON.parse(resource));
      } else
        return autoMerge(
          field.relatedModel,
          nonFalsyValues as unknown as RA<SerializedResource<AnySchema>>,
          cautious
        );
    else return firstValue;
  // Don't try to merge conflicts
  else if (nonFalsyValues.length > 1 && cautious) return null;
  else if (nonFalsyValues.length > 0)
    // Pick the longest value
    return (
      Array.from(nonFalsyValues).sort(
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
export const resourceToGeneric = (
  resource: SerializedResource<AnySchema>,
  // Whether to also clear away unique fields
  strong: boolean
): SerializedResource<AnySchema> => {
  const uniqueFields = new Set(
    strong ? getUniqueFields(resourceToModel(resource)) : []
  );
  return Object.fromEntries(
    Object.entries(resource)
      .filter(([key]) => !unMergeableFields.has(key) && !uniqueFields.has(key))
      .map(([key, value]) => [
        key,
        Array.isArray(value)
          ? value.map((value) => resourceToGeneric(value, strong))
          : typeof value === 'object' && value !== null
          ? resourceToGeneric(value, strong)
          : value,
      ])
  ) as SerializedResource<AnySchema>;
};

/**
 * If date1 was gotten from the 2nd resource, then also get date1precision from
 * the 2nd resource
 */
const mergeDependentFields = (
  resources: RA<SerializedResource<AnySchema>>,
  merged: IR<ReturnType<typeof mergeField>>
): IR<ReturnType<typeof mergeField>> =>
  Object.fromEntries(
    Object.entries(merged).map(([fieldName, value]) => [
      fieldName,
      fieldName in strictDependentFields()
        ? mergeDependentField(
            resources,
            fieldName,
            merged[strictDependentFields()[fieldName]]
          )
        : value,
    ])
  );

function mergeDependentField(
  resources: RA<SerializedResource<AnySchema>>,
  fieldName: string,
  sourceValue: ReturnType<typeof mergeField>
): ReturnType<typeof mergeField> {
  const sourceField = strictDependentFields()[fieldName];
  const sourceResource = resources.find(
    (resource) => resource[sourceField] === sourceValue
  );
  return sourceResource?.[fieldName] ?? null;
}
