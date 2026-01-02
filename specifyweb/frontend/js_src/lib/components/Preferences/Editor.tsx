import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import type { PreferenceType } from '../Preferences';
import { PreferencesContent } from '../Preferences';
import { PreferencesAside } from '../Preferences/Aside';
import { BasePreferences } from '../Preferences/BasePreferences';
import { userPreferenceDefinitions } from '../Preferences/UserDefinitions';
import { userPreferences } from '../Preferences/userPreferences';
import { useTopChild } from '../Preferences/useTopChild';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { collectionPreferences } from './collectionPreferences';
import type { GenericPreferences } from './types';

type EditorDependencies = Pick<AppResourceTabProps, 'data' | 'onChange'>;

type PreferencesEditorConfig<DEFINITIONS extends GenericPreferences> = {
  readonly definitions: DEFINITIONS;
  readonly Context: BasePreferences<DEFINITIONS>['Context'];
  readonly resourceName: string;
  readonly fetchUrl: string;
  readonly developmentGlobal: string;
  readonly prefType?: PreferenceType;
  readonly dependencyResolver?: (
    inputs: EditorDependencies
  ) => React.DependencyList;
};

const defaultDependencyResolver = ({ onChange }: EditorDependencies) => [
  onChange,
];

function createPreferencesEditor<DEFINITIONS extends GenericPreferences>(
  config: PreferencesEditorConfig<DEFINITIONS>
) {
  const {
    definitions,
    Context,
    resourceName,
    fetchUrl,
    developmentGlobal,
    prefType,
    dependencyResolver = defaultDependencyResolver,
  } = config;

  return function PreferencesEditor({
    data,
    onChange,
  }: AppResourceTabProps): JSX.Element {
    const dependencies = dependencyResolver({ data, onChange });

    const [preferencesInstance] = useLiveState<BasePreferences<DEFINITIONS>>(
      React.useCallback(() => {
        const preferences = new BasePreferences<DEFINITIONS>({
          definitions,
          values: {
            resourceName,
            fetchUrl,
          },
          defaultValues: undefined,
          developmentGlobal,
          syncChanges: false,
        });

        preferences.setRaw(
          JSON.parse(data === null || data.length === 0 ? '{}' : data)
        );

        preferences.events.on('update', () =>
          onChange(JSON.stringify(preferences.getRaw()))
        );

        return preferences;
      }, dependencies)
    );

    const Provider = Context.Provider;
    const contentProps = prefType === undefined ? {} : { prefType };
    const {
      visibleChild,
      setVisibleChild,
      references,
      forwardRefs,
      scrollContainerRef,
    } = useTopChild();
    const asidePrefType = prefType ?? 'user';

    return (
      <Provider value={preferencesInstance}>
        <div
          className="relative flex h-full min-h-0 flex-col gap-6 overflow-y-auto md:flex-row"
          ref={scrollContainerRef}
        >
          <PreferencesAside
            activeCategory={visibleChild}
            prefType={asidePrefType}
            references={references}
            setActiveCategory={setVisibleChild}
          />
          <PreferencesContent forwardRefs={forwardRefs} {...contentProps} />
          <span className="flex-1" />
        </div>
      </Provider>
    );
  };
}

export const UserPreferencesEditor = createPreferencesEditor({
  definitions: userPreferenceDefinitions,
  Context: userPreferences.Context,
  resourceName: 'UserPreferences',
  fetchUrl: '/context/user_resource/',
  developmentGlobal: 'editingUserPreferences',
  dependencyResolver: ({ onChange }) => [onChange],
});

export const CollectionPreferencesEditor = createPreferencesEditor({
  definitions: collectionPreferenceDefinitions,
  Context: collectionPreferences.Context,
  resourceName: 'CollectionPreferences',
  fetchUrl: '/context/collection_resource/',
  developmentGlobal: 'editingCollectionPreferences',
  prefType: 'collection',
  dependencyResolver: ({ data, onChange }) => [data, onChange],
});
