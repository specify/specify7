import commonText from '../localization/common';
import { clearUnloadProtect } from '../navigation';
import { Button, Container, H2 } from './basic';
import createBackboneView from './reactbackboneextend';
import { Dialog, dialogClassNames } from './modaldialog';
import React from 'react';

function ErrorComponent({
  header,
  message,
}: {
  readonly header: string;
  readonly message: string;
}): JSX.Element {
  return (
    <Container>
      <H2>{header}</H2>
      <p>{message}</p>
    </Container>
  );
}

export const ErrorView = createBackboneView(ErrorComponent);

function UnhandledError({
  response,
  onClose: handleClose,
}: {
  readonly response: string;
  readonly onClose: () => void;
}): JSX.Element {
  React.useEffect(clearUnloadProtect, []);

  return (
    <Dialog
      title={commonText('backEndErrorDialogTitle')}
      header={commonText('backEndErrorDialogHeader')}
      forceToTop={true}
      className={{
        content: dialogClassNames.wideContainer,
      }}
      onClose={undefined}
      buttons={
        <>
          <Button.Red
            onClick={(): void => {
              window.location.href = '/';
            }}
          >
            {commonText('close')}
          </Button.Red>
          {process.env.NODE_ENV !== 'production' && (
            <Button.Blue onClick={handleClose}>
              [development] dismiss
            </Button.Blue>
          )}
        </>
      }
    >
      {commonText('backEndErrorDialogMessage')}
      <textarea readOnly className="w-full min-h-[600px]">
        ${response}
      </textarea>
    </Dialog>
  );
}

export const UnhandledErrorView = createBackboneView(UnhandledError);
