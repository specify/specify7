/**
 * Definitions for all menu items and user tools
 */

import { attachmentsText } from '../../localization/attachments';
import { commonText } from '../../localization/common';
import { headerText } from '../../localization/header';
import { interactionsText } from '../../localization/interactions';
import { queryText } from '../../localization/query';
import { reportsText } from '../../localization/report';
import { statsText } from '../../localization/stats';
import { treeText } from '../../localization/tree';
import { wbText } from '../../localization/workbench';
import { getCache } from '../../utils/cache';
import type { IR } from '../../utils/types';
import { ensure } from '../../utils/types';
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
import { filterMenuItems } from './menuItemProcessing';

const rawMenuItems = ensure<IR<Omit<MenuItem, 'name'>>>()({
  dataEntry: {
    url: '/specify/overlay/data-entry/',
    title: headerText.dataEntry(),
    icon: icons.pencilAt,
    enabled: () =>
      getCache('forms', 'readOnlyMode') !== true &&
      // Show DataEntry only if has "create" permission to at least one table
      Object.values(
        getTablePermissions()[schema.domainLevelIds.collection]
      ).some(({ create }) => create),
  },
  trees: {
    url: '/specify/overlay/trees/',
    title: treeText.trees(),
    icon: icons.tree,
    enabled: () =>
      getDisciplineTrees().some((treeName) => hasTreeAccess(treeName, 'read')),
  },
  interactions: {
    url: '/specify/overlay/interactions/',
    title: interactionsText.interactions(),
    icon: icons.chat,
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
    title: queryText.queries(),
    icon: icons.documentSearch,
    enabled: () =>
      hasToolPermission('queryBuilder', 'read') ||
      hasPermission('/querybuilder/query', 'execute'),
  },
  recordSets: {
    url: '/specify/overlay/record-sets/',
    title: commonText.recordSets(),
    icon: icons.collection,
    enabled: () => hasToolPermission('recordSets', 'read'),
  },
  reports: {
    url: '/specify/overlay/reports/',
    title: reportsText.reports(),
    icon: icons.documentReport,
    enabled: async () =>
      hasPermission('/report', 'execute') && (await reportsAvailable),
  },
  workBench: {
    url: '/specify/overlay/data-sets/',
    title: wbText.workBench(),
    icon: icons.table,
  },
  attachments: {
    url: '/specify/attachments/',
    title: attachmentsText.attachments(),
    icon: icons.photos,
    async enabled(): Promise<boolean> {
      if (!hasTablePermission('Attachment', 'read')) return false;
      await attachmentSettingsPromise;
      return attachmentsAvailable();
    },
  },
  statistics: {
    url: '/specify/stats',
    title: statsText.statistics(),
    icon: icons.chartBar,
    enabled: () => hasPermission('/querybuilder/query', 'execute'),
  },
} as const);

export type MenuItemName = keyof typeof rawMenuItems | 'search';

/**
 * Don't use this directly. Use useMenuItems() instead
 */
export const rawMenuItemsPromise = fetchPermissions.then(async () =>
  filterMenuItems(rawMenuItems)
);
