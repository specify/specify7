import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { queryText } from '../../../localization/query';
import * as pingModule from '../../../utils/ajax/ping';
import { keysToLowerCase } from '../../../utils/utils';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import {
  defaultDataViewQuery,
  makeDataViewQuery,
} from '../../DataViews/queries';
import { ResourceView } from '../../Forms/ResourceView';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { MakeRecordSetButton } from '../Components';
import { QueryExportButtons } from '../Export';
import { parseQueryFields } from '../helpers';
import type { QuerySelection } from '../selection';
import { allSelection, emptySelection } from '../selection';

requireContext();
function renderActions(element: React.ReactElement) {
  return render(element, {
    wrapper: ({ children }) => (
      <UnloadProtectsContext.Provider value={[]}>
        {children}
      </UnloadProtectsContext.Provider>
    ),
  });
}
jest.mock('../../Permissions/helpers', () => ({
  ...jest.requireActual('../../Permissions/helpers'),
  hasPermission: () => true,
}));
jest.mock('../../Forms/ResourceView', () => ({
  ResourceView: jest.fn(() => null),
}));

function props(selection: QuerySelection = allSelection()) {
  const queryResource = makeDataViewQuery(
    'Agent',
    defaultDataViewQuery('Agent')
  );
  queryResource.set('name', 'Executed query');
  const query = {
    ...serializeResource(queryResource),
    collectionId: 2,
    recordSetId: 4,
  };
  queryResource.set('name', 'Unsaved edits');
  return {
    baseTableName: 'Agent' as const,
    fields: parseQueryFields(query.fields),
    queryResource,
    getQueryFieldRecords: jest.fn(),
    recordSetId: 99,
    results: { current: [[1, 'Only loaded row']] },
    selectedRows: new Set([1]),
    selectedQuery: { query, selection },
  };
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test('selected CSV uses the backend and snapshot even when most selected rows are not loaded', async () => {
  const ping = jest.spyOn(pingModule, 'ping').mockResolvedValue(200);
  const properties = props();
  renderActions(<QueryExportButtons {...properties} />);
  fireEvent.click(screen.getByRole('button', { name: queryText.createCsv() }));
  await waitFor(() => expect(ping).toHaveBeenCalledTimes(1));
  expect(ping.mock.calls[0][0]).toBe('/stored_query/exportcsv/');
  expect(ping.mock.calls[0][1]?.body).toEqual(
    expect.objectContaining({
      name: 'Executed query',
      collectionid: 2,
      recordsetid: 4,
      selection: { mode: 'exclude', ids: [] },
      selectedrows: undefined,
    })
  );
  expect(properties.getQueryFieldRecords).not.toHaveBeenCalled();
});

test('CSV and record-set actions are disabled when selection is empty', () => {
  const properties = props(emptySelection());
  renderActions(
    <>
      <QueryExportButtons {...properties} />
      <MakeRecordSetButton {...properties} sourceRecordSetId={99} />
    </>
  );
  expect(
    screen.getByRole('button', { name: queryText.createCsv() })
  ).toBeDisabled();
  expect(
    screen.getByRole('button', {
      name: queryText.createRecordSet({
        recordSetTable: tables.RecordSet.label,
      }),
    })
  ).toBeDisabled();
});

test('record-set creation sends query plus exceptions, not browser-loaded IDs', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  const properties = props({ mode: 'exclude', ids: new Set([25]) });
  renderActions(<MakeRecordSetButton {...properties} sourceRecordSetId={99} />);
  fireEvent.click(
    screen.getByRole('button', {
      name: queryText.createRecordSet({
        recordSetTable: tables.RecordSet.label,
      }),
    })
  );
  await waitFor(() => expect(ResourceView).toHaveBeenCalled());
  const recordSet = jest.mocked(ResourceView).mock.calls[0][0]?.resource;
  if (recordSet === undefined)
    throw new Error('Record set dialog was not opened');
  expect(keysToLowerCase(recordSet.toJSON())).toEqual(
    expect.objectContaining({
      fromquery: expect.objectContaining({
        name: 'Executed query',
        collectionid: 2,
        recordsetid: 4,
        selection: { mode: 'exclude', ids: [25] },
      }),
    })
  );
  expect(properties.getQueryFieldRecords).not.toHaveBeenCalled();
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('Setting unknown field fromquery on RecordSet'),
    expect.any(String),
    expect.any(Object)
  );
});

test('web portal export retains whole-query scope regardless of selection', async () => {
  const ping = jest.spyOn(pingModule, 'ping').mockResolvedValue(200);
  renderActions(<QueryExportButtons {...props(emptySelection())} />);
  fireEvent.click(
    screen.getByRole('button', { name: queryText.exportToWebPortal() })
  );
  await waitFor(() => expect(ping).toHaveBeenCalledTimes(1));
  expect(ping.mock.calls[0][1]?.body).toEqual(
    expect.objectContaining({
      selection: undefined,
      selectedrows: undefined,
    })
  );
});
