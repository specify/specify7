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
export const COMPONENT_NAME_TAXON_KEY = 'component-taxon-name';

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
