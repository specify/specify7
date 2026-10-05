import { bindKeyboardShortcut } from '../context';

test('ignores printable shortcuts when a select is focused', () => {
  const callback = jest.fn();
  const cleanup = bindKeyboardShortcut({ other: ['KeyA'] }, callback);
  const select = document.createElement('select');
  document.body.append(select);

  select.dispatchEvent(
    new KeyboardEvent('keydown', { bubbles: true, code: 'KeyA' })
  );

  expect(callback).not.toHaveBeenCalled();
  cleanup();
  select.remove();
});
