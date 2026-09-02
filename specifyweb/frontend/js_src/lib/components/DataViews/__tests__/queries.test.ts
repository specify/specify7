import { addMissingFields } from '../../DataModel/addMissingFields';
import { serializeResource } from '../../DataModel/serializers';
import { strictGetTable } from '../../DataModel/tables';
import { requireContext } from '../../../tests/helpers';
import {
  defaultDataViewQuery,
  getDataViewQueryDefinition,
  getStoredDataViewQueryDefinition,
  makeDataViewQuery,
  parseDataViewQueries,
  serializeDataViewQueries,
} from '../queries';
import { getNumericResultId } from '../index';

requireContext();

test('invalid Data View query resources fall back to an empty version 1 file', () => {
  expect(parseDataViewQueries('{invalid')).toEqual({ version: 1, queries: {} });
  expect(parseDataViewQueries('{"version":2,"queries":{}}')).toEqual({
    version: 1,
    queries: {},
  });
  expect(parseDataViewQueries('{"version":1,"queries":null}')).toEqual({
    version: 1,
    queries: {},
  });
  expect(parseDataViewQueries('{"version":1,"queries":[]}')).toEqual({
    version: 1,
    queries: {},
  });
});

test('result IDs accept finite numbers and numeric strings only', () => {
  expect(getNumericResultId(42)).toBe(42);
  expect(getNumericResultId(' 42 ')).toBe(42);
  expect(getNumericResultId('')).toBeUndefined();
  expect(getNumericResultId('invalid')).toBeUndefined();
  expect(getNumericResultId(Number.NaN)).toBeUndefined();
  expect(getNumericResultId(Number.POSITIVE_INFINITY)).toBeUndefined();
  expect(getNumericResultId(null)).toBeUndefined();
});

test('Data View query definitions round trip as JSON', () => {
  const data = {
    version: 1 as const,
    queries: {
      Agent: {
        fields: [addMissingFields('SpQueryField', { fieldName: 'Name' })],
        selectDistinct: true,
      },
    },
  };
  expect(parseDataViewQueries(serializeDataViewQueries(data))).toEqual(data);
  expect(parseDataViewQueries(data)).toEqual(data);
});

test('missing table definitions use generated defaults', () => {
  const file = parseDataViewQueries(undefined);
  const definition = getDataViewQueryDefinition(file, 'Agent');

  expect(getStoredDataViewQueryDefinition(file, 'Agent')).toBeUndefined();
  expect(definition.fields.length).toBeGreaterThan(0);
  expect(definition.selectDistinct).toBe(false);
  expect(defaultDataViewQuery('Agent')).toEqual(definition);
});

test('empty Data View query definitions create an empty query', () => {
  const query = makeDataViewQuery('Agent', { fields: [] });

  expect(serializeResource(query).fields).toEqual([]);
});

test('malformed table definitions use generated defaults', () => {
  const file = parseDataViewQueries(
    JSON.stringify({ version: 1, queries: { Agent: { selectDistinct: true } } })
  );
  const definition = getDataViewQueryDefinition(file, 'Agent');

  expect(definition).toEqual(defaultDataViewQuery('Agent'));
  expect(() => makeDataViewQuery('Agent', definition)).not.toThrow();
});

test('stored table definitions override defaults in runtime queries', () => {
  const definition = {
    fields: [addMissingFields('SpQueryField', { fieldName: 'Name' })],
    selectDistinct: true,
    searchSynonymy: true,
    smushed: true,
  };
  const file = {
    version: 1 as const,
    queries: { Agent: definition },
  };
  const storedDefinition = getDataViewQueryDefinition(file, 'Agent');
  expect(getStoredDataViewQueryDefinition(file, 'Agent')).toBe(definition);
  const query = makeDataViewQuery('Agent', storedDefinition);

  expect(storedDefinition).toBe(definition);
  expect(serializeResource(query).fields).toHaveLength(1);
  expect(query.get('selectDistinct')).toBe(true);
  expect(query.get('searchSynonymy')).toBe(true);
  expect(query.get('smushed')).toBe(true);
});

test('generated defaults include every unhidden literal field', () => {
  const table = strictGetTable('Agent');
  const expected = new Set([
    ...table.literalFields
      .filter(
        ({ isHidden, isVirtual, isRelationship, name }) =>
          !isHidden &&
          !isVirtual &&
          !isRelationship &&
          !['id', 'timestampcreated', 'timestampmodified', 'version'].includes(
            name.toLowerCase()
          ) &&
          name !== table.idField.name
      )
      .map(({ name }) => name),
  ]);
  expect(
    new Set(
      defaultDataViewQuery('Agent').fields.map(({ fieldName }) => fieldName)
    )
  ).toEqual(expected);
});

test('runtime queries are ephemeral and use the configured fields', () => {
  const definition = defaultDataViewQuery('Agent');
  const query = makeDataViewQuery('Agent', definition);
  expect(query.isNew()).toBe(true);
  expect(query.get('contextName')).toBe('Agent');
  expect(query.get('specifyUser')).toBeDefined();
  expect(serializeResource(query).fields).toHaveLength(
    definition.fields.length
  );
});
