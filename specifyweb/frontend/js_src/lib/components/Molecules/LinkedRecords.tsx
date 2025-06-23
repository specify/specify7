import React from 'react';

import { useBooleanState } from '../../hooks/useBooleanState';
import { useDeleteBlockers } from '../../hooks/useDeleteBlockers';
import { commonText } from '../../localization/common';
import { formsText } from '../../localization/forms';
import { mergingText } from '../../localization/merging';
import { localized } from '../../utils/types';
import { Button } from '../Atoms/Button';
import { icons } from '../Atoms/Icons';
import type { AnySchema } from '../DataModel/helperTypes';
import { DeleteBlockers } from '../Forms/DeleteBlocked';
import type { DeleteButtonProps } from '../Forms/DeleteButton';
import { loadingBar } from '.';
import { Dialog, dialogClassNames } from './Dialog';
import { SECOND } from '../Atoms/timeUnits';
import { useDelay } from '../../hooks/useDelay';

const LOADING_TIMEOUT = 2 * SECOND;

// REFACTOR: consider merging this with Merging/Usages
export function LinkedRecords<SCHEMA extends AnySchema>({
  resource,
  // Whether to defer fetching the Linked Records until the Button is clicked
  deferred = false,
}: DeleteButtonProps<SCHEMA>): JSX.Element {
  const [isOpen, handleOpen, handleClose] = useBooleanState();

  const { blockers, setBlockers, fetchBlockers } = useDeleteBlockers(
    resource,
    deferred
  );

  // To reduce sudden shifts in the button, only display the Loading... text on
  // the Linked Records button only after it has already been fetching for 2
  // seconds
  const showLoadingText = useDelay(blockers === undefined, LOADING_TIMEOUT);

  return (
    <>
      <Button.Secondary
        aria-pressed={isOpen}
        aria-label={mergingText.linkedRecords()}
        disabled={blockers !== false && blockers?.length === 0}
        title={
          blockers === undefined
            ? commonText.loading()
            : Array.isArray(blockers) && blockers.length === 0
              ? formsText.noLinkedRecords()
              : mergingText.linkedRecords()
        }
        onClick={() => {
          handleOpen();
          fetchBlockers();
        }}
      >
        {icons.documentSearch}
        {blockers === false
          ? undefined
          : blockers === undefined
            ? showLoadingText
              ? commonText.loading()
              : undefined
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
        /*
         * This would be shown if the blockers aren't being fetched and aren't
         * already fetched.
         * This branch should never be accessed, but just in case
         */
        blockers === false ? (
          <Dialog
            buttons={commonText.cancel()}
            className={{ container: dialogClassNames.narrowContainer }}
            header={mergingText.linkedRecords()}
            onClose={handleClose}
          >
            <Button.Secondary onClick={() => fetchBlockers(true)}>
              {mergingText.linkedRecords()}
            </Button.Secondary>
          </Dialog>
        ) : blockers === undefined ? (
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
