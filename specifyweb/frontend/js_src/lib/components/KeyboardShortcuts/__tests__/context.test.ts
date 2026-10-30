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

test('Escape shortcuts work when an input is focused', () => {
  const callback = jest.fn();
  const cleanup = bindKeyboardShortcut({ other: ['Escape'] }, callback);
  const input = document.createElement('input');
  document.body.append(input);
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    code: 'Escape',
  });

  input.dispatchEvent(event);

  expect(callback).toHaveBeenCalledTimes(1);
  expect(event.defaultPrevented).toBe(true);
  input.dispatchEvent(
    new KeyboardEvent('keyup', { bubbles: true, code: 'Escape' })
  );
  cleanup();
  input.remove();
});
