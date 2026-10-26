import { cleanup, screen } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { AutoComplete } from '../AutoComplete';
import type { AutoCompleteItem } from '../AutoComplete';

requireContext();

const items: readonly AutoCompleteItem<number>[] = [
  { label: 'First result', data: 1 },
  { label: 'Second result', data: 2 },
  { label: 'Third result', data: 3 },
];

const scrollIntoView = jest.fn();

beforeAll(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});

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
  cleanup();
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
  expect(
    screen
      .getAllByRole('option')
      .filter((option) => option.classList.contains('bg-gray-100'))
  ).toEqual([screen.getByRole('option', { name: 'Second result' })]);
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

test.each(['Home', 'End'])(
  'Shift+%s preserves the active result',
  async (key) => {
    const onChange = jest.fn();
    const { user } = renderAutoComplete(onChange);
    const input = screen.getByRole('combobox');

    await user.type(input, 'x');
    await screen.findAllByRole('option');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard(`{Shift>}{${key}}{/Shift}`);
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(items[1]);
  }
);

test('ArrowDown navigates beyond 50 results without unmounting earlier options', async () => {
  const manyItems = Array.from({ length: 100 }, (_, index) => ({
    label: `Result ${index + 1}`,
    data: index + 1,
  }));
  const onChange = jest.fn();
  const { user } = mount(
    <AutoComplete
      filterItems={false}
      onChange={onChange}
      source={manyItems}
      value=""
    />
  );
  const input = screen.getByRole('combobox');

  await user.type(input, 'x');
  expect(await screen.findAllByRole('option')).toHaveLength(100);
  for (let index = 0; index < 55; index++)
    await user.keyboard('{ArrowDown}');

  expect(input).toHaveAttribute(
    'aria-activedescendant',
    screen.getByRole('option', { name: 'Result 55' }).id
  );
  expect(screen.getAllByRole('option')).toHaveLength(100);
  await user.keyboard('{Enter}');

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(manyItems[54]);
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

test('End selects the final result in a long list before the trailing Add option', async () => {
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

describe('AutoComplete keyboard navigation', () => {
  beforeEach(() => {
    scrollIntoView.mockClear();
  });

  const makeItems = (count: number): ReadonlyArray<AutoCompleteItem<string>> =>
    Array.from({ length: count }, (_, index) => ({
      label: `Item ${index}`,
      data: String(index),
    }));

  const scrolledIndexes = (): ReadonlyArray<string | null> =>
    scrollIntoView.mock.instances.map((element: Element) =>
      element.getAttribute('data-index')
    );

  test('scrolls the highlighted row into view with arrow keys', async () => {
    const { getByRole, user } = mount(
      <AutoComplete
        delay={0}
        filterItems={false}
        source={makeItems(10)}
        value=""
        onChange={jest.fn()}
      />
    );

    await user.type(getByRole('combobox'), 'i');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    expect(scrolledIndexes()).toContain('1');
  });

  test('resets the highlighted row when the results are replaced', async () => {
    const { getByRole, rerender, user } = mount(
      <AutoComplete
        delay={0}
        filterItems={false}
        source={makeItems(10)}
        value=""
        onChange={jest.fn()}
      />
    );

    await user.type(getByRole('combobox'), 'i');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    expect(scrolledIndexes()).toContain('1');

    rerender(
      <AutoComplete
        delay={0}
        filterItems={false}
        source={makeItems(10).map((item) => ({
          ...item,
          label: `Renamed ${item.data}`,
        }))}
        value=""
        onChange={jest.fn()}
      />
    );
    // Let Headless UI flush its own pending scrollIntoView before measuring ours
    await new Promise((resolve) => setTimeout(resolve, 100));
    scrollIntoView.mockClear();
    await user.keyboard('{ArrowDown}');

    expect(scrolledIndexes()).toEqual(['0']);
  });
});
