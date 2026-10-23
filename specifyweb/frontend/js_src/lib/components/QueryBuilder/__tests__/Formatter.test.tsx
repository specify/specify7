import { act, fireEvent, render, screen } from '@testing-library/react';
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
      {
        table: { name: 'Collector' },
        name: 'Collector',
        title: 'Collector',
        isDefault: true,
      },
      {
        table: { name: 'Collector' },
        name: 'Collector Identifiers',
        title: 'Collector Identifiers',
        isDefault: false,
      },
    ],
  }),
}));

requireContext();

test('recognizes the backstop aggregation in a DwC-A mapping', async () => {
  render(
    <QueryFieldRecordFormatter
      formatter="Collector Identifiers"
      tableName="Collector"
      type="aggregator"
      onChange={jest.fn()}
    />
  );

  fireEvent.click(
    await screen.findByRole('button', { name: queryText.chooseFormatter() })
  );
  expect(
    screen.getByRole('combobox', { name: queryText.chooseFormatter() })
  ).toHaveValue('Collector Identifiers');
  expect(
    screen.queryByRole('option', { name: /current, invalid value/i })
  ).not.toBeInTheDocument();
});

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

test.each(['formatter', 'aggregator'] as const)(
  'keeps the first %s selection closed and accepts an empty default format',
  async (type) => {
    render(
      <QueryFieldRecordFormatter
        formatter=""
        tableName="Agent"
        type={type}
        usedFormats={new Set()}
        onChange={jest.fn()}
      />
    );

    const button = await screen.findByRole('button', {
      name: queryText.chooseFormatter(),
    });
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();

    fireEvent.click(button);
    expect(
      screen.getByRole('combobox', { name: queryText.chooseFormatter() })
    ).toHaveValue('');
    expect(
      screen.queryByText(queryText.invalidPicklistValue({ value: '' }))
    ).not.toBeInTheDocument();
  }
);
