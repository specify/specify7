import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { PreferencesContent } from '../Preferences';
import { BasePreferences } from '../Preferences/BasePreferences';
import { userPreferenceDefinitions } from '../Preferences/UserDefinitions';
import { userPreferences } from '../Preferences/userPreferences';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { collectionPreferences } from './collectionPreferences';

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

export function CollectionPreferencesEditor({
  data,
  onChange,
}: AppResourceTabProps): JSX.Element {
  const [preferencesInstance] = useLiveState(
    React.useCallback(() => {
      const temporaryCollectionPrefs = new BasePreferences({
        definitions: collectionPreferenceDefinitions,
        values: {
          resourceName: 'CollectionPreferences',
          fetchUrl: '/context/collection_resource/',
        },
        defaultValues: undefined,
        developmentGlobal: '_editingCollectionPreferences',
        syncChanges: false,
      });
      temporaryCollectionPrefs.setRaw(
        JSON.parse(!data || data.length === 0 ? '{}' : data)
      );
      temporaryCollectionPrefs.events.on('update', () =>
        onChange(JSON.stringify(temporaryCollectionPrefs.getRaw()))
      );

      return temporaryCollectionPrefs;
    }, [data, onChange])
  );
  const Context = collectionPreferences.Context;

  return (
    <Context.Provider value={preferencesInstance}>
      <PreferencesContent prefType="collection" />
    </Context.Provider>
  );
}
