import React from 'react';

import { ajax } from '../ajax';
import type { AnySchema } from '../datamodelutils';
import type { SpecifyResource } from '../legacytypes';
import { commonText } from '../localization/common';
import { formsText } from '../localization/forms';
import type { RA } from '../types';
import { Button, Ul } from './basic';
import { LoadingContext } from './contexts';
import { useAsyncState, useBooleanState, useLiveState } from './hooks';
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
  deferred: initialDeferred = false,
  component: ButtonComponent = Button.Gray,
  onDeleted: handleDeleted,
}: {
  readonly resource: SpecifyResource<SCHEMA>;
  readonly deletionMessage?: React.ReactNode;
  /**
   * As a performance optimization, can defer checking for delete blockers
   * until the button is clicked. This is used in the tree viewer as delete
   * button's resource can change often.
   */
  readonly deferred?: boolean;
  readonly component?: typeof Button['Gray'];
  readonly onDeleted?: () => void;
}): JSX.Element {
  const [deferred, setDeferred] = useLiveState<boolean>(
    React.useCallback(() => initialDeferred, [initialDeferred, resource])
  );
  const [blockers] = useAsyncState<RA<string>>(
    React.useCallback(
      async () =>
        deferred
          ? undefined
          : ajax<RA<string>>(
              `/api/delete_blockers/${resource.specifyModel.name.toLowerCase()}/${
                resource.id
              }/`,
              {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                headers: { Accept: 'application/json' },
              }
            ).then(({ data }) => data),
      [resource, deferred]
    ),
    false
  );

  const [isOpen, handleOpen, handleClose] = useBooleanState();
  const loading = React.useContext(LoadingContext);

  return (
    <>
      <ButtonComponent
        onClick={(): void => {
          handleOpen();
          setDeferred(false);
        }}
      >
        {Array.isArray(blockers) && blockers.length > 0
          ? icons.exclamation
          : undefined}
        {commonText('delete')}
      </ButtonComponent>
      {isOpen ? (
        blockers === undefined ? (
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
            header={formsText('deleteConfirmationDialogHeader')}
            onClose={handleClose}
            className={{
              container: dialogClassNames.narrowContainer,
            }}
            buttons={
              <>
                <Button.Red
                  onClick={(): void => {
                    /*
                     * REFACTOR: move this into ResourceApi.js
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
