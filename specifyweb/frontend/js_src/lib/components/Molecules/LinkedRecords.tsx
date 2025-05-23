import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { useBooleanState } from '../../hooks/useBooleanState';
import { useLiveState } from '../../hooks/useLiveState';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { mergingText } from '../../localization/merging';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import type { AnySchema } from '../DataModel/helperTypes';
import { DeleteBlockers } from '../Forms/DeleteBlocked';
import type { DeleteButtonProps } from '../Forms/DeleteButton';
import { fetchBlockers } from '../Forms/DeleteButton';
import { loadingBar } from '.';
import { Dialog, dialogClassNames } from './Dialog';

/**
 * REFACTOR: Merge with Merging/Usages
 */
export function LinkedRecords<SCHEMA extends AnySchema>({
  resource,
  deferred: initialDeferred = false,
}: DeleteButtonProps<SCHEMA>): JSX.Element {
  const [deferred, setDeferred] = useLiveState<boolean>(
    React.useCallback(() => initialDeferred, [initialDeferred, resource])
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const [blockers, setBlockers] = useAsyncState(
    React.useCallback(
      async () => (deferred ? undefined : fetchBlockers(resource)),
      [resource, deferred]
    ),
    false
  );

  return (
    <>
      <Button.Secondary
        disabled={
          !deferred && (blockers === undefined || blockers.length === 0)
        }
        title={
          blockers === undefined
            ? commonText.loading()
            : blockers.length === 0
              ? formsText.noLinkedRecords()
              : mergingText.linkedRecords()
        }
        onClick={() => {
          handleOpen();
          setDeferred(false);
        }}
      >
        {icons.documentSearch}
        {deferred
          ? undefined
          : blockers === undefined
            ? commonText.loading()
            : localized(
                blockers
                  .reduce(
                    (sum, blocker) =>
                      sum +
                      blocker.blockers.reduce(
                        (innerSum, { ids }) => innerSum + ids.length,
                        0
                      ),
                    0
                  )
                  .toLocaleString() // This formats the count nicely.
              )}
      </Button.Secondary>
      {isOpen ? (
        blockers === undefined ? (
          // This dialog is shown while the delete blockers are being fetched
          <Dialog
            buttons={commonText.cancel()}
            className={{ container: dialogClassNames.narrowContainer }}
            header={commonText.loading()}
            onClose={handleClose}
          >
            {formsText.checkingIfResourceIsUsed()}
            {loadingBar}
          </Dialog>
        ) : blockers.length === 0 ? (
          /*
           * This dialog is shown when there are no linked records.
           * In most cases, the user will not see this, but if it takes some
           * time to fetch the linked records, this dialog will be shown once
           * fetching is done.
           */
          <Dialog
            buttons={commonText.close()}
            children={undefined}
            className={{ container: dialogClassNames.narrowContainer }}
            header={formsText.noLinkedRecords()}
            icon={icons.documentSearch}
            onClose={handleClose}
          /> // This dialog is shown when the resource cannot be deleted or when the resource is being used
        ) : (
          <Dialog
            buttons={commonText.close()}
            className={{
              container: dialogClassNames.wideContainer,
            }}
            header={mergingText.linkedRecords()}
            icon={icons.documentSearch}
            onClose={handleClose}
          >
            {formsText.recordUsedDescription()}
            <DeleteBlockers
              blockers={[blockers, setBlockers]}
              resource={resource}
            />
          </Dialog>
        )
      ) : undefined}
    </>
  );
}
