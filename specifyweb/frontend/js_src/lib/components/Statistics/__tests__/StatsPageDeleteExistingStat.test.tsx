import { screen } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import {
  enterEditMode,
  getRemoveButtons,
  getStatInputs,
  mockSavedQueries,
  mockStatsRequests,
  openChooseStatisticsDialog,
  queryStatButton,
  renderEmptyStatsPage,
  saveAndReopenEditing,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();
mockSavedQueries();

describe('Deleting an existing stat item', () => {
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
