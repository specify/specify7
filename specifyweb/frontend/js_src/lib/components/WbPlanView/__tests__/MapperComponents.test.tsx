import { render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { MappingsControlPanel } from '../MapperComponents';

// [WorkBench] Delete unmapped columns from a new dataset
test('shows delete unmapped columns for unsaved columns', () => {
  render(
    <MappingsControlPanel
      columnsNotSaved
      showHiddenFields={false}
      onClear={jest.fn()}
    />
  );

  expect(
    screen.getByRole('button', {
      name: commonText.deleteUnmapped(),
    })
  ).toBeInTheDocument();
});

// [WorkBench] Hide delete unmapped columns after columns are saved
test('hides delete unmapped columns for saved columns', () => {
  render(
    <MappingsControlPanel
      columnsNotSaved={false}
      showHiddenFields={false}
      onClear={jest.fn()}
    />
  );

  expect(
    screen.queryByRole('button', {
      name: commonText.deleteUnmapped(),
    })
  ).not.toBeInTheDocument();
});
