import { f } from '../../../utils/functools';
import { sortFunction } from '../../../utils/utils';
import { iconClassName, icons } from '../Icons';

describe('Each icon has aria-hidden and className', () =>
  void Object.entries(icons).forEach(([name, icon]) =>
    test(name, () => {
      expect(icon.props['aria-hidden']).toBe(true);
      expect(icon.props.className).toContain(iconClassName);
      expect(icon.props.viewBox).toBe('0 0 20 20');
    })
  ));

test('Icons are defined in alphabetical order (for consistency)', () =>
  expect(Object.keys(icons)).toEqual(
    Array.from(Object.keys(icons)).sort(sortFunction(f.id))
  ));
