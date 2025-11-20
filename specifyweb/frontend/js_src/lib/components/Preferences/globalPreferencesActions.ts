import { ajax } from '../../utils/ajax';
import { remotePrefs } from '../InitialContext/remotePrefs';
import type { GlobalPreferenceValues } from './globalPreferences';
import { globalPreferences } from './globalPreferences';
import {
  buildGlobalPreferencesPayload,
  getGlobalPreferencesMetadata,
  setGlobalPreferencesMetadata,
  upsertGlobalPreferencesResource,
} from './globalPreferencesResource';
import { notifyGlobalPreferencesUpdated } from './globalPreferencesSync';
import {
  getGlobalPreferenceFallback,
  globalPreferencesToKeyValue,
  mergeWithDefaultValues,
  serializeGlobalPreferences,
  setGlobalPreferenceFallback,
} from './globalPreferencesUtils';

const GLOBAL_PREFERENCES_APP_RESOURCE_URL =
  '/context/global-preferences-resource/';

async function syncAppResourceGlobalPreferences(data: string): Promise<void> {
  await ajax(GLOBAL_PREFERENCES_APP_RESOURCE_URL, {
    method: 'PUT',
    body: data,
    headers: { 'Content-Type': 'text/plain' },
    errorMode: 'silent',
  });
}

export async function saveGlobalPreferences(): Promise<void> {
  const rawValues =
    globalPreferences.getRaw() as Partial<GlobalPreferenceValues>;
  const fallback = getGlobalPreferenceFallback();
  const metadata = getGlobalPreferencesMetadata();

  const { data, metadata: updatedMetadata } = serializeGlobalPreferences(
    rawValues,
    metadata,
    { fallback }
  );
  setGlobalPreferencesMetadata(updatedMetadata);

  const payload = buildGlobalPreferencesPayload(data);
  await upsertGlobalPreferencesResource({
    payload,
    errorMode: 'dismissible',
  });

  const mergedValues = mergeWithDefaultValues(rawValues, fallback);
  const keyValues = globalPreferencesToKeyValue(mergedValues);

  const mutableRemotePrefs = remotePrefs as Record<string, string>;
  Object.entries(keyValues).forEach(([key, value]) => {
    mutableRemotePrefs[key] = value;
  });

  setGlobalPreferenceFallback(mergedValues);
  notifyGlobalPreferencesUpdated(data);
  try {
    await syncAppResourceGlobalPreferences(data);
  } catch (error) {
    console.error(
      'Failed to synchronize App Resources global preferences',
      error
    );
  }
}
