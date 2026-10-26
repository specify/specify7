import { cleanup, fireEvent } from '@testing-library/react';
import React from 'react';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { userPreferences } from '../../Preferences/userPreferences';
import type { AutoCompleteItem } from '../AutoComplete';
import { AutoComplete } from '../AutoComplete';

requireContext();

describe('AutoComplete remote contains results', () => {
  let originalPreferences: ReturnType<typeof userPreferences.getRaw>;
  const portalRoot = document.createElement('div');

  beforeAll(() => {
    portalRoot.id = 'portal-root';
    document.body.append(portalRoot);
  });

  afterAll(() => {
    portalRoot.remove();
  });

  beforeEach(() => {
    originalPreferences = userPreferences.getRaw();
    userPreferences.setRaw({
      form: { autoComplete: { searchAlgorithm: 'startsWith' } },
    });
  });

  afterEach(() => {
    cleanup();
    userPreferences.setRaw(originalPreferences);
  });

  test('does not prefix-filter substring matches returned by the server', async () => {
    const source = jest.fn(async () => [
      { label: 'Hydrolea palustris', data: '1' },
      { label: 'Bacopa hydrolea', data: '2' },
    ]);
    const onChange = jest.fn();
    const { getByRole, findByRole, user } = mount(
      <AutoComplete
        delay={0}
        filterItems={false}
        source={source}
        value=""
        onChange={onChange}
      />
    );

    await user.type(getByRole('combobox'), 'hydrolea');

    const substringMatch = await findByRole('option', {
      name: 'Bacopa hydrolea',
    });
    expect(source).toHaveBeenLastCalledWith('hydrolea');
    expect(
      getByRole('option', { name: 'Hydrolea palustris' })
    ).toBeInTheDocument();

    await user.click(substringMatch);

    expect(onChange).toHaveBeenCalledWith({
      label: 'Bacopa hydrolea',
      data: '2',
    });
  });

  test('shows and selects subsequent-page substring matches while searching', async () => {
    const source = jest.fn(async () => [
      { label: 'Hydrolea palustris', data: '1' },
    ]);
    const onChange = jest.fn();
    const onScrollEnd = jest.fn();
    function PaginatedAutoComplete({
      extraItems,
    }: {
      readonly extraItems: ReadonlyArray<AutoCompleteItem<string>>;
    }): JSX.Element {
      const [value, setValue] = React.useState('');
      return (
        <AutoComplete
          delay={0}
          extraItems={extraItems}
          filterItems={false}
          source={source}
          value={value}
          onChange={(item) => {
            setValue(item.label.toString());
            onChange(item);
          }}
          onScrollEnd={onScrollEnd}
        />
      );
    }
    const { getByRole, findByRole, rerender, user } = mount(
      <PaginatedAutoComplete extraItems={[]} />
    );

    await user.type(getByRole('combobox'), 'hydrolea');
    await findByRole('option', { name: 'Hydrolea palustris' });

    fireEvent.scroll(getByRole('listbox'));
    expect(onScrollEnd).toHaveBeenCalledTimes(1);

    rerender(
      <PaginatedAutoComplete
        extraItems={[{ label: 'Bacopa hydrolea', data: '2' }]}
      />
    );

    await user.click(await findByRole('option', { name: 'Bacopa hydrolea' }));

    expect(getByRole('combobox')).toHaveValue('Bacopa hydrolea');
    expect(onChange).toHaveBeenCalledWith({
      label: 'Bacopa hydrolea',
      data: '2',
    });
    expect(source).toHaveBeenLastCalledWith('hydrolea');
  });

  test.each([
    ['initial page', false],
    ['appended page', true],
  ] as const)(
    'updates selected-option state when %s results arrive or change',
    async (_page, appended) => {
      const renderAutoComplete = (
        items: ReadonlyArray<AutoCompleteItem<string>>
      ) => (
        <AutoComplete
          extraItems={appended ? items : undefined}
          filterItems={false}
          source={appended ? [] : items}
          value="Bacopa hydrolea"
          onChange={jest.fn()}
        />
      );
      const { getByRole, findByRole, rerender, user } = mount(
        renderAutoComplete([])
      );

      rerender(renderAutoComplete([{ label: 'Bacopa hydrolea', data: '2' }]));
      await user.click(getByRole('button', { name: 'Expand' }));
      expect(
        await findByRole('option', { name: 'Bacopa hydrolea' })
      ).toHaveAttribute('aria-selected', 'true');

      rerender(renderAutoComplete([{ label: 'Bacopa hydrolea', data: '2' }]));
      expect(
        await findByRole('option', { name: 'Bacopa hydrolea' })
      ).toHaveAttribute('aria-selected', 'true');

      rerender(renderAutoComplete([{ label: 'Bacopa hydrolea', data: '3' }]));
      expect(
        await findByRole('option', { name: 'Bacopa hydrolea' })
      ).toHaveAttribute('aria-selected', 'true');
    }
  );

  test.each([
    ['startsWith', ['Hydrolea palustris', 'hydrolea ovata']],
    ['startsWithCaseSensitive', ['hydrolea ovata']],
    ['contains', ['Hydrolea palustris', 'hydrolea ovata', 'Bacopa hydrolea']],
    ['containsCaseSensitive', ['hydrolea ovata', 'Bacopa hydrolea']],
  ] as const)(
    'applies %s filtering to initial and subsequent pages',
    async (searchAlgorithm, expectedLabels) => {
      userPreferences.setRaw({
        form: { autoComplete: { searchAlgorithm } },
      });
      const source = jest.fn(async () => [
        { label: 'Hydrolea palustris', data: '1' },
        { label: 'Rosa canina', data: '2' },
      ]);
      const onChange = jest.fn();
      const renderAutoComplete = (
        extraItems: ReadonlyArray<AutoCompleteItem<string>>
      ) => (
        <AutoComplete
          delay={0}
          extraItems={extraItems}
          filterItems
          source={source}
          value=""
          onChange={onChange}
        />
      );
      const { getByRole, findByRole, getAllByRole, rerender, user } = mount(
        renderAutoComplete([])
      );

      await user.type(getByRole('combobox'), 'hydrolea');
      rerender(
        renderAutoComplete([
          { label: 'hydrolea ovata', data: '3' },
          { label: 'Bacopa hydrolea', data: '4' },
          { label: 'Rosa rubiginosa', data: '5' },
        ])
      );

      await findByRole('option', { name: 'hydrolea ovata' });

      expect(
        getAllByRole('option').map(({ textContent }) => textContent)
      ).toEqual(expectedLabels);
    }
  );

  test('does not offer to add a value already present on a subsequent page', async () => {
    const source = jest.fn(async () => [
      { label: 'Hydrolea palustris', data: '1' },
    ]);
    const { getByRole, findByRole, queryByRole, rerender, user } = mount(
      <AutoComplete
        delay={0}
        filterItems={false}
        source={source}
        value=""
        onChange={jest.fn()}
        onNewValue={jest.fn()}
      />
    );

    await user.type(getByRole('combobox'), 'hydrolea');
    await findByRole('option', { name: 'Hydrolea palustris' });
    expect(getByRole('option', { name: /add/i })).toBeInTheDocument();
    rerender(
      <AutoComplete
        delay={0}
        extraItems={[{ label: 'hydrolea', data: '2' }]}
        filterItems={false}
        source={source}
        value=""
        onChange={jest.fn()}
        onNewValue={jest.fn()}
      />
    );

    await findByRole('option', { name: 'hydrolea' });

    expect(queryByRole('option', { name: /add/i })).not.toBeInTheDocument();
  });
});

describe('AutoComplete keyboard navigation', () => {
  const scrollIntoView = jest.fn();
  const portalRoot = document.createElement('div');

  beforeAll(() => {
    portalRoot.id = 'portal-root';
    document.body.append(portalRoot);
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterAll(() => {
    portalRoot.remove();
  });

  beforeEach(() => {
    scrollIntoView.mockClear();
  });

  afterEach(() => {
    cleanup();
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
});
