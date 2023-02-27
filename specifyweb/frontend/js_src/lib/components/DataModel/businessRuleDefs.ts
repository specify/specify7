import { f } from '../../utils/functools';
import { overwriteReadOnly, RA } from '../../utils/types';
import { AnySchema, TableFields } from './helperTypes';
import {
  checkPrepAvailability,
  getTotalLoaned,
  getTotalResolved,
  interactionCache,
  updateLoanPrep,
} from './interactionBusinessRules';
import { SpecifyResource } from './legacyTypes';
import { BusinessRuleResult } from './businessRules';
import { schema } from './schema';
import { Collection } from './specifyModel';
import {
  BorrowMaterial,
  CollectionObject,
  Determination,
  GiftPreparation,
  LoanPreparation,
  LoanReturnPreparation,
  Tables,
  Taxon,
} from './types';
import * as uniquenessRules from './uniquness_rules.json';

export type BusinessRuleDefs<SCHEMA extends AnySchema> = {
  readonly onRemoved?: (
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ) => void;
  readonly uniqueIn?: UniquenessRule<SCHEMA>;
  readonly customInit?: (resource: SpecifyResource<SCHEMA>) => void;
  readonly fieldChecks?: {
    [FIELDNAME in TableFields<SCHEMA> as Lowercase<FIELDNAME>]?: (
      resource: SpecifyResource<SCHEMA>
    ) => Promise<BusinessRuleResult | undefined> | void;
  };
};

export const uniqueRules: UniquenessRules = uniquenessRules;

type UniquenessRules = {
  [TABLE in keyof Tables]?: UniquenessRule<Tables[TABLE]>;
};

export type UniquenessRule<SCHEMA extends AnySchema> = {
  [FIELDNAME in TableFields<SCHEMA> as Lowercase<FIELDNAME>]?:
    | string[]
    | null[]
    | RA<{ field: string; otherfields: string[] }>;
};

type MappedBusinessRuleDefs = {
  [TABLE in keyof Tables]?: BusinessRuleDefs<Tables[TABLE]>;
};

function assignUniquenessRules(
  mappedRules: MappedBusinessRuleDefs
): MappedBusinessRuleDefs {
  Object.keys(uniqueRules).forEach((table) => {
    if (mappedRules[table as keyof Tables] == undefined)
      overwriteReadOnly(mappedRules, table, {});

    overwriteReadOnly(
      mappedRules[table as keyof Tables]!,
      'uniqueIn',
      uniquenessRules[table as keyof Tables]
    );
  });
  return mappedRules;
}

export const businessRuleDefs = f.store(
  (): MappedBusinessRuleDefs =>
    assignUniquenessRules({
      BorrowMaterial: {
        fieldChecks: {
          quantityreturned: (
            borrowMaterial: SpecifyResource<BorrowMaterial>
          ): void => {
            const returned = borrowMaterial.get('quantityReturned');
            const resolved = borrowMaterial.get('quantityResolved');
            const quantity = borrowMaterial.get('quantity');
            var newVal: number | undefined = undefined;
            if (quantity && returned && returned > quantity) {
              newVal = quantity;
            }
            if (returned && resolved && returned > resolved) {
              newVal = resolved;
            }

            newVal && borrowMaterial.set('quantityReturned', newVal);
          },
          quantityresolved: (
            borrowMaterial: SpecifyResource<BorrowMaterial>
          ): void => {
            const resolved = borrowMaterial.get('quantityResolved');
            const quantity = borrowMaterial.get('quantity');
            const returned = borrowMaterial.get('quantityReturned');
            var newVal: number | undefined = undefined;
            if (resolved && quantity && resolved > quantity) {
              newVal = quantity;
            }
            if (resolved && returned && resolved < returned) {
              newVal = returned;
            }

            newVal && borrowMaterial.set('quantityResolved', newVal);
          },
        },
      },

      CollectionObject: {
        customInit: function (
          collectionObject: SpecifyResource<CollectionObject>
        ): void {
          var ceField =
            collectionObject.specifyModel.getField('collectingEvent');
          if (
            ceField?.isDependent() &&
            collectionObject.get('collectingEvent') == undefined
          ) {
            collectionObject.set(
              'collectingEvent',
              new schema.models.CollectingEvent.Resource()
            );
          }
        },
      },

      Determination: {
        customInit: (determinaton: SpecifyResource<Determination>): void => {
          if (determinaton.isNew()) {
            const setCurrent = () => {
              determinaton.set('isCurrent', true);
              if (determinaton.collection != null) {
                determinaton.collection.each(
                  (other: SpecifyResource<Determination>) => {
                    if (other.cid !== determinaton.cid) {
                      other.set('isCurrent', false);
                    }
                  }
                );
              }
            };
            if (determinaton.collection !== null) setCurrent();
            determinaton.on('add', setCurrent);
          }
        },
        fieldChecks: {
          taxon: (
            determination: SpecifyResource<Determination>
          ): Promise<BusinessRuleResult> => {
            return determination
              .rgetPromise('taxon', true)
              .then((taxon: SpecifyResource<Taxon> | null) =>
                taxon == null
                  ? {
                      valid: true,
                      action: () => {
                        determination.set('preferredTaxon', null);
                      },
                    }
                  : (function recur(taxon): BusinessRuleResult {
                      return taxon.get('acceptedTaxon') == null
                        ? {
                            valid: true,
                            action: () =>
                              determination.set('preferredTaxon', taxon),
                          }
                        : taxon
                            .rgetPromise('acceptedTaxon', true)
                            .then((accepted) => recur(accepted));
                    })(taxon)
              );
          },
          iscurrent: (
            determination: SpecifyResource<Determination>
          ): Promise<BusinessRuleResult> | void => {
            if (
              determination.get('isCurrent') &&
              determination.collection != null
            ) {
              determination.collection.each(
                (other: SpecifyResource<Determination>) => {
                  if (other.cid !== determination.cid) {
                    other.set('isCurrent', false);
                  }
                }
              );
            }
            if (
              determination.collection != null &&
              !determination.collection.any(
                (c: SpecifyResource<Determination>) => c.get('isCurrent')
              )
            ) {
              determination.set('isCurrent', true);
            }
            return Promise.resolve({ valid: true });
          },
        },
      },
      GiftPreparation: {
        fieldChecks: {
          quantity: (iprep: SpecifyResource<GiftPreparation>): void => {
            checkPrepAvailability(iprep);
          },
        },
      },
      LoanPreparation: {
        fieldChecks: {
          quantity: (iprep: SpecifyResource<LoanPreparation>): void => {
            checkPrepAvailability(iprep);
          },
        },
      },
      LoanReturnPreparation: {
        onRemoved: (
          loanReturnPrep: SpecifyResource<LoanReturnPreparation>,
          collection: Collection<LoanReturnPreparation>
        ): void => {
          updateLoanPrep(collection);
        },
        customInit: (
          resource: SpecifyResource<LoanReturnPreparation>
        ): void => {
          resource.get('quantityReturned') == null &&
            resource.set('quantityReturned', 0);
          resource.get('quantityResolved') == null &&
            resource.set('quantityResolved', 0);
        },
        fieldChecks: {
          quantityreturned: (
            loanReturnPrep: SpecifyResource<LoanReturnPreparation>
          ): void => {
            var returned = loanReturnPrep.get('quantityReturned');
            var previousReturned = interactionCache().previousReturned[
              Number(loanReturnPrep.cid)
            ]
              ? interactionCache().previousReturned[Number(loanReturnPrep.cid)]
              : 0;
            if (returned !== null && returned != previousReturned) {
              var delta = returned - previousReturned;
              var resolved = loanReturnPrep.get('quantityResolved');
              var totalLoaned = getTotalLoaned(loanReturnPrep);
              var totalResolved = getTotalResolved(loanReturnPrep);
              var max = totalLoaned - totalResolved;
              if (resolved !== null && delta + resolved > max) {
                loanReturnPrep.set('quantityReturned', previousReturned);
              } else {
                resolved = loanReturnPrep.get('quantityResolved')! + delta;
                interactionCache().previousResolved[
                  Number(loanReturnPrep.cid)
                ] = resolved;
                loanReturnPrep.set('quantityResolved', resolved);
              }
              interactionCache().previousReturned[Number(loanReturnPrep.cid)] =
                loanReturnPrep.get('quantityReturned');
              updateLoanPrep(loanReturnPrep.collection);
            }
          },
          quantityresolved: (
            loanReturnPrep: SpecifyResource<LoanReturnPreparation>
          ): void => {
            var resolved = loanReturnPrep.get('quantityResolved');
            var previousResolved = interactionCache().previousResolved[
              Number(loanReturnPrep.cid)
            ]
              ? interactionCache().previousResolved[Number(loanReturnPrep.cid)]
              : 0;
            if (resolved != previousResolved) {
              var returned = loanReturnPrep.get('quantityReturned');
              var totalLoaned = getTotalLoaned(loanReturnPrep);
              var totalResolved = getTotalResolved(loanReturnPrep);
              var max = totalLoaned - totalResolved;
              if (resolved !== null && returned !== null) {
                if (resolved > max) {
                  loanReturnPrep.set('quantityResolved', previousResolved);
                }
                if (resolved < returned) {
                  interactionCache().previousReturned[
                    Number(loanReturnPrep.cid)
                  ] = resolved;
                  loanReturnPrep.set('quantityReturned', resolved);
                }
              }
              interactionCache().previousResolved[Number(loanReturnPrep.cid)] =
                loanReturnPrep.get('quantityResolved');
              updateLoanPrep(loanReturnPrep.collection);
            }
          },
        },
      },
    } as const)
);
