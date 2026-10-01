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

test('shows active shortcuts after holding Control for three seconds', () => {
  const cleanup = bindKeyboardShortcut(
    { other: ['Ctrl+KeyA'] },
    jest.fn(),
    localized('Add record')
  );
  const { queryByRole, getByText } = mount(<KeyboardShortcutCheatSheet />);

  fireEvent.keyDown(document, { code: 'ControlLeft', key: 'Control' });
  act(() => jest.advanceTimersByTime(2999));
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
  act(() => jest.advanceTimersByTime(3000));

  expect(queryByRole('dialog')).not.toBeInTheDocument();
  cleanup();
});
