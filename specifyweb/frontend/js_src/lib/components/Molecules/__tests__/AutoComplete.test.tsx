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
    const renderAutoComplete = (
      extraItems: ReadonlyArray<AutoCompleteItem<string>>
    ) => (
      <AutoComplete
        delay={0}
        extraItems={extraItems}
        filterItems={false}
        source={source}
        value=""
        onChange={onChange}
        onScrollEnd={onScrollEnd}
      />
    );
    const { getByRole, findByRole, rerender, user } = mount(
      renderAutoComplete([])
    );

    await user.type(getByRole('combobox'), 'hydrolea');
    await findByRole('option', { name: 'Hydrolea palustris' });

    fireEvent.scroll(getByRole('listbox'));
    expect(onScrollEnd).toHaveBeenCalledTimes(1);

    rerender(renderAutoComplete([{ label: 'Bacopa hydrolea', data: '2' }]));

    await user.click(await findByRole('option', { name: 'Bacopa hydrolea' }));

    expect(getByRole('combobox')).toHaveValue('Bacopa hydrolea');
    expect(onChange).toHaveBeenCalledWith({
      label: 'Bacopa hydrolea',
      data: '2',
    });
    expect(source).toHaveBeenLastCalledWith('hydrolea');
  });
});
