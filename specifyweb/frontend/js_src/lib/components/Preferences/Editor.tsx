import React from 'react';

import { useLiveState } from '../../hooks/useLiveState';
import type { AppResourceTabProps } from '../AppResources/TabDefinitions';
import type { PreferenceType } from '../Preferences';
import { PreferencesContent } from '../Preferences';
import { BasePreferences } from '../Preferences/BasePreferences';
import { userPreferenceDefinitions } from '../Preferences/UserDefinitions';
import { userPreferences } from '../Preferences/userPreferences';
import { collectionPreferenceDefinitions } from './CollectionDefinitions';
import { globalPreferenceDefinitions } from './GlobalDefinitions';
import { collectionPreferences } from './collectionPreferences';
import { globalPreferences } from './globalPreferences';
import type { GenericPreferences } from './types';
import type { PartialPreferences } from './BasePreferences';
import {
  parseGlobalPreferences,
  serializeGlobalPreferences,
} from './globalPreferencesUtils';
import type { GlobalPreferenceValues } from './globalPreferences';
import type { PropertyLine } from './globalPreferencesUtils';

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
  readonly parse?: (
    data: string | null
  ) => {
    readonly raw: PartialPreferences<DEFINITIONS>;
    readonly metadata?: unknown;
  };
  readonly serialize?: (
    raw: PartialPreferences<DEFINITIONS>,
    metadata: unknown
  ) => {
    readonly data: string;
    readonly metadata?: unknown;
  };
};

const defaultDependencyResolver = ({ onChange }: EditorDependencies) => [
  onChange,
];

const parseJsonPreferences = <DEFINITIONS extends GenericPreferences>(
  data: string | null
): {
  readonly raw: PartialPreferences<DEFINITIONS>;
  readonly metadata?: undefined;
} => ({
  raw: JSON.parse(data === null || data.length === 0 ? '{}' : data) as PartialPreferences<DEFINITIONS>,
});

const serializeJsonPreferences = <DEFINITIONS extends GenericPreferences>(
  raw: PartialPreferences<DEFINITIONS>,
  _metadata?: unknown
): {
  readonly data: string;
  readonly metadata?: undefined;
} => ({
  data: JSON.stringify(raw),
});

const parseGlobalPreferenceData = (
  data: string | null
): {
  readonly raw: PartialPreferences<typeof globalPreferenceDefinitions>;
  readonly metadata: ReadonlyArray<PropertyLine>;
} => {
  const { raw, metadata } = parseGlobalPreferences(data);
  return {
    raw: raw as unknown as PartialPreferences<typeof globalPreferenceDefinitions>,
    metadata,
  };
};

const serializeGlobalPreferenceData = (
  raw: PartialPreferences<typeof globalPreferenceDefinitions>,
  metadata: unknown
): {
  readonly data: string;
  readonly metadata: ReadonlyArray<PropertyLine>;
} => {
  const result = serializeGlobalPreferences(
    raw as unknown as GlobalPreferenceValues,
    (metadata as ReadonlyArray<PropertyLine> | undefined) ?? []
  );
  return {
    data: result.data,
    metadata: result.metadata,
  };
};

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
    const parse =
      config.parse ??
      ((rawData: string | null) =>
        parseJsonPreferences<DEFINITIONS>(rawData));
    const serialize =
      config.serialize ??
      ((raw: PartialPreferences<DEFINITIONS>, metadata: unknown) =>
        serializeJsonPreferences<DEFINITIONS>(raw, metadata));

    const { raw: initialRaw, metadata: initialMetadata } = React.useMemo(
      () => parse(data ?? null),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [data]
    );
    const metadataRef = React.useRef<unknown>(initialMetadata);

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

        preferences.setRaw(initialRaw as PartialPreferences<GenericPreferences> as PartialPreferences<DEFINITIONS>);

        preferences.events.on('update', () => {
          const result = serialize(
            preferences.getRaw() as PartialPreferences<DEFINITIONS>,
            metadataRef.current
          );
          if (result.metadata !== undefined) metadataRef.current = result.metadata;
          onChange(result.data);
        });

        return preferences;
      }, [...dependencies, initialRaw, initialMetadata, serialize])
    );

    React.useEffect(() => {
      metadataRef.current = initialMetadata;
      preferencesInstance.setRaw(
        initialRaw as PartialPreferences<GenericPreferences> as PartialPreferences<DEFINITIONS>
      );
    }, [initialMetadata, initialRaw, preferencesInstance]);

    const Provider = Context.Provider;
    const contentProps = prefType === undefined ? {} : { prefType };

    return (
      <Provider value={preferencesInstance}>
        <PreferencesContent {...contentProps} />
      </Provider>
    );
  };
}

export const UserPreferencesEditor = createPreferencesEditor({
  definitions: userPreferenceDefinitions,
  Context: userPreferences.Context,
  resourceName: 'UserPreferences',
  fetchUrl: '/context/user_resource/',
  developmentGlobal: '_editingUserPreferences',
  dependencyResolver: ({ onChange }) => [onChange],
});

export const CollectionPreferencesEditor = createPreferencesEditor({
  definitions: collectionPreferenceDefinitions,
  Context: collectionPreferences.Context,
  resourceName: 'CollectionPreferences',
  fetchUrl: '/context/collection_resource/',
  developmentGlobal: '_editingCollectionPreferences',
  prefType: 'collection',
  dependencyResolver: ({ data, onChange }) => [data, onChange],
  parse: (data) => parseJsonPreferences<typeof collectionPreferenceDefinitions>(data),
  serialize: (raw) => serializeJsonPreferences<typeof collectionPreferenceDefinitions>(raw),
});

export const GlobalPreferencesEditor = createPreferencesEditor({
  definitions: globalPreferenceDefinitions,
  Context: globalPreferences.Context,
  resourceName: 'GlobalPreferences',
  fetchUrl: '/context/app.resource/',
  developmentGlobal: '_editingGlobalPreferences',
  prefType: 'global',
  dependencyResolver: ({ data, onChange }) => [data, onChange],
  parse: parseGlobalPreferenceData,
  serialize: serializeGlobalPreferenceData,
});
