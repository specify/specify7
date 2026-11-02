import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { interactionsText } from '../../../localization/interactions';
import { queryText } from '../../../localization/query';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { LoadingContext } from '../../Core/Contexts';
import * as collection from '../../DataModel/collection';
import { serializeResource } from '../../DataModel/serializers';
import { tables } from '../../DataModel/tables';
import type { SpecifyUser } from '../../DataModel/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { QuerySharingActions } from '../Share';

requireContext();
overrideAjax('/stored_query/query/10/shares/', { recipientIds: [2] });
overrideAjax(
  '/stored_query/query/10/shares/',
  { recipientIds: [1, 2, 3] },
  { method: 'PUT', body: { recipientIds: [1, 2, 3] } }
);
overrideAjax('/stored_query/query/10/shares/', '', {
  method: 'DELETE',
  responseCode: 204,
});

beforeEach(() => {
  jest.spyOn(collection, 'fetchCollection').mockResolvedValue({
    records: ['Alice', 'Bob', 'Carol'].map((name, index) =>
      serializeResource(
        new tables.SpecifyUser.Resource<SpecifyUser>({ id: index + 1, name })
      )
    ),
    totalCount: 3,
  });
});

afterEach(() => jest.restoreAllMocks());

async function renderActions(): Promise<void> {
  await act(async () => {
    render(
      <LoadingContext.Provider
        value={(promise): void => {
          void promise;
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QuerySharingActions queryId={10} />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    );
  });
}

const user = {
  click: async (element: HTMLElement): Promise<void> => {
    await act(async () => {
      fireEvent.click(element);
    });
  },
};

test('preselects recipients and preserves selection when returning from confirmation', async () => {
  await renderActions();
  const share = screen.getByRole('button', { name: queryText.shareQuery() });
  await waitFor(() => expect(share).toBeEnabled());
  await user.click(share);
  expect(await screen.findByRole('checkbox', { name: 'Bob' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Alice' })).not.toBeChecked();
  await user.click(screen.getByRole('checkbox', { name: 'Alice' }));
  await user.click(screen.getByRole('button', { name: commonText.save() }));
  expect(
    screen.getByText(queryText.confirmQuerySharingDescription())
  ).toBeVisible();
  await user.click(screen.getByRole('button', { name: commonText.cancel() }));
  expect(screen.getByRole('checkbox', { name: 'Alice' })).toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Bob' })).toBeChecked();
});

test('supports range selection, select all, deselect all, and confirmed saving', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  await renderActions();
  const share = screen.getByRole('button', { name: queryText.shareQuery() });
  await waitFor(() => expect(share).toBeEnabled());
  await user.click(share);
  await screen.findByRole('checkbox', { name: 'Alice' });
  await user.click(
    screen.getByRole('button', { name: interactionsText.deselectAll() })
  );
  fireEvent.click(screen.getByRole('checkbox', { name: 'Alice' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Carol' }), {
    shiftKey: true,
  });
  expect(screen.getByRole('checkbox', { name: 'Bob' })).toBeChecked();
  await user.click(
    screen.getByRole('button', { name: interactionsText.deselectAll() })
  );
  expect(screen.getByRole('checkbox', { name: 'Bob' })).not.toBeChecked();
  await user.click(
    screen.getByRole('button', { name: interactionsText.selectAll() })
  );
  await user.click(screen.getByRole('button', { name: commonText.save() }));
  expect(ajax).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ method: 'PUT' })
  );
  await user.click(screen.getByRole('button', { name: commonText.save() }));
  await waitFor(() =>
    expect(ajax).toHaveBeenCalledWith(
      '/stored_query/query/10/shares/',
      expect.objectContaining({
        method: 'PUT',
        body: { recipientIds: [1, 2, 3] },
      })
    )
  );
});

test('revocation requires confirmation and hides the action after success', async () => {
  await renderActions();
  await user.click(
    await screen.findByRole('button', { name: queryText.revokeQuerySharing() })
  );
  expect(
    screen.getByText(queryText.revokeQuerySharingDescription())
  ).toBeVisible();
  const buttons = screen.getAllByRole('button', {
    name: queryText.revokeQuerySharing(),
  });
  await user.click(buttons[buttons.length - 1]);
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: queryText.revokeQuerySharing() })
    ).not.toBeInTheDocument()
  );
});
