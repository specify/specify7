import React from 'react';

import ajax from '../ajax';
import { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import commonText from '../localization/common';
import formsText from '../localization/forms';
import type { RA } from '../types';
import { Button } from './basic';
import icons from './icons';
import { Dialog, dialogClassNames, loadingBar } from './modaldialog';
import createBackboneView from './reactbackboneextend';

function DeleteButton<SCHEMA extends AnySchema>({
  model,
  deleteMessage = formsText('deleteConfirmationDialogMessage'),
  onDeleted: handleDeleted,
}: {
  readonly model: SpecifyResource<SCHEMA>;
  readonly deleteMessage?: React.ReactNode;
  readonly onDeleted?: () => void;
}): JSX.Element {
  const [blockers, setBlockers] = React.useState<RA<string> | undefined>(
    undefined
  );
  React.useEffect(() => {
    void ajax<RA<string>>(
      `/api/delete_blockers/${model.specifyModel.name.toLowerCase()}/${
        model.id
      }/`,
      {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        headers: { Accept: 'application/json' },
      }
    ).then(({ data }) => (destructorCalled ? undefined : setBlockers(data)));

    let destructorCalled = false;
    return (): void => {
      destructorCalled = true;
    };
  }, [model]);

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button.Gray onClick={(): void => setIsOpen(true)}>
        {typeof blockers === 'object' && blockers.length > 0
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
            onClose={(): void => setIsOpen(false)}
          >
            {formsText('checkingIfResourceCanBeDeleted')}
            {loadingBar}
          </Dialog>
        ) : blockers.length === 0 ? (
          <Dialog
            title={formsText('deleteConfirmationDialogTitle')}
            header={formsText('deleteConfirmationDialogHeader')}
            onClose={(): void => setIsOpen(false)}
            className={{
              container: dialogClassNames.narrowContainer,
            }}
            buttons={
              <>
                <Button.Red
                  onClick={(): void => void model.destroy().then(handleDeleted)}
                >
                  {commonText('delete')}
                </Button.Red>
                <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
              </>
            }
          >
            {deleteMessage}
          </Dialog>
        ) : (
          <Dialog
            title={formsText('deleteBlockedDialogTitle')}
            header={formsText('deleteBlockedDialogHeader')}
            buttons={commonText('close')}
            onClose={(): void => setIsOpen(false)}
            className={{
              container: dialogClassNames.narrowContainer,
            }}
          >
            {formsText('deleteBlockedDialogMessage')}
            <ul>
              {blockers.map((blocker, index) => (
                <li key={index}>{blocker}</li>
              ))}
            </ul>
          </Dialog>
        )
      ) : undefined}
    </>
  );
}

export default createBackboneView(DeleteButton);
