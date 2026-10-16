/**
 * Shared setup for tests that render the whole StatsPage.
 *
 * Not a test file itself (doesn't match Jest's testMatch).
 */

import { waitFor } from '@testing-library/react';
import React from 'react';

import { overrideAjax } from '../../../tests/ajax';
import { mount } from '../../../tests/reactUtils';
import { f } from '../../../utils/functools';
import type { RA } from '../../../utils/types';
import { SetMenuContext } from '../../Header/MenuContext';
import { BasePreferences } from '../../Preferences/BasePreferences';
import { collectionPreferenceDefinitions } from '../../Preferences/CollectionDefinitions';
import { collectionPreferences } from '../../Preferences/collectionPreferences';
import { userPreferenceDefinitions } from '../../Preferences/UserDefinitions';
import { userPreferences } from '../../Preferences/userPreferences';
import { UnloadProtectsContext } from '../../Router/UnloadProtect';
import {
  getBackendUrlToFetch,
  getDynamicQuerySpecsToFetch,
  resolveStatsSpec,
} from '../hooks';
import { StatsPage } from '../index';
import { defaultLayoutGenerated } from '../StatsSpec';
import type { CustomStat, DefaultStat, StatLayout } from '../types';

const preparationsUrl = '/stats/collection/preparations/';

/**
 * Mock every endpoint the default layout hits. Call once at the top level of
 * a test file (it registers beforeAll/afterAll hooks).
 */
export function mockStatsRequests(): void {
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

  /*
   * The same endpoint serves count queries (QueryStat items) and the distinct
   * value queries that populate dynamic categories (e.g., type specimens)
   */
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
}

/** Fresh, empty preferences that never sync to the back-end */
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

/**
 * Wait until the default shared page has finished loading, so that no state
 * updates happen after the test's assertions
 */
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

/**
 * Render StatsPage as if statistics had never been used, and wait for the
 * initial load of the default shared page to finish
 */
export async function renderEmptyStatsPage() {
  const collection = makeEmptyPreferences(collectionPreferenceDefinitions);
  const user = makeEmptyPreferences(userPreferenceDefinitions);

  const result = mount(
    <SetMenuContext.Provider value={f.void}>
      <UnloadProtectsContext.Provider value={[]}>
        <collectionPreferences.Context.Provider value={collection as never}>
          <userPreferences.Context.Provider value={user as never}>
            <StatsPage />
          </userPreferences.Context.Provider>
        </collectionPreferences.Context.Provider>
      </UnloadProtectsContext.Provider>
    </SetMenuContext.Provider>
  );
  const getSharedLayout = () => getLayout(collection);
  return {
    ...result,
    sharedLayout: await waitForInitialLoad(getSharedLayout),
    getSharedLayout,
    getPersonalLayout: () => getLayout(user),
  };
}
