import { render, screen } from '@testing-library/react';
import React from 'react';

import { wbText } from '../../../localization/workbench';
import { requireContext } from '../../../tests/helpers';
import { AttachmentRollback } from '../Rollback';
import { AttachmentUpload } from '../Upload';

const mockHasPermission = jest.fn(() => true);

jest.mock('../../../hooks/useAsyncState', () => ({
  usePromise: () => [true],
}));

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: (...args: unknown[]) => mockHasPermission(...args),
  hasTablePermission: () => true,
  hasToolPermission: () => true,
}));

requireContext();

const dataSet = {
  rows: [],
  needsSaved: false,
  uploaderstatus: 'main',
} as never;

beforeEach(() => {
  mockHasPermission.mockClear();
});

// [AttachmentsBulkImport] Hide upload without permission
test('hides upload without permission', () => {
  mockHasPermission.mockReturnValue(false);

  render(
    <AttachmentUpload
      baseTableName={undefined}
      dataSet={dataSet}
      onSync={jest.fn()}
    />
  );

  expect(
    screen.queryByRole('button', { name: wbText.upload() })
  ).not.toBeInTheDocument();
  expect(mockHasPermission).toHaveBeenCalledWith(
    '/attachment_import/dataset',
    'upload'
  );
});

// [AttachmentsBulkImport] Hide rollback without permission
test('hides rollback without permission', () => {
  mockHasPermission.mockReturnValue(false);

  render(
    <AttachmentRollback
      baseTableName={undefined}
      dataSet={dataSet}
      onSync={jest.fn()}
    />
  );

  expect(
    screen.queryByRole('button', { name: wbText.rollback() })
  ).not.toBeInTheDocument();
  expect(mockHasPermission).toHaveBeenCalledWith(
    '/attachment_import/dataset',
    'rollback'
  );
});
