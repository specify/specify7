import { waitFor } from '@testing-library/react';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import type { StatLayout } from '../types';
import {
  addPageWithCategory,
  addStat,
  findDefaultStat,
  getCategoryItems,
  getRemoveButtons,
  getStatInputs,
  mockSavedQueries,
  mockStatsRequests,
  openChooseStatisticsDialog,
  queryStatButton,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();
mockSavedQueries();

const firstStat = findDefaultStat('holdings', 'specimens');
const secondStat = findDefaultStat('loans', 'openLoansCount');

async function addTwoStats(
  user: User,
  getSharedLayout: () => RA<StatLayout> | undefined
): Promise<void> {
  await addPageWithCategory(user);
  await addStat(user, firstStat);
  await addStat(user, secondStat);
  await waitFor(() =>
    getCategoryItems(getSharedLayout).forEach((item) =>
      expect(item.itemValue).toBeDefined()
    )
  );
}

describe('Deleting a new stat item', () => {
  test('the trash button removes only that stat', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addTwoStats(user, getSharedLayout);
    await user.click(getRemoveButtons(0)[0]);

    expect(getCategoryItems(getSharedLayout).map(({ label }) => label)).toEqual(
      [secondStat.label]
    );
    expect(getStatInputs(0).map(({ value }) => value)).toEqual([
      secondStat.label,
    ]);
  });

  test('deleting every stat leaves an empty category', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addTwoStats(user, getSharedLayout);
    await user.click(getRemoveButtons(0)[0]);
    await user.click(getRemoveButtons(0)[0]);

    expect(getSharedLayout()!.at(-1)!.categories).toEqual([
      { label: 'My Stats', items: [] },
    ]);
  });

  test('a deleted stat is offered again in "available default statistics"', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addTwoStats(user, getSharedLayout);
    await user.click(getRemoveButtons(0)[0]);

    const dialog = await openChooseStatisticsDialog(user);
    expect(queryStatButton(dialog, firstStat.label)).toBeDefined();
    expect(queryStatButton(dialog, secondStat.label)).toBeUndefined();
  });
});
