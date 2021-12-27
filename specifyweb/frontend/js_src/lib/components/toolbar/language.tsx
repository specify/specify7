import * as React from 'react';

import csrfToken from '../../csrftoken';
import commonText from '../../localization/common';
import type { IR } from '../../types';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

type Props = {
  readonly onClose: () => void;
};

function ChangeLanguage({
  onClose: handleClose,
}: Readonly<Props>): JSX.Element {
  const [languages, setLanguages] = React.useState<
    | undefined
    | IR<{
        readonly name_local: string;
        readonly code: string;
      }>
  >(undefined);

  React.useEffect(() => {
    fetch('/context/language/')
      .then(async (response) => response.json())
      .then(({ data }) => setLanguages(data))
      .catch(console.error);
  }, []);

  return typeof languages === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <ModalDialog
      properties={{
        title: commonText('changeLanguage'),
        close: handleClose,
        buttons: [{ text: commonText('close'), click: closeDialog }],
      }}
    >
      <form action="/context/language/" method="post">
        <input
          type="hidden"
          name="csrfmiddlewaretoken"
          value={csrfToken ?? ''}
        />
        <label>
          {commonText('language')}
          <br />
          <select
            name="language"
            value={document.documentElement.lang}
            onChange={({ target }): void => target.closest('form')?.submit()}
          >
            {Object.entries(languages).map(
              ([code, { name_local, code: shortCode }]) => (
                <option key={code} value={code}>
                  {name_local} ({shortCode})
                </option>
              )
            )}
          </select>
        </label>
        <input type="submit" className="sr-only" />
      </form>
    </ModalDialog>
  );
}

const View = createBackboneView<Props>({
  moduleName: 'ChangeLanguage',
  className: 'change-language',
  component: ChangeLanguage,
});

const toolBarItem: UserTool = {
  task: 'change-language',
  title: commonText('changeLanguage'),
  view: ({ onClose }) => new View({ onClose }),
};

export default toolBarItem;
