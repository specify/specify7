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

// [QueryBuilder] Create record set from all results
test('creates a record set from the whole query', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const queryResource = new tables.SpQuery.Resource(
    { id: 5, name: 'All results' },
    { noBusinessRules: true }
  );
  const user = userEvent.setup();
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <MakeRecordSetButton
        baseTableName="Agent"
        fields={fields}
        getQueryFieldRecords={undefined}
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
  expect(props.resource?.get('name')).toBe('All results');
  expect(props.resource?.get('dbTableId')).toBe(tables.Agent.tableId);
  expect(props.resource?.get('fromQuery')).toEqual(
    expect.objectContaining({
      name: 'All results',
      recordsetid: undefined,
    })
  );
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('unknown field fromquery'),
    expect.anything(),
    expect.anything()
  );
  warn.mockRestore();
});
