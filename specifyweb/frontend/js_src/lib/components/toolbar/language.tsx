import * as React from 'react';

import { ajax } from '../../ajax';
import { csrfToken } from '../../csrftoken';
import commonText from '../../localization/common';
import { LANGUAGE } from '../../localization/utils';
import type { IR, RA } from '../../types';
import { Form, Label, Select } from '../basic';
import { useAsyncState, useTitle } from '../hooks';
import type { UserTool } from '../main';
import { Dialog, LoadingScreen } from '../modaldialog';
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

  const [languages] = useAsyncState<IR<string>>(
    React.useCallback(
      async () =>
        ajax<
          RA<{
            // eslint-disable-next-line @typescript-eslint/naming-convention
            readonly name_local: string;
            readonly code: string;
          }>
        >('/context/language/', {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          headers: { Accept: 'application/json' },
        }).then(({ data }) =>
          Object.fromEntries(
            // eslint-disable-next-line @typescript-eslint/naming-convention
            Object.entries(data).map(([code, { name_local }]) => [
              code,
              name_local,
            ])
          )
        ),
      []
    )
  );

  return typeof languages === 'undefined' ? (
    <LoadingScreen />
  ) : (
    <Dialog
      header={commonText('changeLanguage')}
      onClose={handleClose}
      buttons={commonText('close')}
    >
      <LanguageSelection languages={languages} />
    </Dialog>
  );
}

const View = createBackboneView(ChangeLanguage);

const toolBarItem: UserTool = {
  task: 'change-language',
  title: commonText('changeLanguage'),
  view: ({ onClose }) => new View({ onClose }),
};

export default toolBarItem;
