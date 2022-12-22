import { cachableUrl } from '../InitialContext';
import { keysToLowerCase } from '../../utils/utils';
import { IR, RA } from '../../utils/types';
import { ajax } from '../../utils/ajax';
import { Http } from '../../utils/ajax/definitions';

const userResourceName = 'UserPreferences';
const collectionResourceName = 'CollectionPreferences';

type UserResource = {
  readonly id: number;
  readonly metadata: string | null;
  readonly name: string;
  readonly mimetype: string | null;
};
type ResourceWithData = UserResource & {
  readonly data: string;
};

export const preferencesFetchSpec = {
  userPreferences: {
    url: '/context/user_resource/',
    actions: [
      ({ data }) =>
        data.find(
          ({ name, mimetype }) =>
            name === userResourceName && mimetype === 'application/json'
        )?.id,
      async (appResourceId) =>
        (typeof appResourceId === 'number'
          ? ajax<ResourceWithData>(
              cachableUrl(`/context/user_resource/${appResourceId}/`),
              {
                headers: { Accept: 'application/json' },
              }
            )
          : ajax<ResourceWithData>(
              '/context/user_resource/',
              {
                headers: { Accept: 'application/json' },
                method: 'POST',
                body: keysToLowerCase({
                  name: userResourceName,
                  mimeType,
                  metaData: '',
                  data: '{}',
                }),
              },
              { expectedResponseCodes: [Http.CREATED] }
            )
        ).then(({ data }) => data),
    ],
  },
  collectionPreferences: {
    url: '/context/collection_resource/',
    actions: [
      ({ data }) =>
        data.find(
          ({ name, mimetype }) =>
            name === collectionResourceName && mimetype === 'application/json'
        )?.id,
      async (appResourceId) =>
        (typeof appResourceId === 'number'
          ? ajax<ResourceWithData>(
              cachableUrl(`/context/collection_resource/${appResourceId}/`),
              {
                headers: { Accept: 'application/json' },
              }
            )
          : ajax<ResourceWithData>(
              '/context/collection_resource/',
              {
                headers: { Accept: 'application/json' },
                method: 'POST',
                body: keysToLowerCase({
                  name: collectionResourceName,
                  mimeType: 'application/json',
                  metaData: '',
                  data: '{}',
                }),
              },
              { expectedResponseCodes: [Http.CREATED] }
            )
        ).then(({ data }) => data),
    ],
  },
};

export const preferencesPromiseGenerator = (
  preferencesFetchSpec: IR<{
    readonly url: string;
    readonly actions: RA<Promise<any> | ((data: any) => any)>;
  }>
): Promise<[string, any]>[] => {
  const preferencesPromiseList = Object.entries(preferencesFetchSpec).map(
    async ([preferencesFetchName, { url, actions }]): Promise<
      [string, any]
    > => {
      return [
        preferencesFetchName,
        await ajax<RA<UserResource>>(cachableUrl(url), {
          headers: { Accept: 'application/json' },
        }).then(async (data) => {
          console.log('got this data from backend: ', data);
          return await actions.reduce(
            async (currentDataPromise, currentPromise) => {
              const currentData = await currentDataPromise;
              const nextData = await currentPromise(currentData);
              return nextData;
            },
            data
          );
        }),
      ];
    }
  );
  return preferencesPromiseList;
};
