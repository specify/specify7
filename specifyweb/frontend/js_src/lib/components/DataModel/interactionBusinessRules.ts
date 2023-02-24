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
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>,
  collection: Collection<LoanPreparation>
) => {
  if (
    collection != undefined &&
    collection.related?.specifyModel.name == 'LoanPreparation'
  ) {
    const sums = collection.models.reduce(
      (memo: { returned: number; resolved: number }, loanReturnPrep) => {
        memo.returned += loanReturnPrep.get('quantityReturned');
        memo.resolved += loanReturnPrep.get('quantityResolved');
        return memo;
      },
      { returned: 0, resolved: 0 }
    );
    const loanPrep: SpecifyResource<LoanPreparation> = collection.related;
    loanPrep.set('quantityReturned', sums.returned);
    loanPrep.set('quantityResolved', sums.resolved);
  }
};

export const getTotalResolved = (
  loanReturnPrep: SpecifyResource<LoanReturnPreparation>
) => {
  return loanReturnPrep.collection
    ? loanReturnPrep.collection.models.reduce((sum, loanPrep) => {
        return loanPrep.cid != loanReturnPrep.cid
          ? sum + loanPrep.get('quantityResolved')
          : sum;
      }, 0)
    : loanReturnPrep.get('quantityResolved');
};

const updatePrepBlockers = (
  interactionPrep: SpecifyResource<AnyInteractionPreparation>
): Promise<void> => {
  const prepUri = interactionPrep.get('preparation') ?? '';
  const prepId = idFromUrl(prepUri);
  return fetchResource('Preparation', prepId)
    .then((preparation) => {
      return preparation.countAmt >= interactionPrep.get('quantity');
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
    const prepId = idFromUrl(prepUri);
    updatePrepBlockers(interactionPrep);
    const interactionId = interactionPrep.isNew()
      ? undefined
      : interactionPrep.get('id');
    const interactionModelName = interactionPrep.isNew()
      ? undefined
      : interactionPrep.specifyModel.name;

    getPrepAvailability(prepId!, interactionId, interactionModelName!).then(
      (available) => {
        if (
          typeof available != 'undefined' &&
          Number(available[0]) < interactionPrep.get('quantity')
        ) {
          interactionPrep.set('quantity', Number(available[0]));
        }
      }
    );
  }
};
