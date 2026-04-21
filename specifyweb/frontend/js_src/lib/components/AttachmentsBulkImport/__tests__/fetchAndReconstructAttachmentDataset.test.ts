import { waitFor } from '@testing-library/react';

import { overrideAjax } from '../../../tests/ajax';
import { localized } from '../../../utils/types';
import { getResourceApiUrl } from '../../DataModel/resource';
import { fetchAndReconstructAttachmentDataset } from '../Import';
import type { FetchedDataSet } from '../types';
import * as bulkAttachmentUtils from '../utils';

const mockReconstructUploading = jest.fn();
const mockReconstructDeleting = jest.fn();

jest
  .spyOn(bulkAttachmentUtils, 'reconstructUploadingAttachmentSpec')
  .mockImplementation(async (...args) => {
    mockReconstructUploading(...args);
    return [];
  });

jest
  .spyOn(bulkAttachmentUtils, 'reconstructDeletingAttachment')
  .mockImplementation(async (...args) => {
    mockReconstructDeleting(...args);
    return [];
  });

describe('fetchAndReconstructAttachmentDataset', () => {
  beforeEach(() => {
    mockReconstructUploading.mockClear();
    mockReconstructDeleting.mockClear();
  });

  const makeDataSet = (
    id: number,
    state: 'deleting' | 'main' | 'uploading'
  ): FetchedDataSet => ({
    uploaderstatus: state,
    id,
    name: localized('test'),
    timestampcreated: '',
    timestampmodified: '',
    createdbyagent: getResourceApiUrl('Agent', 1),
    modifiedbyagent: null,
    importedfilename: '',
    remarks: '',
    rows: [],
    uploadplan: {
      staticPathKey: 'collectionObjectCatalogNumber',
      formatQueryResults: () => undefined,
    },
  });

  const mainDatSetId = 3;
  const mainDataSet = makeDataSet(mainDatSetId, 'main');

  overrideAjax(`/attachment_gw/dataset/${mainDatSetId}/`, mainDataSet);

  test('main state gets untouched', async () => {
    await fetchAndReconstructAttachmentDataset(mainDatSetId);

    expect(mockReconstructDeleting).toHaveBeenCalledTimes(0);
    expect(mockReconstructUploading).toHaveBeenCalledTimes(0);
  });

  const uploadingDatSetId = 4;
  const uploadingDataSet = makeDataSet(mainDatSetId, 'uploading');

  overrideAjax(
    `/attachment_gw/dataset/${uploadingDatSetId}/`,
    uploadingDataSet
  );

  test('upload reconstruct called when uploading', async () => {
    await fetchAndReconstructAttachmentDataset(uploadingDatSetId);

    await waitFor(() => {
      expect(mockReconstructDeleting).toHaveBeenCalledTimes(0);
      expect(mockReconstructUploading).toHaveBeenCalledTimes(1);
    });
  });

  const deletingDatSetId = 5;
  const deletingDataSet = makeDataSet(mainDatSetId, 'deleting');

  overrideAjax(`/attachment_gw/dataset/${deletingDatSetId}/`, deletingDataSet);

  test('upload reconstruct called when uploading', async () => {
    await fetchAndReconstructAttachmentDataset(deletingDatSetId);

    await waitFor(() => {
      expect(mockReconstructDeleting).toHaveBeenCalledTimes(1);
      expect(mockReconstructUploading).toHaveBeenCalledTimes(0);
    });
  });
});
