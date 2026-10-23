import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { defaultLayoutGenerated } from '../StatsSpec';
import type { RA } from '../../../utils/types';
import type { DefaultStat, StatLayout } from '../types';
import {
  addSharedPage,
  getCategoryInputs,
  mockStatsRequests,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();
overrideAjax(
  '/api/specify/spquery/?limit=10&specifyuser=2&offset=0&orderby=-name',
  { objects: [], meta: { limit: 10, offset: 0, total_count: 0 } }
);

const newCategoryName = 'My Stats';

const findDefaultStat = (category: string, item: string): DefaultStat =>
  defaultLayoutGenerated[0].categories
    .flatMap(({ items }) => items)
    .find(
      (stat): stat is DefaultStat =>
        stat.type === 'DefaultStat' &&
        stat.categoryName === category &&
        stat.itemName === item
    )!;

const statsToAdd = [
  findDefaultStat('holdings', 'specimens'),
  findDefaultStat('loans', 'openLoansCount'),
  findDefaultStat('locality_geography', 'localityCount'),
];

async function addPageWithCategory(user: User): Promise<void> {
  await addSharedPage(user, 'Stats Page');
  await user.click(
    screen.getByRole('button', { name: statsText.addACategory() })
  );
  await user.type(getCategoryInputs()[0], newCategoryName);
}

async function openChooseStatisticsDialog(user: User): Promise<HTMLElement> {
  await user.click(
    within(getCategoryInputs()[0].closest('li')!).getByRole('button', {
      name: commonText.add(),
    })
  );
  return screen.findByRole('dialog', { name: statsText.chooseStatistics() });
}

const queryStatButton = (dialog: HTMLElement, label: string) =>
  within(dialog)
    .queryAllByRole('button')
    .find((button) => button.firstElementChild?.textContent === label);

async function addStat(user: User, stat: DefaultStat): Promise<void> {
  const dialog = await openChooseStatisticsDialog(user);
  await user.click(queryStatButton(dialog, stat.label)!);
}

const getCategoryItems = (getSharedLayout: () => RA<StatLayout> | undefined) =>
  getSharedLayout()!.at(-1)!.categories[0].items;

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
