import { screen } from '@testing-library/react';
import React from 'react';

import { mount } from '../../../tests/reactUtils';
import { AutoComplete } from '../AutoComplete';
import type { AutoCompleteItem } from '../AutoComplete';

const items: readonly AutoCompleteItem<number>[] = [
  { label: 'First result', data: 1 },
  { label: 'Second result', data: 2 },
  { label: 'Third result', data: 3 },
];

function renderAutoComplete(
  onChange: (item: AutoCompleteItem<number>) => void
) {
  return mount(
    <AutoComplete
      filterItems={false}
      onChange={onChange}
      source={items}
      value=""
    />
  );
}

beforeEach(() => {
  document.body.insertAdjacentHTML('beforeend', '<div id="portal-root"></div>');
});

afterEach(() => {
  document.getElementById('portal-root')?.remove();
});

test('selects the highlighted result after repeated ArrowDown presses', async () => {
  const onChange = jest.fn();
  const { user } = renderAutoComplete(onChange);
  const input = screen.getByRole('combobox');

  await user.click(input);
  await user.type(input, 'x');
  expect(document.activeElement).toBe(input);
  await screen.findAllByRole('option');
  await user.keyboard('{ArrowDown}');
  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute('aria-activedescendant');
  await user.keyboard('{Enter}');

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(items[1]);
});

test('selects the previous highlighted result after ArrowUp', async () => {
  const onChange = jest.fn();
  const { user } = renderAutoComplete(onChange);
  const input = screen.getByRole('combobox');

  await user.click(input);
  await user.type(input, 'x');
  expect(document.activeElement).toBe(input);
  await screen.findAllByRole('option');
  for (const key of [
    '{ArrowDown}',
    '{ArrowDown}',
    '{ArrowDown}',
    '{ArrowUp}',
    '{Enter}',
  ])
    await user.keyboard(key);

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(items[1]);
});

test.each([
  ['Home', 0],
  ['End', 2],
] as const)('selects the boundary option with %s', async (key, index) => {
  const onChange = jest.fn();
  const { user } = renderAutoComplete(onChange);
  const input = screen.getByRole('combobox');

  await user.click(input);
  await user.type(input, 'x');
  await screen.findAllByRole('option');
  await user.keyboard(`{${key}}`);
  await user.keyboard('{Enter}');

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(items[index]);
});
