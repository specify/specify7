import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { interactionsText } from '../../../localization/interactions';
import { tables } from '../../DataModel/tables';
import { serializeResource } from '../../DataModel/serializers';
import {
  defaultDataViewQuery,
  makeDataViewQuery,
} from '../../DataViews/queries';
import { parseQueryFields, queryFieldsToFieldSpecs } from '../helpers';
import { QueryResults } from '../Results';
import type { QuerySelection } from '../selection';
import { emptySelection } from '../selection';

requireContext();

jest.mock('../../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({ isFetching: false, handleScroll: jest.fn() }),
}));
jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasTablePermission: () => true,
  hasToolPermission: () => false,
}));
jest.mock('../../Merging', () => ({ RecordMergingLink: () => null }));
jest.mock('../SelectedQueryForms', () => ({
  SelectedQueryForms: ({
    onDelete,
  }: {
    readonly onDelete: (id: number) => void;
  }) => <button onClick={() => onDelete(99)}>Delete unloaded record</button>,
}));
jest.mock('../ToMap', () => ({ QueryToMap: () => null }));
jest.mock('../ResultsTable', () => ({
  QueryResultsTable: ({
    results,
    isRecordSelected,
    onSelected,
  }: Parameters<typeof import('../ResultsTable').QueryResultsTable>[0]) => (
    <>
      {results.map((row, index) => (
        <input
          key={index}
          type="checkbox"
          aria-label={`Record ${row[0]}`}
          checked={isRecordSelected?.(row[0] as number) ?? false}
          onChange={(event) => onSelected(index, event.target.checked, false)}
        />
      ))}
    </>
  ),
}));

const initialRows = [[1], [2]];

function Results({
  grouped = false,
  loading = false,
  rows = initialRows,
  fetchCount,
}: {
  readonly grouped?: boolean;
  readonly loading?: boolean;
  readonly rows?: readonly (readonly number[])[];
  readonly fetchCount?: () => Promise<number>;
}) {
  const definition = defaultDataViewQuery('Agent');
  const fields = parseQueryFields(definition.fields);
  const fieldSpecs = React.useMemo(
    () =>
      queryFieldsToFieldSpecs('Agent', fields).map(
        ([, fieldSpec]) => fieldSpec
      ),
    []
  );
  const executedQuery = React.useMemo(
    () => ({
      ...serializeResource(makeDataViewQuery('Agent', definition)),
      selectDistinct: grouped,
    }),
    [grouped]
  );
  const [selection, setSelection] =
    React.useState<QuerySelection>(emptySelection);
  return (
    <QueryResults
      table={tables.Agent}
      queryResource={undefined}
      fetchSize={40}
      fetchResults={async () => initialRows}
      fetchCount={fetchCount}
      totalCount={1_000_000}
      fieldSpecs={fieldSpecs}
      displayedFields={fields}
      allFields={fields}
      initialData={rows}
      selectedRows={[new Set(), jest.fn()]}
      selection={[selection, setSelection]}
      executedQuery={executedQuery}
      showSelectionControls
      isLoading={loading}
      onReRun={jest.fn()}
      createRecordSet={undefined}
      extraButtons={undefined}
    />
  );
}

afterEach(() => jest.restoreAllMocks());

test('selects loaded and subsequently loaded records without fetching membership', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  const { rerender } = render(<Results />);
  await waitFor(() =>
    expect(screen.getByRole('checkbox', { name: 'Record 1' })).not.toBeChecked()
  );
  fireEvent.click(
    screen.getByRole('button', { name: interactionsText.selectAll() })
  );
  expect(screen.getByRole('checkbox', { name: 'Record 1' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Record 2' })).toBeChecked();
  rerender(<Results rows={[[1], [2], [3]]} />);
  expect(screen.getByRole('checkbox', { name: 'Record 3' })).toBeChecked();
  expect(
    screen.getByRole('heading', { name: /1000000 of 1000000/ })
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole('button', { name: interactionsText.deselectAll() })
  );
  expect(screen.getByRole('checkbox', { name: 'Record 1' })).not.toBeChecked();
  expect(
    screen.getByRole('heading', { name: /0 of 1000000/ })
  ).toBeInTheDocument();
  expect(
    ajax.mock.calls.filter(([url]) => url === '/stored_query/ephemeral/')
  ).toHaveLength(0);
});

test('deselect all stays empty instead of restoring implicit all-results selection', async () => {
  render(<Results />);
  await screen.findByRole('checkbox', { name: 'Record 1' });
  fireEvent.click(
    screen.getByRole('button', { name: interactionsText.selectAll() })
  );
  fireEvent.click(
    screen.getByRole('button', { name: interactionsText.deselectAll() })
  );
  expect(screen.getByRole('checkbox', { name: 'Record 1' })).not.toBeChecked();
  expect(
    screen.getByRole('button', { name: interactionsText.deselectAll() })
  ).toBeDisabled();
  expect(
    screen.getByRole('heading', { name: /0 of 1000000/ })
  ).toBeInTheDocument();
});

test('refreshes the count after deleting a selected record outside the loaded table pages', async () => {
  const fetchCount = jest.fn().mockResolvedValue(999_999);
  render(<Results fetchCount={fetchCount} />);
  await screen.findByRole('checkbox', { name: 'Record 1' });
  fireEvent.click(
    screen.getByRole('button', { name: interactionsText.selectAll() })
  );
  fireEvent.click(
    screen.getByRole('button', { name: 'Delete unloaded record' })
  );
  await waitFor(() =>
    expect(
      screen.getByRole('heading', { name: /999999 of 999999/ })
    ).toBeInTheDocument()
  );
  expect(fetchCount).toHaveBeenCalledTimes(1);
});

test.each([{ grouped: true }, { loading: true }])(
  'keeps bulk controls visible but disabled for unsupported or loading results: %j',
  async (props) => {
    render(<Results {...props} />);
    await screen.findByRole('checkbox', { name: 'Record 1' });
    expect(
      screen.getByRole('button', { name: interactionsText.selectAll() })
    ).toBeDisabled();
  }
);
