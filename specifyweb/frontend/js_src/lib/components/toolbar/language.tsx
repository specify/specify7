import * as React from 'react';

import ajax from '../../ajax';
import csrfToken from '../../csrftoken';
import commonText from '../../localization/common';
import { LANGUAGE } from '../../localization/utils';
import type { RA } from '../../types';
import { useTitle } from '../common';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';

function ChangeLanguage({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('changeLanguage'));

  const [languages, setLanguages] = React.useState<
    | undefined
    | RA<{
        readonly nameLocal: string;
        readonly code: string;
      }>
  >(undefined);

  React.useEffect(() => {
    ajax<
      RA<{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        readonly name_local: string;
        readonly code: string;
      }>
    >('/context/language/', { headers: { Accept: 'application/json' } })
      .then(({ data }) =>
        setLanguages(
          // eslint-disable-next-line @typescript-eslint/naming-convention
          Object.entries(data).map(([code, { name_local }]) => ({
            nameLocal: name_local,
            code,
          }))
        )
      )
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
      <form className="grid" action="/context/language/" method="post">
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
            value={LANGUAGE}
            onChange={({ target }): void => target.closest('form')?.submit()}
          >
            {languages.map(({ nameLocal, code }) => (
              <option key={code} value={code}>
                {nameLocal} ({code})
              </option>
            ))}
          </select>
        </label>
        <input type="submit" className="sr-only" />
      </form>
    </ModalDialog>
  );
}

const View = createBackboneView(ChangeLanguage);

const toolBarItem: UserTool = {
  task: 'change-language',
  title: commonText('changeLanguage'),
  view: ({ onClose }) => new View({ onClose }),
};

export default toolBarItem;
