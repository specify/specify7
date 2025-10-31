import { remotePrefs } from '../InitialContext/remotePrefs';
import {
  buildGlobalPreferencesPayload,
  getGlobalPreferencesMetadata,
  setGlobalPreferencesMetadata,
  upsertGlobalPreferencesResource,
} from './globalPreferencesResource';
import { globalPreferences } from './globalPreferences';
import type { GlobalPreferenceValues } from './globalPreferences';
import {
  getGlobalPreferenceFallback,
  globalPreferencesToKeyValue,
  mergeWithDefaultValues,
  serializeGlobalPreferences,
  setGlobalPreferenceFallback,
} from './globalPreferencesUtils';

export async function saveGlobalPreferences(): Promise<void> {
  const rawValues = globalPreferences.getRaw() as Partial<GlobalPreferenceValues>;
  const fallback = getGlobalPreferenceFallback();
  const metadata = getGlobalPreferencesMetadata();

  const { data, metadata: updatedMetadata } = serializeGlobalPreferences(
    rawValues as Partial<GlobalPreferenceValues>,
    metadata,
    { fallback }
  );
  setGlobalPreferencesMetadata(updatedMetadata);

  const payload = buildGlobalPreferencesPayload(data);
  await upsertGlobalPreferencesResource({
    payload,
    errorMode: 'dismissible',
  });

  const mergedValues = mergeWithDefaultValues(
    rawValues as Partial<GlobalPreferenceValues>,
    fallback
  );
  const keyValues = globalPreferencesToKeyValue(mergedValues);

  Object.entries(keyValues).forEach(([key, value]) => {
    remotePrefs[key] = value;
  });

  setGlobalPreferenceFallback(mergedValues);
}
