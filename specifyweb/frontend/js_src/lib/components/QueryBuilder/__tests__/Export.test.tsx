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
import { unParseQueryFields } from '../helpers';

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
    filters: [
      { type: 'any', startValue: '', isNot: false, isStrict: false },
    ],
  },
];

const localityFields: readonly QueryField[] = [
  {
    id: 1,
    mappingPath: ['latitude1'],
    sortType: undefined,
    isDisplay: true,
    filters: [
      { type: 'any', startValue: '', isNot: false, isStrict: false },
    ],
  },
  {
    id: 2,
    mappingPath: ['longitude1'],
    sortType: undefined,
    isDisplay: true,
    filters: [
      { type: 'any', startValue: '', isNot: false, isStrict: false },
    ],
  },
];

const queryResource = (
  baseTableName: 'Agent' | 'Locality',
  exportFields: readonly QueryField[]
) =>
  new tables.SpQuery.Resource(
    {
      id: 5,
      name: 'All results',
      contextname: baseTableName,
      contexttableid: tables[baseTableName].tableId,
      selectdistinct: false,
      fields: unParseQueryFields(baseTableName, exportFields),
    },
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
        getQueryFieldRecords={() =>
          unParseQueryFields(baseTableName, exportFields)
        }
        queryResource={queryResource(baseTableName, exportFields)}
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

  expect(ping).toHaveBeenCalledTimes(1);
  expect(jest.mocked(ping).mock.calls[0][0]).toBe('/stored_query/exportcsv/');
  const body = jest.mocked(ping).mock.calls[0][1]?.body as Record<
    string,
    unknown
  >;
  expect(body.selectedrows).toBeUndefined();
  expect(body.contextname).toBe('Agent');
  expect(body.contexttableid).toBe(tables.Agent.tableId);
  expect(body.selectdistinct).toBe(false);
  expect(body.fields).toHaveLength(1);
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

  expect(ping).toHaveBeenCalledTimes(1);
  expect(jest.mocked(ping).mock.calls[0][0]).toBe('/stored_query/exportkml/');
  const body = jest.mocked(ping).mock.calls[0][1]?.body as Record<
    string,
    unknown
  >;
  expect(body.selectedrows).toBeUndefined();
  expect(body.contextname).toBe('Locality');
  expect(body.contexttableid).toBe(tables.Locality.tableId);
  expect(body.selectdistinct).toBe(false);
  expect(body.fields).toHaveLength(2);
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

  expect(ping).toHaveBeenCalledTimes(1);
  expect(jest.mocked(ping).mock.calls[0][0]).toBe('/stored_query/exportkml/');
  const body = jest.mocked(ping).mock.calls[0][1]?.body as Record<
    string,
    unknown
  >;
  expect(body.selectedrows).toEqual([2]);
  expect(body.contextname).toBe('Locality');
  expect(body.contexttableid).toBe(tables.Locality.tableId);
});
