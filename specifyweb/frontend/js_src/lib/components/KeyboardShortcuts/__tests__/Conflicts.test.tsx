import { act, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { BasePreferences } from '../../Preferences/BasePreferences';
import type { GenericPreferences } from '../../Preferences/types';
import {
  ShortcutConflictProvider,
  UrlShortcutConflictProvider,
} from '../Conflicts';
import { KeyboardShortcutPreferenceItem } from '../Shortcuts';

jest.mock('../UrlShortcuts', () => ({
  ...jest.requireActual('../UrlShortcuts'),
  getShortcutLabels: async () => ({
    '/specify/overlay/data-entry/': 'Data Entry',
  }),
}));

requireContext();

const definitions: GenericPreferences = {
  form: {
    title: commonText.save(),
    subCategories: {
      actions: {
        title: commonText.save(),
        items: {
          save: {
            title: commonText.save(),
            requiresReload: false,
            visible: true,
            defaultValue: { other: ['Ctrl+KeyS'] },
            renderer: KeyboardShortcutPreferenceItem,
            container: 'div',
          },
        },
      },
    },
  },
};
const createPreferences = () =>
  new BasePreferences({
    definitions,
    values: { fetchUrl: '', resourceName: '' },
    defaultValues: undefined,
    developmentGlobal: '',
    syncChanges: false,
  });

test('warns after recording a duplicate, accepts it, and clears after reassignment', async () => {
  const preferences = createPreferences();
  const onChange = jest.fn();
  const { user } = mount(
    <ShortcutConflictProvider
      preferences={preferences}
      definitions={definitions}
    >
      <KeyboardShortcutPreferenceItem
        shortcutId="/example"
        onChange={onChange}
      />
    </ShortcutConflictProvider>
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Add' }));
  await user.keyboard('{Control>}s{/Control}');
  expect(onChange).toHaveBeenCalledWith({ other: ['Ctrl+KeyS'] });
  expect(screen.getByRole('alert')).toHaveTextContent('Save');
  act(() => preferences.set('form', 'actions', 'save', { other: ['KeyA'] }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => {});
});

test('does not warn for its own assignment or bindings on another platform', async () => {
  const preferences = createPreferences();
  const { rerender } = mount(
    <ShortcutConflictProvider
      preferences={preferences}
      definitions={definitions}
    >
      <KeyboardShortcutPreferenceItem
        category="form"
        subcategory="actions"
        item="save"
        value={{ other: ['Ctrl+KeyS'] }}
      />
    </ShortcutConflictProvider>
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  rerender(
    <ShortcutConflictProvider
      preferences={preferences}
      definitions={definitions}
    >
      <KeyboardShortcutPreferenceItem
        shortcutId="/example"
        value={{ other: [], mac: ['Meta+KeyS'] }}
      />
    </ShortcutConflictProvider>
  );
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => {});
});

test('uses draft URL assignments instead of saved URLs, with platform fallback', async () => {
  const content = (draft: boolean) => (
    <UrlShortcutConflictProvider value={{ '/saved': { other: ['Ctrl+KeyK'] } }}>
      <UrlShortcutConflictProvider
        value={draft ? { '/draft': { mac: ['Meta+KeyK'] } } : {}}
      >
        <KeyboardShortcutPreferenceItem
          shortcutId="/current"
          value={{ other: ['Ctrl+KeyK'] }}
        />
      </UrlShortcutConflictProvider>
    </UrlShortcutConflictProvider>
  );
  const { rerender } = mount(content(true));
  expect(screen.getByRole('alert')).toHaveTextContent('/draft');
  expect(screen.getByRole('alert')).not.toHaveTextContent('/saved');
  rerender(content(false));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => {});
});

test('checks the redirected preference instance when editing another user', async () => {
  const preferences = createPreferences();
  const redirected = createPreferences();
  redirected.set('form', 'actions', 'save', { other: ['KeyA'] });
  mount(
    <preferences.Context.Provider value={redirected}>
      <ShortcutConflictProvider
        preferences={preferences}
        definitions={definitions}
      >
        <KeyboardShortcutPreferenceItem
          shortcutId="/example"
          value={{ other: ['KeyA'] }}
        />
      </ShortcutConflictProvider>
    </preferences.Context.Provider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Save');
  act(() => redirected.set('form', 'actions', 'save', {}));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await act(async () => {});
});

test('allows sharing between contextual groups but warns within a group and for global URLs', async () => {
  const action = definitions.form.subCategories.actions.items.save;
  const scopedDefinitions: GenericPreferences = {
    ...definitions,
    treeEditor: {
      title: commonText.edit(),
      subCategories: {
        actions: {
          title: commonText.edit(),
          items: {
            edit: { ...action, title: commonText.edit() },
            add: { ...action, title: commonText.add(), defaultValue: {} },
          },
        },
      },
    },
  };
  const preferences = new BasePreferences({
    definitions: scopedDefinitions,
    values: { fetchUrl: '', resourceName: '' },
    defaultValues: undefined,
    developmentGlobal: '',
    syncChanges: false,
  });
  const content = (urls: boolean) => (
    <ShortcutConflictProvider
      preferences={preferences}
      definitions={scopedDefinitions}
    >
      <UrlShortcutConflictProvider
        value={urls ? { '/global': { other: ['Ctrl+KeyS'] } } : {}}
      >
        <KeyboardShortcutPreferenceItem
          category="treeEditor"
          subcategory="actions"
          item="edit"
          value={{ other: ['Ctrl+KeyS'] }}
        />
      </UrlShortcutConflictProvider>
    </ShortcutConflictProvider>
  );
  const { rerender } = mount(content(false));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  act(() =>
    preferences.set('treeEditor', 'actions', 'add', { other: ['Ctrl+KeyS'] })
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Add');
  expect(screen.getByRole('alert')).not.toHaveTextContent('Save');
  act(() => preferences.set('treeEditor', 'actions', 'add', {}));
  rerender(content(true));
  expect(screen.getByRole('alert')).toHaveTextContent('/global');
  await act(async () => {});
});

test('shows friendly route names and preserves unknown custom URLs', async () => {
  const preferences = createPreferences();
  mount(
    <ShortcutConflictProvider
      preferences={preferences}
      definitions={definitions}
    >
      <UrlShortcutConflictProvider
        value={{
          '/specify/overlay/data-entry': { other: ['KeyK'] },
          'https://example.com': { other: ['KeyK'] },
        }}
      >
        <KeyboardShortcutPreferenceItem
          shortcutId="/current"
          value={{ other: ['KeyK'] }}
        />
      </UrlShortcutConflictProvider>
    </ShortcutConflictProvider>
  );
  await waitFor(() =>
    expect(screen.getByRole('alert')).toHaveTextContent('Data Entry')
  );
  expect(screen.getByRole('alert')).not.toHaveTextContent(
    '/specify/overlay/data-entry'
  );
  expect(screen.getByRole('alert')).toHaveTextContent('https://example.com');
  await act(async () => {});
});
