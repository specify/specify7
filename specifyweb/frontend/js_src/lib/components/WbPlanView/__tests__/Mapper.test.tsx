import { screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { localized, type RA } from '../../../utils/types';
import { Contexts } from '../../Core/Contexts';
import { defaultColumnOptions } from '../linesGetter';
import { type MappingLine, Mapper } from '../Mapper';
import { emptyMapping } from '../mappingHelpers';
import type { Dataset } from '../Wrapped';

requireContext();

const dataset: Dataset = {
  id: 1,
  name: localized('Test Dataset'),
  timestampcreated: '',
  timestampmodified: '',
  createdbyagent: '/api/specify/agent/1/',
  importedfilename: '',
  modifiedbyagent: null,
  remarks: '',
  uploadresult: null,
  uploaderstatus: null,
  columns: [],
  rowresults: null,
  rows: [],
  uploadplan: null,
  visualorder: null,
  isupdate: false,
  rolledback: false,
  usesattachments: false,
  attachments: null,
};

// [WorkBench] Delete unmapped columns from a new dataset
test('deletes only unmapped columns', async () => {
  const lines: RA<MappingLine> = [
    {
      headerName: 'Unmapped Column',
      mappingPath: [emptyMapping],
      columnOptions: defaultColumnOptions,
    },
    {
      headerName: 'Mapped Column',
      mappingPath: ['catalogNumber'],
      columnOptions: defaultColumnOptions,
    },
  ];

  const { user } = mount(
    <Contexts>
      <Mapper
        baseTableName="CollectionObject"
        changesMade={false}
        dataset={dataset}
        lines={lines}
        mustMatchPreferences={{}}
        onChangeBaseTable={jest.fn()}
        onSave={() => Promise.resolve()}
      />
    </Contexts>
  );

  expect(screen.getByText('Unmapped Column')).toBeInTheDocument();
  expect(screen.getByText('Mapped Column')).toBeInTheDocument();

  await user.click(
    screen.getByRole('button', {
      name: commonText.deleteUnmapped(),
    })
  );

  expect(screen.queryByText('Unmapped Column')).not.toBeInTheDocument();
  expect(screen.getByText('Mapped Column')).toBeInTheDocument();
});
