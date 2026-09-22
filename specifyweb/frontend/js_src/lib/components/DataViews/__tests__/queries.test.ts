import { addMissingFields } from '../../DataModel/addMissingFields';
import { serializeResource } from '../../DataModel/serializers';
import { strictGetTable } from '../../DataModel/tables';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import {
  defaultDataViewQuery,
  getDataViewQueryDefinition,
  getStoredDataViewQueryDefinition,
  makeDataViewQuery,
  parseDataViewQueries,
  saveUserDataViewQueries,
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

test('unsupported operStart values use generated defaults', () => {
  const file = parseDataViewQueries(
    JSON.stringify({
      version: 1,
      queries: {
        Agent: {
          fields: [
            addMissingFields('SpQueryField', {
              fieldName: 'Name',
              operStart: Number.MAX_SAFE_INTEGER,
            }),
          ],
        },
      },
    })
  );

  expect(getStoredDataViewQueryDefinition(file, 'Agent')).toBeUndefined();
  expect(getDataViewQueryDefinition(file, 'Agent')).toEqual(
    defaultDataViewQuery('Agent')
  );
});

const canonicalRecord = {
  id: 1,
  name: 'DataViewQueries',
  mimetype: 'application/json',
};
const duplicateRecord = {
  id: 2,
  name: 'DataViewQueries',
  mimetype: 'application/json',
};
const makeField = (fieldName: string) => ({
  stringId: fieldName,
  fieldName,
  tableList: 'Agent',
  isDisplay: true,
  isNot: false,
  sortType: 0,
  operStart: 1,
  startValue: '',
  isRelFld: null,
  isStrict: false,
});
const canonicalData = {
  version: 1,
  queries: {
    Agent: {
      fields: [makeField('Name')],
    },
  },
};
const duplicateData = {
  version: 1,
  queries: {
    Loan: {
      fields: [makeField('LoanNumber')],
    },
  },
};
const updatedAgent = {
  fields: [makeField('Abbreviation')],
};
const mergedData = {
  version: 1,
  queries: {
    Agent: updatedAgent,
    Loan: duplicateData.queries.Loan,
  },
};

overrideAjax('/context/user_resource/', [canonicalRecord, duplicateRecord]);
overrideAjax(`/context/user_resource/${canonicalRecord.id}/`, {
  data: JSON.stringify(canonicalData),
});
overrideAjax(`/context/user_resource/${duplicateRecord.id}/`, {
  data: JSON.stringify(duplicateData),
});
overrideAjax(
  `/context/user_resource/${canonicalRecord.id}/`,
  '',
  {
    method: 'PUT',
    body: {
      name: 'DataViewQueries',
      mimetype: 'application/json',
      metadata: '',
      data: JSON.stringify(mergedData, undefined, 2),
    },
  },
  true
);
overrideAjax(`/context/user_resource/${duplicateRecord.id}/`, '', {
  method: 'DELETE',
});
overrideAjax('/context/app.resource?name=DataViewQueries', '', {
  method: 'HEAD',
});

test('duplicate Data View resources preserve all table overrides before deletion', async () => {
  await saveUserDataViewQueries(
    JSON.stringify({ version: 1, queries: { Agent: updatedAgent } }),
    'Agent'
  );
});

test('table definitions with null fields use generated defaults', () => {
  const file = parseDataViewQueries(
    JSON.stringify({ version: 1, queries: { Agent: { fields: [null] } } })
  );

  expect(getStoredDataViewQueryDefinition(file, 'Agent')).toBeUndefined();
  expect(getDataViewQueryDefinition(file, 'Agent')).toEqual(
    defaultDataViewQuery('Agent')
  );
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

test('generated defaults include every unhidden literal field and a hidden audit timestamp sort', () => {
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
  const fields = defaultDataViewQuery('Agent').fields;
  console.log(
    'Generated Agent default fields:',
    fields.map(({ fieldName }) => fieldName)
  );

  expect(
    new Set(
      fields
        .filter(({ isDisplay }) => isDisplay !== false)
        .map(({ fieldName }) => fieldName)
    )
  ).toEqual(expected);
  expect(fields.at(-1)).toMatchObject({
    fieldName: expect.stringMatching(/timestamp(created|modified)/i),
    isDisplay: false,
    sortType: 2,
  });
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
