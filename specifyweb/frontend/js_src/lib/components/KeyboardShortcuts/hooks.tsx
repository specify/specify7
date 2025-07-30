import React from 'react';
import type { LocalizedString } from 'typesafe-i18n';

import { localized } from '../../utils/types';
import { formatDisjunction } from '../Atoms/Internationalization';
import type { KeyboardShortcuts } from './config';
import { bindKeyboardShortcut } from './context';
import { localizeKeyboardShortcut, resolvePlatformShortcuts } from './utils';

/**
 * Prefer `userPreferences.useKeyboardShortcut()` over directly using this hook
 */
export function useManualKeyboardShortcut(
  shortcuts: KeyboardShortcuts | undefined,
  callback: (() => void) | undefined
): void {
  const callbackRef = React.useRef(callback);
  callbackRef.current = callback;
  const hasCallback = typeof callback === 'function';
  React.useEffect(
    () =>
      typeof shortcuts === 'object' && hasCallback
        ? bindKeyboardShortcut(shortcuts, () => callbackRef.current?.())
        : undefined,
    [hasCallback, shortcuts]
  );
}

/**
 * Prefer `userPreferences.useKeyboardShortcut()` over directly using this hook
 *
 * Provides a localized keyboard shortcut string, which can be used in the UI
 * in the "title" attribute.
 */
export function useKeyboardShortcutLabel(
  shortcuts: KeyboardShortcuts | undefined
): LocalizedString {
  return React.useMemo(() => {
    const platformShortcuts =
      shortcuts === undefined ? [] : resolvePlatformShortcuts(shortcuts) ?? [];
    return localized(
      platformShortcuts.length > 0
        ? ` (${formatDisjunction(
            platformShortcuts.map(localizeKeyboardShortcut)
          )})`
        : ''
    );
  }, [shortcuts]);
}
