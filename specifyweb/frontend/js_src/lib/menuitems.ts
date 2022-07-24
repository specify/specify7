import { attachmentsAvailable, attachmentSettingsPromise } from './attachments';
import { icons } from './components/icons';
import type { MenuItem } from './components/main';
import { reportsAvailable } from './components/reports';
import { commonText } from './localization/common';
import {
  fetchContext as fetchPermissions,
  getTablePermissions,
} from './permissions';
import {
  hasPermission,
  hasTablePermission,
  hasToolPermission,
  hasTreeAccess,
} from './permissionutils';
import { schema } from './schema';
import { getDisciplineTrees } from './treedefinitions';
import type { RR } from './types';
import { filterArray } from './types';
import { filterUserTools } from './usertools';

export type MenuItemName =
  | 'attachments'
  | 'dataEntry'
  | 'interactions'
  | 'queries'
  | 'recordSets'
  | 'reports'
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
