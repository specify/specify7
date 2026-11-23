import { cleanupEmptyShortcuts, resolvePlatformShortcuts } from '../utils';

test('removes empty shortcuts while retaining valid shortcuts', () => {
  expect(
    cleanupEmptyShortcuts({
      mac: ['', 'Meta+KeyA'],
      other: [''],
    })
  ).toEqual({
    mac: ['Meta+KeyA'],
    other: [],
  });
});

test('falls back to Windows shortcuts on other platforms', () => {
  expect(resolvePlatformShortcuts({ windows: ['Ctrl+KeyA'] })).toEqual([
    'Ctrl+KeyA',
  ]);
});

test('falls back to macOS shortcuts with Meta converted to Ctrl', () => {
  expect(resolvePlatformShortcuts({ mac: ['Meta+KeyA'] })).toEqual([
    'Ctrl+KeyA',
  ]);
});
