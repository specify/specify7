import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { commonText } from '../../localization/common';
import { statsText } from '../../localization/stats';
import { StringToJsx } from '../../localization/utils';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { className } from '../Atoms/className';
import { Dialog } from '../Molecules/Dialog';

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
          header={localized(
            `${statsText.deleteCategory()} '${categoryLabel}'?`
          )}
          onClose={toggleTriedToDelete}
        >
          {statsText.deleteWarning()}{' '}
          <StringToJsx
            components={{
              wrap: <i className="flex items-center gap-2">{categoryLabel}</i>,
            }}
            string={commonText.jsxColonLine({
              label: statsText.categoryToDelete(),
            })}
          />
        </Dialog>
      )}
    </>
  );
}
