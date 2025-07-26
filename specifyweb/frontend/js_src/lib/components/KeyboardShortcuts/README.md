# Keyboard shortcuts

## Steps to add a new keyboard shortcut:

1. Add a new preference item like this:
   ```ts
   goToLastRecord: defineKeyboardShortcut(
    formsText.goToLastRecord(),
    'Ctrl+Shift+ArrowDown'
   ),
   ```
   - We use event.code as key name (see
     [mdn list](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_code_values).
     [playground](https://www.toptal.com/developers/keycode)). This is so that
     it works regardless of keyboard language. In preferences, use "Ctrl" even
     on a mac - the system will automatically interpret Ctrl as Cmd if user is
     on a mac.
   - Most of the time the keyboard shortcuts between the platforms will be the
     same, but if different ones are needed to avoid OS conflicts, the 2nd
     argument to defineKeyboardShortcut could be an object like
     `{ windows: "", mac: "", linux: "" }`. ios devices are treated as mac. In
     spirit of sp6, all "other" devices are treated as linux.
2. Inside react component, use the following hook to handle a specific keyboard
   shortcut:
   ```tsx
   const goToLastRecordShortcut = userPreferences.useKeyboardShortcut(
     'form',
     'recordSet',
     'goToLastRecord',
     handleGoToLastRecord
   );
   ```
   - callback can be undefined if you need to conditionally disable the keyboard
     shortcut
   - callback can be an arrow function - does not need a stable function between
     re-renders - no need for useCallback
