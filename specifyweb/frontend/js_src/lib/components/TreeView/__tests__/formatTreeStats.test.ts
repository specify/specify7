import { requireContext } from '../../../tests/helpers';
import { formatTreeStats } from '../helpers';

requireContext();

describe('formatTreeStats', () => {
  test('leaf node without synonym count', () => {
    expect(
      formatTreeStats(
        { directCount: 3, childCount: 0, synonymCount: undefined },
        true
      ).text
    ).toBe('(3)');
  });

  test('internal node without synonym count', () => {
    expect(
      formatTreeStats(
        { directCount: 3, childCount: 5, synonymCount: undefined },
        false
      ).text
    ).toBe('(3, 5)');
  });

  test('leaf node with synonym count', () => {
    expect(
      formatTreeStats({ directCount: 0, childCount: 0, synonymCount: 2 }, true)
        .text
    ).toBe('(0, 2)');
  });

  test('internal node with synonym count', () => {
    expect(
      formatTreeStats({ directCount: 3, childCount: 5, synonymCount: 2 }, false)
        .text
    ).toBe('(3, 5, 2)');
  });

  test('synonym count is included in the tooltip', () => {
    const title = formatTreeStats(
      { directCount: 3, childCount: 5, synonymCount: 2 },
      false
    ).title;
    expect(title).toContain('2');
    expect(title.split('\n')).toHaveLength(3);
  });
});
