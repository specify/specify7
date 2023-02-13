import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import type { Collection, SpecifyTable } from '../DataModel/specifyTable';
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
            table: props.collection.related.specifyTable as SpecifyTable<
              Disposal | Gift | Loan
            >,
          }}
          itemCollection={
            props.collection as Collection<
              DisposalPreparation | GiftPreparation | LoanPreparation
            >
          }
          onClose={handleClose}
        />
      ) : undefined}
      <FormTableCollection {...props} onAdd={handleOpen} />
    </>
  );
}
