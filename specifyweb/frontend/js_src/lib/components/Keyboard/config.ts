import { preferencesText } from '../../localization/preferences';
import type { IR, RA, RR } from '../../utils/types';

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

export const modifierKeys = ['Alt', 'Ctrl', 'Meta', 'Shift'] as const;
export type ModifierKey = typeof modifierKeys[number];
export const allModifierKeys = new Set([
  ...modifierKeys,
  'AltGraph',
  'CapsLock',
  'MetaLeft',
  'MetaRight',
  'ShiftLeft',
  'ShiftRight',
  'AltLeft',
  'AltRight',
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
  'Space',
  'Escape',
  'Backspace',
]);

/**
 * Because we are listening to key codes that correspond to US English letters,
 * we should show keys in the UI in US English to avoid confusion.
 * (otherwise Cmd+O is ambiguous as it's not clear if it refers to English O or
 * local language О).
 * See https://github.com/specify/specify7/issues/1746#issuecomment-2227113839
 *
 * For some keys, it is less confusing to see a symbol (like arrow keys), rather
 * than 'ArrowUp', thus symbols are used for those keys.
 * See http://xahlee.info/comp/unicode_computing_symbols.html
 *
 * Try not to define keyboard shortcuts for keys that may be in a different
 * place in other keyboard layouts (the positions of special symbols wary a lot)
 */
export const keyLocalizations: IR<string> = {
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  ArrowUp: '↑',
  Backquote: '`',
  Backslash: '\\',
  Backspace: '⌫',
  BracketLeft: '[',
  BracketRight: ']',
  Comma: ',',
  Digit0: '0',
  Digit1: '1',
  Digit2: '2',
  Digit3: '3',
  Digit4: '4',
  Digit5: '5',
  Digit6: '6',
  Digit7: '7',
  Digit8: '8',
  Digit9: '9',
  // "return" key is used over Enter on macOS keyboards
  Enter: keyboardPlatform === 'mac' ? '↵' : 'Enter',
  Equal: '=',
  KeyA: 'a',
  KeyB: 'b',
  KeyC: 'c',
  KeyD: 'd',
  KeyE: 'e',
  KeyF: 'f',
  KeyG: 'g',
  KeyH: 'h',
  KeyI: 'i',
  KeyJ: 'j',
  KeyK: 'k',
  KeyL: 'l',
  KeyM: 'm',
  KeyN: 'n',
  KeyO: 'o',
  KeyP: 'p',
  KeyQ: 'q',
  KeyR: 'r',
  KeyS: 's',
  KeyT: 't',
  KeyU: 'u',
  KeyV: 'v',
  KeyW: 'w',
  KeyX: 'x',
  KeyY: 'y',
  KeyZ: 'z',
  Minus: '-',
  Period: '.',
  Quote: "'",
  Semicolon: ';',
  Slash: '/',
};
