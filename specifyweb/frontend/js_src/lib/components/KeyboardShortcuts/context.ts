/**
 * Allows to register a key listener
 */

import type { RA, WritableArray } from '../../utils/types';
import type { KeyboardShortcuts, ModifierKey } from './config';
import { allModifierKeys, specialKeyboardKeys } from './config';
import { resolvePlatformShortcuts } from './utils';

/**
 * To keep the event listener as fast as possible, we are not looping though all
 * set keyboard shortcuts and checking if any matches the set value - instead,
 * the registered shortcuts are stored in this hashmap, making it very easy
 * to check if a listener for current key combination exists.
 *
 * At the same time, some of our UI can be nested (imagine the record selector
 * in a record set listening for next/previous record keyboard shortcut, and
 * then the user opens a modal that also listens for the same shortcut) - to
 * have things work correctly, we store listeners as a stack, with the most
 * recently added listener (last one) being the active one.
 */
const listeners = new Map<string, WritableArray<() => void>>();

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
    const shortcutListeners = listeners.get(string);
    if (shortcutListeners === undefined) listeners.set(string, [callback]);
    else shortcutListeners.push(callback);
  });
  return () =>
    shortcuts.forEach((string) => {
      const activeListeners = listeners.get(string)!;
      const lastIndex = activeListeners.lastIndexOf(callback);
      if (lastIndex !== -1) activeListeners.splice(lastIndex, 1);
      if (activeListeners.length === 0) listeners.delete(string);
    });
}

/**
 * Assumes keys and modifiers are sorted
 */
const keysToString = (modifiers: RA<ModifierKey>, keys: RA<string>): string =>
  [...modifiers, ...keys].join(keyJoinSymbol);
export const keyJoinSymbol = '+';

// eslint-disable-next-line functional/prefer-readonly-type
const pressedKeys: string[] = [];

// Keep this code fast as it's in the hot path
document.addEventListener('keydown', (event) => {
  if (shouldIgnoreKeyPress(event)) return;

  const modifiers = resolveModifiers(event);
  const isEntering = isInInput(event);
  const isPrintable = isPrintableModifier(modifiers);
  // Ignore shortcuts that result in printed characters when in an input field
  const ignore = isPrintable && isEntering;
  if (ignore) return;
  if (modifiers.length === 0 && specialKeyboardKeys.has(event.code)) return;

  if (!pressedKeys.includes(event.code)) {
    pressedKeys.push(event.code);
    pressedKeys.sort();
  }

  const keyString = keysToString(modifiers, pressedKeys);
  const handler = interceptor ?? listeners.get(keyString)?.at(-1);
  if (typeof handler === 'function') {
    handler(keyString);
    /*
     * Do this only after calling the handler, so that if handler throws an
     * exception, the event can still be handled normally by the browser
     */
    event.preventDefault();
    event.stopPropagation();
  }

  /**
   * For key combinations involving arrows, the keyup is not fired reliably
   * on macOS (i.e for Cmd+Shift+ArrowUp), thus we need to clear the pressed
   * keys. This means you can't have a shortcut like Cmd+Shift+KeyQ+ArrowUp
   */
  if (keyString.includes('Arrow')) pressedKeys.length = 0;
});

function shouldIgnoreKeyPress(event: KeyboardEvent): boolean {
  const code = event.code;

  if (event.isComposing || event.repeat) return true;

  // See https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values
  if (
    code === 'Dead' ||
    code === 'Unidentified' ||
    code === 'Unidentified' ||
    code === ''
  )
    return true;

  // Do not allow binding a key shortcut directly to a modifier key
  return allModifierKeys.has(event.code);
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
    const index = pressedKeys.indexOf(event.code);
    if (index === -1) pressedKeys.splice(index, 1);

    /*
     * If un-pressed any modifier, consider current shortcut finished.
     *
     * This is a workaround for an issue on macOS where in a shortcut like
     * Cmd+Shift+ArrowUp, the keyup even is fired for Cmd and Shift, but not
     * for ArrowUp
     */
    const isModifier = allModifierKeys.has(event.code);
    if (isModifier) pressedKeys.length = 0;
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
};
