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
import { icons } from '../../Atoms/Icons';
import * as collection from '../../DataModel/collection';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import type { SpQuery } from '../../DataModel/types';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import * as permissions from '../../Permissions/helpers';
import { QueryListDialog } from '../Query';

jest.mock('../../QueryBuilder/Save', () => ({
  ...jest.requireActual('../../QueryBuilder/Save'),
  cloneSharedQuery: jest.fn(),
}));

import { cloneSharedQuery } from '../../QueryBuilder/Save';
import { interactionsText } from '../../../localization/interactions';

const mockCloneSharedQuery = jest.mocked(cloneSharedQuery);

requireContext();

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
  const divider = within(navigation).getByRole('separator');
  expect(
    divider.compareDocumentPosition(folderSection) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
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
