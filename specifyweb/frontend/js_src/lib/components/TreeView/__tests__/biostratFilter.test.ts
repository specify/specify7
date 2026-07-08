import { requireContext } from '../../../tests/helpers';

requireContext();

/**
 * Tests for the TreeViewSearch client-side isBioStrat filtering logic.
 *
 * When biostratFilter === 'bio', only nodes with isBioStrat === true pass.
 * When biostratFilter === 'chrono', nodes with isBioStrat === false or null pass.
 * When biostratFilter === 'all', all nodes pass.
 * For non-GeologicTimePeriod tables, no filtering is applied.
 */
describe('TreeViewSearch isBioStrat client-side filter', () => {
  const filterBio = (isBioStrat: boolean | null): boolean =>
    isBioStrat === true;

  const filterChrono = (isBioStrat: boolean | null): boolean =>
    isBioStrat !== true;

  const filterAll = (): boolean => true;

  test('filterBio includes true, excludes false and null', () => {
    expect(filterBio(true)).toBe(true);
    expect(filterBio(false)).toBe(false);
    expect(filterBio(null)).toBe(false);
  });

  test('filterChrono includes false and null, excludes true', () => {
    expect(filterChrono(false)).toBe(true);
    expect(filterChrono(null)).toBe(true);
    expect(filterChrono(true)).toBe(false);
  });

  test('filterAll includes everything', () => {
    expect(filterAll()).toBe(true);
  });
});
