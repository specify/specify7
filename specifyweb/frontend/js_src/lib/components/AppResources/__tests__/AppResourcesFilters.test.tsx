import React from 'react';

import { mount } from '../../../tests/reactUtils';
import { getCache, setCache } from '../../../utils/cache';
import { hasPermission } from '../../Permissions/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { AppResourcesFilters } from '../Filters';
import { allAppResources, defaultAppResourceFilters } from '../filtersHelpers';
import { testAppResources } from './testAppResources';

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(() => true),
}));

beforeEach(() => {
  (hasPermission as jest.Mock).mockReturnValue(true);
  setCache('appResources', 'filters', defaultAppResourceFilters, false);
});

function Filters(): JSX.Element {
  return (
    <UnloadProtectsContext.Provider value={[]}>
      <AppResourcesFilters initialResources={testAppResources} />
    </UnloadProtectsContext.Provider>
  );
}

describe('AppResourcesFilters', () => {
  test('simple render', () => {
    const { asFragment, getByRole, queryByRole } = mount(<Filters />);
    expect(getByRole('group', { name: 'Show resources' })).toBeInTheDocument();
    expect(getByRole('radio', { name: 'All resources' })).toBeChecked();
    expect(getByRole('button', { name: 'Filter by type…' })).toHaveAttribute(
      'aria-pressed',
      'false'
    );
    expect(queryByRole('status')).not.toBeInTheDocument();
    expect(asFragment()).toMatchSnapshot();
  });

  test('selects presets without deselecting an active choice', async () => {
    const { getByRole, user } = mount(<Filters />);
    const forms = getByRole('radio', { name: 'Forms' });
    await user.click(forms);
    await user.click(forms);
    expect(forms).toBeChecked();
    expect(getCache('appResources', 'filters')).toEqual({
      viewSets: true,
      appResources: [],
    });

    const apps = getByRole('radio', { name: 'App Resources' });
    await user.click(apps);
    await user.click(apps);
    expect(apps).toBeChecked();
    expect(forms).not.toBeChecked();
    expect(getCache('appResources', 'filters')).toEqual({
      viewSets: false,
      appResources: allAppResources,
    });

    const all = getByRole('radio', { name: 'All resources' });
    await user.click(all);
    await user.click(all);
    expect(all).toBeChecked();
    expect(getCache('appResources', 'filters')).toEqual(
      defaultAppResourceFilters
    );
  });

  test('supports keyboard selection', async () => {
    const { getByRole, user } = mount(<Filters />);
    getByRole('radio', { name: 'Forms' }).focus();
    await user.keyboard('[Space]');
    expect(getByRole('radio', { name: 'Forms' })).toBeChecked();
    getByRole('radio', { name: 'App Resources' }).focus();
    await user.keyboard('[Space]');
    expect(getByRole('radio', { name: 'App Resources' })).toBeChecked();
    expect(getCache('appResources', 'filters')?.viewSets).toBe(false);
  });

  test('highlights the custom gear and resets with All', async () => {
    const { user, getByRole, queryByRole, getAllByRole } = mount(<Filters />);
    await user.click(getByRole('button', { name: 'Filter by type…' }));
    await user.click(getByRole('checkbox', { name: /^App Resources \(/ }));
    await user.click(getByRole('checkbox', { name: /^Report \(/ }));
    expect(getCache('appResources', 'filters')).toEqual({
      appResources: ['report'],
      viewSets: true,
    });
    expect(
      getByRole('checkbox', { name: /^App Resources \(/ })
    ).toBePartiallyChecked();

    await user.click(getByRole('button', { name: 'Close' }));
    expect(queryByRole('status')).not.toBeInTheDocument();
    expect(queryByRole('button', { name: 'Show all' })).not.toBeInTheDocument();
    const customFilter = getByRole('button', { name: 'Filter by type…' });
    expect(customFilter).toHaveAttribute('aria-pressed', 'true');
    await user.click(customFilter);
    expect(getByRole('dialog', { name: 'Filters' })).toBeInTheDocument();
    expect(getByRole('checkbox', { name: /^Report \(/ })).toBeChecked();
    await user.click(getByRole('button', { name: 'Close' }));
    expect(
      getAllByRole('radio').every(
        (radio) => !(radio as HTMLInputElement).checked
      )
    ).toBe(true);
    await user.click(getByRole('radio', { name: 'All resources' }));
    expect(queryByRole('status')).not.toBeInTheDocument();
    expect(customFilter).toHaveAttribute('aria-pressed', 'false');
    expect(getByRole('radio', { name: 'All resources' })).toBeChecked();
    expect(getCache('appResources', 'filters')).toEqual(
      defaultAppResourceFilters
    );
  });

  test.each([
    { appResources: [], viewSets: false },
    { appResources: ['report'], viewSets: false },
  ] as const)(
    'restores cached custom filters and resets them: %j',
    async (filters) => {
      setCache('appResources', 'filters', filters, false);
      const { getByRole, user } = mount(<Filters />);
      expect(getByRole('button', { name: 'Filter by type…' })).toHaveAttribute(
        'aria-pressed',
        'true'
      );
      await user.click(getByRole('radio', { name: 'All resources' }));
      expect(getByRole('radio', { name: 'All resources' })).toBeChecked();
      expect(getCache('appResources', 'filters')).toEqual(
        defaultAppResourceFilters
      );
    }
  );

  test('recognizes presets using only permitted resource types', async () => {
    (hasPermission as jest.Mock).mockReturnValue(false);
    const { getByRole, queryByRole, user } = mount(<Filters />);
    expect(getByRole('radio', { name: 'All resources' })).toBeChecked();
    await user.click(getByRole('radio', { name: 'App Resources' }));
    expect(getByRole('radio', { name: 'App Resources' })).toBeChecked();
    expect(queryByRole('status')).not.toBeInTheDocument();
    expect(getCache('appResources', 'filters')?.appResources).not.toContain(
      'collectionPreferences'
    );
    await user.click(getByRole('radio', { name: 'All resources' }));
    expect(getByRole('radio', { name: 'All resources' })).toBeChecked();
    expect(queryByRole('status')).not.toBeInTheDocument();
    await user.click(getByRole('button', { name: 'Filter by type…' }));
    expect(
      queryByRole('checkbox', { name: /^Collection Preferences/ })
    ).not.toBeInTheDocument();
    expect(getByRole('checkbox', { name: /^App Resources \(/ })).toBeChecked();
  });
});
