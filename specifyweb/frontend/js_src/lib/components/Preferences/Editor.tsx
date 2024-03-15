import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { PreferencesContent } from '../Preferences';
import { BasePreferences } from '../Preferences/BasePreferences';
import { userPreferenceDefinitions } from '../Preferences/UserDefinitions';
import { userPreferences } from '../Preferences/userPreferences';

export function UserPreferencesEditor({
  data,
  onChange: handleChange,
}: AppResourceTabProps): JSX.Element {
  const [preferencesContext] = useLiveState<typeof userPreferences>(
    React.useCallback(() => {
      const userPreferences = new BasePreferences({
        definitions: userPreferenceDefinitions,
        values: {
          resourceName: 'UserPreferences',
          fetchUrl: '/context/user_resource/',
        },
        defaultValues: undefined,
        developmentGlobal: '_editingUserPreferences',
        syncChanges: false,
      });
      userPreferences.setRaw(
        JSON.parse(data === null || data.length === 0 ? '{}' : data)
      );
      userPreferences.events.on('update', () =>
        handleChange(JSON.stringify(userPreferences.getRaw()))
      );
      return userPreferences;
    }, [handleChange])
  );

  const Context = userPreferences.Context;
  return (
    <Context.Provider value={preferencesContext}>
      <PreferencesContent />
    </Context.Provider>
  );
}
