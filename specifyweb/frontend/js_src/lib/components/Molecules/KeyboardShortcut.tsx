/**
 * Logic for setting and listening to keyboard shortcuts
 */

import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { listen } from '../../utils/events';
import type { RA, RR } from '../../utils/types';
import {
  removeItem,
  replaceItem,
  replaceKey,
  sortFunction,
} from '../../utils/utils';
import { Button } from '../Atoms/Button';
import { PreferenceItemComponent } from '../Preferences/types';

const modifierLocalization = {
  alt: preferencesText.alt(),
  ctrl: preferencesText.ctrl(),
  meta: preferencesText.meta(),
  shift: preferencesText.shift(),
};

export type KeyboardShortcuts = Partial<RR<Platform, RA<KeyboardShortcut>>>;

export type Platform = 'linux' | 'macOS' | 'windows';

export type KeyboardShortcut = {
  readonly modifiers: RA<keyof typeof modifierLocalization>;
  readonly keys: RA<string>;
};

export const modifierKeyNames = new Set(['Alt', 'Control', 'Meta', 'Shift']);

export const SetKeyboardShortcuts: PreferenceItemComponent<
  KeyboardShortcuts
> = ({ value, onChange: handleChange }) => {
  const [editingIndex, setEditingIndex] = React.useState<number | false>(false);
  const isEditing = typeof editingIndex === 'number';
  const shortcuts = value[platform] ?? [];
  const setShortcuts = (shortcuts: RA<KeyboardShortcut>): void =>
    handleChange(
      replaceKey(
        value,
        platform,
        shortcuts.length === 0 ? undefined : shortcuts
      )
    );

  return (
    <div className="flex flex-col gap-2">
      {shortcuts.map((shortcut, index) => (
        <SetKeyboardShortcut
          key={index}
          shortcut={shortcut}
          onEdit={
            editingIndex === false
              ? (): void => setEditingIndex(index)
              : undefined
          }
          onSave={
            editingIndex === index
              ? (shortcut): void => {
                  setShortcuts(
                    shortcut === undefined
                      ? removeItem(shortcuts, index)
                      : replaceItem(shortcuts, index, shortcut)
                  );
                  setEditingIndex(false);
                }
              : undefined
          }
        />
      ))}
      <div className="flex items-end gap-2">
        {!isEditing && (
          <Button.Small
            onClick={(): void => {
              setEditingIndex(shortcuts.length);
              setShortcuts([...shortcuts, { modifiers: [], keys: [] }]);
            }}
          >
            {commonText.add()}
          </Button.Small>
        )}
      </div>
    </div>
  );
};

function SetKeyboardShortcut({
  shortcut,
  onSave: handleSave,
  onEdit: handleEdit,
}: {
  readonly shortcut: KeyboardShortcut;
  readonly onSave:
    | ((shortcut: KeyboardShortcut | undefined) => void)
    | undefined;
  readonly onEdit: (() => void) | undefined;
}): JSX.Element {
  const [localState, setLocalState] = useTriggerState(shortcut);
  const { modifiers, keys } = localState;
  const isEditing = typeof handleSave === 'function';

  React.useEffect(() => {
    if (isEditing) {
      setLocalState({ modifiers: [], keys: [] });
      return listen(
        document,
        'keydown',
        (event) => {
          const key =
            event.key.length === 1 ? event.key.toUpperCase() : event.key;
          if (modifierKeyNames.has(event.key)) return;
          const modifiers = resolveModifiers(event);
          setLocalState((localState) => ({
            modifiers: Array.from(
              new Set([...localState.modifiers, ...modifiers])
            ).sort(sortFunction((key) => key)),
            keys: Array.from(new Set([...localState.keys, key])).sort(
              sortFunction((key) => key)
            ),
          }));
          event.preventDefault();
          event.stopPropagation();
        },
        true
      );
    }
    return undefined;
  }, [isEditing, setLocalState]);

  const isEmpty = modifiers.length === 0 && keys.length === 0;
  return (
    <div className="flex gap-2">
      <div
        aria-atomic
        aria-live={isEditing ? 'polite' : undefined}
        className="flex flex-1 flex-wrap items-center gap-2"
      >
        {isEditing && isEmpty ? preferencesText.pressKeys() : undefined}
        {modifiers.map((modifier) => (
          <Key key={modifier} label={modifierLocalization[modifier]} />
        ))}
        {keys.map((key) => (
          <Key key={key} label={key} />
        ))}
      </div>
      {isEditing && (
        <Button.Small onClick={(): void => handleSave(undefined)}>
          {commonText.remove()}
        </Button.Small>
      )}
      <Button.Small
        aria-pressed={isEditing ? true : undefined}
        onClick={
          isEditing
            ? (): void => handleSave(isEmpty ? { ...shortcut } : localState)
            : handleEdit
        }
      >
        {isEditing ? commonText.save() : commonText.edit()}
      </Button.Small>
    </div>
  );
}

export const resolveModifiers = (
  event: KeyboardEvent
): RA<keyof typeof modifierLocalization> =>
  Object.entries({
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
  })
    .filter(([_, isPressed]) => isPressed)
    .map(([modifier]) => modifier)
    .sort(sortFunction((modifier) => modifier));

function Key({ label }: { readonly label: string }): JSX.Element {
  return <span className="rounded bg-gray-200 p-2">{label}</span>;
}

export const platform: Platform =
  navigator.platform.toLowerCase().includes('mac') ||
  navigator.platform.toLowerCase().includes('ip')
    ? 'macOS'
    : navigator.platform.toLowerCase().includes('win')
    ? 'windows'
    : 'linux';