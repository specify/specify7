import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { DataViewQueryEditorContent } from '../QueryEditor';

requireContext();

jest.mock('../../QueryBuilder/Wrapped', () => ({
  QueryBuilder: ({
    onChange,
  }: {
    readonly onChange: (changes: {
      readonly fields: never[];
      readonly isDistinct: boolean | null;
      readonly searchSynonymy: null;
      readonly isSeries: null;
    }) => void;
  }) => {
    const React = jest.requireActual<typeof import('react')>('react');
    React.useEffect(() => {
      onChange({
        fields: [],
        isDistinct: null,
        searchSynonymy: null,
        isSeries: null,
      });
      onChange({
        fields: [],
        isDistinct: null,
        searchSynonymy: null,
        isSeries: null,
      });
    }, []);
    return (
      <button
        type="button"
        onClick={() =>
          onChange({
            fields: [],
            isDistinct: true,
            searchSynonymy: null,
            isSeries: null,
          })
        }
      >
        Change query
      </button>
    );
  },
}));

test('shows stored query badges on initial load without opening a table', () => {
  const { getByRole } = mount(
    <DataViewQueryEditorContent
      data={JSON.stringify({
        version: 1,
        queries: { Loan: { fields: [{ fieldName: 'LoanNumber' }] } },
      })}
      onChange={jest.fn()}
    />
  );

  expect(
    getByRole('button', { name: /^Loan$/ }).querySelector('.bg-brand-400')
  ).not.toBeNull();
  expect(
    getByRole('button', { name: /^Agent$/ }).querySelector('.bg-brand-400')
  ).toBeNull();
});

test('does not badge default queries absent from the editable resource', () => {
  const { getByRole } = mount(
    <DataViewQueryEditorContent
      data={JSON.stringify({ version: 1, queries: {} })}
      onChange={jest.fn()}
    />
  );

  expect(
    getByRole('button', { name: /^Loan$/ }).querySelector('.bg-brand-400')
  ).toBeNull();
  expect(
    getByRole('button', { name: /^Agent$/ }).querySelector('.bg-brand-400')
  ).toBeNull();
});

test('opening an unconfigured table does not create a query badge', async () => {
  const onChange = jest.fn();
  const { getByRole, user } = mount(
    <DataViewQueryEditorContent
      data={JSON.stringify({ version: 1, queries: {} })}
      onChange={onChange}
    />
  );

  await user.click(getByRole('button', { name: /^Loan$/ }));
  expect(onChange).not.toHaveBeenCalled();
  expect(
    getByRole('button', { name: /^Loan$/ }).querySelector('.bg-brand-400')
  ).toBeNull();

  await user.click(getByRole('button', { name: 'Change query' }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(
    getByRole('button', { name: /^Loan$/ }).querySelector('.bg-brand-400')
  ).not.toBeNull();
});
