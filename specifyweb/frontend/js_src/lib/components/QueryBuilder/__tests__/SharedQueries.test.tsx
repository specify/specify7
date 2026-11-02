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
import { requireContext } from '../../../tests/helpers';
import * as collection from '../../DataModel/collection';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import type { SpQuery } from '../../DataModel/types';
import { userInformation } from '../../InitialContext/userInformation';
import { QueryListDialog } from '../../Toolbar/Query';
import { SaveQueryButtons } from '../Components';
import { QueryEditButton } from '../Edit';
import { ReadOnlyContext } from '../../Core/Contexts';
import { QueryToolbar } from '../Toolbar';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';

requireContext();

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
