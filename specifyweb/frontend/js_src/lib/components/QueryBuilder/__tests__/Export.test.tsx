import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { downloadDataSet } from '../../WorkBench/helpers';
import { ping } from '../../../utils/ajax/ping';
import { QueryExportButtons } from '../Export';
import type { QueryField } from '../helpers';

jest.mock('../../../utils/ajax/ping', () => ({
  ping: jest.fn(async () => 200),
}));

jest.mock('../../WorkBench/helpers', () => ({
  downloadDataSet: jest.fn(async () => undefined),
}));

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
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

const localityFields: readonly QueryField[] = [
  {
    id: 1,
    mappingPath: ['latitude1'],
    sortType: undefined,
    isDisplay: true,
    filters: [],
  },
  {
    id: 2,
    mappingPath: ['longitude1'],
    sortType: undefined,
    isDisplay: true,
    filters: [],
  },
];

const queryResource = () =>
  new tables.SpQuery.Resource(
    { id: 5, name: 'All results' },
    { noBusinessRules: true }
  );

const results = {
  current: [
    [1, 'A'],
    [2, 'B'],
  ],
} as never;

function renderButtons(
  selectedRows: ReadonlySet<number>,
  exportFields: readonly QueryField[] = fields,
  baseTableName: 'Agent' | 'Locality' = 'Agent'
): void {
  render(
    <UnloadProtectsContext.Provider value={[]}>
      <QueryExportButtons
        baseTableName={baseTableName}
        fields={exportFields}
        getQueryFieldRecords={undefined}
        queryResource={queryResource()}
        recordSetId={undefined}
        results={results}
        selectedRows={selectedRows}
      />
    </UnloadProtectsContext.Provider>
  );
}

// [QueryBuilder] Export all query results to CSV
test('exports all results to CSV when nothing is selected', async () => {
  renderButtons(new Set());
  const user = userEvent.setup();
  await act(async () => {
    await user.click(
      screen.getByRole('button', { name: queryText.createCsv() })
    );
  });

  expect(ping).toHaveBeenCalledWith(
    '/stored_query/exportcsv/',
    expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ selectedrows: undefined }),
    })
  );
  expect(downloadDataSet).not.toHaveBeenCalled();
});

// [QueryBuilder] Export selected query results to CSV
test('exports only selected results to CSV', async () => {
  renderButtons(new Set([2]));
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: queryText.createCsv() }));

  await waitFor(() => expect(downloadDataSet).toHaveBeenCalledTimes(1));
  const [, rows, columns] = jest.mocked(downloadDataSet).mock.calls[0];
  expect(rows).toEqual([['B']]);
  expect(columns).toEqual(['Last Name']);
  expect(ping).not.toHaveBeenCalled();
});

// [QueryBuilder] Export all query results to KML
test('exports all locality results to KML when nothing is selected', async () => {
  renderButtons(new Set(), localityFields, 'Locality');
  const user = userEvent.setup();
  await act(async () => {
    await user.click(
      screen.getByRole('button', { name: queryText.createKml() })
    );
  });

  expect(ping).toHaveBeenCalledWith(
    '/stored_query/exportkml/',
    expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ selectedrows: undefined }),
    })
  );
});

// [QueryBuilder] Export selected query results to KML
test('exports only selected locality results to KML', async () => {
  renderButtons(new Set([2]), localityFields, 'Locality');
  const user = userEvent.setup();
  await act(async () => {
    await user.click(
      screen.getByRole('button', { name: queryText.createKml() })
    );
  });

  expect(ping).toHaveBeenCalledWith(
    '/stored_query/exportkml/',
    expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({ selectedrows: [2] }),
    })
  );
});
