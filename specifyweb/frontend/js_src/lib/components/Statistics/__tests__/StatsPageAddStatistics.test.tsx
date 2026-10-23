import { screen } from '@testing-library/react';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import {
  addPageWithCategory,
  addStat,
  findDefaultStat,
  getCategoryItems,
  mockSavedQueries,
  mockStatsRequests,
  openChooseStatisticsDialog,
  queryStatButton,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();
mockSavedQueries();

const statsToAdd = [
  findDefaultStat('holdings', 'specimens'),
  findDefaultStat('loans', 'openLoansCount'),
  findDefaultStat('locality_geography', 'localityCount'),
];

describe('Adding several statistics', () => {
  test('"Add" opens the "Choose Statistics" dialog with the default statistics', async () => {
    const { user } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    const dialog = await openChooseStatisticsDialog(user);

    statsToAdd.forEach(({ label }) =>
      expect(queryStatButton(dialog, label)).toBeDefined()
    );
  });

  test('adds each chosen statistic to the end of the category', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addPageWithCategory(user);

    for (const [index, stat] of statsToAdd.entries()) {
      await addStat(user, stat);
      expect(
        screen.queryByRole('dialog', { name: statsText.chooseStatistics() })
      ).not.toBeInTheDocument();
      expect(
        getCategoryItems(getSharedLayout).map(
          (item) =>
            item.type === 'DefaultStat' && [item.categoryName, item.itemName]
        )
      ).toEqual(
        statsToAdd
          .slice(0, index + 1)
          .map(({ categoryName, itemName }) => [categoryName, itemName])
      );
    }
  });

  test('a statistic already on the page is no longer offered', async () => {
    const { user } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    await addStat(user, statsToAdd[0]);

    const dialog = await openChooseStatisticsDialog(user);
    expect(queryStatButton(dialog, statsToAdd[0].label)).toBeUndefined();
    expect(queryStatButton(dialog, statsToAdd[1].label)).toBeDefined();
  });
});
