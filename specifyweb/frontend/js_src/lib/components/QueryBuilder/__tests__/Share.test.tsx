import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { interactionsText } from '../../../localization/interactions';
import { queryText } from '../../../localization/query';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import * as ajaxModule from '../../../utils/ajax';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { QuerySharingActions } from '../Share';

requireContext();
const recipients = {
  recipientIds: [2],
  version: 0,
  collections: [
    {
      id: 1,
      name: 'Collection A',
      discipline: {
        id: 2,
        name: 'Discipline A',
        division: { id: 3, name: 'Division A' },
      },
      users: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Carol' },
      ],
    },
  ],
  usersWithoutCollection: [{ id: 4, name: 'No collection user' }],
};
overrideAjax('/stored_query/query/10/shares/', recipients);
overrideAjax(
  '/stored_query/query/10/shares/',
  { recipientIds: [1, 2, 3, 4], version: 1 },
  { method: 'PUT', body: { recipientIds: [1, 2, 3, 4], version: 0 } }
);
overrideAjax('/stored_query/query/10/shares/', '', {
  method: 'DELETE',
  responseCode: 204,
});
overrideAjax('/stored_query/query/11/shares/', {
  ...recipients,
  recipientIds: [],
});
overrideAjax(
  '/stored_query/query/11/shares/',
  { recipientIds: [1, 2, 3, 4], version: 1 },
  { method: 'PUT', body: { recipientIds: [1, 2, 3, 4], version: 0 } }
);

afterEach(() => jest.restoreAllMocks());

async function renderActions(queryId = 10): Promise<void> {
  await act(async () => {
    render(
      <LoadingContext.Provider
        value={(promise): void => {
          void promise;
        }}
      >
        <UnloadProtectsContext.Provider value={[]}>
          <QuerySharingActions queryId={queryId} />
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

test('displays users under collapsible division, discipline, and collection nodes', async () => {
  await renderActions();
  await user.click(
    await screen.findByRole('button', { name: queryText.shareQuery() })
  );
  expect(screen.getByText('Division A')).toBeVisible();
  expect(screen.getByText('Collection A')).toBeVisible();
  expect(screen.getByText('Discipline A')).toBeVisible();
  expect(screen.getByRole('checkbox', { name: 'Alice' })).toBeVisible();
  expect(
    screen.getByRole('checkbox', { name: 'No collection user' })
  ).toBeVisible();

  const collapseButtons = screen.getAllByRole('button', { name: 'collapse' });
  await user.click(collapseButtons[0]);
  expect(
    screen.queryByRole('checkbox', { name: 'Alice' })
  ).not.toBeInTheDocument();

  await user.click(screen.getAllByRole('button', { name: 'collapse' })[0]);
  expect(screen.getByRole('checkbox', { name: 'Alice' })).toBeVisible();
});

test('supports range selection, select all, deselect all, and confirmed saving', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  await renderActions(11);
  const share = screen.getByRole('button', { name: queryText.shareQuery() });
  await waitFor(() => expect(share).toBeEnabled());
  expect(
    screen.queryByRole('button', { name: queryText.revokeQuerySharing() })
  ).not.toBeInTheDocument();
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
      '/stored_query/query/11/shares/',
      expect.objectContaining({
        method: 'PUT',
        body: { recipientIds: [1, 2, 3, 4], version: 0 },
      })
    )
  );
  expect(
    await screen.findByRole('button', { name: queryText.revokeQuerySharing() })
  ).toBeVisible();
});

test('revocation requires confirmation and hides the action after success', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  await renderActions();
  await user.click(
    await screen.findByRole('button', { name: queryText.revokeQuerySharing() })
  );
  expect(
    screen.getByText(queryText.revokeQuerySharingDescription())
  ).toBeVisible();
  expect(ajax).not.toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({ method: 'DELETE' })
  );
  const buttons = screen.getAllByRole('button', {
    name: queryText.revokeQuerySharing(),
  });
  ajax.mockResolvedValueOnce({
    data: '',
    status: 204,
    response: {} as Response,
  });
  ajax.mockResolvedValueOnce({
    data: { ...recipients, recipientIds: [], version: 1 },
    status: 200,
    response: {} as Response,
  });
  await user.click(buttons[buttons.length - 1]);
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: queryText.revokeQuerySharing() })
    ).not.toBeInTheDocument()
  );
  expect(ajax).toHaveBeenCalledWith(
    '/stored_query/query/10/shares/',
    expect.objectContaining({ method: 'DELETE' })
  );
});

test('reloads recipients and version after a conflict before allowing another save', async () => {
  const ajax = jest.spyOn(ajaxModule, 'ajax');
  await renderActions();
  await user.click(
    screen.getByRole('button', { name: queryText.shareQuery() })
  );
  await user.click(screen.getByRole('checkbox', { name: 'Alice' }));
  await user.click(screen.getByRole('button', { name: commonText.save() }));
  ajax.mockResolvedValueOnce({
    data: 'out of date',
    status: 409,
    response: {} as Response,
  });
  ajax.mockResolvedValueOnce({
    data: { ...recipients, recipientIds: [3], version: 7 },
    status: 200,
    response: {} as Response,
  });

  await user.click(screen.getByRole('button', { name: commonText.save() }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    formsText.saveConflict()
  );
  expect(screen.getByRole('checkbox', { name: 'Alice' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Bob' })).not.toBeChecked();
  expect(screen.getByRole('checkbox', { name: 'Carol' })).toBeChecked();
  expect(ajax).toHaveBeenCalledWith(
    '/stored_query/query/10/shares/',
    expect.objectContaining({
      method: 'PUT',
      body: { recipientIds: [2, 1], version: 0 },
      expectedErrors: [409],
    })
  );

  ajax.mockResolvedValueOnce({
    data: { recipientIds: [3], version: 8 },
    status: 200,
    response: {} as Response,
  });
  await user.click(screen.getByRole('button', { name: commonText.save() }));
  await user.click(screen.getByRole('button', { name: commonText.save() }));
  expect(ajax).toHaveBeenLastCalledWith(
    '/stored_query/query/10/shares/',
    expect.objectContaining({
      method: 'PUT',
      body: { recipientIds: [3], version: 7 },
    })
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
