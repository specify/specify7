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

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test('shows query sections as icon navigation on the left', async () => {
  jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [], totalCount: 0 });

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
  expect(
    within(folderSection).getByRole('button', {
      name: queryText.addFolder(),
    })
  ).toBeDisabled();
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
