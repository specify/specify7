import { screen } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import {
  enterEditMode,
  getCategoryInputs,
  mockStatsRequests,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const newName = 'Renamed Category';

describe('Editing an existing category', () => {
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
