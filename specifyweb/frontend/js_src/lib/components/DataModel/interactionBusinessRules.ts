import { f } from '../../utils/functools';
import { getPrepAvailability } from '../Interactions/helpers';
import type { AnyInteractionPreparation } from './helperTypes';
import type { SpecifyResource } from './legacyTypes';
import { fetchResource, idFromUrl } from './resource';
import type { Collection } from './specifyTable';
import type { LoanPreparation, LoanReturnPreparation } from './types';

type PreviousLoanReturnPreparations = {
  readonly previousReturned: Record<string, number>;
  readonly previousResolved: Record<string, number>;
};

/**
 * This object is used to maintain an 'asychronous' count of previousReturned
 * and previousResolved for LoanReturnPreparation.
 * The internal _previous_attributes can not be used here as that would cause an infinite
 * recursion chain
 *
 * For uses of this object, see the LoanReturnPreparation business rules in
 * businessRuleDefs.ts
 */
export const previousLoanPreparations: PreviousLoanReturnPreparations = {
  previousReturned: {},
  previousResolved: {},
};

/**
 * Given a LoanReturnPreparation, return its LoanPreparation's quantity
 */

export const getTotalLoaned = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
): number | undefined =>
  loanReturnPrep.collection === undefined
    ? undefined
    : loanReturnPrep.collection.related?.get('quantity');

/**
 * Given a LoanReturnPreparation, return its LoanPreparation's quantityReturned
 */
export const getTotalReturned = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
) =>
  loanReturnPrep.collection === undefined
    ? loanReturnPrep.get('quantityReturned')
    : loanReturnPrep.collection.models.reduce((sum, loanPrep) => {
        const returned = loanPrep.get('quantityReturned');
        return loanPrep.cid === loanReturnPrep.cid
          ? sum
          : sum + (typeof returned === 'number' ? returned : 0);
      }, 0);

/**
 * Given a LoanReturnPreparation, return its LoanPreparation's quantityResolved
 */
export const getTotalResolved = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
): number =>
  loanReturnPrep.collection === undefined
    ? loanReturnPrep.get('quantityResolved')
    : loanReturnPrep.collection.models.reduce((sum, loanPrep) => {
        const resolved = loanPrep.get('quantityResolved');
        return loanPrep.cid === loanReturnPrep.cid
          ? sum
          : sum + (typeof resolved === 'number' ? resolved : 0);
      }, 0);

/**
 * Given a collection of LoanReturnPreparations, iterate through the
 * collection and store the sum all of the quantityReturned and quantityResolved
 * into an object
 *
 * Then, update the related Loan Preparation and set its quantityReturned and
 * quantityResolved to the summed object values
 */
export const updateLoanPrep = (
  collection: Collection<LoanReturnPreparation> | undefined,
  silent: boolean = false
) => {
  if (
    collection !== undefined &&
    collection.related?.specifyTable.name === 'LoanPreparation'
  ) {
    const sums = collection.models.reduce<{
      readonly returned: number;
      readonly resolved: number;
    }>(
      (memo, loanReturnPrep) => {
        const returned = loanReturnPrep.get('quantityReturned');
        const resolved = loanReturnPrep.get('quantityResolved');
        return {
          returned:
            memo.returned +
            (f.parseInt(returned?.toString() ?? undefined) ?? 0),
          resolved:
            memo.resolved +
            (f.parseInt(resolved?.toString() ?? undefined) ?? 0),
        };
      },
      { returned: 0, resolved: 0 }
    );
    const loanPrep = collection.related as SpecifyResource<LoanPreparation>;
    loanPrep.set('quantityReturned', sums.returned, { silent });
    loanPrep.set('quantityResolved', sums.resolved, { silent });
  }
};

/**
 * Check to enure an Interaction Preparation's quantity is greater
 * than or equal to zero and less than preparation's count.
 * If the interactionPrep's quantity exceeds this range, set it
 * to the closest maxiumum of the range
 */
const validateInteractionPrepQuantity = (
  interactionPrep: SpecifyResource<AnyInteractionPreparation>
) => {
  const prepUri = interactionPrep.get('preparation') ?? '';
  const prepId = idFromUrl(prepUri);
  prepId === undefined
    ? Promise.resolve()
    : fetchResource('Preparation', prepId).then((preparation) => {
        const prepQuanity = interactionPrep.get('quantity');

        if (typeof preparation.countAmt === 'number') {
          if (Number(prepQuanity) >= preparation.countAmt)
            interactionPrep.set('quantity', preparation.countAmt);
          if (Number(prepQuanity) < 0) interactionPrep.set('quantity', 0);
        }
      });
};

export const checkPrepAvailability = (
  interactionPrep: SpecifyResource<AnyInteractionPreparation>
) => {
  const preparation = interactionPrep.get('preparation');
  if (
    interactionPrep !== undefined &&
    preparation !== null &&
    preparation !== undefined
  ) {
    const prepUri = interactionPrep.get('preparation');
    const prepId = typeof prepUri === 'string' ? idFromUrl(prepUri) : undefined;
    validateInteractionPrepQuantity(interactionPrep);
    const interactionId = interactionPrep.isNew()
      ? undefined
      : interactionPrep.get('id');
    const interactionTableName = interactionPrep.specifyTable.name;
    if (prepId !== undefined)
      getPrepAvailability(prepId, interactionId, interactionTableName).then(
        (available) => {
          const quantity = interactionPrep.get('quantity');
          if (
            available != 'null' &&
            typeof quantity === 'number' &&
            Number(available[0]) < quantity
          ) {
            interactionPrep.set('quantity', Number(available[0]));
          }
        }
      );
  }
};
