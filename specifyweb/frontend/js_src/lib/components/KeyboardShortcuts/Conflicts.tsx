import React from 'react';

import { useAsyncState } from '../../hooks/useAsyncState';
import { preferencesText } from '../../localization/preferences';
import type { RA } from '../../utils/types';
import { WarningMessage } from '../Atoms';
import type { BasePreferences } from '../Preferences/BasePreferences';
import type { GenericPreferences } from '../Preferences/types';
import type { KeyboardShortcuts } from './config';
import type { UrlShortcuts } from './UrlShortcuts';
import { localizeKeyboardShortcut, resolvePlatformShortcuts } from './utils';

type Assignment = {
  readonly id: string;
  readonly label: React.ReactNode;
  readonly value: KeyboardShortcuts;
  readonly isUrl?: boolean;
  readonly scope?: string;
};

// These groups are used in mutually exclusive editing contexts.
const contextualGroups = new Set([
  'form.actions',
  'form.dialogs',
  'form.recordSet',
  'treeEditor.actions',
  'queryBuilder.actions',
]);

const ShortcutLabels = React.createContext<
  Readonly<Record<string, React.ReactNode>>
>({});
const fetchShortcutLabels = async () =>
  import('./UrlShortcuts').then(({ getShortcutLabels }) => getShortcutLabels());

const ShortcutAssignments = React.createContext<RA<Assignment>>([]);

const urlAssignments = (value: UrlShortcuts): RA<Assignment> =>
  Object.entries(value).flatMap(([path, value]) =>
    path.length === 0 || value === undefined
      ? []
      : [{ id: path, label: path, value, isUrl: true }]
  );

export function ShortcutConflictProvider({
  preferences: basePreferences,
  definitions,
  children,
}: {
  readonly preferences: BasePreferences<any>;
  readonly definitions: GenericPreferences;
  readonly children: React.ReactNode;
}): JSX.Element {
  const [labels] = useAsyncState(fetchShortcutLabels, false);
  const preferences =
    React.useContext(basePreferences.Context) ?? basePreferences;
  const [_, refresh] = React.useReducer((value: number) => value + 1, 0);
  React.useEffect(
    () => preferences.events.on('update', () => refresh()),
    [preferences]
  );
  const assignments = Object.entries(definitions).flatMap(
    ([category, definition]) =>
      Object.entries(definition.subCategories).flatMap(
        ([subcategory, { items, title: subgroup }]) =>
          Object.entries(items).flatMap(
            ([item, definition]): RA<Assignment> => {
              if (!('renderer' in definition)) return [];
              if (definition.renderer.name === 'UrlShortcutsEditor')
                return urlAssignments(
                  preferences.get(category, subcategory, item)
                );
              if (definition.renderer.name !== 'KeyboardShortcutPreferenceItem')
                return [];
              const title =
                typeof definition.title === 'function'
                  ? definition.title()
                  : definition.title;
              const group = definitions[category].title;
              return [
                {
                  id: `${category}.${subcategory}.${item}`,
                  label: (
                    <>
                      {typeof group === 'function' ? group() : group} /{' '}
                      {typeof subgroup === 'function' ? subgroup() : subgroup}:{' '}
                      {title}
                    </>
                  ),
                  scope: contextualGroups.has(`${category}.${subcategory}`)
                    ? `${category}.${subcategory}`
                    : undefined,
                  value: preferences.get(category, subcategory, item),
                },
              ];
            }
          )
      )
  );
  return (
    <ShortcutLabels.Provider value={labels ?? {}}>
      <ShortcutAssignments.Provider value={assignments}>
        {children}
      </ShortcutAssignments.Provider>
    </ShortcutLabels.Provider>
  );
}

// Replace saved URL assignments with the dialog's current draft.
export function UrlShortcutConflictProvider({
  value,
  children,
}: {
  readonly value: UrlShortcuts;
  readonly children: React.ReactNode;
}): JSX.Element {
  const assignments = React.useContext(ShortcutAssignments);
  return (
    <ShortcutAssignments.Provider
      value={[
        ...assignments.filter(({ isUrl }) => !isUrl),
        ...urlAssignments(value),
      ]}
    >
      {children}
    </ShortcutAssignments.Provider>
  );
}

export function ShortcutConflictWarning({
  id,
  value,
}: {
  readonly id: string | undefined;
  readonly value: KeyboardShortcuts;
}): JSX.Element | null {
  const assignments = React.useContext(ShortcutAssignments);
  const labels = React.useContext(ShortcutLabels);
  const scope = assignments.find((assignment) => assignment.id === id)?.scope;
  const conflicts = (resolvePlatformShortcuts(value) ?? []).flatMap(
    (shortcut) => {
      if (shortcut.length === 0) return [];
      return assignments
        .filter(
          (assignment) =>
            assignment.id !== id &&
            (scope === undefined ||
              assignment.scope === undefined ||
              assignment.scope === scope) &&
            (resolvePlatformShortcuts(assignment.value) ?? []).includes(
              shortcut
            )
        )
        .map((assignment) => ({ ...assignment, shortcut }));
    }
  );
  return conflicts.length === 0 ? null : (
    <WarningMessage>
      {preferencesText.shortcutConflict()}
      <ul>
        {conflicts.map(({ id, label, shortcut, isUrl }) => (
          <li key={`${id}:${shortcut}`}>
            {localizeKeyboardShortcut(shortcut)}:{' '}
            {isUrl
              ? (labels[id] ??
                labels[id.endsWith('/') ? id.slice(0, -1) : `${id}/`] ??
                label)
              : label}
          </li>
        ))}
      </ul>
    </WarningMessage>
  );
}
