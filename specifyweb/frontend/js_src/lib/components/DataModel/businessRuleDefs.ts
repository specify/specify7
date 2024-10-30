import { resourcesText } from '../../localization/resources';
import { f } from '../../utils/functools';
import type { BusinessRuleResult } from './businessRules';
import {
  CURRENT_DETERMINATION_KEY,
  DETERMINATION_TAXON_KEY,
  ensureSingleCollectionObjectCheck,
  hasNoCurrentDetermination,
} from './businessRuleUtils';
import { cogTypes } from './helpers';
import type { AnySchema, TableFields } from './helperTypes';
import {
  checkPrepAvailability,
  getTotalLoaned,
  getTotalResolved,
  getTotalReturned,
  previousLoanPreparations,
  updateLoanPrep,
} from './interactionBusinessRules';
import type { SpecifyResource } from './legacyTypes';
import { fetchResource, idFromUrl } from './resource';
import { setSaveBlockers } from './saveBlockers';
import { schema } from './schema';
import type { Collection } from './specifyTable';
import { tables } from './tables';
import type {
  Address,
  BorrowMaterial,
  CollectionObject,
  CollectionObjectGroupJoin,
  Determination,
  DNASequence,
  LoanPreparation,
  LoanReturnPreparation,
  Tables,
  Taxon,
} from './types';

export type BusinessRuleDefs<SCHEMA extends AnySchema> = {
  readonly onAdded?: (
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ) => void;
  readonly onRemoved?: (
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ) => void;
  readonly customInit?: (resource: SpecifyResource<SCHEMA>) => void;
  readonly fieldChecks?: {
    readonly [FIELD_NAME in TableFields<SCHEMA>]?: (
      resource: SpecifyResource<SCHEMA>
    ) => Promise<BusinessRuleResult | undefined> | void;
  };
};

type MappedBusinessRuleDefs = {
  readonly [TABLE in keyof Tables]?: BusinessRuleDefs<Tables[TABLE]>;
};

export const businessRuleDefs: MappedBusinessRuleDefs = {
  Address: {
    customInit: (address) => {
      if (address.isNew()) {
        const setPrimary = (): void => {
          address.set('isPrimary', true);
          if (address.collection !== undefined) {
            address.collection.models.forEach(
              (other: SpecifyResource<Address>) => {
                if (other.cid !== address.cid) other.set('isPrimary', false);
              }
            );
          }
        };
        address.on('add', setPrimary);
      }
    },
    fieldChecks: {
      isPrimary: async (address): Promise<BusinessRuleResult> => {
        if (address.get('isPrimary') === true) {
          address.collection?.models.forEach(
            (other: SpecifyResource<Address>) => {
              if (other.cid !== address.cid) {
                other.set('isPrimary', false);
              }
            }
          );
        }
        if (
          address.collection !== undefined &&
          !address.collection?.models.some((c: SpecifyResource<Address>) =>
            c.get('isPrimary')
          )
        ) {
          address.set('isPrimary', true);
        }
        return { isValid: true };
      },
    },
  },
  BorrowMaterial: {
    fieldChecks: {
      quantityReturned: (
        borrowMaterial: SpecifyResource<BorrowMaterial>
      ): void => {
        const returned = borrowMaterial.get('quantityReturned');
        const resolved = borrowMaterial.get('quantityResolved');
        const quantity = borrowMaterial.get('quantity');

        const adjustedReturned =
          typeof quantity === 'number' &&
          typeof returned === 'number' &&
          typeof resolved === 'number'
            ? returned > quantity
              ? quantity
              : returned > resolved
              ? resolved
              : returned
            : undefined;
        if (typeof adjustedReturned === 'number')
          borrowMaterial.set('quantityReturned', adjustedReturned);
      },
      quantityResolved: (
        borrowMaterial: SpecifyResource<BorrowMaterial>
      ): void => {
        const resolved = borrowMaterial.get('quantityResolved');
        const quantity = borrowMaterial.get('quantity');
        const returned = borrowMaterial.get('quantityReturned');

        const adjustedResolved =
          typeof quantity === 'number' &&
          typeof returned === 'number' &&
          typeof resolved === 'number'
            ? resolved > quantity
              ? quantity
              : resolved < returned
              ? returned
              : resolved
            : undefined;

        if (typeof adjustedResolved === 'number')
          borrowMaterial.set('quantityResolved', adjustedResolved);
      },
    },
  },

  CollectionObject: {
    customInit: (collectionObject: SpecifyResource<CollectionObject>): void => {
      const ceField = collectionObject.specifyTable.getField('collectingEvent');
      if (
        ceField?.isDependent() &&
        collectionObject.get('collectingEvent') === undefined
      ) {
        collectionObject.set(
          'collectingEvent',
          new tables.CollectingEvent.Resource()
        );
      }

      // Set the default CoType
      if (
        typeof schema.defaultCollectionObjectType === 'string' &&
        typeof collectionObject.get('collectionObjectType') !== 'string'
      )
        collectionObject.set(
          'collectionObjectType',
          schema.defaultCollectionObjectType
        );
    },
    fieldChecks: {
      collectionObjectType: async (resource): Promise<undefined> => {
        /*
         * TEST: write tests for this
         *  Delete all determinations
         */
        const determinations = resource.getDependentResource('determinations');
        const currentDetermination = determinations?.models.find(
          (determination) => determination.get('isCurrent')
        );

        const taxonId = idFromUrl(currentDetermination?.get('taxon') ?? '');
        const COTypeID = idFromUrl(resource.get('collectionObjectType') ?? '');
        if (
          taxonId !== undefined &&
          COTypeID !== undefined &&
          currentDetermination !== undefined &&
          determinations !== undefined
        )
          await f
            .all({
              fetchedTaxon: fetchResource('Taxon', taxonId),
              fetchedCOType: fetchResource('CollectionObjectType', COTypeID),
            })
            .then(({ fetchedTaxon, fetchedCOType }) => {
              const taxonTreeDefinition = fetchedTaxon.definition;
              const COTypeTreeDefinition = fetchedCOType.taxonTreeDef;

              if (taxonTreeDefinition !== COTypeTreeDefinition)
                resource.set('determinations', []);
            })
            .catch((error) => {
              console.error('Error fetching resources:', error);
            });
        return undefined;
      },
    },
  },

  CollectionObjectGroup: {
    fieldChecks: {
      cogType: (cog): void => {
        // The first COJO CO will automatically have isPrimary set to True when the COG type is 'consolidated'
        cog.rgetPromise('cogType').then((cogtype) => {
          if (cogtype.get('type') === cogTypes.CONSOLIDATED) {
            const cojos = cog.getDependentResource('children');
            // Set first CO in COG to primary
            cojos?.models
              .find((cojo) => cojo.get('childCo') !== null)
              ?.set('isPrimary', true);
          }
        });
      },
    },
  },

  CollectionObjectGroupJoin: {
    fieldChecks: {
      /*
       * Only a single CO in a COG can be set as primary.
       * When checking a CO as primary, other COs in that COG will get unchecked.
       */
      isPrimary: (cojo: SpecifyResource<CollectionObjectGroupJoin>): void => {
        ensureSingleCollectionObjectCheck(cojo, 'isPrimary');
      },
      /*
       * Only a single CO in a COG can be set as substrate.
       * When checking a CO as substrate, other COs in that COG will get unchecked.
       */
      isSubstrate: (cojo: SpecifyResource<CollectionObjectGroupJoin>): void => {
        ensureSingleCollectionObjectCheck(cojo, 'isSubstrate');
      },
    },
  },

  Determination: {
    fieldChecks: {
      taxon: async (
        determination: SpecifyResource<Determination>
      ): Promise<BusinessRuleResult | undefined> =>
        determination
          .rgetPromise('taxon', true)
          .then((taxon: SpecifyResource<Taxon> | null) => {
            const getLastAccepted = async (
              taxon: SpecifyResource<Taxon>
            ): Promise<SpecifyResource<Taxon>> =>
              taxon
                .rgetPromise('acceptedTaxon', true)
                .then(async (accepted) =>
                  accepted === null ? taxon : getLastAccepted(accepted)
                );

            return taxon === null
              ? {
                  isValid: true,
                  action: () => determination.set('preferredTaxon', null),
                }
              : {
                  isValid: true,
                  action: async () =>
                    determination.set(
                      'preferredTaxon',
                      await getLastAccepted(taxon)
                    ),
                };
          }),
      isCurrent: async (
        determination: SpecifyResource<Determination>
      ): Promise<BusinessRuleResult> => {
        /*
         * Disallow multiple determinations being checked as current
         * Unchecks other determination when one of them gets checked
         */
        if (
          determination.get('isCurrent') &&
          determination.collection !== undefined
        ) {
          determination.collection.models.map(
            (other: SpecifyResource<Determination>) => {
              if (other.cid !== determination.cid) {
                other.set('isCurrent', false);
              }
            }
          );
        }
        // Flag as invalid if no determinations are checked as current
        if (
          determination.collection !== undefined &&
          hasNoCurrentDetermination(determination.collection)
        ) {
          return {
            isValid: false,
            reason: resourcesText.currentDeterminationRequired(),
            saveBlockerKey: CURRENT_DETERMINATION_KEY,
            resource: determination.collection.related,
          };
        }
        return {
          isValid: true,
          saveBlockerKey: CURRENT_DETERMINATION_KEY,
          resource: determination.collection?.related,
        };
      },
    },
    onRemoved: (determination, collection): void => {
      // Block save when no current determinations exist on removing
      if (hasNoCurrentDetermination(collection))
        setSaveBlockers(
          collection.related ?? determination,
          determination.specifyTable.field.isCurrent,
          [resourcesText.currentDeterminationRequired()],
          CURRENT_DETERMINATION_KEY
        );
      // Unblock save when all determinations are removed
      else
        setSaveBlockers(
          collection.related ?? determination,
          determination.specifyTable.field.isCurrent,
          [],
          CURRENT_DETERMINATION_KEY
        );
    },
    onAdded: (determination, collection): void => {
      determination.set('isCurrent', true);
      // Clear any existing save blocker on adding a new current determination
      setSaveBlockers(
        collection.related ?? determination,
        determination.specifyTable.field.isCurrent,
        [],
        CURRENT_DETERMINATION_KEY
      );
    },
  },
  DisposalPreparation: {
    fieldChecks: {
      quantity: checkPrepAvailability,
    },
  },
  DNASequence: {
    fieldChecks: {
      geneSequence: (dnaSequence: SpecifyResource<DNASequence>): void => {
        const current = dnaSequence.get('geneSequence');
        if (current === null) return;
        const countObject = { a: 0, t: 0, g: 0, c: 0, ambiguous: 0 };
        for (let i = 0; i < current.length; i++) {
          const char = current.at(i)?.toLowerCase().trim();
          if (char !== '') {
            switch (char) {
              case 'a': {
                countObject.a += 1;
                break;
              }
              case 't': {
                countObject.t += 1;
                break;
              }
              case 'g': {
                countObject.g += 1;
                break;
              }
              case 'c': {
                countObject.c += 1;
                break;
              }
              default: {
                countObject.ambiguous += 1;
              }
            }
          }
        }
        dnaSequence.set('compA', countObject.a);
        dnaSequence.set('compT', countObject.t);
        dnaSequence.set('compG', countObject.g);
        dnaSequence.set('compC', countObject.c);
        dnaSequence.set('ambiguousResidues', countObject.ambiguous);
        dnaSequence.set(
          'totalResidues',
          countObject.a +
            countObject.t +
            countObject.g +
            countObject.c +
            countObject.ambiguous
        );
      },
    },
  },
  GiftPreparation: {
    fieldChecks: {
      quantity: checkPrepAvailability,
    },
  },
  LoanPreparation: {
    customInit: (resource: SpecifyResource<LoanPreparation>): void => {
      if (!resource.isNew())
        resource.rgetCollection('loanReturnPreparations').then(updateLoanPrep);
    },
    fieldChecks: {
      quantity: checkPrepAvailability,
    },
  },
  LoanReturnPreparation: {
    onRemoved: (
      _loanReturnPrep: SpecifyResource<LoanReturnPreparation>,
      collection: Collection<LoanReturnPreparation>
    ): void => updateLoanPrep(collection),

    customInit: (resource: SpecifyResource<LoanReturnPreparation>): void => {
      const returned = resource.get('quantityReturned');
      const resolved = resource.get('quantityResolved');
      if (returned === undefined) resource.set('quantityReturned', 0);
      if (resolved === undefined) resource.set('quantityResolved', 0);
      if (!resource.isNew()) {
        previousLoanPreparations.previousReturned[resource.cid] =
          Number(returned);
        previousLoanPreparations.previousResolved[resource.cid] =
          Number(resolved);
      }
      updateLoanPrep(resource.collection);
    },
    fieldChecks: {
      quantityReturned: (
        loanReturnPrep: SpecifyResource<LoanReturnPreparation>
      ): void => {
        const returned = Number(loanReturnPrep.get('quantityReturned'))!;
        const previousReturned =
          previousLoanPreparations.previousReturned[loanReturnPrep.cid] ?? 0;
        const previousResolved =
          previousLoanPreparations.previousResolved[loanReturnPrep.cid] ?? 0;

        const totalLoaned = getTotalLoaned(loanReturnPrep)!;

        const totalResolved = getTotalResolved(loanReturnPrep)!;
        const available = totalLoaned - totalResolved;

        if (returned !== previousReturned) {
          if (returned === available && previousReturned - returned === 1) {
          } else if (returned < 0 || previousReturned < 0) {
            loanReturnPrep.set('quantityReturned', 0);
          } else {
            const changeInReturn = returned - previousReturned;
            previousLoanPreparations.previousResolved[loanReturnPrep.cid] =
              changeInReturn + previousResolved;
            loanReturnPrep.set(
              'quantityResolved',
              changeInReturn + previousResolved
            );
          }
        }

        if (returned > totalLoaned)
          loanReturnPrep.set('quantityReturned', totalLoaned);

        const returnedLeft = totalLoaned - getTotalReturned(loanReturnPrep)!;
        if (returned > returnedLeft)
          loanReturnPrep.set('quantityReturned', returnedLeft);

        if (previousResolved < returned) {
          loanReturnPrep.set('quantityResolved', returned);
          previousLoanPreparations.previousResolved[loanReturnPrep.cid] =
            returned;
        }

        previousLoanPreparations.previousReturned[loanReturnPrep.cid] =
          returned;
        updateLoanPrep(loanReturnPrep.collection);
      },
      quantityResolved: (
        loanReturnPrep: SpecifyResource<LoanReturnPreparation>
      ): void => {
        const resolved = Number(loanReturnPrep.get('quantityResolved'));

        const totalLoaned = getTotalLoaned(loanReturnPrep)!;
        const totalResolved = getTotalResolved(loanReturnPrep)!;
        const available = totalLoaned - totalResolved;
        if (resolved > available) {
          loanReturnPrep.set('quantityResolved', available);
        }

        if (resolved < 0) loanReturnPrep.set('quantityResolved', 0);

        previousLoanPreparations.previousResolved[loanReturnPrep.cid] =
          resolved;
        updateLoanPrep(loanReturnPrep.collection);
      },
    },
  },
};
