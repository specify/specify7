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
export type KeyboardShortcuts = Partial<RR<Platform, RA<string> | undefined>>;

type Platform = 'mac' | 'other' | 'windows';
const platform: Platform =
  navigator.platform.toLowerCase().includes('mac') ||
  // Check for iphone || ipad || ipod
  navigator.platform.toLowerCase().includes('ip')
    ? 'mac'
    : navigator.platform.toLowerCase().includes('win')
    ? 'windows'
    : 'other';

const modifierKeys = ['alt', 'control', 'meta', 'shift'];
type ModifierKey = typeof modifierKeys[number];
const modifierKeyNames = new Set(modifierKeys);

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
): void {
  interceptor = callback;
}

/*
 * FIXME: handle case when key shortcut is not set for current platform
 * FIXME: add test for default preferences containing non-existing shortcuts
 * FIXME: add test for having shortcuts sorted
 * FIXME: add test for not binding defaults to Enter/Tab/Space/Escape other forbidden keys (ask ChatGPT for full list)
 * FIXME: make the useKeyboardShortcut() hook also return a localized keyboard
 * shortcut string for usage in UI tooltips
 */
export function bindKeyboardShortcut(
  shortcut: KeyboardShortcuts,
  callback: () => void
): () => void {
  const shortcuts = shortcut[platform] ?? [];
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

const keysToString = (modifiers: RA<ModifierKey>, keys: RA<string>): string =>
  [...modifiers, ...keys].join('+');

// eslint-disable-next-line functional/prefer-readonly-type
const pressedKeys: string[] = [];

document.addEventListener('keydown', (event) => {
  if (shouldIgnoreKeyPress(event)) return;
  if (pressedKeys.includes(event.key)) return;

  pressedKeys.push(event.key);
  pressedKeys.sort();

  const modifiers = resolveModifiers(event);
  const isEntering = isInInput(event);
  // FIXME: should this include alt too?
  const noModifiers = modifiers.length === 0 || modifiers[0] === 'Shift';
  // Ignore single key shortcuts when in an input field
  const ignore = noModifiers && isEntering;
  if (ignore) return;

  const keyString = keysToString(modifiers, pressedKeys);
  const handler = interceptor ?? listeners.get(keyString);
  if (typeof handler === 'function') {
    handler(keyString);
    /*
     * Do this only after calling handler, so that if handler throws an
     * exception, the event can still be handled normally by the browser
     */
    event.preventDefault();
    event.stopPropagation();
  }
});

function shouldIgnoreKeyPress(event: KeyboardEvent): boolean {
  const key = event.key;

  if (event.isComposing || event.repeat) return true;

  /**
   * Do not allow binding keyboard shortcuts to Tab key. That key is
   * important for accessibility and for keyboard navigation. Without it
   * you won't be able to tab your way to the "Save" button to save the
   * keyboard shortcut)
   */
  if (key === 'Tab') return true;
  // See https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key#value
  if (key === 'Dead' || key === 'Unidentified') return true;
  // FIXME: ignore all modifiers: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#modifier_keys
  const isModifier = modifierKeyNames.has(event.key.toLowerCase());

  return !isModifier;
}

const resolveModifiers = (event: KeyboardEvent): RA<ModifierKey> =>
  Object.entries({
    // This order is important - keep it alphabetical
    alt: event.altKey,
    ctrl: event.ctrlKey,
    meta: event.metaKey,
    shift: event.shiftKey,
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
