/**
 * Do DWCA export
 */

import React from 'react';

import { formData, Http, ping } from '../../ajax';
import { commonText } from '../../localization/common';
import { hasPermission } from '../../permissions';
import { Button, Form, Input, Label, Submit } from '../basic';
import { LoadingContext } from '../contexts';
import { useBooleanState, useId, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog } from '../modaldialog';

const liftGetResource = async (
  name: string,
  errorMessage: string,
  errorField: HTMLInputElement | null
): Promise<void> =>
  ping(
    `/context/app.resource?name=${name}`,
    {},
    { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
  )
    .then((status) => {
      if (status === Http.NOT_FOUND) throw new Error(errorMessage);
      errorField?.setCustomValidity('');
      return undefined;
    })
    // eslint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
    .catch((error: Error) => {
      errorField?.setCustomValidity(error.message);
      throw error;
    });

const startExport = async (
  definition: string,
  metadata: string | undefined
): Promise<void> =>
  ping('/export/make_dwca/', {
    method: 'POST',
    body: formData({
      definition,
      ...(typeof metadata === 'string' ? { metadata } : {}),
    }),
  }).then(() => undefined);

function MakeDwca({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('makeDwca'));
  const id = useId('make-dwca');

  const [definition, setDefinition] = React.useState<string>('');
  const [metadata, setMetadata] = React.useState<string>('');
  const definitionRef = React.useRef<HTMLInputElement | null>(null);
  const metadataRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const loading = React.useContext(LoadingContext);
  const [isExporting, handleExporting, handleExported] = useBooleanState();

  return isExporting ? (
    <ExportStarted onClose={handleClose} />
  ) : (
    <Dialog
      onClose={handleClose}
      header={commonText('chooseDwcaDialogTitle')}
      buttons={
        <>
          <Button.DialogClose>{commonText('cancel')}</Button.DialogClose>
          <Submit.Blue form={id('form')}>{commonText('start')}</Submit.Blue>
        </>
      }
    >
      <Form
        className="contents"
        id={id('form')}
        forwardRef={formRef}
        onSubmit={(): void =>
          loading(
            Promise.all([
              liftGetResource(
                definition,
                commonText('definitionResourceNotFound', definition),
                definitionRef.current
              ),
              metadata === ''
                ? metadataRef.current?.setCustomValidity('')
                : liftGetResource(
                    metadata,
                    commonText('metadataResourceNotFound', metadata),
                    metadataRef.current
                  ),
            ])
              .then(async () =>
                startExport(definition, metadata === '' ? undefined : metadata)
              )
              .then(handleExporting)
              .catch(handleExported)
              .finally(() => formRef.current?.reportValidity())
          )
        }
      >
        <Label.Generic>
          {commonText('dwcaDefinition')}
          <Input.Text
            value={definition}
            onChange={({ target }): void => {
              setDefinition(target.value);
              target.setCustomValidity('');
            }}
            required
            forwardRef={definitionRef}
          />
        </Label.Generic>
        <Label.Generic>
          {commonText('metadataResource')}
          <Input.Text
            value={metadata}
            onChange={({ target }): void => {
              setMetadata(target.value);
              target.setCustomValidity('');
            }}
            forwardRef={metadataRef}
          />
        </Label.Generic>
      </Form>
    </Dialog>
  );
}

function ExportStarted({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  return (
    <Dialog
      title={commonText('dwcaExportStartedDialogTitle')}
      header={commonText('dwcaExportStartedDialogHeader')}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      {commonText('dwcaExportStartedDialogText')}
    </Dialog>
  );
}

export const userTool: UserTool = {
  task: 'make-dwca',
  title: commonText('makeDwca'),
  enabled: () => hasPermission('/export/dwca', 'execute'),
  isOverlay: true,
  view: ({ onClose: handleClose }) => <MakeDwca onClose={handleClose} />,
  groupLabel: commonText('export'),
};
