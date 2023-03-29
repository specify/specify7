import { parserFromType } from '../../utils/parser/definitions';
import type { RA } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { formatUrl } from '../Router/queryString';
import { relationshipIsToMany } from '../WbPlanView/mappingHelpers';
import { getScopingResource } from './domain';
import type { AnySchema, SerializedResource } from './helperTypes';
import { strictGetModel } from './schema';
import type { LiteralField, Relationship } from './specifyField';
import type { Tables } from './types';

type ResourceSpec = {
  readonly requiredFields: 'define' | 'omit' | 'set';
  readonly optionalFields: 'define' | 'omit' | 'set';
  readonly toManyRelationships: 'define' | 'omit' | 'set';
  readonly requiredRelationships: 'define' | 'omit' | 'set';
  readonly optionalRelationships: 'define' | 'omit' | 'set';
};

/**
 * This function can:
 * Set missing required fields to literals.
 * Set missing optional fields to null
 * Set missing -to-many relationships to null
 * Set missing dependent -to-one relationships to new objects
 * Do all of these recursively
 */
export function addMissingFields<TABLE_NAME extends keyof Tables>(
  tableName: TABLE_NAME,
  record: Partial<SerializedResource<Tables[TABLE_NAME]>>,
  {
    requiredFields = 'set',
    optionalFields = 'define',
    toManyRelationships = 'set',
    requiredRelationships = 'set',
    optionalRelationships = 'define',
  }: Partial<ResourceSpec> = {}
): SerializedResource<Tables[TABLE_NAME]> {
  const model = strictGetModel(tableName);
  const spec = {
    requiredFields,
    optionalFields,
    toManyRelationships,
    requiredRelationships,
    optionalRelationships,
  };

  const scoping = getScopingResource(model);

  return {
    // This is needed to preserve unknown fields
    ...record,
    ...(Object.fromEntries(
      filterArray(
        model.fields.map((field) =>
          shouldIncludeField(field, spec, record.id === undefined)
            ? [
                field.name,
                field.isRelationship
                  ? handleRelationship(record, field, spec)
                  : record[field.name as keyof typeof record] ??
                    (field.name === 'version'
                      ? 1
                      : (
                          field.isRequired
                            ? requiredFields === 'set'
                            : optionalFields === 'set'
                        )
                      ? parserFromType(field.type).value
                      : null),
              ]
            : undefined
        )
      )
    ) as SerializedResource<Tables[TABLE_NAME]>),
    ...(scoping === undefined
      ? undefined
      : {
          [scoping.relationship.name]:
            record[scoping.relationship.name as 'id'] ??
            (typeof record.id === 'number' ? undefined : scoping.resourceUrl) ??
            null,
        }),
    /*
     * REFACTOR: convert all usages of this to camel case
     */
    resource_uri: record.resource_uri,
    // REFACTOR: consider replacing this with a symbol
    _tableName: tableName,
  };
}

function shouldIncludeField(
  field: LiteralField | Relationship,
  {
    requiredFields,
    optionalFields,
    toManyRelationships,
    requiredRelationships,
    optionalRelationships,
  }: ResourceSpec,
  isNew: boolean
): boolean {
  if (field.isRelationship) {
    if (relationshipIsToMany(field)) {
      return !field.isDependent() && isNew
        ? false
        : toManyRelationships !== 'omit' && field.type !== 'many-to-many';
    } else
      return (
        (field.isRequired ? requiredRelationships : optionalRelationships) !==
        'omit'
      );
  } else return (field.isRequired ? requiredFields : optionalFields) !== 'omit';
}

function handleRelationship<TABLE_NAME extends keyof Tables>(
  record: Partial<SerializedResource<Tables[TABLE_NAME]>>,
  field: Relationship,
  spec: ResourceSpec
) {
  if (relationshipIsToMany(field))
    if (field.isDependent()) {
      const records = record[field.name as keyof typeof record] as
        | RA<Partial<SerializedResource<AnySchema>>>
        | undefined;
      return (
        records?.map((record) =>
          addMissingFields(field.relatedModel.name, record, spec)
        ) ?? (spec.toManyRelationships === 'set' ? [] : null)
      );
    } else {
      const otherSideName = field.getReverse()?.name;
      return (
        record[field.name as keyof Tables[TABLE_NAME]['toManyIndependent']] ??
        (typeof otherSideName === 'string' && typeof record.id === 'number'
          ? formatUrl(`/api/specify/${field.relatedModel.name}`, {
              [otherSideName]: record.id.toString(),
            })
          : undefined)
      );
    }
  else {
    const shouldSet = field.isRequired
      ? spec.requiredRelationships === 'set'
      : spec.optionalRelationships === 'set';
    return (
      record[field.name as keyof typeof record] ??
      (field.isDependent() && shouldSet
        ? addMissingFields(
            field.relatedModel.name,
            (record[field.name as keyof typeof record] as Partial<
              SerializedResource<AnySchema>
            >) ?? {},
            spec
          )
        : null)
    );
  }
}
