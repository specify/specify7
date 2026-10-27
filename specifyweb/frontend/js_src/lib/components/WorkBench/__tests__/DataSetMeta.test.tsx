import React from 'react';
import { batchEditText } from '../../../localization/batchEdit';
import { mount } from '../../../tests/reactUtils';
import { localized } from '../../../utils/types';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import type { Dataset } from '../../WbPlanView/Wrapped';
import { DataSetName } from '../DataSetMeta';

const buildDataset = ({
  isupdate,
  rolledback,
}: {
  readonly isupdate: boolean;
  readonly rolledback: boolean;
}): Dataset => ({
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
  rows: [['100', 'A remark']],
  uploadplan: null,
  visualorder: null,
  isupdate,
  rolledback,
  usesattachments: false,
  attachments: null,
});

const render = (dataset: Dataset) =>
  mount(
    <UnloadProtectsContext.Provider value={[]}>
      <DataSetName dataset={dataset} hot={undefined} />
    </UnloadProtectsContext.Provider>
  );

describe('DataSetName', () => {
  test('warns that a rolled back batch edit data set cannot be edited', () => {
    const { getByText } = render(
      buildDataset({ isupdate: true, rolledback: true })
    );
    expect(
      getByText(batchEditText.cannotEditAfterRollback())
    ).toBeInTheDocument();
  });

  test('does not warn before the batch edit data set is rolled back', () => {
    const { queryByText } = render(
      buildDataset({ isupdate: true, rolledback: false })
    );
    expect(
      queryByText(batchEditText.cannotEditAfterRollback())
    ).not.toBeInTheDocument();
  });

  test('does not warn for a rolled back workbench data set', () => {
    // Workbench data sets can still be edited and uploaded after a rollback.
    const { queryByText } = render(
      buildDataset({ isupdate: false, rolledback: true })
    );
    expect(
      queryByText(batchEditText.cannotEditAfterRollback())
    ).not.toBeInTheDocument();
  });
});
