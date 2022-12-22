import { commonText } from '../../localization/common';
import { preferencesText } from '../../localization/preferences';
import { StatLayout } from '../Statistics/types';
import { error } from '../Errors/assert';
import React from 'react';
import { defineItem } from './Definitions';

export const collectionPreferenceDefinitions = {
  statistics: {
    title: commonText('statistics'),
    subCategories: {
      appearance: {
        title: preferencesText('appearance'),
        items: {
          layout: defineItem<StatLayout | undefined>({
            title: 'Defines the layout of the stats page',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: () => <>{error('This should not get called')}</>,
          }),
          defaultLayout: defineItem<StatLayout | undefined>({
            title: 'Defines the layout of the default stats',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: () => <>{error('This should not get called')}</>,
          }),
          lastUpdated: defineItem<string | undefined>({
            title: 'Defines last cached date and time',
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: () => <>{error('This should not get called')}</>,
          }),
        },
      },
    },
  },
};
