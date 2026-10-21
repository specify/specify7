import { fireEvent, screen } from '@testing-library/react';
import React from 'react';

import { mount } from '../../../tests/reactUtils';

import { KeyboardShortcutPreferenceItem } from '../Shortcuts';
import { bindKeyboardShortcut } from '../context';

test('accepts a complete chord on release without an inner Save button', async () => {
  const onChange = jest.fn();
  const shortcutAction = jest.fn();
  const cleanup = bindKeyboardShortcut(
    { other: ['Ctrl+KeyK'] },
    shortcutAction
  );
  const { user } = mount(
    <KeyboardShortcutPreferenceItem onChange={onChange} />
  );
  await user.click(screen.getByRole('button', { name: 'Add' }));
  expect(
    screen.queryByRole('button', { name: 'Save' })
  ).not.toBeInTheDocument();

  await user.keyboard('{Control>}{k>}');
  expect(onChange).not.toHaveBeenCalled();
  await user.keyboard('{/k}{/Control}');
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith({ other: ['Ctrl+KeyK'] });
  expect(shortcutAction).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeEnabled();
  cleanup();
});

test('cancels editing without changing the existing shortcut', async () => {
  const onChange = jest.fn();
  const { user } = mount(
    <KeyboardShortcutPreferenceItem
      value={{ other: ['KeyA'] }}
      onChange={onChange}
    />
  );
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByText('a')).toBeInTheDocument();
});

test('cancels an empty addition and removes an existing shortcut explicitly', async () => {
  const onChange = jest.fn();
  const { user } = mount(
    <KeyboardShortcutPreferenceItem
      value={{ other: ['KeyA'] }}
      onChange={onChange}
    />
  );
  await user.click(screen.getByRole('button', { name: 'Add' }));
  await user.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getAllByRole('button', { name: 'Edit' })).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByRole('button', { name: 'Remove' }));
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith({});
});

test('parent rerenders do not finish recording or release the recorder lock', async () => {
  const onChange = jest.fn();
  const content = () => (
    <>
      <KeyboardShortcutPreferenceItem onChange={(value) => onChange(value)} />
      <KeyboardShortcutPreferenceItem onChange={onChange} />
    </>
  );
  const { user, rerender } = mount(content());
  await user.click(screen.getAllByRole('button', { name: 'Add' })[0]);
  rerender(content());
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getAllByRole('button', { name: 'Add' })[1]).toBeDisabled();
  await user.keyboard('k');
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith({ other: ['KeyK'] });
  expect(screen.getAllByRole('button', { name: 'Add' })[1]).toBeEnabled();
});

test('unmounting an unfinished recording does not save an empty entry', async () => {
  const onChange = jest.fn();
  const { user, unmount } = mount(
    <KeyboardShortcutPreferenceItem onChange={onChange} />
  );
  await user.click(screen.getByRole('button', { name: 'Add' }));
  unmount();
  fireEvent.keyUp(document, { key: 'k', code: 'KeyK' });
  expect(onChange).not.toHaveBeenCalled();
  mount(<KeyboardShortcutPreferenceItem onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled();
});

test('records multiple held keys and ignores modifier-only input', async () => {
  const onChange = jest.fn();
  const { user } = mount(
    <KeyboardShortcutPreferenceItem onChange={onChange} />
  );
  await user.click(screen.getByRole('button', { name: 'Add' }));
  await user.keyboard('{Shift>}{/Shift}');
  expect(onChange).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  await user.keyboard('{Control>}{d>}{v>}{/v}{/d}{/Control}');
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith({ other: ['Ctrl+KeyD+KeyV'] });
});
