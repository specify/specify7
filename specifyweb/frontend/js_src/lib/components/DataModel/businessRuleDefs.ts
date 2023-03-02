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
  DNASequence,
  GiftPreparation,
  LoanPreparation,
  LoanReturnPreparation,
  Tables,
  Taxon,
} from './types';
import uniquenessRules from './uniquness_rules.json';

export type BusinessRuleDefs<SCHEMA extends AnySchema> = {
  readonly onRemoved?: (
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ) => void;
  readonly uniqueIn?: UniquenessRule<SCHEMA>;
  readonly customInit?: (resource: SpecifyResource<SCHEMA>) => void;
  readonly fieldChecks?: {
    [FIELD_NAME in TableFields<SCHEMA> as Lowercase<FIELD_NAME>]?: (
      resource: SpecifyResource<SCHEMA>
    ) => Promise<BusinessRuleResult | undefined> | void;
  };
};

export const uniqueRules: UniquenessRules = uniquenessRules;

type UniquenessRules = {
  [TABLE in keyof Tables]?: UniquenessRule<Tables[TABLE]>;
};

export type UniquenessRule<SCHEMA extends AnySchema> = {
  [FIELD_NAME in TableFields<SCHEMA> as Lowercase<FIELD_NAME>]?:
    | RA<string>
    | null[]
    | RA<{ field: string; otherFields: string[] }>;
};

type MappedBusinessRuleDefs = {
  [TABLE in keyof Tables]?: BusinessRuleDefs<Tables[TABLE]>;
};

function assignUniquenessRules(
  mappedRules: MappedBusinessRuleDefs
): MappedBusinessRuleDefs {
  Object.keys(uniqueRules).forEach((table) => {
    if (mappedRules[table as keyof Tables] === undefined)
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
            if (
              typeof quantity === 'number' &&
              typeof returned === 'number' &&
              returned > quantity
            ) {
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
            let newVal: number | undefined = undefined;
            if (resolved && quantity && resolved > quantity) {
              newVal = quantity;
            }
            if (resolved && returned && resolved < returned) {
              newVal = returned;
            }

            if (typeof newVal === 'number')
              borrowMaterial.set('quantityResolved', newVal);
          },
        },
      },

      CollectionObject: {
        customInit: function (
          collectionObject: SpecifyResource<CollectionObject>
        ): void {
          const ceField =
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
                determinaton.collection.models.map(
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
              .then((taxon: SpecifyResource<Taxon> | null) => {
                const getLastAccepted = (
                  taxon: SpecifyResource<Taxon>
                ): Promise<SpecifyResource<Taxon>> => {
                  return taxon
                    .rgetPromise('acceptedTaxon', true)
                    .then((accepted) =>
                      accepted === null ? taxon : getLastAccepted(accepted)
                    );
                };
                return taxon === null
                  ? {
                      valid: true,
                      action: () => determination.set('preferredTaxon', null),
                    }
                  : {
                      valid: true,
                      action: async () =>
                        determination.set(
                          'preferredTaxon',
                          await getLastAccepted(taxon)
                        ),
                    };
              });
          },
          iscurrent: (
            determination: SpecifyResource<Determination>
          ): Promise<BusinessRuleResult> | void => {
            if (
              determination.get('isCurrent') &&
              determination.collection != null
            ) {
              determination.collection.models.map(
                (other: SpecifyResource<Determination>) => {
                  if (other.cid !== determination.cid) {
                    other.set('isCurrent', false);
                  }
                }
              );
            }
            if (
              determination.collection != null &&
              !determination.collection.models.some(
                (c: SpecifyResource<Determination>) => c.get('isCurrent')
              )
            ) {
              determination.set('isCurrent', true);
            }
            return Promise.resolve({ valid: true });
          },
        },
      },
      DNASequence: {
        fieldChecks: {
          genesequence: (dnaSequence: SpecifyResource<DNASequence>): void => {
            const current = dnaSequence.get('geneSequence');
            if (current === null) return;
            const countObj = { a: 0, t: 0, g: 0, c: 0, ambiguous: 0 };
            for (let i = 0; i < current.length; i++) {
              const char = current.at(i)?.toLowerCase().trim();
              if (char !== '') {
                switch (char) {
                  case 'a':
                    countObj['a'] += 1;
                    break;
                  case 't':
                    countObj['t'] += 1;
                    break;
                  case 'g':
                    countObj['g'] += 1;
                    break;
                  case 'c':
                    countObj['c'] += 1;
                    break;
                  default:
                    countObj['ambiguous'] += 1;
                }
              }
            }
            dnaSequence.set('compA', countObj['a']);
            dnaSequence.set('compT', countObj['t']);
            dnaSequence.set('compG', countObj['g']);
            dnaSequence.set('compC', countObj['c']);
            dnaSequence.set('ambiguousResidues', countObj['ambiguous']);
            dnaSequence.set(
              'totalResidues',
              countObj['a'] +
                countObj['t'] +
                countObj['g'] +
                countObj['c'] +
                countObj['ambiguous']
            );
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
        ): void => updateLoanPrep(collection),

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
            const returned = loanReturnPrep.get('quantityReturned');
            const previousReturned = interactionCache().previousReturned[
              Number(loanReturnPrep.cid)
            ]
              ? interactionCache().previousReturned[Number(loanReturnPrep.cid)]
              : 0;
            if (returned !== null && returned != previousReturned) {
              const delta = returned - previousReturned;
              let resolved = loanReturnPrep.get('quantityResolved');
              const totalLoaned = getTotalLoaned(loanReturnPrep);
              const totalResolved = getTotalResolved(loanReturnPrep);
              const max =
                typeof totalLoaned === 'number' &&
                typeof totalResolved === 'number'
                  ? totalLoaned - totalResolved
                  : 0;
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
            const resolved = loanReturnPrep.get('quantityResolved');
            const previousResolved = interactionCache().previousResolved[
              Number(loanReturnPrep.cid)
            ]
              ? interactionCache().previousResolved[Number(loanReturnPrep.cid)]
              : 0;
            if (resolved != previousResolved) {
              const returned = loanReturnPrep.get('quantityReturned');
              const totalLoaned = getTotalLoaned(loanReturnPrep);
              const totalResolved = getTotalResolved(loanReturnPrep);
              const max =
                typeof totalLoaned === 'number' &&
                typeof totalResolved === 'number'
                  ? totalLoaned - totalResolved
                  : 0;
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
