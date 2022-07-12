import React from 'react';

import { ajax } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { RA } from '../types';
import { Button, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog, dialogClassNames, loadingBar } from './modaldialog';

/**
 * A button to delele a resorce
 * Prompts before deletion
 * Checks for delete blockers (other resources depending on this one) before
 * deletion
 */
export function DeleteButton<SCHEMA extends AnySchema>({
  resource,
  deletionMessage = formsText('deleteConfirmationDialogText'),
  onDeleted: handleDeleted,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly deletionMessage?: React.ReactNode;
  readonly onDeleted?: () => void;
}): JSX.Element {
  const [blockers] = useAsyncState<RA<string>>(
    React.useCallback(
      async () =>
        ajax<RA<string>>(
          `/api/delete_blockers/${resource.specifyModel.name.toLowerCase()}/${
            resource.id
          }/`,
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Accept: 'application/json' },
          }
        ).then(({ data }) => data),
      [resource]
    ),
    false
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  const isBlocked = Array.isArray(blockers) && blockers.length > 0;
  return (
    <>
      <Button.Gray
        onClick={handleOpen}
        title={isBlocked ? formsText('deleteBlockedDialogHeader') : undefined}
      >
        {isBlocked ? icons.exclamation : undefined}
        {commonText('delete')}
      </Button.Gray>
      {isOpen ? (
        typeof blockers === 'undefined' ? (
          <Dialog
            header={commonText('loading')}
            className={{ container: dialogClassNames.narrowContainer }}
            buttons={commonText('cancel')}
            onClose={handleClose}
          >
            {formsText('checkingIfResourceCanBeDeleted')}
            {loadingBar}
          </Dialog>
        ) : blockers.length === 0 ? (
          <Dialog
            header={formsText(
              'deleteConfirmationDialogHeader',
              resource.specifyModel.label
            )}
            onClose={handleClose}
            className={{
              container: dialogClassNames.narrowContainer,
            }}
            buttons={
              <>
                <Button.Red
                  onClick={(): void => {
                    /*
                     * TODO: move this into ResourceApi.js
                     */
                    // @ts-expect-error Changing a read-only parameter
                    resource.needsSaved = false;
                    loading(resource.destroy().then(handleDeleted));
                  }}
                >
                  {commonText('delete')}
                </Button.Red>
                <span className="flex-1 -ml-2" />
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              </>
            }
          >
            {deletionMessage}
          </Dialog>
        ) : (
          <Dialog
            header={formsText('deleteBlockedDialogHeader')}
            buttons={commonText('close')}
            onClose={handleClose}
            className={{
              container: dialogClassNames.narrowContainer,
            }}
          >
            {formsText('deleteBlockedDialogText')}
            <Ul>
              {blockers.map((blocker, index) => (
                <li key={index}>{blocker}</li>
              ))}
            </Ul>
          </Dialog>
        )
      ) : undefined}
    </>
  );
}
