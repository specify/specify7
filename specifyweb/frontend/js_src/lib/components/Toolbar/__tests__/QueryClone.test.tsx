import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import type { SpQuery } from '../../DataModel/types';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { QueryList } from '../Query';

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
});

test.each(['success', 'failure'] as const)(
  'prevents duplicate shared-query clones and resets pending state on %s',
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

    render(
      <LoadingContext.Provider
        value={(promise): void => {
          void promise.catch(handleError);
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <table>
            <tbody>
              <QueryList canClone isReadOnly query={resource} />
            </tbody>
          </table>
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: queryText.cloneSharedQuery() })
      );
    });
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
    const continueButton = screen.getByRole('button', {
      name: interactionsText.continue(),
    });
    expect(continueButton).toBeDisabled();
    fireEvent.click(continueButton);
    expect(mockCloneSharedQuery).toHaveBeenCalledTimes(1);

    const error = new Error('Clone failed');
    await act(async () => {
      if (outcome === 'success') resolveClone(101);
      else rejectClone(error);
    });
    expect(screen.getByRole('link', { name: /useful query/i })).toBeVisible();
    if (outcome === 'success') {
      expect(
        screen.queryByText(queryText.confirmCloneSharedQuery({ queryName }))
      ).not.toBeInTheDocument();
      expect(handleError).not.toHaveBeenCalled();
    } else {
      expect(continueButton).toBeEnabled();
      expect(
        screen.getByText(queryText.confirmCloneSharedQuery({ queryName }))
      ).toBeVisible();
      expect(handleError).toHaveBeenCalledWith(error);
    }
  }
);
