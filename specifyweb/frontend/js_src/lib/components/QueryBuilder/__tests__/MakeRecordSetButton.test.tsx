import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import { ResourceView } from '../../Forms/ResourceView';
import { tables } from '../../DataModel/tables';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import type { QueryField } from '../helpers';
import { MakeRecordSetButton } from '../Components';

jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: jest.fn(() => null),
}));

afterEach(() => jest.restoreAllMocks());

requireContext();

const fields: readonly QueryField[] = [
  {
    id: 1,
    mappingPath: ['lastName'],
    sortType: undefined,
    isDisplay: true,
    filters: [],
  },
];

const fieldRecords = [
  {
    id: 1,
    stringId: '1.collectionobject.lastName',
    fieldName: 'lastName',
    tableList: '1',
    isDisplay: true,
    isRelFld: false,
    sortType: 0,
    position: 0,
    operStart: 8,
    startValue: '',
  },
] as never;

// [QueryBuilder] Create record set from all results
test('creates a record set from the whole query', async () => {
  jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const queryResource = new tables.SpQuery.Resource(
    { id: 5, name: 'All results' },
    { noBusinessRules: true }
  );
  const getQueryFieldRecords = jest.fn(() => fieldRecords);
  const user = userEvent.setup();
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <MakeRecordSetButton
        baseTableName="Agent"
        fields={fields}
        getQueryFieldRecords={getQueryFieldRecords}
        queryResource={queryResource}
        sourceRecordSetId={undefined}
      />
    </UnloadProtectsContext.Provider>
  );

  await act(async () => {
    await user.click(
      screen.getByRole('button', {
        name: queryText.createRecordSet({
          recordSetTable: tables.RecordSet.label,
        }),
      })
    );
  });

  const props = jest.mocked(ResourceView).mock.calls.at(-1)![0];
  expect(getQueryFieldRecords).toHaveBeenCalledTimes(1);
  expect(props.resource?.get('name')).toBe('All results');
  expect(props.resource?.get('dbTableId')).toBe(tables.Agent.tableId);
  const fromQuery = props.resource?.get('fromQuery') as unknown as {
    readonly fields: readonly Record<string, unknown>[];
  };
  expect(fromQuery).toEqual(
    expect.objectContaining({
      name: 'All results',
      recordsetid: undefined,
    })
  );
  expect(fromQuery.fields).toHaveLength(1);
  expect(fromQuery.fields[0]).toEqual(
    expect.objectContaining({
      fieldname: 'lastName',
      stringid: '1.collectionobject.lastName',
      startvalue: '',
    })
  );
  expect((props.resource as unknown as { url: string }).url).toBe(
    '/stored_query/make_recordset/'
  );
});
