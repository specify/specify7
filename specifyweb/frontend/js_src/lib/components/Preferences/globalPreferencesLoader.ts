import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { formatUrl } from '../Router/queryString';
import { contextUnlockedPromise, foreverFetch } from '../InitialContext';
import { fetchContext as fetchRemotePrefs, remotePrefs } from '../InitialContext/remotePrefs';
import { keysToLowerCase } from '../../utils/utils';
import { type PartialPreferences } from './BasePreferences';
import { globalPreferenceDefinitions } from './GlobalDefinitions';
import { globalPreferences } from './globalPreferences';
import type { GlobalPreferenceValues } from './globalPreferences';
import {
  DEFAULT_VALUES,
  mergeWithDefaultValues,
  parseGlobalPreferences,
  partialPreferencesFromMap,
  serializeGlobalPreferences,
  setGlobalPreferenceFallback,
} from './globalPreferencesUtils';

type PartialGlobalValues = Partial<GlobalPreferenceValues>;

const GLOBAL_RESOURCE_URL = '/context/app.resource/';

function mergeMissingFromRemote(
  existing: PartialGlobalValues,
  remote: PartialGlobalValues
): { readonly merged: PartialGlobalValues; readonly changed: boolean } {
  let changed = false;
  let merged = existing;

  const remoteFormatting = remote.formatting?.formatting;
  if (remoteFormatting !== undefined) {
    const currentFormatting = existing.formatting?.formatting ?? {};
    const updatedFormatting: Partial<GlobalPreferenceValues['formatting']['formatting']> = {
      ...currentFormatting,
    };

    (['fullDateFormat', 'monthYearDateFormat'] as const).forEach((key) => {
      const remoteValue = remoteFormatting[key];
      if (
        remoteValue !== undefined &&
        updatedFormatting[key] === undefined &&
        remoteValue !== DEFAULT_VALUES.formatting.formatting[key]
      ) {
        updatedFormatting[key] = remoteValue;
        changed = true;
      }
    });

    if (changed)
      merged = {
        ...merged,
        formatting: {
          formatting: updatedFormatting as GlobalPreferenceValues['formatting']['formatting'],
        },
      };
  }

  return { merged, changed };
}

export const loadGlobalPreferences = async (): Promise<void> => {
  const entryPoint = await contextUnlockedPromise;
  if (entryPoint !== 'main') {
    await foreverFetch();
    return;
  }

  const { data, status, response } = await ajax<string>(
    formatUrl('/context/app.resource', {
      name: 'GlobalPreferences',
      quiet: '',
    }),
    {
      headers: { Accept: 'text/plain' },
      expectedErrors: [Http.NO_CONTENT],
      errorMode: 'visible',
    }
  );

  await fetchRemotePrefs.catch(() => undefined);

  const remotePartial = partialPreferencesFromMap(remotePrefs);
  const remoteDefaults = mergeWithDefaultValues(remotePartial);
  setGlobalPreferenceFallback(remoteDefaults);
  globalPreferences.setDefaults(
    remotePartial as PartialPreferences<typeof globalPreferenceDefinitions>
  );

  const { raw, metadata } = parseGlobalPreferences(
    status === Http.NO_CONTENT ? null : data
  );

  const { merged: migratedRaw, changed } = mergeMissingFromRemote(raw, remotePartial);

  if (changed) {
    try {
      const serialized = serializeGlobalPreferences(migratedRaw, metadata, {
        fallback: remoteDefaults,
      });
      const originalData = status === Http.NO_CONTENT ? '' : data;

      if (serialized.data.trim() !== originalData.trim()) {
        const resourceIdHeader = response.headers.get('X-Record-ID');
        const resourceId =
          resourceIdHeader === null ? undefined : Number.parseInt(resourceIdHeader, 10);
        const payload = keysToLowerCase({
          name: 'GlobalPreferences',
          mimeType: 'text/plain',
          metaData: '',
          data: serialized.data,
        });

        if (typeof resourceId === 'number' && Number.isFinite(resourceId) && resourceId >= 0)
          await ping(`${GLOBAL_RESOURCE_URL}${resourceId}/`, {
            method: 'PUT',
            body: payload,
            headers: { Accept: 'application/json' },
            errorMode: 'silent',
          });
        else
          await ping(GLOBAL_RESOURCE_URL, {
            method: 'POST',
            body: payload,
            headers: { Accept: 'application/json' },
            errorMode: 'silent',
          });
      }
    } catch (error) {
      console.error('Failed migrating remote preferences into GlobalPreferences', error);
    }
  }

  globalPreferences.setRaw(
    (changed ? migratedRaw : raw) as PartialPreferences<typeof globalPreferenceDefinitions>
  );
};
