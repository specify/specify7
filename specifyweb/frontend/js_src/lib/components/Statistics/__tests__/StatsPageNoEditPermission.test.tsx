import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import {
  enterEditMode,
  findDefaultStat,
  getCurrentPageName,
  getPageButtons,
  mockStatsRequests,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

const mockQueryBuilderRenders: Array<{
  readonly isReadOnly: boolean;
  readonly autoRun: boolean | undefined;
}> = [];

jest.mock('../../QueryBuilder/Wrapped', () => {
  const React = jest.requireActual('react');
  const { ReadOnlyContext } = jest.requireActual('../../Core/Contexts');
  return {
    QueryBuilder: ({ autoRun }: { readonly autoRun?: boolean }) => {
      mockQueryBuilderRenders.push({
        isReadOnly: React.useContext(ReadOnlyContext),
        autoRun,
      });
      return React.createElement('div', {}, 'Query Builder');
    },
  };
});

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

const queryEditButton = (): HTMLElement | undefined =>
  screen
    .queryAllByRole('button', { name: commonText.edit() })
    .find(({ textContent }) => textContent === commonText.edit());

const getSharedSection = (): HTMLElement =>
  screen.getByRole('heading', { name: sharedSection }).closest('li')!;

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

  test('shared layout pages have no pencil or "+" icon while editing', async () => {
    const { user } = await renderEmptyStatsPage();
    // The Edit button is only available from a private page
    await user.click(getPageButtons(statsText.private())[0]);
    await enterEditMode(user);
    expect(
      screen.getByRole('button', { name: commonText.save() })
    ).toBeInTheDocument();

    expect(
      within(getSharedSection()).queryByRole('button', {
        name: commonText.add(),
      })
    ).not.toBeInTheDocument();

    const sharedPages = within(getSharedSection()).getAllByRole('listitem');
    expect(sharedPages.length).toBeGreaterThan(0);
    sharedPages.forEach((page) => {
      const pencil = within(page).getByRole('button', {
        name: commonText.edit(),
      });
      expect(pencil).toBeDisabled();
      expect(pencil).toHaveClass('invisible');
    });
  });
});

describe('Opening a shared query statistic without edit permission', () => {
  const queryStat = findDefaultStat('loans', 'openLoansCount');

  async function openQueryStat(user: User): Promise<HTMLElement> {
    const statButton = screen
      .getAllByRole('button')
      .find(
        (button) => button.firstElementChild?.textContent === queryStat.label
      )!;
    await user.click(statButton);
    return screen.getByRole('dialog', { name: queryStat.label });
  }

  beforeEach(() => {
    mockQueryBuilderRenders.length = 0;
  });

  test('Save is not available and Clone is disabled', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openQueryStat(user);

    expect(
      within(dialog).queryByRole('button', { name: commonText.save() })
    ).not.toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: formsText.clone() })
    ).toBeDisabled();
    expect(
      within(dialog).getByRole('button', { name: commonText.close() })
    ).toBeEnabled();
  });

  test('the query can still be modified and is run', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openQueryStat(user);

    expect(within(dialog).getByText('Query Builder')).toBeInTheDocument();
    expect(mockQueryBuilderRenders.length).toBeGreaterThan(0);
    mockQueryBuilderRenders.forEach(({ isReadOnly, autoRun }) => {
      expect(isReadOnly).toBe(false);
      expect(autoRun).toBe(true);
    });
  });
});
