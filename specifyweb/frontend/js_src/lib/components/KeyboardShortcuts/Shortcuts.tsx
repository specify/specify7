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
import { className } from '../Atoms/className';
import type { PreferenceRendererProps } from '../Preferences/types';
import type { KeyboardShortcuts } from './config';
import { keyboardPlatform } from './config';
import { keyJoinSymbol, setKeyboardEventInterceptor } from './context';
import {
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
  value = emptyShortcuts,
  onChange: handleChange,
}: Partial<
  Pick<PreferenceRendererProps<KeyboardShortcuts>, 'onChange' | 'value'>
>): JSX.Element {
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

  const valueRef = React.useRef(localValue);
  valueRef.current = localValue;

  const [_, triggerReRender] = React.useState(false);
  React.useEffect(
    () => editingEvent.on('change', () => triggerReRender((flip) => !flip)),
    []
  );

  // Cleanup empty when we finish editing
  React.useEffect(
    () =>
      isEditing
        ? (): void => {
            currentlyEditingShortcut = undefined;
            editingEvent.trigger('change');
            handleChange?.(cleanupEmpty(valueRef.current));
          }
        : undefined,
    [isEditing, handleChange]
  );

  return (
    <div className="flex flex-col gap-2">
      {shortcuts.map((shortcut, index) => (
        <EditKeyboardShortcut
          key={index}
          shortcut={shortcut}
          onEditStart={
            !isEditing && !globalIsEditingElsewhere
              ? (): void => {
                  currentlyEditingShortcut = key;
                  editingEvent.trigger('change');
                  setEditingIndex(index);
                }
              : undefined
          }
          onSave={
            editingIndex === index &&
            setShortcuts !== undefined &&
            !globalIsEditingElsewhere
              ? (shortcut): void => {
                  setShortcuts(
                    f.unique(
                      shortcut === undefined
                        ? removeItem(shortcuts, index)
                        : replaceItem(shortcuts, index, shortcut)
                    )
                  );
                  setEditingIndex(false);
                }
              : undefined
          }
        />
      ))}
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

function cleanupEmpty(value: KeyboardShortcuts): KeyboardShortcuts {
  const shortcuts = Object.fromEntries(
    Object.entries(value).map(([platform, shortcuts]) => [
      platform,
      // Drop empty strings
      shortcuts?.filter((shortcut) => shortcut.length > 0),
    ])
  );
  const isCompletelyEmpty = Object.values(shortcuts).every(
    (shortcuts) => shortcuts === undefined || shortcuts.length === 0
  );
  return isCompletelyEmpty ? {} : value;
}

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
  const parts = localState.length === 0 ? [] : localState.split(keyJoinSymbol);
  const isEditing = typeof handleSave === 'function';

  React.useEffect(() => {
    if (isEditing) {
      // Allows user to press Enter to finish setting keyboard shortcut.
      saveButtonRef.current?.focus();
      setLocalState('');
      return setKeyboardEventInterceptor(setLocalState);
    }
    return undefined;
  }, [isEditing, setLocalState]);

  const isEmpty = parts.length === 0;
  const activeValue = React.useRef(localState);
  activeValue.current = isEmpty ? shortcut : localState;

  const saveButtonRef = React.useRef<HTMLButtonElement>(null);

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
        forwardRef={saveButtonRef}
        variant={isEditing ? className.saveButton : undefined}
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
