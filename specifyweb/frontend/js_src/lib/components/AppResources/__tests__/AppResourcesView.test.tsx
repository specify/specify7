import { act, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';

import { useScreenSize } from '../../../hooks/useScreenSize';
import { commonText } from '../../../localization/common';
import { resourcesText } from '../../../localization/resources';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { getCache, setCache } from '../../../utils/cache';
import { hasPermission } from '../../Permissions/helpers';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import { defaultAppResourceFilters } from '../filtersHelpers';
import { AppResourcesView } from '../index';
import { testAppResources } from './testAppResources';

requireContext();

jest.mock('../../../hooks/useScreenSize', () => ({
  useScreenSize: jest.fn(() => true),
}));

jest.mock('../../Permissions/helpers', () => ({
  hasPermission: jest.fn(() => true),
  hasToolPermission: jest.fn(() => true),
}));

beforeEach(() => {
  (hasPermission as jest.Mock).mockReturnValue(true);
  (useScreenSize as jest.Mock).mockReturnValue(true);
  setCache('appResources', 'sidebarCollapsed', false, false);
  setCache('appResources', 'conformation', [], false);
  setCache('appResources', 'filters', defaultAppResourceFilters, false);
});

function NavigationCapture({
  onReady,
}: {
  readonly onReady: (navigate: ReturnType<typeof useNavigate>) => void;
}): null {
  const navigate = useNavigate();
  React.useEffect(() => onReady(navigate), [navigate, onReady]);
  return null;
}

function Workspace({
  onReady,
}: {
  readonly onReady?: (navigate: ReturnType<typeof useNavigate>) => void;
}): JSX.Element {
  return (
    <MemoryRouter initialEntries={['/specify/resources/']}>
      {onReady !== undefined && <NavigationCapture onReady={onReady} />}
      <Routes>
        <Route
          element={<AppResourcesView getSet={[testAppResources, jest.fn()]} />}
          path="/specify/resources/"
        >
          <Route
            index
            element={<input aria-label="Resource data" defaultValue="" />}
          />
          <Route path="app-resource/:id/" element={<p>Selected resource</p>} />
          <Route path="create/:directory/" element={<p>New resource</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

test('hides and restores the sidebar without resetting the tree or editor', async () => {
  const { getByRole, queryByRole, user } = mount(<Workspace />);
  const sidebar = getByRole('complementary', {
    name: resourcesText.browseResources(),
  });
  expect(
    getByRole('heading', { name: resourcesText.browseResources() })
  ).toBeVisible();
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
    name: resourcesText.browseResources(),
  });
  expect(toggle).toHaveTextContent(resourcesText.browseResources());
  expect(toggle).toHaveAttribute('aria-controls', sidebar.parentElement!.id);
  expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await user.click(toggle);
  expect(queryByRole('complementary')).not.toBeInTheDocument();
  expect(
    queryByRole('radio', { name: 'App Resources' })
  ).not.toBeInTheDocument();
  expect(toggle).toHaveFocus();
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(toggle).toHaveTextContent(resourcesText.browseResources());
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
    getByRole('button', { name: resourcesText.browseResources() })
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

describe('small-screen resource picker', () => {
  function mountPicker() {
    (useScreenSize as jest.Mock).mockReturnValue(false);
    let navigate!: ReturnType<typeof useNavigate>;
    const renderWorkspace = () => (
      <UnloadProtectsContext.Provider value={[]}>
        <Workspace
          onReady={(value) => {
            navigate = value;
          }}
        />
      </UnloadProtectsContext.Provider>
    );
    const result = mount(renderWorkspace());
    return { ...result, navigate, renderWorkspace };
  }

  test('opens a modal picker and restores focus and editor data when dismissed', async () => {
    const { getByRole, queryByRole, user } = mountPicker();
    const editor = getByRole('textbox', { name: 'Resource data' });
    await user.type(editor, 'Unsaved changes');
    const browse = getByRole('button', {
      name: resourcesText.browseResources(),
    });
    expect(browse).toHaveAttribute('aria-haspopup', 'dialog');
    expect(queryByRole('tree')).not.toBeInTheDocument();
    await user.click(browse);
    const picker = getByRole('dialog', {
      name: resourcesText.browseResources(),
    });
    expect(picker).toHaveAttribute('aria-modal', 'true');
    expect(within(picker).getByRole('tree')).toBeInTheDocument();
    expect(within(picker).getByRole('searchbox')).toHaveFocus();
    expect(editor).toHaveValue('Unsaved changes');
    await user.keyboard('{Escape}');
    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(browse).toHaveFocus();
    expect(getByRole('textbox', { name: 'Resource data' })).toBe(editor);
    expect(editor).toHaveValue('Unsaved changes');
    await user.click(browse);
    await user.click(getByRole('button', { name: commonText.close() }));
    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(browse).toHaveFocus();
  });

  test('preserves search, filters, and tree expansion across closing and reopening', async () => {
    const { getByRole, queryByRole, user } = mountPicker();
    const browse = getByRole('button', {
      name: resourcesText.browseResources(),
    });
    await user.click(browse);
    await user.click(getByRole('button', { name: 'Global Resources (2)' }));
    const conformation = getCache('appResources', 'conformation');
    await user.type(getByRole('searchbox'), 'QueryFreq');
    await user.click(getByRole('radio', { name: 'App Resources' }));
    await user.click(getByRole('button', { name: commonText.close() }));
    await user.click(browse);
    expect(getByRole('searchbox')).toHaveValue('QueryFreq');
    expect(getByRole('radio', { name: 'App Resources' })).toBeChecked();
    expect(getByRole('link', { name: 'QueryFreqList' })).toBeInTheDocument();
    await user.clear(getByRole('searchbox'));
    expect(
      getByRole('link', { name: 'Global Preferences' })
    ).toBeInTheDocument();
    expect(
      queryByRole('link', { name: 'QueryFreqList' })
    ).not.toBeInTheDocument();
    expect(getCache('appResources', 'conformation')).toEqual(conformation);
  });

  test.each([
    '/specify/resources/app-resource/1/',
    '/specify/resources/create/globalResource/',
  ])('returns to the editor after navigation commits to %s', async (path) => {
    const { getByRole, queryByRole, user, navigate, getByText } = mountPicker();
    await user.click(
      getByRole('button', { name: resourcesText.browseResources() })
    );
    await act(async () => navigate(path));
    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      getByText(
        path.includes('/create/') ? 'New resource' : 'Selected resource'
      )
    ).toBeInTheDocument();
    expect(
      getByRole('button', { name: resourcesText.browseResources() })
    ).toBeInTheDocument();
  });

  test('can customize filters and return to the picker', async () => {
    const { getByRole, queryByRole, user } = mountPicker();
    await user.click(
      getByRole('button', { name: resourcesText.browseResources() })
    );
    await user.click(
      getByRole('button', { name: resourcesText.filterByType() })
    );
    const filters = getByRole('dialog', { name: resourcesText.filters() });
    await user.click(
      within(filters).getByRole('checkbox', { name: /^Report \(/ })
    );
    await user.click(
      within(filters).getByRole('button', { name: commonText.close() })
    );
    expect(
      queryByRole('dialog', { name: resourcesText.filters() })
    ).not.toBeInTheDocument();
    expect(
      getByRole('dialog', { name: resourcesText.browseResources() })
    ).toBeInTheDocument();
    expect(
      getByRole('button', { name: resourcesText.filterByType() })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      getByRole('button', { name: resourcesText.filterByType() })
    ).toHaveFocus();
  });

  test('switches layouts without changing the desktop sidebar preference or editor', async () => {
    setCache('appResources', 'sidebarCollapsed', true, false);
    const { getByRole, queryByRole, user, rerender, renderWorkspace } =
      mountPicker();
    const editor = getByRole('textbox', { name: 'Resource data' });
    await user.type(editor, 'Unsaved changes');
    await user.click(
      getByRole('button', { name: resourcesText.browseResources() })
    );
    await user.type(getByRole('searchbox'), 'QueryFreq');
    (useScreenSize as jest.Mock).mockReturnValue(true);
    rerender(renderWorkspace());
    expect(queryByRole('dialog')).not.toBeInTheDocument();
    const toggle = getByRole('button', {
      name: resourcesText.browseResources(),
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(getByRole('searchbox')).toHaveValue('QueryFreq');
    expect(getByRole('textbox', { name: 'Resource data' })).toBe(editor);
    expect(editor).toHaveValue('Unsaved changes');
    (useScreenSize as jest.Mock).mockReturnValue(false);
    rerender(renderWorkspace());
    expect(queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      getByRole('button', { name: resourcesText.browseResources() })
    ).toBeInTheDocument();
  });
});
