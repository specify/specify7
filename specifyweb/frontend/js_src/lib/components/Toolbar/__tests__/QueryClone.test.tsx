import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import { overrideAjax } from '../../../tests/ajax';
import * as ajaxUtils from '../../../utils/ajax';
import { icons } from '../../Atoms/Icons';
import * as collection from '../../DataModel/collection';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import { userInformation } from '../../InitialContext/userInformation';
import type { SpQuery } from '../../DataModel/types';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import * as permissions from '../../Permissions/helpers';
import { QueryList, QueryListDialog } from '../Query';

jest.mock('../../QueryBuilder/Save', () => ({
  ...jest.requireActual('../../QueryBuilder/Save'),
  cloneSharedQuery: jest.fn(),
}));

import { cloneSharedQuery } from '../../QueryBuilder/Save';
import { interactionsText } from '../../../localization/interactions';

const mockCloneSharedQuery = jest.mocked(cloneSharedQuery);

requireContext();

let savedFavoriteIds: number[] = [];
beforeEach(() => {
  savedFavoriteIds = [];
});
overrideAjax('/stored_query/favorites/', () => ({
  queryIds: [...savedFavoriteIds],
}));
overrideAjax(
  '/stored_query/query/33/favorite/',
  () => {
    savedFavoriteIds = [...new Set([...savedFavoriteIds, 33])];
    return { queryId: 33 };
  },
  { method: 'POST' }
);
overrideAjax(
  '/stored_query/query/33/unfavorite/',
  () => {
    savedFavoriteIds = savedFavoriteIds.filter((id) => id !== 33);
    return { queryId: 33 };
  },
  { method: 'POST' }
);

overrideAjax('/stored_query/folders/', {
  folders: [
    { id: 7, name: 'Parent', parentId: null, section: 'personal' },
    { id: 9, name: 'Nested', parentId: 7, section: 'personal' },
    { id: 10, name: 'Grandchild', parentId: 9, section: 'personal' },
    { id: 11, name: 'Other parent', parentId: null, section: 'personal' },
    { id: 12, name: 'Other child', parentId: 11, section: 'personal' },
    { id: 20, name: 'Sharing parent', parentId: null, section: 'sharing' },
    { id: 21, name: 'Shared parent', parentId: null, section: 'shared' },
  ],
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test.each([false, true])(
  'shows folder, favorite and archive icons in order (read-only: %s)',
  (isReadOnly) => {
    const handleMove = jest.fn();
    const query = new tables.SpQuery.Resource<SpQuery>({
      id: 33,
      name: 'Organized query',
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: `/api/specify/specifyuser/${userInformation.id}/`,
    });
    render(
      <table>
        <tbody>
          <QueryList
            query={serializeResource(query)}
            isReadOnly={isReadOnly}
            cloneState={{ confirmClone: false, clonePending: false }}
            onCloneStateChange={jest.fn()}
            onMoveToFolder={handleMove}
          />
        </tbody>
      </table>
    );

    const cells = screen.getAllByRole('cell');
    const actions = cells[cells.length - 1];
    const folderIcon = within(actions).getByRole('button', {
      name: queryText.moveQueryToFolder({ queryName: query.get('name') }),
    });
    const favoriteIcon = within(actions).getByRole('button', {
      name: queryText.favoriteQuery({ queryName: query.get('name') }),
    });
    const archiveIcon = within(actions).getByRole('button', {
      name: queryText.archiveQuery({ queryName: query.get('name') }),
    });
    expect(folderIcon.nextElementSibling).toBe(favoriteIcon);
    expect(favoriteIcon.nextElementSibling).toBe(archiveIcon);
    expect(archiveIcon).toBe(actions.lastElementChild);
    expect(favoriteIcon.querySelector('svg')?.outerHTML).toBe(
      renderToStaticMarkup(icons.star)
    );
    expect(archiveIcon.querySelector('svg')?.outerHTML).toBe(
      renderToStaticMarkup(icons.archive)
    );
    expect(folderIcon.querySelector('svg')?.outerHTML).toBe(
      renderToStaticMarkup(icons.folder)
    );
    fireEvent.click(folderIcon);
    expect(handleMove).toHaveBeenCalledTimes(1);
    const edit = within(actions).queryByRole('button', {
      name: commonText.edit(),
    });
    if (isReadOnly) expect(edit).not.toBeInTheDocument();
    else {
      if (edit === null) throw new Error('Query edit button missing.');
      expect(edit).toBeVisible();
      expect(
        edit.compareDocumentPosition(folderIcon) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    }
  }
);

describe.each([
  ['personal', queryText.yourQueries(), 9, 'Nested'],
  ['sharing', queryText.queriesIShare(), 20, 'Sharing parent'],
  ['shared', queryText.sharedQueries(), 21, 'Shared parent'],
] as const)('moving queries in %s', (section, label, folderId, folderName) => {
  let moved = false;
  overrideAjax(
    '/stored_query/query/33/folder/',
    () => {
      moved = true;
      return { queryId: 33, folderId, section };
    },
    { method: 'POST', body: { folderId } }
  );

  test('moves out of the main list and persists in the selected folder', async () => {
    moved = false;
    const queryName = 'Query to organize';
    const query = serializeResource(
      new tables.SpQuery.Resource<SpQuery>({
        id: 33,
        name: queryName,
        contextName: 'CollectionObject',
        contextTableId: tables.CollectionObject.tableId,
        specifyUser: `/api/specify/specifyuser/${section === 'shared' ? 2 : userInformation.id}/`,
      })
    );
    const fetch = jest
      .spyOn(collection, 'fetchCollection')
      .mockImplementation(async (_table, _filters, advancedFilters) => {
        const visible =
          advancedFilters?.query_folder_section === section &&
          (advancedFilters?.query_folder_id === folderId
            ? moved
            : advancedFilters?.query_folder_id === undefined && !moved);
        return { records: visible ? [query] : [], totalCount: visible ? 1 : 0 };
      });
    const handleError = jest.fn();
    const view = (
      <LoadingContext.Provider
        value={(promise): void => {
          void promise.catch(handleError);
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QueryListDialog
            newQueryUrl="/specify/query/new/"
            onClose={jest.fn()}
          >
            {({ children }) => children}
          </QueryListDialog>
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    );
    const { unmount } = render(view);
    await screen.findByText('Parent');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: label }));
    });
    await screen.findByRole('link', { name: new RegExp(queryName) });
    fireEvent.click(
      screen.getByRole('button', {
        name: queryText.moveQueryToFolder({ queryName }),
      })
    );
    const move = screen.getByRole('button', { name: queryText.move() });
    expect(move).toBeDisabled();
    const select = screen.getByRole('combobox', { name: queryText.folders() });
    expect(
      within(select).getByRole('option', { name: new RegExp(folderName) })
    ).toBeInTheDocument();
    for (const otherName of [
      'Parent',
      'Sharing parent',
      'Shared parent',
    ].filter(
      (name) => name !== (section === 'personal' ? 'Parent' : folderName)
    )) {
      expect(
        within(select).queryByRole('option', { name: otherName })
      ).not.toBeInTheDocument();
    }
    fireEvent.change(select, { target: { value: String(folderId) } });
    fireEvent.click(move);
    await waitFor(() =>
      expect(
        screen.queryByRole('link', {
          name: new RegExp(queryName),
        })
      ).not.toBeInTheDocument()
    );
    expect(handleError).not.toHaveBeenCalled();

    const navigation = screen.getByRole('navigation', {
      name: queryText.queries(),
    });
    await act(async () => {
      fireEvent.click(
        within(navigation).getByRole('button', { name: folderName })
      );
    });
    expect(
      await screen.findByRole('link', { name: new RegExp(queryName) })
    ).toBeVisible();
    expect(fetch).toHaveBeenLastCalledWith(
      'SpQuery',
      expect.anything(),
      expect.objectContaining({
        query_folder_section: section,
        query_folder_id: folderId,
      }),
      expect.anything()
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: label }));
    });
    expect(
      screen.queryByRole('link', { name: new RegExp(queryName) })
    ).not.toBeInTheDocument();

    unmount();
    render(view);
    await screen.findByText('Parent');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: label }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: folderName }));
    });
    expect(
      await screen.findByRole('link', { name: new RegExp(queryName) })
    ).toBeVisible();
  });
});

test('a failed move keeps the query in its list and allows retrying', async () => {
  const queryName = 'Query with failed move';
  const query = serializeResource(
    new tables.SpQuery.Resource<SpQuery>({
      id: 34,
      name: queryName,
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: `/api/specify/specifyuser/${userInformation.id}/`,
    })
  );
  const fetch = jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [query], totalCount: 1 });
  const handleError = jest.fn();
  render(
    <LoadingContext.Provider
      value={(promise): void => {
        void promise.catch(handleError);
      }}
    >
      <UnloadProtectsContext.Provider value={[]}>
        <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
          {({ children }) => children}
        </QueryListDialog>
      </UnloadProtectsContext.Provider>
    </LoadingContext.Provider>
  );
  await screen.findByText('Parent');
  await screen.findByRole('link', { name: new RegExp(queryName) });
  fireEvent.click(
    screen.getByRole('button', {
      name: queryText.moveQueryToFolder({ queryName }),
    })
  );
  fireEvent.change(
    screen.getByRole('combobox', { name: queryText.folders() }),
    {
      target: { value: '9' },
    }
  );
  const error = new Error('Move failed');
  jest.spyOn(ajaxUtils, 'ajax').mockRejectedValueOnce(error);
  fireEvent.click(screen.getByRole('button', { name: queryText.move() }));
  await waitFor(() => expect(handleError).toHaveBeenCalledWith(error));
  expect(screen.getByRole('button', { name: queryText.move() })).toBeEnabled();
  expect(
    screen.getByRole('link', { name: new RegExp(queryName) })
  ).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('favorites include queries from folders and different types and persist after reopening', async () => {
  const owned = serializeResource(
    new tables.SpQuery.Resource<SpQuery>({
      id: 34,
      name: 'Owned favorite',
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: `/api/specify/specifyuser/${userInformation.id}/`,
    })
  );
  const shared = serializeResource(
    new tables.SpQuery.Resource<SpQuery>({
      id: 33,
      name: 'Shared favorite',
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: `/api/specify/specifyuser/${userInformation.id + 1}/`,
    })
  );
  savedFavoriteIds = [owned.id];
  const fetch = jest
    .spyOn(collection, 'fetchCollection')
    .mockImplementation(async (_table, _filters, advanced) => {
      const records =
        advanced?.query_favorites === 'true'
          ? [owned, shared].filter((query) =>
              savedFavoriteIds.includes(query.id)
            )
          : advanced?.query_folder_section === 'shared' &&
              advanced.query_folder_id === 21
            ? [shared]
            : [];
      return { records, totalCount: records.length };
    });
  const handleError = jest.fn();
  const view = (
    <LoadingContext.Provider
      value={(promise): void => {
        void promise.catch(handleError);
      }}
    >
      <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
        {({ children }) => children}
      </QueryListDialog>
    </LoadingContext.Provider>
  );
  const { unmount } = render(view);
  await screen.findByText('Parent');
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.sharedQueries() })
    );
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Shared parent' }));
  });
  const star = screen.getByRole('button', {
    name: queryText.favoriteQuery({ queryName: shared.name }),
  });
  await waitFor(() => expect(star).toBeEnabled());
  fireEvent.click(star);
  await waitFor(() => expect(star).toHaveAttribute('aria-pressed', 'true'));
  expect(star).toBeDisabled();
  expect(screen.getByRole('link', { name: /Shared favorite/ })).toBeVisible();
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.favorites() })
    );
  });
  expect(screen.getByRole('link', { name: /Owned favorite/ })).toBeVisible();
  expect(screen.getByRole('link', { name: /Shared favorite/ })).toBeVisible();
  expect(
    screen.getByRole('button', { name: queryText.favorites() })
  ).toHaveAttribute('aria-current', 'page');
  expect(fetch.mock.calls.at(-1)?.[2]).toEqual({
    query_favorites: 'true',
    query_archive: 'false',
  });
  expect(fetch.mock.calls.at(-1)?.[1]).not.toHaveProperty('specifyUser');

  unmount();
  render(view);
  await screen.findByText('Parent');
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.favorites() })
    );
  });
  expect(screen.getByRole('link', { name: /Owned favorite/ })).toBeVisible();
  expect(
    screen.getByRole('button', {
      name: queryText.removeFavoriteQuery({ queryName: shared.name }),
    })
  ).toHaveAttribute('aria-pressed', 'true');
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', {
        name: queryText.removeFavoriteQuery({ queryName: shared.name }),
      })
    );
  });
  expect(
    await screen.findByRole('link', { name: /Owned favorite/ })
  ).toBeVisible();
  expect(
    screen.queryByRole('link', { name: /Shared favorite/ })
  ).not.toBeInTheDocument();
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.sharedQueries() })
    );
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Shared parent' }));
  });
  expect(screen.getByRole('link', { name: /Shared favorite/ })).toBeVisible();
  expect(
    screen.getByRole('button', {
      name: queryText.favoriteQuery({ queryName: shared.name }),
    })
  ).toHaveAttribute('aria-pressed', 'false');
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.yourQueries() })
    );
  });
  expect(
    screen.getByRole('button', { name: queryText.favorites() })
  ).not.toHaveAttribute('aria-current');
  expect(
    screen.queryByRole('link', { name: /Owned favorite/ })
  ).not.toBeInTheDocument();
  expect(handleError).not.toHaveBeenCalled();
});

test.each([false, true])(
  'a failed favorite request preserves its status (removing: %s)',
  async (removing) => {
    const queryName = 'Favorite failure';
    const query = serializeResource(
      new tables.SpQuery.Resource<SpQuery>({
        id: 34,
        name: queryName,
        contextName: 'CollectionObject',
        contextTableId: tables.CollectionObject.tableId,
        specifyUser: `/api/specify/specifyuser/${userInformation.id}/`,
      })
    );
    jest
      .spyOn(collection, 'fetchCollection')
      .mockResolvedValue({ records: [query], totalCount: 1 });
    const handleError = jest.fn();
    if (removing) savedFavoriteIds = [query.id];
    render(
      <LoadingContext.Provider
        value={(promise): void => {
          void promise.catch(handleError);
        }}
      >
        <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
          {({ children }) => children}
        </QueryListDialog>
      </LoadingContext.Provider>
    );
    if (removing) {
      await screen.findByText('Parent');
      await act(async () => {
        fireEvent.click(
          screen.getByRole('button', { name: queryText.favorites() })
        );
      });
    }
    const star = await screen.findByRole('button', {
      name: removing
        ? queryText.removeFavoriteQuery({ queryName })
        : queryText.favoriteQuery({ queryName }),
    });
    await waitFor(() => expect(star).toBeEnabled());
    const error = new Error('Favorite failed');
    jest.spyOn(ajaxUtils, 'ajax').mockRejectedValueOnce(error);
    fireEvent.click(star);
    await waitFor(() => expect(handleError).toHaveBeenCalledWith(error));
    await waitFor(() => expect(star).toBeEnabled());
    expect(star).toHaveAttribute('aria-pressed', String(removing));
    expect(
      screen.getByRole('link', { name: /Favorite failure/ })
    ).toBeVisible();
  }
);

describe('archiving personal queries', () => {
  const section = 'personal';
  const label = queryText.yourQueries();
  const folderName = 'Parent';
  let archived = false;
  overrideAjax(
    '/stored_query/query/33/archive/',
    () => {
      archived = true;
      savedFavoriteIds = savedFavoriteIds.filter((id) => id !== 33);
      return { queryId: 33 };
    },
    { method: 'POST' }
  );
  overrideAjax(
    '/stored_query/query/33/restore/',
    () => {
      archived = false;
      return { queryId: 33 };
    },
    { method: 'POST' }
  );

  test('removes the query from normal lists and persists in Archive', async () => {
    archived = false;
    const queryName = 'Query to archive';
    const query = serializeResource(
      new tables.SpQuery.Resource<SpQuery>({
        id: 33,
        name: queryName,
        contextName: 'CollectionObject',
        contextTableId: tables.CollectionObject.tableId,
        specifyUser: `/api/specify/specifyuser/${userInformation.id}/`,
      })
    );
    savedFavoriteIds = [query.id];
    const fetch = jest
      .spyOn(collection, 'fetchCollection')
      .mockImplementation(async (_table, _filters, advanced) => {
        const visible =
          advanced?.query_archive === 'true'
            ? archived
            : !archived &&
              advanced?.query_folder_id === undefined &&
              (advanced?.query_folder_section === section ||
                advanced?.query_favorites === 'true');
        return { records: visible ? [query] : [], totalCount: visible ? 1 : 0 };
      });
    const handleError = jest.fn();
    const view = (
      <LoadingContext.Provider
        value={(promise): void => {
          void promise.catch(handleError);
        }}
      >
        <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
          {({ children }) => children}
        </QueryListDialog>
      </LoadingContext.Provider>
    );
    const { unmount } = render(view);
    await screen.findByText('Parent');
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: label }));
    });
    const box = screen.getByRole('button', {
      name: queryText.archiveQuery({ queryName }),
    });
    expect(box).toBeEnabled();
    fireEvent.click(box);
    await waitFor(() =>
      expect(
        screen.queryByRole('link', {
          name: new RegExp(queryName),
        })
      ).not.toBeInTheDocument()
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: folderName }));
    });
    expect(
      screen.queryByRole('link', { name: new RegExp(queryName) })
    ).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.favorites() })
      );
    });
    expect(
      screen.queryByRole('link', { name: new RegExp(queryName) })
    ).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.archive() })
      );
    });
    expect(
      screen.getByRole('link', { name: new RegExp(queryName) })
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: queryText.archive() })
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('button', {
        name: queryText.restoreQuery({ queryName }),
      })
    ).toBeEnabled();
    expect(
      screen
        .getByRole('button', {
          name: queryText.restoreQuery({ queryName }),
        })
        .querySelector('svg')?.outerHTML
    ).toBe(renderToStaticMarkup(icons.restore));
    const archivedStar = screen.getByRole('button', {
      name: queryText.favoriteQuery({ queryName }),
    });
    expect(archivedStar).toBeDisabled();
    expect(archivedStar).toHaveAttribute('aria-pressed', 'false');
    expect(fetch.mock.calls.at(-1)?.[2]).toEqual({ query_archive: 'true' });
    unmount();
    render(view);
    await screen.findByText('Parent');
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.archive() })
      );
    });
    expect(
      screen.getByRole('link', { name: new RegExp(queryName) })
    ).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: queryText.favoriteQuery({ queryName }),
      })
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', {
        name: queryText.restoreQuery({ queryName }),
      })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole('link', {
          name: new RegExp(queryName),
        })
      ).not.toBeInTheDocument()
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.yourQueries() })
      );
    });
    expect(
      screen.getByRole('link', { name: new RegExp(queryName) })
    ).toBeVisible();
    expect(fetch.mock.calls.at(-1)?.[2]).toEqual({
      query_archive: 'false',
      query_folder_section: 'personal',
      share_grants__isnull: 'true',
    });
    expect(handleError).not.toHaveBeenCalled();
  });
});

test('owned queries cannot be archived from Queries I Share', async () => {
  const queryName = 'Owned sharing query';
  const query = serializeResource(
    new tables.SpQuery.Resource<SpQuery>({
      id: 33,
      name: queryName,
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: `/api/specify/specifyuser/${userInformation.id}/`,
    })
  );
  jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [query], totalCount: 1 });
  render(
    <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
      {({ children }) => children}
    </QueryListDialog>
  );
  await screen.findByText('Parent');
  await act(async () => {
    fireEvent.click(
      screen.getByRole('button', { name: queryText.queriesIShare() })
    );
  });
  expect(
    screen.getByRole('button', {
      name: queryText.archiveQuery({ queryName }),
    })
  ).toBeDisabled();
});

test('shared queries cannot be archived, including from Favorites', async () => {
  const queryName = 'Someone else query';
  const query = serializeResource(
    new tables.SpQuery.Resource<SpQuery>({
      id: 33,
      name: queryName,
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: `/api/specify/specifyuser/${userInformation.id + 1}/`,
    })
  );
  savedFavoriteIds = [query.id];
  jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [query], totalCount: 1 });
  render(
    <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
      {({ children }) => children}
    </QueryListDialog>
  );
  await screen.findByText('Parent');
  for (const label of [queryText.sharedQueries(), queryText.favorites()]) {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: label }));
    });
    expect(
      screen.getByRole('button', {
        name: queryText.archiveQuery({ queryName }),
      })
    ).toBeDisabled();
  }
});

test('a failed archive reports the error and keeps the query in its list', async () => {
  const queryName = 'Archive failure';
  const query = serializeResource(
    new tables.SpQuery.Resource<SpQuery>({
      id: 34,
      name: queryName,
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: `/api/specify/specifyuser/${userInformation.id}/`,
    })
  );
  const fetch = jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [query], totalCount: 1 });
  const handleError = jest.fn();
  render(
    <LoadingContext.Provider
      value={(promise): void => {
        void promise.catch(handleError);
      }}
    >
      <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
        {({ children }) => children}
      </QueryListDialog>
    </LoadingContext.Provider>
  );
  const box = await screen.findByRole('button', {
    name: queryText.archiveQuery({ queryName }),
  });
  const error = new Error('Archive failed');
  jest.spyOn(ajaxUtils, 'ajax').mockRejectedValueOnce(error);
  fireEvent.click(box);
  await waitFor(() => expect(handleError).toHaveBeenCalledWith(error));
  await waitFor(() => expect(box).toBeEnabled());
  expect(
    screen.getByRole('link', { name: new RegExp(queryName) })
  ).toBeVisible();
  expect(fetch).toHaveBeenCalledTimes(1);
});

test('shows query sections as icon navigation on the left', async () => {
  jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [], totalCount: 0 });
  jest.spyOn(permissions, 'hasTablePermission').mockReturnValue(true);

  await act(async () => {
    render(
      <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
        {({ children }) => children}
      </QueryListDialog>
    );
    await Promise.resolve();
  });

  const navigation = screen.getByRole('navigation', {
    name: queryText.queries(),
  });
  const sectionButtons = within(navigation).getAllByRole('button');
  const typeButtons = sectionButtons.slice(0, 3);
  expect(typeButtons.map(({ textContent }) => textContent?.trim())).toEqual([
    queryText.yourQueries(),
    queryText.queriesIShare(),
    queryText.sharedQueries(),
  ]);
  const sectionIcons = typeButtons.map(
    (button) => button.querySelector('svg')?.outerHTML
  );
  expect(sectionIcons).toEqual([
    renderToStaticMarkup(icons.folder),
    renderToStaticMarkup(icons.documentSearch),
    renderToStaticMarkup(icons.globe),
  ]);
  expect(
    navigation.compareDocumentPosition(screen.getByRole('table')) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(typeButtons[0]).toHaveAttribute('aria-current', 'page');
  const folderSection = within(navigation).getByRole('region', {
    name: queryText.folders(),
  });
  expect(
    within(folderSection).getByRole('heading', {
      name: queryText.folders(),
    })
  ).toBeVisible();
  const [divider, footerDivider] = within(navigation).getAllByRole('separator');
  expect(
    divider.compareDocumentPosition(folderSection) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  const favoriteHeading = within(navigation).getByRole('heading', {
    name: queryText.favorites(),
  });
  const archiveHeading = within(navigation).getByRole('heading', {
    name: queryText.archive(),
  });
  expect(
    footerDivider.compareDocumentPosition(favoriteHeading) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    favoriteHeading.compareDocumentPosition(archiveHeading) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(archiveHeading.parentElement).toBe(navigation.lastElementChild);
  expect(favoriteHeading.querySelector('svg')?.outerHTML).toBe(
    renderToStaticMarkup(icons.star)
  );
  expect(archiveHeading.querySelector('svg')?.outerHTML).toBe(
    renderToStaticMarkup(icons.archive)
  );
  expect(await within(folderSection).findByText('Parent')).toBeVisible();
  expect(
    within(folderSection).getByRole('button', {
      name: queryText.addFolder(),
    })
  ).toBeEnabled();
});

describe('personal folder creation', () => {
  overrideAjax(
    '/stored_query/folders/',
    { id: 8, name: 'Child', parentId: 7, section: 'personal' },
    {
      method: 'POST',
      body: { name: 'Child', parentId: 7, section: 'personal' },
    }
  );

  test('creates a named nested folder and rejects an empty name', async () => {
    const handleError = jest.fn();
    jest
      .spyOn(collection, 'fetchCollection')
      .mockResolvedValue({ records: [], totalCount: 0 });
    jest.spyOn(permissions, 'hasTablePermission').mockReturnValue(true);

    render(
      <LoadingContext.Provider
        value={(promise): void => {
          void promise.catch(handleError);
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QueryListDialog
            newQueryUrl="/specify/query/new/"
            onClose={jest.fn()}
          >
            {({ children }) => children}
          </QueryListDialog>
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    );

    await screen.findByText('Parent');
    fireEvent.click(
      screen.getByRole('button', { name: queryText.addFolder() })
    );

    const nameInput = screen.getByRole('textbox', {
      name: queryText.folderName(),
    });
    const saveButton = screen.getByRole('button', { name: commonText.save() });
    expect(saveButton).toBeDisabled();

    fireEvent.change(nameInput, { target: { value: '   ' } });
    expect(saveButton).toBeDisabled();
    fireEvent.change(nameInput, { target: { value: ' Child ' } });
    fireEvent.change(
      screen.getByRole('combobox', { name: queryText.parentFolder() }),
      { target: { value: '7' } }
    );
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    const child = await screen.findByText('Child');
    const parentFolder = screen.getByText('Parent').closest('li');
    if (parentFolder === null)
      throw new Error('Parent folder list item missing.');
    expect(within(parentFolder).getByText('Child')).toBeVisible();
    expect(child).toBeVisible();
    expect(handleError).not.toHaveBeenCalled();
  });
});

describe.each([
  [queryText.queriesIShare(), 'Sharing parent', 'Sharing child', 20, 'sharing'],
  [queryText.sharedQueries(), 'Shared parent', 'Shared child', 21, 'shared'],
])(
  'keeps folders and parent options scoped to %s',
  (label, parent, child, parentId, section) => {
    overrideAjax(
      '/stored_query/folders/',
      { id: parentId + 2, name: child, parentId, section },
      { method: 'POST', body: { name: child, parentId, section } }
    );

    test('keeps its tree and parent options separate', async () => {
      const handleError = jest.fn();
      jest
        .spyOn(collection, 'fetchCollection')
        .mockResolvedValue({ records: [], totalCount: 0 });
      jest.spyOn(permissions, 'hasTablePermission').mockReturnValue(true);

      render(
        <LoadingContext.Provider
          value={(promise): void => {
            void promise.catch(handleError);
          }}
        >
          <UnloadProtectsContext.Provider value={[]}>
            <QueryListDialog
              newQueryUrl="/specify/query/new/"
              onClose={jest.fn()}
            >
              {({ children }) => children}
            </QueryListDialog>
          </UnloadProtectsContext.Provider>
        </LoadingContext.Provider>
      );

      await screen.findByText('Parent');
      expect(screen.queryByText(parent)).not.toBeInTheDocument();
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: label }));
      });
      expect(screen.getByText(parent)).toBeVisible();
      expect(screen.queryByText('Parent')).not.toBeInTheDocument();
      expect(screen.queryByText('Nested')).not.toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: queryText.addFolder() })
      );
      const parentSelect = screen.getByRole('combobox', {
        name: queryText.parentFolder(),
      });
      expect(
        within(parentSelect)
          .getAllByRole('option')
          .map((option) => option.textContent)
      ).toEqual([queryText.topLevelFolder(), parent]);
      fireEvent.change(
        screen.getByRole('textbox', {
          name: queryText.folderName(),
        }),
        { target: { value: child } }
      );
      fireEvent.change(parentSelect, { target: { value: parentId } });
      fireEvent.click(screen.getByRole('button', { name: commonText.save() }));
      await screen.findByText(child);

      for (const otherLabel of [
        queryText.yourQueries(),
        queryText.queriesIShare(),
        queryText.sharedQueries(),
      ].filter((otherLabel) => otherLabel !== label)) {
        await act(async () => {
          fireEvent.click(screen.getByRole('button', { name: otherLabel }));
        });
        expect(screen.queryByText(child)).not.toBeInTheDocument();
      }
      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: label }));
      });
      expect(screen.getByText(child)).toBeVisible();
      expect(handleError).not.toHaveBeenCalled();
    });
  }
);

test('collapses folders independently and preserves nested collapse state', async () => {
  jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [], totalCount: 0 });

  render(
    <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
      {({ children }) => children}
    </QueryListDialog>
  );

  const parent = (await screen.findByText('Parent')).closest('li');
  const nested = screen.getByText('Nested').closest('li');
  if (parent === null || nested === null)
    throw new Error('Folder list item missing.');
  const nestedToggle = within(nested).getByRole('button', {
    name: commonText.collapse(),
  });
  fireEvent.click(nestedToggle);
  expect(nestedToggle).toHaveAttribute('aria-expanded', 'false');
  expect(nestedToggle.querySelector('svg')?.outerHTML).toBe(
    renderToStaticMarkup(icons.chevronRight)
  );
  expect(screen.getByText('Grandchild')).not.toBeVisible();

  const parentToggle = within(parent).getByRole('button', {
    name: commonText.collapse(),
  });
  fireEvent.click(parentToggle);
  expect(screen.getByText('Nested')).not.toBeVisible();
  expect(screen.getByText('Other child')).toBeVisible();
  expect(screen.getByText('Parent')).toBeVisible();
  fireEvent.click(parentToggle);
  expect(parentToggle).toHaveAttribute('aria-expanded', 'true');
  expect(parentToggle.querySelector('svg')?.outerHTML).toBe(
    renderToStaticMarkup(icons.chevronDown)
  );
  expect(screen.getByText('Nested')).toBeVisible();
  expect(screen.getByText('Grandchild')).not.toBeVisible();

  fireEvent.click(nestedToggle);
  expect(screen.getByText('Grandchild')).toBeVisible();
});

test('focus refresh ignores an older in-flight shared query result', async () => {
  const fetch = jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValueOnce({ records: [], totalCount: 0 });
  let resolveOld!: (value: { records: []; totalCount: number }) => void;
  let resolveRefresh!: (value: { records: []; totalCount: number }) => void;
  let resolveLatest!: (value: { records: []; totalCount: number }) => void;
  fetch
    .mockReturnValueOnce(new Promise((resolve) => (resolveOld = resolve)))
    .mockReturnValueOnce(new Promise((resolve) => (resolveRefresh = resolve)))
    .mockReturnValueOnce(new Promise((resolve) => (resolveLatest = resolve)));

  render(
    <QueryListDialog newQueryUrl="/specify/query/new/" onClose={jest.fn()}>
      {({ children, records, totalCount }) => (
        <>
          {children}
          <div aria-label="Query count" role="status">
            {records === undefined ? 'loading' : totalCount}
          </div>
        </>
      )}
    </QueryListDialog>
  );
  await waitFor(() =>
    expect(
      screen.getByRole('status', { name: 'Query count' })
    ).toHaveTextContent('0')
  );

  fireEvent.click(
    screen.getByRole('button', { name: queryText.sharedQueries() })
  );
  expect(fetch).toHaveBeenCalledTimes(2);
  fireEvent(window, new Event('focus'));
  expect(fetch).toHaveBeenCalledTimes(3);
  expect(fetch.mock.calls[2][3]).toEqual({ waitForPendingGet: true });
  fireEvent(window, new Event('focus'));
  expect(fetch).toHaveBeenCalledTimes(4);

  await act(async () => resolveLatest({ records: [], totalCount: 2 }));
  expect(screen.getByRole('status', { name: 'Query count' })).toHaveTextContent(
    '2'
  );
  await act(async () => resolveRefresh({ records: [], totalCount: 3 }));
  await act(async () => resolveOld({ records: [], totalCount: 1 }));
  expect(screen.getByRole('status', { name: 'Query count' })).toHaveTextContent(
    '2'
  );
});

test.each(['success', 'failure'] as const)(
  'preserves shared-query clone state across refreshes and resets it on %s',
  async (outcome) => {
    const queryName = 'Useful query';
    const query = new tables.SpQuery.Resource<SpQuery>({
      id: 33,
      name: queryName,
      contextName: 'CollectionObject',
      contextTableId: tables.CollectionObject.tableId,
      specifyUser: '/api/specify/specifyuser/2/',
    });
    const resource = serializeResource(query);
    const handleError = jest.fn();
    const response = { records: [resource], totalCount: 1 };
    const fetch = jest
      .spyOn(collection, 'fetchCollection')
      .mockResolvedValue(response);
    jest.spyOn(permissions, 'hasToolPermission').mockReturnValue(true);

    async function startRefresh(
      expectCloneDialog = false
    ): Promise<() => void> {
      let finishRefresh!: () => void;
      fetch.mockReturnValueOnce(
        new Promise((resolve) => {
          finishRefresh = (): void => resolve(response);
        })
      );
      await act(async () => {
        fireEvent(window, new Event('focus'));
      });
      expect(screen.getByRole('link', { name: /useful query/i })).toBeVisible();
      if (expectCloneDialog)
        expect(
          screen.getByText(queryText.confirmCloneSharedQuery({ queryName }))
        ).toBeVisible();
      return finishRefresh;
    }

    render(
      <LoadingContext.Provider
        value={(promise): void => {
          void promise.catch(handleError);
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QueryListDialog
            newQueryUrl="/specify/query/new/"
            onClose={jest.fn()}
          >
            {({ children }) => children}
          </QueryListDialog>
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.sharedQueries() })
      );
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.cloneSharedQuery() })
      );
    });
    expect(
      screen.getByText(queryText.confirmCloneSharedQuery({ queryName }))
    ).toBeVisible();
    const finishConfirmationRefresh = await startRefresh(true);
    await act(async () => finishConfirmationRefresh());
    expect(
      screen.getByText(queryText.confirmCloneSharedQuery({ queryName }))
    ).toBeVisible();
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: commonText.cancel() })
      );
    });
    expect(
      screen.queryByText(queryText.confirmCloneSharedQuery({ queryName }))
    ).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /useful query/i })).toBeVisible();
    expect(mockCloneSharedQuery).not.toHaveBeenCalled();

    let resolveClone!: (id: number) => void;
    let rejectClone!: (error: Error) => void;
    mockCloneSharedQuery.mockReturnValue(
      new Promise<number>((resolve, reject) => {
        resolveClone = resolve;
        rejectClone = reject;
      })
    );
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.cloneSharedQuery() })
      );
    });
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: interactionsText.continue(),
        })
      );
    });
    await waitFor(() => expect(mockCloneSharedQuery).toHaveBeenCalledTimes(1));
    expect(mockCloneSharedQuery).toHaveBeenCalledWith(
      expect.objectContaining({ id: query.id })
    );
    const finishPendingRefresh = await startRefresh(true);
    await act(async () => finishPendingRefresh());
    const continueButton = screen.getByRole('button', {
      name: interactionsText.continue(),
    });
    expect(continueButton).toBeDisabled();
    fireEvent.click(continueButton);
    expect(mockCloneSharedQuery).toHaveBeenCalledTimes(1);

    const finishCompletionRefresh = await startRefresh(true);
    const error = new Error('Clone failed');
    await act(async () => {
      if (outcome === 'success') resolveClone(101);
      else rejectClone(error);
    });
    await act(async () => finishCompletionRefresh());
    expect(screen.getByRole('link', { name: /useful query/i })).toBeVisible();
    if (outcome === 'success') {
      expect(
        screen.queryByText(queryText.confirmCloneSharedQuery({ queryName }))
      ).not.toBeInTheDocument();
      expect(handleError).not.toHaveBeenCalled();
    } else {
      expect(
        screen.getByRole('button', { name: interactionsText.continue() })
      ).toBeEnabled();
      expect(
        screen.getByText(queryText.confirmCloneSharedQuery({ queryName }))
      ).toBeVisible();
      expect(handleError).toHaveBeenCalledWith(error);
    }
  }
);
