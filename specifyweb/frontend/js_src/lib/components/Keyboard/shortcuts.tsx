/**
 * Logic for setting and listening to keyboard shortcuts
 */

import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { listen } from '../../utils/events';
import type { RA } from '../../utils/types';
import { removeItem, replaceItem, replaceKey } from '../../utils/utils';
import { Key } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { PreferenceRendererProps } from '../Preferences/types';
import type { KeyboardShortcuts } from './config';
import { keyboardPlatform } from './config';
import {
  keyJoinSymbol,
  resolveModifiers,
  setKeyboardEventInterceptor,
} from './context';
import { localizeKeyboardShortcut, resolvePlatformShortcuts } from './utils';

/*
 * FIXME: create a mechanism for setting shortcuts for a page, and then displaying
 * those in the UI if present on the page
 *
 * FIXME: open key shortcut viewer on cmd+/
 */

export function KeyboardShortcutPreferenceItem({
  value,
  onChange: handleChange,
}: PreferenceRendererProps<KeyboardShortcuts>): JSX.Element {
  const [editingIndex, setEditingIndex] = React.useState<number | false>(false);
  const isEditing = typeof editingIndex === 'number';
  const shortcuts = resolvePlatformShortcuts(value) ?? [];
  const setShortcuts = (shortcuts: RA<string>): void =>
    handleChange(replaceKey(value, keyboardPlatform, shortcuts));

  // Do not allow saving an empty shortcut
  const hasEmptyShortcut = !isEditing && shortcuts.includes('');
  React.useEffect(() => {
    if (hasEmptyShortcut)
      setShortcuts(shortcuts.filter((shortcut) => shortcut !== ''));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEmptyShortcut]);

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
              setShortcuts([...shortcuts, '']);
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
// This is used in BasePreferences.useKeyboardShortcut to validate that the pref you are trying to listen to is actually a keyboard shortcut
if (process.env.NODE_ENV !== 'production')
  Object.defineProperty(KeyboardShortcutPreferenceItem, 'name', {
    value: 'KeyboardShortcutPreferenceItem',
  });

function EditKeyboardShortcut({
  shortcut,
  onSave: handleSave,
  onEditStart: handleEditStart,
}: {
  readonly shortcut: string;
  readonly onSave: ((shortcut: string | undefined) => void) | undefined;
  readonly onEditStart: (() => void) | undefined;
}): JSX.Element {
  const [localState, setLocalState] = useTriggerState(shortcut);
  const parts = localState.split(keyJoinSymbol);
  const isEditing = typeof handleSave === 'function';

  React.useEffect(() => {
    if (isEditing) {
      setLocalState('');
      const keyboardInterceptor = setKeyboardEventInterceptor(setLocalState);
      /*
       * Save the shortcut when Enter key is pressed.
       * Keyboard interceptor won't react to single Enter key press as it
       * is a special key, unless a modifier key is present.
       */
      const enterListener = listen(document, 'keydown', (event) => {
        if (event.key === 'Enter' && resolveModifiers(event).length === 0)
          handleSave(activeValue.current);
      });
      return () => {
        keyboardInterceptor();
        enterListener();
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, setLocalState]);

  const isEmpty = parts.length === 0;
  const activeValue = React.useRef(localState);
  activeValue.current = isEmpty ? shortcut : localState;

  return (
    <div className="flex gap-2">
      <div
        aria-atomic
        aria-live={isEditing ? 'polite' : undefined}
        className="flex flex-1 flex-wrap items-center gap-2"
      >
        {isEmpty ? (
          isEditing ? (
            preferencesText.pressKeys()
          ) : (
            preferencesText.noKeyAssigned()
          )
        ) : (
          <kbd>
            {shortcut.split(keyJoinSymbol).map((key) => (
              <Key key={key}>{localizeKeyboardShortcut(key)}</Key>
            ))}
          </kbd>
        )}
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
            ? (): void =>
                handleSave(
                  activeValue.current.length === 0
                    ? shortcut
                    : activeValue.current
                )
            : handleEditStart
        }
      >
        {isEditing ? commonText.save() : commonText.edit()}
      </Button.Small>
    </div>
  );
}
