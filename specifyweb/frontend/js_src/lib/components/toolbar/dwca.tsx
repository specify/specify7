import React from 'react';

import ajax, { formData, Http } from '../../ajax';
import commonText from '../../localization/common';
import userInfo from '../../userinfo';
import { useId } from '../common';
import type { UserTool } from '../main';
import { closeDialog, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

const liftGetResource = async (
  name: string,
  errorMessage: string,
  errorField: HTMLInputElement | null
): Promise<void> =>
  ajax(
    `/context/app.resource?name=${name}`,
    {},
    { expectedResponseCodes: [Http.OK, Http.NOT_FOUND] }
  )
    .then(({ status }) => {
      if (status === Http.NOT_FOUND) throw new Error(errorMessage);
      errorField?.setCustomValidity('');
    })
    .catch((error) => {
      errorField?.setCustomValidity(error.toString());
      throw error;
    });

const startExport = async (
  definition: string,
  metadata: string | undefined
): Promise<void> =>
  ajax('/export/make_dwca/', {
    method: 'POST',
    body: formData({
      definition,
      ...(typeof metadata === 'undefined' ? {} : { metadata }),
    }),
  }).then(() => undefined);

function MakeDwca({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  const id = useId('make-dwca');

  const [definition, setDefinition] = React.useState<string>('');
  const [metadata, setMetadata] = React.useState<string>('');
  const definitionRef = React.useRef<HTMLInputElement | null>(null);
  const metadataRef = React.useRef<HTMLInputElement | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isExporting, setIsExporting] = React.useState<boolean>(false);

  return isExporting ? (
    <ModalDialog
      properties={{
        title: commonText('dwcaExportStartedDialogTitle'),
        close: handleClose,
      }}
    >
      <div>
        {commonText('dwcaExportStartedDialogHeader')}
        <p>{commonText('dwcaExportStartedDialogMessage')}</p>
      </div>
    </ModalDialog>
  ) : (
    <ModalDialog
      properties={{
        close: handleClose,
        title: commonText('chooseDwcaDialogTitle'),
        buttons: [
          {
            text: isLoading ? commonText('loading') : commonText('start'),
            type: 'submit',
            form: id('form'),
            disabled: isLoading,
            click() {
              /* Submit form */
            },
          },
          {
            text: commonText('cancel'),
            click: closeDialog,
          },
        ],
      }}
    >
      <form
        className="grid"
        id={id('form')}
        ref={formRef}
        onSubmit={(event): void => {
          setIsLoading(true);
          event.preventDefault();
          Promise.all([
            liftGetResource(
              definition,
              commonText('definitionResourceNotFound')(definition),
              definitionRef.current
            ),
            metadata === ''
              ? metadataRef.current?.setCustomValidity('')
              : liftGetResource(
                  metadata,
                  commonText('metadataResourceNotFound')(metadata),
                  metadataRef.current
                ),
          ])
            .then(async () =>
              startExport(definition, metadata === '' ? undefined : metadata)
            )
            .then(() => setIsExporting(true))
            .catch(() => setIsExporting(false))
            .finally(() => {
              formRef.current?.reportValidity();
              setIsLoading(false);
            });
        }}
      >
        <label>
          {commonText('dwcaDefinition')}
          <input
            type="text"
            value={definition}
            onChange={({ target }): void => {
              setDefinition(target.value);
              target.setCustomValidity('');
            }}
            required
            ref={definitionRef}
          />
        </label>
        <label>
          {commonText('metadataResource')}
          <input
            type="text"
            value={metadata}
            onChange={({ target }): void => {
              setMetadata(target.value);
              target.setCustomValidity('');
            }}
            ref={metadataRef}
          />
        </label>
      </form>
    </ModalDialog>
  );
}

const View = createBackboneView({
  moduleName: 'makeDwca',
  component: MakeDwca,
});

const userTool: UserTool = {
  task: 'makedwca',
  title: commonText('makeDwca'),
  enabled: () => userInfo.isadmin,
  view: ({ onClose }) => new View({ onClose }),
};

export default userTool;
