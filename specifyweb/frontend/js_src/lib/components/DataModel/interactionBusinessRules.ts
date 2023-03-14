import { getPrepAvailability } from '../../utils/ajax/specifyApi';
import { AnyInteractionPreparation } from './helperTypes';
import { SpecifyResource } from './legacyTypes';
import { fetchResource, idFromUrl } from './resource';
import { Collection } from './specifyModel';
import { LoanPreparation, LoanReturnPreparation } from './types';

type PreviousLoanReturnPreparations = {
  previousReturned: {
    [cid: string]: number;
  };
  previousResolved: {
    [cid: string]: number;
  };
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
): number | undefined => {
  return loanReturnPrep.collection !== undefined
    ? loanReturnPrep.collection.related?.get('quantity')
    : undefined;
};

/**
 * Given a LoanReturnPreparation, return its LoanPreparation's quantityReturned
 */
export const getTotalReturned = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
) => {
  return loanReturnPrep.collection !== null
    ? loanReturnPrep.collection.models.reduce((sum, loanPrep) => {
        const returned = loanPrep.get('quantityReturned');
        return loanPrep.cid != loanReturnPrep.cid
          ? sum + (typeof returned === 'number' ? returned : 0)
          : sum;
      }, 0)
    : loanReturnPrep.get('quantityReturned');
};

/**
 * Given a LoanReturnPreparation, return its LoanPreparation's quantityResolved
 */
export const getTotalResolved = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
) => {
  return loanReturnPrep.collection !== null
    ? loanReturnPrep.collection.models.reduce((sum, loanPrep) => {
        const resolved = loanPrep.get('quantityResolved');
        return loanPrep.cid != loanReturnPrep.cid
          ? sum + (typeof resolved === 'number' ? resolved : 0)
          : sum;
      }, 0)
    : loanReturnPrep.get('quantityResolved');
};

/**
 * Given a collection of LoanReturnPreparations, iterate through the
 * collection and store the sum all of the quantityReturned and quantityResolved
 * into an object
 *
 * Then, update the related Loan Preparation and set its quantityReturned and
 * quantityResolved to the summed object values
 */
export const updateLoanPrep = (
  collection: Collection<LoanReturnPreparation>
) => {
  if (
    collection != undefined &&
    collection.related?.specifyModel.name == 'LoanPreparation'
  ) {
    const sums = collection.models.reduce(
      (memo: { returned: number; resolved: number }, loanReturnPrep) => {
        const returned = loanReturnPrep.get('quantityReturned');
        const resolved = loanReturnPrep.get('quantityResolved');
        memo.returned +=
          typeof returned === 'number' || typeof returned === 'string'
            ? Number(returned)
            : 0;
        memo.resolved +=
          typeof resolved === 'number' || typeof resolved === 'string'
            ? Number(resolved)
            : 0;
        return memo;
      },
      { returned: 0, resolved: 0 }
    );
    const loanPrep = collection.related as SpecifyResource<LoanPreparation>;
    loanPrep.set('quantityReturned', sums.returned);
    loanPrep.set('quantityResolved', sums.resolved);
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
  if (
    interactionPrep != undefined &&
    interactionPrep.get('preparation') != undefined
  ) {
    const prepUri = interactionPrep.get('preparation');
    const prepId = typeof prepUri === 'string' ? idFromUrl(prepUri) : undefined;
    validateInteractionPrepQuantity(interactionPrep);
    const interactionId = interactionPrep.isNew()
      ? undefined
      : interactionPrep.get('id');
    const interactionModelName = interactionPrep.specifyModel.name;
    if (prepId !== undefined)
      getPrepAvailability(prepId, interactionId, interactionModelName).then(
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
