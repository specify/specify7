import { ajax } from '../../utils/ajax';
import type { AjaxErrorMode } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { IR } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import type { PropertyLine } from './globalPreferencesUtils';

type ResourceResponse = { readonly id: number };

export const GLOBAL_RESOURCE_URL = '/context/collection_resource/';

let globalPreferencesMetadata: ReadonlyArray<PropertyLine> = [];
let globalPreferencesResourceId: number | undefined;

export const getGlobalPreferencesMetadata = (): ReadonlyArray<PropertyLine> =>
  globalPreferencesMetadata;

export const setGlobalPreferencesMetadata = (
  metadata: ReadonlyArray<PropertyLine>
): void => {
  globalPreferencesMetadata = metadata;
};

export const getGlobalPreferencesResourceId = (): number | undefined =>
  globalPreferencesResourceId;

export const setGlobalPreferencesResourceId = (
  id: number | undefined
): void => {
  globalPreferencesResourceId = id;
};

export const buildGlobalPreferencesPayload = (data: string): IR<unknown> =>
  keysToLowerCase({
    name: 'GlobalPreferences',
    mimeType: 'text/plain',
    metaData: '',
    data,
  });

export const upsertGlobalPreferencesResource = async ({
  payload,
  errorMode,
}: {
  readonly payload: IR<unknown>;
  readonly errorMode: AjaxErrorMode;
}): Promise<void> => {
  const resourceId = getGlobalPreferencesResourceId();
  let shouldCreate = true;

  if (
    typeof resourceId === 'number' &&
    Number.isFinite(resourceId) &&
    resourceId >= 0
  ) {
    const { status } = await ajax<string>(
      `${GLOBAL_RESOURCE_URL}${resourceId}/`,
      {
        method: 'PUT',
        body: payload,
        headers: { Accept: 'text/plain' },
        errorMode,
        expectedErrors: [Http.NOT_FOUND],
      }
    );
    shouldCreate = status === Http.NOT_FOUND;
  }

  if (shouldCreate) {
    const { data, status } = await ajax<ResourceResponse>(GLOBAL_RESOURCE_URL, {
      method: 'POST',
      body: payload,
      headers: { Accept: 'application/json' },
      errorMode,
      expectedErrors: [Http.CREATED],
    });
    setGlobalPreferencesResourceId(
      status === Http.CREATED && typeof data?.id === 'number'
        ? data.id
        : undefined
    );
  } else {
    setGlobalPreferencesResourceId(resourceId);
  }
};
