import { preferencesText } from '../../localization/preferences';
import type { RA, RR } from '../../utils/types';

/**
 * Because operating systems, browsers and browser extensions define many
 * keyboard shortcuts, many of which differ between operating systems, the set
 * of free keyboard shortcuts is quite small so it's difficult to have one
 * shortcut that works on all 3 platforms.
 *
 * To provide flexibility, without complicating the UI for people who only use
 * Specify on a single platform, we do the following:
 * - UI allows you to set keyboard shortcuts for the current platform only
 * - If you set keyboard shortcut on any platform, that shortcut is used on all
 *   platforms, unless you explicitly edited the shortcut on the other platform
 * - If keyboard shortcut was not explicitly set, the default shortcut, if any
 *   will be used
 */
export type KeyboardShortcuts = Partial<
  RR<KeyboardPlatform, RA<string> | undefined>
>;

type KeyboardPlatform = 'mac' | 'other' | 'windows';
export const keyboardPlatform: KeyboardPlatform =
  navigator.platform.toLowerCase().includes('mac') ||
  // Check for iphone || ipad || ipod
  navigator.platform.toLowerCase().includes('ip')
    ? 'mac'
    : navigator.platform.toLowerCase().includes('win')
    ? 'windows'
    : 'other';

const modifierKeys = ['Alt', 'Ctrl', 'Meta', 'Shift'] as const;
export type ModifierKey = typeof modifierKeys[number];
export const allModifierKeys = new Set([
  ...modifierKeys,
  'AltGraph',
  'CapsLock',
]);

export const keyboardModifierLocalization: RR<ModifierKey, string> = {
  Alt:
    keyboardPlatform === 'mac'
      ? preferencesText.macOption()
      : preferencesText.alt(),
  Ctrl:
    keyboardPlatform === 'mac'
      ? preferencesText.macControl()
      : preferencesText.ctrl(),
  // This key should never appear in non-mac platforms
  Meta: preferencesText.macMeta(),
  Shift:
    keyboardPlatform === 'mac'
      ? preferencesText.macShift()
      : preferencesText.shift(),
};

/**
 * Do not allow binding a keyboard shortcut that includes only one of these
 * keys, without any modifier.
 *
 * For example, do not allow binding keyboard shortcuts to Tab key. That key is
 * important for accessibility and for keyboard navigation. Without it
 * you won't be able to tab your way to the "Save" button to save the
 * keyboard shortcut)
 */
export const specialKeyboardKeys = new Set([
  'Enter',
  'Tab',
  ' ',
  'Escape',
  'Backspace',
]);
