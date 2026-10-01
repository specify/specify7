import React from 'react';

import { preferencesText } from '../../localization/preferences';
import type { RA } from '../../utils/types';
import { SECOND } from '../Atoms/timeUnits';
import { Portal } from '../Molecules/Portal';
import type { ActiveKeyboardShortcut } from './context';
import { getActiveKeyboardShortcuts } from './context';
import { localizedKeyJoinSymbol, localizeKeyboardShortcut } from './utils';

const holdDuration = 1 * SECOND;
const modifierKeys = new Set(['Control', 'Meta']);

export function KeyboardShortcutCheatSheet(): JSX.Element | null {
  const [shortcuts, setShortcuts] = React.useState<
    RA<ActiveKeyboardShortcut> | undefined
  >(undefined);

  React.useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let isVisible = false;
    const heldModifiers = new Set<string>();

    const hide = (): void => {
      if (timeout !== undefined) clearTimeout(timeout);
      timeout = undefined;
      heldModifiers.clear();
      isVisible = false;
      setShortcuts(undefined);
    };
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (modifierKeys.has(event.key)) {
        heldModifiers.add(event.key);
        if (timeout === undefined && !isVisible && !event.repeat)
          timeout = setTimeout(() => {
            timeout = undefined;
            isVisible = true;
            setShortcuts(getActiveKeyboardShortcuts());
          }, holdDuration);
      } else if (heldModifiers.size > 0) hide();
    };
    const handleKeyUp = (event: KeyboardEvent): void => {
      if (!modifierKeys.has(event.key)) return;
      heldModifiers.delete(event.key);
      if (heldModifiers.size === 0) hide();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    globalThis.addEventListener('blur', hide);
    return (): void => {
      if (timeout !== undefined) clearTimeout(timeout);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      globalThis.removeEventListener('blur', hide);
    };
  }, []);

  const contextShortcuts = shortcuts?.filter(
    ({ scope }) => scope === 'context'
  );
  const globalShortcuts = shortcuts?.filter(({ scope }) => scope === 'global');

  return shortcuts === undefined || shortcuts.length === 0 ? null : (
    <Portal>
      <section
        aria-label={preferencesText.keyboardShortcuts()}
        role="dialog"
        className="pointer-events-none fixed inset-0 z-[10000] flex items-center justify-center bg-black/20 p-8"
      >
        <div
          className={`
            max-h-full w-full max-w-5xl overflow-auto rounded-2xl
            pointer-events-auto
            border border-white/20 bg-neutral-800/90 p-8 text-white shadow-2xl
          `}
        >
          <h2 className="mb-6 text-center text-2xl font-semibold">
            {preferencesText.keyboardShortcuts()}
          </h2>
          {contextShortcuts !== undefined && contextShortcuts.length > 0 && (
            <ShortcutGrid shortcuts={contextShortcuts} />
          )}
          {contextShortcuts !== undefined &&
            contextShortcuts.length > 0 &&
            globalShortcuts !== undefined &&
            globalShortcuts.length > 0 && (
              <hr className="my-6 border-white/25" />
            )}
          {globalShortcuts !== undefined && globalShortcuts.length > 0 && (
            <ShortcutGrid shortcuts={globalShortcuts} />
          )}
        </div>
      </section>
    </Portal>
  );
}

function ShortcutGrid({
  shortcuts,
}: {
  readonly shortcuts: RA<ActiveKeyboardShortcut>;
}): JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-x-12 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
      {shortcuts.map(({ label, shortcut }) => (
        <div
          className="flex min-w-0 items-center justify-between gap-4 border-b border-white/15 pb-3"
          key={`${label}-${shortcut}`}
        >
          <span className="truncate">{label}</span>
          <kbd className="flex shrink-0 gap-1">
            {localizeKeyboardShortcut(shortcut)
              .split(localizedKeyJoinSymbol)
              .map((key, index) => (
                <span
                  className="min-w-7 rounded-md bg-white/15 px-2 py-1 text-center font-mono text-sm shadow-sm"
                  key={`${key}-${index}`}
                >
                  {key}
                </span>
              ))}
          </kbd>
        </div>
      ))}
    </div>
  );
}
