import React from 'react';
import { useBooleanState } from '../../hooks/useBooleanState';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { statsText } from '../../localization/stats';
import { Dialog } from '../Molecules/Dialog';
import { commonText } from '../../localization/common';

export function DeleteStatsCategory({
  onDelete: handleDelete,
  categoryLabel,
}: {
  readonly categoryLabel: string;
  readonly onDelete: () => void;
}): JSX.Element {
  const [triedToDelete, _, __, toggleTriedToDelete] = useBooleanState(false);
  return (
    <>
      <Button.Small
        variant={className.secondaryButton}
        onClick={toggleTriedToDelete}
      >
        {statsText.deleteCategory()}
      </Button.Small>
      {triedToDelete && (
        <Dialog
          header={`${statsText.deleteCategory()} ${categoryLabel}?`}
          buttons={
            <>
              <Button.Danger
                onClick={() => {
                  handleDelete();
                  toggleTriedToDelete();
                }}
              >
                {commonText.delete()}
              </Button.Danger>
              <span className="-ml-2 flex-1" />
              <Button.DialogClose>{commonText.cancel()}</Button.DialogClose>
            </>
          }
          onClose={toggleTriedToDelete}
        >
          {statsText.deleteWarning()}
        </Dialog>
      )}
    </>
  );
}
