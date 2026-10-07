import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import type { SpecifyResource } from '../../DataModel/legacyTypes';
import type { Agent } from '../../DataModel/types';
import { RecordSelectorFromIds } from '../../FormSliders/RecordSelectorFromIds';
import type { RecordSelectorProps } from '../../FormSliders/RecordSelector';

requireContext();

const mockLoadRecord = jest.fn<void, [SpecifyResource<Agent> | undefined]>();

jest.mock('../../Forms/ResourceView', () => {
  const actualReact = jest.requireActual<typeof React>('react');
  return {
    ResourceView: jest.fn(function Preview({
      resource,
    }: {
      readonly resource: SpecifyResource<Agent> | undefined;
    }) {
      const [value, setValue] = actualReact.useState('');
      actualReact.useEffect(() => {
        mockLoadRecord(resource);
      }, [resource]);
      return (
        <input
          aria-label="Agent name"
          value={value}
          onChange={(event) => {
            resource?.set('remarks', event.target.value);
            setValue(event.target.value);
          }}
        />
      );
    }),
  };
});

jest.mock('../../FormSliders/RecordSelector', () => ({
  useRecordSelector: ({ records, index }: RecordSelectorProps<never>) => ({
    resource: records[index],
    dialogs: null,
    slider: null,
    isLoading: false,
  }),
}));

test('keeps the edited resource and form mounted without loading another record while suspended', () => {
  const props = {
    ids: [38665, 38666],
    defaultIndex: 1,
    table: tables.Agent,
    title: commonText.view(),
    dialog: false,
    isDependent: false,
    newResource: undefined,
    onAdd: undefined,
    onClone: undefined,
    onDelete: undefined,
    onSlide: undefined,
    onClose: jest.fn(),
    onSaved: jest.fn(),
  } as const;
  const { rerender } = render(<RecordSelectorFromIds {...props} />);
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: 'Unsaved remarks' } });
  const resource = mockLoadRecord.mock.calls[0][0]!;
  expect(resource.get('remarks')).toBe('Unsaved remarks');
  expect(resource.needsSaved).toBe(true);
  expect(mockLoadRecord).toHaveBeenCalledTimes(1);

  rerender(
    <RecordSelectorFromIds
      {...props}
      ids={[38665]}
      defaultIndex={0}
      suspended
    />
  );
  expect(input).toBeInTheDocument();
  expect(input).toHaveValue('Unsaved remarks');
  expect(mockLoadRecord).toHaveBeenCalledTimes(1);

  rerender(<RecordSelectorFromIds {...props} suspended={false} />);
  expect(screen.getByRole('textbox')).toBe(input);
  expect(resource.get('remarks')).toBe('Unsaved remarks');
  expect(mockLoadRecord).toHaveBeenCalledTimes(1);
});
