import { f } from '../../utils/functools';
import type { IR, RA, RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { multiSortFunction, sortFunction } from '../../utils/utils';
import { addMissingFields } from '../DataModel/addMissingFields';
import {
  deserializeResource,
  resourceToModel,
  specialFields,
} from '../DataModel/helpers';
import type { AnySchema, SerializedResource } from '../DataModel/helperTypes';
import { getUniqueFields } from '../DataModel/resource';
import type { LiteralField, Relationship } from '../DataModel/specifyField';
import type { SpecifyModel } from '../DataModel/specifyModel';
import type { AgentVariant, Tables } from '../DataModel/types';
import { strictDependentFields } from '../FormMeta/CarryForward';
import { format } from '../Forms/dataObjFormatters';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { unMergeableFields } from './Compare';
import { getUserPref } from '../UserPreferences/helpers';

/**
 * Automatically merge n records into one. Used for smart defaults
 */
export function autoMerge(
  model: SpecifyModel,
  // REFACTOR: replace all usages of "resource" with "record" for consistency
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

/**
 * Table specific auto merge steps
 */
export const postMergeResource = async (
  resources: RA<SerializedResource<AnySchema>>,
  merged: IR<ReturnType<typeof mergeField>>
): Promise<IR<ReturnType<typeof mergeField>>> =>
  postProcessors[resources?.[0]._tableName]?.(resources, merged) ?? merged;

const postProcessors: Partial<RR<keyof Tables, typeof postMergeResource>> = {
  // Add agent variants
  async Agent(resources, merged) {
    if (!getUserPref('recordMerging', 'agent', 'createVariants')) return merged;

    const [formattedMerged, ...formattedResources] = await Promise.all(
      [merged as SerializedResource<AnySchema>, ...resources].map(
        async (resource) =>
          format(deserializeResource(resource)).then((value) => value ?? '')
      )
    );
    const final = formattedMerged.trim().toLowerCase();
    // FEATURE: detect typos and exclude them from variants (#2913)
    const variants = filterArray(
      f.unique(formattedResources.map((formatted) => formatted?.trim()))
    ).filter((name) => name.toLowerCase() !== final && name.length > 0);
    const currentVariants = merged.variants as
      | RA<SerializedResource<AgentVariant>>
      | undefined;
    const existingNames = currentVariants?.map(({ name }) => name);
    const newVariants = variants.filter(
      (variant) => existingNames?.includes(variant) === false
    );
    return {
      ...merged,
      variants: [
        ...(currentVariants ?? []),
        ...newVariants.map((name) =>
          addMissingFields('AgentVariant', { name })
        ),
      ],
    };
  },
};
