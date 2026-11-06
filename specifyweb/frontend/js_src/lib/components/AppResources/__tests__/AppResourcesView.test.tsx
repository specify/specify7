import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { getCache, setCache } from '../../../utils/cache';
import { AppResourcesView } from '../index';
import { defaultAppResourceFilters } from '../filtersHelpers';
import { testAppResources } from './testAppResources';

requireContext();

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(() => true),
  hasToolPermission: jest.fn(() => true),
}));

beforeEach(() => {
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

  const toggle = getByRole('button', { name: 'Hide resource sidebar' });
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
    getByRole('button', { name: 'Show resource sidebar' })
  ).toHaveAttribute('aria-expanded', 'false');
  expect(queryByRole('complementary')).not.toBeInTheDocument();
  expect(getByRole('textbox', { name: 'Resource data' })).toBeInTheDocument();
});
