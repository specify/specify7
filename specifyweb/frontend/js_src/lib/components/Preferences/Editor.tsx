import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { AppResourceTab } from '../AppResources/TabDefinitions';
import { PreferencesContent } from '../Preferences';
import { BasePreferences } from '../Preferences/BasePreferences';
import { userPreferenceDefinitions } from '../Preferences/UserDefinitions';
import { userPreferences } from '../Preferences/userPreferences';

export const UserPreferencesEditor: AppResourceTab = function ({
  isReadOnly,
  data,
  onChange: handleChange,
}): JSX.Element {
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
      return userPreferences;
    }, [handleChange])
  );

  const Context = userPreferences.Context;
  return (
    <Context.Provider value={preferencesContext}>
      <PreferencesContent isReadOnly={isReadOnly} />
    </Context.Provider>
  );
};
