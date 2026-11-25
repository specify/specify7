import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { commonText } from '../../../localization/common';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { AttachmentsImportOverlay } from '../Datasets';

const mockHasPermission = jest.fn((_resource: string, _action: string) => true);

jest.mock('../../../hooks/useAsyncState', () => ({
  usePromise: () => [[]],
  useAsyncState: () => ['Test dataset', jest.fn()],
}));

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: (resource: string, action: string) =>
    mockHasPermission(resource, action),
  hasTablePermission: () => true,
  hasToolPermission: () => true,
}));

requireContext();

overrideAjax('/attachment_gw/dataset/', []);

beforeEach(() => {
  mockHasPermission.mockClear();
});

// [AttachmentsBulkImport] Hide create without permission
test('hides create without permission', async () => {
  mockHasPermission.mockReturnValue(false);

  render(
    <MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <AttachmentsImportOverlay />
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: commonText.new() })
    ).not.toBeInTheDocument()
  );
  expect(mockHasPermission).toHaveBeenCalledWith(
    '/attachment_import/dataset',
    'create'
  );
});

// [AttachmentsBulkImport] Show create with permission
test('shows create with permission', async () => {
  mockHasPermission.mockReturnValue(true);

  render(
    <MemoryRouter>
      <UnloadProtectsContext.Provider value={[]}>
        <AttachmentsImportOverlay />
      </UnloadProtectsContext.Provider>
    </MemoryRouter>
  );

  expect(
    await screen.findByRole('button', { name: commonText.new() })
  ).toBeInTheDocument();
});
