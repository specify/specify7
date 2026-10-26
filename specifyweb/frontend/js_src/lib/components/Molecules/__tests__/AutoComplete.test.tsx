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
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'First result' }).id
  );
  await user.keyboard('{ArrowDown}');
  expect(input).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Second result' }).id
  );
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

test('initial ArrowUp stays synchronized with the first active result', async () => {
  const onChange = jest.fn();
  const onNewValue = jest.fn();
  const { user } = mount(
    <AutoComplete
      filterItems={false}
      onChange={onChange}
      onNewValue={onNewValue}
      source={items}
      value=""
    />
  );
  const input = screen.getByRole('combobox');

  await user.click(input);
  await user.type(input, 'x');
  await screen.findAllByRole('option');
  await user.keyboard('{ArrowUp}');
  await user.keyboard('{Enter}');

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(items[0]);
  expect(onNewValue).not.toHaveBeenCalled();
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

test('ArrowDown can highlight the Add option after the results', async () => {
  const onChange = jest.fn();
  const onNewValue = jest.fn();
  const { user } = mount(
    <AutoComplete
      filterItems={false}
      onChange={onChange}
      onNewValue={onNewValue}
      source={items}
      value=""
    />
  );
  const input = screen.getByRole('combobox');

  await user.click(input);
  await user.type(input, 'x');
  await screen.findAllByRole('option');
  for (let index = 0; index <= items.length; index++)
    await user.keyboard('{ArrowDown}');
  await user.keyboard('{Enter}');

  expect(onChange).not.toHaveBeenCalled();
  expect(onNewValue).toHaveBeenCalledTimes(1);
  expect(onNewValue).toHaveBeenCalledWith('x');
});

test('End selects the last result before the trailing Add option', async () => {
  const onChange = jest.fn();
  const onNewValue = jest.fn();
  const { user } = mount(
    <AutoComplete
      filterItems={false}
      onChange={onChange}
      onNewValue={onNewValue}
      source={items}
      value=""
    />
  );
  const input = screen.getByRole('combobox');

  await user.click(input);
  await user.type(input, 'x');
  await screen.findAllByRole('option');
  await user.keyboard('{End}');
  await user.keyboard('{Enter}');

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(items[2]);
  expect(onNewValue).not.toHaveBeenCalled();
});

test('End selects the final virtualized result before the trailing Add option', async () => {
  const manyItems = Array.from({ length: 100 }, (_, index) => ({
    label: `Result ${index + 1}`,
    data: index + 1,
  }));
  const onChange = jest.fn();
  const onNewValue = jest.fn();
  const { user } = mount(
    <AutoComplete
      filterItems={false}
      onChange={onChange}
      onNewValue={onNewValue}
      source={manyItems}
      value=""
    />
  );
  const input = screen.getByRole('combobox');

  await user.click(input);
  await user.type(input, 'x');
  await screen.findAllByRole('option');
  await user.keyboard('{End}');
  await user.keyboard('{Enter}');

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(manyItems.at(-1));
  expect(onNewValue).not.toHaveBeenCalled();
});
