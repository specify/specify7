import { preferencesText } from '../../localization/preferences';
import { queryText } from '../../localization/query';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { statsText } from '../../localization/stats';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { ensure } from '../../utils/types';
import type { QueryView } from '../QueryBuilder/Header';
import type { StatLayout } from '../Statistics/types';
import type { GenericPreferences } from './types';
import { defineItem } from './types';

export const collectionPreferenceDefinitions = {
  statistics: {
    title: statsText.statistics(),
    subCategories: {
      appearance: {
        title: preferencesText.appearance(),
        items: {
          layout: defineItem<RA<StatLayout> | undefined>({
            title: 'Defines the layout of the stats page',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: f.never,
            container: 'label',
          }),
          showTotal: defineItem<boolean>({
            title: 'Defines if preparation stats include total',
            requiresReload: false,
            visible: false,
            defaultValue: false,
            renderer: f.never,
            container: 'label',
            type: 'java.lang.Boolean',
          }),
          refreshRate: defineItem<number>({
            title: 'Defines the rate of auto refresh in hours',
            requiresReload: false,
            visible: false,
            defaultValue: 24,
            renderer: f.never,
            container: 'label',
            type: 'java.lang.Float',
          }),
        },
      },
      specifyNetwork: {
        title: specifyNetworkText.specifyNetwork(),
        items: {
          publishingOrganization: defineItem<string | undefined>({
            title: 'Stores GBIF\'s "publishingOrgKey"',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: f.never,
            container: 'label',
          }),
          collectionKey: defineItem<string | undefined>({
            title: 'Stores GBIF\'s "dataSetKey"',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: f.never,
            container: 'label',
          }),
        },
      },
    },
  },
  queryBuilder: {
    title: queryText.queryBuilder(),
    subCategories: {
      appearance: {
        title: preferencesText.appearance(),
        items: {
          display: defineItem<QueryView>({
            title: preferencesText.displayBasicView(),
            requiresReload: false,
            visible: false,
            defaultValue: {
              basicView: [],
              detailedView: [],
            },
            renderer: f.never,
            container: 'div',
          }),
        },
      },
    },
  },
} as const;

ensure<GenericPreferences>()(collectionPreferenceDefinitions);
