import { render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { RecordSelectorFromIds } from '../../FormSliders/RecordSelectorFromIds';
import { QueryFormView } from '../ToForms';

requireContext();

jest.mock('../../FormSliders/RecordSelectorFromIds', () => ({
  RecordSelectorFromIds: jest.fn(() => <div data-testid="record-preview" />),
}));

test('unmounts the record preview during merging and restores surviving records', () => {
  const props = {
    table: tables.Agent,
    title: commonText.view(),
    results: [[38665], [38666]],
    selectedRows: new Set([38665, 38666]),
    selectedIndex: 1,
    totalCount: 2,
    onFetchMore: undefined,
    onDelete: jest.fn(),
    onClose: jest.fn(),
    onSaved: jest.fn(),
    onSlide: jest.fn(),
  };
  const { rerender } = render(<QueryFormView {...props} />);
  expect(screen.getByTestId('record-preview')).toBeInTheDocument();

  jest.mocked(RecordSelectorFromIds).mockClear();
  rerender(<QueryFormView {...props} suspended />);
  expect(screen.queryByTestId('record-preview')).not.toBeInTheDocument();
  expect(RecordSelectorFromIds).not.toHaveBeenCalled();

  rerender(
    <QueryFormView
      {...props}
      results={[[38665]]}
      selectedRows={new Set()}
      selectedIndex={0}
      totalCount={1}
      suspended={false}
    />
  );
  expect(screen.getByTestId('record-preview')).toBeInTheDocument();
  expect(RecordSelectorFromIds).toHaveBeenLastCalledWith(
    expect.objectContaining({ ids: [38665] }),
    expect.anything()
  );
});
