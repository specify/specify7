import { iconClassName, icons } from '../Icons';

describe('Each icon has aria-hidden and className', () =>
  Object.entries(icons).forEach(([name, icon]) =>
    test(name, () => {
      expect(icon.props['aria-hidden']).toBe(true);
      expect(icon.props['className'].includes(iconClassName)).toBe(true);
      expect(icon.props['viewBox']).toBe('0 0 20 20');
    })
  ));
