import React from 'react';

import { ajax } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { RA } from '../types';
import { Button, Ul } from './basic';
import { useAsyncState, useBooleanState } from './hooks';
import { icons } from './icons';
import { Dialog, dialogClassNames, loadingBar } from './modaldialog';
import { LoadingContext } from './contexts';

export function DeleteButton<SCHEMA extends AnySchema>({
  model,
  deletionMessage = formsText('deleteConfirmationDialogMessage'),
  onDeleted: handleDeleted,
}: {
  readonly model: SpecifyResource<SCHEMA>;
  readonly deletionMessage?: React.ReactNode;
  readonly onDeleted?: () => void;
}): JSX.Element {
  const [blockers] = useAsyncState<RA<string>>(
    React.useCallback(
      async () =>
        ajax<RA<string>>(
          `/api/delete_blockers/${model.specifyModel.name.toLowerCase()}/${
            model.id
          }/`,
          {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            headers: { Accept: 'application/json' },
          }
        ).then(({ data }) => data),
      [model]
    ),
    false
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  return (
    <>
      <Button.Gray onClick={handleOpen}>
        {Array.isArray(blockers) && blockers.length > 0
          ? icons.exclamation
          : undefined}
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
            title={formsText('deleteConfirmationDialogTitle')}
            header={formsText('deleteConfirmationDialogHeader')}
            onClose={handleClose}
            className={{
              container: dialogClassNames.narrowContainer,
            }}
            buttons={
              <>
                <Button.Red
                  onClick={(): void =>
                    loading(model.destroy().then(handleDeleted))
                  }
                >
                  {commonText('delete')}
                </Button.Red>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              </>
            }
          >
            {deletionMessage}
          </Dialog>
        ) : (
          <Dialog
            title={formsText('deleteBlockedDialogTitle')}
            header={formsText('deleteBlockedDialogHeader')}
            buttons={commonText('close')}
            onClose={handleClose}
            className={{
              container: dialogClassNames.narrowContainer,
            }}
          >
            {formsText('deleteBlockedDialogMessage')}
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
