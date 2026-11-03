import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React, { useState as mockUseState } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { queryText } from '../../../localization/query';
import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import * as collection from '../../DataModel/collection';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { getField } from '../../DataModel/helpers';
import type { SpQuery } from '../../DataModel/types';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import { makeDataViewQuery } from '../../DataViews/queries';
import * as permissions from '../../Permissions/helpers';
import { userInformation } from '../../InitialContext/userInformation';
import { QueryListDialog } from '../../Toolbar/Query';
import { SaveQueryButtons } from '../Components';
import { QueryEditButton } from '../Edit';
import { LoadingContext, ReadOnlyContext } from '../../Core/Contexts';
import { QueryBuilder } from '../Wrapped';
import { QueryFieldSpec } from '../fieldSpec';
import { QueryToolbar } from '../Toolbar';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';

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
jest.mock('../Fields', () => ({ QueryFields: () => null }));
jest.mock('../QueryBuilderResults', () => ({
  QueryBuilderResults: () => null,
}));

jest.mock('../../Molecules/Paginator', () => ({
  usePaginator: () => {
    const currentPage = mockUseState(0);
    return {
      currentPage,
      limit: 10,
      offset: currentPage[0] * 10,
      paginator: () => null,
    };
  },
}));

afterEach(() => jest.restoreAllMocks());

test('switches between personal, incoming shared, and outgoing shared query filters', async () => {
  const fetch = jest.spyOn(collection, 'fetchCollection').mockResolvedValue({
    records: [],
    totalCount: 0,
  });
  render(
    <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
      {({ children }) => children}
    </QueryListDialog>
  );
  await waitFor(() =>
    expect(fetch).toHaveBeenLastCalledWith(
      'SpQuery',
      expect.objectContaining({ specifyUser: userInformation.id }),
      expect.objectContaining({ share_grants__isnull: 'true' })
    )
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.sharedQueries() })
    );
  });
  expect(fetch).toHaveBeenLastCalledWith(
    'SpQuery',
    expect.not.objectContaining({ specifyUser: userInformation.id }),
    expect.objectContaining({ share_grants__recipient: userInformation.id })
  );
  if (userInformation.isadmin) {
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.queriesIShare() })
      );
    });
    expect(fetch).toHaveBeenLastCalledWith(
      'SpQuery',
      expect.objectContaining({ specifyUser: userInformation.id }),
      expect.objectContaining({ share_grants__isnull: 'false' })
    );
  }
});

test('shared originals have no edit button and retain only Save As in read-only mode', () => {
  const query = new tables.SpQuery.Resource<SpQuery>({
    id: 100,
    specifyUser: `/api/specify/specifyuser/${userInformation.id + 1}/`,
  });
  render(
    <MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <ReadOnlyContext.Provider value>
          <QueryEditButton query={serializeResource(query)} />
          <SaveQueryButtons
            canCloneShared
            fields={[]}
            getQueryFieldRecords={undefined}
            isValid={() => true}
            queryResource={query}
            saveRequired
            unsetUnloadProtect={jest.fn()}
            onSaved={jest.fn()}
            onTriedToSave={() => true}
          />
        </ReadOnlyContext.Provider>
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );
  expect(
    screen.queryByRole('button', { name: queryText.saveQuery() })
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(
    screen.getByRole('button', { name: queryText.saveAs() })
  ).toBeVisible();
});

test('read-only definitions still allow query execution but cannot change distinct', async () => {
  const toggle = jest.fn();
  const run = jest.fn();
  render(
    <ReadOnlyContext.Provider value>
      <QueryToolbar
        isDistinct={false}
        isEmbedded={false}
        isSeries={false}
        searchSynonymy={false}
        showHiddenFields={false}
        showSeries={false}
        tableName="CollectionObject"
        onScheduleCountOnlyRun={jest.fn()}
        onScheduleRun={run}
        onSubmitClick={run}
        onToggleDistinct={toggle}
        onToggleHidden={jest.fn()}
        onToggleSearchSynonymy={jest.fn()}
        onToggleSeries={jest.fn()}
      />
    </ReadOnlyContext.Provider>
  );
  await act(async () => {
    fireEvent.click(
      screen.getByRole('checkbox', { name: queryText.distinct() })
    );
    fireEvent.click(screen.getByRole('button', { name: queryText.query() }));
  });
  expect(toggle).not.toHaveBeenCalled();
  expect(run).toHaveBeenCalledTimes(1);
});

test('shared QueryBuilder enables Save As through the Header gate and saves a personal copy', async () => {
  jest
    .spyOn(permissions, 'hasToolPermission')
    .mockImplementation(
      (tool, action) => tool === 'queryBuilder' && action === 'create'
    );
  jest.spyOn(permissions, 'hasPermission').mockReturnValue(true);
  const field = QueryFieldSpec.fromPath('Agent', ['lastName']).toSpQueryField();
  field.set('operStart', 1);
  field.set('startValue', 'Smith');
  const query = makeDataViewQuery('Agent', {
    fields: [serializeResource(field)],
    selectDistinct: false,
    searchSynonymy: false,
    smushed: false,
  });
  query.set('id', 100);
  query.set('name', 'Shared agents');
  query.set(
    'specifyUser',
    `/api/specify/specifyuser/${userInformation.id + 1}/`
  );
  const originalOwner = query.get('specifyUser');
  let saved: SpecifyResource<SpQuery> | undefined;
  const save = jest
    .spyOn(tables.SpQuery.Resource.prototype, 'save')
    .mockImplementation(async function (this: SpecifyResource<SpQuery>) {
      saved = this;
      this.set('id', 101);
      return this;
    });

  render(
    <MemoryRouter>
      <LoadingContext.Provider
        value={(promise): void => {
          void promise;
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QueryBuilder forceCollection={undefined} query={query} />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );

  const saveAs = await screen.findByRole('button', {
    name: queryText.saveAs(),
  });
  expect(saveAs).toBeEnabled();
  expect(screen.getByText(queryText.sharedQueryReadOnly())).toBeVisible();
  expect(
    screen.queryByRole('button', { name: queryText.saveQuery() })
  ).not.toBeInTheDocument();
  await act(async () => {
    fireEvent.click(saveAs);
  });
  const nameInput = await screen.findByRole('textbox', {
    name: getField(tables.SpQuery, 'name').label,
  });
  await act(async () => {
    fireEvent.change(nameInput, { target: { value: 'My agents' } });
    fireEvent.click(screen.getByRole('button', { name: commonText.save() }));
  });

  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  expect(saved).toBeDefined();
  if (saved === undefined) throw new Error('Personal copy was not saved');
  expect(saved).not.toBe(query);
  expect(saved.get('name')).toBe('My agents');
  expect(saved.get('specifyUser')).toBe(userInformation.resource_uri);
  expect(serializeResource(saved).fields).toEqual(
    expect.arrayContaining([expect.objectContaining({ startValue: 'Smith' })])
  );
  expect(query.id).toBe(100);
  expect(query.get('specifyUser')).toBe(originalOwner);
});
