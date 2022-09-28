import { commonText } from '../../localization/common';
import type { RR } from '../../utils/types';
import { filterArray } from '../../utils/types';
import { icons } from '../Atoms/Icons';
import {
  attachmentsAvailable,
  attachmentSettingsPromise,
} from '../Attachments/attachments';
import type { MenuItem } from '../Core/Main';
import { schema } from '../DataModel/schema';
import { getDisciplineTrees } from '../InitialContext/treeRanks';
import {
  fetchContext as fetchPermissions,
  getTablePermissions,
} from '../Permissions';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
  hasTreeAccess,
} from '../Permissions/helpers';
import { reportsAvailable } from '../Reports';
import { filterUserTools } from './userToolDefinitions';

export type MenuItemName =
  | 'attachments'
  | 'dataEntry'
  | 'interactions'
  | 'queries'
  | 'recordSets'
  | 'reports'
  | 'statistics'
  | 'trees'
  | 'workBench';

const rawMenuItems: RR<MenuItemName, MenuItem> = {
  dataEntry: {
    url: '/specify/overlay/data-entry/',
    title: commonText('dataEntry'),
    icon: icons.pencilAt,
    visibilityKey: 'showDataEntry',
    enabled: () =>
      // Show DataEntry only if has "create" permission to at least one table
      Object.values(
        getTablePermissions()[schema.domainLevelIds.collection]
      ).some(({ create }) => create),
  },
  trees: {
    url: '/specify/overlay/trees/',
    title: commonText('trees'),
    icon: icons.tree,
    visibilityKey: 'showTrees',
    enabled: () =>
      getDisciplineTrees().some((treeName) => hasTreeAccess(treeName, 'read')),
  },
  interactions: {
    url: '/specify/overlay/interactions/',
    title: commonText('interactions'),
    icon: icons.chat,
    visibilityKey: 'showInteractions',
    enabled: () =>
      // Show DataEntry only if has "create" permission to at least one table
      Object.values(
        getTablePermissions()[schema.domainLevelIds.collection]
      ).some(({ create }) => create) && hasToolPermission('recordSets', 'read'),
  },
  queries: {
    url: '/specify/overlay/queries/',
    title: commonText('queries'),
    icon: icons.documentSearch,
    visibilityKey: 'showQueries',
    enabled: () =>
      hasToolPermission('queryBuilder', 'read') ||
      hasPermission('/querybuilder/query', 'execute'),
  },
  recordSets: {
    url: '/specify/overlay/record-sets/',
    title: commonText('recordSets'),
    icon: icons.collection,
    visibilityKey: 'showRecordSets',
    enabled: () => hasToolPermission('recordSets', 'read'),
  },
  reports: {
    url: '/specify/overlay/reports/',
    title: commonText('reports'),
    icon: icons.documentReport,
    visibilityKey: 'showReports',
    enabled: async () =>
      hasPermission('/report', 'execute') && (await reportsAvailable),
  },
  workBench: {
    url: '/specify/overlay/data-sets/',
    title: commonText('workBench'),
    icon: icons.table,
    visibilityKey: 'showWorkBench',
  },
  attachments: {
    url: '/specify/attachments/',
    title: commonText('attachments'),
    icon: icons.link,
    visibilityKey: 'showAttachments',
    async enabled(): Promise<boolean> {
      if (!hasTablePermission('Attachment', 'read')) return false;
      await attachmentSettingsPromise;
      return attachmentsAvailable();
    },
  },
  statistics: {
    url: '/specify/statistics/',
    title: commonText('statistics'),
    icon: icons.link,
    visibilityKey: 'showStatistics'
  }
} as const;

export const menuItemsPromise = fetchPermissions
  .then(async () =>
    filterUserTools(
      Object.entries(rawMenuItems).map(([name, entry]) => ({
        ...entry,
        name,
      }))
    )
  )
  .then((entries) =>
    Object.fromEntries(
      filterArray(entries).map(({ name, ...entry }) => [name, entry])
    )
  );
