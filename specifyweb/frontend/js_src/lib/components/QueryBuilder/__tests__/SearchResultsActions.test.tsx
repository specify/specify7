import { act, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { queryText } from '../../../localization/query';
import { mergingText } from '../../../localization/merging';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { tables } from '../../DataModel/tables';
import { defaultDataViewQuery } from '../../DataViews/queries';
import * as resourceModule from '../../DataModel/resource';
import { RecordSelectorFromIds } from '../../FormSliders/RecordSelectorFromIds';
import { RecordMergingLink } from '../../Merging';
import { ResourceView } from '../../Forms/ResourceView';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { CreateRecordSet } from '../CreateRecordSet';
import { parseQueryFields, queryFieldsToFieldSpecs } from '../helpers';
import { QueryResults } from '../Results';
import { QueryResultsTable } from '../ResultsTable';
import { QueryToForms } from '../ToForms';

requireContext();

jest.mock('../../FormSliders/RecordSelectorFromIds', () => ({
  RecordSelectorFromIds: jest.fn(() => <div data-testid="form-browser" />),
}));
jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: jest.fn(() => null),
}));
jest.mock('../ToMap', () => ({ QueryToMap: () => null }));
jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
  hasTablePermission: () => true,
  hasToolPermission: (tool: string) => tool === 'recordSets',
}));

afterEach(() => jest.restoreAllMocks());

test('Simple Search result selection creates a set in result order and excludes unselected IDs', async () => {
  const fields = parseQueryFields(defaultDataViewQuery('Agent').fields);
  const fieldSpecs = queryFieldsToFieldSpecs('Agent', fields).map(
    ([, spec]) => spec
  );
  const props = {
    table: tables.Agent,
    queryResource: undefined,
    fetchSize: 40,
    fetchResults: async () => [[17], [91], [5]],
    fetchCount: undefined,
    totalCount: 3,
    fieldSpecs,
    displayedFields: fields,
    allFields: fields,
    initialData: [[17], [91], [5]],
    onReRun: jest.fn(),
    createRecordSet: undefined,
    extraButtons: undefined,
  };
  const { user, rerender } = mount(
    <QueryResults {...props} selectedRows={[new Set([91, 17]), jest.fn()]} />,
    {
      wrapper: ({ children }) => (
        <MemoryRouter>
          <UnloadProtectsContext.Provider value={[]}>
            {children}
          </UnloadProtectsContext.Provider>
        </MemoryRouter>
      ),
    }
  );
  const name = queryText.createRecordSet({
    recordSetTable: tables.RecordSet.label,
  });
  const create = jest
    .spyOn(resourceModule, 'createResource')
    .mockResolvedValue({
      _tableName: 'RecordSet',
      id: 501,
      name: 'Selected results',
      dbTableId: tables.Agent.tableId,
    } as never);
  await user.click(await screen.findByRole('button', { name }));
  const formProps = jest.mocked(ResourceView).mock.calls.at(-1)![0];
  await act(async () => {
    formProps.onSaving?.(jest.fn());
  });
  expect(create).toHaveBeenCalledWith(
    'RecordSet',
    expect.objectContaining({
      recordSetItems: [{ recordId: 17 }, { recordId: 91 }],
    })
  );
  await user.click(screen.getByRole('button', { name: 'Close' }));
  rerender(<QueryResults {...props} selectedRows={[new Set(), jest.fn()]} />);
  expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
  rerender(
    <QueryResults
      {...props}
      totalCount={0}
      initialData={[]}
      selectedRows={[new Set(), jest.fn()]}
    />
  );
  expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
});

test('result links open the correct record in a separate tab without selecting a row', async () => {
  const onSelected = jest.fn();
  const onRowSelected = jest.fn();
  const { container, user } = mount(
    <QueryResultsTable
      table={tables.Agent}
      fieldSpecs={[]}
      results={[[17], [91]]}
      selectedRows={new Set()}
      showCellEllipsis={false}
      wrapQueryResults={false}
      onSelected={onSelected}
      onRowSelected={onRowSelected}
    />
  );
  const href = new tables.Agent.Resource({ id: 17 }).viewUrl();
  const link = await screen.findByRole('link', { name: href });
  expect(link).toHaveAttribute('href', href);
  expect(link).toHaveAttribute('target', '_blank');
  // jsdom cannot open a browser tab; assert the native link contract and click propagation.
  link.addEventListener('click', (event) => event.preventDefault());
  await user.click(link);
  expect(onSelected).not.toHaveBeenCalled();
  expect(onRowSelected).not.toHaveBeenCalled();
  expect(container.querySelectorAll('[role="row"]')).toHaveLength(2);
});

test.each([{ selection: [] }, { selection: [91] }])(
  'Browse in Forms passes results and selection $selection to the form browser',
  async ({ selection }) => {
    const { user } = mount(
      <QueryToForms
        table={tables.Agent}
        results={[[17], [91]]}
        selectedRows={new Set(selection)}
        totalCount={2}
        onFetchMore={undefined}
        onDelete={jest.fn()}
      />
    );
    await user.click(
      screen.getByRole('button', { name: queryText.browseInForms() })
    );
    expect(screen.getByTestId('form-browser')).toBeInTheDocument();
    expect(jest.mocked(RecordSelectorFromIds).mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        table: tables.Agent,
        ids: selection.length === 0 ? [17, 91] : [91],
        totalCount: selection.length === 0 ? 2 : 1,
        defaultIndex: 0,
        dialog: 'modal',
        isInRecordSet: false,
      })
    );
  }
);

test('Browse in Forms cannot open empty results', async () => {
  const { user } = mount(
    <QueryToForms
      table={tables.Agent}
      results={[]}
      selectedRows={new Set()}
      totalCount={0}
      onFetchMore={undefined}
      onDelete={jest.fn()}
    />
  );
  const button = screen.getByRole('button', {
    name: queryText.browseInForms(),
  });
  expect(button).toBeDisabled();
  await user.click(button);
  expect(screen.queryByTestId('form-browser')).not.toBeInTheDocument();
});

test('merge action targets only selected records and requires at least two', () => {
  const props = {
    table: tables.Agent,
    onMerged: jest.fn(),
    onDeleted: jest.fn(),
  };
  const { rerender } = mount(
    <RecordMergingLink {...props} selectedRows={new Set([91, 17, 91])} />,
    { wrapper: MemoryRouter }
  );
  const link = screen.getByRole('link', { name: mergingText.mergeRecords() });
  const url = new URL(link.getAttribute('href')!, 'http://localhost');
  expect(url.pathname).toBe('/specify/overlay/merge/Agent/');
  expect(url.searchParams.get('records')).toBe('91,17');
  rerender(<RecordMergingLink {...props} selectedRows={new Set([17])} />);
  expect(
    screen.queryByRole('link', { name: mergingText.mergeRecords() })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: mergingText.mergeRecords() })
  ).toBeDisabled();
});

test('Record Set save includes only unique result IDs with the correct table', async () => {
  const create = jest
    .spyOn(resourceModule, 'createResource')
    .mockResolvedValue({
      _tableName: 'RecordSet',
      id: 500,
      name: 'Search results',
      dbTableId: tables.Agent.tableId,
      resource_uri: '/api/specify/recordset/500/',
    } as never);
  const { user } = mount(
    <CreateRecordSet
      baseTableName="Agent"
      recordIds={[91, 17, 91]}
      defaultRecordSetName="Search results"
    />,
    {
      wrapper: ({ children }) => (
        <UnloadProtectsContext.Provider value={[]}>
          {children}
        </UnloadProtectsContext.Provider>
      ),
    }
  );
  await user.click(
    screen.getByRole('button', {
      name: queryText.createRecordSet({
        recordSetTable: tables.RecordSet.label,
      }),
    })
  );
  const props = jest.mocked(ResourceView).mock.calls.at(-1)![0];
  expect(props.resource?.get('name')).toBe('Search results');
  await act(async () => {
    props.onSaving?.(jest.fn());
  });
  await waitFor(() =>
    expect(create).toHaveBeenCalledWith(
      'RecordSet',
      expect.objectContaining({
        dbTableId: tables.Agent.tableId,
        recordSetItems: [{ recordId: 91 }, { recordId: 17 }],
      })
    )
  );
  expect(
    await screen.findByRole('link', { name: /Search results/u })
  ).toHaveAttribute('href', '/specify/record-set/500/');
});
