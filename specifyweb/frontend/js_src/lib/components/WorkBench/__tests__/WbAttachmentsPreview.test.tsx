import type Handsontable from 'handsontable';
import { act } from '@testing-library/react';
import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { clearIdStore } from '../../../hooks/useId';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import * as Attachments from '../../Attachments/attachments';
import { testAttachment } from '../../Attachments/__tests__/utils';
import { LoadingContext } from '../../Core/Contexts';
import type { Dataset } from '../../WbPlanView/Wrapped';
import { ATTACHMENTS_COLUMN } from '../attachmentHelpers';
import { WbAttachmentsPreview } from '../WbAttachmentsPreview';

requireContext();

const firstDataSetAttachmentId = 201;
const secondDataSetAttachmentId = 202;

const firstAttachment = {
  ...testAttachment,
  id: 101,
  title: 'First row attachment',
  origFilename: 'first-row.jpg',
  attachmentLocation: 'first-row.jpg',
  resource_uri: '/api/specify/attachment/101/',
};

const secondAttachment = {
  ...testAttachment,
  id: 102,
  title: 'Second row attachment',
  origFilename: 'second-row.jpg',
  attachmentLocation: 'second-row.jpg',
  resource_uri: '/api/specify/attachment/102/',
};

const firstDataSetAttachmentRequest = jest.fn(() => ({
  id: firstDataSetAttachmentId,
  ordinal: 0,
  attachment: firstAttachment,
  spdataset: '/api/specify/spdataset/123/',
  resource_uri: `/api/specify/spdatasetattachment/${firstDataSetAttachmentId}/`,
}));

const secondDataSetAttachmentRequest = jest.fn(() => ({
  id: secondDataSetAttachmentId,
  ordinal: 0,
  attachment: secondAttachment,
  spdataset: '/api/specify/spdataset/123/',
  resource_uri: `/api/specify/spdatasetattachment/${secondDataSetAttachmentId}/`,
}));

overrideAjax(
  `/api/specify/spdatasetattachment/${firstDataSetAttachmentId}/`,
  firstDataSetAttachmentRequest
);

overrideAjax(
  `/api/specify/spdatasetattachment/${secondDataSetAttachmentId}/`,
  secondDataSetAttachmentRequest
);

beforeEach(() => {
  jest.clearAllMocks();
  clearIdStore();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// [WorkBench] Show the matching attachment for the selected row
test('shows the selected row attachment', async () => {
  jest
    .spyOn(Attachments, 'fetchThumbnail')
    .mockImplementation(async (attachment) => ({
      src: `thumbnail-${attachment.id}`,
      alt: attachment.title ?? undefined,
      width: 64,
      height: 64,
    }));

  const addHook = jest.fn();
  const getDataAtCell = jest.fn((row: number) =>
    row === 0
      ? JSON.stringify({
          attachments: [
            {
              id: firstDataSetAttachmentId,
              table: 'baseTable',
            },
          ],
          formatted: 'first-row.jpg',
        })
      : JSON.stringify({
          attachments: [
            {
              id: secondDataSetAttachmentId,
              table: 'baseTable',
            },
          ],
          formatted: 'second-row.jpg',
        })
  );

  const hot = {
    addHook,
    getDataAtCell,
    getSelectedLast: jest.fn(() => [0, 0, 0, 0]),
    toVisualColumn: jest.fn((column: number) => column),
  } as unknown as Handsontable;

  const dataset: Dataset = {
    id: 123,
    name: 'Attachment test data set' as LocalizedString,
    timestampcreated: '2026-01-01T00:00:00Z',
    timestampmodified: '2026-01-01T00:00:00Z',
    createdbyagent: '/api/specify/agent/1/',
    importedfilename: 'attachments.csv',
    modifiedbyagent: null,
    remarks: '',
    uploadresult: null,
    uploaderstatus: null,
    columns: ['catalogNumber', ATTACHMENTS_COLUMN],
    rowresults: null,
    rows: [],
    uploadplan: null,
    visualorder: null,
    isupdate: false,
    rolledback: false,
    usesattachments: true,
    attachments: null,
  };

  const { findByRole, queryByRole } = mount(
    <LoadingContext.Provider value={f.void}>
      <WbAttachmentsPreview
        checkDeletedFail={jest.fn()}
        dataset={dataset}
        hot={hot}
        isUploaded
        searchRef={{ current: null }}
        showPanel
        workbench={{} as never}
        onClose={jest.fn()}
        onSpreadsheetUpToDate={jest.fn()}
      />
    </LoadingContext.Provider>
  );

  expect(
    await findByRole('img', {
      name: 'First row attachment',
    })
  ).toBeInTheDocument();

  expect(firstDataSetAttachmentRequest).toHaveBeenCalledTimes(1);
  expect(secondDataSetAttachmentRequest).not.toHaveBeenCalled();

  expect(addHook).toHaveBeenCalledWith(
    'afterSelectionEnd',
    expect.any(Function)
  );

  const selectRow = addHook.mock.calls[0][1] as (row: number) => void;

  await act(async () => {
    selectRow(1);
  });

  expect(
    await findByRole('img', {
      name: 'Second row attachment',
    })
  ).toBeInTheDocument();

  expect(
    queryByRole('img', {
      name: 'First row attachment',
    })
  ).not.toBeInTheDocument();

  expect(firstDataSetAttachmentRequest).toHaveBeenCalledTimes(1);
  expect(secondDataSetAttachmentRequest).toHaveBeenCalledTimes(1);

  expect(getDataAtCell).toHaveBeenCalledWith(0, 1);
  expect(getDataAtCell).toHaveBeenCalledWith(1, 1);
});
