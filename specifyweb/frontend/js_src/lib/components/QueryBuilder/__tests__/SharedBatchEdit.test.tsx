import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { batchEditText } from '../../../localization/batchEdit';
import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { LoadingContext } from '../../Core/Contexts';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { makeDataViewQuery } from '../../DataViews/queries';
import { userInformation } from '../../InitialContext/userInformation';
import * as permissions from '../../Permissions/helpers';
import {
  SetUnloadProtectsContext,
  UnloadProtectsContext,
} from '../../Router/UnloadProtect';
import { QueryFields } from '../Fields';
import { QueryFieldSpec } from '../fieldSpec';
import * as queryResults from '../QueryBuilderResults';
import { QueryBuilder } from '../Wrapped';

requireContext();

jest.mock('../../Molecules/AppTitle', () => ({
  ...jest.requireActual('../../Molecules/AppTitle'),
  useTitle: () => undefined,
}));
jest.mock('../../Header/MenuContext', () => ({
  ...jest.requireActual('../../Header/MenuContext'),
  useMenuItem: () => undefined,
}));
jest.mock('../../WbPlanView/MapperComponents', () => ({
  MappingView: () => null,
}));
jest.mock('../CheckReadAccess', () => ({ CheckReadAccess: () => null }));
jest.mock('../Fields', () => ({ QueryFields: jest.fn(() => null) }));
jest.mock('../../Merging', () => ({ RecordMergingLink: () => null }));

overrideAjax(
  '/stored_query/ephemeral/',
  { count: 1, results: [[1, 'Smith']] },
  {
    method: 'POST',
  }
);
overrideAjax('/api/workbench/dataset/?isupdate=1', []);
overrideAjax('/stored_query/batch_edit/', { id: 7 }, { method: 'POST' });

afterEach(() => {
  jest.restoreAllMocks();
});

test.each([
  ['shared', false],
  ['shared', true],
  ['personal', false],
] as const)(
  '%s query with autoRun=%s preserves the original save rules',
  async (ownership, autoRun) => {
    jest.spyOn(permissions, 'hasPermission').mockReturnValue(true);
    jest.spyOn(permissions, 'hasToolPermission').mockReturnValue(true);
    const results = jest.spyOn(queryResults, 'QueryBuilderResults');
    const ajax = jest.spyOn(ajaxModule, 'ajax');
    const save = jest.spyOn(tables.SpQuery.Resource.prototype, 'save');
    const field = QueryFieldSpec.fromPath('Agent', [
      'lastName',
    ]).toSpQueryField();
    field.set('operStart', 1);
    field.set('startValue', 'Smith');
    if (ownership === 'shared') field.set('sortType', 2);
    const newQuery = makeDataViewQuery('Agent', {
      fields: [serializeResource(field)],
      selectDistinct: false,
      searchSynonymy: false,
      smushed: false,
    });
    if (ownership === 'shared') newQuery.set('smushed', null);
    newQuery.set('id', 100);
    newQuery.set('name', 'Agents');
    newQuery.set(
      'specifyUser',
      ownership === 'shared'
        ? `/api/specify/specifyuser/${userInformation.id + 1}/`
        : userInformation.resource_uri
    );
    const query = new tables.SpQuery.Resource(serializeResource(newQuery));
    const original = serializeResource(query);

    render(
      <MemoryRouter initialEntries={['/']}>
        <LoadingContext.Provider
          value={(promise): void => {
            void promise;
          }}
        >
          <UnloadProtectsContext.Provider value={[]}>
            <SetUnloadProtectsContext.Provider value={jest.fn()}>
              <Routes>
                <Route
                  path="/"
                  element={
                    <QueryBuilder
                      autoRun={autoRun}
                      forceCollection={undefined}
                      query={query}
                    />
                  }
                />
                <Route
                  path="/specify/workbench/:id"
                  element={<p>Data set opened</p>}
                />
              </Routes>
            </SetUnloadProtectsContext.Provider>
          </UnloadProtectsContext.Provider>
        </LoadingContext.Provider>
      </MemoryRouter>
    );

    if (!autoRun)
      fireEvent.click(
        await screen.findByRole('button', { name: queryText.query() })
      );
    await screen.findByText('Smith');
    if (ownership === 'shared') {
      expect(
        jest.mocked(QueryFields).mock.calls.at(-1)![0].onChangeField
      ).toBeUndefined();
      expect(
        screen.queryByRole('button', { name: queryText.saveQuery() })
      ).toBeNull();
    }
    const column = screen.getByRole('columnheader', { name: /last name/i });
    await act(async () => {
      fireEvent.click(within(column).getByRole('button'));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    if (ownership === 'shared')
      await waitFor(() =>
        expect(
          screen.queryByText(commonText.descending())
        ).not.toBeInTheDocument()
      );
    else await screen.findByText(commonText.ascending());
    await waitFor(() =>
      expect(results.mock.calls.at(-1)?.[0].saveRequired).toBe(true)
    );
    if (ownership === 'personal')
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: queryText.saveQuery() })
        ).toBeEnabled()
      );
    fireEvent.click(
      screen.getByRole('button', { name: batchEditText.batchEdit() })
    );

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent(queryText.unsavedChangesInQuery());
    expect(
      ajax.mock.calls.some(([url]) => url === '/stored_query/batch_edit/')
    ).toBe(false);
    if (ownership === 'personal')
      expect(
        within(dialog).queryByRole('button', {
          name: queryText.discardTemporarySort(),
        })
      ).toBeNull();
    else {
      expect(dialog).toHaveTextContent(
        queryText.discardTemporarySortDescription()
      );
      fireEvent.click(
        within(dialog).getByRole('button', { name: commonText.close() })
      );
      expect(screen.queryByRole('dialog')).toBeNull();
      fireEvent.click(
        screen.getByRole('button', { name: batchEditText.batchEdit() })
      );
      await act(async () => {
        fireEvent.click(
          within(screen.getByRole('dialog')).getByRole('button', {
            name: queryText.discardTemporarySort(),
          })
        );
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      await screen.findByText(commonText.descending());
      await waitFor(() =>
        expect(results.mock.calls.at(-1)?.[0].saveRequired).toBe(false)
      );
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      expect(serializeResource(query)).toEqual(original);
      fireEvent.click(
        screen.getByRole('button', { name: batchEditText.batchEdit() })
      );
      expect(await screen.findByText('Data set opened')).toBeVisible();
      expect(ajax).toHaveBeenCalledWith(
        '/stored_query/batch_edit/',
        expect.objectContaining({
          body: expect.objectContaining({
            fields: [
              expect.objectContaining({ sorttype: 2, startvalue: 'Smith' }),
            ],
          }),
        })
      );
    }
    expect(save).not.toHaveBeenCalled();
    expect(serializeResource(query)).toEqual(original);
  }
);
