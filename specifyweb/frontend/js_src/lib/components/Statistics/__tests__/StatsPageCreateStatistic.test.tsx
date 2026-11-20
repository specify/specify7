import { screen, waitFor, within } from '@testing-library/react';
import { commonText } from '../../../localization/common';
import { queryText } from '../../../localization/query';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { tables } from '../../DataModel/tables';
import type { CustomStat } from '../types';
import {
  addPageWithCategory,
  getCategoryItems,
  mockSavedQueries,
  mockStatsRequests,
  openChooseStatisticsDialog,
  renderEmptyStatsPage,
  type User,
} from './statsPageTestUtils';

jest.mock('../../QueryBuilder/Wrapped', () => {
  const React = jest.requireActual('react');
  return {
    QueryBuilder: ({
      onChange: handleChange,
    }: {
      readonly onChange?: (query: {
        readonly fields: RA<unknown>;
        readonly isDistinct: boolean;
      }) => void;
    }) =>
      React.createElement(
        'button',
        {
          type: 'button',
          onClick: () =>
            handleChange?.({
              fields: jest
                .requireActual('../hooks')
                .makeSerializedFieldsFromPaths('Locality', [
                  { path: 'localityName' },
                ]),
              isDistinct: false,
            }),
        },
        'Add a field'
      ),
  };
});

requireContext();
mockStatsRequests();
mockSavedQueries();

async function openNewQueryDialog(user: User): Promise<HTMLElement> {
  await addPageWithCategory(user);
  const chooseDialog = await openChooseStatisticsDialog(user);
  await user.click(
    within(chooseDialog).getByRole('button', { name: commonText.new() })
  );
  const tablesDialog = screen.getByRole('dialog', {
    name: queryText.newQueryName(),
  });
  await user.click(
    within(tablesDialog).getByRole('button', {
      name: new RegExp(`${tables.Locality.label}$`, 'u'),
    })
  );
  return screen.getByRole('dialog', { name: queryText.newQueryName() });
}

describe('Creating a new statistic', () => {
  test('Save is disabled until the query has a field', async () => {
    const { user } = await renderEmptyStatsPage();
    const dialog = await openNewQueryDialog(user);
    const save = within(dialog).getByRole('button', {
      name: commonText.save(),
    });

    expect(save).toBeDisabled();
    await user.click(
      within(dialog).getByRole('button', { name: 'Add a field' })
    );
    expect(save).toBeEnabled();
  });

  test('saving adds the query as a new statistic in the category', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    const dialog = await openNewQueryDialog(user);
    await user.click(
      within(dialog).getByRole('button', { name: 'Add a field' })
    );
    await user.click(
      within(dialog).getByRole('button', { name: commonText.save() })
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const items = getCategoryItems(getSharedLayout);
    expect(items).toHaveLength(1);
    const stat = items[0] as CustomStat;
    expect(stat).toMatchObject({
      type: 'CustomStat',
      label: queryText.newQueryName(),
      querySpec: { tableName: 'Locality' },
    });
    expect(stat.querySpec.fields.map(({ path }) => path)).toEqual([
      'localityName',
    ]);
    await waitFor(() =>
      expect(getCategoryItems(getSharedLayout)[0].itemValue).toBeDefined()
    );
  });

  test('closing the query dialog does not add a statistic', async () => {
    const { user, getSharedLayout } = await renderEmptyStatsPage();
    const dialog = await openNewQueryDialog(user);
    await user.click(
      within(dialog).getByRole('button', { name: 'Add a field' })
    );
    await user.click(
      within(dialog).getByRole('button', { name: commonText.close() })
    );

    expect(getCategoryItems(getSharedLayout)).toEqual([]);
  });
});
