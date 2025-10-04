/**
 * Definitions for Collection preferences
 */
import type { LocalizedString } from 'typesafe-i18n';

import { attachmentsText } from '../../localization/attachments';
import { preferencesText } from '../../localization/preferences';
import { queryText } from '../../localization/query';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { statsText } from '../../localization/stats';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { ensure, localized } from '../../utils/types';
import type { StatLayout } from '../Statistics/types';
import type { GenericPreferences } from './types';
import { definePref } from './types';

export const collectionPreferenceDefinitions = {
  general: {
    title: preferencesText.general(),
    subCategories: {
      pickLists: {
        title: preferencesText.filterPickLists?.() ?? (localized('Pick lists') as LocalizedString),
        items: {
          sp7_scope_table_picklists: definePref<boolean>({
            title: localized('Scope “Entire Table” picklists'),
            description: localized(
              'Restrict “Entire Table” picklists to values used by records in this collection.'
            ),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
      attachments: {
        title: attachmentsText.attachments(),
        items: {
          'attachment.is_public_default': definePref<boolean>({
            title: localized('New attachments are public'),
            description: localized(
              'Set the default visibility for attachments created within this collection.'
            ),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },

  treeManagement: {
    title: localized('Tree management'),
    subCategories: {
      synonymized: {
        title: localized('Synonymized nodes'),
        description: localized(
          'Allow creating children under synonymized nodes in specific trees.'
        ),
        items: {
          'sp7.allow_adding_child_to_synonymized_parent.GeologicTimePeriod':
            definePref<boolean>({
              title: localized(
                'Allow children under synonymized Geologic Time Period nodes'
              ),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.Taxon': definePref<boolean>({
            title: localized('Allow children under synonymized Taxon nodes'),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
          'sp7.allow_adding_child_to_synonymized_parent.Geography':
            definePref<boolean>({
              title: localized(
                'Allow children under synonymized Geography nodes'
              ),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.LithoStrat':
            definePref<boolean>({
              title: localized(
                'Allow children under synonymized Lithostratigraphy nodes'
              ),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.Storage':
            definePref<boolean>({
              title: localized('Allow children under synonymized Storage nodes'),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.TectonicUnit':
            definePref<boolean>({
              title: localized(
                'Allow children under synonymized Tectonic Unit nodes'
              ),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
        },
      },
    },
  },
  statistics: {
    title: statsText.statistics(),
    subCategories: {
      appearance: {
        title: preferencesText.appearance(),
        items: {
          layout: definePref<RA<StatLayout> | undefined>({
            title: localized('_Defines the layout of the stats page'),
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: f.never,
            container: 'label',
          }),
          showPreparationsTotal: definePref<boolean>({
            title: localized('Show preparation totals'),
            description: localized(
              'Include an overall total across preparation types on the statistics page.'
            ),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          refreshRate: definePref<number>({
            title: localized('Auto-refresh rate (hours)'),
            description: localized(
              'Specify how frequently shared statistics refresh their data.'
            ),
            requiresReload: false,
            visible: true,
            defaultValue: 24,
            type: 'java.lang.Integer',
          }),
        },
      },
    },
  },
  specifyNetwork: {
    title: specifyNetworkText.specifyNetwork(),
    subCategories: {
      gbif: {
        title: localized('GBIF'),
        items: {
          publishingOrganization: definePref<string | undefined>({
            title: localized('Publishing organization key'),
            requiresReload: false,
            visible: true,
            defaultValue: undefined,
            type: 'java.lang.String',
          }),
          collectionKey: definePref<string | undefined>({
            title: localized('Collection key'),
            requiresReload: false,
            visible: true,
            defaultValue: undefined,
            type: 'java.lang.String',
          }),
        },
      },
    },
  },

  catalogNumberInheritance: {
    title: queryText.catalogNumberInheritance(),
    description: localized(
      'Configure whether sibling Collection Objects inherit catalog numbers from the primary record.'
    ),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          inheritance: definePref<boolean>({
            title: preferencesText.inheritanceCatNumberPref(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  catalogNumberParentInheritance: {
    title: queryText.catalogNumberParentCOInheritance(),
    description: localized(
      'Control whether component records inherit catalog numbers from their parent Collection Object.'
    ),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          inheritance: definePref<boolean>({
            title: preferencesText.inheritanceCatNumberParentCOPref(),
            requiresReload: false,
            visible: true,
            defaultValue: false,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
  uniqueCatalogNumberAccrossComponentAndCO: {
    title: queryText.uniqueCatalogNumberAcrossComponentAndCo(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          uniqueness: definePref<boolean>({
            title: preferencesText.uniqueCatNumberAcrossCompAndCo(),
            requiresReload: false,
            visible: false,
            defaultValue: false,
            renderer: f.never,
            container: 'label',
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
} as const;

ensure<GenericPreferences>()(collectionPreferenceDefinitions);
