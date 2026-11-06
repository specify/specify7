import { screen } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import {
  getCurrentPageName,
  getPageButtons,
  mockStatsRequests,
  renderEmptyStatsPage,
} from './statsPageTestUtils';

jest.mock('../../Permissions/helpers', () => {
  const actual = jest.requireActual('../../Permissions/helpers');
  return {
    ...actual,
    hasPermission: (resource: string, action: string, ...rest: RA<unknown>) =>
      resource === '/preferences/statistics' && action === 'edit_shared'
        ? false
        : actual.hasPermission(resource, action, ...rest),
  };
});

requireContext();
mockStatsRequests();

const sharedSection = statsText.shared();

/** The "Edit" text button, not the pencil icons that share its title */
const queryEditButton = (): HTMLElement | undefined =>
  screen
    .queryAllByRole('button', { name: commonText.edit() })
    .find(({ textContent }) => textContent === commonText.edit());

describe('Without permission to edit shared statistics', () => {
  test('the Edit button is not visible on the shared page', async () => {
    await renderEmptyStatsPage();

    expect(getCurrentPageName(sharedSection)).toBeDefined();
    expect(queryEditButton()).toBeUndefined();
    expect(
      screen.getByRole('button', { name: statsText.refresh() })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: statsText.downloadAsTSV() })
    ).toBeInTheDocument();
  });

  test('the Edit button stays hidden after returning to a shared page', async () => {
    const { user } = await renderEmptyStatsPage();
    await user.click(getPageButtons(statsText.private())[0]);
    await user.click(getPageButtons(sharedSection)[0]);

    expect(getCurrentPageName(sharedSection)).toBeDefined();
    expect(queryEditButton()).toBeUndefined();
  });
});
