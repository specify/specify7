import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { commonText } from '../../../localization/common';
import { resourcesText } from '../../../localization/resources';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { getCache, setCache } from '../../../utils/cache';
import { hasPermission } from '../../Permissions/helpers';
import { defaultAppResourceFilters } from '../filtersHelpers';
import { AppResourcesView } from '../index';
import { testAppResources } from './testAppResources';

requireContext();

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(() => true),
  hasToolPermission: jest.fn(() => true),
}));

beforeEach(() => {
  (hasPermission as jest.Mock).mockReturnValue(true);
  setCache('appResources', 'sidebarCollapsed', false, false);
  setCache('appResources', 'conformation', [], false);
  setCache('appResources', 'filters', defaultAppResourceFilters, false);
});

function Workspace(): JSX.Element {
  return (
    <MemoryRouter initialEntries={['/specify/resources/']}>
      <Routes>
        <Route
          element={<AppResourcesView getSet={[testAppResources, jest.fn()]} />}
          path="/specify/resources/"
        >
          <Route
            index
            element={<input aria-label="Resource data" defaultValue="" />}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test('hides and restores the sidebar without resetting the tree or editor', async () => {
  const { getByRole, queryByRole, user } = mount(<Workspace />);
  const sidebar = getByRole('complementary', { name: 'Resources' });
  const tree = getByRole('tree');
  const editor = getByRole('textbox', { name: 'Resource data' });
  const appResourcesFilter = getByRole('radio', { name: 'App Resources' });
  expect(appResourcesFilter).toBeVisible();
  await user.type(editor, 'Unsaved changes');
  await user.click(getByRole('button', { name: 'Global Resources (2)' }));
  const category = getByRole('button', { name: 'Global Resources (2)' });
  expect(category.closest('[role="treeitem"]')).toHaveAttribute(
    'aria-expanded',
    'true'
  );

  const toggle = getByRole('button', {
    name: resourcesText.hideResourceSidebar(),
  });
  expect(toggle).toHaveTextContent('Resources');
  expect(toggle).toHaveAttribute('aria-controls', sidebar.parentElement!.id);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await user.click(toggle);
  expect(queryByRole('complementary')).not.toBeInTheDocument();
  expect(
    queryByRole('radio', { name: 'App Resources' })
  ).not.toBeInTheDocument();
  expect(toggle).toHaveFocus();
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveTextContent('Resources');
  expect(editor).toHaveValue('Unsaved changes');
  expect(getCache('appResources', 'sidebarCollapsed')).toBe(true);

  await user.keyboard('{Enter}');
  expect(getByRole('complementary')).toBe(sidebar);
  expect(getByRole('tree')).toBe(tree);
  expect(getByRole('radio', { name: 'App Resources' })).toBe(
    appResourcesFilter
  );
  expect(getByRole('textbox', { name: 'Resource data' })).toBe(editor);
  expect(category.closest('[role="treeitem"]')).toHaveAttribute(
    'aria-expanded',
    'true'
  );
  expect(editor).toHaveValue('Unsaved changes');
});

test('remembers the collapsed sidebar when the workspace is reopened', () => {
  setCache('appResources', 'sidebarCollapsed', true, false);
  const { getByRole, queryByRole } = mount(<Workspace />);
  expect(
    getByRole('button', { name: resourcesText.showResourceSidebar() })
  ).toHaveAttribute('aria-expanded', 'false');
  expect(queryByRole('complementary')).not.toBeInTheDocument();
  expect(getByRole('textbox', { name: 'Resource data' })).toBeInTheDocument();
});

test('finds resources in collapsed groups and restores the tree when cleared', async () => {
  const { getByRole, queryByRole, user } = mount(<Workspace />);
  const editor = getByRole('textbox', { name: 'Resource data' });
  await user.type(editor, 'Unsaved changes');
  await user.click(getByRole('button', { name: 'Global Resources (2)' }));
  const originalConformation = getCache('appResources', 'conformation');
  const search = getByRole('searchbox', {
    name: resourcesText.searchResources(),
  });
  await user.type(search, '  QUERYEXTRA  ');
  expect(getByRole('link', { name: 'QueryExtraList' })).toBeInTheDocument();
  expect(
    queryByRole('link', { name: 'QueryFreqList' })
  ).not.toBeInTheDocument();
  expect(
    queryByRole('button', { name: /^Global Resources/ })
  ).not.toBeInTheDocument();
  expect(getCache('appResources', 'conformation')).toEqual(
    originalConformation
  );
  expect(editor).toHaveValue('Unsaved changes');
  await user.clear(search);
  expect(getByRole('link', { name: 'Global Preferences' })).toBeInTheDocument();
  expect(
    queryByRole('link', { name: 'QueryExtraList' })
  ).not.toBeInTheDocument();
  expect(getCache('appResources', 'conformation')).toEqual(
    originalConformation
  );
});

test('search respects type filters and reports when there are no matching resources', async () => {
  const { getByRole, queryByRole, user } = mount(<Workspace />);
  await user.type(
    getByRole('searchbox', { name: resourcesText.searchResources() }),
    'QueryFreq'
  );
  expect(getByRole('link', { name: 'QueryFreqList' })).toBeInTheDocument();
  await user.click(getByRole('radio', { name: 'Forms' }));
  expect(getByRole('status')).toHaveTextContent(commonText.noResults());
  expect(
    queryByRole('link', { name: 'QueryFreqList' })
  ).not.toBeInTheDocument();
  await user.click(getByRole('radio', { name: resourcesText.allResources() }));
  expect(getByRole('link', { name: 'QueryFreqList' })).toBeInTheDocument();
  expect(queryByRole('status')).not.toBeInTheDocument();
});

test('search does not reveal resources excluded by permissions', async () => {
  (hasPermission as jest.Mock).mockReturnValue(false);
  const { getByRole, queryByRole, user } = mount(<Workspace />);
  await user.type(
    getByRole('searchbox', { name: resourcesText.searchResources() }),
    'CollectionPreferences'
  );
  expect(getByRole('status')).toHaveTextContent(commonText.noResults());
  expect(
    queryByRole('link', { name: 'Collection Preferences' })
  ).not.toBeInTheDocument();
});
