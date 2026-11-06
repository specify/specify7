import { screen, waitFor, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import type { StatLayout } from '../types';
import {
  addPageWithCategory,
  addStat,
  enterEditMode,
  findDefaultStat,
  getCategoryInputs,
  getCategoryItems,
  getRemoveButtons,
  getStatInputs,
  mockSavedQueries,
  mockStatsRequests,
  openChooseStatisticsDialog,
  queryStatButton,
  renderEmptyStatsPage,
  saveAndReopenEditing,
  type User,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

async function addCategory(user: User): Promise<void> {
  await enterEditMode(user);
  await user.click(
    screen.getByRole('button', { name: statsText.addACategory() })
  );
}

describe('Creating a new category', () => {
  const newName = 'New Category';

  test('"Add a category" adds an empty, unnamed category at the end', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await addCategory(user);

    const inputs = getCategoryInputs();
    expect(inputs).toHaveLength(sharedLayout[0].categories.length + 1);
    expect(inputs.at(-1)).toHaveValue('');
    expect(getSharedLayout()![0].categories).toEqual([
      ...sharedLayout[0].categories,
      { label: '', items: [] },
    ]);
  });

  test('typing a name names the new category', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await addCategory(user);
    await user.type(getCategoryInputs().at(-1)!, newName);

    expect(getSharedLayout()![0].categories).toEqual([
      ...sharedLayout[0].categories,
      { label: newName, items: [] },
    ]);
  });

  test('clicking "Add a category" again adds another category', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await addCategory(user);
    await user.type(getCategoryInputs().at(-1)!, newName);
    await addCategory(user);

    expect(getSharedLayout()![0].categories).toEqual([
      ...sharedLayout[0].categories,
      { label: newName, items: [] },
      { label: '', items: [] },
    ]);
  });

  test('Cancel removes the new category', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await addCategory(user);
    await user.type(getCategoryInputs().at(-1)!, newName);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    expect(getSharedLayout()![0].categories).toEqual(
      sharedLayout[0].categories
    );
  });
});

describe('Editing an existing category', () => {
  const newName = 'Renamed Category';

  test('edit mode shows each category name in an editable field', async () => {
    const { user, sharedLayout } = await renderEmptyStatsPage();
    await enterEditMode(user);

    expect(getCategoryInputs().map(({ value }) => value)).toEqual(
      sharedLayout[0].categories.map(({ label }) => label)
    );
  });

  test('typing a new name renames only that category', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await enterEditMode(user);
    const input = getCategoryInputs()[0];
    await user.clear(input);
    await user.type(input, newName);

    expect(input).toHaveValue(newName);
    const [renamed, ...others] = getSharedLayout()![0].categories;
    const [original, ...originalOthers] = sharedLayout[0].categories;
    expect(renamed).toEqual({ ...original, label: newName });
    expect(others).toEqual(originalOthers);
  });

  test('Cancel restores the original name', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await enterEditMode(user);
    const input = getCategoryInputs()[0];
    await user.clear(input);
    await user.type(input, newName);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    expect(getSharedLayout()![0].categories).toEqual(
      sharedLayout[0].categories
    );
    expect(
      screen.getByRole('heading', { name: sharedLayout[0].categories[0].label })
    ).toBeInTheDocument();
  });
});

const statsToAdd = [
  findDefaultStat('holdings', 'specimens'),
  findDefaultStat('loans', 'openLoansCount'),
  findDefaultStat('locality_geography', 'localityCount'),
];

describe('Adding several statistics', () => {
  mockSavedQueries();

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

const queryName = 'My Saved Query';

async function addSavedQuery(user: User): Promise<void> {
  const dialog = await openChooseStatisticsDialog(user);
  await user.click(
    await within(dialog).findByRole('button', {
      name: new RegExp(`${queryName}$`, 'u'),
    })
  );
}

describe('Adding a stat item with the same name', () => {
  mockSavedQueries([
    {
      id: 1,
      name: queryName,
      contextname: 'Locality',
      contexttableid: 2,
      selectdistinct: false,
      searchsynonymy: false,
      countonly: false,
      timestampcreated: '2026-01-01T00:00:00',
      fields: [],
      resource_uri: '/api/specify/spquery/1/',
    },
  ]);

  test('the second copy is named with "(2)"', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    await addSavedQuery(user);
    await addSavedQuery(user);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(getCategoryItems(getSharedLayout).map(({ label }) => label)).toEqual(
      [queryName, `${queryName} (2)`]
    );
    expect(getStatInputs(0).map(({ value }) => value)).toEqual([
      queryName,
      `${queryName} (2)`,
    ]);
    await waitFor(() =>
      getCategoryItems(getSharedLayout).forEach((item) =>
        expect(item.itemValue).toBeDefined()
      )
    );
  });

  test('a third copy is named with "(3)"', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    for (let index = 0; index < 3; index += 1) await addSavedQuery(user);

    expect(getCategoryItems(getSharedLayout).map(({ label }) => label)).toEqual(
      [queryName, `${queryName} (2)`, `${queryName} (3)`]
    );
    await waitFor(() =>
      getCategoryItems(getSharedLayout).forEach((item) =>
        expect(item.itemValue).toBeDefined()
      )
    );
  });

  test('Save keeps both copies', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    await addPageWithCategory(user);
    await addSavedQuery(user);
    await addSavedQuery(user);
    await waitFor(() =>
      getCategoryItems(getSharedLayout).forEach((item) =>
        expect(item.itemValue).toBeDefined()
      )
    );
    await saveAndReopenEditing(user);

    expect(getCategoryItems(getSharedLayout).map(({ label }) => label)).toEqual(
      [queryName, `${queryName} (2)`]
    );
    expect(screen.getByText(`${queryName} (2)`)).toBeInTheDocument();
  });
});

describe('Renaming a stat item', () => {
  const newName = 'Renamed Stat';

  test('edit mode shows each stat name in an editable field', async () => {
    const { user, sharedLayout } = await renderEmptyStatsPage();
    await enterEditMode(user);

    expect(getStatInputs(0).map(({ value }) => value)).toEqual(
      sharedLayout[0].categories[0].items.map(({ label }) => label)
    );
  });

  test('typing a new name renames only that stat', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await enterEditMode(user);
    const input = getStatInputs(0)[0];
    await user.clear(input);
    await user.type(input, newName);

    expect(input).toHaveValue(newName);
    const [renamed, ...others] = getSharedLayout()![0].categories[0].items;
    const [original, ...originalOthers] = sharedLayout[0].categories[0].items;
    expect(renamed).toEqual({ ...original, label: newName });
    expect(others).toEqual(originalOthers);
    expect(getSharedLayout()![0].categories.slice(1)).toEqual(
      sharedLayout[0].categories.slice(1)
    );
  });

  test('Cancel restores the original name', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await enterEditMode(user);
    const input = getStatInputs(0)[0];
    await user.clear(input);
    await user.type(input, newName);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    expect(getSharedLayout()![0].categories).toEqual(
      sharedLayout[0].categories
    );
  });

  test('Save keeps the new name', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await enterEditMode(user);
    const input = getStatInputs(0)[0];
    await user.clear(input);
    await user.type(input, newName);
    await saveAndReopenEditing(user);

    expect(getSharedLayout()![0].categories[0].items[0]).toEqual({
      ...sharedLayout[0].categories[0].items[0],
      label: newName,
    });
    expect(screen.getByText(newName)).toBeInTheDocument();
  });
});

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
  mockSavedQueries();

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

describe('Deleting an existing stat item', () => {
  mockSavedQueries();

  test('the trash button removes only that stat', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    const [deleted, ...remaining] = sharedLayout[0].categories[0].items;
    await enterEditMode(user);
    await user.click(getRemoveButtons(0)[0]);

    expect(getSharedLayout()![0].categories[0].items).toEqual(remaining);
    expect(getSharedLayout()![0].categories.slice(1)).toEqual(
      sharedLayout[0].categories.slice(1)
    );
    expect(getStatInputs(0).map(({ value }) => value)).not.toContain(
      deleted.label
    );
  });

  test('Cancel brings the stat back', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    await enterEditMode(user);
    await user.click(getRemoveButtons(0)[0]);
    await user.click(screen.getByRole('button', { name: commonText.cancel() }));

    expect(getSharedLayout()![0].categories).toEqual(
      sharedLayout[0].categories
    );
  });

  test('Save keeps the stat deleted', async () => {
    const { user, sharedLayout, getSharedLayout } =
      await renderEmptyStatsPage();
    const [, ...remaining] = sharedLayout[0].categories[0].items;
    await enterEditMode(user);
    await user.click(getRemoveButtons(0)[0]);
    await saveAndReopenEditing(user);

    expect(getSharedLayout()![0].categories[0].items).toEqual(remaining);
  });

  test('a deleted stat is offered again in "available default statistics"', async () => {
    const { user, sharedLayout } = await renderEmptyStatsPage();
    const [deleted, kept] = sharedLayout[0].categories[0].items;
    await enterEditMode(user);
    await user.click(getRemoveButtons(0)[0]);

    const dialog = await openChooseStatisticsDialog(user);
    expect(queryStatButton(dialog, deleted.label)).toBeDefined();
    expect(queryStatButton(dialog, kept.label)).toBeUndefined();
  });
});
