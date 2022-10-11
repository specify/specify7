import { overwriteAjax } from '../../../tests/ajax';
import { mockTime, requireContext } from '../../../tests/helpers';
import { theories } from '../../../tests/utils';
import { Http } from '../../../utils/ajax/definitions';
import type { RA } from '../../../utils/types';
import { setPref } from '../../UserPreferences/helpers';
import { addMissingFields } from '../addMissingFields';
import { serializeResource } from '../helpers';
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
  resourceToJson,
  saveResource,
  strictIdFromUrl,
  strictParseResourceUrl,
} from '../resource';
import { schema } from '../schema';
import type { CollectionObject } from '../types';

const { getFieldsToClone } = exportsForTests;

mockTime();
requireContext();

describe('fetchResource', () => {
  const baseAgentRecord = {
    resource_uri: getResourceApiUrl('Agent', 1),
  };
  overwriteAjax('/api/specify/agent/1/', baseAgentRecord);

  overwriteAjax('/api/specify/agent/2/', '', {
    responseCode: Http.NOT_FOUND,
  });

  test('found case', async () =>
    expect(fetchResource('Agent', 1)).resolves.toEqual(
      serializeResource(baseAgentRecord)
    ));
  test('not found case', async () =>
    expect(fetchResource('Agent', 2)).resolves.toBeUndefined());
});

overwriteAjax('/api/specify/locality/1/', '', {
  method: 'DELETE',
  responseCode: Http.NO_CONTENT,
});

test('deleteResource', async () =>
  expect(deleteResource('Locality', 1)).resolves.toBeUndefined());

overwriteAjax(
  '/api/specify/locality/',
  {
    resource_uri: getResourceApiUrl('Locality', 2),
    id: 2,
    localityname: 'name',
  },
  {
    method: 'POST',
    responseCode: Http.CREATED,
    body: {
      resource_uri: '/api/specify/locality/2/',
      localityname: 'name',
      srclatlongunit: 0,
      timestampcreated: '2022-08-31',
      discipline: null,
    },
  }
);

test('createResource', async () =>
  expect(
    createResource('Locality', {
      resource_uri: getResourceApiUrl('Locality', 2),
      id: 2,
      localityName: 'name',
    })
  ).resolves.toEqual(
    addMissingFields('Locality', {
      resource_uri: getResourceApiUrl('Locality', 2),
      id: 2,
      localityName: 'name',
    })
  ));

describe('saveResource', () => {
  overwriteAjax(
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

test('resourceToJson', () => {
  const toJSON = jest.fn(() => 'a');
  const a = { toJSON } as unknown as SpecifyResource<AnySchema>;
  expect(resourceToJson(a)).toBe('a');
});

theories(parseJavaClassName, [
  { in: ['edu.ku.brc.specify.datamodel.Accession'], out: 'Accession' },
  { in: ['TEST'], out: 'TEST' },
]);
describe('getFieldsToClone', () => {
  test('default carry over fields', () =>
    expect(getFieldsToClone(schema.models.SpQuery)).toEqual(
      schema.models.SpQuery.fields.map(({ name }) => name)
    ));
  test('customize carry over fields', () => {
    setPref('form', 'preferences', 'carryForward', {
      Locality: ['localityName', 'text1'],
    });
    expect(getFieldsToClone(schema.models.Locality)).toEqual([
      'localityName',
      'text1',
    ]);
  });
});

describe('getUniqueFields', () => {
  test('CollectionObject', () =>
    expect(getUniqueFields(schema.models.CollectionObject)).toEqual([
      'catalogNumber',
      'guid',
    ]));
  test('Locality', () =>
    expect(getUniqueFields(schema.models.Locality)).toEqual([]));
});

test('getFieldsToNotClone', () => {
  setPref('form', 'preferences', 'carryForward', {
    CollectionObject: schema.models.CollectionObject.fields
      .filter(({ name }) => name !== 'text1')
      .map(({ name }) => name) as RA<TableFields<CollectionObject>>,
  });
  expect(getFieldsToNotClone(schema.models.CollectionObject)).toEqual([
    'catalogNumber',
    'guid',
    'text1',
  ]);
});
