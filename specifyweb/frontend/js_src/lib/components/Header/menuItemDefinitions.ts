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
import { getCache } from '../../utils/cache';
import { headerText } from '../../localization/header';

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
    title: headerText('dataEntry'),
    icon: icons.pencilAt,
    visibilityKey: 'showDataEntry',
    enabled: () =>
      getCache('forms', 'readOnlyMode') !== true &&
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
      getCache('forms', 'readOnlyMode') !== true &&
      hasToolPermission('recordSets', 'read') &&
      // Show DataEntry only if has "create" permission to at least one table
      Object.values(
        getTablePermissions()[schema.domainLevelIds.collection]
      ).some(({ create }) => create),
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
    icon: icons.photos,
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
