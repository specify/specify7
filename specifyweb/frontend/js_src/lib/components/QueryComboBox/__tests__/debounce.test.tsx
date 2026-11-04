import { act, cleanup, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { localized } from '../../../utils/types';
import * as collection from '../../DataModel/collection';
import { tables } from '../../DataModel/tables';
import { runQuery } from '../../QueryBuilder/ResultsWrapper';
import { TreeViewSearch } from '../../TreeView/Search';
import { QueryComboBox } from '../index';

jest.mock('underscore', () => {
  // Underscore captures Date.now at import time; keep it tied to Jest's clock.
  const originalNow = Date.now;
  Date.now = () => new Date().getTime();
  try {
    return jest.requireActual('underscore');
  } finally {
    Date.now = originalNow;
  }
});

jest.mock('../../QueryBuilder/ResultsWrapper', () => ({
  runQuery: jest.fn(),
}));

requireContext();

const portalRoot = document.createElement('div');

beforeAll(() => {
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});

afterAll(() => {
  portalRoot.remove();
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

async function advanceTime(milliseconds: number): Promise<void> {
  await act(async () => {
    jest.advanceTimersByTime(milliseconds);
  });
}

test.each([
  ['taxon', 500],
  ['determiner', 300],
] as const)(
  '%s QueryComboBox waits %i ms after typing stops',
  async (fieldName, delay) => {
    const field = tables.Determination.strictGetRelationship(fieldName);
    const table = field.relatedTable;
    jest.mocked(runQuery).mockReset().mockResolvedValue([]);
    const { getByRole, unmount } = mount(
      <QueryComboBox
        field={field}
        forceCollection={undefined}
        formType="form"
        hasNewButton={false}
        hasSearchButton={false}
        id={undefined}
        isRequired={false}
        resource={
          new tables.Determination.Resource({}, { noBusinessRules: true })
        }
        typeSearch={{
          table,
          searchFields: [
            [
              table.strictGetLiteralField(
                fieldName === 'taxon' ? 'fullName' : 'lastName'
              ),
            ],
          ],
          name: localized(table.name),
          title: localized(table.name),
          formatter: localized(''),
          displayFields: undefined,
          format: localized('%s'),
        }}
      />
    );
    const input = getByRole('combobox');
    await waitFor(() => expect(input).toBeEnabled());
    jest.useFakeTimers();

    fireEvent.change(input, { target: { value: 'ro' } });
    await advanceTime(delay - 1);
    expect(runQuery).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'ros' } });
    await advanceTime(delay - 1);
    expect(runQuery).not.toHaveBeenCalled();

    fireEvent.change(input, { target: { value: 'rosa' } });
    await advanceTime(delay - 1);
    expect(runQuery).not.toHaveBeenCalled();
    await advanceTime(1);

    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(jest.mocked(runQuery).mock.calls[0][0].fields).toEqual(
      expect.arrayContaining([expect.objectContaining({ startValue: 'rosa' })])
    );

    jest.mocked(runQuery).mockClear();
    fireEvent.change(input, { target: { value: 'rosaceae' } });
    unmount();
    await advanceTime(delay);
    expect(runQuery).not.toHaveBeenCalled();
  }
);

test('tree editor waits 500 ms after the last keystroke', async () => {
  const fetchCollection = jest
    .spyOn(collection, 'fetchCollection')
    .mockResolvedValue({ records: [], totalCount: 0 });
  const { getByRole, unmount } = mount(
    <TreeViewSearch
      forwardRef={React.createRef<HTMLInputElement>()}
      tableName="Taxon"
      treeDefinitionId={1}
      treeDefinitionItems={[]}
      onFocusPath={jest.fn()}
    />
  );
  const input = getByRole('combobox');
  jest.useFakeTimers();

  fireEvent.change(input, { target: { value: 'ro' } });
  await advanceTime(499);
  expect(fetchCollection).not.toHaveBeenCalled();

  fireEvent.change(input, { target: { value: 'rosa' } });
  await advanceTime(499);
  expect(fetchCollection).not.toHaveBeenCalled();
  await advanceTime(1);

  expect(fetchCollection).toHaveBeenCalledTimes(1);
  expect(fetchCollection).toHaveBeenCalledWith(
    'Taxon',
    expect.objectContaining({ definition: 1 }),
    { name__istartsWith: 'rosa' }
  );

  fetchCollection.mockClear();
  fireEvent.change(input, { target: { value: 'rosaceae' } });
  unmount();
  await advanceTime(500);
  expect(fetchCollection).not.toHaveBeenCalled();
});
