import { screen, waitFor } from '@testing-library/react';
import React from 'react';
import { statsText } from '../../../localization/stats';
import { overrideAjax } from '../../../tests/ajax';
import { requireContext } from '../../../tests/helpers';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import type { RA } from '../../../utils/types';
import { SetMenuContext } from '../../Header/MenuContext';
import { BasePreferences } from '../../Preferences/BasePreferences';
import { collectionPreferenceDefinitions } from '../../Preferences/CollectionDefinitions';
import { collectionPreferences } from '../../Preferences/collectionPreferences';
import { userPreferenceDefinitions } from '../../Preferences/UserDefinitions';
import { userPreferences } from '../../Preferences/userPreferences';
import {
  getBackendUrlToFetch,
  getDynamicQuerySpecsToFetch,
  resolveStatsSpec,
} from '../hooks';
import { StatsPage } from '../index';
import { defaultLayoutGenerated } from '../StatsSpec';
import type { CustomStat, DefaultStat, StatLayout } from '../types';

requireContext();

const preparationsUrl = '/stats/collection/preparations/';

const backendUrls = Array.from(
  new Set([
    ...getBackendUrlToFetch(defaultLayoutGenerated),
    ...defaultLayoutGenerated
      .flatMap(({ categories }) => categories.flatMap(({ items }) => items))
      .map((item) =>
        item.type === 'DefaultStat' && item.itemType === 'BackEndStat'
          ? resolveStatsSpec(item, { showPreparationsTotal: true })
          : undefined
      )
      .map((spec) =>
        spec?.type === 'BackEndStat' ? spec.fetchUrl : undefined
      )
      .filter((url): url is string => url !== undefined),
  ])
);

backendUrls.forEach((url) =>
  overrideAjax(
    url,
    url === preparationsUrl
      ? {
          'C&S': { lots: 826, total: 430 },
          EtOH: { lots: 176, total: 985 },
        }
      : {}
  )
);

overrideAjax(
  '/stored_query/ephemeral/',
  {
    count: 7,
    results: [
      [1, 'Holotype'],
      [2, 'Neotype'],
    ],
  },
  { method: 'POST' }
);

const makeEmptyPreferences = <DEFINITIONS extends object>(
  definitions: DEFINITIONS
) =>
  new BasePreferences({
    definitions: definitions as never,
    values: { resourceName: 'Test', fetchUrl: '/context/test/' },
    defaultValues: undefined,
    developmentGlobal: '_testPreferences',
    syncChanges: false,
  });

const getLayout = (
  preferences: ReturnType<typeof makeEmptyPreferences>
): RA<StatLayout> | undefined =>
  preferences.get(
    'statistics' as never,
    'appearance' as never,
    'layout' as never
  );

const isQueryStat = (item: CustomStat | DefaultStat): boolean =>
  item.type === 'CustomStat' || item.itemType === 'QueryStat';

async function waitForInitialLoad(
  getSharedLayout: () => RA<StatLayout> | undefined
): Promise<RA<StatLayout>> {
  await waitFor(() => {
    const layout = getSharedLayout();
    expect(layout).toBeDefined();
    expect(layout![0].lastUpdated).toBeDefined();
    expect(getBackendUrlToFetch(layout!)).toEqual([]);
    expect(getDynamicQuerySpecsToFetch(layout!)).toEqual([]);
    layout![0].categories
      .flatMap(({ items }) => items)
      .filter(isQueryStat)
      .forEach((item) => expect(item.itemValue).toBeDefined());
  });
  return getSharedLayout()!;
}

async function renderEmptyStatsPage() {
  const collection = makeEmptyPreferences(collectionPreferenceDefinitions);
  const user = makeEmptyPreferences(userPreferenceDefinitions);

  const result = mount(
    <SetMenuContext.Provider value={f.void}>
      <collectionPreferences.Context.Provider value={collection as never}>
        <userPreferences.Context.Provider value={user as never}>
          <StatsPage />
        </userPreferences.Context.Provider>
      </collectionPreferences.Context.Provider>
    </SetMenuContext.Provider>
  );
  const getSharedLayout = () => getLayout(collection);
  const sharedLayout = await waitForInitialLoad(getSharedLayout);
  return {
    ...result,
    sharedLayout,
    personalLayout: getLayout(user),
  };
}

const findCategory = (layout: RA<StatLayout>, label: string) =>
  layout[0].categories.find((category) => category.label === label);

describe('Statistics initial load with no saved layout', () => {
  test('starts with no layout preference', () => {
    expect(
      getLayout(makeEmptyPreferences(collectionPreferenceDefinitions))
    ).toBeUndefined();
    expect(
      getLayout(makeEmptyPreferences(userPreferenceDefinitions))
    ).toBeUndefined();
  });

  test('saves the default shared page to collection preferences', async () => {
    const { sharedLayout } = await renderEmptyStatsPage();
    expect(sharedLayout).toHaveLength(1);
    expect(sharedLayout[0].label).toBe(defaultLayoutGenerated[0].label);
    expect(sharedLayout[0].categories.map(({ label }) => label)).toEqual(
      defaultLayoutGenerated[0].categories.map(({ label }) => label)
    );
  });

  test('saves the default personal page to user preferences without loading it', async () => {
    const { personalLayout } = await renderEmptyStatsPage();
    expect(personalLayout).toEqual([defaultLayoutGenerated[1]]);
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

  test('loads a value for every query stat on the shared page', async () => {
    const { sharedLayout } = await renderEmptyStatsPage();
    const queryStats = sharedLayout[0].categories
      .flatMap(({ items }) => items)
      .filter(isQueryStat);
    expect(queryStats.length).toBeGreaterThan(0);
    queryStats.forEach((item) => expect(item.itemValue).toBeDefined());
  });
});
