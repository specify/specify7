/**
 * Logic for setting and listening to keyboard shortcuts
 */

import React from 'react';

import { useTriggerState } from '../../hooks/useTriggerState';
import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { eventListener } from '../../utils/events';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { removeItem, replaceItem, replaceKey } from '../../utils/utils';
import { Key } from '../Atoms';
import { Button } from '../Atoms/Button';
import type { PreferenceRendererProps } from '../Preferences/types';
import { ShortcutConflictWarning } from './Conflicts';
import type { KeyboardShortcuts } from './config';
import { keyboardPlatform } from './config';
import { keyJoinSymbol, setKeyboardEventInterceptor } from './context';
import {
  cleanupEmptyShortcuts,
  localizedKeyJoinSymbol,
  localizeKeyboardShortcut,
  resolvePlatformShortcuts,
} from './utils';

/*
 * If any component instance is editing a keyboard shortcut, don't let any
 * other start editing it.
 */
let currentlyEditingShortcut: Record<never, never> | undefined = undefined;
const editingEvent = eventListener<{ readonly change: undefined }>();

export const emptyShortcuts = {};
export function KeyboardShortcutPreferenceItem({
  category,
  subcategory,
  item,
  shortcutId,
  value = emptyShortcuts,
  onChange: handleChange,
}: Partial<
  Pick<
    PreferenceRendererProps<KeyboardShortcuts>,
    'onChange' | 'value' | 'category' | 'subcategory' | 'item'
  >
> & { readonly shortcutId?: string }): JSX.Element {
  const [localValue, setLocalValue] = useTriggerState(value);

  const key = React.useMemo<Record<never, never>>(() => ({}), []);
  const globalIsEditingElsewhere =
    currentlyEditingShortcut !== undefined && currentlyEditingShortcut !== key;

  const [editingIndex, setEditingIndex] = React.useState<number | false>(false);
  const isEditing = typeof editingIndex === 'number';
  const shortcuts = resolvePlatformShortcuts(localValue) ?? [];
  const setShortcuts =
    handleChange === undefined
      ? undefined
      : (shortcuts: RA<string>): void =>
          setLocalValue(replaceKey(localValue, keyboardPlatform, shortcuts));

  const [_, triggerReRender] = React.useState(false);
  React.useEffect(
    () => editingEvent.on('change', () => triggerReRender((flip) => !flip)),
    []
  );

  // Release the recorder when editing finishes or the component unmounts.
  React.useEffect(
    () =>
      isEditing
        ? (): void => {
            if (currentlyEditingShortcut === key) {
              currentlyEditingShortcut = undefined;
              editingEvent.trigger('change');
            }
          }
        : undefined,
    [isEditing, key]
  );

  return (
    <div className="flex flex-col gap-2">
      {shortcuts.map((shortcut, index) => (
        <EditKeyboardShortcut
          key={index}
          shortcut={shortcut}
          onEditStart={
            !isEditing &&
            !globalIsEditingElsewhere &&
            setShortcuts !== undefined
              ? (): void => {
                  currentlyEditingShortcut = key;
                  editingEvent.trigger('change');
                  setEditingIndex(index);
                }
              : undefined
          }
          onCancel={
            editingIndex === index
              ? (): void => {
                  setLocalValue(cleanupEmptyShortcuts(localValue));
                  setEditingIndex(false);
                }
              : undefined
          }
          onSave={
            editingIndex === index &&
            setShortcuts !== undefined &&
            !globalIsEditingElsewhere
              ? (shortcut): void => {
                  const newValue = cleanupEmptyShortcuts(
                    replaceKey(
                      localValue,
                      keyboardPlatform,
                      f.unique(
                        shortcut === undefined
                          ? removeItem(shortcuts, index)
                          : replaceItem(shortcuts, index, shortcut)
                      )
                    )
                  );
                  setLocalValue(newValue);
                  handleChange?.(newValue);
                  setEditingIndex(false);
                }
              : undefined
          }
        />
      ))}
      <ShortcutConflictWarning
        id={
          shortcutId ??
          (category === undefined
            ? undefined
            : `${category}.${subcategory}.${item}`)
        }
        value={localValue}
      />
      {setShortcuts !== undefined && (
        <Button.Small
          disabled={isEditing}
          onClick={
            globalIsEditingElsewhere
              ? undefined
              : (): void => {
                  currentlyEditingShortcut = key;
                  editingEvent.trigger('change');
                  setShortcuts([...shortcuts, '']);
                  setEditingIndex(shortcuts.length);
                }
          }
        >
          {commonText.add()}
        </Button.Small>
      )}
    </div>
  );
}

Object.defineProperty(KeyboardShortcutPreferenceItem, 'name', {
  value: 'KeyboardShortcutPreferenceItem',
});

function EditKeyboardShortcut({
  shortcut,
  onSave: handleSave,
  onEditStart: handleEditStart,
  onCancel: handleCancel,
}: {
  readonly shortcut: string;
  readonly onSave: ((shortcut: string | undefined) => void) | undefined;
  readonly onEditStart: (() => void) | undefined;
  readonly onCancel: (() => void) | undefined;
}): JSX.Element {
  const [localState, setLocalState] = useTriggerState(shortcut);
  const parts = localState.length === 0 ? [] : localState.split(keyJoinSymbol);
  const isEditing = typeof handleSave === 'function';

  const handleSaveRef = React.useRef(handleSave);
  handleSaveRef.current = handleSave;
  const cancelButtonRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!isEditing) {
      setLocalState(shortcut);
      return undefined;
    }
    cancelButtonRef.current?.focus();
    setLocalState('');
    let recordedShortcut = '';
    const clearInterceptor = setKeyboardEventInterceptor((keys) => {
      recordedShortcut = keys;
      setLocalState(keys);
    });
    const handleKeyUp = (): void => {
      if (recordedShortcut.length === 0) return;
      const shortcut = recordedShortcut;
      recordedShortcut = '';
      handleSaveRef.current?.(shortcut);
    };
    document.addEventListener('keyup', handleKeyUp);
    return (): void => {
      clearInterceptor();
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isEditing, setLocalState, shortcut]);

  const isEmpty = parts.length === 0;

  const localizedParts = React.useMemo(
    () => localizeKeyboardShortcut(localState).split(localizedKeyJoinSymbol),
    [localState]
  );

  return (
    <div className="flex gap-2">
      <div
        aria-atomic
        aria-live={isEditing ? 'polite' : undefined}
        className="flex flex-1 flex-wrap content-center items-center gap-1"
      >
        {isEmpty ? (
          isEditing ? (
            preferencesText.pressKeys()
          ) : (
            preferencesText.noKeyAssigned()
          )
        ) : (
          <kbd className="contents">
            {localizedParts.map((key, index) => (
              <Key className="mx-0" key={index}>
                {key}
              </Key>
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
        forwardRef={cancelButtonRef}
        onClick={isEditing ? handleCancel : handleEditStart}
      >
        {isEditing ? commonText.cancel() : commonText.edit()}
      </Button.Small>
    </div>
  );
}
