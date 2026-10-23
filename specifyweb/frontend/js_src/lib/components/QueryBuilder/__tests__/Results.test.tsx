import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import type { QueryField } from '../helpers';
import { queryFieldsToFieldSpecs } from '../helpers';
import { QueryResults } from '../Results';

requireContext();

jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
  hasTablePermission: () => true,
  hasToolPermission: () => false,
}));
jest.mock('../../Merging', () => ({ RecordMergingLink: () => null }));
jest.mock('../ToForms', () => ({ QueryToForms: () => null }));
jest.mock('../ToMap', () => ({ QueryToMap: () => null }));

function makeFields(names: readonly string[]): readonly QueryField[] {
  return names.map((name, id) => ({
    id,
    mappingPath: [name],
    sortType: undefined,
    isDisplay: true,
    filters: [{ type: 'any', startValue: '', isNot: false, isStrict: false }],
  }));
}

test.each([
  ['removing the first field', ['lastName'], ['New last']],
  ['removing the last field', ['firstName'], ['New first']],
  ['removing all displayed fields', [], []],
  ['reordering fields', ['lastName', 'firstName'], ['New last', 'New first']],
  [
    'adding a field',
    ['firstName', 'lastName', 'middleInitial'],
    ['New first', 'New last', 'M'],
  ],
])('renders matching rows and columns after %s', async (_, names, values) => {
  const fields = makeFields(['firstName', 'lastName']);
  const props = {
    table: tables.Agent,
    queryResource: undefined,
    fetchSize: 40,
    fetchResults: undefined,
    fetchCount: undefined,
    totalCount: 1,
    fieldSpecs: queryFieldsToFieldSpecs('Agent', fields).map(
      ([, fieldSpec]) => fieldSpec
    ),
    displayedFields: fields,
    allFields: fields,
    initialData: [[1, 'Old first', 'Old last']],
    selectedRows: [new Set<number>(), jest.fn()] as const,
    onReRun: jest.fn(),
    createRecordSet: undefined,
    extraButtons: undefined,
  };
  const { rerender } = render(<QueryResults {...props} />);
  await screen.findByText('Old first');
  expect(screen.getByText('Old last')).toBeInTheDocument();

  const newFields = makeFields(names);
  rerender(
    <QueryResults
      {...props}
      allFields={newFields}
      displayedFields={newFields}
      fieldSpecs={queryFieldsToFieldSpecs('Agent', newFields).map(
        ([, fieldSpec]) => fieldSpec
      )}
      initialData={names.length === 0 ? undefined : [[2, ...values]]}
    />
  );

  for (const value of values)
    expect(await screen.findByText(value)).toBeInTheDocument();
  expect(screen.queryByText('Old first')).not.toBeInTheDocument();
  expect(screen.queryByText('Old last')).not.toBeInTheDocument();
  expect(
    document.querySelectorAll('[data-query-results-cell-col]').length
  ).toBe(names.length);

  rerender(<QueryResults {...props} />);
  expect(await screen.findByText('Old first')).toBeInTheDocument();
  expect(screen.getByText('Old last')).toBeInTheDocument();
});

test.each([1, 3])(
  'preserves loaded pages and updates the count after deleting record %i',
  async (deletedId) => {
    const fields = makeFields(['lastName']);
    const fetchResults = jest.fn(async () => [
      [3, 'Third'],
      [4, 'Fourth'],
    ]);
    render(
      <QueryResults
        table={tables.Agent}
        queryResource={undefined}
        fetchSize={2}
        fetchResults={fetchResults}
        fetchCount={undefined}
        totalCount={4}
        fieldSpecs={queryFieldsToFieldSpecs('Agent', fields).map(
          ([, fieldSpec]) => fieldSpec
        )}
        displayedFields={fields}
        allFields={fields}
        initialData={[
          [1, 'First'],
          [2, 'Second'],
        ]}
        selectedRows={[new Set<number>(), jest.fn()]}
        onReRun={jest.fn()}
        createRecordSet={undefined}
        extraButtons={undefined}
        renderSplitPane={({ onDelete, onFetchMore }) => (
          <>
            <button onClick={() => onDelete(deletedId)}>Delete record</button>
            <button
              disabled={onFetchMore === undefined}
              onClick={() => void onFetchMore?.()}
            >
              Load more
            </button>
          </>
        )}
      />
    );

    await screen.findByText('Fourth');
    fireEvent.click(screen.getByRole('button', { name: 'Delete record' }));

    const names = ['First', 'Second', 'Third', 'Fourth'];
    await waitFor(() =>
      expect(screen.queryByText(names[deletedId - 1])).not.toBeInTheDocument()
    );
    for (const [index, name] of names.entries())
      if (index + 1 !== deletedId)
        expect(screen.getByText(name)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Results: (3)' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled();
    fireEvent.scroll(screen.getByRole('table'));
    expect(fetchResults).toHaveBeenCalledTimes(1);
  }
);
