import { screen, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { formsText } from '../../../localization/forms';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { getUniqueName } from '../../../utils/uniquifyName';
import { defaultLayoutGenerated } from '../StatsSpec';
import type { CustomStat } from '../types';
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
    QueryBuilder: ({
      autoRun,
      onChange: handleChange,
    }: {
      readonly autoRun?: boolean;
      readonly onChange?: (query: {
        readonly fields: RA<unknown>;
        readonly isDistinct: boolean;
      }) => void;
    }) => {
      mockQueryBuilderRenders.push({
        isReadOnly: React.useContext(ReadOnlyContext),
        autoRun,
      });
      return React.createElement(
        React.Fragment,
        {},
        React.createElement('div', {}, 'Query Builder'),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () =>
              handleChange?.({
                fields: jest
                  .requireActual('../hooks')
                  .makeSerializedFieldsFromPaths('CollectionObject', [
                    { path: 'catalogNumber' },
                  ]),
                isDistinct: false,
              }),
          },
          'Add a field'
        )
      );
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

const getPrivateSection = (): HTMLElement =>
  screen.getByRole('heading', { name: statsText.private() }).closest('li')!;

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

  test('switching to a shared page while editing disables it and its statistics', async () => {
    const { user, sharedLayout } = await renderEmptyStatsPage();
    await user.click(getPageButtons(statsText.private())[0]);
    await enterEditMode(user);
    await user.click(getPageButtons(sharedSection)[0]);

    expect(getCurrentPageName(sharedSection)).toBe(sharedLayout[0].label);
    expect(
      screen.getByRole('button', { name: commonText.save() })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: statsText.addACategory() })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: statsText.deleteCategory() })
    ).not.toBeInTheDocument();

    const statLabels = sharedLayout[0].categories.flatMap(({ items }) =>
      items.map(({ label }) => label)
    );
    const statButtons = screen
      .getAllByRole('button')
      .filter((button) =>
        statLabels.includes(button.firstElementChild?.textContent ?? '')
      );
    expect(statButtons).toHaveLength(statLabels.length);
    statButtons.forEach((button) => expect(button).toBeDisabled());

    const queryStat = findDefaultStat('loans', 'openLoansCount');
    await user.click(
      statButtons.find(
        (button) => button.firstElementChild?.textContent === queryStat.label
      )!
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
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

describe('Private pages without permission to edit shared statistics', () => {
  const privateStat = defaultLayoutGenerated[1].categories[0].items[0];

  async function openPrivateStat(user: User): Promise<HTMLElement> {
    await user.click(getPageButtons(statsText.private())[0]);
    const statButton = screen
      .getAllByRole('button')
      .find(
        (button) => button.firstElementChild?.textContent === privateStat.label
      )!;
    await user.click(statButton);
    return screen.getByRole('dialog', { name: privateStat.label });
  }

  test('the query on a statistic can be modified and saved', async () => {
    const { user, getPersonalLayout } = await renderEmptyStatsPage();
    const dialog = await openPrivateStat(user);
    const save = within(dialog).getByRole('button', {
      name: commonText.save(),
    });

    await user.click(
      within(dialog).getByRole('button', { name: 'Add a field' })
    );
    expect(save).toBeEnabled();
    await user.click(save);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const stat = getPersonalLayout()![0].categories[0].items[0] as CustomStat;
    expect(stat).toMatchObject({
      type: 'CustomStat',
      label: privateStat.label,
      querySpec: { tableName: 'CollectionObject' },
    });
    expect(stat.querySpec.fields.map(({ path }) => path)).toEqual([
      'catalogNumber',
    ]);
  });

  test('Save and Clone are available', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openPrivateStat(user);

    expect(
      within(dialog).getByRole('button', { name: commonText.save() })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: formsText.clone() })
    ).toBeEnabled();
  });

  test('Clone adds a copy of the statistic to the category', async () => {
    const { user, getPersonalLayout } = await renderEmptyStatsPage();
    const itemCount = getPersonalLayout()![0].categories[0].items.length;
    const dialog = await openPrivateStat(user);
    await user.click(
      within(dialog).getByRole('button', { name: formsText.clone() })
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const items = getPersonalLayout()![0].categories[0].items;
    expect(items).toHaveLength(itemCount + 1);
    expect(items[0].label).toBe(privateStat.label);
    expect(items.at(-1)).toMatchObject({
      type: privateStat.type,
      label: getUniqueName(privateStat.label, [privateStat.label]),
    });
  });

  test('private layout pages have a pencil and "+" icon while editing', async () => {
    const { user } = await renderEmptyStatsPage();
    await user.click(getPageButtons(statsText.private())[0]);
    await enterEditMode(user);

    expect(
      within(getPrivateSection()).getByRole('button', {
        name: commonText.add(),
      })
    ).toBeEnabled();

    const privatePages = within(getPrivateSection()).getAllByRole('listitem');
    expect(privatePages.length).toBeGreaterThan(0);
    privatePages.forEach((page) => {
      const pencil = within(page).getByRole('button', {
        name: commonText.edit(),
      });
      expect(pencil).toBeEnabled();
      expect(pencil).not.toHaveClass('invisible');
    });
  });
});
