import { formsText } from '../../localization/forms';
import { getPrepAvailability } from '../../utils/ajax/specifyApi';
import { f } from '../../utils/functools';
import { AnyInteractionPreparation } from './helperTypes';
import { SpecifyResource } from './legacyTypes';
import { fetchResource, idFromUrl } from './resource';
import { Collection } from './specifyModel';
import { LoanPreparation, LoanReturnPreparation } from './types';

type InteractionBusinessRules = {
  previousReturned: { [prepCid: number]: number };
  previousResolved: { [prepCid: number]: number };
};

export var interactionCache = f.store(
  (): InteractionBusinessRules => ({
    previousReturned: {},
    previousResolved: {},
  })
);

export const getTotalLoaned = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
): number | undefined => {
  return loanReturnPrep.collection
    ? loanReturnPrep.collection.related?.get('quantity')
    : undefined;
};

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
        memo.returned += typeof returned === 'number' ? returned : 0;
        memo.resolved += typeof resolved === 'number' ? resolved : 0;
        return memo;
      },
      { returned: 0, resolved: 0 }
    );
    const loanPrep: SpecifyResource<LoanPreparation> =
      collection.related as SpecifyResource<LoanPreparation>;
    loanPrep.set('quantityReturned', sums.returned);
    loanPrep.set('quantityResolved', sums.resolved);
  }
};

export const getTotalResolved = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
) => {
  return loanReturnPrep.collection
    ? loanReturnPrep.collection.models.reduce((sum, loanPrep) => {
        const resolved = loanPrep.get('quantityResolved');
        return loanPrep.cid != loanReturnPrep.cid
          ? sum + (typeof resolved === 'number' ? resolved : 0)
          : sum;
      }, 0)
    : loanReturnPrep.get('quantityResolved');
};

const updatePrepBlockers = (
  interactionPrep: SpecifyResource<AnyInteractionPreparation>
): Promise<void> => {
  const prepUri = interactionPrep.get('preparation') ?? '';
  const prepId = idFromUrl(prepUri);
  return prepId === undefined
    ? Promise.resolve()
    : fetchResource('Preparation', prepId)
        .then((preparation) => {
          const prepQuanity = interactionPrep.get('quantity');
          return typeof preparation.countAmt === 'number' &&
            typeof prepQuanity === 'number'
            ? preparation.countAmt >= prepQuanity
            : false;
        })
        .then((isValid) => {
          if (!isValid) {
            if (interactionPrep.saveBlockers?.blockers)
              interactionPrep.saveBlockers?.add(
                'parseError-quantity',
                'quantity',
                formsText.invalidValue()
              );
          } else {
            interactionPrep.saveBlockers?.remove('parseError-quantity');
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
    updatePrepBlockers(interactionPrep);
    const interactionId = interactionPrep.isNew()
      ? undefined
      : interactionPrep.get('id');
    const interactionModelName = interactionPrep.isNew()
      ? undefined
      : interactionPrep.specifyModel.name;
    if (prepId !== undefined)
      getPrepAvailability(prepId, interactionId, interactionModelName!).then(
        (available) => {
          const quantity = interactionPrep.get('quantity');
          if (
            typeof available != 'undefined' &&
            typeof quantity === 'number' &&
            Number(available[0]) < quantity
          ) {
            interactionPrep.set('quantity', Number(available[0]));
          }
        }
      );
  }
};
