import { screen } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import {
  enterEditMode,
  getCategoryInputs,
  mockStatsRequests,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const newName = 'New Category';

async function addCategory(user: User): Promise<void> {
  await enterEditMode(user);
  await user.click(
    screen.getByRole('button', { name: statsText.addACategory() })
  );
}

describe('Creating a new category', () => {
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
