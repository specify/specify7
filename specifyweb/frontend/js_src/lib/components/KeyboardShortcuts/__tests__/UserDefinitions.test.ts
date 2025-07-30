import { requireContext } from '../../../tests/helpers';
import type { GenericPreferences } from '../../Preferences/types';
import { userPreferenceDefinitions } from '../../Preferences/UserDefinitions';
import type { KeyboardShortcuts, ModifierKey } from '../config';
import { keyLocalizations, modifierKeys, specialKeyboardKeys } from '../config';
import { exportsForTests, keyJoinSymbol } from '../context';

requireContext();

const { keysToString } = exportsForTests;

test('Validate default keyboard shortcuts in userPreferenceDefinitions', () => {
  Object.entries(userPreferenceDefinitions as GenericPreferences).forEach(
    ([category, definition]) =>
      Object.entries(definition.subCategories).forEach(
        ([subCategory, subDefinition]) =>
          Object.entries(subDefinition.items).forEach(
            ([item, itemDefinition]) => {
              const isKeyboardShortcut =
                'renderer' in itemDefinition &&
                itemDefinition.renderer.name ===
                  'KeyboardShortcutPreferenceItem';
              if (!isKeyboardShortcut) return;

              const defaultValue =
                itemDefinition.defaultValue as KeyboardShortcuts;

              console.log(category, subCategory, item, defaultValue);
              if (typeof defaultValue !== 'object') return;

              Object.entries(defaultValue).forEach(([platform, shortcuts]) =>
                shortcuts?.forEach((shortcut) => {
                  const error = validateShortcut(shortcut, platform);
                  if (error !== undefined)
                    // eslint-disable-next-line functional/no-throw-statement
                    throw new Error(
                      `Invalid default value for a keyboard shortcut for ${category}.${subCategory}.${item} for platform "${platform}" (value: ${shortcut}). Error: ${String(
                        error
                      )}`
                    );
                })
              );
            }
          )
      )
  );

  // Useless assertion to have at least one assertion in the test
  expect(1).toBe(1);
});

function validateShortcut(
  shortcut: string,
  platform: keyof KeyboardShortcuts
): string | undefined {
  const parts = shortcut.split(keyJoinSymbol);
  if (parts.length === 0) return 'unexpected empty shortcut';

  const shortcutModifierKeys = parts
    .map((part) => part as ModifierKey)
    .filter((part) => modifierKeys.includes(part))
    .sort();
  const nonModifierKeys = parts
    .filter((part) => !modifierKeys.includes(part as ModifierKey))
    .sort();
  const normalizedShortcut = keysToString(
    shortcutModifierKeys,
    nonModifierKeys
  );
  if (normalizedShortcut !== shortcut)
    return `shortcut is not normalized: ${normalizedShortcut} (expected keys to be sorted, with modifier keys before non-modifiers)`;

  if (shortcutModifierKeys.length === 0) {
    const specialKey = nonModifierKeys.find((key) =>
      specialKeyboardKeys.has(key)
    );
    if (typeof specialKey === 'string')
      return `can't use special reserved keys as default shortcuts, unless prefixed with a modifier key. Found ${specialKey}`;
  }

  if (platform !== 'mac' && shortcutModifierKeys.includes('Meta'))
    return `can't use meta (cmd) key in non-mac platform as those are reserved for system shortcuts`;

  if (nonModifierKeys.length === 0)
    return 'shortcut must contain at least one non-modifier key';

  const disallowedKey = nonModifierKeys.find((key) => !allowed.has(key));
  if (typeof disallowedKey === 'string')
    return `found an unknown key code: ${disallowedKey}. Make sure you are using key code rather than key name (e.g. use "KeyA" instead of "a"). To test, see what "keydown" event gives you for event.code (rather than event.key). If you are sure you have the key code, then you can extend the list of allowed keys in this test`;

  return undefined;
}

/**
 * To guard against typos, this list defines the list of keys that may appear in
 * default keyboard shortcuts. If some key is missing, feel free to add it to
 * this list
 *
 * See a full list of possible keys browsers could capture here:
 * https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#special_values
 */
const allowed = new Set([
  // Not including modifier keys as the above check will only check non-modifiers
  ...Array.from(specialKeyboardKeys),
  ...Object.keys(keyLocalizations),
  'BrowserBack',
  'BrowserForward',
  'BrowserHome',
  'BrowserRefresh',
  'BrowserSearch',
  'Add',
  'Multiply',
  'Subtract',
  'Decimal',
  'Divide',
  /*
   * This list doesn't include more obscure keys, but we probably shouldn't be
   * using those in key shortcuts anyway
   */
]);
