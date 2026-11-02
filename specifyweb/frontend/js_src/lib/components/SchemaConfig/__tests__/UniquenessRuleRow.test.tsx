import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { schemaText } from '../../../localization/schema';
import { requireContext } from '../../../tests/helpers';
import { tables } from '../../DataModel/tables';
import type { UniquenessRule } from '../../DataModel/uniquenessRules';
import { downloadFile } from '../../Molecules/FilePicker';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { UniquenessRuleRow } from '../UniquenessRuleRow';

jest.mock('../../Molecules/FilePicker', () => ({
  ...jest.requireActual('../../Molecules/FilePicker'),
  downloadFile: jest.fn().mockResolvedValue(undefined),
}));

requireContext();

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: jest.fn(),
  });
});
afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});

const rule: UniquenessRule = {
  id: 42,
  modelName: 'CollectionObject',
  fields: ['text1'],
  scopes: [],
  isDatabaseConstraint: false,
};

function renderRow(
  {
    readOnly = false,
    databaseConstraint = false,
    duplicates = false,
  } = {},
  rowRule: UniquenessRule = rule
) {
  const onChange = jest.fn();
  const table = tables.CollectionObject;
  const renderRowElement = (currentRule: UniquenessRule): JSX.Element => (
    <table>
      <tbody>
        <UniquenessRuleRow
          fetchedDuplicates={
            duplicates
              ? {
                  totalDuplicates: 5,
                  fields: [
                    { duplicates: 3, fields: { text1: 'alpha,quoted' } },
                    { duplicates: 2, fields: { text1: 'beta' } },
                  ],
                }
              : { totalDuplicates: 0, fields: [] }
          }
          fields={table.literalFields}
          formId="uniqueness-test"
          isReadOnly={readOnly}
          relationships={table.relationships}
          rule={{ ...currentRule, isDatabaseConstraint: databaseConstraint }}
          table={table}
          onChange={onChange}
          onRemoved={jest.fn()}
        />
      </tbody>
    </table>
  );
  const result = render(renderRowElement(rowRule), {
    wrapper: ({ children }) => (
      <UnloadProtectsContext.Provider value={[]}>
        {children}
      </UnloadProtectsContext.Provider>
    ),
  });
  return {
    ...result,
    onChange,
    rerenderRow: (currentRule: UniquenessRule): void =>
      result.rerender(renderRowElement(currentRule)),
  };
}

test('edits a field and selects a boolean field in the same grouped rule', () => {
  const { onChange, rerenderRow } = renderRow();
  fireEvent.click(screen.getByRole('button'));
  const select = screen.getByRole('combobox');
  fireEvent.change(select, { target: { value: 'yesNo1' } });
  expect(onChange).toHaveBeenLastCalledWith({ ...rule, fields: ['yesNo1'] });
  rerenderRow({ ...rule, fields: ['yesNo1'] });
  fireEvent.click(screen.getByRole('button', { name: commonText.add() }));
  const changed = onChange.mock.calls.at(-1)![0];
  expect(changed.id).toBe(rule.id);
  expect(changed.fields).toHaveLength(2);
  expect(changed.fields[0]).toBe('yesNo1');
  expect(changed.fields[1]).not.toBe('yesNo1');
  expect(changed.scopes).toEqual([]);
});

test('selects a supported collection scope in the configuration interface', () => {
  const { onChange } = renderRow();
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(
    screen.getByText(
      tables.CollectionObject.getRelationship('collection')!.label,
      { selector: 'span' }
    )
  );
  fireEvent.click(screen.getByRole('button', { name: schemaText.setScope() }));
  expect(onChange).toHaveBeenLastCalledWith({
    ...rule,
    scopes: ['collection'],
  });
});

test.each([
  { readOnly: true, databaseConstraint: false },
  { readOnly: false, databaseConstraint: true },
])(
  'hides editing for readOnly=$readOnly, databaseConstraint=$databaseConstraint',
  (options) => {
    const { container } = renderRow(options);
    expect(within(container).queryByRole('button')).not.toBeInTheDocument();
    expect(
      within(container)
        .getAllByRole('textbox')
        .every((input) => input.hasAttribute('readonly'))
    ).toBe(true);
  }
);

test('exports the actual two-column CSV with headers and every duplicate group', async () => {
  renderRow({ duplicates: true });
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(
    screen.getByRole('button', { name: schemaText.exportDuplicates() })
  );
  await waitFor(() => expect(downloadFile).toHaveBeenCalledTimes(1));
  expect(downloadFile).toHaveBeenCalledWith(
    expect.stringMatching(/\.csv$/u),
    'Number of Duplicates,text1\n3,"""alpha,quoted"""\n2,"""beta"""\n'
  );
});
