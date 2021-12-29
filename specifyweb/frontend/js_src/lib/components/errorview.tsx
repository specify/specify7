import React from 'react';

import commonText from '../localization/common';
import { clearUnloadProtect } from '../navigation';
import { ModalDialog } from './modaldialog';
import createBackboneView from './reactbackboneextend';
import { useTitle } from './common';

function ErrorComponent({
  header,
  message,
}: {
  readonly header: string;
  readonly message: string;
}): JSX.Element {
  useTitle(header);

  return (
    <>
      <h2>{header}</h2>
      <p>{message}</p>
    </>
  );
}

export const ErrorView = createBackboneView(ErrorComponent);

function UnhandledErrorComponent({
  response,
}: {
  readonly response: string;
}): JSX.Element {
  React.useEffect(clearUnloadProtect, []);
  useTitle(commonText('backEndErrorDialogTitle'));

  return (
    <ModalDialog
      properties={{
        width: '800',
        title: commonText('backEndErrorDialogTitle'),
        dialogClass: 'ui-dialog-no-close',
        buttons: [
          {
            text: commonText('close'),
            click(): void {
              window.location.href = '/';
            },
          },
        ],
      }}
    >
      {commonText('backEndErrorDialogHeader')}
      <p>{commonText('backEndErrorDialogMessage')}</p>
      <textarea
        readOnly
        value={response}
        style={{
          width: '100%',
          minHeight: '600px',
        }}
      />
    </ModalDialog>
  );
}

export const UnhandledErrorView = createBackboneView(UnhandledErrorComponent);
