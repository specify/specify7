import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';
import type { RA } from '../../utils/types';
import { keysToLowerCase } from '../../utils/utils';
import { cachableUrl } from '../InitialContext';

export type Resource = {
  readonly id: number;
  readonly metadata: string | null;
  readonly name: string;
  readonly mimetype: string | null;
};

const mimeType = 'application/json';
type ResourceWithData = Resource & {
  readonly data: string;
};

export const preferenceResource = {
  user: {
    url: '/context/user_resource/',
    resourceName: 'UserPreferences',
  },
  collection: {
    url: '/context/collection_resource/',
    resourceName: 'CollectionPreferences',
  },
};

const getActions = (resourceName: string, url: string) => ({
  getResources: ajax<RA<Resource>>(cachableUrl(url), {
    headers: { Accept: 'application/json' },
  }),
  getResourceId: ({ data }: { readonly data: RA<Resource> }) =>
    data.find(
      ({ name, mimetype }) =>
        name === resourceName && mimetype === 'application/json'
    )?.id,
  fetchOrCreate: async (appResourceId: number | undefined) =>
    (typeof appResourceId === 'number'
      ? ajax<ResourceWithData>(cachableUrl(`${url}${appResourceId}/`), {
          headers: { Accept: 'application/json' },
        })
      : ajax<ResourceWithData>(
          url,
          {
            headers: { Accept: 'application/json' },
            method: 'POST',
            body: keysToLowerCase({
              name: resourceName,
              mimeType,
              metaData: '',
              data: '{}',
            }),
          },
          { expectedResponseCodes: [Http.CREATED] }
        )
    ).then(({ data }) => data),
});

const actions = Object.fromEntries(
  Object.entries(preferenceResource).map(
    ([resourceType, { url, resourceName }]) => [
      resourceType,
      getActions(resourceName, url),
    ]
  )
);

export const preferencesPromiseGenerator = Object.fromEntries(
  Object.entries(actions).map(
    ([resourceType, { getResources, getResourceId, fetchOrCreate }]) => [
      resourceType,
      getResources.then(getResourceId).then(fetchOrCreate),
    ]
  )
);
