import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import { PreferencesContent } from '../Preferences';
import { BasePreferences } from '../Preferences/BasePreferences';
import { userPreferenceDefinitions } from '../Preferences/UserDefinitions';
import { userPreferences } from '../Preferences/userPreferences';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { collectionPreferences } from './collectionPreferences';

type CreatePreferencesEditorArgs = {
  readonly contextModule: { readonly Context: React.Context<any> };
  readonly definitions: typeof collectionPreferenceDefinitions | typeof userPreferenceDefinitions;
  readonly resourceName: 'CollectionPreferences' | 'UserPreferences';
  readonly fetchUrl: '/context/collection_resource/' | '/context/user_resource/';
  readonly developmentGlobal:
    '_editingCollectionPreferences' | '_editingUserPreferences';
  readonly prefType?: 'collection' | 'user';
};
function createPreferencesEditor({
  contextModule,
  definitions,
  resourceName,
  fetchUrl,
  developmentGlobal,
  prefType,
}: CreatePreferencesEditorArgs) {
  function Editor({ data, onChange }: AppResourceTabProps): JSX.Element {
    const [preferencesInstance] = useLiveState(
      React.useCallback(() => {
        const prefs = new BasePreferences({
          definitions,
          values: {
            resourceName,
            fetchUrl,
          },
          defaultValues: undefined,
          developmentGlobal,
          syncChanges: false,
        });
        prefs.setRaw(JSON.parse(!data || data.length === 0 ? '{}' : data));
        prefs.events.on('update', () => onChange(JSON.stringify(prefs.getRaw())));

        return prefs;
      }, [data, onChange])
    );

    const Context = contextModule.Context;

    return (
      <Context.Provider value={preferencesInstance}>
        {prefType ? (
          <PreferencesContent prefType={prefType} />
        ) : (
          <PreferencesContent />
        )}
      </Context.Provider>
    );
  }
  Editor.displayName = `${resourceName}Editor`;

  return Editor;
}

export const UserPreferencesEditor = createPreferencesEditor({
  contextModule: userPreferences,
  definitions: userPreferenceDefinitions,
  resourceName: 'UserPreferences',
  fetchUrl: '/context/user_resource/',
  developmentGlobal: '_editingUserPreferences',
});

export const CollectionPreferencesEditor = createPreferencesEditor({
  contextModule: collectionPreferences,
  definitions: collectionPreferenceDefinitions,
  resourceName: 'CollectionPreferences',
  fetchUrl: '/context/collection_resource/',
  developmentGlobal: '_editingCollectionPreferences',
  prefType: 'collection',
});
