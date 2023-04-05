import React from 'react';

import { preferencesText } from '../../localization/preferences';
import { statsText } from '../../localization/stats';
import type { RA } from '../../utils/types';
import { ensure } from '../../utils/types';
import { error } from '../Errors/assert';
import type { StatLayout } from '../Statistics/types';
import type { GenericPreferences } from './UserDefinitions';
import { defineItem } from './UserDefinitions';

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
            renderer: () => <>{error('This should not get called')}</>,
            container: 'label',
          }),
          showTotal: defineItem<boolean>({
            title: 'Defines if preparation stats include total',
            requiresReload: false,
            visible: false,
            defaultValue: false,
            renderer: () => <>{error('This should not get called')}</>,
            container: 'label',
            type: 'java.lang.Boolean',
          }),
          refreshRate: defineItem<number>({
            title: 'Defines the rate of auto refresh in hours',
            requiresReload: false,
            visible: false,
            defaultValue: 24,
            renderer: () => <>{error('This should not get called')}</>,
            container: 'label',
            type: 'java.lang.Float',
          }),
        },
      },
    },
  },
} as const;

ensure<GenericPreferences>()(collectionPreferenceDefinitions);
