import { overrideAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { Http } from '../../../utils/ajax/definitions';
import type { RA } from '../../../utils/types';
import { userPreferences } from '../../Preferences/userPreferences';
import { addMissingFields } from '../addMissingFields';
import type { AnySchema, TableFields } from '../helperTypes';
import type { SpecifyResource } from '../legacyTypes';
import {
  createResource,
  deleteResource,
  exportsForTests,
  fetchResource,
  getFieldsToNotClone,
  getResourceApiUrl,
  getResourceViewUrl,
  getUniqueFields,
  idFromUrl,
  parseJavaClassName,
  parseResourceUrl,
  resourceFromUrl,
  resourceToJson,
  saveResource,
  strictIdFromUrl,
  strictParseResourceUrl,
} from '../resource';
import { serializeResource } from '../serializers';
import { tables } from '../tables';
import type { CollectionObject } from '../types';

const { getCarryOverPreference, getFieldsToClone } = exportsForTests;

mockTime();
requireContext();

describe('fetchResource', () => {
  const baseAgentRecord = {
    resource_uri: getResourceApiUrl('Agent', 1),
  };
  overrideAjax('/api/specify/agent/1/', baseAgentRecord);

  overrideAjax('/api/specify/agent/2/', '', {
    responseCode: Http.NOT_FOUND,
  });

  test('found case', async () =>
    expect(fetchResource('Agent', 1)).resolves.toEqual(
      serializeResource(baseAgentRecord)
    ));
  test('not found case', async () =>
    expect(fetchResource('Agent', 2, false)).resolves.toBeUndefined());
});

overrideAjax('/api/specify/locality/1/', '', {
  method: 'DELETE',
  responseCode: Http.NO_CONTENT,
});

test('deleteResource', async () =>
  expect(deleteResource('Locality', 1)).resolves.toBeUndefined());

const localityId = 2;

overrideAjax(
  '/api/specify/locality/',
  {
    resource_uri: getResourceApiUrl('Locality', localityId),
    id: localityId,
    localityname: 'name',
    discipline: getResourceApiUrl('Discipline', 3),
  },
  {
    method: 'POST',
    responseCode: Http.CREATED,
    body: {
      discipline: getResourceApiUrl('Discipline', 3),
      localityname: 'name',
      srclatlongunit: 0,
      timestampcreated: '2022-08-31',
    },
  }
);

test('createResource', async () =>
  expect(
    createResource('Locality', {
      localityName: 'name',
      // This should get ignored
      resource_uri: getResourceApiUrl('Locality', 123),
      // This should get ignored
      id: 44,
    })
  ).resolves.toEqual(
    addMissingFields('Locality', {
      resource_uri: getResourceApiUrl('Locality', localityId),
      id: localityId,
      discipline: getResourceApiUrl('Discipline', 3),
      localityName: 'name',
    })
  ));

describe('saveResource', () => {
  overrideAjax(
    '/api/specify/locality/3/',
    {
      resource_uri: getResourceApiUrl('Locality', 2),
      id: 1,
      localityname: 'name',
    },
    {
      method: 'PUT',
    }
  );
  test('without conflict', async () =>
    expect(
      saveResource('Locality', 3, { localityName: 'name' })
    ).resolves.toEqual(
      addMissingFields('Locality', {
        resource_uri: getResourceApiUrl('Locality', 2),
        id: 1,
        localityName: 'name',
      })
    ));
});

theories(getResourceViewUrl, [
  { in: ['CollectionObject', 3], out: '/specify/view/collectionobject/3/' },
  {
    in: ['CollectionObject', 'new'],
    out: '/specify/view/collectionobject/new/',
  },
  {
    in: ['CollectionObject', 3, 4],
    out: '/specify/view/collectionobject/3/?recordsetid=4',
  },
  {
    in: ['CollectionObject', 'new', 4],
    out: '/specify/view/collectionobject/new/?recordsetid=4',
  },
]);

theories(getResourceApiUrl, [
  { in: ['CollectionObject', 3], out: '/api/specify/collectionobject/3/' },
  {
    in: ['CollectionObject', 'new'],
    out: '/api/specify/collectionobject/new/',
  },
  {
    in: ['CollectionObject', 3, 4],
    out: '/api/specify/collectionobject/3/?recordsetid=4',
  },
  {
    in: ['CollectionObject', 'new', 4],
    out: '/api/specify/collectionobject/new/?recordsetid=4',
  },
]);

theories(parseResourceUrl, [
  { in: ['/api/specify/collectionobject/1/'], out: ['CollectionObject', 1] },
  // Does not parse URLs with query parameters for now
  {
    in: ['/api/specify/collectionobject/2/?recordsetid=4'],
    out: undefined,
  },
  { in: ['/api/specify/collectionobject/new/'], out: undefined },
  { in: ['/api/specify/collectionobject/new/'], out: undefined },
  { in: ['/new/'], out: undefined },
]);

describe('strictParseResourceUrl', () => {
  test('valid url', () =>
    expect(strictParseResourceUrl('/api/specify/collectionobject/1/')).toEqual([
      'CollectionObject',
      1,
    ]));
  test('valid url without id', () =>
    expect(strictParseResourceUrl('/api/specify/collectionobject/')).toEqual([
      'CollectionObject',
      undefined,
    ]));
  test('invalid url', () =>
    expect(() => strictParseResourceUrl('/api//1/')).toThrow(
      /^Unable to parse resource API url/u
    ));
});

theories(idFromUrl, [
  { in: ['/api/specify/collectionobject/1/'], out: 1 },
  // Does not parse URLs with query parameters for now
  {
    in: ['/api/specify/collectionobject/2/?recordsetid=4'],
    out: undefined,
  },
  { in: ['/api/specify/collectionobject/new/'], out: undefined },
  { in: ['/api/specify/collectionobject/new/'], out: undefined },
  { in: ['/new/'], out: undefined },
]);

describe('strictIdFromUrl', () => {
  test('valid url', () =>
    expect(strictIdFromUrl('/api/specify/collectionobject/1/')).toBe(1));
  test('invalid url', () =>
    expect(() => strictIdFromUrl('/api//1/')).toThrow(
      /^Unable to extract resource id from url/u
    ));
});

describe('resourceFromUrl', () => {
  test('valid url', () => {
    const resource = resourceFromUrl('/api/specify/collectionobject/123/', {
      noBusinessRules: true,
    })!;
    expect(resource.specifyTable).toBe(tables.CollectionObject);
    expect(resource.id).toBe(123);
    expect(resource.noBusinessRules).toBe(true);
  });
  test('invalid url', () =>
    expect(resourceFromUrl('/api//1/')).toBeUndefined());
});

test('resourceToJson', () => {
  const toJSON = jest.fn(() => 'a');
  const a = { toJSON } as unknown as SpecifyResource<AnySchema>;
  expect(resourceToJson(a)).toBe('a');
});

theories(parseJavaClassName, [
  { in: ['edu.ku.brc.specify.datamodel.Accession'], out: 'Accession' },
  { in: ['TEST'], out: 'TEST' },
]);
describe('getCarryOverPreference', () => {
  test('default carry over fields', () =>
    expect(getCarryOverPreference(tables.SpQuery, true, false)).toEqual(
      getFieldsToClone(tables.SpQuery)
    ));
  test('customize carry over fields', () => {
    userPreferences.set('form', 'preferences', 'carryForward', {
      Locality: ['localityName', 'text1'],
    });
    expect(getCarryOverPreference(tables.Locality, false, false)).toEqual([
      'localityName',
      'text1',
    ]);
    expect(getCarryOverPreference(tables.SpQuery, true, false)).toEqual(
      getFieldsToClone(tables.SpQuery)
    );
  });
});

describe('getUniqueFields', () => {
  test('CollectionObject', () =>
    expect(getUniqueFields(tables.CollectionObject)).toEqual([
      'catalogNumber',
      'uniqueIdentifier',
      'guid',
      'collectionObjectAttachments',
      'timestampCreated',
      'version',
      'timestampModified',
    ]));
  test('Locality', () =>
    expect(getUniqueFields(tables.Locality)).toEqual([
      'uniqueIdentifier',
      'localityAttachments',
      'guid',
      'timestampCreated',
      'version',
      'timestampModified',
    ]));
  test('AccessionAttachment', () =>
    expect(getUniqueFields(tables.AccessionAttachment)).toEqual([
      'attachment',
      'timestampCreated',
      'version',
      'timestampModified',
    ]));
  test('AccessionAgent', () =>
    expect(getUniqueFields(tables.AccessionAgent)).toEqual([
      'timestampCreated',
      'version',
      'timestampModified',
    ]));
});

test('getFieldsToNotClone', () => {
  userPreferences.set('form', 'preferences', 'carryForward', {
    CollectionObject: getFieldsToClone(tables.CollectionObject).filter(
      (name) => name !== 'text1'
    ) as RA<TableFields<CollectionObject>>,
  });
  expect(getFieldsToNotClone(tables.CollectionObject, true, false)).toEqual([
    'actualTotalCountAmt',
    'age',
    'catalogNumber',
    'timestampModified',
    'guid',
    'timestampCreated',
    'totalCountAmt',
    'uniqueIdentifier',
    'version',
    'collectionObjectAttachments',
    'currentDetermination',
    'projects',
  ]);
  expect(getFieldsToNotClone(tables.CollectionObject, false, false)).toEqual([
    'actualTotalCountAmt',
    'age',
    'catalogNumber',
    'timestampModified',
    'guid',
    'text1',
    'timestampCreated',
    'totalCountAmt',
    'uniqueIdentifier',
    'version',
    'collectionObjectAttachments',
    'currentDetermination',
    'projects',
  ]);
});
