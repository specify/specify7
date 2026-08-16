import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { Http } from '../../../utils/ajax/definitions';
import type { RA } from '../../../utils/types';
import { addMissingFields } from '../../DataModel/addMissingFields';
import type { SerializedResource } from '../../DataModel/helperTypes';
import {
  createResource,
  getResourceApiUrl,
  saveResource,
} from '../../DataModel/resource';
import { serializeResource } from '../../DataModel/serializers';
import type { SpLocaleContainer } from '../../DataModel/types';
import { fetchContainerItems, fetchContainerString } from '../data';

requireContext();

describe('fetchContainerItems', () => {
  const container = {
    id: 1,
    name: 'Accession',
    resource_uri: getResourceApiUrl('SpLocaleContainer', 1),
  } as unknown as SerializedResource<SpLocaleContainer>;

  // The item name must be a real field of the container table, otherwise
  // fetchContainerItems filters it out as a removed field
  const itemRecord = {
    resource_uri: getResourceApiUrl('SpLocaleContainerItem', 1),
    id: 1,
    name: 'accessionNumber',
    ishidden: false,
    isrequired: false,
    format: null,
    picklistname: null,
    weblinkname: null,
    container: getResourceApiUrl('SpLocaleContainer', 1),
  };

  const nameStringRecord = {
    resource_uri: getResourceApiUrl('SpLocaleItemStr', 1),
    id: 1,
    language: 'en',
    country: null,
    text: 'Field 1',
    itemname: getResourceApiUrl('SpLocaleContainerItem', 1),
  };

  const descStringRecord = {
    resource_uri: getResourceApiUrl('SpLocaleItemStr', 2),
    id: 2,
    language: 'en',
    country: null,
    text: 'Desc 1',
    itemdesc: getResourceApiUrl('SpLocaleContainerItem', 1),
  };

  const containerNameRecord = {
    resource_uri: getResourceApiUrl('SpLocaleItemStr', 3),
    id: 3,
    language: 'en',
    country: null,
    text: 'Accession',
    containername: getResourceApiUrl('SpLocaleContainer', 1),
  };

  const containerDescRecord = {
    resource_uri: getResourceApiUrl('SpLocaleItemStr', 4),
    id: 4,
    language: 'en',
    country: null,
    text: 'Accession description',
    containerdesc: getResourceApiUrl('SpLocaleContainer', 1),
  };

  const collection = (objects: RA<unknown>) => ({
    meta: { limit: 0, offset: 0, total_count: objects.length },
    objects,
  });

  overrideAjax(
    '/api/specify/splocalecontaineritem/?limit=0&container=1',
    collection([itemRecord])
  );
  overrideAjax(
    '/api/specify/splocaleitemstr/?limit=0&itemname__container__exact=1',
    collection([nameStringRecord])
  );
  overrideAjax(
    '/api/specify/splocaleitemstr/?limit=0&itemdesc__container__exact=1',
    collection([descStringRecord])
  );
  overrideAjax(
    '/api/specify/splocaleitemstr/?limit=0&containername=1',
    collection([containerNameRecord])
  );
  overrideAjax(
    '/api/specify/splocaleitemstr/?limit=0&containerdesc=1',
    collection([containerDescRecord])
  );

  test('fetches items and resolves their name and description strings', async () =>
    expect(fetchContainerItems(container, 'en', null)).resolves.toEqual([
      {
        ...serializeResource(itemRecord),
        strings: {
          name: serializeResource(nameStringRecord),
          desc: serializeResource(descStringRecord),
        },
      },
    ]));

  test('fetches the container name and description strings', async () => {
    await expect(
      fetchContainerString('containerName', container, 'en', null)
    ).resolves.toEqual(serializeResource(containerNameRecord));
    await expect(
      fetchContainerString('containerDesc', container, 'en', null)
    ).resolves.toEqual(serializeResource(containerDescRecord));
  });
});

describe('saveResource / createResource', () => {
  overrideAjax(
    '/api/specify/splocaleitemstr/1/',
    {
      resource_uri: getResourceApiUrl('SpLocaleItemStr', 1),
      id: 1,
      language: 'en',
      country: null,
      text: 'Field 1',
    },
    { method: 'PUT' }
  );

  test('saveResource on SpLocaleItemStr', async () =>
    expect(
      saveResource('SpLocaleItemStr', 1, { text: 'Field 1' })
    ).resolves.toEqual(
      addMissingFields('SpLocaleItemStr', {
        resource_uri: getResourceApiUrl('SpLocaleItemStr', 1),
        id: 1,
        language: 'en',
        country: null,
        text: 'Field 1',
      })
    ));

  overrideAjax(
    '/api/specify/splocalecontaineritem/7/',
    {
      resource_uri: getResourceApiUrl('SpLocaleContainerItem', 7),
      id: 7,
      name: 'accessionNumber',
      ishidden: true,
    },
    { method: 'PUT' }
  );

  test('saveResource on SpLocaleContainerItem', async () =>
    expect(
      saveResource('SpLocaleContainerItem', 7, { isHidden: true })
    ).resolves.toEqual(
      addMissingFields('SpLocaleContainerItem', {
        resource_uri: getResourceApiUrl('SpLocaleContainerItem', 7),
        id: 7,
        name: 'accessionNumber',
        isHidden: true,
      })
    ));

  overrideAjax(
    '/api/specify/splocaleitemstr/',
    {
      resource_uri: getResourceApiUrl('SpLocaleItemStr', 5),
      id: 5,
      language: 'en',
      country: null,
      text: 'Field 1',
    },
    { method: 'POST', responseCode: Http.CREATED }
  );

  test('createResource on SpLocaleItemStr', async () =>
    expect(
      createResource('SpLocaleItemStr', { text: 'Field 1' })
    ).resolves.toEqual(
      addMissingFields('SpLocaleItemStr', {
        resource_uri: getResourceApiUrl('SpLocaleItemStr', 5),
        id: 5,
        language: 'en',
        country: null,
        text: 'Field 1',
      })
    ));
});
