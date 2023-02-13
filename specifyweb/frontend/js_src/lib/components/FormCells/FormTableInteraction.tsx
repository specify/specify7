import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import type { Collection } from '../DataModel/specifyTable';
import type {
  DisposalPreparation,
  GiftPreparation,
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
          actionTable={props.collection.related.specifyTable}
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
