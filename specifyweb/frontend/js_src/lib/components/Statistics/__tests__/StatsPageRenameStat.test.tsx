import { screen } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { requireContext } from '../../../tests/helpers';
import {
  enterEditMode,
  getStatInputs,
  mockStatsRequests,
  renderEmptyStatsPage,
  saveAndReopenEditing,
} from './statsPageTestUtils';

requireContext();
mockStatsRequests();

const newName = 'Renamed Stat';

describe('Renaming a stat item', () => {
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
