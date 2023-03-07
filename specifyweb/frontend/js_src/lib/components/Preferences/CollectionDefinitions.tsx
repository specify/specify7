import React from 'react';

import { preferencesText } from '../../localization/preferences';
import { statsText } from '../../localization/stats';
import type { RA } from '../../utils/types';
import { ensure } from '../../utils/types';
import { error } from '../Errors/assert';
import type { StatLayout } from '../Statistics/types';
import type { GenericPreferences } from './UserDefinitions';
import { definePref } from './UserDefinitions';

export const collectionPreferenceDefinitions = {
  statistics: {
    title: statsText.statistics(),
    subCategories: {
      appearance: {
        title: preferencesText.appearance(),
        items: {
          layout: definePref<RA<StatLayout> | undefined>({
            title: 'Defines the layout of the stats page',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: () => <>{error('This should not get called')}</>,
            container: 'label',
          }),
          refreshStatsPeriod: definePref<number | undefined>({
            title: preferencesText.refreshStatsPeriod(),
            requiresReload: false,
            setOnBlurOnly: true,
            visible: true,
            defaultValue: 24,
            type: 'java.lang.Double',
            parser: {
              min: 0,
              max: 5000,
            },
          }),
        },
      },
    },
  },
} as const;

ensure<GenericPreferences>()(collectionPreferenceDefinitions);
