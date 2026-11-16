import { act, fireEvent } from '@testing-library/react';
import React from 'react';

import { preferencesText } from '../../../localization/preferences';
import { mount } from '../../../tests/reactUtils';
import { localized } from '../../../utils/types';
import { KeyboardShortcutCheatSheet } from '../CheatSheet';
import { bindKeyboardShortcut } from '../context';

beforeEach(() => {
  jest.useFakeTimers();
  const portalRoot = document.createElement('div');
  portalRoot.id = 'portal-root';
  document.body.append(portalRoot);
});

afterEach(() => {
  jest.useRealTimers();
  document.querySelector('#portal-root')?.remove();
});

test('shows active shortcuts after holding Control for one second', () => {
  const cleanup = bindKeyboardShortcut(
    { other: ['Ctrl+KeyA'] },
    jest.fn(),
    localized('Add record')
  );
  const { queryByRole, getByText } = mount(<KeyboardShortcutCheatSheet />);

  fireEvent.keyDown(document, { code: 'ControlLeft', key: 'Control' });
  act(() => jest.advanceTimersByTime(999));
  expect(
    queryByRole('dialog', { name: preferencesText.keyboardShortcuts() })
  ).not.toBeInTheDocument();

  act(() => jest.advanceTimersByTime(1));
  expect(
    queryByRole('dialog', { name: preferencesText.keyboardShortcuts() })
  ).toBeInTheDocument();
  expect(getByText('Add record')).toBeInTheDocument();

  fireEvent.keyUp(document, { code: 'ControlLeft', key: 'Control' });
  expect(
    queryByRole('dialog', { name: preferencesText.keyboardShortcuts() })
  ).not.toBeInTheDocument();
  cleanup();
});

test('cancels the pop-up when another key is pressed', () => {
  const cleanup = bindKeyboardShortcut(
    { other: ['Ctrl+KeyA'] },
    jest.fn(),
    localized('Add record')
  );
  const { queryByRole } = mount(<KeyboardShortcutCheatSheet />);

  fireEvent.keyDown(document, { code: 'ControlLeft', key: 'Control' });
  fireEvent.keyDown(document, { code: 'KeyA', key: 'a' });
  act(() => jest.advanceTimersByTime(2000));

  expect(queryByRole('dialog')).not.toBeInTheDocument();
  cleanup();
});

test('does not open for chords with multiple modifiers', () => {
  const { queryByRole } = mount(<KeyboardShortcutCheatSheet />);

  fireEvent.keyDown(document, { code: 'MetaLeft', key: 'Meta' });
  fireEvent.keyDown(document, { code: 'ShiftLeft', key: 'Shift' });
  act(() => jest.advanceTimersByTime(1000));

  expect(queryByRole('dialog')).not.toBeInTheDocument();
});

test.each([
  ['Shift', 'Control'],
  ['Alt', 'Control'],
])('does not open when %s is pressed before %s', (first, second) => {
  const { queryByRole } = mount(<KeyboardShortcutCheatSheet />);

  fireEvent.keyDown(document, { key: first });
  fireEvent.keyDown(document, { key: second });
  act(() => jest.advanceTimersByTime(1000));

  expect(queryByRole('dialog')).not.toBeInTheDocument();
});

test('shows context shortcuts above global shortcuts with a separator', () => {
  const cleanupContext = bindKeyboardShortcut(
    { other: ['Ctrl+KeyA'] },
    jest.fn(),
    localized('Context action')
  );
  const cleanupGlobal = bindKeyboardShortcut(
    { other: ['Ctrl+KeyB'] },
    jest.fn(),
    localized('Global action'),
    'global'
  );
  const { getByRole, getByText } = mount(<KeyboardShortcutCheatSheet />);

  fireEvent.keyDown(document, { code: 'ControlLeft', key: 'Control' });
  act(() => jest.runOnlyPendingTimers());

  const contextShortcut = getByText('Context action');
  const separator = getByRole('separator');
  const globalShortcut = getByText('Global action');
  expect(
    contextShortcut.compareDocumentPosition(separator) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();
  expect(
    separator.compareDocumentPosition(globalShortcut) &
      Node.DOCUMENT_POSITION_FOLLOWING
  ).toBeTruthy();

  cleanupContext();
  cleanupGlobal();
});
