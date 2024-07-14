import { platform } from '@floating-ui/react';
import type { LocalizedString } from 'typesafe-i18n';

import type { RA } from '../../utils/types';
import { localized } from '../../utils/types';
import type { KeyboardShortcuts, ModifierKey } from './config';
import {
  keyboardModifierLocalization,
  keyboardPlatform,
  keyLocalizations,
  shiftKeyLocalizations,
} from './config';
import { keyJoinSymbol } from './context';

export const localizedKeyJoinSymbol = ' + ';
export function localizeKeyboardShortcut(shortcut: string): LocalizedString {
  const parts = shortcut.split(keyJoinSymbol);
  const hasShift = parts.includes('Shift');

  const string = parts
    .map(
      (key) =>
        keyboardModifierLocalization[key as ModifierKey] ??
        (hasShift ? shiftKeyLocalizations[key] : undefined) ??
        keyLocalizations[key] ??
        key
    )
    .join(localizedKeyJoinSymbol);

  return localized(string);
}

/**
 * If there is a keyboard shortcut defined for current system, use it
 * (also, if current system explicitly has empty array of shortcuts, use it).
 *
 * Otherwise, use the keyboard shortcut from one of the other platforms if set,
 * but change meta to ctrl and vice versa as necessary.
 */
export function resolvePlatformShortcuts(
  shortcut: KeyboardShortcuts
): RA<string> | undefined {
  if (platform in shortcut) return shortcut[keyboardPlatform];
  else if ('other' in shortcut)
    return keyboardPlatform === 'windows'
      ? shortcut.other
      : shortcut.other?.map(replaceCtrlWithMeta);
  else if ('windows' in shortcut)
    return keyboardPlatform === 'other'
      ? shortcut.other
      : shortcut.other?.map(replaceCtrlWithMeta);
  else if ('mac' in shortcut) return shortcut.other?.map(replaceMetaWithCtrl);
  else return undefined;
}

const replaceCtrlWithMeta = (shortcut: string): string =>
  shortcut
    .split(keyJoinSymbol)
    .map((key) => (key === 'Ctrl' ? 'Meta' : key))
    .join(keyJoinSymbol);

const replaceMetaWithCtrl = (shortcut: string): string =>
  shortcut
    .split(keyJoinSymbol)
    .map((key) => (key === 'Meta' ? 'Ctrl' : key))
    .join(keyJoinSymbol);
