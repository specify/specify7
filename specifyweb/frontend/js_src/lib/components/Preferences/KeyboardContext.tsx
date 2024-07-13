/**
 * Allows to register a key listener
 */

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
const allModifierKeys = new Set([...modifierKeys, 'AltGraph', 'CapsLock']);

/**
 * Do not allow binding a keyboard shortcut that includes only one of these
 * keys, without any modifier.
 *
 * For example, do not allow binding keyboard shortcuts to Tab key. That key is
 * important for accessibility and for keyboard navigation. Without it
 * you won't be able to tab your way to the "Save" button to save the
 * keyboard shortcut)
 */
const specialKeys = new Set(['Enter', 'Tab', ' ', 'Escape', 'Backspace']);

/**
 * To keep the event listener as fast as possible, we are not looping though all
 * set keyboard shortcuts and checking if any matches the set value - instead,
 * the registered shortcuts are stored in this hashmap, making it very easy
 * to check if a listener for current key combination exists.
 */
const listeners = new Map<string, () => void>();

/**
 * When setting a keyboard shortcut in user preferences, we want to:
 * - Prevent any other shortcut from reacting
 * - Read what keys were pressed
 */
let interceptor: ((keys: string) => void) | undefined;
export function setKeyboardEventInterceptor(
  callback: typeof interceptor
): () => void {
  interceptor = callback;
  return (): void => {
    if (interceptor === callback) interceptor = undefined;
  };
}

export function bindKeyboardShortcut(
  shortcut: KeyboardShortcuts,
  callback: () => void
): () => void {
  const shortcuts = resolvePlatformShortcuts(shortcut) ?? [];
  shortcuts.forEach((string) => {
    listeners.set(string, callback);
  });
  return () =>
    shortcuts.forEach((string) => {
      /*
       * Another listener may have been set on this shortcut - only unset if we
       * are still the active listener
       */
      const activeListener = listeners.get(string);
      if (activeListener === callback) listeners.delete(string);
    });
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
  if ('platform' in shortcut) return shortcut[keyboardPlatform];
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
    .map((key) => (key === 'ctrl' ? 'meta' : key))
    .join(keyJoinSymbol);

const replaceMetaWithCtrl = (shortcut: string): string =>
  shortcut
    .split(keyJoinSymbol)
    .map((key) => (key === 'meta' ? 'ctrl' : key))
    .join(keyJoinSymbol);

/**
 * Assumes keys and modifiers are sorted
 */
const keysToString = (modifiers: RA<ModifierKey>, keys: RA<string>): string =>
  [...modifiers, ...keys].join(keyJoinSymbol);
export const keyJoinSymbol = '+';

// eslint-disable-next-line functional/prefer-readonly-type
const pressedKeys: string[] = [];

document.addEventListener('keydown', (event) => {
  if (shouldIgnoreKeyPress(event)) return;

  if (!pressedKeys.includes(event.key)) {
    pressedKeys.push(event.key);
    pressedKeys.sort();
  }

  const modifiers = resolveModifiers(event);
  const isEntering = isInInput(event);
  const isPrintable = isPrintableModifier(modifiers);
  // Ignore shortcuts that result in printed characters when in an input field
  const ignore = isPrintable && isEntering;
  if (ignore) return;
  if (modifiers.length === 0 && specialKeys.has(event.key)) return;

  const keyString = keysToString(modifiers, pressedKeys);
  const handler = interceptor ?? listeners.get(keyString);
  if (typeof handler === 'function') {
    handler(keyString);
    /*
     * Do this only after calling the handler, so that if handler throws an
     * exception, the event can still be handled normally by the browser
     */
    event.preventDefault();
    event.stopPropagation();
  }
});

function shouldIgnoreKeyPress(event: KeyboardEvent): boolean {
  const key = event.key;

  if (event.isComposing || event.repeat) return true;

  // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#value
  if (key === 'Dead' || key === 'Unidentified') return true;

  // Do not allow binding a key shortcut to a modifier key only
  const isModifier = allModifierKeys.has(event.key);

  return !isModifier;
}

export const resolveModifiers = (event: KeyboardEvent): RA<ModifierKey> =>
  Object.entries({
    // This order is important - keep it alphabetical
    Alt: event.altKey,
    Ctrl: event.ctrlKey,
    Meta: event.metaKey,
    Shift: event.shiftKey,
  })
    .filter(([_, isPressed]) => isPressed)
    .map(([modifier]) => modifier);

function isInInput(event: KeyboardEvent): boolean {
  // Check if the event target is an editable element.
  const target = event.target as HTMLElement;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
}

/**
 * On all platforms, shift key + letter produces a printable character (i.e shift+a = A)
 *
 * On mac, option (alt) key is used for producing printable characters too, but
 * according to ChatGPT, in browser applications it is expected that keyboard
 * shortcuts take precedence over printing characters.
 */
function isPrintableModifier(modifiers: RA<ModifierKey>): boolean {
  if (modifiers.length === 0) return true;

  if (modifiers.length === 1) return modifiers[0] === 'Shift';

  return false;
}

document.addEventListener(
  'keyup',
  (event) => {
    if (shouldIgnoreKeyPress(event)) return;
    const index = pressedKeys.indexOf(event.key);
    if (index !== -1) pressedKeys.splice(index, 1);
  },
  { passive: true }
);

/**
 * While key up should normally catch key release, that may not always be the
 * case:
 * - If key up occurred outside the browser window
 * - If key up occurred inside of browser devtools
 * - If key up was intercepted by something else (i.e browser extension)
 */
window.addEventListener(
  'blur',
  () => {
    pressedKeys.length = 0;
  },
  { passive: true }
);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pressedKeys.length = 0;
});

export const exportsForTests = {
  keysToString,
  modifierKeys,
  specialKeys,
};
