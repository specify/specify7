import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import { RecordSelectorFromIds } from '../../FormSliders/RecordSelectorFromIds';
import { QueryFormView } from '../ToForms';

requireContext();

jest.mock('../../FormSliders/RecordSelectorFromIds', () => {
  const actualReact = jest.requireActual<typeof React>('react');
  return {
    RecordSelectorFromIds: jest.fn(function Preview() {
      const [value, setValue] = actualReact.useState('');
      return (
        <input
          aria-label="Record preview"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      );
    }),
  };
});

test('preserves unsaved preview edits when merging is cancelled', () => {
  const props = {
    table: tables.Agent,
    title: commonText.view(),
    results: [[38665], [38666]],
    selectedRows: new Set([38665, 38666]),
    selectedIndex: 1,
    totalCount: 2,
    onFetchMore: jest.fn(),
    onDelete: jest.fn(),
    onClose: jest.fn(),
    onSaved: jest.fn(),
    onSlide: jest.fn(),
  };
  const { rerender } = render(<QueryFormView {...props} />);
  const input = screen.getByRole('textbox', { name: 'Record preview' });
  fireEvent.change(input, { target: { value: 'Unsaved agent name' } });

  rerender(
    <QueryFormView
      {...props}
      results={[]}
      selectedRows={new Set()}
      selectedIndex={0}
      suspended
    />
  );
  expect(input).toBeInTheDocument();
  expect(input).toHaveValue('Unsaved agent name');
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(RecordSelectorFromIds).toHaveBeenLastCalledWith(
    expect.objectContaining({
      ids: [38665, 38666],
      defaultIndex: 1,
      suspended: true,
      onFetch: undefined,
    }),
    expect.anything()
  );

  rerender(<QueryFormView {...props} suspended={false} />);
  expect(screen.getByRole('textbox')).toBe(input);
  expect(input).toHaveValue('Unsaved agent name');

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
  expect(screen.getByRole('textbox')).toBeInTheDocument();
  expect(RecordSelectorFromIds).toHaveBeenLastCalledWith(
    expect.objectContaining({ ids: [38665] }),
    expect.anything()
  );
});
