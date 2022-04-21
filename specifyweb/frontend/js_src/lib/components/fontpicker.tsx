import React from 'react';

import { getAvailableFonts } from '../fonts';
import { preferencesText } from '../localization/preferences';
import type { PreferenceItemComponent } from '../preferences';
import { Autocomplete } from './autocomplete';
import { Input } from './basic';

export const defaultFont = 'default';
export const FontFamilyPreferenceItem: PreferenceItemComponent<string> =
  function FontFamilyPreferenceItem({ value, onChange: handleChange }) {
    const items = React.useMemo(
      () => [
        {
          label: (
            <span className="font-sans">{preferencesText('defaultFont')}</span>
          ),
          searchValue: preferencesText('defaultFont'),
          data: defaultFont,
        },
        ...getAvailableFonts().map((item) => ({
          label: <span style={{ fontFamily: item }}>{item}</span>,
          searchValue: item,
          data: item,
        })),
      ],
      []
    );
    return (
      <Autocomplete<string>
        source={items}
        minLength={0}
        delay={0}
        onNewValue={handleChange}
        onChange={({ data }): void => handleChange(data)}
        // OnCleared={}
        filterItems={true}
        children={(props): JSX.Element => <Input.Generic {...props} />}
        aria-label={undefined}
        value={value === defaultFont ? preferencesText('defaultFont') : value}
      />
    );
  };
