import { screen } from '@testing-library/react';
import { statsText } from '../../../localization/stats';
import { requireContext } from '../../../tests/helpers';
import type { RA } from '../../../utils/types';
import { defaultLayoutGenerated } from '../StatsSpec';
import type { StatLayout } from '../types';
import { mockStatsRequests, renderEmptyStatsPage } from './statsPageTestUtils';
requireContext();
mockStatsRequests();

const findCategory = (layout: RA<StatLayout>, label: string) =>
  layout[0].categories.find((category) => category.label === label);

describe('Statistics initial load with no saved layout', () => {
  test('saves the default shared page to collection preferences', async () => {
    const { sharedLayout } = await renderEmptyStatsPage();
    expect(sharedLayout).toHaveLength(1);
    expect(sharedLayout[0].label).toBe(defaultLayoutGenerated[0].label);
    expect(sharedLayout[0].categories.map(({ label }) => label)).toEqual(
      defaultLayoutGenerated[0].categories.map(({ label }) => label)
    );
  });

  test('saves the default personal page to user preferences without loading it', async () => {
    const { getPersonalLayout } = await renderEmptyStatsPage();
    expect(getPersonalLayout()).toEqual([defaultLayoutGenerated[1]]);
  });

  test('marks the active page as refreshed', async () => {
    const { sharedLayout } = await renderEmptyStatsPage();
    expect(
      Number.isNaN(new Date(sharedLayout[0].lastUpdated!).valueOf())
    ).toBe(false);
    expect(
      screen.getByText(statsText.lastRefreshed(), { exact: false })
    ).toBeInTheDocument();
  });

  test('renders the Shared and Private sections with their default pages', async () => {
    await renderEmptyStatsPage();
    expect(
      screen.getByRole('heading', { name: statsText.shared() })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: statsText.private() })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: defaultLayoutGenerated[0].label })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: defaultLayoutGenerated[1].label })
    ).toBeInTheDocument();
  });

  test('renders every default category of the shared page', async () => {
    await renderEmptyStatsPage();
    defaultLayoutGenerated[0].categories.forEach(({ label }) =>
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument()
    );
  });

  test('fills backend categories from the backend response', async () => {
    const { sharedLayout } = await renderEmptyStatsPage();
    const preparations = findCategory(
      sharedLayout,
      defaultLayoutGenerated[0].categories[1].label
    );
    expect(
      preparations?.items.map(({ label, itemValue }) => [label, itemValue])
    ).toEqual([
      ['C&S', '826 / 430'],
      ['EtOH', '176 / 985'],
    ]);
    expect(screen.getByText('C&S')).toBeInTheDocument();
    expect(screen.getByText('826 / 430')).toBeInTheDocument();
  });

  test('fills backend percentage stats from the backend response', async () => {
    const { sharedLayout } = await renderEmptyStatsPage();
    const values = Object.fromEntries(
      sharedLayout[0].categories
        .flatMap(({ items }) => items)
        .map((item) => [item.label, item.itemValue])
    );
    expect(values[statsText.percentGeoReferenced()]).toBe('42%');
    expect(values[statsText.percentImaged()]).toBe('17%');
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('17%')).toBeInTheDocument();
  });

  test('fills dynamic categories from the query results', async () => {
    const { sharedLayout } = await renderEmptyStatsPage();
    const typeSpecimens = findCategory(
      sharedLayout,
      statsText.typeSpecimens()
    );
    expect(typeSpecimens?.items.map(({ label }) => label)).toEqual([
      'Holotype',
      'Neotype',
    ]);
    typeSpecimens?.items.forEach((item) =>
      expect(item.itemValue).toBeDefined()
    );
  });
});
