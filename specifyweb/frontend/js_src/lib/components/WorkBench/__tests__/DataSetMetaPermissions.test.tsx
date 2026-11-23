import { render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { localized } from '../../../utils/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { DataSetMeta } from '../DataSetMeta';

const mockHasPermission = jest.fn((_resource: string, _action: string) => true);

jest.mock('../../Molecules/FormattedResource', () => ({
  FormattedResourceUrl: () => null,
}));

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: (resource: string, action: string) =>
    mockHasPermission(resource, action),
  hasTablePermission: () => true,
  hasToolPermission: () => true,
}));

requireContext();

const dataset = {
  id: 1,
  name: 'Test dataset',
  remarks: '',
  rows: [],
  columns: [],
  timestampcreated: '2023-01-01',
  timestampmodified: '2023-01-01',
  createdbyagent: '/api/specify/agent/1/',
  modifiedbyagent: '/api/specify/agent/1/',
  uploadresult: { success: false },
  importedfilename: '',
  uploadplan: { baseTableName: 'CollectionObject' },
} as never;

beforeEach(() => {
  mockHasPermission.mockClear();
});

// [AttachmentsBulkImport] Hide delete without permission
test('hides delete without permission', () => {
  mockHasPermission.mockReturnValue(false);

  render(
    <UnloadProtectsContext.Provider value={[]}>
      <DataSetMeta
        dataset={dataset}
        datasetVariant="bulkAttachment"
        deleteDescription={localized('Delete dataset')}
        onChange={jest.fn()}
        onClose={jest.fn()}
        onDeleted={jest.fn()}
        permissionResource="/attachment_import/dataset"
      />
    </UnloadProtectsContext.Provider>
  );

  expect(
    screen.queryByRole('button', { name: commonText.delete() })
  ).not.toBeInTheDocument();
  expect(mockHasPermission).toHaveBeenCalledWith(
    '/attachment_import/dataset',
    'delete'
  );
});

// [AttachmentsBulkImport] Hide save without update permission
test('hides save without update permission', () => {
  mockHasPermission.mockReturnValue(false);

  render(
    <UnloadProtectsContext.Provider value={[]}>
      <DataSetMeta
        dataset={dataset}
        datasetVariant="bulkAttachment"
        deleteDescription={localized('Delete dataset')}
        onChange={jest.fn()}
        onClose={jest.fn()}
        onDeleted={jest.fn()}
        permissionResource="/attachment_import/dataset"
      />
    </UnloadProtectsContext.Provider>
  );

  expect(
    screen.queryByRole('button', { name: commonText.save() })
  ).not.toBeInTheDocument();
  expect(mockHasPermission).toHaveBeenCalledWith(
    '/attachment_import/dataset',
    'update'
  );
});
