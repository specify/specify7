import * as React from 'react';

import ajax from '../../ajax';
import csrfToken from '../../csrftoken';
import commonText from '../../localization/common';
import { LANGUAGE } from '../../localization/utils';
import type { IR, RA } from '../../types';
import { Form, Label, Select } from '../basic';
import { useTitle } from '../hooks';
import type { UserTool } from '../main';
import { closeDialog, LoadingScreen, ModalDialog } from '../modaldialog';
import createBackboneView from '../reactbackboneextend';
import { parseDjangoDump } from '../splashscreen';

export function LanguageSelection({
  languages,
}: {
  readonly languages: IR<string>;
}): JSX.Element {
  return (
    <Form action="/context/language/" method="post">
      <input
        type="hidden"
        name="csrfmiddlewaretoken"
        value={csrfToken ?? parseDjangoDump<string>('csrf-token')}
      />
      <Label>
        {commonText('language')}
        <Select
          name="language"
          value={LANGUAGE}
          onChange={({ target }): void => target.closest('form')?.submit()}
        >
          {Object.entries(languages).map(([code, nameLocal]) => (
            <option key={code} value={code}>
              {nameLocal} ({code})
            </option>
          ))}
        </Select>
      </Label>
      <input type="submit" className="sr-only" />
    </Form>
  );
}

function ChangeLanguage({
  onClose: handleClose,
}: {
  readonly onClose: () => void;
}): JSX.Element {
  useTitle(commonText('changeLanguage'));

  const [languages, setLanguages] = React.useState<undefined | IR<string>>(
    undefined
  );

  React.useEffect(() => {
    ajax<
      RA<{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        readonly name_local: string;
        readonly code: string;
      }>
      // eslint-disable-next-line @typescript-eslint/naming-convention
    >('/context/language/', { headers: { Accept: 'application/json' } })
      .then(({ data }) =>
        setLanguages(
          Object.fromEntries(
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Object.entries(data).map(([code, { name_local }]) => [
              code,
              name_local,
            ])
          )
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
      <LanguageSelection languages={languages} />
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
