import React from 'react';

import { ajax, ping } from '../../ajax';
import { csrfToken } from '../../csrftoken';
import commonText from '../../localization/common';
import type { Language } from '../../localization/utils';
import { enabledLanguages } from '../../localization/utils';
import type { PreferenceItemComponent } from '../../preferences';
import type { IR, RA } from '../../types';
import { f } from '../../wbplanviewhelper';
import { Label, Select } from '../basic';
import { supportLink } from '../errorboundary';
import { useAsyncState } from '../hooks';
import { Dialog, dialogClassNames } from '../modaldialog';

export const handleLanguageChange = async (language: Language): Promise<void> =>
  ping('/context/language/', {
    method: 'POST',
    body: {
      language,
      csrfmiddlewaretoken: csrfToken,
    },
  }).then(f.void);

export function LanguageSelection({
  value,
  languages,
  onChange: handleChange,
}: {
  value: Language;
  languages: IR<string> | undefined;
  readonly onChange: (language: Language) => void;
}): JSX.Element {
  const [showSupportDialog, setShowSupportDialog] = React.useState(false);

  return (
    <>
      {showSupportDialog ? (
        <Dialog
          header={commonText('helpLocalizeSpecify')}
          onClose={(): void => setShowSupportDialog(false)}
          buttons={commonText('close')}
          className={{
            container: dialogClassNames.narrowContainer,
          }}
        >
          <p>{commonText('helpLocalizeSpecifyDialogMessage')(supportLink)}</p>
        </Dialog>
      ) : typeof languages === 'object' ? (
        <Label.Generic>
          <Select
            name="language"
            value={value}
            onChange={({ target }): void =>
              target.value === 'supportLocalization'
                ? setShowSupportDialog(true)
                : handleChange(target.value as Language)
            }
          >
            {Object.entries(languages).map(([code, nameLocal]) => (
              <option key={code} value={code}>
                {nameLocal} ({code})
              </option>
            ))}
            <option value="supportLocalization">
              {commonText('helpLocalizeSpecify')}
            </option>
          </Select>
        </Label.Generic>
      ) : undefined}
    </>
  );
}

export const LanguagePreferencesItem: PreferenceItemComponent<Language> =
  function LanguagePreferencesItem({
    value,
    onChange: handleChange,
  }): JSX.Element {
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
              Object.entries(data)
                .filter(([code]) => enabledLanguages.includes(code as Language))
                // eslint-disable-next-line @typescript-eslint/naming-convention
                .map(([code, { name_local }]) => [code, name_local])
            )
          ),
        []
      )
    );
    return (
      <LanguageSelection
        languages={languages}
        value={value}
        onChange={handleChange}
      />
    );
  };
