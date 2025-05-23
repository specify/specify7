import { resourcesText } from '../../localization/resources';
import { resolveParser } from '../../utils/parser/definitions';
import type { ValueOf } from '../../utils/types';
import type { BusinessRuleResult } from './businessRules';
import {
  CO_HAS_PARENT,
  COG_PRIMARY_KEY,
  COG_TOITSELF,
  COJO_PRIMARY_DELETE_KEY,
  CURRENT_DETERMINATION_KEY,
  DETERMINATION_TAXON_KEY,
  ensureSingleCollectionObjectCheck,
  hasNoCurrentDetermination,
  PREPARATION_DISPOSED_KEY,
  PREPARATION_EXCHANGED_IN_KEY,
  PREPARATION_EXCHANGED_OUT_KEY,
  PREPARATION_GIFTED_KEY,
  PREPARATION_LOANED_KEY,
} from './businessRuleUtils';
import { agentTypes, cogTypes } from './helpers';
import type { AnySchema, CommonFields, TableFields } from './helperTypes';
import {
  checkPrepAvailability,
  getTotalLoaned,
  getTotalResolved,
  getTotalReturned,
  previousLoanPreparations,
  updateLoanPrep,
} from './interactionBusinessRules';
import type { SpecifyResource } from './legacyTypes';
import { idFromUrl } from './resource';
import { setSaveBlockers } from './saveBlockers';
import { schema } from './schema';
import type { LiteralField, Relationship } from './specifyField';
import type { Collection } from './specifyTable';
import { tables } from './tables';
import type {
  Address,
  BorrowMaterial,
  CollectionObject,
  CollectionObjectGroup,
  CollectionObjectGroupJoin,
  Collector,
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
      resource: SpecifyResource<SCHEMA>,
      field: (CommonFields &
        SCHEMA['fields'] &
        SCHEMA['toManyDependent'] &
        SCHEMA['toManyIndependent'] &
        SCHEMA['toOneDependent'] &
        SCHEMA['toOneIndependent'])[FIELD_NAME] extends ValueOf<
        AnySchema['fields']
      >
        ? LiteralField
        : Relationship
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
        if (resource.isNew()) {
          const parser = resolveParser(
            resource.specifyTable.strictGetLiteralField('catalogNumber'),
            undefined,
            resource
          );
          // REFACTOR: non-silent set causes infinite loop and silent set still triggers save blocker when parser value is empty string
          resource.set('catalogNumber', parser.value as never, {
            silent: (parser.value ?? '') === '',
          });
        }

        const determinations = resource.getDependentResource('determinations');
        if (determinations === undefined || determinations.models.length === 0)
          return;

        const taxons = await Promise.all(
          determinations.models.map(async (det) => det.rgetPromise('taxon'))
        );
        const coType = await resource.rgetPromise('collectionObjectType');
        const coTypeTreeDef = coType.get('taxonTreeDef');

        // Block save when a Determination -> Taxon does not belong to the COType's tree definition
        determinations.models.forEach((determination, index) => {
          const taxon = taxons[index];
          const taxonTreeDef = taxon?.get('definition');
          const isValid =
            typeof taxonTreeDef === 'string' && taxonTreeDef === coTypeTreeDef;

          setSaveBlockers(
            determination,
            determination.specifyTable.field.taxon,
            isValid ? [] : [resourcesText.invalidDeterminationTaxon()],
            DETERMINATION_TAXON_KEY
          );
        });

        return undefined;
      },
    },
  },

  CollectionObjectGroup: {
    fieldChecks: {
      cogType: (cog): void => {
        // Consolidated COGs need to have a primary CO child. If not, save will be blocked
        cog.rgetPromise('cogType').then((cogtype) => {
          if (cogtype.get('type') === cogTypes.CONSOLIDATED) {
            const children = cog.getDependentResource('children');
            const collectionObjectChildren =
              children?.models.filter(
                (child) => typeof child.get('childCo') === 'string'
              ) ?? [];

            if (
              collectionObjectChildren.length > 0 &&
              !collectionObjectChildren.some((cojo) => cojo.get('isPrimary'))
            ) {
              setSaveBlockers(
                cog,
                tables.CollectionObjectGroupJoin.field.isPrimary,
                [resourcesText.primaryCogChildRequired()],
                COG_PRIMARY_KEY
              );
              return;
            }
          }
          setSaveBlockers(
            cog,
            tables.CollectionObjectGroupJoin.field.isPrimary,
            [],
            COG_PRIMARY_KEY
          );
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

        // Trigger Consolidated COGs field check when isPrimary changes
        if (
          cojo.collection?.related?.specifyTable ===
          tables.CollectionObjectGroup
        ) {
          const cog = cojo.collection
            .related as SpecifyResource<CollectionObjectGroup>;
          cog.businessRuleManager?.checkField('cogType');
        }
      },
      /*
       * Only a single CO in a COG can be set as substrate.
       * When checking a CO as substrate, other COs in that COG will get unchecked.
       */
      isSubstrate: (cojo: SpecifyResource<CollectionObjectGroupJoin>): void => {
        ensureSingleCollectionObjectCheck(cojo, 'isSubstrate');
      },
      parentCog: async (cojo): Promise<BusinessRuleResult> => {
        if (
          cojo.get('childCog') === cojo.get('parentCog') &&
          typeof cojo.get('childCog') === 'string' &&
          typeof cojo.get('parentCog') === 'string'
        ) {
          return {
            isValid: false,
            reason: resourcesText.cogAddedToItself(),
            saveBlockerKey: COG_TOITSELF,
          };
        }
        return {
          isValid: true,
          saveBlockerKey: COG_TOITSELF,
        };
      },
      childCo: async (
        cojo: SpecifyResource<CollectionObjectGroupJoin>
      ): Promise<BusinessRuleResult> => {
        const childCO = cojo.get('childCo');
        const childCOId = idFromUrl(childCO!);
        const CO: SpecifyResource<CollectionObject> | void =
          await new tables.CollectionObject.Resource({ id: childCOId })
            .fetch()
            .then((co) => co)
            .catch((error) => {
              console.error('Failed to fetch CollectionObject:', error);
            });
        let coParent;
        if (CO !== undefined) {
          coParent = CO.get('componentParent');
        }
        return coParent === null
          ? {
              isValid: true,
              saveBlockerKey: CO_HAS_PARENT,
            }
          : {
              isValid: false,
              reason: resourcesText.coHasParent(),
              saveBlockerKey: CO_HAS_PARENT,
            };
      },
    },
    onAdded: (cojo, collection) => {
      if (
        cojo.get('childCog') === cojo.get('parentCog') &&
        typeof cojo.get('childCog') === 'string' &&
        typeof cojo.get('parentCog') === 'string'
      ) {
        setSaveBlockers(
          cojo,
          cojo.specifyTable.field.childCog,
          [resourcesText.cogAddedToItself()],
          COG_TOITSELF
        );
      }

      // Trigger Consolidated COGs field check when a child is added
      if (collection?.related?.specifyTable === tables.CollectionObjectGroup) {
        const cog =
          collection.related as SpecifyResource<CollectionObjectGroup>;
        cog.businessRuleManager?.checkField('cogType');
      }
    },
    onRemoved(cojo, collection) {
      // Trigger Consolidated COGs field check when a child is deleted
      if (cojo.get('isPrimary')) {
        setSaveBlockers(
          collection.related ?? cojo,
          cojo.specifyTable.field.parentCog,
          [resourcesText.deletePrimaryRecord()],
          COJO_PRIMARY_DELETE_KEY
        );
      }
      if (collection?.related?.specifyTable === tables.CollectionObjectGroup) {
        const cog =
          collection.related as SpecifyResource<CollectionObjectGroup>;
        cog.businessRuleManager?.checkField('cogType');
      }
    },
  },

  Collector: {
    fieldChecks: {
      isPrimary: (collector: SpecifyResource<Collector>): void => {
        if (collector.get('isPrimary') && collector.collection !== undefined) {
          collector.collection.models.map(
            (other: SpecifyResource<Collector>) => {
              if (other.cid !== collector.cid) {
                other.set('isPrimary', false);
              }
            }
          );
        }
      },
    },
    onRemoved: (collector, collection): void => {
      if (collector.get('isPrimary') && collection.models.length > 0) {
        collection.models[0].set('isPrimary', true);
      }
    },
    onAdded: (collector, collection): void => {
      if (collection.models.length === 1) {
        collector.set('isPrimary', true);
      }
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
  Determiner: {
    customInit: (determiner) => {
      if (determiner.isNew()) {
        const setPrimary = (): void => {
          determiner.set('isPrimary', true);
          if (determiner.collection !== undefined) {
            determiner.collection.models.forEach((other) => {
              if (other.cid !== determiner.cid) other.set('isPrimary', false);
            });
          }
        };
        determiner.on('add', setPrimary);
      }
    },
    fieldChecks: {
      isPrimary: async (determiner) => {
        if (determiner.get('isPrimary')) {
          determiner.collection?.models.forEach((other) => {
            if (other.cid !== determiner.cid) {
              other.set('isPrimary', false);
            }
          });
        }
        if (
          determiner.collection !== undefined &&
          !determiner.collection?.models.some((other) => other.get('isPrimary'))
        ) {
          determiner.set('isPrimary', true);
        }
        return { isValid: true };
      },
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

        const countObject = Array.from(current).reduce(
          (accumulator, currentString) => {
            const trimmed = currentString.toLowerCase().trim();
            if (trimmed === '') return accumulator;
            return trimmed === 'a'
              ? { ...accumulator, a: accumulator.a + 1 }
              : trimmed === 't'
                ? { ...accumulator, t: accumulator.t + 1 }
                : trimmed === 'g'
                  ? { ...accumulator, g: accumulator.g + 1 }
                  : trimmed === 'c'
                    ? { ...accumulator, c: accumulator.c + 1 }
                    : { ...accumulator, ambiguous: accumulator.ambiguous + 1 };
          },
          { a: 0, t: 0, g: 0, c: 0, ambiguous: 0 }
        );
        dnaSequence.set('compA', countObject.a);
        dnaSequence.set('compT', countObject.t);
        dnaSequence.set('compG', countObject.g);
        dnaSequence.set('compC', countObject.c);
        dnaSequence.set('ambiguousResidues', countObject.ambiguous);
        dnaSequence.set(
          'totalResidues',
          Object.values(countObject).reduce(
            (previous, current) => previous + current,
            0
          )
        );
      },
    },
  },
  FundingAgent: {
    customInit: (fundingAgent) => {
      if (fundingAgent.isNew()) {
        const setPrimary = (): void => {
          fundingAgent.set('isPrimary', true);
          if (fundingAgent.collection !== undefined) {
            fundingAgent.collection.models.forEach((other) => {
              if (other.cid !== fundingAgent.cid) other.set('isPrimary', false);
            });
          }
        };
        fundingAgent.on('add', setPrimary);
      }
    },
    fieldChecks: {
      isPrimary: async (fundingAgent) => {
        if (fundingAgent.get('isPrimary')) {
          fundingAgent.collection?.models.forEach((other) => {
            if (other.cid !== fundingAgent.cid) {
              other.set('isPrimary', false);
            }
          });
        }
        if (
          fundingAgent.collection !== undefined &&
          !fundingAgent.collection?.models.some((other) =>
            other.get('isPrimary')
          )
        ) {
          fundingAgent.set('isPrimary', true);
        }
        return { isValid: true };
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
        resource
          .rgetCollection('loanReturnPreparations')
          .then((preps) => updateLoanPrep(preps, true));
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
      updateLoanPrep(resource.collection, true);
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
  Preparation: {
    fieldChecks: {
      countAmt: async (prep): Promise<BusinessRuleResult | undefined> => {
        const loanPrep = await prep.rgetCollection('loanPreparations');
        const totalPrep = prep.get('countAmt') ?? 0;
        let totalPrepLoaned = 0;

        loanPrep.models.forEach((loan) => {
          const quantity = loan.get('quantity') ?? 0;
          totalPrepLoaned += quantity;
        });

        if (totalPrep < totalPrepLoaned) {
          setSaveBlockers(
            prep,
            prep.specifyTable.field.countAmt,
            [resourcesText.preparationUsedInLoan()],
            PREPARATION_LOANED_KEY
          );
        } else {
          setSaveBlockers(
            prep,
            prep.specifyTable.field.countAmt,
            [],
            PREPARATION_LOANED_KEY
          );
        }
        return undefined;
      },
    },
    onRemoved: (preparation, collection): void => {
      if (preparation.get('isOnLoan') === true) {
        setSaveBlockers(
          collection.related ?? preparation,
          preparation.specifyTable.field.isOnLoan,
          [resourcesText.deleteLoanedPrep()],
          PREPARATION_LOANED_KEY
        );
      }
      if (preparation.get('isOnGift') === true) {
        setSaveBlockers(
          collection.related ?? preparation,
          preparation.specifyTable.field.isOnGift,
          [resourcesText.deleteGiftedPrep()],
          PREPARATION_GIFTED_KEY
        );
      }
      if (preparation.get('isOnDisposal') === true) {
        setSaveBlockers(
          collection.related ?? preparation,
          preparation.specifyTable.field.isOnDisposal,
          [resourcesText.deleteDisposedPrep()],
          PREPARATION_DISPOSED_KEY
        );
      }
      if (preparation.get('isOnExchangeOut') === true) {
        setSaveBlockers(
          collection.related ?? preparation,
          preparation.specifyTable.field.isOnExchangeOut,
          [resourcesText.deleteExchangeOutPrep()],
          PREPARATION_EXCHANGED_OUT_KEY
        );
      }
      if (preparation.get('isOnExchangeIn') === true) {
        setSaveBlockers(
          collection.related ?? preparation,
          preparation.specifyTable.field.isOnExchangeIn,
          [resourcesText.deleteExchangeInPrep()],
          PREPARATION_EXCHANGED_IN_KEY
        );
      }
    },
  },
};
