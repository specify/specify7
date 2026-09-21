import type Handsontable from 'handsontable';
import { screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { localized } from '../../../utils/types';
import { userPreferences } from '../../Preferences/userPreferences';
import type { Dataset } from '../../WbPlanView/Wrapped';
import { downloadDataSet } from '../../WorkBench/helpers';
import { WbToolkit } from '..';

requireContext();

jest.mock('../../WbUtils/datasetVariants', () => ({
  resolveVariantFromDataset: jest.fn(() => ({
    canTransfer: jest.fn(() => false),
    canUpdate: jest.fn(() => false),
  })),
}));

jest.mock('../../WorkBench/attachmentHelpers', () => ({
  getAttachmentsColumn: jest.fn(() => -1),
}));

jest.mock('../../WorkBench/helpers', () => ({
  downloadDataSet: jest.fn(() => Promise.resolve()),
}));

jest.mock('../DevShowPlan', () => ({
  WbRawPlan: jest.fn(() => null),
}));

jest.mock('../WbLeafletMap', () => ({
  WbLeafletMap: jest.fn(() => null),
}));

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

const dataset: Dataset = {
  id: 1,
  name: localized('Data Set'),
  timestampcreated: '',
  timestampmodified: '',
  createdbyagent: '/api/specify/agent/1/',
  importedfilename: '',
  modifiedbyagent: null,
  remarks: '',
  uploadresult: null,
  uploaderstatus: null,
  columns: ['Catalog Number', 'Remarks'],
  rowresults: null,
  rows: [['100']],
  uploadplan: null,
  visualorder: [1, 0],
  isupdate: false,
  rolledback: false,
  usesattachments: false,
  attachments: null,
};

// [WbToolkit] Export columns in their visible order and preserve blank cells
test('exports the visible column order', async () => {
  jest.spyOn(userPreferences, 'get').mockReturnValue(',' as never);

  const { user } = mount(
    <WbToolkit
      data={[]}
      dataset={dataset}
      hasUnsavedChanges={false}
      hot={{} as Handsontable}
      isResultsOpen={false}
      isUploaded={false}
      mappings={undefined}
      triggerDatasetRefresh={jest.fn()}
      onDatasetDeleted={jest.fn()}
    />
  );

  await user.click(
    screen.getByRole('button', {
      name: commonText.export(),
    })
  );

  expect(downloadDataSet).toHaveBeenCalledWith(
    'Data Set',
    [['', '100']],
    ['Remarks', 'Catalog Number'],
    ','
  );
});
