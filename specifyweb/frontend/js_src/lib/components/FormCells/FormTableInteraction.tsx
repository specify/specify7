import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { getField } from '../DataModel/helpers';
import { schema } from '../DataModel/schema';
import type { Collection, SpecifyModel } from '../DataModel/specifyModel';
import type {
  Disposal,
  DisposalPreparation,
  Gift,
  GiftPreparation,
  Loan,
  LoanPreparation,
} from '../DataModel/types';
import { InteractionDialog } from '../Interactions/InteractionDialog';
import { FormTableCollection } from './FormTableCollection';

export function FormTableInteraction(
  props: Omit<
    Parameters<typeof FormTableCollection>[0],
    'onAdd' | 'onFetchMore'
  >
): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();
  return (
    <>
      {isOpen && typeof props.collection.related === 'object' ? (
        <InteractionDialog
          action={{
            model: props.collection.related.specifyModel as SpecifyModel<
              Disposal | Gift | Loan
            >,
          }}
          itemCollection={
            props.collection as Collection<
              DisposalPreparation | GiftPreparation | LoanPreparation
            >
          }
          searchField={getField(
            schema.models.CollectionObject,
            'catalogNumber'
          )}
          table={schema.models.CollectionObject}
          onClose={handleClose}
        />
      ) : undefined}
      <FormTableCollection {...props} onAdd={handleOpen} />
    </>
  );
}
