import { LocalizedString } from 'typesafe-i18n';
import { attachmentsText } from '../../localization/attachments';
import { preferencesText } from '../../localization/preferences';
import { queryText } from '../../localization/query';
import { specifyNetworkText } from '../../localization/specifyNetwork';
import { statsText } from '../../localization/stats';
import { treeText } from '../../localization/tree';
import { f } from '../../utils/functools';
import type { RA } from '../../utils/types';
import { ensure } from '../../utils/types';
import { genericTables } from '../DataModel/tables';
import { Tables } from '../DataModel/types';
import type { StatLayout } from '../Statistics/types';
import type { GenericPreferences } from './types';
import { definePref } from './types';
import { camelToHuman } from '../../utils/utils';

const tableLabel = (tableName: keyof Tables): LocalizedString =>
  genericTables[tableName]?.label ?? camelToHuman(tableName);

export const collectionPreferenceDefinitions = {
  general: {
    title: preferencesText.general(),
    subCategories: {
      pickLists: {
        title: preferencesText.filterPickLists(),
        items: {
          sp7_scope_table_picklists: definePref<boolean>({
            title: preferencesText.scopeEntireTablePicklists(),
            description: preferencesText.scopeEntireTablePicklistsDescription(),
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
            title: attachmentsText.publicDefault(),
            description: attachmentsText.publicDefaultDescription(),
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
    title: treeText.treeManagement(),
    subCategories: {
      synonymized: {
        title: treeText.synonymizedNodes(),
        description: treeText.synonymizedNodesDescription(),
        items: {
          'sp7.allow_adding_child_to_synonymized_parent.Taxon':
            definePref<boolean>({
              title: () => tableLabel('Taxon'),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.Geography':
            definePref<boolean>({
              title: () => tableLabel('Geography'),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.Storage':
            definePref<boolean>({
              title: () => tableLabel('Storage'),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.GeologicTimePeriod':
            definePref<boolean>({
              title: () => tableLabel('GeologicTimePeriod'),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.LithoStrat':
            definePref<boolean>({
              title: () => tableLabel('LithoStrat'),
              requiresReload: false,
              visible: true,
              defaultValue: false,
              type: 'java.lang.Boolean',
            }),
          'sp7.allow_adding_child_to_synonymized_parent.TectonicUnit':
            definePref<boolean>({
              title: () => tableLabel('TectonicUnit'),
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
            title: statsText.layoutPreference(),
            requiresReload: false,
            visible: false,
            defaultValue: undefined,
            renderer: f.never,
            container: 'label',
          }),
          showPreparationsTotal: definePref<boolean>({
            title: statsText.showPreparationsTotal(),
            description: statsText.showPreparationsTotalDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
          refreshRate: definePref<number>({
            title: statsText.autoRefreshRate(),
            description: statsText.autoRefreshRateDescription(),
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
      general: {
        title: preferencesText.general(),
        items: {
          publishingOrganization: definePref<string | undefined>({
            title: specifyNetworkText.publishingOrganizationKey(),
            description:
              specifyNetworkText.publishingOrganizationKeyDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: undefined,
            type: 'java.lang.String',
          }),
          collectionKey: definePref<string | undefined>({
            title: specifyNetworkText.collectionKey(),
            description: specifyNetworkText.collectionKeyDescription(),
            requiresReload: false,
            visible: true,
            defaultValue: undefined,
            type: 'java.lang.String',
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
          display: definePref<{
            readonly basicView: RA<number>;
            readonly detailedView: RA<number>;
          }>({
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
  catalogNumberInheritance: {
    title: queryText.catalogNumberInheritance(),
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          inheritance: definePref<boolean>({
            title: preferencesText.inheritanceCatNumberPref(),
            description: () =>
              preferencesText.inheritanceCatNumberPrefDescription(),
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
    subCategories: {
      behavior: {
        title: preferencesText.behavior(),
        items: {
          inheritance: definePref<boolean>({
            title: preferencesText.inheritanceCatNumberParentCOPref(),
            description: () =>
              preferencesText.inheritanceCatNumberParentCOPrefDescription(),
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
            defaultValue: true,
            type: 'java.lang.Boolean',
          }),
        },
      },
    },
  },
} as const;

ensure<GenericPreferences>()(collectionPreferenceDefinitions);
