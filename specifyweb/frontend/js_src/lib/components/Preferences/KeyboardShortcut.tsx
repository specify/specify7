/**
 * Logic for setting and listening to keyboard shortcuts
 */

import { platform, Platform } from '@floating-ui/react';
import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { listen } from '../../utils/events';
import type { RA } from '../../utils/types';
import {
  removeItem,
  replaceItem,
  replaceKey,
  sortFunction,
} from '../../utils/utils';
import { Button } from '../Atoms/Button';
import type {
  KeyboardShortcutBinding,
  KeyboardShortcuts,
} from './KeyboardContext';
import type { PreferenceRendererProps } from './types';

const modifierLocalization = {
  alt: preferencesText.alt(),
  ctrl: preferencesText.ctrl(),
  meta: preferencesText.meta(),
  shift: preferencesText.shift(),
};

export function KeyboardShortcutPreferenceItem({
  value,
  onChange: handleChange,
}: PreferenceRendererProps<KeyboardShortcuts>): JSX.Element {
  const [editingIndex, setEditingIndex] = React.useState<number | false>(false);
  const isEditing = typeof editingIndex === 'number';
  const shortcuts = value[platform] ?? [];
  const setShortcuts = (shortcuts: RA<KeyboardShortcutBinding>): void =>
    handleChange(replaceKey(value, platform, shortcuts));

  return (
    <div className="flex flex-col gap-2">
      {shortcuts.map((shortcut, index) => (
        <EditKeyboardShortcut
          key={index}
          shortcut={shortcut}
          onEditStart={
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
              setShortcuts([...shortcuts, { modifiers: [], keys: [] }]);
              setEditingIndex(shortcuts.length);
            }}
          >
            {commonText.add()}
          </Button.Small>
        )}
      </div>
    </div>
  );
}

function EditKeyboardShortcut({
  shortcut,
  onSave: handleSave,
  onEditStart: handleEditStart,
}: {
  readonly shortcut: KeyboardShortcutBinding;
  readonly onSave:
    | ((shortcut: KeyboardShortcutBinding | undefined) => void)
    | undefined;
  readonly onEditStart: (() => void) | undefined;
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
          if (ignoreKeyPress(event, false)) return;

          if (event.key === 'Enter') handleSave(activeValue.current);
          else {
            const modifiers = resolveModifiers(event);
            setLocalState((localState) => ({
              modifiers: Array.from(
                // eslint-disable-next-line unicorn/consistent-destructuring
                new Set([...localState.modifiers, ...modifiers])
              ).sort(sortFunction((key) => key)),
              // eslint-disable-next-line unicorn/consistent-destructuring
              keys: Array.from(new Set([...localState.keys, event.key])).sort(
                sortFunction((key) => key)
              ),
            }));
          }

          event.preventDefault();
          event.stopPropagation();
        },
        { capture: true }
      );
    }
    return undefined;
  }, [isEditing, setLocalState]);

  const isEmpty = modifiers.length === 0 && keys.length === 0;
  const activeValue = React.useRef(localState);
  activeValue.current = isEmpty ? shortcut : localState;

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
            ? (): void => handleSave(activeValue.current)
            : handleEditStart
        }
      >
        {isEditing ? commonText.save() : commonText.edit()}
      </Button.Small>
    </div>
  );
}

function Key({ label }: { readonly label: string }): JSX.Element {
  return <span className="rounded bg-gray-200 p-2">{label}</span>;
}
