import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { commonText } from '../../../localization/common';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { LoadingContext } from '../../Core/Contexts';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { AttachmentImportById } from '../Import';

const mockHasPermission = jest.fn((_resource: string, _action: string) => true);

const mockDataSet = {
  id: 1,
  name: 'Test dataset',
  rows: [],
  columns: [],
  uploaderstatus: 'main',
  matchingmode: 'image',
  uploadplan: { staticPathKey: undefined, matchingMode: 'image' },
} as never;

const mockEagerDataSet = {
  id: 1,
  name: 'Test dataset',
  rows: [],
  columns: [],
  uploaderstatus: 'main',
  matchingmode: 'image',
  uploadplan: { staticPathKey: undefined, matchingMode: 'image' },
  needsSaved: true,
  save: false,
} as never;

jest.mock('../../../hooks/useAsyncState', () => ({
  usePromise: () => [mockDataSet],
}));

jest.mock('../useEagerDataset', () => ({
  useEagerDataSet: () => ({
    eagerDataSet: mockEagerDataSet,
    triggerSave: jest.fn(),
    commitChange: jest.fn(),
    unsetUnloadProtect: jest.fn(),
  }),
}));

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: (resource: string, action: string) =>
    mockHasPermission(resource, action),
  hasTablePermission: () => true,
  hasToolPermission: () => true,
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: '1' }),
}));

jest.mock('../../Molecules/FilePicker', () => ({
  FilePicker: () => null,
}));

jest.mock('../SelectUploadPath', () => ({
  SelectUploadPath: () => null,
}));

jest.mock('../Upload', () => ({
  AttachmentUpload: () => null,
}));

jest.mock('../Rollback', () => ({
  AttachmentRollback: () => null,
}));

jest.mock('../ViewAttachmentFiles', () => ({
  ViewAttachmentFiles: () => null,
}));

requireContext();

overrideAjax('/attachment_gw/dataset/1/', mockDataSet);

beforeEach(() => {
  mockHasPermission.mockClear();
});

// [AttachmentsBulkImport] Hide import save without permission
test('hides import save without permission', () => {
  mockHasPermission.mockReturnValue(false);

  render(
    <MemoryRouter>
      <LoadingContext.Provider value={jest.fn()}>
        <UnloadProtectsContext.Provider value={[]}>
          <AttachmentImportById />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );

  expect(
    screen.queryByRole('button', { name: commonText.save() })
  ).not.toBeInTheDocument();
  expect(mockHasPermission).toHaveBeenCalledWith(
    '/attachment_import/dataset',
    'update'
  );
});

// [AttachmentsBulkImport] Show import save with permission
test('shows import save with permission', () => {
  mockHasPermission.mockReturnValue(true);

  render(
    <MemoryRouter>
      <LoadingContext.Provider value={jest.fn()}>
        <UnloadProtectsContext.Provider value={[]}>
          <AttachmentImportById />
        </UnloadProtectsContext.Provider>
      </LoadingContext.Provider>
    </MemoryRouter>
  );

  expect(
    screen.getByRole('button', { name: commonText.save() })
  ).toBeInTheDocument();
});
