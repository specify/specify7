import type { BusinessRuleDefs } from './businessRuleDefs';
import type { AnySchema, TableFields } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import type { Collection } from './specifyTable';
import type { CollectionObjectGroupJoin, Determination } from './types';

// Save blocker keys used in businessRuleDefs.ts
export const CURRENT_DETERMINATION_KEY = 'determination-isCurrent';
export const COG_TOITSELF = 'cog-toItself';
export const PARENTCOG_KEY = 'cog-parentCog';
export const COG_PRIMARY_KEY = 'cog-isPrimary';
export const DETERMINATION_TAXON_KEY = 'determination-Taxon';
export const PREPARATION_LOANED_KEY = 'preparation-isLoaned';
export const PREPARATION_NEGATIVE_KEY = 'preparation-isNegative';
export const PREPARATION_GIFTED_KEY = 'preparation-isGifted';
export const PREPARATION_DISPOSED_KEY = 'preparation-isDisposed';
export const PREPARATION_EXCHANGED_OUT_KEY = 'preparation-isExchangedOut';
export const PREPARATION_EXCHANGED_IN_KEY = 'preparation-isExchangedIn';
export const COJO_PRIMARY_DELETE_KEY = 'primary-cojo-delete';

/**
 * In tables where a boolean field can designate a "Primary" or important
 * resource in a collection of resources
 * (e.g., `CollectingEvent -> collectors -> isPrimary` or
 * `Determination -> determiners -> isPrimary`), we need business logic to ensure
 * that only a single resource in the collection has the primary designation.
 *
 * This function returns a function that accepts a resource which checks
 * whether the given resource has value in the fieldName, and if so makes sure
 * all other records in the collection have a false value for that field
 *
 * Example:
 * ```js
 * const ensureOnlyPrimary = fieldCheckBoolUniqueInCollection('isPrimary');
 *
 * const collector = new tables.Collector.Resource({id: whatever}).fetch();
 * const determiner = new tables.Determiner.Resource({id: whatever}).fetch();
 * // If collector has true isPrimary, all other Collectors in Collecting Event
 * // now have false isPrimary
 * ensureOnlyPrimary(collector);
 * // If determiner has true isPrimary, all other Determiners in Determination
 * // now have false isPrimary
 * ensureOnlyPrimary(determiner);
 * ```
 */
export function fieldCheckBoolUniqueInCollection<
  SCHEMA extends AnySchema,
  FIELD extends TableFields<SCHEMA> = TableFields<SCHEMA>,
>(fieldName: FIELD) {
  const fieldCheck: Exclude<
    BusinessRuleDefs<SCHEMA>['fieldChecks'],
    undefined
  >[FIELD] = (resource, _field) => {
    if (resource.get(fieldName) && resource.collection !== undefined) {
      resource.collection.models.forEach((other) => {
        if (other.cid !== resource.cid) other.set(fieldName, false as never);
      });
    }
  };
  return fieldCheck;
}

/**
 * In tables where a boolean field can designate a "Primary" or important
 * resource in a collection of resources
 * (e.g., `CollectingEvent -> collectors -> isPrimary` or
 * `Determination -> determiners -> isPrimary`), we need business logic to ensure
 * that only a single resource in the collection has the primary designation.
 *
 * This function returns a function accepting a resource and collection, and
 * handles adding the given resource to the collection, making sure that if no
 * other resource is marked as primary in the collection, the new resource will
 * be the primary resource.
 *
 * Example:
 * ```js
 *
 * const determination = new tables.Determination.Resource(
 *  {determiners: [ { isPrimary: false } ]}
 * );
 * const newDeterminer = new tables.Determiner.Resource();
 *
 * const handleAddingNew = onAddedEnsureBoolInCollection('isPrimary');
 * handleAddingNew(newDeterminer, determination.getDependentResource('determiners'));
 * // newDeterminer will now have isPrimary=true because all others have
 * // isPrimary fasle
 * ```
 */
export function onAddedEnsureBoolInCollection<
  SCHEMA extends AnySchema,
  FIELD extends TableFields<SCHEMA> = TableFields<SCHEMA>,
>(fieldName: FIELD) {
  const onAdded: Exclude<BusinessRuleDefs<SCHEMA>['onAdded'], undefined> = (
    resource,
    collection
  ) => {
    if (
      resource.specifyTable.name !== 'Address' &&
      resource.createdBy !== 'clone'
    ) {
      resource.set(fieldName, false as never);
      if (!collection.models.some((model) => model.get(fieldName)))
        resource.set(fieldName, true as never);
    }
  };
  return onAdded;
}

/**
 *
 * Calculates whether a collection of determinations has any current determinations or not
 * Used in CO -> Determination -> isCurrent business rule
 */
export const hasNoCurrentDetermination = (
  collection: Collection<Determination>
) =>
  collection.models.length > 0 &&
  !collection.models.some((determination: SpecifyResource<Determination>) =>
    determination.get('isCurrent')
  );

/**
 *
 * Ensures only one CO in a COG can be checked as isPrimary or isSubstrate
 * Used in COG business rules: https://github.com/specify/specify7/issues/5246
 */
export const ensureSingleCollectionObjectCheck = (
  cojo: SpecifyResource<CollectionObjectGroupJoin>,
  field: 'isPrimary' | 'isSubstrate'
) => {
  if (cojo.get(field) && cojo.collection !== undefined) {
    cojo.collection.models
      .filter((resource) => resource.get('childCo') !== null)
      .forEach((other: SpecifyResource<CollectionObjectGroupJoin>) => {
        if (other.cid !== cojo.cid) {
          other.set(field, false);
        }
      });
  }
};
