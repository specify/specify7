import { act, render, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { queryText } from '../../../localization/query';
import { QueryFieldRecordFormatter } from '../Formatter';

jest.mock('../../Formatters/formatters', () => ({
  fetchFormatters: Promise.resolve({
    formatters: [
      {
        table: { name: 'Agent' },
        name: 'Default',
        title: 'Default',
        isDefault: true,
      },
      {
        table: { name: 'Agent' },
        name: 'Alternate',
        title: 'Alternate',
        isDefault: false,
      },
      {
        table: { name: 'Address' },
        name: 'Only',
        title: 'Only',
        isDefault: true,
      },
    ],
    aggregators: [
      {
        table: { name: 'Agent' },
        name: 'Default',
        title: 'Default',
        isDefault: true,
      },
      {
        table: { name: 'Agent' },
        name: 'Alternate',
        title: 'Alternate',
        isDefault: false,
      },
    ],
  }),
}));

requireContext();

test.each(['formatter', 'aggregator'] as const)(
  'opens the %s selection when a newly added field has multiple choices',
  async (type) => {
    const props = {
      type,
      tableName: 'Agent' as const,
      formatter: 'Alternate',
      usedFormats: new Set(['Default']),
      onChange: jest.fn(),
    };
    const { rerender } = render(<QueryFieldRecordFormatter {...props} />);

    expect(
      await screen.findByRole('button', { name: queryText.chooseFormatter() })
    ).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    rerender(
      <QueryFieldRecordFormatter {...props} formatSelectionRequest={1} />
    );
    expect(
      await screen.findByRole('combobox', { name: queryText.chooseFormatter() })
    ).toHaveValue('Alternate');

    expect(
      screen.getByRole('option', { name: /Alternate/ })
    ).toBeInTheDocument();
  }
);

test('does not show a format selection when there is only one choice', async () => {
  await act(async () => {
    render(
      <QueryFieldRecordFormatter
        formatSelectionRequest={1}
        formatter={undefined}
        tableName="Address"
        type="formatter"
        onChange={jest.fn()}
      />
    );
  });

  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: queryText.chooseFormatter() })
  ).not.toBeInTheDocument();
});
