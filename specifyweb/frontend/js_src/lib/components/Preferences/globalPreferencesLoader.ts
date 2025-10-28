import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import { ping } from '../../utils/ajax/ping';
import { keysToLowerCase } from '../../utils/utils';
import { contextUnlockedPromise, foreverFetch } from '../InitialContext';
import { fetchContext as fetchRemotePrefs, remotePrefs } from '../InitialContext/remotePrefs';
import { formatUrl } from '../Router/queryString';
import { type PartialPreferences } from './BasePreferences';
import type { globalPreferenceDefinitions } from './GlobalDefinitions';
import type { GlobalPreferenceValues } from './globalPreferences';
import { globalPreferences } from './globalPreferences';
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
    const currentFormatting = existing.formatting?.formatting;
    const updatedFormatting: Record<
      keyof GlobalPreferenceValues['formatting']['formatting'],
      string | undefined
    > = {
      fullDateFormat: currentFormatting?.fullDateFormat,
      monthYearDateFormat: currentFormatting?.monthYearDateFormat,
    };

    (['fullDateFormat', 'monthYearDateFormat'] as const).forEach((key) => {
      const remoteValue = remoteFormatting[key];
      if (
        remoteValue !== undefined &&
        (updatedFormatting[key] ?? undefined) === undefined &&
        remoteValue !== DEFAULT_VALUES.formatting.formatting[key]
      ) {
        updatedFormatting[key] = remoteValue;
        changed = true;
      }
    });

    if (changed) {
      const formattingPayload: Record<string, unknown> = {};
      if (updatedFormatting.fullDateFormat !== undefined)
        formattingPayload.fullDateFormat = updatedFormatting.fullDateFormat;
      if (updatedFormatting.monthYearDateFormat !== undefined)
        formattingPayload.monthYearDateFormat = updatedFormatting.monthYearDateFormat;

      merged = {
        ...merged,
        formatting: {
          formatting: formattingPayload as GlobalPreferenceValues['formatting']['formatting'],
        },
      };
    }
  }

  return { merged, changed };
}

export const loadGlobalPreferences = async (): Promise<void> => {
  const entryPoint = await contextUnlockedPromise;
  if (entryPoint !== 'main') {
    await foreverFetch();
    return;
  }

  const { data, status, response } = await ajax(
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

        await (typeof resourceId === 'number' && Number.isFinite(resourceId) && resourceId >= 0 ? ping(`${GLOBAL_RESOURCE_URL}${resourceId}/`, {
            method: 'PUT',
            body: payload,
            headers: { Accept: 'application/json' },
            errorMode: 'silent',
          }) : ping(GLOBAL_RESOURCE_URL, {
            method: 'POST',
            body: payload,
            headers: { Accept: 'application/json' },
            errorMode: 'silent',
          }));
      }
    } catch (error) {
      console.error('Failed migrating remote preferences into GlobalPreferences', error);
    }
  }

  globalPreferences.setRaw(
    (changed ? migratedRaw : raw) as PartialPreferences<typeof globalPreferenceDefinitions>
  );
};
