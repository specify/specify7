import { requireContext } from '../../../tests/helpers';
import { addMissingFields } from '../../DataModel/addMissingFields';
import { tables } from '../../DataModel/tables';
import { queryPropertiesEqual, reconcileQuery } from '../reconcileQuery';

requireContext();

const definition = () =>
  addMissingFields('SpQuery', {
    id: 100,
    version: 1,
    name: 'Query',
    contextTableId: tables.CollectionObject.tableId,
    fields: ['catalognumber', 'remarks'].map((name, position) =>
      addMissingFields('SpQueryField', {
        id: position + 1,
        fieldName: name,
        stringId: `1.collectionobject.${name}`,
        tableList: '1',
        position,
        operStart: 1,
        isDisplay: true,
        startValue: 'Original',
      })
    ),
  });

test('combines independent local and server definition changes with the server version', () => {
  const base = definition();
  const local = {
    ...base,
    name: 'Local name',
    fields: base.fields.map((field, index) =>
      index === 0 ? { ...field, startValue: 'Local filter' } : field
    ),
  };
  const server = {
    ...base,
    remarks: 'Server remarks',
    version: 8,
    fields: base.fields.map((field, index) =>
      index === 1
        ? {
            ...field,
            id: 200,
            version: 9,
            startValue: 'Server filter',
            columnAlias: 'Server alias',
            allowNulls: true,
          }
        : field
    ),
  };
  const result = reconcileQuery(base, local, server);
  expect(result.conflicts).toEqual([]);
  expect(result.definition).toMatchObject({
    name: 'Local name',
    remarks: 'Server remarks',
    version: 8,
  });
  expect(result.definition.fields.map(({ startValue }) => startValue)).toEqual([
    'Local filter',
    'Server filter',
  ]);
  expect(base).toEqual(definition());
  expect(result.definition.fields[1]).toMatchObject({
    id: 200,
    version: 9,
    columnAlias: 'Server alias',
    allowNulls: true,
  });
});

test.each(['local', 'server'] as const)(
  'requires an explicit %s choice for overlapping edits',
  (choice) => {
    const base = definition();
    const local = { ...base, name: 'Local name' };
    const server = {
      ...base,
      name: 'Server name',
      remarks: 'Server remarks',
      version: 8,
    };
    const conflict = reconcileQuery(base, local, server);
    expect(conflict.conflicts).toEqual([
      { path: 'name', local: 'Local name', server: 'Server name' },
    ]);
    const resolved = reconcileQuery(base, local, server, { name: choice });
    expect(resolved.conflicts).toEqual([]);
    expect(resolved.definition).toMatchObject({
      name: choice === 'local' ? 'Local name' : 'Server name',
      remarks: 'Server remarks',
      version: 8,
    });
  }
);

test('does not silently delete a field edited on the server', () => {
  const base = definition();
  const local = { ...base, fields: base.fields.slice(1) };
  const server = {
    ...base,
    version: 8,
    fields: base.fields.map((field) => ({
      ...field,
      startValue: 'Server filter',
    })),
  };
  const result = reconcileQuery(base, local, server);
  expect(result.conflicts).toEqual([
    expect.objectContaining({
      path: 'fields.1.collectionobject.catalogNumber',
      local: undefined,
    }),
  ]);
});

test('an unchanged editor adopts the complete server definition', () => {
  const base = definition();
  const server = { ...base, name: 'Server name', version: 8 };
  const result = reconcileQuery(base, base, server);
  expect(result.conflicts).toEqual([]);
  expect(result.definition.name).toBe('Server name');
});

test('merges independent changes to the same field', () => {
  const base = definition();
  const result = reconcileQuery(
    base,
    {
      ...base,
      fields: [
        { ...base.fields[0], startValue: 'Local filter' },
        base.fields[1],
      ],
    },
    {
      ...base,
      fields: [
        { ...base.fields[0], columnAlias: 'Server alias' },
        base.fields[1],
      ],
    }
  );
  expect(result.conflicts).toEqual([]);
  expect(result.definition.fields[0]).toMatchObject({
    startValue: 'Local filter',
    columnAlias: 'Server alias',
  });
});

test.each(['local', 'server'] as const)(
  'resolves conflicting OR filters together (%s)',
  (choice) => {
    const base = definition();
    const path = 'fields.1.collectionobject.catalogNumber';
    const original = base.fields[0];
    const local = {
      ...base,
      fields: [
        original,
        { ...original, id: 3, startValue: 'Local OR filter', isDisplay: false },
        base.fields[1],
      ],
    };
    const server = {
      ...base,
      fields: [{ ...original, startValue: 'Server filter' }, base.fields[1]],
    };
    expect(reconcileQuery(base, local, server).conflicts).toEqual([
      expect.objectContaining({ path }),
    ]);
    const result = reconcileQuery(base, local, server, { [path]: choice });
    expect(result.conflicts).toEqual([]);
    expect(
      result.definition.fields.map(({ startValue }) => startValue)
    ).toEqual(
      choice === 'local'
        ? ['Original', 'Local OR filter', 'Original']
        : ['Server filter', 'Original']
    );
  }
);

test('server metadata and unset boolean defaults do not mark query properties dirty', () => {
  const base = definition();
  expect(
    queryPropertiesEqual(base, {
      ...base,
      version: 8,
      selectDistinct: false,
      searchSynonymy: false,
      smushed: false,
    })
  ).toBe(true);
  expect(queryPropertiesEqual(base, { ...base, selectDistinct: true })).toBe(
    false
  );
  expect(queryPropertiesEqual(base, { ...base, searchSynonymy: true })).toBe(
    false
  );
});
