import { RA } from '../../utils/types';
import { AnySchema, TableFields } from './helperTypes';
import {
  checkPrepAvailability,
  getTotalLoaned,
  getTotalResolved,
  getTotalReturned,
  previousLoanPreparations,
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
  DisposalPreparation,
  DNASequence,
  GiftPreparation,
  LoanPreparation,
  LoanReturnPreparation,
  Tables,
  Taxon,
} from './types';
import uniquenessRules from './uniquness_rules.json';

export type BusinessRuleDefs<SCHEMA extends AnySchema> = {
  readonly onAdded?: (
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ) => void;
  readonly onRemoved?: (
    resource: SpecifyResource<SCHEMA>,
    collection: Collection<SCHEMA>
  ) => void;
  readonly uniqueIn?: UniquenessRule<SCHEMA>;
  readonly customInit?: (resource: SpecifyResource<SCHEMA>) => void;
  readonly fieldChecks?: {
    [FIELD_NAME in TableFields<SCHEMA>]?: (
      resource: SpecifyResource<SCHEMA>
    ) => Promise<BusinessRuleResult | undefined> | void;
  };
};

const uniqueRules: JSONUniquenessRules = uniquenessRules;

type JSONUniquenessRules = {
  [TABLE in keyof Tables]?: JSONUniquenessRule<Tables[TABLE]>;
};

type JSONUniquenessRule<SCHEMA extends AnySchema> = {
  [FIELD_NAME in TableFields<SCHEMA>]?:
    | RA<string>
    | RA<{ field: string; otherFields: string[] }>
    | RA<null>;
};

export type UniquenessRule<SCHEMA extends AnySchema> = {
  [FIELD_NAME in TableFields<SCHEMA>]?:
    | RA<string>
    | RA<{ field: string; otherFields: string[] }>
    | RA<undefined>;
};

type MappedBusinessRuleDefs = {
  [TABLE in keyof Tables]?: BusinessRuleDefs<Tables[TABLE]>;
};

export const nonUniqueBusinessRuleDefs: MappedBusinessRuleDefs = {
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
    customInit: function (
      collectionObject: SpecifyResource<CollectionObject>
    ): void {
      const ceField = collectionObject.specifyModel.getField('collectingEvent');
      if (
        ceField?.isDependent() &&
        collectionObject.get('collectingEvent') === undefined
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
                if (other.cid !== determinaton.cid)
                  other.set('isCurrent', false);
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
      isCurrent: (
        determination: SpecifyResource<Determination>
      ): Promise<BusinessRuleResult> => {
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
  DisposalPreparation: {
    fieldChecks: {
      quantity: (disposalPrep: SpecifyResource<DisposalPreparation>): void => {
        checkPrepAvailability(disposalPrep);
      },
    },
  },
  DNASequence: {
    fieldChecks: {
      geneSequence: (dnaSequence: SpecifyResource<DNASequence>): void => {
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
    customInit: (resource: SpecifyResource<LoanPreparation>): void => {
      if (!resource.isNew())
        resource.rgetCollection('loanReturnPreparations').then(updateLoanPrep);
    },
    fieldChecks: {
      quantity: (iprep: SpecifyResource<LoanPreparation>): void => {
        checkPrepAvailability(iprep);
      },
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
      ) => {
        const returned = Number(loanReturnPrep.get('quantityReturned'))!;
        const previousReturned =
          previousLoanPreparations.previousReturned[loanReturnPrep.cid] ?? 0;
        const previousResolved =
          previousLoanPreparations.previousResolved[loanReturnPrep.cid] ?? 0;

        const totalLoaned = getTotalLoaned(loanReturnPrep)!;

        const totalResolved = getTotalResolved(loanReturnPrep)!;
        const available = totalLoaned - totalResolved;

        if (returned != previousReturned) {
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

/*  From this code, Typescript believes that a businessRuleDefs uniqueIn can be from any table
 *  For example, it believes the following is possible:
 *  BusinessRuleDefs<BorrowMaterial> & {uniqueIn: UniquenessRule<Accession> | UniquenessRule<AccessionAgent> | ...}
 */
// @ts-expect-error
export const businessRuleDefs: MappedBusinessRuleDefs = Object.fromEntries(
  (
    Object.keys({ ...uniqueRules, ...nonUniqueBusinessRuleDefs }) as RA<
      keyof Tables
    >
  ).map((table) => {
    /*
     * To ensure compatibility and consistency with other areas of the frontend,
     * the undefined type is preferable over the null type.
     * In the JSON uniqueness rules, if a field should be unique at a global (institution)
     * level, then it is unique in 'null'.
     * Thus we need to replace null with undefined
     */
    const uniquenessRules: UniquenessRule<Tables[typeof table]> | undefined =
      uniqueRules[table] !== undefined
        ? Object.fromEntries(
            Object.entries(uniqueRules[table]!).map(([fieldName, rule]) => {
              return [fieldName, rule[0] === null ? [undefined] : rule];
            })
          )
        : undefined;
    const ruleDefs =
      nonUniqueBusinessRuleDefs[table] === undefined
        ? uniquenessRules === undefined
          ? undefined
          : { uniqueIn: uniquenessRules }
        : Object.assign({}, nonUniqueBusinessRuleDefs[table], {
            uniqueIn: uniquenessRules,
          });
    return [table, ruleDefs];
  })
);
