import React from 'react';
import * as Router from 'react-router-dom';

import { clearIdStore } from '../../../hooks/useId';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import * as Attachments from '../../Attachments/attachments';
import { testAttachment } from '../../Attachments/__tests__/utils';
import { deserializeResource } from '../../DataModel/serializers';
import { SetMenuContext } from '../../Header/MenuContext';
import { WbImportAttachmentsView } from '..';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';

requireContext();

const dataSetId = 123;
const dataSetAttachmentId = 456;

const dataSetResponse = {
  id: dataSetId,
  name: 'Attachments',
  importedfilename: 'attachments',
  columns: ['attachments'],
  data: [[]],
  resource_uri: `/api/specify/spdataset/${dataSetId}/`,
};

const createDataSetRequest = jest.fn(() => dataSetResponse);

const createDataSetAttachmentsRequest = jest.fn(() => [
  {
    id: dataSetAttachmentId,
    attachment: testAttachment,
    spdataset: `/api/specify/spdataset/${dataSetId}/`,
    resource_uri: `/api/specify/spdatasetattachment/${dataSetAttachmentId}/`,
  },
]);

const updateDataSetRequest = jest.fn(() => dataSetResponse);

overrideAjax('/api/workbench/dataset/', []);

overrideAjax('/api/specify/spdataset/', createDataSetRequest, {
  method: 'POST',
});

overrideAjax(
  '/bulk_copy/bulk/spdatasetattachment/',
  createDataSetAttachmentsRequest,
  {
    method: 'POST',
  }
);

overrideAjax(`/api/specify/spdataset/${dataSetId}/`, updateDataSetRequest, {
  method: 'PUT',
});

beforeEach(() => {
  jest.clearAllMocks();
  clearIdStore();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// [Import Attachments] Select multiple image files
test('selects multiple image files', async () => {
  const { container, getByRole, user } = mount(
    <Router.MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <SetMenuContext.Provider value={jest.fn()}>
        <WbImportAttachmentsView />
      </SetMenuContext.Provider>
    </Router.MemoryRouter>
  );

  const input = container.querySelector<HTMLInputElement>('input[type="file"]');

  if (input === null) {
    throw new Error('Unable to find the attachment file picker');
  }

  const files = [
    new File(['png image'], 'first-image.png', {
      type: 'image/png',
    }),
    new File(['webp image'], 'second-image.webp', {
      type: 'image/webp',
    }),
  ];

  expect(input).toHaveAttribute('multiple');

  await user.upload(input, files);

  expect(getByRole('cell', { name: 'first-image.png' })).toBeInTheDocument();

  expect(getByRole('cell', { name: 'second-image.webp' })).toBeInTheDocument();
});

// [Import Attachments] Select different image file types
test('selects different image file types', async () => {
  const { container, getByRole, user } = mount(
    <Router.MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <SetMenuContext.Provider value={jest.fn()}>
        <WbImportAttachmentsView />
      </SetMenuContext.Provider>
    </Router.MemoryRouter>
  );

  const input = container.querySelector<HTMLInputElement>('input[type="file"]');

  if (input === null) {
    throw new Error('Unable to find the attachment file picker');
  }

  const files = [
    new File(['png image'], 'image.png', {
      type: 'image/png',
    }),
    new File(['webp image'], 'image.webp', {
      type: 'image/webp',
    }),
    new File(['tiff image'], 'image.tiff', {
      type: 'image/tiff',
    }),
    new File(['jpeg image'], 'image.jpeg', {
      type: 'image/jpeg',
    }),
    new File(['gif image'], 'image.gif', {
      type: 'image/gif',
    }),
  ];

  expect(input).not.toHaveAttribute('accept');

  await user.upload(input, files);

  for (const file of files) {
    expect(getByRole('cell', { name: file.name })).toBeInTheDocument();
  }
});

// [Import Attachments] Import selected files into a WorkBench data set
test('imports selected attachment files', async () => {
  const uploadFile = jest
    .spyOn(Attachments, 'uploadFile')
    .mockResolvedValue(deserializeResource(testAttachment));

  const { container, findByText, getByRole, user } = mount(
    <Router.MemoryRouter
      initialEntries={['/']}
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <UnloadProtectsContext.Provider value={[]}>
        <Router.Routes>
          <Router.Route
            path="/"
            element={
              <SetMenuContext.Provider value={jest.fn()}>
                <WbImportAttachmentsView />
              </SetMenuContext.Provider>
            }
          />
          <Router.Route
            path="/specify/workbench/plan/:dataSetId/"
            element={<div>WorkBench data set created</div>}
          />
        </Router.Routes>
      </UnloadProtectsContext.Provider>
    </Router.MemoryRouter>
  );

  const input = container.querySelector<HTMLInputElement>('input[type="file"]');

  if (input === null) {
    throw new Error('Unable to find the attachment file picker');
  }

  const file = new File(['image'], 'attachment.png', {
    type: 'image/png',
  });

  await user.upload(input, file);

  await user.click(
    getByRole('button', {
      name: 'Import Attachments',
    })
  );

  expect(await findByText('WorkBench data set created')).toBeInTheDocument();

  expect(uploadFile).toHaveBeenCalledTimes(1);
  expect(uploadFile).toHaveBeenCalledWith(
    expect.objectContaining({
      file,
    })
  );

  expect(createDataSetRequest).toHaveBeenCalledTimes(1);
  expect(createDataSetAttachmentsRequest).toHaveBeenCalledTimes(1);
  expect(updateDataSetRequest).toHaveBeenCalledTimes(1);
});
